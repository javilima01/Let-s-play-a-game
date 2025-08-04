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
export const getAdminGames = () => request("/admin/games");
export const createAdminGame = (payload = {}) =>
  request("/admin/games", { method: "POST", body: payload });

export const updateAdminGameMeta = (gameId, patch) =>
  request(`/admin/games/${gameId}`, { method: "PUT", body: patch });

// ── Steps ───────────────────────────
export const getAdminSteps = (gameId) => request(`/admin/steps/${gameId}`);
export const createAdminStep = (gameId, stepDoc) =>
  request(`/admin/steps/${gameId}`, { method: "POST", body: stepDoc });

export const updateAdminStepOrder = (gameId, orderArr) =>
  request(`/admin/steps/order/${gameId}`, {
    method: "PUT",
    body: orderArr,
  });

export const patchAdminStep = (stepId, patch) =>
  request(`/admin/steps/${stepId}`, { method: "PATCH", body: patch });

export const deleteAdminStep = (stepId) =>
  request(`/admin/steps/${stepId}`, { method: "DELETE" });

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
};
