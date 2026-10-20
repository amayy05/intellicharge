import React, { useEffect, useMemo, useState } from 'react';
import { fetchStationForecast24h, fetchStationQueue, joinQueue } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatWait, utilizationLabel } from '../utils/stationDisplay';

function waitToY(mins, maxWait = 30) {
  const t = Math.min(maxWait, Math.max(0, mins)) / maxWait;
  return 215 + (20 - 215) * t;
}

function buildPath(hours, close = false) {
  if (!hours?.length) return '';
  const step = hours.length > 1 ? 800 / (hours.length - 1) : 800;
  const pts = hours.map((h, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${waitToY(h.predicted_wait_minutes)}`);
  if (close) {
    const lastX = (hours.length - 1) * step;
    return `${pts.join(' ')} L ${lastX} 215 L 0 215 Z`;
  }
  return pts.join(' ');
}

function congestionColor(mins) {
  if (mins <= 2) return 'bg-[#10B981]';
  if (mins <= 10) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function QueuePredictor({
  recommendationData,
  loading,
  batteryPct = 42,
  targetSoc = 80,
  userVehicle,
}) {
  const { isAuthenticated, openLoginModal } = useAuth();
  const ranked = recommendationData?.ranked_stations || [];
  const [selectedId, setSelectedId] = useState(null);
  const [horizon, setHorizon] = useState(24);
  const [forecast, setForecast] = useState(null);
  const [queues, setQueues] = useState({});
  const [now, setNow] = useState(new Date());
  const [scrubIndex, setScrubIndex] = useState(0);
  const [joinState, setJoinState] = useState({});
  const [forecastError, setForecastError] = useState('');

  const selected = ranked.find((s) => s.station_id === selectedId) || ranked[0];

  useEffect(() => {
    if (ranked[0] && !selectedId) setSelectedId(ranked[0].station_id);
  }, [ranked, selectedId]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selected) return;
      setForecastError('');
      try {
        const data = await fetchStationForecast24h(selected.station_id);
        if (!cancelled) {
          setForecast(data);
          setScrubIndex(0);
        }
      } catch (err) {
        if (!cancelled) setForecastError(err.message || 'Forecast unavailable');
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selected?.station_id]);

  useEffect(() => {
    let cancelled = false;
    async function loadQueues() {
      const ids = ranked.slice(0, 6).map((s) => s.station_id);
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            return [id, await fetchStationQueue(id)];
          } catch {
            return [id, null];
          }
        })
      );
      if (!cancelled) setQueues(Object.fromEntries(entries));
    }
    if (ranked.length) loadQueues();
    return () => {
      cancelled = true;
    };
  }, [ranked.map((s) => s.station_id).join(',')]);

  const hours = useMemo(() => {
    const all = forecast?.hours || [];
    return horizon === 6 ? all.slice(0, 6) : all;
  }, [forecast, horizon]);

  const avgWaitNow = useMemo(() => {
    if (!ranked.length) return 0;
    const n = Math.min(ranked.length, 8);
    return ranked.slice(0, n).reduce((s, st) => s + (st.breakdown?.predicted_wait_minutes || 0), 0) / n;
  }, [ranked]);

  const peakHour = forecast?.peak_hour_label;
  const peakWait = forecast?.peak_wait_minutes || 0;
  const selectedHour = hours[scrubIndex] || hours[0];
  const maxWait = Math.max(30, ...hours.map((h) => h.predicted_wait_minutes || 0));

  const handleJoin = async (station) => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }
    if (!userVehicle?.id) {
      setJoinState((p) => ({ ...p, [station.station_id]: { error: 'Save an EV profile first.' } }));
      return;
    }
    setJoinState((p) => ({ ...p, [station.station_id]: { loading: true } }));
    try {
      const res = await joinQueue(station.station_id, userVehicle.id, batteryPct, targetSoc);
      setJoinState((p) => ({
        ...p,
        [station.station_id]: { ok: `Queued · ~${Math.round(res.estimated_wait_minutes)} min` },
      }));
    } catch (err) {
      setJoinState((p) => ({ ...p, [station.station_id]: { error: err.message || 'Join failed' } }));
    }
  };

  if (loading && !ranked.length) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <p className="text-[#6E716E]">Loading live queue forecasts…</p>
      </main>
    );
  }

  if (!ranked.length) {
    return (
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
        <h1 className="text-headline-lg font-display font-extrabold text-[#181A19]">
          Station Queue Predictor
        </h1>
        <p className="text-[#6E716E] mt-2">No stations in range to forecast. Search from the dashboard first.</p>
      </main>
    );
  }

  const fillPath = buildPath(hours, true);
  const linePath = buildPath(hours, false);
  const peakIdx = hours.findIndex((h) => h.hour_label === peakHour);
  const peakX = hours.length > 1 ? (Math.max(0, peakIdx) / (hours.length - 1)) * 800 : 0;
  const peakY = waitToY(peakWait, maxWait > 30 ? maxWait : 30);

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F2EB] border border-[#10B981]/25 text-[#10B981] text-label-sm font-label-ui uppercase tracking-wider font-bold">
            <span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
            <span>{forecast?.confidence_source === 'model' ? 'Trained wait model' : 'Heuristic wait model'}</span>
            <span className="text-[#E8E4DC]">|</span>
            <span className="text-[#6E716E] font-normal">Live queue occupancy</span>
          </div>
          <h1 className="text-headline-lg font-display font-extrabold text-[#181A19] tracking-tight">
            Station Queue Predictor &amp; 24h Congestion Forecast
          </h1>
          <p className="text-body-md font-body font-medium text-[#6E716E] max-w-3xl">
            Stall occupancy from the queue engine, plus hourly wait predictions for stations near you.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E8E4DC] flex items-center gap-2 text-label-md font-label-ui font-bold text-[#595C59]">
          <span className="material-symbols-outlined text-[16px] text-[#10B981]">schedule</span>
          <span className="text-[#181A19] font-semibold tabular-nums">
            {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <span className="text-[10px] px-1.5 rounded bg-[#F5F2EB] text-[#6E716E] font-medium">LIVE</span>
        </div>
      </section>

      <section className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-3 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93] pl-2 pr-1">
            Station:
          </span>
          {ranked.slice(0, 5).map((s) => {
            const active = selected?.station_id === s.station_id;
            return (
              <button
                key={s.station_id}
                type="button"
                onClick={() => setSelectedId(s.station_id)}
                className={`px-3 py-1.5 rounded-full text-label-md font-label-ui font-semibold transition-all ${
                  active ? 'bg-[#E8F5E9] text-[#181A19] shadow-sm' : 'bg-[#F5F2EB] text-[#6E716E]'
                }`}
              >
                {s.station_name}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 bg-[#F9F7F2] p-1 rounded-xl border border-[#E8E4DC]">
          <button
            type="button"
            onClick={() => setHorizon(6)}
            className={`px-2.5 py-1 rounded-lg text-label-sm font-label-ui uppercase tracking-wider font-bold ${
              horizon === 6 ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' : 'text-[#6E716E]'
            }`}
          >
            Next 6h
          </button>
          <button
            type="button"
            onClick={() => setHorizon(24)}
            className={`px-3 py-1 rounded-lg text-label-sm font-label-ui uppercase tracking-wider font-bold ${
              horizon === 24 ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30' : 'text-[#6E716E]'
            }`}
          >
            Next 24h
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-5">
          <span className="text-label-md font-label-ui font-bold text-[#6E716E]">Average wait now</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-[48px] leading-[52px] font-extrabold text-[#10B981] tracking-tight tabular-nums">
              {avgWaitNow < 1 ? '0' : avgWaitNow.toFixed(1)}
            </span>
            <span className="text-headline-sm font-display font-bold text-[#595C59]">mins</span>
          </div>
          <p className="text-body-sm text-[#6E716E]">Across {Math.min(ranked.length, 8)} nearby stations</p>
        </div>
        <div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-5">
          <span className="text-label-md font-label-ui font-bold text-[#6E716E]">Predicted peak window</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-headline-lg font-display font-extrabold text-[#181A19] tracking-tight tabular-nums">
              {peakHour || '—'}
            </span>
          </div>
          <p className="text-body-sm text-amber-600 font-semibold">
            {formatWait(peakWait)} projected wait
          </p>
        </div>
        <div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-5">
          <span className="text-label-md font-label-ui font-bold text-[#6E716E]">Current station wait</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-[48px] leading-[52px] font-extrabold text-[#181A19] tracking-tight tabular-nums">
              {forecast ? formatWait(forecast.current_wait_minutes).replace(' min', '') : '—'}
            </span>
            <span className="text-headline-sm font-display font-bold text-[#595C59]">min</span>
          </div>
          <p className="text-body-sm text-[#6E716E]">{selected?.station_name}</p>
        </div>
        <div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-5">
          <span className="text-label-md font-label-ui font-bold text-[#6E716E]">Model source</span>
          <div className="my-3 flex items-baseline gap-2">
            <span className="text-headline-lg font-display font-extrabold text-[#10B981] tracking-tight">
              {forecast?.confidence_source === 'model' ? 'ML' : 'Heuristic'}
            </span>
          </div>
          <p className="text-body-sm text-[#6E716E]">Labeled — not a fake accuracy %</p>
        </div>
      </section>

      {forecastError && <p className="text-red-500 text-sm mb-4">{forecastError}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8E4DC] gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-headline-sm font-display font-bold text-[#181A19]">
                    Predictive wait time
                  </h2>
                  <span className="px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25 text-[10px] font-label-ui uppercase tracking-wider font-semibold">
                    {selected?.station_name}
                  </span>
                </div>
                <p className="text-body-sm font-body font-medium text-[#6E716E] mt-0.5">
                  Hourly wait estimates from the same predictor used on station cards
                </p>
              </div>
            </div>

            <div className="relative w-full h-72 my-4">
              <div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-[11px] text-[#9E9B93] tabular-nums pr-2">
                <span>30m</span>
                <span>20m</span>
                <span>10m</span>
                <span>0m</span>
              </div>
              <div className="ml-8 h-full relative">
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 240">
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity="0.38" />
                      <stop offset="100%" stopColor="#34d399" stopOpacity="0.00" />
                    </linearGradient>
                  </defs>
                  {fillPath && <path d={fillPath} fill="url(#emeraldGradient)" />}
                  {linePath && (
                    <path d={linePath} fill="none" stroke="#34d399" strokeWidth="3.5" />
                  )}
                  {peakIdx >= 0 && (
                    <g>
                      <line stroke="#f59e0b" strokeDasharray="3 3" strokeWidth="1.5" x1={peakX} x2={peakX} y1="20" y2="215" />
                      <circle cx={peakX} cy={peakY} fill="#f59e0b" r="6" stroke="#00180c" strokeWidth="2" />
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {hours.length > 0 && (
              <>
                <div className="flex items-center justify-between text-body-sm text-[#6E716E] mb-2">
                  <span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93]">
                    Forecast scrubber
                  </span>
                  <div className="px-2.5 py-0.5 rounded-md bg-[#F5F2EB] text-[#10B981] font-label-ui font-semibold">
                    {selectedHour?.hour_label} · {formatWait(selectedHour?.predicted_wait_minutes)} ·{' '}
                    {selectedHour?.congestion_level}
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, hours.length - 1)}
                  value={scrubIndex}
                  onChange={(e) => setScrubIndex(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-label-sm font-label-ui text-[#9E9B93] tabular-nums pt-1">
                  {hours.filter((_, i) => i % Math.ceil(hours.length / 8) === 0).map((h) => (
                    <span key={h.hour_label}>{h.hour_label}</span>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 pt-4 border-t border-[#E8E4DC]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-label-md font-label-ui font-semibold text-[#181A19]">
                  Congestion matrix (hourly)
                </span>
                <div className="flex items-center gap-3 text-label-sm font-label-ui uppercase tracking-wider font-bold">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]"></span> 0-2m
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> 3-10m
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span> 10m+
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-12 gap-1">
                {(forecast?.hours || []).map((h) => (
                  <div
                    key={h.arrival_time}
                    className={`h-6 rounded flex items-center justify-center text-[9px] font-bold text-white ${congestionColor(
                      h.predicted_wait_minutes
                    )}`}
                    title={`${h.hour_label} · ${formatWait(h.predicted_wait_minutes)}`}
                  >
                    {Math.round(h.predicted_wait_minutes)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {selected && (
            <div className="bg-[#FFFFFF] shadow-sm border border-[#10B981]/30 rounded-3xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shrink-0">
                  <span className="material-symbols-outlined text-[24px]">auto_awesome</span>
                </div>
                <div className="space-y-2">
                  <span className="text-label-md font-label-ui font-bold uppercase tracking-wider text-[#10B981]">
                    Dispatch advice
                  </span>
                  <p className="text-body-md font-body text-[#181A19] leading-relaxed">
                    <strong>{selected.station_name}</strong> is {selected.breakdown.road_distance_km} km away
                    ({Math.round(selected.breakdown.travel_time_minutes)} min drive). Predicted wait on arrival is{' '}
                    <strong>{formatWait(selected.breakdown.predicted_wait_minutes)}</strong>
                    {peakHour ? (
                      <>
                        . Peak congestion around <strong className="text-amber-600">{peakHour}</strong> (
                        {formatWait(peakWait)}).
                      </>
                    ) : null}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href={selected.google_maps_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-1.5 rounded-full bg-[#10B981] text-[#FAF8F5] font-label-ui font-semibold flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">navigation</span>
                      Navigate now
                    </a>
                    <button
                      type="button"
                      onClick={() => handleJoin(selected)}
                      className="px-3.5 py-1.5 rounded-full bg-[#F5F2EB] text-[#595C59] text-label-md font-label-ui font-bold border border-[#E8E4DC]"
                    >
                      Join virtual queue
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="lg:col-span-4 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-headline-sm font-display font-bold text-[#181A19]">Live station queues</h2>
            <span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93]">
              {Math.min(ranked.length, 6)} nearby
            </span>
          </div>
          {ranked.slice(0, 6).map((s, idx) => {
            const q = queues[s.station_id];
            const wait = s.breakdown?.predicted_wait_minutes || 0;
            const free = q?.available_chargers ?? s.charger_count;
            const total = q?.total_chargers ?? s.charger_count;
            const util = utilizationLabel(free, total);
            const js = joinState[s.station_id];
            return (
              <div
                key={s.station_id}
                className={`bg-[#FFFFFF] shadow-sm border rounded-3xl p-5 ${
                  idx === 0 ? 'border-2 border-[#10B981]/40' : wait >= 10 ? 'border-amber-300' : 'border-[#E8E4DC]'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {idx === 0 && (
                        <span className="text-label-sm font-label-ui uppercase px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] font-bold">
                          Recommended
                        </span>
                      )}
                      {wait >= 10 && (
                        <span className="text-label-sm font-label-ui uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-600 font-bold">
                          Congestion
                        </span>
                      )}
                      <span className="text-label-sm font-label-ui text-[#9E9B93]">
                        {(s.connector_types || [])[0]} {s.power_kw}kW
                      </span>
                    </div>
                    <h3 className="text-headline-sm font-display font-bold text-[#181A19] mt-1">{s.station_name}</h3>
                    <p className="text-body-sm text-[#6E716E]">{s.city_region}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-label-md font-label-ui font-bold text-[#10B981]">
                      {s.breakdown.road_distance_km} km
                    </span>
                    <p className="text-body-sm text-[#595C59] tabular-nums">
                      {Math.round(s.breakdown.travel_time_minutes)} min drive
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-2xl bg-[#F5F2EB] border border-[#E8E4DC]">
                  <div>
                    <span className="text-label-sm font-label-ui uppercase text-[#6E716E] block">Live wait</span>
                    <span className="font-bold text-[#10B981]">{formatWait(wait)}</span>
                  </div>
                  <div>
                    <span className="text-label-sm font-label-ui uppercase text-[#6E716E] block">Stalls</span>
                    <span className="text-[#181A19] font-semibold tabular-nums">
                      {free} of {total} free
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#6E716E] mb-3">
                  {util.text} · {formatPrice(s.pricing_per_kwh)}
                </p>
                <button
                  type="button"
                  onClick={() => handleJoin(s)}
                  disabled={js?.loading || js?.ok}
                  className="w-full py-2.5 rounded-full bg-[#10B981] text-[#FAF8F5] font-label-ui font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {js?.ok || (js?.loading ? 'Joining…' : 'Join virtual queue')}
                </button>
                {js?.error && <p className="text-red-500 text-xs mt-2">{js.error}</p>}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}
