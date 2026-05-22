<template>
  <a v-if="href" class="chat" :href="href" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp Chat">
    <span class="bubble" />
    <span class="label">Chat</span>
    <span v-if="badge" class="badge">{{ badge }}</span>
  </a>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { siteConfig } from '../config/site'

const href = computed(() => {
  const raw = String((siteConfig as any)?.whatsappNumber || '').trim()
  const digits = raw.replace(/[^\d]/g, '')
  if (!digits) return ''
  return `https://wa.me/${digits}`
})

const badge = computed(() => '')
</script>

<style scoped>
.chat{
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 80;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 18px;
  background: #0b0b0b;
  color: #fff;
  box-shadow: 0 16px 36px rgba(0,0,0,.25);
}
.bubble{
  width: 20px;
  height: 18px;
  border-radius: 6px;
  background: #fff;
  position: relative;
}
.bubble::after{
  content:"";
  position:absolute;
  left: 4px;
  bottom: -6px;
  width: 0;
  height: 0;
  border: 6px solid transparent;
  border-top-color: #fff;
  border-bottom: 0;
  transform: rotate(18deg);
}
.label{
  font-weight: 900;
  letter-spacing: .02em;
}
.badge{
  position: absolute;
  right: -4px;
  top: -4px;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  padding: 0 5px;
  font-weight: 800;
}
</style>
