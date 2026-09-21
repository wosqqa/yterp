import axios from 'axios'

const baseURL = (import.meta.env.VITE_API_BASE as string | undefined) || '/'
const logEnabled = String(import.meta.env.VITE_LOG_REQUEST || '') === '1'

export const http = axios.create({
  baseURL,
  timeout: 15000,
  withCredentials: true,
})

http.interceptors.request.use((config) => {
  if (logEnabled) {
    const safe = {
      url: config.url,
      method: config.method,
      params: config.params,
      data: config.data,
    }
    console.log('[h5][request]', safe)
  }
  return config
})

http.interceptors.response.use(
  (resp) => {
    if (logEnabled) {
      console.log('[h5][response]', {
        url: resp.config?.url,
        status: resp.status,
        data: resp.data,
      })
    }
    return resp
  },
  (err) => {
    if (logEnabled) {
      console.log('[h5][response:error]', err)
    }
    return Promise.reject(err)
  },
)
