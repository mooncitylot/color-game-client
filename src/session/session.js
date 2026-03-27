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

export function setSessionData({ expiry, user, token }) {
  setSessionExpiration(expiry)
  setUserToken(token)
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

export function setUserToken(token) {
  return authStorage.setItem(sessionVariables.USER_TOKEN, token)
}

export function getUserToken() {
  return authStorage.getItem(sessionVariables.USER_TOKEN)
}

/**
 * Auth is via Bearer token in localStorage and/or HttpOnly cookies (see API login).
 * When the API only sets cookies, there is no token string — we treat a cached user
 * from a successful /v1/users/me as authenticated until cleared or the API returns 401.
 * @returns {boolean}
 */
export function isAuthenticated() {
  const token = getUserToken()
  if (token && String(token).trim()) {
    const expiration = getSessionExpiration()
    if (!expiration) return true
    return new Date(expiration).getTime() >= new Date().getTime()
  }
  return !!getSessionUser()
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
