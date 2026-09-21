import type { ApiResponse, CampaignConfig, CampaignConfigRequest } from './types'
import { http } from './http'
import { getMockCampaignConfig } from '../mock/campaigns'

export async function fetchCampaignConfig(input: CampaignConfigRequest): Promise<CampaignConfig> {
  try {
    const resp = await http.post<ApiResponse<CampaignConfig>>('/api/h5/campaignConfig', input)
    const data = resp.data
    if (data && data.state === 'success' && data.info) return data.info
    const message = (data && (data.message || (data.info as unknown as string))) || '活动配置获取失败'
    throw new Error(message)
  } catch (e) {
    const slug = input.slug
    const fallback = getMockCampaignConfig(slug)
    if (fallback) return fallback
    throw e
  }
}
