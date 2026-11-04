export function useApi() {
  return async <T = any>(url: string, options: Record<string, any> = {}): Promise<T> => {
    const method = String(options.method || 'GET').toUpperCase()
    const headers: Record<string, string> = {
      ...(options.headers || {}),
      ...(method === 'GET' || method === 'HEAD' ? {} : { 'x-unu-csrf': '1' })
    }
    return $fetch<T>(url, { ...options, headers })
  }
}
