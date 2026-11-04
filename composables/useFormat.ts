export function useFormat() {
  function toDate(value: string | Date | null | undefined) {
    if (!value) return null
    const date = value instanceof Date ? value : new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  }

  function formatDate(value: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions) {
    const date = toDate(value)
    if (!date) return '—'
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      ...options
    }).format(date)
  }

  function formatDateTime(value: string | Date | null | undefined) {
    const date = toDate(value)
    if (!date) return '—'
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  function formatFileSize(bytes?: number | null) {
    if (!bytes || bytes <= 0) return '—'
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  function formatNumber(value?: number | null) {
    if (value === null || value === undefined) return '—'
    return new Intl.NumberFormat('id-ID').format(value)
  }

  function truncate(value: string, length = 140) {
    if (!value) return ''
    return value.length > length ? `${value.slice(0, length).trim()}…` : value
  }

  function relativeTime(value: string | Date | null | undefined) {
    const date = toDate(value)
    if (!date) return '—'
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60_000)
    if (minutes < 1) return 'baru saja'
    if (minutes < 60) return `${minutes} menit lalu`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} jam lalu`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days} hari lalu`
    return formatDate(date)
  }

  return {
    formatDate,
    formatDateTime,
    formatFileSize,
    formatNumber,
    truncate,
    relativeTime
  }
}
