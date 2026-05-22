<template>
  <div class="wrap">
    <div class="topBar">
      <button class="backBtn" @click="goBack" aria-label="Back">
        <span class="arrow" />
      </button>
      <div class="topTitle">Product</div>
      <NuxtLink class="toCart" to="/cart">{{ t('cart') }}</NuxtLink>
    </div>

    <div v-if="product" class="content">
      <div class="img" :style="{ backgroundImage: product.image.bg }">
        <div class="imgLabel">{{ product.image.label }}</div>
      </div>

      <div class="info">
        <div class="brand">{{ product.brand }}</div>
        <h1 class="title">{{ product.title }}</h1>

        <div class="priceRow">
          <span v-if="product.compareAtCny" class="compare">{{ money.format(product.compareAtCny) }}</span>
          <span class="price">{{ money.format(product.priceCny) }}</span>
        </div>

        <div class="metaRow">
          <span class="metaKey">{{ t('productType') }}</span>
          <span class="metaVal">{{ product.productType }}</span>
        </div>
        <div class="metaRow">
          <span class="metaKey">{{ t('availability') }}</span>
          <span class="metaVal">{{ product.inStock ? t('inStock') : t('outOfStock') }}</span>
        </div>

        <button class="add" :disabled="!product.inStock" @click="cart.add(product, 1)">
          {{ product.inStock ? t('addToCart') : t('outOfStock') }}
        </button>
      </div>
    </div>

    <div v-else class="empty">
      {{ t('notFound') }}
      <NuxtLink to="/">{{ t('backToList') }}</NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMockCatalog } from '../../composables/mockCatalog'
import { useCart } from '../../composables/cart'
import { useI18n } from '../../composables/i18n'
import { useMoney } from '../../composables/money'

const route = useRoute()
const router = useRouter()
const { products } = useMockCatalog()
const cart = useCart()
const { t } = useI18n()
const money = useMoney()

const slug = computed(() => String(route.params.slug || ''))
const product = computed(() => products.find(p => p.slug === slug.value) || null)

function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push('/')
}
</script>

<style scoped>
.wrap{
  max-width: 1000px;
  margin: 0 auto;
  padding: 14px;
}
.topBar{
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  gap: 10px;
  padding: 10px 0 14px;
}
.backBtn{
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: #fff;
  cursor: pointer;
}
.arrow{
  width: 12px;
  height: 12px;
  border-left: 2px solid #111827;
  border-bottom: 2px solid #111827;
  transform: rotate(45deg);
  display: inline-block;
  margin-left: 4px;
}
.topTitle{
  text-align: center;
  font-weight: 800;
}
.toCart{
  justify-self: end;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  font-size: 12px;
  font-weight: 800;
}
.content{
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}
.img{
  border-radius: 18px;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  box-shadow: 0 10px 22px rgba(0,0,0,.12);
  position: relative;
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
.imgLabel{
  position:absolute;
  left: 14px;
  bottom: 14px;
  z-index: 1;
  font-weight: 900;
  letter-spacing: .18em;
  font-size: 13px;
  color: #fff;
  text-shadow: 0 8px 18px rgba(0,0,0,.45);
}
.info{
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 14px;
}
.brand{
  font-size: 12px;
  letter-spacing: .16em;
  font-weight: 800;
  color: rgba(17,24,39,.55);
}
.title{
  font-size: 18px;
  margin: 8px 0 10px;
  line-height: 1.25;
}
.priceRow{
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}
.compare{
  font-size: 13px;
  color: rgba(17,24,39,.45);
  text-decoration: line-through;
}
.price{
  font-size: 16px;
  font-weight: 900;
  color: var(--accent);
}
.metaRow{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid rgba(17,17,17,.06);
}
.metaKey{
  color: rgba(17,24,39,.55);
  font-size: 13px;
}
.metaVal{
  color: rgba(17,24,39,.85);
  font-size: 13px;
  font-weight: 700;
}
.add{
  width: 100%;
  height: 46px;
  border-radius: 14px;
  border: 0;
  background: #111827;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  margin-top: 12px;
}
.add:disabled{
  background: rgba(17,24,39,.35);
  cursor: not-allowed;
}
.empty{
  padding: 24px 0;
  color: rgba(17,24,39,.7);
}

@media (min-width: 900px){
  .wrap{
    padding: 20px;
  }
  .content{
    grid-template-columns: 420px 1fr;
    gap: 18px;
    align-items: start;
  }
  .title{
    font-size: 22px;
  }
}
</style>
