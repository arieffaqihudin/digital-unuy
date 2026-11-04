export default defineNuxtRouteMiddleware(async (to) => {
  if (!to.path.startsWith('/admin')) return
  const auth = useAuth()
  await auth.fetchSession()
  if (!auth.user.value) {
    return navigateTo(`/masuk?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if (!auth.isStaff.value) {
    return navigateTo('/')
  }
})
