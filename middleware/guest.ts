export default defineNuxtRouteMiddleware(async () => {
  const auth = useAuth()
  await auth.fetchSession()
  if (auth.user.value) {
    return navigateTo(auth.isStaff.value ? '/admin' : '/')
  }
})
