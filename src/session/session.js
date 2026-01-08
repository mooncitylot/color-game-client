const sessionVariables = {
  USER: 'user',
  USER_TOKEN: 'userToken',
  SESSION_EXPIRATION: 'sessionExpiration',
}

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
  return window.sessionStorage.setItem(sessionVariables.USER, JSON.stringify(sessionUser))
}

export function getSessionUser() {
  const user = window.sessionStorage.getItem(sessionVariables.USER)
  return user ? JSON.parse(user) : null
}

export function clearSession() {
  window.sessionStorage.clear()
}

export function setUserToken(token) {
  return window.sessionStorage.setItem(sessionVariables.USER_TOKEN, token)
}

export function getUserToken() {
  return window.sessionStorage.getItem(sessionVariables.USER_TOKEN)
}

export function sessionIsExpired() {
  const expiration = getSessionExpiration()
  if (!expiration) return true
  return new Date(expiration).getTime() < new Date().getTime()
}

export function setSessionExpiration(expiry) {
  return window.sessionStorage.setItem(sessionVariables.SESSION_EXPIRATION, expiry)
}

export function getSessionExpiration() {
  return window.sessionStorage.getItem(sessionVariables.SESSION_EXPIRATION)
}
