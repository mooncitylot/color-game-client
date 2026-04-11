import { apiFetch, getApiBaseUrl } from "./api-fetch.js";
import {
  clearSession,
  getSessionExpiration,
  getSessionUser,
  sessionIsExpired,
  setSessionUser,
} from "../session/session.js";

let ensureSessionInFlight = null;

export function signupUser(user) {
  return apiFetch(`/v1/auth/signup`, "POST", user).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : {};
  });
}

export async function loginUser({ email, password, deviceFingerprint }) {
  const response = await apiFetch(`/v1/auth/login`, "POST", {
    email,
    password,
    deviceFingerprint,
  });
  
  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}

export function getCurrentUser() {
  return apiFetch(`/v1/users/me`, "GET").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  });
}

/**
 * Loads the current user from the API when cookies may exist but localStorage is empty (e.g. new tab).
 * @returns {Promise<boolean>}
 */
export async function ensureSessionFromCookies() {
  const cached = getSessionUser();
  const exp = getSessionExpiration();
  if (cached && exp && !sessionIsExpired()) {
    return true;
  }

  if (ensureSessionInFlight) return ensureSessionInFlight;

  ensureSessionInFlight = (async () => {
    try {
      const user = await getCurrentUser();
      setSessionUser(user);
      return true;
    } catch {
      return false;
    } finally {
      ensureSessionInFlight = null;
    }
  })();

  return ensureSessionInFlight;
}

/**
 * Clears HttpOnly JWT cookies and local session.
 * @returns {Promise<void>}
 */
export async function logoutUser() {
  try {
    await fetch(`${getApiBaseUrl()}/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    // ignore
  }
  clearSession();
}

/**
 * @returns {Promise<boolean>}
 */
export async function checkAuthStatus() {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

export function updateUser(userData) {
  return apiFetch(`/v1/users/me/update`, "PUT", userData).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  });
}
