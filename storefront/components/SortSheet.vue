<template>
  <div v-if="open" class="overlay" @click.self="$emit('close')">
    <div class="sheet">
      <div class="top">
        <div class="title">Sort by</div>
        <button class="closeBtn" aria-label="Close" @click="$emit('close')">
          <span class="x" />
        </button>
      </div>

      <button v-for="o in options" :key="o.key" class="opt" @click="$emit('change', o.key)">
        <span class="optText">{{ o.label }}</span>
        <span v-if="o.key === value" class="dot" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SortKey } from '../composables/mockCatalog'

defineProps<{ open: boolean; value: SortKey }>()
defineEmits<{ close: []; change: [value: SortKey] }>()

const options: Array<{ key: SortKey; label: string }> = [
  { key: 'featured', label: 'Featured' },
  { key: 'relevance', label: 'Most relevant' },
  { key: 'bestSelling', label: 'Best selling' },
  { key: 'alphaAsc', label: 'Alphabetically, A-Z' },
  { key: 'alphaDesc', label: 'Alphabetically, Z-A' },
  { key: 'priceAsc', label: 'Price, low to high' },
  { key: 'priceDesc', label: 'Price, high to low' },
  { key: 'dateAsc', label: 'Date, old to new' },
  { key: 'dateDesc', label: 'Date, new to old' }
]
</script>

<style scoped>
.overlay{
  position: fixed;
  inset: 0;
  background: rgba(17,17,17,.45);
  z-index: 70;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 10px 10px;
}
.sheet{
  width: min(720px, 100%);
  background: #fff;
  border-radius: 18px;
  box-shadow: var(--shadow);
  overflow: hidden;
}
.top{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px;
  border-bottom: 1px solid var(--border);
}
.title{
  font-weight: 800;
  font-size: 14px;
}
.closeBtn{
  width: 40px;
  height: 40px;
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.x{
  width: 14px;
  height: 14px;
  position: relative;
}
.x::before,
.x::after{
  content:"";
  position:absolute;
  left: 6px;
  top: 0;
  width: 2px;
  height: 14px;
  background: #111827;
  border-radius: 999px;
}
.x::before{ transform: rotate(45deg); }
.x::after{ transform: rotate(-45deg); }
.opt{
  width: 100%;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px;
  cursor: pointer;
}
.opt + .opt{
  border-top: 1px solid rgba(17,17,17,.06);
}
.optText{
  font-size: 13px;
  color: rgba(17,24,39,.85);
}
.dot{
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #111827;
}
</style>

