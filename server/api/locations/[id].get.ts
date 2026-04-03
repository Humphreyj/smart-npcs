import { findLocationWithContext } from '~/server/utils/campaigns'

export default defineEventHandler(async (event) => {
  const locationId = getRouterParam(event, 'id')!
  const query = getQuery(event)
  const campaignId = query.campaign as string | undefined

  if (!campaignId) {
    throw createError({ statusCode: 400, message: 'Missing required query param: campaign' })
  }

  const result = await findLocationWithContext(campaignId, locationId)
  if (!result) {
    throw createError({ statusCode: 404, message: `Location "${locationId}" not found in campaign "${campaignId}"` })
  }

  return result
})
