import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
export default function DriverAuth({ userVehicle, batteryPct = 42, targetSoc = 80 }) {
  const { user, isAuthenticated, login, register, logout } = useAuth();
  const [mode, setMode] = useState('signin'); // 'signin' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const estRangeKm = userVehicle?.battery_capacity_kwh 
    ? Math.round((batteryPct / 100) * userVehicle.battery_capacity_kwh * 6.5)
    : Math.round((batteryPct / 100) * 320);

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
    <main className="flex-grow pt-8 pb-20 px-4 md:px-8 max-w-7xl mx-auto w-full flex items-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start w-full my-auto">
        
        {/* Left Column: Real Authenticated Vehicle Status or Real Network Info */}
        <section className="lg:col-span-7 flex flex-col gap-6 pr-0 lg:pr-4">
          <div className="inline-flex items-center gap-2 self-start px-3.5 py-1.5 rounded-full bg-[#FFFFFF] border border-[#E8E4DC] backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isAuthenticated ? 'bg-[#10B981]' : 'bg-[#F59E0B]'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isAuthenticated ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`}></span>
            </span>
            <span className="text-xs font-label-ui uppercase tracking-wider font-bold text-[#595C59]">
              {isAuthenticated ? 'Driver Session Active' : 'IntelliCharge Driver Access'}
            </span>
            <span className="text-[#E8E4DC]">•</span>
            <span className="text-xs font-label-ui uppercase tracking-wider text-[#6E716E] font-medium">
              {isAuthenticated ? user?.email : 'Secure Token Auth'}
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight text-[#181A19]">
              {isAuthenticated ? 'Connected Driver & EV Profile' : 'EV Driver Authentication & Vehicle Sync'}
            </h1>
            <p className="font-body text-base text-[#6E716E] max-w-xl leading-relaxed">
              {isAuthenticated 
                ? 'Your authenticated session connects your vehicle telemetry, stored preferences, and personal charging queue reservations across all network stations.'
                : 'Sign in to access personalized charging recommendations, save your vehicle battery specifications, and hold queue positions at high-demand charging hubs.'
              }
            </p>
          </div>

          {/* Dynamic Active Vehicle Card */}
          <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-2xl p-6 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-label-ui uppercase tracking-wider font-bold text-[#10B981] bg-[#E8F5E9] px-2.5 py-0.5 rounded-full">
                  {isAuthenticated ? 'Active Synced EV' : 'Default Profile Spec'}
                </span>
                <h3 className="font-display text-2xl font-extrabold text-[#181A19] mt-1.5">
                  {userVehicle?.model_name || 'Generic Electric Vehicle'}
                </h3>
                <p className="text-xs text-[#6E716E]">
                  Connector: <span className="font-semibold text-[#181A19]">{userVehicle?.connector_type || 'CCS2'}</span> • 
                  Capacity: <span className="font-semibold text-[#181A19]">{userVehicle?.battery_capacity_kwh ?? '—'} kWh</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#9E9B93] block font-medium">State of Charge</span>
                <span className="text-3xl font-extrabold font-display text-[#181A19]">{batteryPct}%</span>
                <span className="text-xs text-[#10B981] block font-semibold">Target {targetSoc}%</span>
              </div>
            </div>

            {/* Battery Progress Bar */}
            <div className="w-full bg-[#F5F2EB] rounded-full h-3 overflow-hidden relative border border-[#E8E4DC]">
              <div 
                className="bg-[#181A19] h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(5, batteryPct))}%` }}
              ></div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-[#F9F7F2] border border-[#E8E4DC] p-3 rounded-xl">
                <span className="text-[11px] font-label-ui uppercase text-[#6E716E] block font-semibold">Estimated Range</span>
                <span className="text-xl font-extrabold text-[#181A19] mt-0.5 block">~{estRangeKm} km</span>
              </div>
              <div className="bg-[#F9F7F2] border border-[#E8E4DC] p-3 rounded-xl">
                <span className="text-[11px] font-label-ui uppercase text-[#6E716E] block font-semibold">Energy Needed</span>
                <span className="text-xl font-extrabold text-[#181A19] mt-0.5 block">
                  {userVehicle?.battery_capacity_kwh
                    ? Math.max(0, Math.round(((targetSoc - batteryPct) / 100) * userVehicle.battery_capacity_kwh))
                    : '—'}{' '}
                  kWh
                </span>
              </div>
              <div className="bg-[#F9F7F2] border border-[#E8E4DC] p-3 rounded-xl">
                <span className="text-[11px] font-label-ui uppercase text-[#6E716E] block font-semibold">Max Intake</span>
                <span className="text-xl font-extrabold text-[#181A19] mt-0.5 block">
                  {userVehicle?.max_charging_power_kw || '—'} kW
                </span>
              </div>
            </div>
          </div>

          {/* Genuine Feature Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-[#FFFFFF] border border-[#E8E4DC] p-3 rounded-xl text-center">
              <span className="material-symbols-outlined text-[#10B981] text-xl block mb-1">lock</span>
              <span className="text-xs font-bold text-[#181A19] block">JWT Auth</span>
              <span className="text-[10px] text-[#6E716E]">Encrypted Tokens</span>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E8E4DC] p-3 rounded-xl text-center">
              <span className="material-symbols-outlined text-[#10B981] text-xl block mb-1">queue</span>
              <span className="text-xs font-bold text-[#181A19] block">Queue Reserve</span>
              <span className="text-[10px] text-[#6E716E]">Zero-Conflict Locks</span>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E8E4DC] p-3 rounded-xl text-center">
              <span className="material-symbols-outlined text-[#10B981] text-xl block mb-1">psychology</span>
              <span className="text-xs font-bold text-[#181A19] block">ML Estimation</span>
              <span className="text-[10px] text-[#6E716E]">Wait-Time Predictor</span>
            </div>
            <div className="bg-[#FFFFFF] border border-[#E8E4DC] p-3 rounded-xl text-center">
              <span className="material-symbols-outlined text-[#10B981] text-xl block mb-1">shield</span>
              <span className="text-xs font-bold text-[#181A19] block">Isolated Data</span>
              <span className="text-[10px] text-[#6E716E]">Zero Cross-Leak</span>
            </div>
          </div>
        </section>

        {/* Right Column: Real Sign In / Sign Up or Logged In Actions */}
        <section className="lg:col-span-5 w-full">
          <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-3xl p-6 md:p-8 shadow-sm">
            {isAuthenticated ? (
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-[#E8E4DC]">
                  <div className="w-12 h-12 rounded-full bg-[#181A19] text-[#FAF8F5] flex items-center justify-center font-bold text-lg">
                    {user?.name ? user.name[0].toUpperCase() : (user?.email ? user.email[0].toUpperCase() : 'U')}
                  </div>
                  <div>
                    <h3 className="font-display font-extrabold text-xl text-[#181A19]">
                      {user?.name || 'EV Driver'}
                    </h3>
                    <p className="text-xs text-[#6E716E] font-medium">{user?.email}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="bg-[#F9F7F2] border border-[#E8E4DC] p-4 rounded-xl space-y-2">
                    <span className="text-xs font-bold uppercase text-[#6E716E] tracking-wider block">Session Details</span>
                    <div className="flex justify-between text-xs text-[#181A19]">
                      <span>Account ID:</span>
                      <span className="font-mono font-semibold">#{user?.id || 'Active'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#181A19]">
                      <span>Vehicle Registered:</span>
                      <span className="font-semibold">{userVehicle?.model_name || 'Default EV'}</span>
                    </div>
                    <div className="flex justify-between text-xs text-[#181A19]">
                      <span>Security Standard:</span>
                      <span className="text-[#10B981] font-semibold">HMAC-SHA256 JWT</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="w-full py-3 px-4 rounded-xl bg-[#F5F2EB] hover:bg-[#E8E4DC] text-[#EF4444] font-label-ui text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out of Driver Session
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex rounded-xl bg-[#F5F2EB] p-1 border border-[#E8E4DC]">
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className={`flex-1 py-2 text-xs font-label-ui font-bold rounded-lg transition-all cursor-pointer ${
                      mode === 'signin' ? 'bg-[#181A19] text-[#FAF8F5] shadow-sm' : 'text-[#6E716E] hover:text-[#181A19]'
                    }`}
                  >
                    Driver Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('register')}
                    className={`flex-1 py-2 text-xs font-label-ui font-bold rounded-lg transition-all cursor-pointer ${
                      mode === 'register' ? 'bg-[#181A19] text-[#FAF8F5] shadow-sm' : 'text-[#6E716E] hover:text-[#181A19]'
                    }`}
                  >
                    Register EV Profile
                  </button>
                </div>

                <div className="space-y-1">
                  <h2 className="font-display font-extrabold text-2xl text-[#181A19]">
                    {mode === 'signin' ? 'Welcome Back, Driver' : 'Create Driver Account'}
                  </h2>
                  <p className="font-body text-xs text-[#6E716E]">
                    {mode === 'signin'
                      ? 'Enter your credentials to access your queues and vehicle sync.'
                      : 'Register a new account to unlock predictive routing and queue holds.'}
                  </p>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-medium">
                    {errorMsg}
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-xs font-medium">
                    {successMsg}
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <label className="block text-xs font-label-ui font-bold text-[#181A19] mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Maya Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F5] text-xs text-[#181A19] focus:outline-none focus:ring-2 focus:ring-[#181A19]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-label-ui font-bold text-[#181A19] mb-1">Driver Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="driver@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F5] text-xs text-[#181A19] focus:outline-none focus:ring-2 focus:ring-[#181A19]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-label-ui font-bold text-[#181A19] mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E4DC] bg-[#FAF8F5] text-xs text-[#181A19] focus:outline-none focus:ring-2 focus:ring-[#181A19]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl bg-[#181A19] hover:bg-[#2B2E2C] text-[#FAF8F5] font-label-ui text-sm font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>{mode === 'signin' ? 'Sign In & Sync Vehicle' : 'Register & Create Profile'}</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}