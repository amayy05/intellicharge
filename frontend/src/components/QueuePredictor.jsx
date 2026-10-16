import React from 'react';

export default function QueuePredictor() {
  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20">

<section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
<div className="space-y-2">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5F2EB] border border-[#10B981]/25 text-[#10B981] text-label-sm font-label-ui uppercase tracking-wider font-bold">
<span className="w-2 h-2 rounded-full bg-[#10B981] beacon-pulse"></span>
<span className="tracking-wide">Autonomous Predictive Flow AI v3.4</span>
<span className="text-[#E8E4DC]">|</span>
<span className="text-[#6E716E] font-normal">Real-Time Influx Sync Active</span>
</div>
<h1 className="text-headline-lg font-display font-extrabold font-bold text-[#181A19] tracking-tight">
          Station Queue Predictor &amp; 24h Congestion Forecast
        </h1>
<p className="text-body-md font-body font-medium text-[#6E716E] max-w-3xl">
          Real-time stall availability combined with machine-learning predictive wait models, arrival clustering curves, and grid peak balancing.
        </p>
</div>

<div className="flex items-center gap-3 shrink-0">
<div className="px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#E8E4DC] flex items-center gap-2 text-label-md font-label-ui font-bold text-[#595C59]">
<span className="material-symbols-outlined text-[16px] text-[#10B981]" data-icon="schedule">schedule</span>
<span className="text-[#181A19] font-semibold tabular-nums">14:30:18 CET</span>
<span className="text-[10px] px-1.5 py-0.2 rounded bg-[#F5F2EB] text-[#6E716E] font-medium">LIVE</span>
</div>
</div>
</section>

<section className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-3 mb-6 flex flex-wrap items-center justify-between gap-4">

<div className="flex flex-wrap items-center gap-1.5">
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93] uppercase tracking-wider pl-2 pr-1">Station:</span>
<button className="px-3 py-1.5 rounded-full text-label-md font-label-ui font-bold font-semibold bg-[#F5F2EB] text-[#6E716E] hover:text-on-surface border border-transparent hover:border-outline-variant/40 transition-all">All Superhubs</button>
<button className="px-3.5 py-1.5 rounded-full text-label-md font-label-ui font-bold font-semibold bg-[#E8F5E9] text-[#181A19] shadow-sm glow-primary flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-on-primary-container"></span>
<span>Ionix Rapid West</span>
</button>
<button className="px-3 py-1.5 rounded-full text-label-md font-label-ui font-bold font-semibold bg-[#F5F2EB] text-[#6E716E] hover:text-on-surface border border-transparent hover:border-outline-variant/40 transition-all">EcoVolt Metro</button>
<button className="px-3 py-1.5 rounded-full text-label-md font-label-ui font-bold font-semibold bg-[#F5F2EB] text-[#6E716E] hover:text-on-surface border border-transparent hover:border-outline-variant/40 transition-all">Nordic Way Tech</button>
<button className="px-3 py-1.5 rounded-full text-label-md font-label-ui font-bold font-semibold bg-[#F5F2EB] text-[#6E716E] hover:text-on-surface border border-transparent hover:border-outline-variant/40 transition-all">AlpineVolt Valley</button>
</div>

<div className="flex items-center gap-3 ml-auto">

<div className="hidden md:flex items-center gap-1 bg-surface-container-low/70 p-1 rounded-xl border border-[#E8E4DC]">
<button className="px-2.5 py-1 rounded-lg text-label-sm font-label-ui uppercase tracking-wider font-bold font-medium bg-[#FFFFFF] text-[#10B981] border border-[#10B981]/20">Autobahn A99</button>
<button className="px-2.5 py-1 rounded-lg text-label-sm font-label-ui uppercase tracking-wider font-bold font-medium text-[#6E716E] hover:text-on-surface">A8 Salzburg</button>
<button className="px-2.5 py-1 rounded-lg text-label-sm font-label-ui uppercase tracking-wider font-bold font-medium text-[#6E716E] hover:text-on-surface">München Ring</button>
</div>

