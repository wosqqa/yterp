export function useUi() {
  const cartOpen = useState<boolean>('ui:cartOpen', () => false)

  function openCart() {
    cartOpen.value = true
  }

  function closeCart() {
    cartOpen.value = false
  }

  function toggleCart() {
    cartOpen.value = !cartOpen.value
  }

  return { cartOpen, openCart, closeCart, toggleCart }
}
