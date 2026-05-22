<template>
  <div class="appShell">
    <SiteHeader />
    <main class="appMain">
      <slot />
    </main>
    <CartDrawer />
    <ChatWidget />
  </div>
</template>

<style>
:root{
  --bg: #ffffff;
  --fg: #111111;
  --muted: #6b7280;
  --border: rgba(17,17,17,.12);
  --shadow: 0 10px 30px rgba(0,0,0,.12);
  --brand: #111111;
  --accent: #ef4444;
  --chip: rgba(17,17,17,.06);
  --radius: 14px;
}

html, body, #__nuxt{
  height: 100%;
}
body{
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
  color: var(--fg);
  background: var(--bg);
}

a{ color: inherit; text-decoration: none; }
button{ font-family: inherit; }

.appShell{
  min-height: 100%;
}
.appMain{
  padding-top: 56px;
}
</style>
