<template>
  <Teleport to="body">
    <Transition name="cartFade">
      <div v-if="cartOpen" class="overlay" @click="close" />
    </Transition>
    <Transition name="cartSlide">
      <aside v-if="cartOpen" class="drawer" role="dialog" aria-modal="true" aria-label="Cart">
        <div class="top">
          <div class="topLeft">
            <span class="bagIcon" />
            <span class="topTitle">{{ t('cart') }}</span>
          </div>
          <button class="closeBtn" aria-label="Close" @click="close">
            <span class="x" />
          </button>
        </div>

        <div v-if="!lines.length" class="empty">
          {{ t('cartEmpty') }}。
          <NuxtLink class="emptyLink" to="/" @click="close">{{ t('shopNow') }}</NuxtLink>
        </div>

        <div v-else class="content">
          <div class="list">
            <div v-for="l in lines" :key="l.id" class="line">
              <div class="thumb" :style="{ background: productById[l.productId]?.image?.bg || 'linear-gradient(135deg,#111827,#e5e7eb)' }">
                <span class="thumbLabel">{{ productById[l.productId]?.image?.label || 'ITEM' }}</span>
              </div>
              <div class="lineMain">
                <div class="lineTop">
                  <div class="lineTitle">{{ l.title }}</div>
                  <button class="removeIcon" aria-label="Remove" @click="cart.remove(l.id)">×</button>
                </div>
                <div class="lineBottom">
                  <div class="qty">
                    <button class="qtyBtn" @click="cart.setQty(l.id, l.qty - 1)">-</button>
                    <input
                      class="qtyInput"
                      :value="l.qty"
                      @input="cart.setQty(l.id, Number($event && $event.target && $event.target.value))"
                    />
                    <button class="qtyBtn" @click="cart.setQty(l.id, l.qty + 1)">+</button>
                  </div>
                  <div class="linePrice">{{ money.format(l.priceCny * l.qty) }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="summary">
            <div class="sumRow">
              <span>{{ t('subtotal') }}</span>
              <span class="sumVal">{{ money.format(subtotalCny) }}</span>
            </div>
            <div class="btnRow">
              <NuxtLink class="viewCart" to="/cart" @click="close">{{ t('viewCart') }}</NuxtLink>
              <button class="checkout" @click="mockCheckout">{{ t('checkoutMock') }}</button>
            </div>
            <div v-if="submitted" class="submitted">{{ t('orderSubmitted') }}：{{ submitted }}</div>
          </div>
        </div>
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCart } from '../composables/cart'
import { useI18n } from '../composables/i18n'
import { useMoney } from '../composables/money'
import { useUi } from '../composables/ui'

const { cartOpen, closeCart } = useUi()
const cart = useCart()
const lines = cart.lines
const subtotalCny = cart.subtotalCny
const submitted = ref('')
const { t } = useI18n()
const money = useMoney()
const route = useRoute()

const productById = computed<Record<string, { image: { bg: string; label: string } }>>(() => {
  const map: Record<string, { image: { bg: string; label: string } }> = {}
  for (const line of lines.value) {
    map[line.productId] = {
      image: {
        bg: 'linear-gradient(135deg,#111827,#9ca3af)',
        label: line.title.slice(0, 12).toUpperCase()
      }
    }
  }
  return map
})

function close() {
  closeCart()
}

function onKey(e: KeyboardEvent) {
  if (!cartOpen.value) return
  if (e.key === 'Escape') close()
}

const originalOverflow = ref('')

onMounted(() => {
  document.addEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKey)
  if (originalOverflow.value) document.body.style.overflow = originalOverflow.value
})

watch(
  cartOpen,
  open => {
    if (typeof document === 'undefined') return
    if (open) {
      originalOverflow.value = document.body.style.overflow || ''
      document.body.style.overflow = 'hidden'
      return
    }
    document.body.style.overflow = originalOverflow.value
  },
  { immediate: true }
)

watch(
  () => route.fullPath,
  () => {
    if (cartOpen.value) close()
  }
)

function mockCheckout() {
  submitted.value = `SO-${Math.floor(Date.now() / 1000)}`
}
</script>

<style scoped>
.overlay{
  position: fixed;
  inset: 0;
  background: rgba(17,17,17,.45);
  z-index: 100;
}
.drawer{
  position: fixed;
  top: 0;
  right: 0;
  height: 100%;
  width: min(92vw, 420px);
  background: #fff;
  z-index: 101;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
}
.top{
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
}
.topLeft{
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.bagIcon{
  width: 16px;
  height: 16px;
  border: 2px solid rgba(17,24,39,.9);
  border-radius: 4px;
  position: relative;
  box-sizing: border-box;
}
.bagIcon::before{
  content: "";
  position: absolute;
  top: -6px;
  left: 3px;
  right: 3px;
  height: 8px;
  border: 2px solid rgba(17,24,39,.9);
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
  box-sizing: border-box;
}
.topTitle{
  font-weight: 900;
  letter-spacing: .10em;
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

.empty{
  padding: 16px 14px;
  color: rgba(17,24,39,.75);
}
.emptyLink{
  margin-left: 6px;
  font-weight: 800;
  text-decoration: underline;
}

.content{
  display: flex;
  flex-direction: column;
  height: calc(100% - 56px);
}
.list{
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
}
.line{
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 12px;
}
.thumb{
  width: 64px;
  height: 64px;
  border-radius: 10px;
  border: 1px solid rgba(17,17,17,.10);
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  padding: 8px;
  box-sizing: border-box;
}
.thumbLabel{
  font-size: 11px;
  font-weight: 900;
  letter-spacing: .10em;
  color: rgba(255,255,255,.92);
  text-shadow: 0 2px 8px rgba(0,0,0,.35);
}
.lineMain{
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.lineTop{
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.lineTitle{
  font-weight: 800;
  font-size: 13px;
  line-height: 1.25;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.removeIcon{
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 22px;
  line-height: 28px;
  color: rgba(17,24,39,.55);
  padding: 0;
}
.lineBottom{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.qty{
  display: inline-flex;
  align-items: center;
  border: 1px solid rgba(17,17,17,.10);
  border-radius: 10px;
  overflow: hidden;
  background: #fff;
}
.qtyBtn{
  width: 34px;
  height: 34px;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-weight: 900;
}
.qtyInput{
  width: 42px;
  height: 34px;
  border: 0;
  outline: none;
  text-align: center;
  font-weight: 800;
}
.linePrice{
  font-weight: 900;
  color: rgba(17,24,39,.85);
}

.summary{
  margin-top: auto;
  border-top: 1px solid var(--border);
  padding: 14px;
}
.sumRow{
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 900;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(17,17,17,.06);
}
.sumVal{
  color: rgba(17,24,39,.85);
}
.btnRow{
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 12px;
}
.viewCart{
  height: 44px;
  border: 1px solid rgba(17,17,17,.18);
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
}
.checkout{
  height: 44px;
  border: 0;
  background: #111827;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
}
.submitted{
  margin-top: 10px;
  color: rgba(17,24,39,.65);
  font-size: 13px;
}

.cartFade-enter-active,
.cartFade-leave-active{
  transition: opacity .18s ease;
}
.cartFade-enter-from,
.cartFade-leave-to{
  opacity: 0;
}

.cartSlide-enter-active,
.cartSlide-leave-active{
  transition: transform .22s ease;
}
.cartSlide-enter-from,
.cartSlide-leave-to{
  transform: translateX(100%);
}
</style>
