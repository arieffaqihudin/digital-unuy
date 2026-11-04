export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()
  await auth.fetchSession()
  if (!auth.user.value) {
    return navigateTo(`/masuk?redirect=${encodeURIComponent(to.fullPath)}`)
  }
  if (!auth.isStaff.value) {
    return navigateTo('/')
  }
})
