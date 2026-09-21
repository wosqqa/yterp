<template>
  <div class="min-h-dvh bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <div class="mx-auto max-w-[980px] px-5 py-16">
      <div class="text-xs tracking-[0.22em] text-zinc-500 dark:text-zinc-400">404</div>
      <div class="mt-3 text-2xl font-semibold">页面不存在</div>
      <div class="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
        可能链接已失效，或活动已下线。
      </div>
      <router-link
        class="mt-8 inline-flex items-center justify-center rounded-2xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
        to="/"
      >
        返回首页
      </router-link>
    </div>
  </div>
</template>