<div className="flex items-center gap-1 bg-[#F9F7F2] p-1 rounded-xl border border-[#E8E4DC]">
<button className="px-2.5 py-1 rounded-lg text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E] hover:text-on-surface">Next 6h</button>
<button className="px-3 py-1 rounded-lg text-label-sm font-label-ui uppercase tracking-wider font-bold font-semibold bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30">Next 24h</button>
<button className="px-2.5 py-1 rounded-lg text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E] hover:text-on-surface">Weekend</button>
</div>
</div>
</section>

<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-space-md flex flex-col justify-between glow-soft relative overflow-hidden group hover:border-primary/40 transition-all">
<div className="flex items-start justify-between">
<span className="text-label-md font-label-ui font-bold text-[#6E716E]">Fleet Average Wait Now</span>
<div className="w-7 h-7 rounded-lg bg-[#F5F2EB] flex items-center justify-center text-[#10B981]">
<span className="material-symbols-outlined text-[18px]" data-icon="hourglass_top">hourglass_top</span>
</div>
</div>
<div className="my-3 flex items-baseline gap-2">
<span className="text-[48px] leading-[52px] font-metric font-extrabold text-[#10B981] tracking-tight tabular-nums">1.8</span>
<span className="text-headline-sm font-display font-bold text-[#595C59]">mins</span>
</div>
<div className="flex items-center justify-between text-body-sm font-body font-medium">
<div className="flex items-center gap-1 text-[#10B981]">
<span className="material-symbols-outlined text-[16px]" data-icon="trending_down">trending_down</span>
<span className="font-semibold">-74%</span>
<span className="text-[#6E716E] text-[11px]">vs corridor baseline</span>
</div>

<svg className="w-16 h-5" fill="none" viewBox="0 0 64 20">
<path d="M1 18 L16 14 L32 15 L48 8 L63 2" stroke="#34d399" strokeLinecap="round" strokeWidth="2"></path>
</svg>
</div>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-space-md flex flex-col justify-between glow-soft relative overflow-hidden group hover:border-tertiary-container/40 transition-all">
<div className="flex items-start justify-between">
<span className="text-label-md font-label-ui font-bold text-[#6E716E]">Predicted Peak Window</span>
<div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
<span className="material-symbols-outlined text-[18px]" data-icon="warning">warning</span>
</div>
</div>
<div className="my-3 flex items-baseline gap-2">
<span className="text-headline-lg font-display font-extrabold font-bold text-[#181A19] tracking-tight tabular-nums">17:15 - 18:45</span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E]">CET</span>
</div>
<div className="flex items-center gap-1.5 text-body-sm font-body font-medium text-amber-600">
<span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
<span className="font-semibold">+14 min</span>
<span className="text-[#6E716E] text-[11px]">projected unreserved wait</span>
</div>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-space-md flex flex-col justify-between glow-soft relative overflow-hidden group hover:border-primary/40 transition-all">
<div className="flex items-start justify-between">
<span className="text-label-md font-label-ui font-bold text-[#6E716E]">Autonomous Re-Route Clearance</span>
<div className="w-7 h-7 rounded-lg bg-[#F5F2EB] flex items-center justify-center text-[#10B981]">
<span className="material-symbols-outlined text-[18px]" data-icon="alt_route">alt_route</span>
</div>
</div>
<div className="my-3 flex items-baseline gap-2">
<span className="text-[48px] leading-[52px] font-metric font-extrabold text-[#181A19] tracking-tight tabular-nums">94.2%</span>
</div>
<div className="flex items-center gap-1 text-body-sm font-body font-medium text-[#595C59]">
<span className="material-symbols-outlined text-[16px] text-[#10B981]" data-icon="check_circle">check_circle</span>
<span className="font-medium text-[#181A19]">142 autonomous</span>
<span className="text-[#6E716E] text-[11px]">vehicles balanced</span>
</div>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-2xl p-space-md flex flex-col justify-between glow-soft relative overflow-hidden group hover:border-primary/40 transition-all">
<div className="flex items-start justify-between">
<span className="text-label-md font-label-ui font-bold text-[#6E716E]">AI Reserve Window Confidence</span>
<div className="w-7 h-7 rounded-lg bg-[#F5F2EB] flex items-center justify-center text-[#10B981]">
<span className="material-symbols-outlined text-[18px]" data-icon="verified">verified</span>
</div>
</div>
<div className="my-3 flex items-baseline gap-2">
<span className="text-[48px] leading-[52px] font-metric font-extrabold text-[#10B981] tracking-tight tabular-nums">99.4%</span>
</div>
<div className="flex items-center gap-1.5 text-body-sm font-body font-medium text-[#595C59]">
<span className="material-symbols-outlined text-[16px] text-[#10B981]" data-icon="lock_clock">lock_clock</span>
<span className="font-semibold text-[#181A19]">±2 min</span>
<span className="text-[#6E716E] text-[11px]">arrival slot assurance</span>
</div>
</div>
</section>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">

