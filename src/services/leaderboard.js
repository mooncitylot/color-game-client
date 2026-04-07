import { apiFetch } from "./api-fetch.js";

/**
 * @param {"global" | "friends"} scope
 * @returns {Promise<Array<{ rank: number, userId: string, username: string, points: number, level: number }>>}
 */
export function getPointsLeaderboard(scope) {
  const s = scope === "friends" ? "friends" : "global";
  return apiFetch(
    `/v1/leaderboard/points?scope=${encodeURIComponent(s)}`,
    "GET",
  ).then(async (r) => {
    const text = await r.text();
    return text ? JSON.parse(text) : [];
  });
}
