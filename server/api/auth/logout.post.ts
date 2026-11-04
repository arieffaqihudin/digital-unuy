export default defineEventHandler(async (event) => {
  const user = await getSessionUser(event)
  await destroySession(event)
  if (user) {
    await recordAudit(event, user, 'auth.logout', 'User', user.id)
  }
  return { ok: true }
})
