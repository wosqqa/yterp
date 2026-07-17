export type MockProduct = {
  id: string
  brand: string
  title: string
  productType: string
  slug: string
  inStock: boolean
  priceCny: number
  compareAtCny?: number
  image: { bg: string; label: string }
  imageUrl?: string
  name?: string
  category?: string
  categoryId?: number
  number?: string
  spec?: string
  code?: string
  data?: string
  stockQty?: number
  categorySort?: number
  categoryData?: { id?: number; pid?: number; name?: string; sort?: number; details?: string }
}

export type CatalogCategoryOption = {
  id: number
  name: string
  label: string
  sort: number
  pid?: number
}

export type SortKey =
  | 'featured'
  | 'relevance'
  | 'bestSelling'
  | 'alphaAsc'
  | 'alphaDesc'
  | 'priceAsc'
  | 'priceDesc'
  | 'dateAsc'
  | 'dateDesc'

const DEFAULT_PRODUCT_IMAGE = "url('https://cos.51ppy.com/smiggle/L129.png')"

type GoodsApiItem = Partial<MockProduct> & {
  image?: { bg?: string; label?: string }
}

type GoodsApiResponse = {
  state?: string
  count?: number
  info?: GoodsApiItem[]
}

type GoodsCategoryApiResponse = {
  state?: string
  info?: CatalogCategoryOption[]
}

type CatalogQueryParams = Record<string, string | number | undefined>

function buildGoodsApiUrl() {
  const config = useRuntimeConfig()
  return `${String(config.public.apiBase || '').replace(/\/$/, '')}/api/publicGoods`
}

function buildGoodsCategoriesApiUrl() {
  const config = useRuntimeConfig()
  return `${String(config.public.apiBase || '').replace(/\/$/, '')}/api/publicGoodsCategories`
}

function logCatalogApi(action: string, params: CatalogQueryParams, response: GoodsApiResponse) {
  if (typeof window === 'undefined') return
  console.groupCollapsed(`[catalog api] ${action}`)
  console.log('request params:', params)
  console.log('response data:', response)
  console.groupEnd()
}

function normalizeProduct(item: GoodsApiItem): MockProduct {
  return {
    id: String(item.id || ''),
    brand: String(item.brand || ''),
    title: String(item.title || item.name || ''),
    productType: String(item.productType || item.category || ''),
    slug: String(item.slug || ''),
    inStock: Boolean(item.inStock),
    priceCny: Number(item.priceCny || 0),
    compareAtCny: item.compareAtCny == null ? undefined : Number(item.compareAtCny),
    image: {
      bg: item.image?.bg || DEFAULT_PRODUCT_IMAGE,
      label: String(item.image?.label || item.number || item.brand || item.title || '')
    },
    imageUrl: item.imageUrl ? String(item.imageUrl) : undefined,
    name: item.name ? String(item.name) : undefined,
    category: item.category ? String(item.category) : undefined,
    categoryId: item.categoryData?.id == null ? undefined : Number(item.categoryData.id),
    number: item.number ? String(item.number) : undefined,
    spec: item.spec ? String(item.spec) : undefined,
    code: item.code ? String(item.code) : undefined,
    data: item.data ? String(item.data) : undefined,
    stockQty: item.stockQty == null ? undefined : Number(item.stockQty),
    categorySort: item.categorySort == null ? undefined : Number(item.categorySort),
    categoryData: item.categoryData
  }
}

export function getProductTypes(products: MockProduct[]) {
  const types: CatalogCategoryOption[] = []
  const seen = new Set<number>()
  for (const product of products) {
    const id = Number(product.categoryId || 0)
    if (!id || !product.productType || seen.has(id)) continue
    seen.add(id)
    types.push({
      id,
      name: String(product.categoryData?.name || product.category || product.productType || ''),
      label: String(product.productType || ''),
      sort: Number(product.categorySort || 999999),
      pid: product.categoryData?.pid == null ? undefined : Number(product.categoryData.pid)
    })
  }
  return types.sort((a, b) => a.sort - b.sort || a.id - b.id)
}

export function buildCatalogQueryParams(brand?: string): CatalogQueryParams {
  return {
    brand: brand || 'smiggle',
    category: undefined,
    code: '',
    data: '',
    limit: 30,
    name: '',
    number: '',
    page: 1,
    sort: 'numberAsc',
    spec: '',
    type: ''
  }
}

export async function fetchCatalogProducts(params?: CatalogQueryParams) {
  const queryParams = params || {}
  const response = await $fetch<GoodsApiResponse>(buildGoodsApiUrl(), {
    query: queryParams
  })
  logCatalogApi('list', queryParams, response)
  const products = Array.isArray(response?.info) ? response.info.map(normalizeProduct) : []
  return {
    count: Number(response?.count || products.length),
    products,
    productTypes: getProductTypes(products)
  }
}

export async function fetchCatalogCategories(brand?: string, data?: string) {
  const queryParams = {
    brand: brand || 'smiggle',
    data: data || undefined
  }
  const response = await $fetch<GoodsCategoryApiResponse>(buildGoodsCategoriesApiUrl(), {
    query: queryParams
  })
  if (typeof window !== 'undefined') {
    console.groupCollapsed('[catalog api] categories')
    console.log('request params:', queryParams)
    console.log('response data:', response)
    console.groupEnd()
  }
  const options = Array.isArray(response?.info) ? response.info : []
  return options.sort((a, b) => Number(a.sort || 999999) - Number(b.sort || 999999) || Number(a.id || 0) - Number(b.id || 0))
}

export async function fetchCatalogProductBySlug(slug: string, brand?: string) {
  const queryParams = {
    ...buildCatalogQueryParams(brand),
    slug,
    limit: 1
  }
  const response = await $fetch<GoodsApiResponse>(buildGoodsApiUrl(), {
    query: queryParams
  })
  logCatalogApi('detail', queryParams, response)
  const first = Array.isArray(response?.info) && response.info.length ? response.info[0] : null
  return first ? normalizeProduct(first) : null
}
