"use client";

import { useAuthStore } from "@/app/store/authStore";
import { useState } from "react";
import useSWR from "swr";
import { 
  AreaChart, Area, 
  BarChart, Bar, 
  PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer 
} from 'recharts';

const fetcher = (url: string) => fetch(url).then(res => res.json());

const pageStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes glowPulse {
    0%, 100% { box-shadow: 0 0 15px rgba(99,102,241,0.15); }
    50% { box-shadow: 0 0 25px rgba(99,102,241,0.25); }
  }

  .dash-header {
    margin-bottom: 2.5rem;
    animation: fadeIn 0.4s ease both;
  }

  .dash-title {
    font-size: 2.25rem;
    font-weight: 700;
    margin: 0 0 0.5rem 0;
    color: var(--dash-text);
    letter-spacing: -0.03em;
  }

  .gradient-text {
    background: linear-gradient(135deg, #6366F1 0%, #A855F7 50%, #EC4899 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .dash-subtitle {
    font-size: 14px;
    color: var(--dash-text-muted);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .live-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #22C55E;
    box-shadow: 0 0 8px rgba(34, 197, 94, 0.5);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
    70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(34, 197, 94, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.25rem;
    margin-bottom: 1.5rem;
  }

  .metric-card {
    background: #1E293B;
    backdrop-filter: blur(12px);
    border: 1px solid var(--dash-border);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.5s ease both;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
  }

  .metric-card:nth-child(1) { animation-delay: 0.05s; }
  .metric-card:nth-child(2) { animation-delay: 0.10s; }
  .metric-card:nth-child(3) { animation-delay: 0.15s; }
  .metric-card:nth-child(4) { animation-delay: 0.20s; }
  
  .metric-card:hover {
    transform: translateY(-4px);
    border-color: rgba(99,102,241,0.2);
    box-shadow: 0 12px 40px rgba(0,0,0,0.3);
  }

  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .metric-title {
    font-size: 12px;
    font-weight: 600;
    color: var(--dash-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .metric-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .metric-icon svg { width: 18px; height: 18px; }

  .metric-card:nth-child(1) .metric-icon { background: rgba(99,102,241,0.15); color: #818CF8; }
  .metric-card:nth-child(2) .metric-icon { background: rgba(168,85,247,0.15); color: #C084FC; }
  .metric-card:nth-child(3) .metric-icon { background: rgba(6,182,212,0.15); color: #22D3EE; }
  .metric-card:nth-child(4) .metric-icon { background: rgba(244,63,94,0.15); color: #FB7185; }

  .metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: var(--dash-text);
    margin: 0 0 0.5rem 0;
    line-height: 1;
    letter-spacing: -0.02em;
  }

  .metric-trend {
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .trend-up { color: #22C55E; }
  .trend-down { color: #F43F5E; }

  .bento-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.25rem;
    margin-bottom: 1.25rem;
  }
  @media (max-width: 1024px) { .bento-grid { grid-template-columns: 1fr; } }

  .bento-card {
    background: #1E293B;
    backdrop-filter: blur(12px);
    border: 1px solid var(--dash-border);
    border-radius: 16px;
    padding: 1.5rem;
    animation: fadeIn 0.6s ease both;
    animation-delay: 0.25s;
    display: flex;
    flex-direction: column;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .bento-card:hover {
    border-color: rgba(99,102,241,0.15);
    box-shadow: 0 8px 30px rgba(0,0,0,0.2);
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 0.25rem 0;
    color: var(--dash-text);
  }
  
  .card-subtitle {
    font-size: 13px;
    color: var(--dash-text-muted);
    margin: 0 0 1.5rem 0;
  }

  .chart-wrapper {
    width: 100%;
    height: 300px;
    flex: 1;
    min-height: 250px;
  }

  /* Activity Feed */
  .feed-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    max-height: 360px;
    overflow-y: auto;
    padding-right: 8px;
  }
  .feed-item {
    display: flex;
    gap: 12px;
    position: relative;
  }
  .feed-item:not(:last-child)::after {
    content: ''; position: absolute;
    left: 17px; top: 36px; bottom: -12px;
    width: 2px; background: var(--dash-border);
  }
  .feed-icon {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: var(--dash-surface-hover);
    border: 1px solid var(--dash-border);
    display: flex; align-items: center; justify-content: center;
    color: var(--dash-text-muted);
    z-index: 2;
  }
  .feed-content { flex: 1; padding-top: 4px; }
  .feed-header {
    display: flex; justify-content: space-between; margin-bottom: 2px;
  }
  .feed-subject { font-size: 13px; font-weight: 600; color: var(--dash-text); }
  .feed-time { font-size: 11px; color: var(--dash-text-muted); }
  .feed-desc { font-size: 12px; color: var(--dash-text-muted); line-height: 1.4; }
  
  /* Customizing Recharts Tooltip */
  .custom-tooltip {
    background: #1E293B;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 12px;
    padding: 12px 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  }
  .tooltip-label {
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--dash-text);
    font-size: 13px;
    border-bottom: 1px solid var(--dash-border);
    padding-bottom: 6px;
  }
  .tooltip-item {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 4px;
    color: var(--dash-text-muted);
  }
`;

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <div className="tooltip-label">{label}</div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="tooltip-item">
            <span style={{ color: entry.color }}>●</span>
            {entry.name}: <strong style={{ color: varDashText(entry.color) }}>
              {entry.name.includes("Amount") || entry.name.includes("Value") || entry.name.includes("Revenue") || entry.name.includes("Sum") 
                ? '$' + entry.value.toLocaleString() 
                : entry.value}
            </strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Helper for the tooltip text color purely based on dark/light but we'll return entry color here to keep it simple
const varDashText = (fallback: string) => fallback; 

export default function DashboardOverview() {
  const { user } = useAuthStore();

  const { data, error, isLoading, mutate } = useSWR(
    user?.company_id ? `/api/dashboard?companyId=${user.company_id}` : null, 
    fetcher,
    { refreshInterval: 15000 } // Poll every 15s for "near real-time" effect
  );

  const [saleTitle, setSaleTitle] = useState("");
  const [saleValue, setSaleValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleQuickSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleTitle || !saleValue) return;
    setIsSubmitting(true);
    try {
      await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: user?.company_id,
          title: saleTitle,
          value: Number(saleValue),
          stage: "closed_won"
        })
      });
      setSaleTitle("");
      setSaleValue("");
      mutate(); // Instantly refresh SWR visuals
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && !data) {
    return (
      <div style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div className="live-indicator"></div> 
        <span style={{ color: 'var(--dash-text-muted)' }}>Syncing live database metrics...</span>
      </div>
    );
  }

  // Safe destructuring with fallbacks
  const MOCK_METRICS = data?.metrics || {
    contacts: 0,
    activeOps: 0,
    pipelineVal: 0,
    openTickets: 0
  };

  const ACTIVITIES = data?.activities || [];
  
  const REVENUE_DATA = data?.revenueForecast || [];
  
  const PIPELINE_DIST = data?.pipelineBreakdown?.distribution || [];
  
  const TEAM_PROD = data?.teamProductivity || [];

  return (
    <>
      <style>{pageStyles}</style>

      <header className="dash-header">
        <h1 className="dash-title">Good afternoon, <span className="gradient-text">{user?.employee_id || "User"}</span></h1>
        <p className="dash-subtitle">
          <span className="live-indicator"></span>
          Live streaming your workspace analytics
        </p>
      </header>

      <section className="metrics-grid">
        {/* Pipeline Value */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Pipeline Value</span>
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            </div>
          </div>
          <h2 className="metric-value">₹{(MOCK_METRICS.pipelineVal / 1000).toFixed(0)}k</h2>
          <div className="metric-trend trend-up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            Live from Database
          </div>
        </div>

        {/* Active Opps */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Active Deals</span>
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            </div>
          </div>
          <h2 className="metric-value">{MOCK_METRICS.activeOps}</h2>
          <div className="metric-trend trend-up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            Live
          </div>
        </div>

        {/* Total Contacts */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Total Contacts</span>
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
            </div>
          </div>
          <h2 className="metric-value">{MOCK_METRICS.contacts}</h2>
          <div className="metric-trend trend-up">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>
            Live
          </div>
        </div>

        {/* Tickets */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-title">Open Tickets</span>
            <div className="metric-icon" style={{ color: '#C0392B', background: '#FDEDEC' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            </div>
          </div>
          <h2 className="metric-value">{MOCK_METRICS.openTickets}</h2>
          <div className="metric-trend trend-down">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline><polyline points="16 17 22 17 22 11"></polyline></svg>
            Action Needed
          </div>
        </div>
      </section>

      {/* CHARTS LAYER 1 */}
      <section className="bento-grid">
        {/* Revenue Forecast AreaChart */}
        <div className="bento-card">
          <h3 className="card-title">Revenue Forecast</h3>
          <p className="card-subtitle">Predicted deals and historic closed-won revenue by expectation month.</p>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPipe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val/1000)}k`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36}/>
                <Area type="monotone" dataKey="wonSum" name="Closed Won (₹)" stroke="#818CF8" fillOpacity={1} fill="url(#colorWon)" activeDot={{ r: 6, fill: '#6366F1', stroke: '#818CF8', strokeWidth: 2 }}/>
                <Area type="monotone" dataKey="pipelineSum" name="Pipeline Value (₹)" stroke="#22D3EE" fillOpacity={1} fill="url(#colorPipe)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Performance PieChart */}
        <div className="bento-card">
          <h3 className="card-title">Deals by Stage</h3>
          <p className="card-subtitle">Distribution of all active opportunities.</p>
          <div className="chart-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomTooltip />} />
                <Pie
                  data={PIPELINE_DIST}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                >
                  {PIPELINE_DIST.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* CHARTS LAYER 2 */}
      <section className="bento-grid">
        {/* Team Productivity BarChart */}
        <div className="bento-card">
          <h3 className="card-title">Team Productivity Stats</h3>
          <p className="card-subtitle">Comparing assigned deals and logged activities across your team.</p>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TEAM_PROD} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="name" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Legend verticalAlign="top" height={36}/>
                <Bar yAxisId="left" dataKey="deals" name="Deals Assigned" fill="#A855F7" radius={[6, 6, 0, 0]} animationDuration={1500} />
                <Bar yAxisId="right" dataKey="activities" name="Logged Activities" fill="#F59E0B" radius={[6, 6, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Log Sale Form */}
        <div className="bento-card">
          <h3 className="card-title">Quick Log Sale</h3>
          <p className="card-subtitle">Instantly record revenue to update dashboard metrics.</p>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }} onSubmit={handleQuickSale}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--dash-text-muted)', marginBottom: '6px' }}>Client / Deal Name</label>
              <input 
                type="text" 
                required 
                value={saleTitle}
                onChange={(e) => setSaleTitle(e.target.value)}
                placeholder="e.g. Enterprise License Q4"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)', fontSize: '13px', outline: 'none' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 500, color: 'var(--dash-text-muted)', marginBottom: '6px' }}>Total Value (₹)</label>
              <input 
                type="number" 
                required 
                min="0"
                value={saleValue}
                onChange={(e) => setSaleValue(e.target.value)}
                placeholder="25000"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid var(--dash-border)', background: 'var(--dash-bg)', color: 'var(--dash-text)', fontSize: '13px', outline: 'none' }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{
                marginTop: 'auto',
                background: 'transparent', border: '1px solid #475569', color: '#E2E8F0', padding: '12px 16px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'all 0.3s', opacity: isSubmitting ? 0.7 : 1, letterSpacing: '-0.01em', boxShadow: 'none'
              }}
            >
              {isSubmitting ? "Logging Deal..." : "Log Closed Won Deal"}
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
