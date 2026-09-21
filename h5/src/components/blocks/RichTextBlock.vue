<script setup lang="ts">
import { computed } from 'vue'

type RichTextData = {
  title?: string
  paragraphs?: string[]
}

const props = defineProps<{
  data: Record<string, unknown>
}>()

const block = computed(() => props.data as RichTextData)
const paragraphs = computed(() => (Array.isArray(block.value.paragraphs) ? block.value.paragraphs : []))
</script>

<template>
  <section class="rounded-[28px] border border-zinc-200 bg-white p-6 sm:p-10">
    <div class="text-sm font-semibold text-zinc-900">{{ block.title || '说明' }}</div>
    <div class="mt-4 space-y-2 text-sm leading-relaxed text-zinc-600">
      <div v-for="(p, idx) in paragraphs" :key="idx">{{ p }}</div>
    </div>
  </section>
</template>
