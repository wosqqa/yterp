<template>
  <section class="hero" @mouseenter="onEnter" @mouseleave="onLeave">
    <div class="viewport" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
      <div class="track" :style="{ transform: `translateX(-${activeIndex * 100}%)` }">
        <a
          v-for="(s, idx) in slides"
          :key="s.id"
          class="slide"
          :href="resolveHref(s.href)"
          :target="resolveTarget(s.target)"
          :rel="resolveRel(s.target)"
          :aria-hidden="idx !== activeIndex"
          :style="{ backgroundImage: `url(${s.image})` }"
          @click.prevent="onSlideClick(s.href, s.target)"
        >
          <div class="shade" />
          <div class="content">
            <div v-if="s.note" class="note">{{ s.note }}</div>
            <div v-if="s.brand" class="brand">{{ s.brand }}</div>
            <div class="title">{{ s.title }}</div>
            <div v-if="s.sub" class="sub">{{ s.sub }}</div>
          </div>
        </a>
      </div>
    </div>

    <button class="nav prev" type="button" aria-label="Previous" @click="prev">
      <span class="chev" />
    </button>
    <button class="nav next" type="button" aria-label="Next" @click="next">
      <span class="chev chevNext" />
    </button>

    <div class="dots" role="tablist" aria-label="Hero carousel">
      <button
        v-for="(s, idx) in slides"
        :key="s.id"
        class="dot"
        :class="{ active: idx === activeIndex }"
        type="button"
        :aria-label="`Go to slide ${idx + 1}`"
        @click="go(idx)"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { heroConfig } from '../config/hero'

const slides = heroConfig.slides
const activeIndex = ref(0)
const paused = ref(false)
const timer = ref<number | null>(null)
const router = useRouter()

const autoplayMs = computed(() => {
  const v = Number((heroConfig as any).autoplayMs)
  return Number.isFinite(v) && v > 500 ? v : 4500
})

function clearTimer() {
  if (timer.value) window.clearInterval(timer.value)
  timer.value = null
}

function startTimer() {
  if (typeof window === 'undefined') return
  clearTimer()
  timer.value = window.setInterval(() => {
    if (paused.value) return
    next()
  }, autoplayMs.value)
}

function clampIndex(idx: number) {
  const n = slides.length || 1
  const x = idx % n
  return x < 0 ? x + n : x
}

function go(idx: number) {
  activeIndex.value = clampIndex(idx)
}

function next() {
  go(activeIndex.value + 1)
}

function prev() {
  go(activeIndex.value - 1)
}

function onEnter() {
  if (!heroConfig.pauseOnHover) return
  paused.value = true
}

function onLeave() {
  paused.value = false
}

function resolveHref(href?: string) {
  return href || '#'
}

function resolveTarget(target?: '_self' | '_blank') {
  return target || '_self'
}

function resolveRel(target?: '_self' | '_blank') {
  return target === '_blank' ? 'noopener noreferrer' : undefined
}

function onSlideClick(href?: string, target?: '_self' | '_blank') {
  const to = (href || '').trim()
  if (!to || to === '#') return
  if (target === '_blank') {
    if (typeof window === 'undefined') return
    window.open(to, '_blank', 'noopener,noreferrer')
    return
  }
  if (/^https?:\/\//i.test(to)) {
    if (typeof window === 'undefined') return
    window.location.href = to
    return
  }
  return router.push(to)
}

const touchStartX = ref(0)
const touchDeltaX = ref(0)

function onTouchStart(e: TouchEvent) {
  const t = e.touches && e.touches[0]
  if (!t) return
  touchStartX.value = t.clientX
  touchDeltaX.value = 0
}

function onTouchMove(e: TouchEvent) {
  const t = e.touches && e.touches[0]
  if (!t) return
  touchDeltaX.value = t.clientX - touchStartX.value
}

function onTouchEnd() {
  const dx = touchDeltaX.value
  touchStartX.value = 0
  touchDeltaX.value = 0
  if (Math.abs(dx) < 50) return
  dx < 0 ? next() : prev()
}

onMounted(() => {
  startTimer()
})

onBeforeUnmount(() => {
  if (typeof window === 'undefined') return
  clearTimer()
})
</script>

<style scoped>
.hero{
  position: relative;
  overflow: hidden;
  color: #fff;
}
.viewport{
  width: 100%;
  height: 260px;
}
.track{
  height: 100%;
  display: flex;
  transition: transform .35s ease;
}
.slide{
  flex: 0 0 100%;
  height: 100%;
  position: relative;
  display: block;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.shade{
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(0,0,0,.55), rgba(0,0,0,.22) 55%, rgba(0,0,0,0)),
    linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.10));
}
.content{
  position: relative;
  height: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 22px 16px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 10px;
}
.note{
  font-size: 12px;
  opacity: .88;
  text-align: left;
  max-width: 640px;
}
.brand{
  font-size: 26px;
  font-weight: 700;
  letter-spacing: .02em;
}
.title{
  font-size: 18px;
  font-weight: 900;
  line-height: 1.25;
  max-width: 700px;
}
.sub{
  font-size: 13px;
  line-height: 1.5;
  max-width: 700px;
  opacity: .92;
}

.nav{
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 42px;
  height: 42px;
  border: 0;
  background: rgba(0,0,0,.35);
  backdrop-filter: blur(6px);
  color: #fff;
  cursor: pointer;
  z-index: 2;
  display: none;
  align-items: center;
  justify-content: center;
}
.nav.prev{ left: 10px; }
.nav.next{ right: 10px; }
.chev{
  width: 10px;
  height: 10px;
  border-left: 2px solid rgba(255,255,255,.92);
  border-bottom: 2px solid rgba(255,255,255,.92);
  transform: rotate(45deg);
}
.chevNext{
  transform: rotate(225deg);
}

.dots{
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  display: flex;
  justify-content: center;
  gap: 8px;
  z-index: 2;
}
.dot{
  width: 8px;
  height: 8px;
  border-radius: 999px;
  border: 0;
  background: rgba(255,255,255,.45);
  cursor: pointer;
  padding: 0;
}
.dot.active{
  background: rgba(255,255,255,.92);
}

@media (min-width: 900px){
  .viewport{
    height: 360px;
  }
  .content{
    padding: 34px 18px;
  }
  .brand{
    font-size: 42px;
  }
  .title{
    font-size: 22px;
  }
  .nav{
    display: inline-flex;
  }
}
</style>
