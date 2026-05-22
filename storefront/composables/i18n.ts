import { computed } from 'vue'

export type Locale = 'zh-CN' | 'en' | 'ms-MY'
export type Currency = 'CNY' | 'MYR' | 'USD'

const dictionary = {
  'zh-CN': {
    filter: '筛选',
    sortBy: '排序',
    clear: '清空',
    apply: '应用',
    inStock: '有货',
    inStockOnly: '仅显示有货',
    productType: '产品类型',
    availability: '库存',
    discount: '优惠',
    cart: '购物车',
    cartEmpty: '购物车为空',
    shopNow: '去选品',
    addToCart: '加入购物车',
    outOfStock: '缺货',
    subtotal: '小计',
    viewCart: '查看购物车',
    checkoutMock: '提交订单（模拟）',
    orderSubmitted: '已模拟提交订单',
    backToList: '返回列表',
    notFound: '未找到该商品（模拟数据）'
  },
  en: {
    filter: 'Filter',
    sortBy: 'Sort by',
    clear: 'Clear',
    apply: 'Apply',
    inStock: 'In stock',
    inStockOnly: 'In stock only',
    productType: 'Product type',
    availability: 'Availability',
    discount: 'DISCOUNT',
    cart: 'Cart',
    cartEmpty: 'Cart is empty',
    shopNow: 'Shop now',
    addToCart: 'Add to cart',
    outOfStock: 'Out of stock',
    subtotal: 'Subtotal',
    viewCart: 'View cart',
    checkoutMock: 'Checkout (mock)',
    orderSubmitted: 'Submitted (mock)',
    backToList: 'Back to list',
    notFound: 'Product not found (mock)'
  },
  'ms-MY': {
    filter: 'Tapis',
    sortBy: 'Susun',
    clear: 'Kosongkan',
    apply: 'Guna',
    inStock: 'Ada stok',
    inStockOnly: 'Stok sahaja',
    productType: 'Jenis produk',
    availability: 'Ketersediaan',
    discount: 'DISKAUN',
    cart: 'Troli',
    cartEmpty: 'Troli kosong',
    shopNow: 'Beli sekarang',
    addToCart: 'Tambah ke troli',
    outOfStock: 'Habis stok',
    subtotal: 'Jumlah kecil',
    viewCart: 'Lihat troli',
    checkoutMock: 'Hantar pesanan (mock)',
    orderSubmitted: 'Dihantar (mock)',
    backToList: 'Kembali',
    notFound: 'Produk tiada (mock)'
  }
} as const

type DictKey = keyof typeof dictionary.en

function localeToCurrency(locale: Locale): Currency {
  if (locale === 'ms-MY') return 'MYR'
  if (locale === 'en') return 'USD'
  return 'CNY'
}

export function useI18n() {
  const locale = useState<Locale>('i18n:locale', () => 'zh-CN')
  const currency = useState<Currency>('i18n:currency', () => localeToCurrency(locale.value))

  const langLabel = computed(() => (locale.value === 'zh-CN' ? '中文' : locale.value === 'ms-MY' ? 'MY' : 'EN'))

  function setLocale(next: Locale) {
    locale.value = next
    currency.value = localeToCurrency(next)
  }

  function t(key: DictKey) {
    const pack = dictionary[locale.value] || dictionary.en
    return String((pack as any)[key] || (dictionary.en as any)[key] || key)
  }

  return { locale, currency, langLabel, setLocale, t }
}
