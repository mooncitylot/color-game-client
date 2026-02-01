import { apiFetch } from "./api-fetch.js";

export function generateDailyColor() {
  return apiFetch(`/v1/admin/colors/generate`, "POST").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : { success: true };
  });
}

export function createShopItem(itemData) {
  return apiFetch(`/v1/admin/shop/items`, "POST", itemData).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : { success: true };
  });
}

export function getAllShopItems() {
  return apiFetch(`/v1/admin/shop/items/all`, "GET").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : [];
  });
}

export function addUserCredits(userId, credits) {
  return apiFetch(`/v1/admin/users/credits`, "POST", { userId, credits }).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : { success: true };
  });
}

export function resetUserGame(userId) {
  return apiFetch(`/v1/admin/users/${userId}/reset-game`, "POST").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : { success: true };
  });
}
