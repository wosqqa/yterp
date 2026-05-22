export type HeroSlide = {
  id: string
  image: string
  note?: string
  brand?: string
  title: string
  sub?: string
  href?: string
  target?: '_self' | '_blank'
}

export const heroConfig = {
  autoplayMs: 4500,
  pauseOnHover: true,
  slides: [
    {
      id: 'all-products',
      image: '/hero/slide-1.svg',
      title: 'All Products',
      sub: 'Discover new arrivals and best sellers',
      href: '/',
      target: '_self'
    },
    {
      id: 'smiggle',
      image: '/hero/slide-2.svg',
      note: 'Happy Hours discounts of 5%-35% on top of all other discounts have started for',
      brand: 'Smiggle',
      title: "Are you ready to make school fun with Smiggle, the world's coolest and cutest school products?",
      sub: 'Now with all its products, it is with you only at Dinossi Stores and Dinossi.Com',
      href: '/products/smiggle-sonic-classic-school-backpack',
      target: '_self'
    },
    {
      id: 'bundle',
      image: '/hero/slide-3.svg',
      brand: 'Dinossi',
      title: 'Back to school bundles',
      sub: 'Mix & match and submit your order to the backend (mock)',
      href: '/cart',
      target: '_self'
    }
  ] satisfies HeroSlide[]
} as const

