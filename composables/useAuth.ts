import type { Permission, SessionUser } from '~/shared/types'

export function useAuth() {
  const user = useState<SessionUser | null>('auth.user', () => null)
  const loaded = useState<boolean>('auth.loaded', () => false)

  const isAuthenticated = computed(() => Boolean(user.value))
  const isStaff = computed(() => ['admin', 'superadmin'].includes(user.value?.role || ''))

  async function fetchSession(force = false) {
    if (loaded.value && !force) return user.value
    try {
      const requestFetch = useRequestFetch()
      const data = await requestFetch<{ user: SessionUser | null }>('/api/auth/session')
      user.value = data.user
    } catch {
      user.value = null
    } finally {
      loaded.value = true
    }
    return user.value
  }

  async function login(email: string, password: string) {
    const api = useApi()
    const data = await api<{ user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = data.user
    loaded.value = true
    return data.user
  }

  async function logout() {
    const api = useApi()
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } finally {
      user.value = null
      loaded.value = true
      await navigateTo('/')
    }
  }

  function can(permission: Permission) {
    return Boolean(user.value?.permissions?.includes(permission))
  }

  return {
    user,
    loaded,
    isAuthenticated,
    isStaff,
    fetchSession,
    login,
    logout,
    can
  }
}
