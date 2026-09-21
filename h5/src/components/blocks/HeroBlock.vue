<script setup lang="ts">
import { computed } from 'vue'

type HeroData = {
  badge?: string
  title?: string
  subtitle?: string
  primaryText?: string
  primaryUrl?: string
}

const props = defineProps<{
  data: Record<string, unknown>
}>()

const hero = computed(() => props.data as HeroData)
</script>

<template>
  <section class="rounded-[28px] border border-zinc-200 bg-white p-6 shadow-sm sm:p-10">
    <div class="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div class="max-w-[62ch]">
        <div
          v-if="hero.badge"
          class="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold tracking-[0.18em] text-zinc-700"
        >
          {{ hero.badge }}
        </div>
        <h1 class="mt-4 text-3xl font-semibold leading-[1.08] tracking-tight text-zinc-900 sm:text-5xl">
          {{ hero.title || '活动标题' }}
        </h1>
        <p class="mt-4 text-sm leading-relaxed text-zinc-600 sm:text-base">
          {{ hero.subtitle || '活动副标题' }}
        </p>
      </div>

      <a
        class="inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-zinc-800 active:translate-y-0"
        :href="hero.primaryUrl || '#'"
      >
        {{ hero.primaryText || '立即查看' }}
      </a>
    </div>
  </section>
</template>
