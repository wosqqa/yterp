import { defineStore } from 'pinia'
import type { UTM } from '../utils/query'

export const useTrackingStore = defineStore('tracking', {
  state: () => ({
    utm: {
      utm_source: '',
      utm_medium: '',
      utm_campaign: '',
    } as UTM,
  }),
  actions: {
    setUtm(next: Partial<UTM>) {
      this.utm = {
        utm_source: next.utm_source != null ? String(next.utm_source).trim() : this.utm.utm_source,
        utm_medium: next.utm_medium != null ? String(next.utm_medium).trim() : this.utm.utm_medium,
        utm_campaign:
          next.utm_campaign != null ? String(next.utm_campaign).trim() : this.utm.utm_campaign,
      }
    },
  },
})
