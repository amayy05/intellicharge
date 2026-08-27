/**
 * API client for interacting with the IntelliCharge FastAPI backend.
 */

const API_BASE = '';

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
