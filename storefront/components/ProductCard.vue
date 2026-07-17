<template>
  <article class="card">
    <div class="img" :style="{ backgroundImage: product.image.bg }">
      <NuxtLink class="linkOverlay" :to="productLink" />
    </div>

    <div class="meta">
      <span class="code">{{ product.image.label }}</span>
      <span class="price">{{ money.format(product.priceCny) }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import type { MockProduct } from '../composables/mockCatalog'
import { useMoney } from '../composables/money'

const props = defineProps<{ product: MockProduct }>()
defineEmits<{ add: [] }>()

const money = useMoney()
const route = useRoute()

const productLink = computed(() => ({
  path: `/products/${props.product.slug}`,
  query: typeof route.query.brand === 'string' ? { brand: route.query.brand } : {}
}))
</script>

<style scoped>
.card{
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.img{
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 1 / 1.02;
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  background-color: #fff;
  box-shadow: 0 8px 20px rgba(0,0,0,.10);
}
.linkOverlay{
  position: absolute;
  inset: 0;
  z-index: 1;
}
.meta{
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0 2px;
}
.code,
.price{
  font-size: 16px;
  font-weight: 800;
}
.code{
  color: rgba(17,24,39,.7);
  letter-spacing: .04em;
}
.price{
  color: var(--accent);
}
</style>
