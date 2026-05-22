<template>
  <article class="card">
    <div class="img" :style="{ backgroundImage: product.image.bg }">
      <div v-if="discountLabel" class="discount">{{ discountLabel }} {{ t('discount') }}</div>
      <button class="addBtn" aria-label="Add to cart" @click.stop="$emit('add')">
        <span class="bag" />
      </button>
      <NuxtLink class="linkOverlay" :to="`/products/${product.slug}`" />
      <div class="imgLabel">{{ product.image.label }}</div>
    </div>

    <div class="meta">
      <div class="brand">{{ product.brand }}</div>
      <div class="title">
        <NuxtLink :to="`/products/${product.slug}`">{{ product.title }}</NuxtLink>
      </div>
      <div class="priceRow">
        <span v-if="product.compareAtCny" class="compare">{{ money.format(product.compareAtCny) }}</span>
        <span class="price">{{ money.format(product.priceCny) }}</span>
      </div>
      <div v-if="!product.inStock" class="stock">{{ t('outOfStock') }}</div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { MockProduct } from '../composables/mockCatalog'
import { useI18n } from '../composables/i18n'
import { useMoney } from '../composables/money'

const props = defineProps<{ product: MockProduct }>()
defineEmits<{ add: [] }>()

const { t } = useI18n()
const money = useMoney()

const discountLabel = computed(() => {
  if (!props.product.compareAtCny) return ''
  const d = Math.max(0, (props.product.compareAtCny || 0) - props.product.priceCny)
  if (!Number.isFinite(d) || d <= 0) return ''
  return `-${money.format(d)}`
})
</script>

<style scoped>
.card{
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.img{
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  aspect-ratio: 1 / 1.02;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  box-shadow: 0 8px 20px rgba(0,0,0,.10);
}
.img::after{
  content:"";
  position:absolute;
  inset:0;
  background:
    radial-gradient(90% 70% at 20% 20%, rgba(255,255,255,.18), transparent 55%),
    radial-gradient(70% 55% at 80% 70%, rgba(0,0,0,.16), transparent 55%);
  pointer-events: none;
}
.discount{
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255,255,255,.82);
  backdrop-filter: blur(8px);
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .06em;
  z-index: 2;
}
.addBtn{
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(17,17,17,.12);
  background: rgba(255,255,255,.92);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  cursor: pointer;
}
.bag{
  width: 18px;
  height: 18px;
  border: 2px solid #111827;
  border-radius: 4px;
  position: relative;
  box-sizing: border-box;
}
.bag::before{
  content:"";
  position:absolute;
  top:-6px;
  left:3px;
  right:3px;
  height: 8px;
  border: 2px solid #111827;
  border-bottom: 0;
  border-radius: 10px 10px 0 0;
  box-sizing: border-box;
}
.linkOverlay{
  position: absolute;
  inset: 0;
  z-index: 1;
}
.imgLabel{
  position:absolute;
  left: 12px;
  bottom: 12px;
  z-index: 2;
  font-weight: 900;
  letter-spacing: .18em;
  font-size: 12px;
  text-shadow: 0 6px 14px rgba(0,0,0,.45);
}
.meta{
  padding: 0 2px;
}
.brand{
  font-size: 11px;
  letter-spacing: .16em;
  color: rgba(17,24,39,.55);
  font-weight: 800;
  text-transform: uppercase;
}
.title{
  font-size: 13px;
  line-height: 1.35;
  margin-top: 4px;
  font-weight: 600;
  min-height: 34px;
}
.priceRow{
  margin-top: 8px;
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.compare{
  font-size: 12px;
  color: rgba(17,24,39,.45);
  text-decoration: line-through;
}
.price{
  font-size: 13px;
  color: var(--accent);
  font-weight: 800;
}
.stock{
  margin-top: 6px;
  font-size: 12px;
  color: rgba(17,24,39,.55);
}
</style>
