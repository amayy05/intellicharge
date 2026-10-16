import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function DriverAuth() {
  const { user, isAuthenticated, login, register, logout } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await login(email, password);
        setSuccessMsg('Authenticated successfully! Vehicle profile synchronized.');
      } else {
        await register(email, password, name);
        setSuccessMsg('Account registered and profile created successfully!');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-grow pt-24 pb-20 px-space-md md:px-space-xl max-w-7xl mx-auto w-full flex items-center">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center w-full my-auto">

<section className="lg:col-span-7 flex flex-col gap-space-lg pr-0 lg:pr-4">

<div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E8E4DC] backdrop-blur-md shadow-sm">
<span className="relative flex h-2 w-2">
<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
<span className="relative inline-flex rounded-full h-2 w-2 bg-[#E8F5E9]"></span>
</span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#595C59] tracking-wider">INTELLICHARGE DRIVER PROTOCOL v3.8</span>
<span className="text-[#E8E4DC]">•</span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E] font-medium">CAN-Bus Biometrics</span>
</div>

<div className="space-y-3">
<h1 className="font-display font-extrabold text-headline-xl font-bold tracking-tight text-[#181A19] text-balance">
            Autonomous EV Fleet &amp; <br/>
<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary-fixed-dim to-secondary">
              Driver Biometric Access
            </span>
</h1>
<p className="font-body font-medium text-body-lg text-[#6E716E] max-w-xl leading-relaxed">
            Seamless cryptographic authentication paired directly with vehicle CAN-bus telemetry, automatic stall reservation, and intelligent dynamic green-grid charging tariffs.
          </p>
</div>

<div className="apple-glass rounded-3xl p-space-lg relative overflow-hidden transition-all duration-300 hover:border-primary/30 group">

<div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb- space-md border-b border-[#E8E4DC]">
<div>
<div className="flex items-center gap-2">
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#10B981] tracking-widest uppercase">Telemetry Active</span>
<span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E8F5E9]"></span>
</div>
<h2 className="font-display font-extrabold text-headline-md font-semibold text-[#181A19] mt-0.5">Porsche Taycan 4S</h2>
<p className="font-body font-medium text-body-sm text-[#6E716E]">Frozen Metallic Black • Fleet ID #TC-8829</p>
</div>
<div className="flex items-center gap-2">
<span className="px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] font-label-ui font-bold text-label-md flex items-center gap-1.5">
<span className="material-symbols-outlined text-[15px]" data-icon="cable">cable</span>
                CCS2 Autoconnect
              </span>
</div>
</div>

<div className="mt-space-md space-y-2">
<div className="flex justify-between items-baseline">
<span className="font-body font-medium text-body-sm text-[#6E716E] flex items-center gap-1.5">
<span className="material-symbols-outlined text-[16px] text-[#10B981]" data-icon="battery_charging_full">battery_charging_full</span>
                Current State of Charge (SoC)
              </span>
<div className="flex items-baseline gap-1">
<span className="font-metric font-extrabold text-headline-lg font-bold text-[#181A19]">23%</span>
<span className="text-label-md font-label-ui font-bold text-[#10B981] font-semibold">→ 80% AI Target</span>
</div>
</div>

<div className="h-3 w-full rounded-full bg-[#F9F7F2] border border-[#E8E4DC] p-0.5 relative overflow-hidden flex">
<div className="h-full rounded-full bg-gradient-to-r from-secondary-container via-primary-container to-primary transition-all duration-700 relative" style={{"width":"28%"}}>
<div className="absolute inset-0 bg-white/20 animate-pulse"></div>
</div>

<div className="absolute top-0 bottom-0 left-[80%] w-0.5 bg-[#10B981] shadow-[0_0_8px_#5af0b3]"></div>
</div>
<div className="flex justify-between text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E] pt-1">
<span>Remaining: 74 km</span>
<span className="text-[#595C59]">AI Optimal Stall: 270 kW Ready</span>
<span>Target: 395 km</span>
</div>
</div>

<div className="grid grid-cols-3 gap-3 mt-space-md pt-space-sm border-t border-[#E8E4DC]">
<div className="bg-surface-container/60 rounded-xl p-3 border border-[#E8E4DC]">
<div className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E]">Battery Health</div>
<div className="text-headline-sm font-display font-bold font-semibold text-[#181A19] mt-0.5">98.4%</div>
<div className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#10B981] flex items-center gap-0.5 mt-0.5">
<span className="material-symbols-outlined text-[12px]" data-icon="check_circle">check_circle</span>
                Optimal Pack
              </div>
