import { getUserToken, clearSession } from "../session/session.js";
import { go } from "../router/router-mixin.js";
import { routes } from "../router/routes.js";

const DEFAULT_API = process.env.API_URL;

export const Methods = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
};

/**
 * Handle 401 Unauthorized errors by clearing session and redirecting to login
 */
function handleUnauthorized() {
  clearSession();
  // Only redirect if not already on login or signup page
  const currentPath = window.location.pathname;
  if (currentPath !== routes.LOGIN.path && currentPath !== routes.SIGNUP.path) {
    go(routes.LOGIN.path);
  }
}

export async function apiFetch(path, method, body = null, API = DEFAULT_API) {
  const options = {
    method,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${getUserToken() || ""}`,
    },
    credentials: "include", // Include cookies in requests
  };

  if (body) options["body"] = JSON.stringify(body);

  const res = await fetch(API + path, options);
  if (res.ok) {
    return res;
  } else {
    // Handle 401 Unauthorized - token expired or invalid
    if (res.status === 401) {
      handleUnauthorized();
    }

    // Try to parse error response, but handle empty responses
    let errorMessage = res.statusText;
    try {
      const text = await res.text();
      if (text) {
        const errorData = JSON.parse(text);
        // API returns 'description' field in error responses
        errorMessage =
          errorData.description || errorData.message || errorMessage;
      }
    } catch (e) {
      // Ignore JSON parse errors for error responses
    }

    throw {
      message: errorMessage,
      res,
    };
  }
}
