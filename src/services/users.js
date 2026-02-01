import { apiFetch } from "./api-fetch.js";

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
 * Check if the user's authentication token is valid
 * @returns {Promise<boolean>}
 */
export async function checkAuthStatus() {
  try {
    await getCurrentUser();
    return true;
  } catch (error) {
    return false;
  }
}

export function updateUser(userData) {
  return apiFetch(`/v1/users/me/update`, "PUT", userData).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  });
}
