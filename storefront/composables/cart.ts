import type { MockProduct } from './mockCatalog'

export type CartLine = {
  id: string
  productId: string
  title: string
  priceCny: number
  qty: number
}

export function useCart() {
  const lines = useState<CartLine[]>('cart:lines', () => [])

  const count = computed(() => lines.value.reduce((acc, l) => acc + (Number(l.qty) || 0), 0))
  const subtotalCny = computed(() => lines.value.reduce((acc, l) => acc + (Number(l.qty) || 0) * (Number(l.priceCny) || 0), 0))

  function add(product: MockProduct, qty = 1) {
    const n = Number(qty) || 1
    const idx = lines.value.findIndex(l => l.productId === product.id)
    if (idx >= 0) {
      const next = (Number(lines.value[idx].qty) || 0) + n
      lines.value[idx] = { ...lines.value[idx], qty: Math.max(1, next) }
      return
    }
    lines.value.unshift({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      title: product.title,
      priceCny: product.priceCny,
      qty: Math.max(1, n)
    })
  }

  function remove(lineId: string) {
    lines.value = lines.value.filter(l => l.id !== lineId)
  }

  function setQty(lineId: string, qty: number) {
    const n = Number(qty)
    if (!Number.isFinite(n)) return
    const idx = lines.value.findIndex(l => l.id === lineId)
    if (idx < 0) return
    if (n <= 0) {
      remove(lineId)
      return
    }
    lines.value[idx] = { ...lines.value[idx], qty: n }
  }

  function clear() {
    lines.value = []
  }

  return { lines, count, subtotalCny, add, remove, setQty, clear }
}
