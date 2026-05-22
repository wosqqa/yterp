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

export function useMockCatalog() {
  const productTypes = [
    'Backpacks',
    'Bath Time',
    'Bento Lunch Boxes',
    'Book Bags',
    "Children's Wallets",
    'Coloring Books',
    'Erasers',
    'Game Make-up',
    'Headphones',
    'Key chain',
    'Kindergarten Bags',
    'Lunch Boxes',
    'Notebooks',
    'Painting',
    'Pencil Cases',
    'Pencils',
    'Rulers and Measuring Products',
    'School Bag Sets',
    'Sharpeners'
  ]

  const products: MockProduct[] = [
    {
      id: 'p1',
      brand: 'SMIGGLE',
      title: 'Smiggle - Sonic Classic School Backpack',
      productType: 'Backpacks',
      slug: 'smiggle-sonic-classic-school-backpack',
      inStock: true,
      priceCny: 70,
      compareAtCny: 90,
      image: { bg: 'linear-gradient(135deg,#1b5cff,#44d3ff)', label: 'SONIC' }
    },
    {
      id: 'p2',
      brand: 'SMIGGLE',
      title: 'Smiggle - Livewire Classic Backpack',
      productType: 'Backpacks',
      slug: 'smiggle-livewire-classic-backpack',
      inStock: true,
      priceCny: 86,
      compareAtCny: 103,
      image: { bg: 'linear-gradient(135deg,#111827,#b45309)', label: 'LIVEWIRE' }
    },
    {
      id: 'p3',
      brand: 'SMIGGLE',
      title: 'Smiggle - Marvel Spiderman School Backpack',
      productType: 'Backpacks',
      slug: 'smiggle-marvel-spiderman-school-backpack',
      inStock: false,
      priceCny: 79,
      compareAtCny: 92,
      image: { bg: 'linear-gradient(135deg,#ef4444,#111827)', label: 'MARVEL' }
    },
    {
      id: 'p4',
      brand: 'SMIGGLE',
      title: 'Smiggle - Striker Classic Backpack',
      productType: 'Backpacks',
      slug: 'smiggle-striker-classic-backpack',
      inStock: true,
      priceCny: 62,
      compareAtCny: 74,
      image: { bg: 'linear-gradient(135deg,#111827,#fb7185)', label: 'STRIKER' }
    },
    {
      id: 'p5',
      brand: 'DINOSSI',
      title: 'Dinossi - Cozy Lunch Box Set',
      productType: 'Lunch Boxes',
      slug: 'dinossi-cozy-lunch-box-set',
      inStock: true,
      priceCny: 45,
      compareAtCny: 59,
      image: { bg: 'linear-gradient(135deg,#10b981,#a7f3d0)', label: 'LUNCH' }
    },
    {
      id: 'p6',
      brand: 'DINOSSI',
      title: 'Dinossi - Pencil Case Duo',
      productType: 'Pencil Cases',
      slug: 'dinossi-pencil-case-duo',
      inStock: true,
      priceCny: 19,
      compareAtCny: 25,
      image: { bg: 'linear-gradient(135deg,#f59e0b,#fde68a)', label: 'PENCIL' }
    },
    {
      id: 'p7',
      brand: 'DINOSSI',
      title: 'Dinossi - Notebook A5 (Set of 3)',
      productType: 'Notebooks',
      slug: 'dinossi-notebook-a5-set-of-3',
      inStock: true,
      priceCny: 14,
      compareAtCny: 19,
      image: { bg: 'linear-gradient(135deg,#a78bfa,#fbcfe8)', label: 'A5' }
    },
    {
      id: 'p8',
      brand: 'DINOSSI',
      title: 'Dinossi - Kids Headphones',
      productType: 'Headphones',
      slug: 'dinossi-kids-headphones',
      inStock: true,
      priceCny: 69,
      compareAtCny: 89,
      image: { bg: 'linear-gradient(135deg,#0ea5e9,#1f2937)', label: 'AUDIO' }
    }
  ]

  return { productTypes, products }
}
