export type ToastTone = 'success' | 'error' | 'info' | 'warning'

export interface ToastItem {
  id: number
  tone: ToastTone
  title: string
  message?: string
}

let nextId = 1

export function useToast() {
  const toasts = useState<ToastItem[]>('toasts', () => [])

  function remove(id: number) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id)
  }

  function show(input: { tone?: ToastTone; title: string; message?: string; duration?: number }) {
    const id = nextId++
    toasts.value = [
      ...toasts.value,
      { id, tone: input.tone || 'info', title: input.title, message: input.message }
    ]
    if (import.meta.client) {
      window.setTimeout(() => remove(id), input.duration || 5200)
    }
    return id
  }

  return {
    toasts,
    show,
    success: (title: string, message?: string) => show({ tone: 'success', title, message }),
    error: (title: string, message?: string) => show({ tone: 'error', title, message }),
    info: (title: string, message?: string) => show({ tone: 'info', title, message }),
    warning: (title: string, message?: string) => show({ tone: 'warning', title, message }),
    remove
  }
}
