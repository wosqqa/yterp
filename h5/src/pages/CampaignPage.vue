<script setup lang="ts">
import { computed, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import CampaignRenderer from '../components/CampaignRenderer.vue'
import { pickUtmFromQuery } from '../utils/query'
import { useTrackingStore } from '../stores/tracking'
import { useCampaign } from '../composables/useCampaign'

const route = useRoute()
const tracking = useTrackingStore()

watchEffect(() => {
  tracking.setUtm(pickUtmFromQuery(route.query as Record<string, unknown>))
})

const slug = computed(() => String(route.params.slug || '').trim())
const { data, loading, errorText, reload } = useCampaign(() => slug.value)

watchEffect(() => {
  const theme = data.value && data.value.theme ? String(data.value.theme) : ''
  if (theme !== 'light' && theme !== 'dark') return
  document.documentElement.classList.remove('light', 'dark')
  document.documentElement.classList.add(theme)
})
</script>

<template>
  <div class="min-h-dvh bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <div class="mx-auto max-w-[980px] px-5 py-8">
      <div class="flex items-center justify-between gap-4">
        <router-link
          class="text-xs font-medium text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
          to="/"
        >
          返回首页
        </router-link>
        <div class="text-xs text-zinc-500 dark:text-zinc-400">slug：{{ slug }}</div>
      </div>

      <div class="mt-6">
        <div
          v-if="loading"
          class="space-y-4 rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-10 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div class="h-4 w-24 animate-pulse rounded bg-zinc-200/70 dark:bg-zinc-800"></div>
          <div class="h-10 w-3/4 animate-pulse rounded bg-zinc-200/70 dark:bg-zinc-800"></div>
          <div class="h-4 w-2/3 animate-pulse rounded bg-zinc-200/70 dark:bg-zinc-800"></div>
          <div class="h-4 w-1/2 animate-pulse rounded bg-zinc-200/70 dark:bg-zinc-800"></div>
        </div>

        <div
          v-else-if="errorText"
          class="rounded-[28px] border border-rose-200 bg-white p-6 text-sm text-rose-700 sm:p-10"
        >
          <div class="font-semibold">活动加载失败</div>
          <div class="mt-2 break-words text-xs leading-relaxed">{{ errorText }}</div>
          <button
            class="mt-4 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-500"
            type="button"
            @click="reload"
          >
            重试
          </button>
        </div>

        <div v-else-if="data" class="space-y-8">
          <div class="text-sm font-semibold tracking-tight">{{ data.title }}</div>
          <CampaignRenderer :blocks="data.blocks" />
        </div>
      </div>
    </div>
  </div>
</template>
