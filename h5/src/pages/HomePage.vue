<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { theme, toggleTheme } = useTheme()
</script>

<template>
  <div class="min-h-dvh bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <div class="mx-auto max-w-[980px] px-5 py-10">
      <div class="flex items-start justify-between gap-4">
        <div>
          <div class="text-xs tracking-[0.22em] text-zinc-500 dark:text-zinc-400">ERP H5</div>
          <h1 class="mt-2 text-2xl font-semibold leading-tight">运营活动页项目</h1>
          <p class="mt-2 max-w-[56ch] text-sm text-zinc-600 dark:text-zinc-300">
            用于投放落地页与运营活动的独立前端工程：路由、接口封装、环境变量、活动模板。
          </p>
        </div>

        <button
          class="shrink-0 rounded-full border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-zinc-700 dark:hover:bg-zinc-900"
          type="button"
          @click="toggleTheme"
        >
          主题：{{ theme === 'dark' ? '深色' : '浅色' }}
        </button>
      </div>

      <div class="mt-10 grid gap-4 sm:grid-cols-2">
        <router-link
          class="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
          to="/campaign/demo"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-sm font-semibold">示例活动页</div>
              <div class="mt-1 text-xs text-zinc-600 dark:text-zinc-300">/campaign/demo</div>
            </div>
            <div
              class="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 transition group-hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:group-hover:border-zinc-700"
            >
              打开
            </div>
          </div>
          <div class="mt-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
            演示“按 slug 加载活动配置 + 区块渲染 + 接口失败回退到 mock”。
          </div>
        </router-link>

        <router-link
          class="group rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
          to="/sor/1"
        >
          <div class="flex items-center justify-between gap-4">
            <div>
              <div class="text-sm font-semibold">销售订单预览页</div>
              <div class="mt-1 text-xs text-zinc-600 dark:text-zinc-300">/sor/:id</div>
            </div>
            <div
              class="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs text-zinc-700 transition group-hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:group-hover:border-zinc-700"
            >
              打开
            </div>
          </div>
          <div class="mt-4 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
            页面会调用 <span class="font-semibold">/sor/get</span> 拉取订单头与明细（后端接口后续改成免登录）。
          </div>
        </router-link>

        <div
          class="rounded-2xl border border-dashed border-zinc-200 bg-white p-5 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
        >
          新增活动页面建议：
          <div class="mt-2 space-y-1 leading-relaxed">
            <div>1) 添加一个 slug（如 summer-2026）</div>
            <div>2) 后端提供 /api/h5/campaignConfig 返回 blocks</div>
            <div>3) 或者先在 src/mock/campaigns.ts 增加临时配置</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
