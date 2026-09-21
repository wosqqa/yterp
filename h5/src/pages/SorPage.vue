<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchSorGet, type SorGetPayload, type SorInfoLine } from '../api/sor'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const errorText = ref('')
const payload = ref<SorGetPayload | null>(null)

const idText = computed(() => {
  const fromPath = route.params.id
  const fromQuery = route.query.parm
  const v = fromPath != null ? String(fromPath) : fromQuery != null ? String(fromQuery) : ''
  return v.trim()
})

const orderId = computed(() => {
  const n = Number(idText.value)
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0
})

const order = computed(() => payload.value?.class || null)
const lines = computed(() => (Array.isArray(payload.value?.info) ? payload.value!.info : []))

const assetPrefix = (import.meta.env.VITE_ASSET_PREFIX as string | undefined) || ''
const apiBase = (import.meta.env.VITE_API_BASE as string | undefined) || ''
const joinUrl = (u: string) => {
  const s = String(u || '').trim()
  if (!s) return ''
  if (/^https?:\/\//i.test(s)) return s
  const prefix = String(assetPrefix || apiBase || '').trim()
  if (!prefix) return s
  if (prefix.endsWith('/') && s.startsWith('/')) return prefix + s.slice(1)
  if (!prefix.endsWith('/') && !s.startsWith('/')) return prefix + '/' + s
  return prefix + s
}

const parseImgs = (raw: unknown) => {
  if (Array.isArray(raw)) return raw.map((v) => String(v)).filter((v) => v.trim() !== '')
  if (raw == null) return []
  const text = String(raw).trim()
  if (!text) return []
  if (text[0] === '[') {
    try {
      const arr = JSON.parse(text)
      if (Array.isArray(arr)) return arr.map((v) => String(v)).filter((v) => v.trim() !== '')
    } catch {}
  }
  if (text.includes(',')) return text.split(',').map((v) => v.trim()).filter(Boolean)
  return [text]
}

const getGoodsImg = (line: SorInfoLine) => {
  const goods = line.goodsData || {}
  const imgs = parseImgs((goods as any).imgs)
  if (imgs.length > 0) return joinUrl(imgs[0])
  const img = (goods as any).img
  return img ? joinUrl(String(img)) : ''
}

const getGoodsNumber = (line: SorInfoLine) => {
  const goods = line.goodsData || {}
  const n = (goods as any).number
  return n == null ? '' : String(n).trim()
}

const getGoodsName = (line: SorInfoLine) => {
  const goods = line.goodsData || {}
  const n = (goods as any).name
  return n == null ? '' : String(n).trim()
}

const fmtMoney = (v: unknown) => {
  const n = Number(v)
  if (!Number.isFinite(n)) return ''
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

const load = async () => {
  const id = orderId.value
  if (!id) {
    payload.value = null
    errorText.value = '订单 ID 不正确'
    return
  }
  loading.value = true
  errorText.value = ''
  try {
    payload.value = await fetchSorGet(id)
  } catch (e) {
    payload.value = null
    errorText.value = e instanceof Error ? e.message : '订单加载失败'
  } finally {
    loading.value = false
  }
}

watchEffect(() => {
  orderId.value && load()
})

const jump = () => {
  const n = Number(inputId.value)
  const id = Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0
  if (!id) return
  router.push({ name: 'sor', params: { id: String(id) } })
}

const inputId = ref('')
watchEffect(() => {
  inputId.value = idText.value
})
</script>

<template>
  <div class="min-h-dvh bg-zinc-50 text-zinc-900">
    <div class="mx-auto max-w-[1100px] px-5 py-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <router-link class="text-xs font-medium text-zinc-600 hover:text-zinc-900" to="/">
            返回
          </router-link>
          <div class="text-sm font-semibold">销售订单</div>
          <div v-if="order" class="text-xs text-zinc-500">NO. {{ String(order.number || '') }}</div>
        </div>

        <div class="flex items-center gap-2">
          <input
            v-model="inputId"
            class="h-9 w-[160px] rounded-xl border border-zinc-200 bg-white px-3 text-sm outline-none ring-0 focus:border-zinc-300"
            placeholder="输入订单ID"
            inputmode="numeric"
          />
          <button
            class="h-9 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-800"
            type="button"
            @click="jump"
          >
            打开
          </button>
        </div>
      </div>

      <div class="mt-5 rounded-[22px] border border-zinc-200 bg-white p-5">
        <div class="grid gap-4 sm:grid-cols-3">
          <div class="text-xs text-zinc-500">
            <div class="font-medium text-zinc-900">单据日期</div>
            <div class="mt-1">{{ order ? String(order.time || '') : '-' }}</div>
          </div>
          <div class="text-xs text-zinc-500">
            <div class="font-medium text-zinc-900">交期</div>
            <div class="mt-1">{{ order ? String(order.arrival || '') : '-' }}</div>
          </div>
          <div class="text-xs text-zinc-500">
            <div class="font-medium text-zinc-900">金额</div>
            <div class="mt-1">
              <span class="text-zinc-900">{{ order ? fmtMoney(order.total) : '-' }}</span>
              <span v-if="order && order.actual != null" class="ml-2 text-zinc-500">实际：{{ fmtMoney(order.actual) }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="loading" class="mt-6 space-y-3">
        <div class="h-10 animate-pulse rounded-2xl bg-zinc-200/70"></div>
        <div class="h-40 animate-pulse rounded-2xl bg-zinc-200/70"></div>
      </div>

      <div
        v-else-if="errorText"
        class="mt-6 rounded-[22px] border border-rose-200 bg-white p-5 text-sm text-rose-700"
      >
        {{ errorText }}
      </div>

      <div v-else class="mt-6 overflow-hidden rounded-[22px] border border-zinc-200 bg-white">
        <div class="grid grid-cols-[52px_1fr_90px_110px_110px] border-b border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-700">
          <div class="px-3 py-3">NO.</div>
          <div class="px-3 py-3">PICTURE</div>
          <div class="px-3 py-3 text-right">QTY</div>
          <div class="px-3 py-3 text-right">U/PRICE</div>
          <div class="px-3 py-3 text-right">AMOUNT</div>
        </div>

        <div v-for="(line, idx) in lines" :key="line.id" class="grid grid-cols-[52px_1fr_90px_110px_110px] border-b border-zinc-100">
          <div class="px-3 py-4 text-xs text-zinc-600">{{ idx + 1 }}</div>
          <div class="px-3 py-4">
            <div class="flex gap-3">
              <div class="h-20 w-20 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                <img v-if="getGoodsImg(line)" :src="getGoodsImg(line)" class="h-full w-full object-contain" />
              </div>
              <div class="min-w-0">
                <div class="text-xs font-semibold text-zinc-900">{{ getGoodsNumber(line) }}</div>
                <div class="mt-1 line-clamp-2 text-xs text-zinc-600">{{ getGoodsName(line) }}</div>
                <div v-if="line.data" class="mt-1 text-[11px] text-zinc-500">备注：{{ String(line.data) }}</div>
              </div>
            </div>
          </div>
          <div class="px-3 py-4 text-right text-sm font-semibold text-rose-600">
            {{ line.nums != null ? fmtMoney(line.nums) : '' }}
          </div>
          <div class="px-3 py-4 text-right text-xs text-zinc-700">
            {{ line.price != null ? fmtMoney(line.price) : '' }}
          </div>
          <div class="px-3 py-4 text-right text-xs font-semibold text-zinc-900">
            {{ line.total != null ? fmtMoney(line.total) : '' }}
          </div>
        </div>

        <div class="grid grid-cols-[52px_1fr_90px_110px_110px] bg-white">
          <div class="px-3 py-4"></div>
          <div class="px-3 py-4 text-right text-xs font-semibold text-zinc-700">TOTAL</div>
          <div class="px-3 py-4 text-right text-sm font-semibold text-zinc-900">
            {{
              fmtMoney(
                lines.reduce((sum, l) => sum + (Number.isFinite(Number(l.nums)) ? Number(l.nums) : 0), 0),
              )
            }}
          </div>
          <div class="px-3 py-4"></div>
          <div class="px-3 py-4 text-right text-sm font-semibold text-zinc-900">
            {{ order ? fmtMoney(order.total) : '' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

