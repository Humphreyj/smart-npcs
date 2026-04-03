import { readFile, writeFile } from 'fs/promises'
import { resolve } from 'path'
import type { CampaignFile } from '~/server/utils/campaigns'

const CAMPAIGNS_DIR = resolve(process.cwd(), 'server/data/campaigns')

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    campaignId: string
    npcId: string
    instructionIndex: number
  }>(event)

  const { campaignId, npcId, instructionIndex } = body

  if (!campaignId || !npcId || typeof instructionIndex !== 'number') {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: campaignId, npcId, instructionIndex',
    })
  }

  const filePath = resolve(CAMPAIGNS_DIR, `${campaignId}.json`)
  let campaignFile: CampaignFile

  try {
    const raw = await readFile(filePath, 'utf-8')
    campaignFile = JSON.parse(raw)
  } catch {
    throw createError({ statusCode: 404, message: `Campaign file "${campaignId}" not found` })
  }

  let found = false

  function removeInstruction(locations: CampaignFile['campaign']['locations']): boolean {
    for (const loc of locations) {
      if (loc.npcs) {
        const npc = loc.npcs.find((n) => n.id === npcId)
        if (npc && npc.dmInstructions) {
          if (instructionIndex < 0 || instructionIndex >= npc.dmInstructions.length) {
            throw createError({ statusCode: 400, message: 'instructionIndex out of range' })
          }
          npc.dmInstructions.splice(instructionIndex, 1)
          found = true
          return true
        }
      }
      if (loc.locations && removeInstruction(loc.locations)) return true
    }
    return false
  }

  removeInstruction(campaignFile.campaign.locations)

  if (!found) {
    throw createError({
      statusCode: 404,
      message: `NPC "${npcId}" not found in campaign "${campaignId}"`,
    })
  }

  await writeFile(filePath, JSON.stringify(campaignFile, null, 2), 'utf-8')
  return { ok: true }
})
