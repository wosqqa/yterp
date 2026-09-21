export type ApiResponse<T> = {
  state: 'success' | 'error'
  info?: T
  message?: string
  count?: number
}

export type CampaignConfigRequest = {
  slug: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

export type CampaignBlock = {
  type: string
  data: Record<string, unknown>
}

export type CampaignConfig = {
  slug: string
  title: string
  theme?: 'light' | 'dark'
  blocks: CampaignBlock[]
}
