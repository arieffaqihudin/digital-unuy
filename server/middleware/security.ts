export default defineEventHandler(async (event) => {
  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'X-Frame-Options', 'SAMEORIGIN')
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  setHeader(event, 'Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin')

  const path = event.path || ''
  // Indexing policy: private routes and non-production environments are never indexed.
  if (!isIndexableEnvironment() || isPrivatePath(path)) {
    setHeader(event, 'X-Robots-Tag', 'noindex, nofollow')
  }
  if (!path.startsWith('/api/')) return

  await connectDb()

  if (!['GET', 'HEAD', 'OPTIONS'].includes(String(event.method || 'GET').toUpperCase())) {
    requireMutationHeader(event)
  }
})
