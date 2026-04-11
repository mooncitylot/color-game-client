const sessionVariables = {
  USER: 'user',
  USER_TOKEN: 'userToken',
  SESSION_EXPIRATION: 'sessionExpiration',
}

/** @type {Storage} */
const authStorage = window.localStorage

function migrateSessionFromSessionStorageIfNeeded() {
  if (
    authStorage.getItem(sessionVariables.USER_TOKEN) ||
    authStorage.getItem(sessionVariables.USER)
  ) {
    return
  }
  Object.values(sessionVariables).forEach((key) => {
    const value = window.sessionStorage.getItem(key)
    if (value === null) return
    authStorage.setItem(key, value)
    window.sessionStorage.removeItem(key)
  })
}

migrateSessionFromSessionStorageIfNeeded()

/**
 * @param {{ expiry?: string, user?: object }} opts
 */
export function setSessionData({ expiry, user }) {
  if (expiry) setSessionExpiration(expiry)
  authStorage.removeItem(sessionVariables.USER_TOKEN)
  if (user) setSessionUser(user)
}

export function setSessionUser(user) {
  // Support both destructured and full user object
  const sessionUser = {
    userId: user.userId || user.id,
    kind: user.kind || user.role,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
    points: user.points || 0,
    level: user.level || 1,
    credits: user.credits || 0,
    userEffect: user.userEffect ?? null,
  }
  return authStorage.setItem(sessionVariables.USER, JSON.stringify(sessionUser))
}

export function getSessionUser() {
  const user = authStorage.getItem(sessionVariables.USER)
  return user ? JSON.parse(user) : null
}

export function clearSession() {
  Object.values(sessionVariables).forEach((key) => authStorage.removeItem(key))
}

/**
 * Auth uses HttpOnly JWT cookies; localStorage holds cached user + optional expiry hint.
 * @returns {boolean}
 */
export function isAuthenticated() {
  const user = getSessionUser()
  if (!user) return false
  const expiration = getSessionExpiration()
  if (!expiration) return true
  return new Date(expiration).getTime() >= new Date().getTime()
}

export function sessionIsExpired() {
  const expiration = getSessionExpiration()
  if (!expiration) return true
  return new Date(expiration).getTime() < new Date().getTime()
}

export function setSessionExpiration(expiry) {
  return authStorage.setItem(sessionVariables.SESSION_EXPIRATION, expiry)
}

export function getSessionExpiration() {
  return authStorage.getItem(sessionVariables.SESSION_EXPIRATION)
}
