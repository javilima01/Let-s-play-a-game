// src/services/admin.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request(
  path,
  { method = "GET", body, headers = {}, ...rest } = {},
) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...headers },
    ...rest,
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    let msg;
    try {
      const data = await res.json();
      msg = data?.detail || JSON.stringify(data);
    } catch {
      msg = await res.text();
    }
    throw new Error(`[${res.status}] ${msg}`);
  }
  return res.status === 204 ? null : res.json();
}

/* ───────── Admin endpoints ───────── */

// ── Games ───────────────────────────
export const getAdminGames = () => request("/api/admin/games");
export const createAdminGame = (payload = {}) =>
  request("/api/admin/games", { method: "POST", body: payload });

export const updateAdminGameMeta = (gameId, patch) =>
  request(`/api/admin/games/${gameId}`, { method: "PUT", body: patch });

// ── Steps ───────────────────────────
export const getAdminSteps = (gameId) => request(`/api/admin/steps/${gameId}`);
export const createAdminStep = (gameId, stepDoc) =>
  request(`/api/admin/steps/${gameId}`, { method: "POST", body: stepDoc });

export const updateAdminStepOrder = (gameId, orderArr) =>
  request(`/api/admin/steps/order/${gameId}`, {
    method: "PUT",
    body: orderArr,
  });

export const patchAdminStep = (stepId, patch) =>
  request(`/api/admin/steps/${stepId}`, { method: "PATCH", body: patch });

export const deleteAdminStep = (stepId) =>
  request(`/api/admin/steps/${stepId}`, { method: "DELETE" });
export const deleteAdminGame = (gameId) =>
  request(`/api/admin/games/${gameId}`, { method: "DELETE" });
export const verifyStepPassword = (gameId, stepId, password, return_clue) =>
  request(
    `/api/admin/games/${gameId}/steps/${stepId}/verify`,
    {
      method: "POST",
      body: { password, return_clue },
    }
  );
export const setRotatingMessages = (messages) =>
  request("/api/admin/messages", {
    method: "POST",
    body: messages,
  });

/* ───────── Bundle for convenience ───────── */
export default {
  getAdminGames,
  createAdminGame,
  updateAdminGameMeta,
  getAdminSteps,
  createAdminStep,
  updateAdminStepOrder,
  patchAdminStep,
  deleteAdminStep,
  deleteAdminGame,
  setRotatingMessages
};
