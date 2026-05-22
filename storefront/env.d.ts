declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module '#app' {
  export function useRuntimeConfig(): any
  export function useState<T>(key: string, init: () => T): { value: T }
}

declare module '#imports' {
  export function useRuntimeConfig(): any
  export function useState<T>(key: string, init: () => T): { value: T }
}

declare function useRuntimeConfig(): any
declare function useState<T>(key: string, init: () => T): { value: T }
