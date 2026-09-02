/**
 * API client for interacting with the IntelliCharge FastAPI backend.
 */

const API_BASE = '';

/**
 * Helper to obtain standard Authorization Bearer header if user is logged in.
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('intellicharge_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/* ---------------- Auth Endpoints ---------------- */

export async function registerUser(email, password, name = '') {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function fetchMe() {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error('Unauthorized or session expired');
  return res.json();
}

/* ---------------- Stations & Routing Endpoints ---------------- */

export async function fetchNearbyStations(lat, lng, radiusKm = 50, connectorType = '') {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    radius_km: radiusKm.toString(),
  });
  if (connectorType && connectorType !== 'All') params.append('connector_type', connectorType);

  const res = await fetch(`${API_BASE}/stations/nearby?${params.toString()}`);
  if (!res.ok) throw new Error(`Error fetching nearby stations: ${res.statusText}`);
  return res.json();
}

export async function fetchRecommendations(lat, lng, batteryPct, radiusKm = 50, connectorType = '') {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lng: lng.toString(),
    battery_pct: batteryPct.toString(),
    radius_km: radiusKm.toString(),
  });
  if (connectorType && connectorType !== 'All') params.append('connector_type', connectorType);

  const res = await fetch(`${API_BASE}/recommend?${params.toString()}`);
  if (!res.ok) throw new Error(`Error fetching recommendations: ${res.statusText}`);
  return res.json();
}

export async function queryAgent(message, lat, lng, batteryPct, connectorType = '') {
  const res = await fetch(`${API_BASE}/agent/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      lat,
      lng,
      battery_pct: batteryPct,
      connector_type: connectorType && connectorType !== 'All' ? connectorType : null,
    }),
  });
  if (!res.ok) throw new Error(`Error from AI Agent: ${res.statusText}`);
  return res.json();
}

export async function fetchStationPrediction(stationId, arrivalTs = null) {
  const params = new URLSearchParams();
  if (arrivalTs) params.append('arrival_ts', arrivalTs);

  const res = await fetch(`${API_BASE}/stations/${stationId}/predict-wait?${params.toString()}`);
  if (!res.ok) throw new Error(`Error fetching prediction: ${res.statusText}`);
  return res.json();
}

/* ---------------- Vehicles & Profiles ---------------- */

export async function saveEVProfile(vehicleData) {
  const res = await fetch(`${API_BASE}/api/vehicles/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(vehicleData),
  });
  if (!res.ok) throw new Error(`Error saving EV profile: ${res.statusText}`);
  return res.json();
}

export async function fetchUserVehicles() {
  const res = await fetch(`${API_BASE}/api/vehicles/`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) return [];
  return res.json();
}

/* ---------------- Smart Queue Endpoints ---------------- */

export async function joinQueue(stationId, vehicleId, currentSoc, targetSoc) {
  const res = await fetch(`${API_BASE}/api/stations/${stationId}/queue/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      vehicle_id: vehicleId,
      current_soc: currentSoc,
      target_soc: targetSoc
    }),
  });
  if (!res.ok) throw new Error(`Error joining queue: ${res.statusText}`);
  return res.json();
}
