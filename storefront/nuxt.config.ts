export default defineNuxtConfig({
  compatibilityDate: "2026-05-12",
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://127.0.0.1:3000",
      whatsappNumber: process.env.NUXT_PUBLIC_WHATSAPP_NUMBER || "",
      fxRates: {
        CNY: Number(process.env.NUXT_PUBLIC_FX_CNY || "1"),
        MYR: Number(process.env.NUXT_PUBLIC_FX_MYR || "0.65"),
        USD: Number(process.env.NUXT_PUBLIC_FX_USD || "0.14")
      }
    }
  }
})
