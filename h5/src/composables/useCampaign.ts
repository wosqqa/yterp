import { computed, ref, watch } from 'vue'
import type { CampaignConfig } from '../api/types'
import { fetchCampaignConfig } from '../api/campaign'
import { useTrackingStore } from '../stores/tracking'

export function useCampaign(slug: () => string) {
  const tracking = useTrackingStore()
  const data = ref<CampaignConfig | null>(null)
  const loading = ref(false)
  const errorText = ref('')

  const currentSlug = computed(() => String(slug() || '').trim())

  const load = async () => {
    const s = currentSlug.value
    if (!s) return
    loading.value = true
    errorText.value = ''
    try {
      data.value = await fetchCampaignConfig({
        slug: s,
        utm_source: tracking.utm.utm_source || undefined,
        utm_medium: tracking.utm.utm_medium || undefined,
        utm_campaign: tracking.utm.utm_campaign || undefined,
      })
    } catch (e) {
      data.value = null
      errorText.value = e instanceof Error ? e.message : '活动加载失败'
    } finally {
      loading.value = false
    }
  }

  watch(currentSlug, load, { immediate: true })

  return {
    data,
    loading,
    errorText,
    reload: load,
  }
}
