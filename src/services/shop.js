import { apiFetch } from "./api-fetch.js";

// ============= SHOP ITEMS =============

/**
 * Get all active shop items
 * @param {string} itemType - Optional filter by item type (powerup, badge, avatar_hat, avatar_skin)
 * @returns {Promise<Array>} Array of shop items
 */
export function getShopItems(itemType = null) {
  const path = itemType ? `/v1/shop/items?type=${itemType}` : "/v1/shop/items";
  return apiFetch(path, "GET").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : [];
  });
}

/**
 * Get a specific shop item by ID
 * @param {string} itemId - The item ID
 * @returns {Promise<Object>} Shop item details
 */
export function getShopItem(itemId) {
  return apiFetch(`/v1/shop/items?id=${itemId}`, "GET").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  });
}

/**
 * Purchase an item from the shop
 * @param {string} itemId - The item ID to purchase
 * @param {number} quantity - Quantity to purchase (default 1)
 * @returns {Promise<Object>} Purchase confirmation with updated credits
 */
export function purchaseItem(itemId, quantity = 1) {
  return apiFetch("/v1/shop/purchase", "POST", {
    itemId,
    quantity,
  }).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  });
}

// ============= INVENTORY =============

/**
 * Get current user's full inventory
 * @returns {Promise<Array>} Array of inventory items
 */
export function getUserInventory() {
  return apiFetch("/v1/inventory", "GET").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : [];
  });
}

/**
 * Get current user's equipped items only
 * @returns {Promise<Array>} Array of equipped items
 */
export function getEquippedItems() {
  return apiFetch("/v1/inventory/equipped", "GET").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : [];
  });
}

/**
 * Equip or unequip a cosmetic item
 * @param {number} inventoryId - The inventory item ID
 * @param {boolean} equip - True to equip, false to unequip
 * @returns {Promise<Object>} Confirmation message
 */
export function equipItem(inventoryId, equip = true) {
  return apiFetch("/v1/inventory/equip", "PUT", {
    inventoryId,
    equip,
  }).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  });
}

/**
 * Use a consumable item (like powerups)
 * @param {number} inventoryId - The inventory item ID
 * @returns {Promise<Object>} Result with remaining quantity
 */
export function useItem(inventoryId) {
  return apiFetch("/v1/inventory/use", "POST", {
    inventoryId,
  }).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  });
}

// ============= PURCHASE HISTORY =============

/**
 * Get current user's purchase history
 * @returns {Promise<Array>} Array of purchase records
 */
export function getPurchaseHistory() {
  return apiFetch("/v1/shop/purchases", "GET").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : [];
  });
}
