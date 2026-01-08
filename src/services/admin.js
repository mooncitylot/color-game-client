import { apiFetch } from "./api-fetch.js";

export function generateDailyColor() {
  return apiFetch(`/v1/admin/colors/generate`, "POST").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : { success: true };
  });
}
