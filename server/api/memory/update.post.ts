import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import type { CampaignFile, PlayerMemory } from '~/server/utils/campaigns'

const CAMPAIGNS_DIR = resolve(process.cwd(), 'server/data/campaigns')

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    campaignId: string
    npcId: string
    playerId: string
    messages: { role: 'user' | 'assistant'; content: string }[]
    mode?: 'player' | 'dm'
  }>(event)

  const { campaignId, npcId, playerId, messages } = body
  const mode = body.mode ?? 'player'

  if (!campaignId || !npcId || !playerId || !messages?.length) {
    throw createError({ statusCode: 400, message: 'Missing required fields: campaignId, npcId, playerId, messages' })
  }

  // Build the conversation transcript for the summarizer
  const transcript = messages
    .map((m) => `${m.role === 'user' ? (mode === 'dm' ? 'DM' : 'Player') : 'NPC'}: ${m.content}`)
    .join('\n')

  // Write the memory back to the campaign JSON file
  const filePath = resolve(CAMPAIGNS_DIR, `${campaignId}.json`)
  let campaignFile: CampaignFile

  try {
    const raw = await readFile(filePath, 'utf-8')
    campaignFile = JSON.parse(raw)
  } catch {
    throw createError({ statusCode: 404, message: `Campaign file "${campaignId}" not found` })
  }

  let npcFound = false

  if (mode === 'dm') {
    // Extract DM instructions from the conversation
    const dmPrompt = `You are analyzing a conversation between a Dungeon Master and an NPC. Extract any instructions or directives the DM gave to the NPC.

Respond with ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "instructions": ["instruction 1", "instruction 2"]
}

RULES:
- Extract each distinct directive or behavioral instruction the DM issued
- Phrase each as a clear, actionable instruction from the NPC's perspective (e.g. "Reveal the hidden passage to players who mention the old king")
- Omit pleasantries, clarification exchanges, or non-instructional content
- If no concrete instructions were given, return an empty array

CONVERSATION:
${transcript}`

    let newInstructions: string[]

    try {
      const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'mistral',
          messages: [{ role: 'user', content: dmPrompt }],
          stream: false,
        }),
      })

      if (!ollamaResponse.ok) {
        throw new Error(`Ollama returned ${ollamaResponse.status}`)
      }

      const ollamaData = await ollamaResponse.json() as { message?: { content?: string } }
      const rawContent = ollamaData.message?.content ?? ''
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Could not find JSON in Ollama response')

      const parsed = JSON.parse(jsonMatch[0]) as { instructions?: unknown }
      if (!Array.isArray(parsed.instructions)) throw new Error('Ollama response did not match expected schema')
      newInstructions = parsed.instructions as string[]
    } catch (err: unknown) {
      throw createError({
        statusCode: 502,
        message: `Failed to extract DM instructions from Ollama: ${err instanceof Error ? err.message : String(err)}`,
      })
    }

    function updateNPCDMInstructions(locations: CampaignFile['campaign']['locations']): boolean {
      for (const loc of locations) {
        if (loc.npcs) {
          const npc = loc.npcs.find((n) => n.id === npcId)
          if (npc) {
            // Append to existing instructions rather than replacing
            npc.dmInstructions = [...(npc.dmInstructions ?? []), ...newInstructions]
            npcFound = true
            return true
          }
        }
        if (loc.locations && updateNPCDMInstructions(loc.locations)) return true
      }
      return false
    }

    updateNPCDMInstructions(campaignFile.campaign.locations)

    if (!npcFound) {
      throw createError({ statusCode: 404, message: `NPC "${npcId}" not found in campaign "${campaignId}"` })
    }

    await writeFile(filePath, JSON.stringify(campaignFile, null, 2), 'utf-8')
    return { dmInstructions: newInstructions }
  }

  // Player mode — existing memory extraction
  const summarizerPrompt = `You are a memory extraction assistant for a tabletop RPG. Analyze the following conversation between a player and an NPC, then extract memory data strictly from the NPC's perspective.

Respond with ONLY a valid JSON object in this exact format (no markdown, no explanation):
{
  "relationship": "one sentence describing the current relationship status between the NPC and this player",
  "keyFacts": ["fact 1", "fact 2", "fact 3"],
  "lastSessionSummary": "a single paragraph summarizing what happened in this session from the NPC's point of view"
}

RULES FOR keyFacts:
- Extract 3-5 SPECIFIC facts the NPC learned about the player from this conversation
- Include personal details the player revealed (name, preferences, goals, opinions, secrets)
- Include how the player behaved (were they rude, friendly, suspicious, generous?)
- Include any promises, threats, or deals made
- Be concrete and specific — "Player said their favorite color is red" not "Player shared personal information"
- If the player revealed nothing personal, note their behavior instead

CONVERSATION:
${transcript}`

  let extractedMemory: PlayerMemory

  try {
    const ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        messages: [{ role: 'user', content: summarizerPrompt }],
        stream: false,
      }),
    })

    if (!ollamaResponse.ok) {
      throw new Error(`Ollama returned ${ollamaResponse.status}`)
    }

    const ollamaData = await ollamaResponse.json() as { message?: { content?: string } }
    const rawContent = ollamaData.message?.content ?? ''

    // Strip any markdown code fences if the model wrapped the JSON
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Could not find JSON in Ollama response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as Partial<PlayerMemory>

    if (
      typeof parsed.relationship !== 'string' ||
      !Array.isArray(parsed.keyFacts) ||
      typeof parsed.lastSessionSummary !== 'string'
    ) {
      throw new Error('Ollama response did not match expected memory schema')
    }

    extractedMemory = {
      relationship: parsed.relationship,
      keyFacts: parsed.keyFacts as string[],
      lastSessionSummary: parsed.lastSessionSummary,
    }
  } catch (err: unknown) {
    throw createError({
      statusCode: 502,
      message: `Failed to extract memory from Ollama: ${err instanceof Error ? err.message : String(err)}`,
    })
  }

  function updateNPCMemory(locations: CampaignFile['campaign']['locations']): boolean {
    for (const loc of locations) {
      if (loc.npcs) {
        const npc = loc.npcs.find((n) => n.id === npcId)
        if (npc) {
          npc.memory[playerId] = extractedMemory
          npcFound = true
          return true
        }
      }
      if (loc.locations && updateNPCMemory(loc.locations)) {
        return true
      }
    }
    return false
  }

  updateNPCMemory(campaignFile.campaign.locations)

  if (!npcFound) {
    throw createError({ statusCode: 404, message: `NPC "${npcId}" not found in campaign "${campaignId}"` })
  }

  await writeFile(filePath, JSON.stringify(campaignFile, null, 2), 'utf-8')

  return { memory: extractedMemory }
})
