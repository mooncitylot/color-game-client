import { clearSession } from "../session/session.js";
import { go } from "../router/router-mixin.js";
import { routes } from "../router/routes.js";
import { tryRefreshAccessToken } from "./auth-refresh.js";

const DEFAULT_API = process.env.API_URL;

/**
 * Base URL for API requests (empty string = same-origin relative paths).
 * @returns {string}
 */
export function getApiBaseUrl() {
  return DEFAULT_API == null ? "" : String(DEFAULT_API);
}

export const Methods = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
};

/**
 * Clears HttpOnly auth cookies on the server, then local session state.
 */
async function clearServerAuthCookies() {
  const base = DEFAULT_API == null ? "" : String(DEFAULT_API);
  try {
    await fetch(`${base}/v1/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
  } catch {
    // ignore
  }
}

/**
 * Handle 401 Unauthorized errors by clearing cookies/session and redirecting to login
 */
async function handleUnauthorized() {
  await clearServerAuthCookies();
  clearSession();
  const currentPath = window.location.pathname;
  if (currentPath !== routes.LOGIN.path && currentPath !== routes.SIGNUP.path) {
    go(routes.LOGIN.path);
  }
}

/**
 * @param {boolean} canRefresh
 */
async function apiFetchOnce(path, method, body, API, canRefresh) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const options = {
    method,
    headers,
    credentials: "include",
  };

  if (body) options.body = JSON.stringify(body);

  const base = API == null ? "" : String(API);
  const res = await fetch(`${base}${path}`, options);

  if (res.ok) return res;

  if (
    res.status === 401 &&
    canRefresh &&
    shouldAttemptRefresh(path)
  ) {
    const refreshed = await tryRefreshAccessToken();
    if (refreshed) {
      return apiFetchOnce(path, method, body, API, false);
    }
  }

  if (res.status === 401) {
    await handleUnauthorized();
  }

  let errorMessage = res.statusText;
  try {
    const text = await res.text();
    if (text) {
      const errorData = JSON.parse(text);
      errorMessage =
        errorData.description || errorData.message || errorMessage;
    }
  } catch {
    // ignore
  }

  throw {
    message: errorMessage,
    res,
  };
}

/**
 * @param {string} path
 */
function shouldAttemptRefresh(path) {
  if (path.includes("/v1/auth/login")) return false;
  if (path.includes("/v1/auth/logout")) return false;
  if (path.includes("/v1/auth/refresh")) return false;
  if (path.includes("/v1/auth/signup")) return false;
  return true;
}

export async function apiFetch(path, method, body = null, API = DEFAULT_API) {
  return apiFetchOnce(path, method, body, API, true);
}
