// Helper fetch ringan untuk REST API FastAPI
const BASE = import.meta.env.VITE_API_BASE || "/api/v1";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // ===== Koridor =====
  listKoridor:        ()                       => request("/koridor"),
  koridorGeojsonAll:  ()                       => request("/koridor/geojson"),
  koridorGeojson:     (id)                     => request(`/koridor/${id}/geojson`),

  // ===== Halte =====
  listHalte:          (params = {})            => request(`/halte?${new URLSearchParams(params)}`),
  halteGeojson:       (params = {})            => request(`/halte/geojson?${new URLSearchParams(params)}`),
  halteRadius:        (lat, lng, radius = 500) =>
    request(`/halte/radius?lat=${lat}&lng=${lng}&radius=${radius}`),
  createHalte:        (body)                   => request("/halte",       { method: "POST",   body: JSON.stringify(body) }),
  updateHalte:        (id, body)               => request(`/halte/${id}`, { method: "PUT",    body: JSON.stringify(body) }),
  deleteHalte:        (id)                     => request(`/halte/${id}`, { method: "DELETE" }),

  // ===== Armada =====
  listArmada:         (params = {})            => request(`/armada?${new URLSearchParams(params)}`),
  statistikArmada:    ()                       => request("/armada/statistik"),
  createArmada:       (body)                   => request("/armada",       { method: "POST",   body: JSON.stringify(body) }),
  updateArmada:       (id, body)               => request(`/armada/${id}`, { method: "PUT",    body: JSON.stringify(body) }),
  deleteArmada:       (id)                     => request(`/armada/${id}`, { method: "DELETE" }),
};