</div>
<div className="bg-surface-container/60 rounded-xl p-3 border border-[#E8E4DC]">
<div className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E]">Peak Intake</div>
<div className="text-headline-sm font-display font-bold font-semibold text-[#181A19] mt-0.5">270 kW</div>
<div className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#595C59] flex items-center gap-0.5 mt-0.5">
<span className="material-symbols-outlined text-[12px]" data-icon="bolt">bolt</span>
                800V Architecture
              </div>
</div>
<div className="bg-surface-container/60 rounded-xl p-3 border border-[#E8E4DC]">
<div className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E]">Preconditioning</div>
<div className="text-headline-sm font-display font-bold font-semibold text-[#181A19] mt-0.5">Ready</div>
<div className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-tertiary-fixed-dim flex items-center gap-0.5 mt-0.5">
<span className="material-symbols-outlined text-[12px]" data-icon="thermostat">thermostat</span>
                31.5°C Cell Temp
              </div>
</div>
</div>
</div>

<div className="flex flex-wrap gap-2.5">
<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container/70 border border-[#E8E4DC] text-[#6E716E] text-label-md font-label-ui font-bold">
<span className="material-symbols-outlined text-[#10B981] text-[16px]" data-icon="bolt">bolt</span>
            Plug &amp; Charge Instant Handshake
          </div>
<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container/70 border border-[#E8E4DC] text-[#6E716E] text-label-md font-label-ui font-bold">
<span className="material-symbols-outlined text-[#10B981] text-[16px]" data-icon="calendar_month">calendar_month</span>
            Autonomous Stall Reservation
          </div>
<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container/70 border border-[#E8E4DC] text-[#6E716E] text-label-md font-label-ui font-bold">
<span className="material-symbols-outlined text-[#10B981] text-[16px]" data-icon="hourglass_empty">hourglass_empty</span>
            Zero-Wait Queue Prioritization
          </div>
<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container/70 border border-[#E8E4DC] text-[#6E716E] text-label-md font-label-ui font-bold">
<span className="material-symbols-outlined text-[#10B981] text-[16px]" data-icon="eco">eco</span>
            Dynamic Green-Grid Tariffs
          </div>
</div>
</section>

<section className="lg:col-span-5 flex flex-col justify-center">
<div className="apple-glass rounded-3xl p-6 sm:p-8 relative shadow-2xl overflow-hidden border border-[#10B981]/20">

<div className="absolute -top-12 left-1/4 right-1/4 h-24 bg-[#10B981]/10 rounded-full blur-2xl pointer-events-none"></div>

{isAuthenticated ? (
  <div className="space-y-6 text-center py-4">
    <div className="w-16 h-16 rounded-full bg-[#181A19] text-[#10B981] flex items-center justify-center mx-auto shadow-lg">
      <span className="material-symbols-outlined text-[32px]">verified_user</span>
    </div>
    <div>
      <h3 className="font-display text-2xl font-extrabold text-[#181A19]">{user?.name || 'Driver'}</h3>
      <p className="font-body text-sm text-[#6E716E] mt-1">{user?.email}</p>
      <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full bg-[#E8F5E9] text-[#10B981] text-xs font-label-ui font-bold uppercase tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping"></span>
        CAN-Bus Authenticated
      </span>
    </div>
    <div className="bg-[#F5F2EB] border border-[#E8E4DC] rounded-2xl p-4 text-left space-y-2">
      <div className="flex justify-between text-xs font-label-ui text-[#6E716E]">
        <span>Security Clearance</span>
        <span className="text-[#181A19] font-bold">Level 3 Autonomous</span>
      </div>
      <div className="flex justify-between text-xs font-label-ui text-[#6E716E]">
        <span>Active Session</span>
        <span className="text-[#10B981] font-mono font-bold">Verified JWT Token</span>
      </div>
    </div>
    <button 
      onClick={logout}
      className="w-full py-3 px-4 rounded-2xl bg-[#181A19] hover:bg-[#2B2E2C] text-[#FAF8F5] font-label-ui text-sm font-bold transition-all shadow-md"
    >
      Sign Out Driver Session
    </button>
  </div>
) : (
  <>
    <div className="p-1 rounded-2xl bg-surface-container-lowest/80 border border-[#E8E4DC] flex items-center relative mb-6">
      <button 
        type="button"
        onClick={() => { setMode('signin'); setErrorMsg(''); setSuccessMsg(''); }}
        className={`flex-1 py-2 px-4 rounded-xl text-center text-label-md font-label-ui font-bold transition-all ${mode === 'signin' ? 'text-[#181A19] bg-surface-bright/70 border border-[#10B981]/20 shadow-md font-semibold' : 'text-[#6E716E] hover:text-on-surface'}`}
      >
        Driver Sign In
      </button>
      <button 
        type="button"
        onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }}
        className={`flex-1 py-2 px-4 rounded-xl text-center text-label-md font-label-ui font-bold transition-all ${mode === 'register' ? 'text-[#181A19] bg-surface-bright/70 border border-[#10B981]/20 shadow-md font-semibold' : 'text-[#6E716E] hover:text-on-surface'}`}
      >
        Register EV Profile
      </button>
    </div>

    {errorMsg && (
      <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
        {errorMsg}
      </div>
    )}
    {successMsg && (
      <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium">
        {successMsg}
      </div>
    )}

    <form className="space-y-4" onSubmit={handleSubmit}>
      {mode === 'register' && (
        <div className="space-y-1.5">
          <label className="block text-label-md font-label-ui font-bold text-[#6E716E] font-medium">Full Driver Name</label>
          <div className="apple-glass-input rounded-xl flex items-center px-3.5 py-2.5 gap-2.5 text-[#181A19]">
            <span className="material-symbols-outlined text-[18px] text-[#9E9B93]">person</span>
            <input 
              className="bg-transparent border-0 p-0 text-body-md font-body font-medium text-[#181A19] placeholder:text-outline-variant focus:ring-0 w-full focus:outline-none" 
              placeholder="Elena Vance" 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="block text-label-md font-label-ui font-bold text-[#6E716E] font-medium">Driver Email / Fleet Pass ID</label>
        <div className="apple-glass-input rounded-xl flex items-center px-3.5 py-2.5 gap-2.5 text-[#181A19]">
          <span className="material-symbols-outlined text-[18px] text-[#9E9B93]">badge</span>
          <input 
            className="bg-transparent border-0 p-0 text-body-md font-body font-medium text-[#181A19] placeholder:text-outline-variant focus:ring-0 w-full focus:outline-none" 
            placeholder="driver@fleet.intellicharge.net" 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <label className="block text-label-md font-label-ui font-bold text-[#6E716E] font-medium">Password / Biometric Key</label>
        </div>
        <div className="apple-glass-input rounded-xl flex items-center px-3.5 py-2.5 gap-2.5 text-[#181A19]">
          <span className="material-symbols-outlined text-[18px] text-[#9E9B93]">lock</span>
          <input 
            className="bg-transparent border-0 p-0 text-body-md font-body font-medium text-[#181A19] placeholder:text-outline focus:ring-0 w-full focus:outline-none" 
            type="password" 
            required
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-body-sm font-body font-medium text-[#6E716E] pt-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input defaultChecked className="rounded border-[#E8E4DC] bg-[#F9F7F2] text-[#10B981] focus:ring-primary/40 focus:ring-offset-0 w-4 h-4" type="checkbox"/>
          <span>Remember on vehicle console</span>
        </label>
        <span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#595C59]">ISO 15118 Active</span>
      </div>

      <button 
        disabled={loading}
        className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-[#181A19] hover:bg-[#2B2E2C] text-[#FAF8F5] font-display font-bold text-body-lg flex items-center justify-center gap-2 shadow-md transition-all duration-150 cursor-pointer disabled:opacity-50" 
        type="submit"
      >
        <span className="material-symbols-outlined text-[20px]">bolt</span>
        <span>{loading ? 'Authenticating...' : mode === 'signin' ? 'Authenticate & Sync Vehicle' : 'Create Driver Profile'}</span>
        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
      </button>
    </form>
  </>
)}

<div className="mt-6 pt-4 border-t border-[#E8E4DC]">
<div className="flex items-center justify-between mb-2">
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#595C59] font-semibold uppercase tracking-wider">Step 1 of 2: Telemetry Pairing</span>
<span className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#6E716E]">Ready for CAN Sync</span>
</div>
<div className="p-2.5 rounded-xl bg-surface-container-lowest/60 border border-[#E8E4DC] flex items-center justify-between">
<div className="flex items-center gap-2.5">
<div className="w-7 h-7 rounded-lg bg-[#FFFFFF] flex items-center justify-center text-[#10B981]">
<span className="material-symbols-outlined text-[16px]">electric_car</span>
</div>
<div>
<div className="text-label-md font-label-ui font-bold text-[#181A19] font-medium">Porsche Taycan 4S</div>
<div className="text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93]">Protocol: CCS2 Standard (800V)</div>
</div>
</div>
<span className="text-[#10B981] text-label-sm font-label-ui uppercase tracking-wider font-bold">Paired</span>
</div>
</div>

<div className="mt-4 pt-3 flex items-center justify-center gap-2 text-label-sm font-label-ui uppercase tracking-wider font-bold text-[#9E9B93] text-center">
<span className="material-symbols-outlined text-[14px] text-[#10B981]">verified</span>
<span>Protected by End-to-End Cryptographic Enclave • ISO 15118 Certified</span>
</div>
</div>
</section>
</div>
</main>
  );
}