import { listCampaignSummaries } from '~/server/utils/campaigns'

export default defineEventHandler(async () => {
  return listCampaignSummaries()
})
