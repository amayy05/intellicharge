import React from 'react';

export default function SmartStationHub() {
  return (
    <main className="relative z-10 flex-1 pt-24 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full">

<div className="pt-4 pb-8 space-y-3">

<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] border border-[#10B981]/20 text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#10B981]">
<span className="relative flex h-2 w-2">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
<span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8F5E9]"></span>
</span>
        High-Power Autonomous Corridor Feed · Live Active
      </div>
<div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
<div>
<h1 className="text-headline-xl font-display font-extrabold text-[#181A19] tracking-tight leading-tight">
            Smart Station Hub
          </h1>
<p className="text-body-lg font-body font-medium text-[#6E716E] max-w-2xl mt-1">
            Real-time directory of verified ultra-fast autonomous charging hubs with dynamic green energy tariffs and live stall telemetry.
          </p>
</div>

<div className="flex items-center gap-2 text-label-md font-label-ui font-bold text-[#6E716E] bg-[#F5F2EB] px-3.5 py-1.5 rounded-full border border-[#E8E4DC]">
<span className="material-symbols-outlined text-[#595C59] text-sm">sync</span>
<span>Mesh Sync: <span className="text-[#10B981] font-mono">1.2s ago</span></span>
</div>
</div>
</div>

<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC]  rounded-2xl p-5 relative overflow-hidden group">
<div className="flex items-center justify-between text-[#6E716E] text-label-md font-label-ui font-bold mb-2">
<span>Available Stalls</span>
<span className="material-symbols-outlined text-[#10B981] text-base">ev_charger</span>
</div>
<div className="flex items-baseline gap-2 mb-2">
<span className="text-headline-lg font-display font-extrabold text-[#181A19]">1,420</span>
<span className="text-body-sm text-[#9E9B93]">/ 1,680</span>
</div>

<div className="w-full bg-[#FFFFFF] rounded-full h-2 overflow-hidden mb-2">
<div className="bg-[#E8F5E9] h-full rounded-full transition-all duration-500" style={{"width":"84.5%"}}></div>
</div>
<div className="flex items-center justify-between text-label-sm font-label-ui uppercase tracking-wider font-bold">
<span className="text-[#10B981] font-semibold">84.5% Online &amp; Ready</span>
<span className="text-[#9E9B93]">Across 9 Hubs</span>
</div>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC]  rounded-2xl p-5 relative overflow-hidden group">
<div className="flex items-center justify-between text-[#6E716E] text-label-md font-label-ui font-bold mb-2">
<span>Fleet Average Queue</span>
<span className="material-symbols-outlined text-[#595C59] text-base">timer</span>
</div>
<div className="flex items-baseline gap-2 mb-2">
<span className="text-headline-lg font-display font-extrabold text-[#10B981]">1.4</span>
<span className="text-body-md text-[#6E716E] font-medium">min</span>
</div>
<div className="flex items-center gap-1.5 text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#595C59] mb-2">
<span className="w-1.5 h-1.5 rounded-full bg-[#E8F5E9] animate-pulse"></span>
<span>Optimal Route Dispatch Active</span>
</div>
<p className="text-body-sm text-[#9E9B93]">Zero wait at 7 of 9 proximal stations</p>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC]  rounded-2xl p-5 relative overflow-hidden group">
<div className="flex items-center justify-between text-[#6E716E] text-label-md font-label-ui font-bold mb-2">
<span>Renewable Mix</span>
<span className="material-symbols-outlined text-[#10B981] text-base">eco</span>
</div>
<div className="flex items-baseline gap-2 mb-2">
<span className="text-headline-lg font-display font-extrabold text-[#181A19]">92.4%</span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#10B981] px-1.5 py-0.5 rounded bg-[#F5F2EB]">Clean Grid</span>
</div>

