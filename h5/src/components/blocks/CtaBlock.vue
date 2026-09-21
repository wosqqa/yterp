<script setup lang="ts">
import { computed } from 'vue'

type CtaData = {
  id?: string
  title?: string
  subtitle?: string
  buttonText?: string
  buttonUrl?: string
}

const props = defineProps<{
  data: Record<string, unknown>
}>()

const cta = computed(() => props.data as CtaData)
</script>

<template>
  <section
    class="rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-10"
    :id="cta.id || undefined"
  >
    <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
      <div class="max-w-[62ch]">
        <div class="text-lg font-semibold text-zinc-900">{{ cta.title || '行动号召' }}</div>
        <div class="mt-2 text-sm leading-relaxed text-zinc-600">{{ cta.subtitle || '' }}</div>
      </div>

      <a
        class="inline-flex items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white active:translate-y-0"
        :href="cta.buttonUrl || '#'"
      >
        {{ cta.buttonText || '立即前往' }}
      </a>
    </div>
  </section>
</template>
