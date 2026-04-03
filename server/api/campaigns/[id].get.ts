import { loadCampaignFile } from '~/server/utils/campaigns'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!

  let data
  try {
    data = await loadCampaignFile(id)
  } catch {
    throw createError({ statusCode: 404, message: `Campaign "${id}" not found` })
  }

  return data.campaign
})
