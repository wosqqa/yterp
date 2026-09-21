<script setup lang="ts">
const title = '运营活动落地页（示例）'
const subtitle = '这是多页面模式下的独立页面示例：/promo.html。后续每个活动都可以新增一个 html + entry + 页面组件。'
</script>

<template>
  <div class="min-h-dvh bg-white text-zinc-900">
    <div class="mx-auto max-w-[980px] px-5 py-14">
      <div class="text-xs tracking-[0.22em] text-zinc-500">PROMO</div>
      <h1 class="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">{{ title }}</h1>
      <p class="mt-4 max-w-[66ch] text-sm leading-relaxed text-zinc-600 sm:text-base">
        {{ subtitle }}
      </p>

      <div class="mt-10 rounded-3xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-700">
        <div class="font-semibold text-zinc-900">怎么新增一个新页面</div>
        <div class="mt-3 space-y-2 text-xs leading-relaxed text-zinc-700">
          <div>1) 在根目录新增：xxx.html（参考 promo.html）</div>
          <div>2) 新增入口：src/entries/xxx.ts</div>
          <div>3) 新增页面：src/pages/XxxLanding.vue</div>
          <div>4) 在 vite.config.ts 的 rollupOptions.input 增加一个入口</div>
        </div>
      </div>
    </div>
  </div>
</template>

