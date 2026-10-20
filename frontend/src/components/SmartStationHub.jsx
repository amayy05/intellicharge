import React, { useEffect, useMemo, useState } from 'react';
import { fetchStationQueue } from '../services/api';
import { useAuth } from '../context/AuthContext';
import VirtualQueueModal from './VirtualQueueModal';
import {
  amenityChips,
  buildBayMatrix,
  formatPrice,
  formatWait,
  utilizationLabel,
} from '../utils/stationDisplay';

export default function SmartStationHub({
  recommendationData,
  loading,
  batteryPct = 42,
  targetSoc = 80,
  userVehicle,
  userVehicles = [],
}) {
  const { isAuthenticated, openLoginModal } = useAuth();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortMode, setSortMode] = useState('fastest');
  const [queues, setQueues] = useState({});
  const [syncAge, setSyncAge] = useState(0);
  const [queueModalStation, setQueueModalStation] = useState(null);

  const ranked = recommendationData?.ranked_stations || [];

  useEffect(() => {
    let cancelled = false;
    async function loadQueues() {
      const ids = ranked.slice(0, 12).map((s) => s.station_id);
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const q = await fetchStationQueue(id);
            return [id, q];
          } catch {
            return [id, null];
          }
        })
      );
      if (!cancelled) {
        setQueues(Object.fromEntries(entries));
        setSyncAge(0);
      }
    }
    if (ranked.length) loadQueues();
    const tick = setInterval(() => setSyncAge((s) => s + 1), 1000);
    return () => {
      cancelled = true;
      clearInterval(tick);
    };
  }, [ranked.map((s) => s.station_id).join(',')]);

  const filtered = useMemo(() => {
    let list = [...ranked];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        [s.station_name, s.address, s.city_region, s.operator, ...(s.connector_types || [])]
          .join(' ')
          .toLowerCase()
          .includes(q)
      );
    }
    if (filter === 'ultra') list = list.filter((s) => (s.power_kw || 0) >= 150);
    if (filter === 'zero') list = list.filter((s) => (s.breakdown?.predicted_wait_minutes || 0) < 1);
    if (filter === 'ccs') {
      list = list.filter((s) =>
        (s.connector_types || []).some((c) => /ccs/i.test(c))
      );
    }
    if (sortMode === 'fastest') {
      list.sort(
        (a, b) =>
          (a.breakdown?.total_time_minutes || 0) - (b.breakdown?.total_time_minutes || 0)
      );
    } else if (sortMode === 'nearest') {
      list.sort(
        (a, b) =>
          (a.breakdown?.road_distance_km || 0) - (b.breakdown?.road_distance_km || 0)
      );
    } else if (sortMode === 'power') {
      list.sort((a, b) => (b.power_kw || 0) - (a.power_kw || 0));
    }
    return list;
  }, [ranked, query, filter, sortMode]);

  const featured = filtered[0];
  const rest = filtered.slice(1);

  const totals = useMemo(() => {
    const ids = ranked.slice(0, 12);
    let free = 0;
    let total = 0;
    let waitSum = 0;
    let priceSum = 0;
    let zeroWait = 0;
    ids.forEach((s) => {
      const q = queues[s.station_id];
      const chargers = q?.total_chargers ?? s.charger_count ?? 0;
      const avail = q?.available_chargers ?? chargers;
      free += avail;
      total += chargers;
      const w = s.breakdown?.predicted_wait_minutes || 0;
      waitSum += w;
      if (w < 1) zeroWait += 1;
      priceSum += s.pricing_per_kwh || 0;
    });
    const n = ids.length || 1;
    return {
      free,
      total,
      hubs: ids.length,
      avgWait: waitSum / n,
      avgPrice: priceSum / n,
      zeroWait,
      readyPct: total ? (free / total) * 100 : 0,
    };
  }, [ranked, queues]);

  const handleJoin = async (station) => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    if (!userVehicle?.id) {
      setJoinState((prev) => ({ ...prev, [station.station_id]: { error: 'Save an EV profile first.' } }));
      return;
    }
    setJoinState((prev) => ({ ...prev, [station.station_id]: { loading: true } }));
    try {
      const res = await joinQueue(station.station_id, userVehicle.id, batteryPct, targetSoc);
      setJoinState((prev) => ({
        ...prev,
        [station.station_id]: {
          ok: `Queued · ~${Math.round(res.estimated_wait_minutes)} min wait`,
        },
      }));
      const q = await fetchStationQueue(station.station_id);
      setQueues((prev) => ({ ...prev, [station.station_id]: q }));
    } catch (err) {
      setJoinState((prev) => ({
        ...prev,
        [station.station_id]: { error: err.message || 'Could not join queue' },
      }));
    }
  };

  const chipClass = (id) =>
    filter === id
      ? 'px-3.5 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-semibold whitespace-nowrap flex items-center gap-1.5'
      : 'px-3.5 py-1.5 rounded-full bg-[#F5F2EB] hover:bg-surface-variant text-[#6E716E] hover:text-on-surface border border-[#E8E4DC] whitespace-nowrap transition-colors flex items-center gap-1';

  if (loading && !ranked.length) {
    return (
      <main className="relative z-10 flex-1 pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <p className="text-[#6E716E]">Loading live stations from the network…</p>
      </main>
    );
  }

  if (!ranked.length) {
    return (
      <main className="relative z-10 flex-1 pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
        <h1 className="text-headline-xl font-display font-extrabold text-[#181A19]">Smart Station Hub</h1>
        <p className="text-[#6E716E] mt-2">No stations found near this location. Expand the search radius on the dashboard.</p>
      </main>
    );
  }

  return (
    <main className="relative z-10 flex-1 pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="pt-4 pb-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] shadow-sm border border-[#10B981]/20 text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#10B981]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8F5E9]"></span>
          </span>
          Live network directory · {recommendationData?.total_found ?? ranked.length} stations
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-headline-xl font-display font-extrabold text-[#181A19] tracking-tight leading-tight">
              Smart Station Hub
            </h1>
            <p className="text-body-lg font-body font-medium text-[#6E716E] max-w-2xl mt-1">
              Software-only virtual queue coordination and wait-time predictions.
            </p>
          </div>
          <div className="flex items-center gap-2 text-label-md font-label-ui font-bold text-[#6E716E] bg-[#F5F2EB] px-3.5 py-1.5 rounded-full border border-[#E8E4DC]">
            <span className="material-symbols-outlined text-[#595C59] text-sm">sync</span>
            <span>
              Last sync: <span className="text-[#10B981] font-mono">{syncAge}s ago</span>
            </span>
          </div>
        </div>

        {/* Mandatory Transparency Notice */}
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">info</span>
          <div>
            <strong className="font-semibold block mb-0.5">Virtual Queue & Wait-Time Estimation Notice</strong>
            Virtual estimate only — this does not reserve a physical charger. Station availability is not confirmed by the operator.
            Requests are self-reported and coordinated via our virtual queue engine.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          title="Available stalls"
          icon="ev_charger"
          value={totals.free.toLocaleString()}
          suffix={`/ ${totals.total.toLocaleString()}`}
          bar={totals.readyPct}
          footer={`${totals.readyPct.toFixed(0)}% free`}
          sub={`${totals.hubs} hubs in range`}
        />
        <KpiCard
          title="Average predicted wait"
          icon="timer"
          value={totals.avgWait < 1 ? '0' : totals.avgWait.toFixed(1)}
          suffix="min"
          accent
          footer={`${totals.zeroWait} of ${totals.hubs} with under 1 min wait`}
        />
        <KpiCard
          title="Reachable now"
          icon="battery_charging_full"
          value={String(recommendationData?.reachable_count ?? ranked.length)}
          suffix={`/ ${recommendationData?.total_found ?? ranked.length}`}
          footer={`Range ~${Math.round(recommendationData?.estimated_range_km || 0)} km at ${batteryPct}% SoC`}
        />
        <KpiCard
          title="Average tariff"
          icon="payments"
          value={formatPrice(totals.avgPrice).split(' /')[0]}
          suffix="/ kWh"
          footer="From live station pricing"
        />
      </div>

      <div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-3 md:p-4 mb-8 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9E9B93]">
              <span className="material-symbols-outlined text-lg">search</span>
            </div>
            <input
              className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest/80 border border-[#E8E4DC] rounded-xl text-[#181A19] placeholder:text-outline font-body font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-sm md:text-body-md"
              placeholder="Search station name, operator, city, or connector…"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() =>
              setSortMode((m) => (m === 'fastest' ? 'nearest' : m === 'nearest' ? 'power' : 'fastest'))
            }
            className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-surface-container-lowest/80 border border-[#E8E4DC] text-[#6E716E] hover:text-primary font-label-ui font-bold text-label-md transition-all"
          >
            <span className="material-symbols-outlined text-sm">tune</span>
            Sort: {sortMode === 'fastest' ? 'Fastest access' : sortMode === 'nearest' ? 'Nearest' : 'Highest power'}
          </button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-label-md">
          <span className="text-[#9E9B93] text-label-sm font-label-ui uppercase tracking-wider font-bold mr-1 hidden sm:inline">
            Filters:
          </span>
          <button type="button" className={chipClass('all')} onClick={() => setFilter('all')}>
            All stations
          </button>
          <button type="button" className={chipClass('ultra')} onClick={() => setFilter('ultra')}>
            <span className="material-symbols-outlined text-xs">bolt</span>
            150 kW+
          </button>
          <button type="button" className={chipClass('zero')} onClick={() => setFilter('zero')}>
            <span className="material-symbols-outlined text-xs">check_circle</span>
            Near-zero wait
          </button>
          <button type="button" className={chipClass('ccs')} onClick={() => setFilter('ccs')}>
            CCS connectors
          </button>
        </div>
      </div>

      {featured && (
        <FeaturedStation
          station={featured}
          queue={queues[featured.station_id]}
          onPlanOrJoin={() => setQueueModalStation(featured)}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {rest.map((station) => (
          <StationMiniCard
            key={station.station_id}
            station={station}
            queue={queues[station.station_id]}
            onPlanOrJoin={() => setQueueModalStation(station)}
          />
        ))}
      </div>

      <VirtualQueueModal
        isOpen={Boolean(queueModalStation)}
        onClose={() => setQueueModalStation(null)}
        station={queueModalStation}
        userVehicle={userVehicle}
        userVehicles={userVehicles}
        batteryPct={batteryPct}
        defaultTargetSoc={targetSoc}
        onQueueUpdated={(stationId, updatedQueue) => {
          setQueues((prev) => ({ ...prev, [stationId]: updatedQueue }));
        }}
      />
    </main>
  );
}

function KpiCard({ title, icon, value, suffix, bar, footer, sub, accent }) {
  return (
    <div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-5">
      <div className="flex items-center justify-between text-[#6E716E] text-label-md font-label-ui font-bold mb-2">
        <span>{title}</span>
        <span className="material-symbols-outlined text-[#10B981] text-base">{icon}</span>
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-headline-lg font-display font-extrabold ${accent ? 'text-[#10B981]' : 'text-[#181A19]'}`}>
          {value}
        </span>
        {suffix && <span className="text-body-sm text-[#9E9B93]">{suffix}</span>}
      </div>
      {bar != null && (
        <div className="w-full bg-[#F5F2EB] rounded-full h-2 overflow-hidden mb-2">
          <div className="bg-[#10B981] h-full rounded-full" style={{ width: `${Math.min(100, bar)}%` }} />
        </div>
      )}
      {footer && (
        <div className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#10B981]">
          {footer}
        </div>
      )}
      {sub && <span className="text-body-sm text-[#9E9B93]">{sub}</span>}
    </div>
  );
}

function FeaturedStation({ station, queue, onPlanOrJoin }) {
  const wait = station.breakdown?.predicted_wait_minutes;
  const { bays, free, total } = buildBayMatrix(station.charger_count, {
    ...queue,
    power_kw: station.power_kw,
  });
  const util = utilizationLabel(free, total);
  const chips = amenityChips(station.amenities);

  return (
    <div className="bg-[#FFFFFF] shadow-sm border border-[#10B981]/25 rounded-3xl p-6 md:p-8 relative overflow-hidden mb-8">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#E8F5E9] text-[#181A19] font-label-ui uppercase tracking-wider font-bold text-label-sm flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">navigation</span>
              {station.recommendation_tag || 'Top ranked'}
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#F5F2EB] text-[#10B981] border border-[#10B981]/20 text-label-sm font-label-ui uppercase tracking-wider font-bold">
              {formatWait(wait)} wait
            </span>
            <span className="px-2.5 py-1 rounded-full bg-[#FFFFFF] text-amber-600 text-label-sm font-label-ui uppercase tracking-wider font-bold font-mono">
              {formatPrice(station.pricing_per_kwh)}
            </span>
          </div>
          <h2 className="text-headline-lg font-display font-extrabold text-[#181A19] tracking-tight">
            {station.station_name}
          </h2>
          <p className="text-body-md font-body font-medium text-[#6E716E] flex items-center gap-2 mt-0.5">
            <span className="material-symbols-outlined text-[#9E9B93] text-base">pin_drop</span>
            {station.address} · {station.city_region} · {station.breakdown.road_distance_km} km (
            {Math.round(station.breakdown.travel_time_minutes)} min)
          </p>
        </div>
        <div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-1 bg-[#F5F2EB] px-4 py-3 rounded-2xl border border-[#E8E4DC] min-w-[190px]">
          <span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93]">
            Virtual queue status
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-headline-md font-display font-extrabold text-[#10B981]">
              {free} of {total}
            </span>
            <span className="text-body-sm text-[#6E716E]">bays estimated free</span>
          </div>
          <span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#10B981]">
            {util.text} · {station.power_kw} kW
          </span>
        </div>
      </div>

      {bays.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3 text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93]">
            <span>Simulated stall status (virtual queue)</span>
            <span className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#10B981]"></span> Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#E8E4DC]"></span> In use
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Queued
              </span>
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2.5">
            {bays.map((bay) => (
              <div
                key={bay.id}
                className={`p-2.5 rounded-xl flex flex-col items-center justify-center text-center border ${
                  bay.status === 'free'
                    ? 'bg-[#FFFFFF] border-[#10B981]/40'
                    : bay.status === 'reserved'
                    ? 'bg-amber-100 border-amber-300'
                    : 'bg-[#F5F2EB] border-[#E8E4DC] opacity-70'
                }`}
              >
                <span className="text-label-sm font-mono text-[#9E9B93]">{bay.id}</span>
                <span
                  className={`material-symbols-outlined text-xl my-1 ${
                    bay.status === 'free'
                      ? 'text-[#10B981]'
                      : bay.status === 'reserved'
                      ? 'text-amber-600'
                      : 'text-[#9E9B93]'
                  }`}
                >
                  {bay.status === 'free' ? 'bolt' : bay.status === 'reserved' ? 'lock_clock' : 'hourglass_top'}
                </span>
                <span className="text-label-sm font-bold font-mono">{station.power_kw} kW</span>
                <span className="text-[9px] uppercase mt-0.5">
                  {bay.status === 'free' ? 'Free' : bay.status === 'reserved' ? 'Queued' : 'In use'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-[#E8E4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 text-[#6E716E] text-body-sm flex-wrap">
          <span className="text-[#9E9B93] text-label-sm font-label-ui uppercase tracking-wider font-bold">
            Amenities
          </span>
          {chips.length ? (
            chips.map((c) => (
              <span key={c.label} className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#595C59] text-base">{c.icon}</span>
                {c.label}
              </span>
            ))
          ) : (
            <span>{(station.connector_types || []).join(', ') || 'No amenities listed'}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <a
            href={station.google_maps_url}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-full bg-[#FFFFFF] border border-[#E8E4DC] text-[#181A19] text-label-md font-label-ui font-bold flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-base">directions</span>
            Route navigation
          </a>
          <button
            type="button"
            onClick={onPlanOrJoin}
            className="px-6 py-2.5 rounded-full bg-[#E8F5E9] text-[#181A19] hover:bg-[#c8e6c9] font-label-ui font-bold text-label-md flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-base">schedule</span>
            Plan / Join virtual queue
          </button>
        </div>
      </div>
    </div>
  );
}

function StationMiniCard({ station, queue, onPlanOrJoin }) {
  const wait = station.breakdown?.predicted_wait_minutes || 0;
  const free = queue?.available_chargers ?? station.charger_count;
  const total = queue?.total_chargers ?? station.charger_count;
  const util = utilizationLabel(free, total);
  const chips = amenityChips(station.amenities);
  const busy = wait >= 10 || (total && free / total <= 0.2);

  return (
    <div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] hover:border-[#10B981] transition-colors rounded-3xl p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`px-2.5 py-0.5 rounded-full text-label-sm font-label-ui uppercase tracking-wider font-bold ${
              busy
                ? 'bg-red-100 text-red-500 border border-red-200'
                : 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20'
            }`}
          >
            {util.text}
          </span>
          <span className="text-label-sm font-label-ui font-bold font-mono text-[#6E716E]">
            {formatPrice(station.pricing_per_kwh)}
          </span>
        </div>
        <h3 className="text-headline-sm font-display font-bold text-[#181A19]">{station.station_name}</h3>
        <p className="text-body-sm text-[#6E716E] mt-1 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs text-[#9E9B93]">location_on</span>
          {station.city_region} · {station.breakdown.road_distance_km} km (
          {Math.round(station.breakdown.travel_time_minutes)} min)
        </p>
        <div className="my-5 p-3.5 rounded-2xl bg-[#F5F2EB] border border-[#E8E4DC] space-y-2">
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-[#9E9B93]">Est. free chargers</span>
            <span className={`font-bold font-mono ${busy ? 'text-red-500' : 'text-[#10B981]'}`}>
              {free} of {total} bays
            </span>
          </div>
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-[#9E9B93]">Predicted wait</span>
            <span className="text-[#181A19] font-mono">{formatWait(wait)}</span>
          </div>
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-[#9E9B93]">Max power</span>
            <span className="text-[#10B981] font-mono font-semibold">{station.power_kw} kW</span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-label-sm text-[#6E716E] mb-6 flex-wrap">
          {chips.length
            ? chips.map((c) => (
                <span key={c.label} className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">{c.icon}</span> {c.label}
                </span>
              ))
            : (station.connector_types || []).slice(0, 2).map((c) => <span key={c}>{c}</span>)}
        </div>
      </div>
      <button
        type="button"
        onClick={onPlanOrJoin}
        className="w-full py-2.5 rounded-full bg-[#E8F5E9] text-[#181A19] hover:bg-[#c8e6c9] font-label-ui font-bold text-label-md flex items-center justify-center gap-1.5 transition-colors"
      >
        <span className="material-symbols-outlined text-sm">schedule</span>
        Plan / Join virtual queue
      </button>
    </div>
  );
}
