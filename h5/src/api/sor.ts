import type { ApiResponse } from './types'
import { http } from './http'

export type SorGetRequest = {
  parm: number
}

export type SorClass = Record<string, unknown> & {
  id: number
  number?: string
  time?: string
  arrival?: string
  total?: number
  actual?: number
  data?: string
  more?: Record<string, unknown>
}

export type SorInfoLine = Record<string, unknown> & {
  id: number
  pid: number
  goods: number
  nums?: number
  price?: number
  total?: number
  data?: string
  goodsData?: Record<string, unknown>
  warehouseData?: Record<string, unknown>
}

export type SorGetPayload = {
  class: SorClass
  info: SorInfoLine[]
}

export async function fetchSorGet(parm: number): Promise<SorGetPayload> {
  const resp = await http.post<ApiResponse<SorGetPayload>>('/sor/get', { parm } satisfies SorGetRequest)
  const data = resp.data
  if (data && data.state === 'success' && data.info) return data.info
  const msg = (data && (data.message || (data.info as unknown as string))) || '订单获取失败'
  throw new Error(msg)
}

