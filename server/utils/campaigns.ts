import { readdir, readFile } from 'fs/promises'
import { resolve } from 'path'

const CAMPAIGNS_DIR = resolve(process.cwd(), 'server/data/campaigns')

export interface CampaignFaction {
  id: string
  name: string
  description: string
}

export interface PlayerMemory {
  relationship: string
  keyFacts: string[]
  lastSessionSummary: string
}

export interface CampaignNPC {
  id: string
  name: string
  role: string
  age: number
  race: string
  appearance: string
  personality: string
  trueNature: string
  speechStyle: string
  motivations: string
  fears: string
  secret: string
  faction: string | null
  questHooks: string[]
  steering: string
  memory: Record<string, PlayerMemory>
  dmInstructions?: string[]
}

export interface CampaignLocation {
  id: string
  name: string
  type: string
  description: string
  atmosphere: string
  faction: string | null
  locations?: CampaignLocation[]
  npcs?: CampaignNPC[]
}

export interface PartyMember {
  id: string
  name: string
  race: string
  class: string
}

export interface Campaign {
  id: string
  name: string
  setting: string
  tone: string
  worldRules: string
  factions: CampaignFaction[]
  keyEvents: unknown[]
  locations: CampaignLocation[]
  party?: PartyMember[]
}

export interface CampaignFile {
  campaign: Campaign
  _index: {
    npcs: Record<string, { locationId: string; campaignId: string }>
    locations: Record<string, { parentId: string | null; campaignId: string }>
  }
}

export async function loadCampaignFile(id: string): Promise<CampaignFile> {
  const filePath = resolve(CAMPAIGNS_DIR, `${id}.json`)
  const raw = await readFile(filePath, 'utf-8')
  return JSON.parse(raw)
}

export async function listCampaignSummaries() {
  const files = await readdir(CAMPAIGNS_DIR)
  const summaries = []
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const raw = await readFile(resolve(CAMPAIGNS_DIR, file), 'utf-8')
    const data: CampaignFile = JSON.parse(raw)
    summaries.push({
      id: data.campaign.id,
      name: data.campaign.name,
      setting: data.campaign.setting,
      tone: data.campaign.tone,
    })
  }
  return summaries
}

export function findLocationInTree(
  locations: CampaignLocation[],
  id: string,
): CampaignLocation | null {
  for (const loc of locations) {
    if (loc.id === id) return loc
    if (loc.locations) {
      const found = findLocationInTree(loc.locations, id)
      if (found) return found
    }
  }
  return null
}

export async function findLocationWithContext(campaignId: string, locationId: string) {
  const data = await loadCampaignFile(campaignId)
  const location = findLocationInTree(data.campaign.locations, locationId)
  if (!location) return null

  const indexEntry = data._index.locations[locationId]
  const parent =
    indexEntry?.parentId
      ? findLocationInTree(data.campaign.locations, indexEntry.parentId)
      : null

  return { location, parent, campaign: data.campaign }
}

export async function findNPCWithContext(campaignId: string, npcId: string) {
  const data = await loadCampaignFile(campaignId)
  const indexEntry = data._index.npcs[npcId]
  if (!indexEntry) return null

  const location = findLocationInTree(data.campaign.locations, indexEntry.locationId)
  if (!location) return null

  const npc = location.npcs?.find((n) => n.id === npcId)
  if (!npc) return null

  return { npc, location, campaign: data.campaign }
}

export function buildSystemPrompt(
  npc: CampaignNPC,
  location: CampaignLocation,
  campaign: Campaign,
  playerId: string = 'player-default',
): string {
  const factionList = campaign.factions
    .map((f) => `  - ${f.name}: ${f.description}`)
    .join('\n')

  const playerMemory = npc.memory[playerId]
  let memoryText: string
  if (playerMemory) {
    const factsList = playerMemory.keyFacts.map((f) => `  - ${f}`).join('\n')
    memoryText = `MEMORY OF THIS PLAYER:
Relationship: ${playerMemory.relationship}
Key facts you remember:
${factsList}
Last time you saw them: ${playerMemory.lastSessionSummary}`
  } else {
    memoryText = 'You have not met this player before.'
  }

  let dmInstructionsText = ''
  if (npc.dmInstructions && npc.dmInstructions.length > 0) {
    const list = npc.dmInstructions.map((inst) => `  - ${inst}`).join('\n')
    dmInstructionsText = `\n\nPENDING DM INSTRUCTIONS:\n${list}\nCarry these out naturally during this interaction when appropriate.`
  }

  return `You are ${npc.name}, ${npc.role}.

APPEARANCE: ${npc.appearance}
PERSONALITY: ${npc.personality}
TRUE NATURE: ${npc.trueNature}
SPEECH STYLE: ${npc.speechStyle}

MOTIVATIONS: ${npc.motivations}
FEARS: ${npc.fears}
SECRET (never reveal this directly): ${npc.secret}

BEHAVIORAL GUIDANCE: ${npc.steering}

LOCATION: You are currently at ${location.name} — ${location.description}. The atmosphere here is ${location.atmosphere}.

WORLD CONTEXT:
  Setting: ${campaign.setting}
  Tone: ${campaign.tone}
  World Rules: ${campaign.worldRules}
  Active Factions:
${factionList}

PLAYER MEMORY:
${memoryText}${dmInstructionsText}

Stay in character at all times. Never break the fourth wall. Respond as ${npc.name} would in this world.

CRITICAL RULES:
- You are ONLY ${npc.name}. Never write dialogue or actions for anyone else.
- Do NOT write lines starting with the player's name or put words in their mouth.
- Do NOT use quotation marks to write what the player says.
- Do NOT continue the scene after your response — stop after ${npc.name}'s turn.
- Keep responses short — 2 to 4 sentences maximum unless the player asks a direct question that requires more.
- Write in plain prose as ${npc.name}. Do not use stage directions like "(hands Pip the note)" — just describe what you do naturally in your response.`
}
