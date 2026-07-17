<template>
  <div class="page">
    <HeroBanner />

    <section class="controls">
      <button class="ctlBtn" @click="openFilterDrawer">
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

      <div v-if="products.length || isLoading" class="loadMoreBox">
        <div ref="loadMoreTrigger" class="loadMoreTrigger" />
        <p v-if="isLoading" class="loadMoreText">Loading...</p>
        <button v-else-if="hasMore" class="loadMoreBtn" @click="loadNextPage">Load more</button>
        <p v-else-if="products.length" class="loadMoreText">No more products</p>
        <p v-if="loadError" class="loadMoreError">{{ loadError }}</p>
      </div>
    </section>

    <FilterDrawer
      :open="filterOpen"
      :product-types="productTypes"
      :selected-types="draftSelectedTypes"
      :in-stock-only="draftInStockOnly"
      @close="closeFilterDrawer"
      @toggle-type="toggleDraftType"
      @set-in-stock-only="setDraftCollectionOnly"
      @clear="clearDraftFilters"
      @apply="applyFilters"
    />

    <SortSheet :open="sortOpen" :value="sortKey" @close="sortOpen = false" @change="sortKey = $event" />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  buildCatalogQueryParams,
  fetchCatalogCategories,
  fetchCatalogProducts,
  type CatalogCategoryOption,
  type MockProduct,
  type SortKey
} from '../composables/mockCatalog'
import { useCart } from '../composables/cart'
import { useI18n } from '../composables/i18n'

const cart = useCart()
const { t } = useI18n()
const route = useRoute()

const filterOpen = ref(false)
const sortOpen = ref(false)

const inStockOnly = ref(true)
const draftInStockOnly = ref(true)
const selectedTypes = ref<number[]>([])
const draftSelectedTypes = ref<number[]>([])
const sortKey = ref<SortKey>('featured')
const viewMode = ref<'grid' | 'list'>('grid')

const products = ref<MockProduct[]>([])
const productTypes = ref<CatalogCategoryOption[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const isLoading = ref(false)
const loadError = ref('')
const loadMoreTrigger = ref<HTMLElement | null>(null)

let loadMoreObserver: IntersectionObserver | null = null

const hasMore = computed(() => products.value.length < totalCount.value)

function buildPageQuery(page: number) {
  const brand = typeof route.query.brand === 'string' ? route.query.brand : undefined
  return {
    ...buildCatalogQueryParams(brand),
    category: selectedTypes.value.length ? selectedTypes.value.join(',') : undefined,
    data: inStockOnly.value ? 'set' : '',
    page
  }
}

async function loadCategoryOptions() {
  const brand = typeof route.query.brand === 'string' ? route.query.brand : undefined
  productTypes.value = await fetchCatalogCategories(brand, inStockOnly.value ? 'set' : '')
}

async function loadCatalogPage(page: number, mode: 'replace' | 'append') {
  if (isLoading.value) return
  isLoading.value = true
  loadError.value = ''

  try {
    const result = await fetchCatalogProducts(buildPageQuery(page))
    totalCount.value = result.count
    currentPage.value = page

    if (mode === 'append') {
      const existingIds = new Set(products.value.map((product: MockProduct) => product.id))
      const nextProducts = result.products.filter((product: MockProduct) => !existingIds.has(product.id))
      products.value = products.value.concat(nextProducts)
    } else {
      products.value = result.products
    }
  } catch (error) {
    if (mode === 'replace') {
      products.value = []
      totalCount.value = 0
      currentPage.value = 1
    }
    loadError.value = error instanceof Error ? error.message : 'Load failed'
  } finally {
    isLoading.value = false
    nextTick(() => {
      queueLoadMoreIfNeeded()
    })
  }
}

async function loadCatalog() {
  currentPage.value = 1
  totalCount.value = 0
  await loadCatalogPage(1, 'replace')
}

async function loadNextPage() {
  if (!hasMore.value || isLoading.value) return
  await loadCatalogPage(currentPage.value + 1, 'append')
}

function queueLoadMoreIfNeeded() {
  if (typeof window === 'undefined' || !loadMoreTrigger.value || isLoading.value || !hasMore.value) return
  window.requestAnimationFrame(() => {
    if (!loadMoreTrigger.value || isLoading.value || !hasMore.value) return
    const rect = loadMoreTrigger.value.getBoundingClientRect()
    if (rect.top <= window.innerHeight + 160) {
      loadNextPage()
    }
  })
}

function setupLoadMoreObserver() {
  if (typeof window === 'undefined' || !loadMoreTrigger.value) return
  loadMoreObserver?.disconnect()
  loadMoreObserver = new IntersectionObserver(
    entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        loadNextPage()
      }
    },
    { rootMargin: '200px 0px' }
  )
  loadMoreObserver.observe(loadMoreTrigger.value)
}

