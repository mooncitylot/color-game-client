import { apiFetch } from "./api-fetch.js";

export function getFriends() {
  return apiFetch(`/v1/friends`, "GET").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : { friends: [] };
  });
}

export function getFriendRequests() {
  return apiFetch(`/v1/friends/requests`, "GET").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : { requests: [] };
  });
}

export function searchFriends(query) {
  return apiFetch(`/v1/friends/search`, "POST", { query }).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : { results: [] };
  });
}

export function sendFriendRequest(targetUserId) {
  return apiFetch(`/v1/friends/request`, "POST", { targetUserId }).then(
    async (r) => {
      const text = await r.text();
      return text ? JSON.parse(text) : null;
    }
  );
}

export function respondToFriendRequest(friendshipId, action) {
  return apiFetch(`/v1/friends/respond`, "POST", {
    friendshipId,
    action,
  }).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  });
}

export function removeFriend(friendshipId) {
  return apiFetch(`/v1/friends/remove`, "POST", { friendshipId }).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : null;
  });
}

export function getFriendActivity() {
  return apiFetch(`/v1/friends/activity`, "GET").then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : { activity: [] };
  });
}
