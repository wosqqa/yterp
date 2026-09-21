export type UTM = {
  utm_source: string
  utm_medium: string
  utm_campaign: string
}

export function pickUtmFromQuery(query: Record<string, unknown>): UTM {
  const pick = (k: string) => {
    const v = query[k]
    return v == null ? '' : String(v).trim()
  }
  return {
    utm_source: pick('utm_source'),
    utm_medium: pick('utm_medium'),
    utm_campaign: pick('utm_campaign'),
  }
}