onMounted(() => {
  loadCategoryOptions()
  loadCatalog()
  nextTick(() => {
    setupLoadMoreObserver()
  })
})

onBeforeUnmount(() => {
  loadMoreObserver?.disconnect()
})

watch(
  () => route.query.brand,
  () => {
    selectedTypes.value = []
    draftSelectedTypes.value = []
    draftInStockOnly.value = inStockOnly.value
    loadCategoryOptions()
    loadCatalog()
  }
)

watch(loadMoreTrigger, () => {
  nextTick(() => {
    setupLoadMoreObserver()
  })
})

function arraysEqual(a: number[], b: number[]) {
  if (a.length !== b.length) return false
  return a.every((value, index) => value === b[index])
}

function openFilterDrawer() {
  draftInStockOnly.value = inStockOnly.value
  draftSelectedTypes.value = selectedTypes.value.slice()
  filterOpen.value = true
}

function closeFilterDrawer() {
  filterOpen.value = false
}

function toggleDraftType(typeId: number) {
  const set = new Set(draftSelectedTypes.value)
  set.has(typeId) ? set.delete(typeId) : set.add(typeId)
  draftSelectedTypes.value = Array.from(set)
}

function setDraftCollectionOnly(value: boolean) {
  draftInStockOnly.value = value
}

async function toggleType(typeId: number) {
  const set = new Set(selectedTypes.value)
  set.has(typeId) ? set.delete(typeId) : set.add(typeId)
  selectedTypes.value = Array.from(set)
  draftSelectedTypes.value = selectedTypes.value.slice()
  await loadCatalog()
}

async function setCollectionOnly(value: boolean) {
  if (inStockOnly.value === value) return
  inStockOnly.value = value
  draftInStockOnly.value = value
  selectedTypes.value = []
  draftSelectedTypes.value = []
  await loadCategoryOptions()
  await loadCatalog()
}

async function applyFilters() {
  const collectionChanged = draftInStockOnly.value !== inStockOnly.value
  const typeChanged = !arraysEqual(draftSelectedTypes.value, selectedTypes.value)
  inStockOnly.value = draftInStockOnly.value
  selectedTypes.value = draftSelectedTypes.value.slice()
  filterOpen.value = false

  if (!collectionChanged && !typeChanged) return

  if (collectionChanged) {
    await loadCategoryOptions()
    const validCategoryIds = new Set(productTypes.value.map(type => type.id))
    selectedTypes.value = selectedTypes.value.filter(typeId => validCategoryIds.has(typeId))
    draftSelectedTypes.value = selectedTypes.value.slice()
  }

  await loadCatalog()
}

function clearDraftFilters() {
  draftInStockOnly.value = false
  draftSelectedTypes.value = []
}

function clearFilters() {
  const needReload = selectedTypes.value.length > 0 || inStockOnly.value
  inStockOnly.value = false
  if (!needReload) return
  selectedTypes.value = []
  draftSelectedTypes.value = []
  draftInStockOnly.value = false
  loadCategoryOptions()
  loadCatalog()
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
  return products.value.slice()
})

const visibleProducts = computed(() => sortProducts(filteredProducts.value, sortKey.value))

const activeChips = computed(() => {
  const chips: Array<{ key: string; label: string; remove: () => void }> = []
  selectedTypes.value.forEach(typeId => {
    const typeName = productTypes.value.find(type => type.id === typeId)?.label || String(typeId)
    chips.push({
      key: `type:${typeId}`,
      label: `${t('productType')}: ${typeName}`,
      remove: () => toggleType(typeId)
    })
  })
  if (inStockOnly.value) {
    chips.push({
      key: 'stock',
      label: t('inStockOnly'),
      remove: () => setCollectionOnly(false)
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
.loadMoreBox{
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 18px 0 8px;
}
.loadMoreTrigger{
  width: 100%;
  height: 1px;
}
.loadMoreBtn{
  border: 1px solid rgba(17,17,17,.12);
  background: #fff;
  color: #111827;
  border-radius: 999px;
  padding: 10px 18px;
  font-size: 13px;
  cursor: pointer;
}
.loadMoreText{
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
.loadMoreError{
  margin: 0;
  color: #b91c1c;
  font-size: 13px;
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
