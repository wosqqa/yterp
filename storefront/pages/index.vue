<template>
  <div class="page">
    <HeroBanner />

    <section class="controls">
      <button class="ctlBtn" @click="filterOpen = true">
        <span class="ctlIcon sliders" />
        <span>{{ t('filter') }}</span>
      </button>

      <div class="viewToggle">
        <button class="viewBtn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'" aria-label="List view">
          <span class="listIcon" />
        </button>
        <button class="viewBtn" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'" aria-label="Grid view">
          <span class="gridIcon" />
        </button>
      </div>

      <button class="ctlBtn ctlBtnRight" @click="sortOpen = true">
        <span class="dots" />
        <span class="ctlText">{{ t('sortBy') }}</span>
        <span class="chev" />
      </button>
    </section>

    <section class="chips" v-if="activeChips.length">
      <button v-for="c in activeChips" :key="c.key" class="chip" @click="c.remove">
        <span class="x" />
        <span class="chipText">{{ c.label }}</span>
      </button>
      <button class="clearBtn" @click="clearFilters">{{ t('clear') }}</button>
    </section>

    <section class="gridWrap">
      <div class="grid" :class="{ list: viewMode === 'list' }">
        <ProductCard v-for="p in visibleProducts" :key="p.id" :product="p" @add="cart.add(p, 1)" />
      </div>
    </section>

    <FilterDrawer
      :open="filterOpen"
      :product-types="productTypes"
      :selected-types="selectedTypes"
      :in-stock-only="inStockOnly"
      @close="filterOpen = false"
      @toggle-type="toggleType"
      @set-in-stock-only="inStockOnly = $event"
      @clear="clearFilters"
    />

    <SortSheet :open="sortOpen" :value="sortKey" @close="sortOpen = false" @change="sortKey = $event" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useMockCatalog, type MockProduct, type SortKey } from '../composables/mockCatalog'
import { useCart } from '../composables/cart'
import { useI18n } from '../composables/i18n'

const { productTypes, products } = useMockCatalog()
const cart = useCart()
const { t } = useI18n()

const filterOpen = ref(false)
const sortOpen = ref(false)

const inStockOnly = ref(false)
const selectedTypes = ref<string[]>(['Backpacks'])
const sortKey = ref<SortKey>('featured')
const viewMode = ref<'grid' | 'list'>('grid')

function toggleType(t: string) {
  const set = new Set(selectedTypes.value)
  set.has(t) ? set.delete(t) : set.add(t)
  selectedTypes.value = Array.from(set)
}

function clearFilters() {
  inStockOnly.value = false
  selectedTypes.value = []
}

function sortProducts(list: MockProduct[], key: SortKey) {
  const copy = list.slice()
  if (key === 'priceAsc') return copy.sort((a, b) => a.priceCny - b.priceCny)
  if (key === 'priceDesc') return copy.sort((a, b) => b.priceCny - a.priceCny)
  if (key === 'alphaAsc') return copy.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
  if (key === 'alphaDesc') return copy.sort((a, b) => (b.title || '').localeCompare(a.title || ''))
  return copy
}

const filteredProducts = computed(() => {
  let out = products.slice()
  if (selectedTypes.value.length) out = out.filter(p => selectedTypes.value.includes(p.productType))
  if (inStockOnly.value) out = out.filter(p => p.inStock)
  return out
})

const visibleProducts = computed(() => sortProducts(filteredProducts.value, sortKey.value))

const activeChips = computed(() => {
  const chips: Array<{ key: string; label: string; remove: () => void }> = []
  selectedTypes.value.forEach(typeName => {
    chips.push({
      key: `type:${typeName}`,
      label: `${t('productType')}: ${typeName}`,
      remove: () => toggleType(typeName)
    })
  })
  if (inStockOnly.value) {
    chips.push({
      key: 'stock',
      label: t('inStockOnly'),
      remove: () => (inStockOnly.value = false)
    })
  }
  return chips
})
</script>

<style scoped>
.page{
  max-width: 1200px;
  margin: 0 auto;
}

.controls{
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
}
.ctlBtn{
  border: 0;
  background: transparent;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 6px;
  font-size: 14px;
  color: var(--fg);
  cursor: pointer;
}
.ctlBtnRight{
  gap: 8px;
}
.viewToggle{
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.viewBtn{
  width: 38px;
  height: 38px;
  border: 1px solid rgba(17,17,17,.10);
  border-radius: 12px;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.viewBtn.active{
  border-color: rgba(17,17,17,.35);
  background: rgba(17,17,17,.04);
}
.listIcon{
  width: 18px;
  height: 12px;
  background:
    linear-gradient(#111827,#111827) 0 0/18px 2px no-repeat,
    linear-gradient(#111827,#111827) 0 5px/18px 2px no-repeat,
    linear-gradient(#111827,#111827) 0 10px/18px 2px no-repeat;
  opacity: .9;
}
.gridIcon{
  width: 16px;
  height: 16px;
  background:
    radial-gradient(circle, #111827 2px, transparent 3px) 0 0/8px 8px;
  opacity: .9;
}
.ctlText{
  letter-spacing: 0.12em;
  font-size: 12px;
  color: #111827;
}
.sliders{
  width: 18px;
  height: 18px;
  position: relative;
}
.sliders::before,
.sliders::after{
  content:"";
  position:absolute;
  left:0;
  right:0;
  height:2px;
  background: #111827;
  border-radius: 999px;
}
.sliders::before{ top:5px; }
.sliders::after{ top:12px; }
.sliders{
  background:
    radial-gradient(circle at 6px 6px, #111827 0 3px, transparent 3px),
    radial-gradient(circle at 12px 13px, #111827 0 3px, transparent 3px);
}
.dots{
  width: 16px;
  height: 16px;
  background:
    radial-gradient(circle, #111827 2px, transparent 3px) 0 0/8px 8px;
  opacity: .9;
}
.chev{
  width: 10px;
  height: 10px;
  border-right: 2px solid #111827;
  border-bottom: 2px solid #111827;
  transform: rotate(45deg);
  margin-top: -2px;
}

.chips{
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  flex-wrap: wrap;
}
.chip{
  border: 1px solid var(--border);
  background: #fff;
  border-radius: 999px;
  padding: 10px 12px;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}
.x{
  width: 10px;
  height: 10px;
  position: relative;
}
.x::before,
.x::after{
  content:"";
  position:absolute;
  left: 4px;
  top: 0;
  width: 2px;
  height: 10px;
  background: #111827;
  border-radius: 999px;
}
.x::before{ transform: rotate(45deg); }
.x::after{ transform: rotate(-45deg); }
.chipText{
  font-size: 12px;
  color: #111827;
}
.clearBtn{
  border: 0;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-size: 13px;
  padding: 8px 4px;
}

.gridWrap{
  padding: 14px;
}
.grid{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}
.grid.list{
  grid-template-columns: 1fr;
}

@media (min-width: 900px){
  .controls{
    padding: 14px 18px;
  }
  .gridWrap{
    padding: 18px;
  }
  .grid{
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 18px;
  }
  .grid.list{
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
