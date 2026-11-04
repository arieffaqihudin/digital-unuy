export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    const auth = useAuth()
    await auth.fetchSession()
    if (!auth.user.value) {
      return navigateTo(`/masuk?redirect=${encodeURIComponent(to.fullPath)}`)
    }
    return
  }

  const auth = useAuth()
  await auth.fetchSession()
  if (!auth.user.value) {
    return navigateTo(`/masuk?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
