import { sendStream } from 'h3'
import { findNPCWithContext, buildSystemPrompt } from '~/server/utils/campaigns'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    npcId: string
    campaignId: string
    messages: { role: 'user' | 'assistant'; content: string }[]
    playerId?: string
    mode?: 'player' | 'dm'
  }>(event)

  if (!body.campaignId) {
    throw createError({ statusCode: 400, message: 'Missing required field: campaignId' })
  }

  const result = await findNPCWithContext(body.campaignId, body.npcId)
  if (!result) {
    throw createError({ statusCode: 404, message: `NPC "${body.npcId}" not found in campaign "${body.campaignId}"` })
  }

  const mode = body.mode ?? 'player'
  const playerId = body.playerId ?? 'player-default'

  let systemPrompt: string
  if (mode === 'dm') {
    systemPrompt = `The Dungeon Master is speaking to you directly and out of character. You are receiving instructions from the god of your world. Acknowledge directives clearly and specifically — confirm exactly what you will do and when. Ask for clarification if the instruction is ambiguous. Do not roleplay or stay in character during this conversation.

You are ${result.npc.name}, ${result.npc.role}.`
  } else {
    systemPrompt = buildSystemPrompt(result.npc, result.location, result.campaign, playerId)
  }

  let ollamaResponse: Response
  try {
    ollamaResponse = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'mistral',
        messages: [
          { role: 'system', content: systemPrompt },
          ...body.messages,
        ],
        stream: true,
      }),
    })
  } catch {
    throw createError({
      statusCode: 502,
      message: 'Could not reach Ollama. Make sure it is running at http://localhost:11434',
    })
  }

  if (!ollamaResponse.ok || !ollamaResponse.body) {
    throw createError({ statusCode: 502, message: `Ollama returned ${ollamaResponse.status}` })
  }

  setResponseHeaders(event, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
  })

  return sendStream(event, ollamaResponse.body)
})