<section className="lg:col-span-8 flex flex-col gap-6">

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-3xl p-space-lg glow-soft relative">
<div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E8E4DC] gap-3">
<div>
<div className="flex items-center gap-2">
<h2 className="text-headline-sm font-display font-bold font-bold text-[#181A19]">24-Hour Predictive Wait Time &amp; Arrival Volume</h2>
<span className="px-2 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/25 text-[10px] font-label-ui uppercase tracking-wider font-bold font-semibold">Ionix West Corridor</span>
</div>
<p className="text-body-sm font-body font-medium text-[#6E716E] mt-0.5">High-frequency ML model projecting stall latency vs. fleet influx curves</p>
</div>

<div className="flex items-center gap-4 text-label-sm font-label-ui uppercase tracking-wider font-bold">
<div className="flex items-center gap-1.5">
<span className="w-3 h-1 rounded bg-[#10B981]"></span>
<span className="text-[#181A19]">Wait Time (Mins)</span>
</div>
<div className="flex items-center gap-1.5">
<span className="w-3 h-0.5 border-t border-dashed border-secondary"></span>
<span className="text-[#6E716E]">Fleet Influx Rate</span>
</div>
</div>
</div>

<div className="relative w-full h-72 my-4">

<div className="absolute left-0 top-0 bottom-6 flex flex-col justify-between text-body-sm font-body font-medium text-[#9E9B93] tabular-nums text-[11px] pr-2 pointer-events-none">
<span>30m</span>
<span>20m</span>
<span>10m</span>
<span>0m</span>
</div>

<div className="ml-8 h-full relative">

<div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
<div className="border-b border-[#E8E4DC] w-full"></div>
<div className="border-b border-[#E8E4DC] w-full"></div>
<div className="border-b border-[#E8E4DC] w-full"></div>
<div className="border-b border-[#E8E4DC] w-full"></div>
</div>

<svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 240">
<defs>

<lineargradient id="emeraldGradient" x1="0" x2="0" y1="0" y2="1">
<stop offset="0%" stopColor="#34d399" stopOpacity="0.38"></stop>
<stop offset="65%" stopColor="#34d399" stopOpacity="0.08"></stop>
<stop offset="100%" stopColor="#34d399" stopOpacity="0.00"></stop>
</lineargradient>

<filter height="140%" id="neonGlow" width="140%" x="-20%" y="-20%">
<fedropshadow dx="0" dy="0" flood-color="#34d399" flood-opacity="0.6" stddeviation="4"></fedropshadow>
</filter>
<lineargradient id="surgeGradient" x1="0" x2="0" y1="0" y2="1">
<stop offset="0%" stopColor="#f59e0b" stopOpacity="0.5"></stop>
<stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0"></stop>
</lineargradient>
</defs>

<rect fill="url(#surgeGradient)" height="195" opacity="0.25" rx="8" width="130" x="90" y="20"></rect>

