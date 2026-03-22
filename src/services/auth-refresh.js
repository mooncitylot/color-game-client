import { setSessionData } from "../session/session.js";

const DEFAULT_API = process.env.API_URL;

/**
 * @returns {Promise<boolean>}
 */
export async function tryRefreshAccessToken() {
  const res = await fetch(`${DEFAULT_API}/v1/auth/refresh`, {
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
    if (data.accessToken) {
      setSessionData({
        token: data.accessToken,
        expiry: data.expiresAt,
      });
    }
  } catch {
    // cookies may still have updated access_token
  }

  return true;
}
