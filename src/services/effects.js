import { apiFetch } from "./api-fetch.js";
import { getSessionUser, setSessionUser } from "../session/session.js";

export function getUserEffect() {
  return apiFetch("/v1/users/me/effect", "GET").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  });
}

/**
 * Clears the active effect on the server and syncs session cache when present.
 * @returns {Promise<{ userEffect: null }>}
 */
export async function removeUserEffect() {
  const response = await apiFetch("/v1/users/me/effect", "DELETE");
  const text = await response.text();
  const body = text ? JSON.parse(text) : { userEffect: null };

  const sessionUser = getSessionUser();
  if (sessionUser) {
    setSessionUser({ ...sessionUser, userEffect: null });
  }

  return body;
}
