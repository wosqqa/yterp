<script setup lang="ts">
import type { CampaignBlock } from '../api/types'
import HeroBlock from './blocks/HeroBlock.vue'
import RichTextBlock from './blocks/RichTextBlock.vue'
import CtaBlock from './blocks/CtaBlock.vue'

defineProps<{
  blocks: CampaignBlock[]
}>()

const resolveComponent = (type: string) => {
  const key = String(type || '').trim()
  if (key === 'hero') return HeroBlock
  if (key === 'richText') return RichTextBlock
  if (key === 'cta') return CtaBlock
  return null
}
</script>

<template>
  <div class="space-y-10">
    <div v-for="(b, idx) in blocks" :key="String(b.type) + '-' + String(idx)">
      <component :is="resolveComponent(b.type)" v-if="resolveComponent(b.type)" :data="b.data" />
      <div v-else class="rounded-2xl border border-zinc-200 p-5 text-xs text-zinc-600">
        未支持的区块：{{ b.type }}
      </div>
    </div>
  </div>
</template>
