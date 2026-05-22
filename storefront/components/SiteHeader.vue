<template>
  <header class="header">
    <div class="headerInner">
      <button class="iconBtn" aria-label="Menu" @click="$emit('menu')">
        <span class="burger" />
      </button>

      <NuxtLink class="logo" to="/">DINOSSI</NuxtLink>

      <div class="right">
        <div class="langWrap" ref="wrapRef">
          <button class="langBtn" @click="toggleLang" aria-label="Language">
            <span class="flag">{{ currentLang.flag }}</span>
            <span class="langText">{{ currentLang.label }}</span>
            <span class="langMeta">({{ currentLang.currency }} {{ currentLang.symbol }})</span>
            <span class="caret" :class="{ up: langOpen }" />
          </button>

          <div v-if="langOpen" class="langMenu">
            <button
              v-for="opt in langOptions"
              :key="opt.locale"
              class="langItem"
              :class="{ active: opt.locale === locale }"
              @click="selectLang(opt.locale)"
            >
              <span class="flag">{{ opt.flag }}</span>
              <span class="langText">{{ opt.label }}</span>
              <span class="langMeta">({{ opt.currency }} {{ opt.symbol }})</span>
            </button>
          </div>
        </div>
        <button class="iconBtn cartBtn" type="button" aria-label="Cart" @click="openCart">
          <span class="bag" />
          <span v-if="count" class="badge">{{ count }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useCart } from '../composables/cart'
import { useI18n, type Locale } from '../composables/i18n'
import { useUi } from '../composables/ui'

defineEmits<{ menu: [] }>()
const { count } = useCart()
const { setLocale, locale } = useI18n()
const { openCart } = useUi()

const langOptions = [
  { locale: 'zh-CN' as const, label: 'China', currency: 'CNY' as const, symbol: '¥', flag: '🇨🇳' },
  { locale: 'en' as const, label: 'United States', currency: 'USD' as const, symbol: '$', flag: '🇺🇸' },
  { locale: 'ms-MY' as const, label: 'Malaysia', currency: 'MYR' as const, symbol: 'RM', flag: '🇲🇾' }
] as const

const langOpen = ref(false)
const wrapRef = ref<HTMLElement | null>(null)

const currentLang = computed(() => {
  return langOptions.find(o => o.locale === locale.value) || langOptions[0]
})

function toggleLang() {
  langOpen.value = !langOpen.value
}

function selectLang(next: Locale) {
  setLocale(next)
  langOpen.value = false
}

function onDocClick(e: MouseEvent) {
  if (!langOpen.value) return
  const el = e.target as Node | null
  const wrap = wrapRef.value
  if (!wrap || !el) return
  if (wrap.contains(el)) return
  langOpen.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') langOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
.header{
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 50;
  height: 56px;
  background: rgba(255,255,255,.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.headerInner{
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  max-width: 1200px;
  margin: 0 auto;
}
.logo{
  font-weight: 800;
  letter-spacing: 0.22em;
  font-size: 18px;
}
.right{
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.langWrap{
  position: relative;
}
.langBtn{
  height: 34px;
  padding: 0 10px 0 10px;
  border-radius: 0;
  border: 1px solid rgba(17,17,17,.18);
  background: #fff;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.flag{
  font-size: 14px;
  line-height: 1;
}
.langText{
  font-weight: 600;
  font-size: 12px;
  letter-spacing: .02em;
}
.langMeta{
  font-weight: 600;
  font-size: 12px;
  color: rgba(17,24,39,.55);
}
.caret{
  width: 7px;
  height: 7px;
  border-right: 1px solid rgba(17,24,39,.7);
  border-bottom: 1px solid rgba(17,24,39,.7);
  transform: rotate(45deg);
  margin-left: 2px;
}
.caret.up{
  transform: rotate(225deg);
  margin-top: 4px;
}
.langMenu{
  position: absolute;
  right: 0;
  top: 44px;
  width: max-content;
  min-width: 220px;
  background: #fff;
  border: 1px solid rgba(17,17,17,.18);
  border-radius: 0;
  box-shadow: 0 10px 20px rgba(0,0,0,.12);
  padding: 0;
  z-index: 60;
}
.langItem{
  width: 100%;
  border: 0;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 0;
  cursor: pointer;
  text-align: left;
}
.langItem + .langItem{
  border-top: 1px solid rgba(17,17,17,.08);
}
.langItem:hover{
  background: rgba(59,130,246,.06);
}
.langItem.active{
  background: rgba(59,130,246,.10);
  outline: 1px solid rgba(59,130,246,.55);
  outline-offset: -1px;
}
.langItem .langText{
  font-size: 13px;
}
.langItem .langMeta{
  margin-left: auto;
  font-size: 12px;
}
.iconBtn{
  width: 40px;
  height: 40px;
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  position: relative;
  cursor: pointer;
}
.burger{
  width: 18px;
  height: 2px;
  background: var(--fg);
  border-radius: 999px;
  position: relative;
}
.burger::before,
.burger::after{
  content: "";
  position: absolute;
  left: 0;
  width: 18px;
  height: 2px;
  background: var(--fg);
  border-radius: 999px;
}
.burger::before{ top: -6px; }
.burger::after{ top: 6px; }

.bag{
  width: 18px;
  height: 18px;
  border: 2px solid var(--fg);
  border-radius: 4px;
  position: relative;
  box-sizing: border-box;
}
.bag::before{
  content: "";
  position: absolute;
  top: -6px;
  left: 3px;
  right: 3px;
  height: 8px;
  border: 2px solid var(--fg);
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
  box-sizing: border-box;
}
.badge{
  position: absolute;
  right: 4px;
  bottom: 4px;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  border-radius: 999px;
  background: var(--accent);
  color: #fff;
  font-size: 12px;
  line-height: 18px;
  text-align: center;
  font-weight: 700;
}
</style>