<div className="flex items-center gap-1.5 text-label-sm font-label-ui uppercase tracking-wider font-bold mb-1">
<span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] text-[#6E716E] border border-[#E8E4DC]">Solar: 56%</span>
<span className="px-2 py-0.5 rounded-full bg-[#FFFFFF] text-[#6E716E] border border-[#E8E4DC]">Wind: 36.4%</span>
</div>
<span className="text-body-sm text-[#9E9B93]">Direct power-purchase certified</span>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC]  rounded-2xl p-5 relative overflow-hidden group">
<div className="flex items-center justify-between text-[#6E716E] text-label-md font-label-ui font-bold mb-2">
<span>Dynamic Avg Tariff</span>
<span className="material-symbols-outlined text-amber-600 text-base">payments</span>
</div>
<div className="flex items-baseline gap-2 mb-2">
<span className="text-headline-lg font-display font-extrabold text-[#181A19]">€0.34</span>
<span className="text-body-sm text-[#9E9B93]">/ kWh</span>
</div>
<div className="inline-flex items-center gap-1 text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#10B981] px-2 py-0.5 rounded-full bg-[#F5F2EB] mb-1">
<span className="material-symbols-outlined text-xs">trending_down</span>
<span>-18% Off-Peak Tariff Window</span>
</div>
<p className="text-body-sm text-[#9E9B93]">Valid for the next 42 mins</p>
</div>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC]  rounded-2xl p-3 md:p-4 mb-8 space-y-3">
<div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">

<div className="relative flex-1">
<div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#9E9B93]">
<span className="material-symbols-outlined text-lg">search</span>
</div>
<input className="w-full pl-10 pr-20 py-2.5 bg-surface-container-lowest/80 border border-[#E8E4DC] rounded-xl text-[#181A19] placeholder:text-outline font-body font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-sm md:text-body-md" placeholder="Search highway corridors (e.g. A99, Autobahn 8), postal codes, or network hubs..." type="text"/>
<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
<kbd className="px-2 py-0.5 text-label-sm font-mono text-[#9E9B93] bg-[#FFFFFF] rounded border border-[#E8E4DC]">⌘K</kbd>
</div>
</div>

<div className="flex items-center gap-2 self-end lg:self-auto">

