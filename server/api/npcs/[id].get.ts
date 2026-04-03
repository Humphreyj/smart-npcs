import { findNPCWithContext } from '~/server/utils/campaigns'

export default defineEventHandler(async (event) => {
  const npcId = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const campaignId = query.campaign as string | undefined

  if (!campaignId) {
    throw createError({ statusCode: 400, message: 'Missing required query param: campaign' })
  }

  const result = await findNPCWithContext(campaignId, npcId)
  if (!result) {
    throw createError({ statusCode: 404, message: `NPC "${npcId}" not found in campaign "${campaignId}"` })
  }

  return result
})
