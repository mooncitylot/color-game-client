import { setSessionData } from "../session/session.js";
import { getApiBaseUrl } from "./api-fetch.js";

/**
 * @returns {Promise<boolean>}
 */
export async function tryRefreshAccessToken() {
  const res = await fetch(`${getApiBaseUrl()}/v1/auth/refresh`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return false;

  const text = await res.text();
  if (!text) return true;

  try {
    const data = JSON.parse(text);
    if (data.expiresAt) {
      setSessionData({ expiry: data.expiresAt });
    }
  } catch {
    // cookies may still have updated access_token
  }

  return true;
}
