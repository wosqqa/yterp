import { computed } from 'vue'
import { useI18n, type Currency } from './i18n'
import { siteConfig } from '../config/site'

type FxRates = Record<Currency, number>

export function useMoney() {
  const { locale, currency } = useI18n()

  const rates = computed<FxRates>(() => {
    const cny = Number((siteConfig as any)?.fxRates?.CNY)
    const myr = Number((siteConfig as any)?.fxRates?.MYR)
    const usd = Number((siteConfig as any)?.fxRates?.USD)
    return {
      CNY: Number.isFinite(cny) && cny > 0 ? cny : 1,
      MYR: Number.isFinite(myr) && myr > 0 ? myr : 0.65,
      USD: Number.isFinite(usd) && usd > 0 ? usd : 0.14
    }
  })

  function convertFromCny(amountCny: number) {
    const n = Number(amountCny)
    const r = rates.value[currency.value] || 1
    if (!Number.isFinite(n) || !Number.isFinite(r)) return 0
    return n * r
  }

  function format(amountCny: number) {
    const v = convertFromCny(amountCny)
    const cur = currency.value
    const loc = locale.value
    try {
      return new Intl.NumberFormat(loc, { style: 'currency', currency: cur }).format(v)
    } catch (e) {
      const fixed = Number.isFinite(v) ? v.toFixed(2) : '0.00'
      return `${cur} ${fixed}`
    }
  }

  return { currency, locale, rates, convertFromCny, format }
}
