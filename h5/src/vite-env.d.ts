/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE?: string
  readonly VITE_LOG_REQUEST?: string
  readonly VITE_ASSET_PREFIX?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
