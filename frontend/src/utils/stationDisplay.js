const AMENITY_ICONS = [
  { match: /cafe|coffee|espresso/i, icon: 'local_cafe', label: 'Coffee' },
  { match: /wifi|internet/i, icon: 'wifi', label: 'Wi-Fi' },
  { match: /restroom|toilet|wc/i, icon: 'wc', label: 'Restrooms' },
  { match: /lounge|chair/i, icon: 'chair', label: 'Lounge' },
  { match: /restaurant|bistro|food|dining/i, icon: 'restaurant', label: 'Food' },
  { match: /shop|store|mall/i, icon: 'shopping_bag', label: 'Shopping' },
  { match: /cover|roof|canopy/i, icon: 'roofing', label: 'Covered' },
  { match: /park|nature|trail/i, icon: 'park', label: 'Park' },
  { match: /solar|wind|hydro|renew|green/i, icon: 'energy_savings_leaf', label: 'Renewable' },
  { match: /security|cctv|camera/i, icon: 'videocam', label: 'Security' },
];

export function formatPrice(value) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  const n = Number(value);
  const currency = n >= 1 ? '₹' : '€';
  return `${currency}${n.toFixed(2)} / kWh`;
}

export function formatWait(minutes) {
  if (minutes == null || Number.isNaN(Number(minutes))) return '—';
  const m = Number(minutes);
  if (m < 1) return '0 min';
  if (m < 10) return `${m.toFixed(1)} min`;
  return `${Math.round(m)} min`;
}

export function amenityChips(amenities = []) {
  const chips = [];
  const seen = new Set();
  for (const raw of amenities) {
    const hit = AMENITY_ICONS.find((a) => a.match.test(String(raw)));
    if (hit && !seen.has(hit.icon)) {
      seen.add(hit.icon);
      chips.push({ icon: hit.icon, label: String(raw) });
    } else if (!hit) {
      chips.push({ icon: 'check_circle', label: String(raw) });
    }
  }
  return chips.slice(0, 4);
}

export function buildBayMatrix(chargerCount, queue) {
  const total = Math.max(0, chargerCount || 0);
  const available = queue?.available_chargers ?? total;
  const inUse = queue?.active_sessions ?? Math.max(0, total - available);
  const waiting = queue?.waiting_vehicles ?? 0;
  const reserved = Math.min(available, waiting);
  const free = Math.max(0, available - reserved);
  const power = queue?.power_kw;

  const bays = [];
  let remainingFree = free;
  let remainingReserved = reserved;
  let remainingInUse = inUse;

  for (let i = 0; i < total; i += 1) {
    let status = 'free';
    if (remainingInUse > 0) {
      status = 'in_use';
      remainingInUse -= 1;
    } else if (remainingReserved > 0) {
      status = 'reserved';
      remainingReserved -= 1;
    } else if (remainingFree > 0) {
      status = 'free';
      remainingFree -= 1;
    } else {
      status = 'in_use';
    }
    bays.push({
      id: `P${String(i + 1).padStart(2, '0')}`,
      status,
      powerKw: power,
    });
  }
  return { bays, free, reserved, inUse, total, available };
}

export function utilizationLabel(free, total) {
  if (!total) return { text: 'No stalls reported', tone: 'neutral' };
  const ratio = free / total;
  if (ratio <= 0.15) return { text: 'High utilization', tone: 'alert' };
  if (ratio <= 0.4) return { text: 'Busy', tone: 'warn' };
  if (free === total) return { text: 'Zero queue', tone: 'ok' };
  return { text: 'Available', tone: 'ok' };
}

export function estimatedRangeKm(batteryPct, userVehicle, fallbackRange) {
  if (fallbackRange != null) return Math.round(fallbackRange);
  const capacity = userVehicle?.battery_capacity_kwh;
  if (capacity) return Math.round((batteryPct / 100) * capacity * 6.5);
  return Math.round((batteryPct / 100) * 280);
}
