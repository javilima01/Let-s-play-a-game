const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

async function request(path, { method = "GET", body, headers = {}, ...rest } = {}) {
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    ...rest,
  };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_BASE}${path}`, opts);
  if (!res.ok) {
    // try to send back parsed detail if available
    let errText;
    try {
      const data = await res.json();
      errText = data?.detail || JSON.stringify(data);
    } catch {
      errText = await res.text();
    }
    throw new Error(`[${res.status}] ${errText}`);
  }
  return res.status === 204 ? null : res.json();
}

// --- Meta ------------------------------------------------------
export const getDescription = (gameId) =>
  request(`/api/description/${gameId}`);          // <-- accepts id now
// export const createGame   = () => request("/games", { method: "POST" });
export const startGame    = (id) => request(`/api/start/${id}`, { method: "POST" });
export const getRotatingMessages = () => request("/api/messages");

// --- Gameplay --------------------------------------------------
export const getStep = (gameId, step) => request(`/api/step/${gameId}/${step}`);
export const getInfoPlayer = (playerId) => request(`/api/player/${playerId}`);
export const confirmChallenge = (gameId, step, opponentId) =>
  request("/api/challenge/confirm", { method: "POST", body: { gameId, step, opponentId } });

export default {
  getDescription,
  startGame,
  getRotatingMessages,
  getStep,
  getInfoPlayer,
  confirmChallenge,
};