<path d="M 0 215 
                         L 15 215 
                         L 50 210 
                         L 80 190 
                         L 120 70 
                         L 160 85 
                         L 210 180 
                         L 260 200 
                         L 320 212 
                         L 400 215 
                         L 480 215 
                         L 560 170 
                         L 620 150 
                         L 700 190 
                         L 780 210 
                         L 800 215 
                         L 800 215 
                         L 0 215 Z" fill="url(#emeraldGradient)"></path>

<path d="M 0 200 
                         C 60 190, 90 110, 130 90 
                         C 170 70, 200 130, 250 170 
                         C 310 210, 390 210, 470 200 
                         C 540 190, 580 130, 630 120 
                         C 690 110, 740 180, 800 195" fill="none" opacity="0.75" stroke="#a9d0ae" strokeDasharray="4 4" strokeWidth="2"></path>

<path d="M 0 215 
                         C 40 215, 60 205, 90 160 
                         C 120 65, 140 60, 160 80 
                         C 190 115, 210 175, 250 195 
                         C 300 212, 380 215, 460 215 
                         C 520 215, 550 175, 600 150 
                         C 650 125, 710 185, 770 210 
                         L 800 215" fill="none" filter="url(#neonGlow)" stroke="#34d399" strokeWidth="3.5"></path>

<g className="cursor-pointer">
<line stroke="#34d399" strokeDasharray="2 2" strokeWidth="1.5" x1="20" x2="20" y1="20" y2="215"></line>
<circle cx="20" cy="214" fill="#34d399" r="5" stroke="#00180c" strokeWidth="2"></circle>
</g>

<g className="cursor-pointer">
<line stroke="#f59e0b" strokeDasharray="3 3" strokeWidth="1.5" x1="140" x2="140" y1="20" y2="215"></line>
<circle cx="140" cy="72" fill="#f59e0b" r="6" stroke="#00180c" strokeWidth="2"></circle>
</g>

<g className="cursor-pointer">
<line opacity="0.5" stroke="#a9d0ae" strokeDasharray="3 3" strokeWidth="1" x1="420" x2="420" y1="20" y2="215"></line>
<circle cx="420" cy="215" fill="#a9d0ae" r="4" stroke="#00180c" strokeWidth="2"></circle>
</g>
</svg>


<div className="absolute left-2 top-36 -translate-x-1/2 bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] px-2.5 py-1 rounded-lg border border-[#10B981]/40 shadow-lg text-[11px] font-label-ui font-bold pointer-events-none whitespace-nowrap">
<span className="text-[#10B981] font-bold">14:30 (NOW)</span>
<span className="text-[#6E716E] font-normal"> · 0m Wait</span>
</div>

<div className="absolute left-[18%] top-4 -translate-x-1/2 bg-[#FFFFFF] border border-amber-300 px-3 py-1.5 rounded-xl shadow-xl text-[11px] font-label-ui font-bold pointer-events-none whitespace-nowrap glow-amber">
<div className="flex items-center gap-1.5 text-amber-600 font-bold">
<span className="material-symbols-outlined text-[14px]" data-icon="electric_meter">electric_meter</span>
<span>17:30 Commute Surge</span>
</div>
<div className="text-[#181A19] text-[10px]">Peak Wait: <span className="font-bold text-amber-600">18 mins</span> (Grid 91%)</div>
</div>

<div className="absolute left-[52%] top-36 -translate-x-1/2 bg-[#FFFFFF]/80 backdrop-blur-md shadow-sm border border-[#E8E4DC] px-2.5 py-1 rounded-lg text-[11px] font-label-ui font-bold pointer-events-none whitespace-nowrap text-[#595C59]">
<span className="font-medium">02:00 Valley</span> · Low Tariff €0.22
              </div>
</div>
</div>

<div className="mt-4 pt-3 border-t border-[#E8E4DC]">
<div className="flex items-center justify-between text-body-sm font-body font-medium text-[#6E716E] mb-2">
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold uppercase tracking-wider text-[#9E9B93] flex items-center gap-1">
<span className="material-symbols-outlined text-[14px]" data-icon="tune">tune</span>
                Interactive Forecast Scrubber
              </span>
<div className="px-2.5 py-0.5 rounded-md bg-[#F5F2EB] text-[#10B981] font-label-ui uppercase tracking-wider font-bold font-semibold flex items-center gap-1">
<span>Selected: 18:00 CET</span>
<span className="text-[#9E9B93]">·</span>
<span>16 min projected queue</span>
</div>
</div>

<div className="relative w-full py-2">
<div className="h-2 w-full bg-[#E8E4DC] rounded-full overflow-hidden relative">

<div className="absolute left-0 w-[12%] h-full bg-[#10B981]"></div>
<div className="absolute left-[12%] w-[18%] h-full bg-amber-500"></div>
<div className="absolute left-[30%] w-[15%] h-full bg-primary/70"></div>
<div className="absolute left-[45%] w-[35%] h-full bg-[#10B981]"></div>
<div className="absolute left-[80%] w-[20%] h-full bg-tertiary-container/80"></div>
</div>

<div className="absolute top-1/2 left-[21%] -translate-y-1/2 -translate-x-1/2 flex flex-col items-center cursor-pointer group">
<div className="w-5 h-5 rounded-full bg-[#10B981] border-2 border-surface-container-lowest shadow-md glow-primary"></div>
<div className="hidden group-hover:flex absolute -top-10 bg-[#FFFFFF] px-2 py-1 rounded text-[10px] font-label-ui uppercase tracking-wider font-bold text-[#10B981] whitespace-nowrap shadow-lg border border-[#10B981]/30">
                  18:00 Forecast: 16 min queue, 9/10 stalls occupied, Grid Load 88%
                </div>
</div>
</div>

<div className="flex justify-between text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93] tabular-nums pt-1 px-1">
<span className="text-[#10B981] font-bold">14:00</span>
<span>16:00</span>
<span className="text-amber-600 font-semibold">18:00</span>
<span>20:00</span>
<span>22:00</span>
<span>00:00</span>
<span>04:00</span>
<span>08:00</span>
<span>12:00</span>
</div>
</div>

<div className="mt-6 pt-4 border-t border-[#E8E4DC]">
<div className="flex items-center justify-between mb-2">
<span className="text-label-md font-label-ui font-bold font-semibold text-[#181A19]">Congestion Probability Matrix (24-Hour Slots)</span>
<div className="flex items-center gap-3 text-label-sm font-label-ui uppercase tracking-wider font-bold">
<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-[#10B981]"></span> 0-2m</span>
<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500"></span> 3-10m</span>
<span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500"></span> 10m+</span>
</div>
</div>

<div className="grid grid-cols-12 sm:grid-cols-24 gap-1">
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="14:00 - 0m">0</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="15:00 - 1m">1</div>
<div className="h-6 rounded bg-tertiary-container/90 flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="16:00 - 5m">5</div>
<div className="h-6 rounded bg-red-500 flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold glow-amber" title="17:00 - 14m">14</div>
<div className="h-6 rounded bg-red-500 flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold glow-amber" title="18:00 - 18m">18</div>
<div className="h-6 rounded bg-amber-500 flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="19:00 - 8m">8</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="20:00 - 2m">2</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="21:00 - 0m">0</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="22:00 - 0m">0</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="23:00 - 0m">0</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="00:00 - 0m">0</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="01:00 - 0m">0</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="02:00 - 0m">0</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="03:00 - 0m">0</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="04:00 - 0m">0</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="05:00 - 0m">0</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="06:00 - 1m">1</div>
<div className="h-6 rounded bg-amber-500 flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="07:00 - 6m">6</div>
<div className="h-6 rounded bg-red-500 flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="08:00 - 12m">12</div>
<div className="h-6 rounded bg-amber-500 flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="09:00 - 7m">7</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="10:00 - 2m">2</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="11:00 - 0m">0</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="12:00 - 1m">1</div>
<div className="h-6 rounded bg-[#10B981] flex items-center justify-center text-[9px] font-label-ui uppercase tracking-wider font-bold text-surface font-bold" title="13:00 - 0m">0</div>
</div>
</div>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-3xl p-space-lg glow-soft border border-[#10B981]/30 relative overflow-hidden">
<div className="flex items-start gap-4">
<div className="w-10 h-10 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/40 flex items-center justify-center text-[#10B981] shrink-0 glow-primary">
<span className="material-symbols-outlined text-[24px]" data-icon="auto_awesome">auto_awesome</span>
</div>
<div className="space-y-2">
<div className="flex items-center gap-2">
<span className="text-label-md font-label-ui font-bold font-bold uppercase tracking-wider text-[#10B981]">Autonomous Co-Pilot Dispatch Advice</span>
<span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] text-[#595C59] text-[10px] font-label-ui uppercase tracking-wider font-bold">High Confidence 99.4%</span>
</div>
<p className="text-body-md font-body font-medium text-[#181A19] leading-relaxed">
<strong className="text-[#10B981] font-semibold">Driver alert:</strong> <span className="text-[#181A19]">Ionix Rapid West will experience heavy arrival clustering at</span> <strong className="text-amber-600 font-semibold">17:15 (+18m wait)</strong>. If departing now at 14:30, your estimated arrival at <strong className="text-[#10B981] font-semibold">14:44 secures Stall P4 with 0 wait time</strong> and battery pre-conditioning activated.
              </p>
<div className="flex flex-wrap items-center gap-3 pt-2">
<button className="px-4 py-1.5 rounded-full bg-[#10B981] text-[#FAF8F5] font-label-ui font-bold font-semibold hover:bg-primary-fixed transition-all flex items-center gap-1.5 shadow-sm">
<span className="material-symbols-outlined text-[16px]" data-icon="navigation">navigation</span>
<span>Confirm Dispatch &amp; Route P4</span>
</button>
<button className="px-3.5 py-1.5 rounded-full bg-[#F5F2EB] hover:bg-surface-variant text-[#595C59] text-label-md font-label-ui font-bold border border-[#E8E4DC] transition-colors">
                  Delay to 20:30 (Off-Peak)
                </button>
</div>
</div>
</div>
</div>
</section>

<section className="lg:col-span-4 flex flex-col gap-4">
<div className="flex items-center justify-between px-1">
<div className="flex items-center gap-2">
<h2 className="text-headline-sm font-display font-bold font-bold text-[#181A19]">Live Station Queues</h2>
<span className="w-2 h-2 rounded-full bg-[#10B981] beacon-pulse"></span>
</div>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93]">3 Nearby Hubs</span>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-3xl p-space-md glow-soft border-2 border-[#10B981]/40 relative group hover:border-primary transition-all">
<div className="flex items-start justify-between mb-2">
<div>
<div className="flex items-center gap-1.5">
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold uppercase px-2 py-0.5 rounded bg-[#10B981]/10 text-[#10B981] font-bold">Recommended</span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93]">CCS2 350kW</span>
</div>
<h3 className="text-headline-sm font-display font-bold font-bold text-[#181A19] mt-1">Ionix Rapid West</h3>
<p className="text-body-sm font-body font-medium text-[#6E716E]">Gateway Hub · A99 Exit 14</p>
</div>
<div className="text-right">
<span className="text-label-md font-label-ui font-bold text-[#10B981] font-bold">11.2 km</span>
<p className="text-body-sm font-body font-medium text-[#595C59] tabular-nums">8 min drive</p>
</div>
</div>

<div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-2xl bg-[#F5F2EB] border border-[#E8E4DC]">
<div>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E] block">Live Queue</span>
<div className="flex items-center gap-1 text-[#10B981] font-bold text-label-lg">
<span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
<span>0 min wait</span>
</div>
</div>
<div>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E] block">Stall Availability</span>
<span className="text-[#181A19] font-semibold text-label-lg tabular-nums">8 of 10 free</span>
</div>
</div>

<div className="flex items-center justify-between text-body-sm font-body font-medium text-[#6E716E] mb-4">
<span className="flex items-center gap-1">
<span className="material-symbols-outlined text-[14px] text-[#10B981]" data-icon="trending_flat">trending_flat</span>
<span>Next 2h forecast: Stable</span>
</span>
<span className="text-[#595C59] text-[11px]">Low demand risk</span>
</div>

<button className="w-full py-2.5 rounded-full bg-[#10B981] text-[#FAF8F5] font-label-ui font-bold font-bold flex items-center justify-center gap-2 glow-primary active:scale-[0.98] transition-all hover:bg-primary-fixed">
<span className="material-symbols-outlined text-[18px]" data-icon="electric_bolt">electric_bolt</span>
<span>Pre-empt Stall Reservation</span>
</button>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-3xl p-space-md glow-soft border border-amber-300 relative group hover:border-tertiary-container/60 transition-all">
<div className="flex items-start justify-between mb-2">
<div>
<div className="flex items-center gap-1.5">
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-600 font-bold">Congestion Warning</span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93]">150kW</span>
</div>
<h3 className="text-headline-sm font-display font-bold font-semibold text-[#181A19] mt-1">EcoVolt Metro Station</h3>
<p className="text-body-sm font-body font-medium text-[#6E716E]">Urban Ring · Donnersberger</p>
</div>
<div className="text-right">
<span className="text-label-md font-label-ui font-bold text-[#181A19] font-bold">7.4 km</span>
<p className="text-body-sm font-body font-medium text-[#6E716E] tabular-nums">14 min drive</p>
</div>
</div>

<div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-2xl bg-[#F5F2EB] border border-[#E8E4DC]">
<div>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E] block">Physical Queue</span>
<div className="flex items-center gap-1 text-amber-600 font-bold text-label-lg">
<span className="w-2 h-2 rounded-full bg-amber-500"></span>
<span>~16 min wait</span>
</div>
</div>
<div>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E] block">Queue Turnover</span>
<span className="text-[#181A19] font-semibold text-body-sm">4 cars queue (2 bays in 3m)</span>
</div>
</div>

<div className="flex items-center justify-between text-body-sm font-body font-medium text-[#6E716E] mb-4">
<span className="flex items-center gap-1 text-amber-600 text-[11px]">
<span className="material-symbols-outlined text-[14px]" data-icon="trending_up">trending_up</span>
<span>Rising to 22m wait at 17:00</span>
</span>
</div>

<button className="w-full py-2.5 rounded-full bg-[#F5F2EB] hover:bg-surface-variant/80 text-[#181A19] border border-[#E8E4DC] font-label-ui font-bold font-semibold flex items-center justify-center gap-2 transition-all">
<span className="material-symbols-outlined text-[18px]" data-icon="queue">queue</span>
<span>Join Virtual Queue</span>
</button>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] rounded-3xl p-space-md glow-soft border border-[#E8E4DC] relative group hover:border-outline transition-all">
<div className="flex items-start justify-between mb-2">
<div>
<div className="flex items-center gap-1.5">
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold uppercase px-2 py-0.5 rounded bg-[#FFFFFF] text-[#595C59] font-bold">100% Alpine Hydro</span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93]">300kW</span>
</div>
<h3 className="text-headline-sm font-display font-bold font-semibold text-[#181A19] mt-1">AlpineVolt Valley Hub</h3>
<p className="text-body-sm font-body font-medium text-[#6E716E]">A8 Salzburg Corridor</p>
</div>
<div className="text-right">
<span className="text-label-md font-label-ui font-bold text-[#181A19] font-bold">24.5 km</span>
<p className="text-body-sm font-body font-medium text-[#6E716E] tabular-nums">19 min drive</p>
</div>
</div>

<div className="grid grid-cols-2 gap-2 my-3 p-2.5 rounded-2xl bg-[#F5F2EB] border border-[#E8E4DC]">
<div>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E] block">Live Queue</span>
<div className="flex items-center gap-1 text-[#10B981] font-bold text-label-lg">
<span className="w-2 h-2 rounded-full bg-[#10B981]"></span>
<span>0 min wait</span>
</div>
</div>
<div>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E] block">Stalls Available</span>
<span className="text-[#181A19] font-semibold text-label-lg tabular-nums">18 of 20 free</span>
</div>
</div>

<div className="flex items-center justify-between text-body-sm font-body font-medium text-[#6E716E] mb-4">
<span className="text-[#595C59] text-[11px]">Tariff: €0.35/kWh (Renewable)</span>
<span className="text-[#10B981] text-[11px] font-semibold">Immediate Bay Guarantee</span>
</div>

<button className="w-full py-2.5 rounded-full bg-[#F5F2EB] hover:bg-secondary-container/80 text-[#181A19] font-label-ui font-bold font-semibold flex items-center justify-center gap-2 border border-[#E8E4DC] transition-all">
<span className="material-symbols-outlined text-[18px]" data-icon="bookmark_add">bookmark_add</span>
<span>Reserve Bay</span>
</button>
</div>
</section>
</div>
</main>
  );
}