<div className="flex items-center p-1 rounded-xl bg-surface-container-lowest/80 border border-[#E8E4DC]">
<button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F5F2EB] text-[#10B981] font-label-ui font-bold text-label-md transition-all">
<span className="material-symbols-outlined text-sm">view_agenda</span>
              Directory
            </button>
<button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#6E716E] hover:text-on-surface font-label-ui font-bold text-label-md transition-all">
<span className="material-symbols-outlined text-sm">map</span>
              Map HUD
            </button>
</div>

<button className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-surface-container-lowest/80 border border-[#E8E4DC] text-[#6E716E] hover:text-primary font-label-ui font-bold text-label-md transition-all">
<span className="material-symbols-outlined text-sm">tune</span>
<span className="hidden sm:inline">Sort: Fastest Access</span>
</button>
</div>
</div>

<div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-label-md">
<span className="text-[#9E9B93] text-label-sm font-label-ui uppercase tracking-wider font-bold uppercase tracking-wider mr-1 hidden sm:inline">Filters:</span>
<button className="px-3.5 py-1.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/30 font-semibold whitespace-nowrap flex items-center gap-1.5">
<span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span>
          All Power Levels (150kW - 350kW)
        </button>
<button className="px-3.5 py-1.5 rounded-full bg-[#F5F2EB] hover:bg-surface-variant text-[#6E716E] hover:text-on-surface border border-[#E8E4DC] whitespace-nowrap transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-xs">bolt</span>
          Ultra-Rapid 300kW+
        </button>
<button className="px-3.5 py-1.5 rounded-full bg-[#F5F2EB] hover:bg-surface-variant text-[#6E716E] hover:text-on-surface border border-[#E8E4DC] whitespace-nowrap transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-xs">forest</span>
          100% Eco-Certified
        </button>
<button className="px-3.5 py-1.5 rounded-full bg-[#F5F2EB] hover:bg-surface-variant text-[#6E716E] hover:text-on-surface border border-[#E8E4DC] whitespace-nowrap transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-xs">check_circle</span>
          Zero Queue
        </button>
<button className="px-3.5 py-1.5 rounded-full bg-[#F5F2EB] hover:bg-surface-variant text-[#6E716E] hover:text-on-surface border border-[#E8E4DC] whitespace-nowrap transition-colors">
          CCS Type 2 Only
        </button>
<button className="px-3 py-1.5 rounded-full bg-[#FFFFFF] text-[#595C59] hover:text-primary border border-[#E8E4DC] whitespace-nowrap transition-colors flex items-center gap-1">
<span className="material-symbols-outlined text-xs">add</span>
          More Filters
        </button>
</div>
</div>

<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-16">

<div className="lg:col-span-12 bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] hover:border-[#10B981] transition-colors  rounded-3xl p-6 md:p-8 relative overflow-hidden border border-[#10B981]/25">

<div className="absolute -right-20 -top-20 w-80 h-80 bg-[#10B981]/10 rounded-full blur-3xl pointer-events-none"></div>
<div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">

<div className="space-y-2">
<div className="flex flex-wrap items-center gap-2">
<span className="px-3 py-1 rounded-full bg-[#E8F5E9] text-[#181A19] font-label-ui uppercase tracking-wider font-bold font-bold text-label-sm tracking-wide uppercase flex items-center gap-1">
<span className="material-symbols-outlined text-sm">navigation</span>
                Recommended Route
              </span>
<span className="px-2.5 py-1 rounded-full bg-[#F5F2EB] text-[#10B981] border border-[#10B981]/20 text-label-sm font-label-ui uppercase tracking-wider font-bold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-[#E8F5E9] animate-ping"></span>
                Zero Queue
              </span>
<span className="px-2.5 py-1 rounded-full bg-[#F5F2EB] text-[#595C59] text-label-sm font-label-ui uppercase tracking-wider font-bold">
                100% Wind Power
              </span>
<span className="px-2.5 py-1 rounded-full bg-[#FFFFFF] text-amber-600 text-label-sm font-label-ui uppercase tracking-wider font-bold font-mono">
                Dynamic Tariff: €0.36 / kWh
              </span>
</div>
<div>
<h2 className="text-headline-lg font-display font-extrabold text-[#181A19] tracking-tight">Ionix Rapid West — Gateway Hub</h2>
<p className="text-body-md font-body font-medium text-[#6E716E] flex items-center gap-2 mt-0.5">
<span className="material-symbols-outlined text-[#9E9B93] text-base">pin_drop</span>
                Autobahn A99 Exit 14 · High-Speed Arterial · 11.2 km away (approx. 8 min drive)
              </p>
</div>
</div>

<div className="flex lg:flex-col items-center lg:items-end justify-between lg:justify-start gap-1 bg-surface-container-lowest/80 px-4 py-3 rounded-2xl border border-[#E8E4DC] min-w-[190px]">
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93] uppercase tracking-wider">Bay Telemetry</span>
<div className="flex items-baseline gap-1.5">
<span className="text-headline-md font-display font-extrabold font-bold text-[#10B981]">8 of 10</span>
<span className="text-body-sm text-[#6E716E]">Bays Free</span>
</div>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#10B981]">Autocharge Ready (Plug &amp; Go)</span>
</div>
</div>

<div className="mb-6">
<div className="flex items-center justify-between mb-3 text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93]">
<span className="uppercase tracking-wider">Live Bay Allocation Matrix</span>
<span className="flex items-center gap-3">
<span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#E8F5E9]"></span> Available</span>
<span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-[#E8E4DC] border border-[#E8E4DC]"></span> In Use</span>
<span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500"></span> Reserved</span>
</span>
</div>
<div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2.5">

<div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#10B981]/40 flex flex-col items-center justify-center text-center relative group/stall">
<span className="text-label-sm font-mono text-[#9E9B93]">P01</span>
<span className="material-symbols-outlined text-[#10B981] text-xl my-1">bolt</span>
<span className="text-label-sm font-bold text-[#10B981] font-mono">350 kW</span>
<span className="text-[9px] text-[#10B981] uppercase mt-0.5">Free</span>
</div>

<div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#10B981]/40 flex flex-col items-center justify-center text-center relative">
<span className="text-label-sm font-mono text-[#9E9B93]">P02</span>
<span className="material-symbols-outlined text-[#10B981] text-xl my-1">bolt</span>
<span className="text-label-sm font-bold text-[#10B981] font-mono">350 kW</span>
<span className="text-[9px] text-[#10B981] uppercase mt-0.5">Free</span>
</div>

<div className="p-2.5 rounded-xl bg-surface-container-lowest/60 border border-[#E8E4DC] opacity-60 flex flex-col items-center justify-center text-center">
<span className="text-label-sm font-mono text-[#9E9B93]">P03</span>
<span className="material-symbols-outlined text-[#9E9B93] text-xl my-1">hourglass_top</span>
<span className="text-label-sm font-mono text-[#9E9B93]">350 kW</span>
<span className="text-[9px] text-[#9E9B93] uppercase mt-0.5">9m left</span>
</div>

<div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#10B981]/40 flex flex-col items-center justify-center text-center">
<span className="text-label-sm font-mono text-[#9E9B93]">P04</span>
<span className="material-symbols-outlined text-[#10B981] text-xl my-1">bolt</span>
<span className="text-label-sm font-bold text-[#10B981] font-mono">350 kW</span>
<span className="text-[9px] text-[#10B981] uppercase mt-0.5">Free</span>
</div>

<div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300 flex flex-col items-center justify-center text-center">
<span className="text-label-sm font-mono text-amber-600">P05</span>
<span className="material-symbols-outlined text-amber-600 text-xl my-1">lock_clock</span>
<span className="text-label-sm font-bold text-amber-600 font-mono">300 kW</span>
<span className="text-[9px] text-amber-600 uppercase mt-0.5">Reserved</span>
</div>

<div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#10B981]/40 flex flex-col items-center justify-center text-center">
<span className="text-label-sm font-mono text-[#9E9B93]">P06</span>
<span className="material-symbols-outlined text-[#10B981] text-xl my-1">bolt</span>
<span className="text-label-sm font-bold text-[#10B981] font-mono">300 kW</span>
<span className="text-[9px] text-[#10B981] uppercase mt-0.5">Free</span>
</div>

<div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#10B981]/40 flex flex-col items-center justify-center text-center">
<span className="text-label-sm font-mono text-[#9E9B93]">P07</span>
<span className="material-symbols-outlined text-[#10B981] text-xl my-1">bolt</span>
<span className="text-label-sm font-bold text-[#10B981] font-mono">300 kW</span>
<span className="text-[9px] text-[#10B981] uppercase mt-0.5">Free</span>
</div>

<div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#10B981]/40 flex flex-col items-center justify-center text-center">
<span className="text-label-sm font-mono text-[#9E9B93]">P08</span>
<span className="material-symbols-outlined text-[#10B981] text-xl my-1">bolt</span>
<span className="text-label-sm font-bold text-[#10B981] font-mono">150 kW</span>
<span className="text-[9px] text-[#10B981] uppercase mt-0.5">Free</span>
</div>

<div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#10B981]/40 flex flex-col items-center justify-center text-center">
<span className="text-label-sm font-mono text-[#9E9B93]">P09</span>
<span className="material-symbols-outlined text-[#10B981] text-xl my-1">bolt</span>
<span className="text-label-sm font-bold text-[#10B981] font-mono">150 kW</span>
<span className="text-[9px] text-[#10B981] uppercase mt-0.5">Free</span>
</div>

<div className="p-2.5 rounded-xl bg-[#FFFFFF] border border-[#10B981]/40 flex flex-col items-center justify-center text-center">
<span className="text-label-sm font-mono text-[#9E9B93]">P10</span>
<span className="material-symbols-outlined text-[#10B981] text-xl my-1">bolt</span>
<span className="text-label-sm font-bold text-[#10B981] font-mono">150 kW</span>
<span className="text-[9px] text-[#10B981] uppercase mt-0.5">Free</span>
</div>
</div>
</div>

<div className="pt-4 border-t border-[#E8E4DC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">

<div className="flex items-center gap-4 text-[#6E716E] text-body-sm">
<span className="text-[#9E9B93] text-label-sm font-label-ui uppercase tracking-wider font-bold uppercase">Amenities:</span>
<span className="inline-flex items-center gap-1.5" title="24/7 Specialty Coffee">
<span className="material-symbols-outlined text-[#595C59] text-base">local_cafe</span> Coffee Bar
            </span>
<span className="inline-flex items-center gap-1.5" title="Restrooms">
<span className="material-symbols-outlined text-[#595C59] text-base">wc</span> Restrooms
            </span>
<span className="inline-flex items-center gap-1.5" title="High-Speed Starlink Wi-Fi">
<span className="material-symbols-outlined text-[#595C59] text-base">wifi</span> Free Wi-Fi
            </span>
<span className="inline-flex items-center gap-1.5 hidden md:inline-flex" title="Operator Lounge">
<span className="material-symbols-outlined text-[#595C59] text-base">chair</span> Fleet Lounge
            </span>
</div>

<div className="flex items-center gap-3">
<button className="px-5 py-2.5 rounded-full bg-[#FFFFFF] border border-[#E8E4DC] text-[#181A19] hover:text-primary hover:border-primary/40 text-label-md font-label-ui font-bold transition-all flex items-center gap-1.5">
<span className="material-symbols-outlined text-base">directions</span>
              Route Navigation
            </button>
<button className="px-6 py-2.5 rounded-full bg-[#E8F5E9] text-[#181A19] font-label-ui font-bold font-bold text-label-md shadow-lg shadow-primary-container/20 hover:bg-primary transition-all active:scale-[0.98] flex items-center gap-2">
<span className="material-symbols-outlined text-base">lock</span>
              Reserve Bay (15m hold)
            </button>
</div>
</div>
</div>

<div className="lg:col-span-4 bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] hover:border-[#10B981] transition-colors  rounded-3xl p-6 flex flex-col justify-between">
<div>

<div className="flex items-center justify-between gap-2 mb-3">
<span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-500 border border-red-200 text-label-sm font-label-ui uppercase tracking-wider font-bold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              High Utilization
            </span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold font-mono text-[#6E716E]">€0.48 / kWh</span>
</div>
<h3 className="text-headline-sm font-display font-bold text-[#181A19]">EcoVolt Metro Station</h3>
<p className="text-body-sm text-[#6E716E] mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-xs text-[#9E9B93]">location_on</span>
            Central Ring Promenade · 7.4 km (14 min)
          </p>

<div className="my-5 p-3.5 rounded-2xl bg-surface-container-lowest/70 border border-[#E8E4DC] space-y-2">
<div className="flex items-center justify-between text-body-sm">
<span className="text-[#9E9B93]">Free Chargers</span>
<span className="font-bold text-red-500 font-mono">2 of 12 bays</span>
</div>
<div className="flex items-center justify-between text-body-sm">
<span className="text-[#9E9B93]">Live Wait Est.</span>
<span className="text-[#181A19] font-mono">~ 18 min</span>
</div>
<div className="flex items-center justify-between text-body-sm">
<span className="text-[#9E9B93]">Max Power</span>
<span className="text-[#10B981] font-mono font-semibold">300 kW Ultra-DC</span>
</div>
</div>
<div className="flex items-center gap-3 text-label-sm text-[#6E716E] mb-6">
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">local_cafe</span> Coffee</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">shopping_bag</span> Shopping</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">roofing</span> Covered</span>
</div>
</div>
<div className="flex items-center gap-2">
<button className="w-full py-2.5 rounded-full bg-[#FFFFFF] border border-[#E8E4DC] text-[#181A19] hover:text-primary hover:border-primary/40 text-label-md font-label-ui font-bold transition-all flex items-center justify-center gap-1.5">
<span className="material-symbols-outlined text-sm">queue</span>
            Queue Digitally
          </button>
</div>
</div>

<div className="lg:col-span-4 bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] hover:border-[#10B981] transition-colors  rounded-3xl p-6 flex flex-col justify-between">
<div>

<div className="flex items-center justify-between gap-2 mb-3">
<span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-label-sm font-label-ui uppercase tracking-wider font-bold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-[#E8F5E9]"></span>
              Along Route
            </span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold font-mono text-[#10B981]">€0.32 / kWh (Off-Peak)</span>
</div>
<h3 className="text-headline-sm font-display font-bold text-[#181A19]">Nordic Way Tech Hub</h3>
<p className="text-body-sm text-[#6E716E] mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-xs text-[#9E9B93]">location_on</span>
            Northern Highway KM 142 · 136 km
          </p>

<div className="my-5 p-3.5 rounded-2xl bg-surface-container-lowest/70 border border-[#E8E4DC] space-y-2">
<div className="flex items-center justify-between text-body-sm">
<span className="text-[#9E9B93]">Free Chargers</span>
<span className="font-bold text-[#10B981] font-mono">14 of 16 bays</span>
</div>
<div className="flex items-center justify-between text-body-sm">
<span className="text-[#9E9B93]">Clean Energy</span>
<span className="text-[#595C59] font-mono">100% Wind &amp; Hydro</span>
</div>
<div className="flex items-center justify-between text-body-sm">
<span className="text-[#9E9B93]">Max Power</span>
<span className="text-[#10B981] font-mono font-semibold">350 kW HPC</span>
</div>
</div>
<div className="flex items-center gap-3 text-label-sm text-[#6E716E] mb-6">
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">chair</span> Lounge</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">restaurant</span> Bistro</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">wifi</span> 1 Gbps</span>
</div>
</div>
<div className="flex items-center gap-2">
<button className="w-full py-2.5 rounded-full bg-[#E8F5E9] text-[#181A19] font-label-ui font-bold font-bold text-label-md hover:bg-primary transition-all flex items-center justify-center gap-1.5">
<span className="material-symbols-outlined text-sm">bolt</span>
            Reserve Bay
          </button>
</div>
</div>

<div className="lg:col-span-4 bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] hover:border-[#10B981] transition-colors  rounded-3xl p-6 flex flex-col justify-between">
<div>

<div className="flex items-center justify-between gap-2 mb-3">
<span className="px-2.5 py-0.5 rounded-full bg-[#F5F2EB] text-[#595C59] border border-[#E8E4DC] text-label-sm font-label-ui uppercase tracking-wider font-bold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              100% Alpine Hydro
            </span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold font-mono text-[#6E716E]">€0.35 / kWh</span>
</div>
<h3 className="text-headline-sm font-display font-bold text-[#181A19]">AlpineVolt Valley Hub</h3>
<p className="text-body-sm text-[#6E716E] mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-xs text-[#9E9B93]">location_on</span>
            Bavarian Pass South · Milepost 88 · 24.5 km
          </p>

<div className="my-5 p-3.5 rounded-2xl bg-surface-container-lowest/70 border border-[#E8E4DC] space-y-2">
<div className="flex items-center justify-between text-body-sm">
<span className="text-[#9E9B93]">Free Chargers</span>
<span className="font-bold text-[#10B981] font-mono">18 of 20 bays</span>
</div>
<div className="flex items-center justify-between text-body-sm">
<span className="text-[#9E9B93]">Live Wait Est.</span>
<span className="text-[#10B981] font-mono">0 min (Instant)</span>
</div>
<div className="flex items-center justify-between text-body-sm">
<span className="text-[#9E9B93]">Max Power</span>
<span className="text-[#10B981] font-mono font-semibold">300 kW Ultra-DC</span>
</div>
</div>
<div className="flex items-center gap-3 text-label-sm text-[#6E716E] mb-6">
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">park</span> Nature Trail</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">lunch_dining</span> Farm Bistro</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">ev_charger</span> Pull-through</span>
</div>
</div>
<div className="flex items-center gap-2">
<button className="w-full py-2.5 rounded-full bg-[#E8F5E9] text-[#181A19] font-label-ui font-bold font-bold text-label-md hover:bg-primary transition-all flex items-center justify-center gap-1.5">
<span className="material-symbols-outlined text-sm">bolt</span>
            Reserve Bay
          </button>
</div>
</div>

<div className="lg:col-span-6 bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] hover:border-[#10B981] transition-colors  rounded-3xl p-6 flex flex-col justify-between">
<div>

<div className="flex items-center justify-between gap-2 mb-3">
<span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-300 text-label-sm font-label-ui uppercase tracking-wider font-bold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              At Capacity · Fast Turnover
            </span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold font-mono text-[#6E716E]">€0.39 / kWh</span>
</div>
<div className="flex items-start justify-between">
<div>
<h3 className="text-headline-sm font-display font-bold text-[#181A19]">GridPoint Transit Hub</h3>
<p className="text-body-sm text-[#6E716E] mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-xs text-[#9E9B93]">location_on</span>
                South Bypass Interchange 3 · 14.8 km (11 min drive)
              </p>
</div>
<span className="text-headline-sm font-display font-bold font-mono text-amber-600">0 / 8 Free</span>
</div>
<p className="text-body-sm text-[#6E716E] mt-3">
            High turnover depot station with automated camera-vision release. Est. opening stall in <strong className="text-[#181A19]">4 minutes</strong>.
          </p>

<div className="flex items-center gap-4 text-label-sm text-[#9E9B93] mt-4">
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">local_gas_station</span> C-Store</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">tire_repair</span> Air/Water</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">videocam</span> Security Guard</span>
</div>
</div>
<div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#E8E4DC]">
<button className="w-full py-2.5 rounded-full bg-[#FFFFFF] border border-[#E8E4DC] text-amber-600 hover:border-tertiary text-label-md font-label-ui font-bold transition-all flex items-center justify-center gap-1.5">
<span className="material-symbols-outlined text-sm">notifications_active</span>
            Alert on Free Bay
          </button>
</div>
</div>

<div className="lg:col-span-6 bg-[#FFFFFF] shadow-sm border border-[#E8E4DC] hover:border-[#10B981] transition-colors  rounded-3xl p-6 flex flex-col justify-between">
<div>

<div className="flex items-center justify-between gap-2 mb-3">
<span className="px-2.5 py-0.5 rounded-full bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20 text-label-sm font-label-ui uppercase tracking-wider font-bold flex items-center gap-1">
<span className="w-1.5 h-1.5 rounded-full bg-[#E8F5E9]"></span>
              91% Wind Energy
            </span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold font-mono text-[#6E716E]">€0.41 / kWh</span>
</div>
<div className="flex items-start justify-between">
<div>
<h3 className="text-headline-sm font-display font-bold text-[#181A19]">Urban Power District</h3>
<p className="text-body-sm text-[#6E716E] mt-1 flex items-center gap-1">
<span className="material-symbols-outlined text-xs text-[#9E9B93]">location_on</span>
                Technopark West · Tor 4 Hub · 6.8 km (9 min drive)
              </p>
</div>
<span className="text-headline-sm font-display font-bold font-mono text-[#10B981]">5 / 6 Free</span>
</div>
<p className="text-body-sm text-[#6E716E] mt-3">
            Commercial grade 175 kW Rapid DC chargers equipped with solar canopies and automated robot cable assistance for fleets.
          </p>

<div className="flex items-center gap-4 text-label-sm text-[#9E9B93] mt-4">
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">solar_power</span> Solar Canopy</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">smart_toy</span> Robotic Arm</span>
<span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">local_cafe</span> Espresso Bar</span>
</div>
</div>
<div className="flex items-center gap-3 mt-6 pt-4 border-t border-[#E8E4DC]">
<button className="w-full py-2.5 rounded-full bg-[#E8F5E9] text-[#181A19] font-label-ui font-bold font-bold text-label-md hover:bg-primary transition-all flex items-center justify-center gap-1.5">
<span className="material-symbols-outlined text-sm">bolt</span>
            Reserve Bay
          </button>
</div>
</div>
</div>

<div className="bg-[#FFFFFF] shadow-sm border border-[#E8E4DC]  rounded-3xl p-6 md:p-8 mb-12 relative overflow-hidden border border-[#E8E4DC]">
<div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
<div className="space-y-1">
<div className="inline-flex items-center gap-1.5 text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#10B981] uppercase tracking-widest font-mono">
<span className="material-symbols-outlined text-sm">psychology</span> Co-Pilot Energy Prediction
          </div>
<h3 className="text-headline-md font-display font-extrabold text-[#181A19]">Auto-Hold Stall P01 at Ionix West?</h3>
<p className="text-body-md text-[#6E716E] max-w-xl">
            Based on your Porsche Taycan's current 23% SoC and active route to Munich, arriving at Bay P01 guarantees pre-conditioned battery temperature at 33°C for peak 270 kW charge curve.
          </p>
</div>
<div className="flex items-center gap-3 shrink-0">
<button className="px-5 py-2.5 rounded-full bg-[#FFFFFF] border border-[#E8E4DC] text-[#6E716E] hover:text-on-surface text-label-md font-label-ui font-bold transition-colors">
            Dismiss Suggestion
          </button>
<button className="px-6 py-2.5 rounded-full bg-[#10B981] text-[#FAF8F5] font-label-ui font-bold font-bold text-label-md shadow-lg shadow-primary/20 hover:bg-primary-fixed transition-all active:scale-[0.98]">
            Accept &amp; Route Precondition
          </button>
</div>
</div>
</div>
</main>
  );
}