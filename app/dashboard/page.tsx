"use client";

import { useAuthStore } from "@/app/store/authStore";
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
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .dash-header {
    margin-bottom: 2rem;
    animation: fadeIn 0.4s ease both;
  }

  .dash-title {
    font-family: var(--font-display, 'DM Serif Display', serif);
    font-size: 2rem;
    margin: 0 0 0.5rem 0;
    color: var(--dash-text);
  }

  .dash-subtitle {
    font-size: 14px;
    color: var(--dash-text-muted);
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  
  .live-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--dash-accent);
    box-shadow: 0 0 8px var(--dash-accent);
    animation: pulse 2s infinite;
  }
  
  @keyframes pulse {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0.7); }
    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(76, 175, 80, 0); }
    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(76, 175, 80, 0); }
  }

  .metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }

  .metric-card {
    background: var(--dash-surface);
    border: 1px solid var(--dash-border);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    display: flex;
    flex-direction: column;
    animation: fadeIn 0.5s ease both;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(0,0,0,0.06);
  }

  .metric-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .metric-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--dash-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .metric-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--dash-accent-light);
    color: var(--dash-accent);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .metric-icon svg { width: 18px; height: 18px; }

  .metric-value {
    font-size: 2rem;
    font-weight: 600;
    color: var(--dash-text);
    margin: 0 0 0.5rem 0;
    line-height: 1;
  }

  .metric-trend {
    font-size: 12px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .trend-up { color: var(--dash-accent); }
  .trend-down { color: #C0392B; }

  .bento-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  @media (max-width: 1024px) { .bento-grid { grid-template-columns: 1fr; } }

  .bento-card {
    background: var(--dash-surface);
    border: 1px solid var(--dash-border);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    animation: fadeIn 0.6s ease both;
    animation-delay: 0.25s;
    display: flex;
    flex-direction: column;
  }

  .card-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
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
    background: var(--dash-surface);
    border: 1px solid var(--dash-border);
    border-radius: 8px;
    padding: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
  }
  .tooltip-label {
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--dash-text);
    font-size: 13px;
    border-bottom: 1px solid var(--dash-border);
    padding-bottom: 4px;
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

  const { data, error, isLoading } = useSWR(
    user?.company_id ? \`/api/dashboard?companyId=\${user.company_id}\` : null, 
    fetcher,
    { refreshInterval: 15000 } // Poll every 15s for "near real-time" effect
  );

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
        <h1 className="dash-title">Good afternoon, {user?.employee_id || "User"}</h1>
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
          <h2 className="metric-value">${(MOCK_METRICS.pipelineVal / 1000).toFixed(0)}k</h2>
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
                    <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#1D9E75" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPipe" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3498DB" stopOpacity={0.5}/>
                    <stop offset="95%" stopColor="#3498DB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="var(--dash-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--dash-text-muted)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => \`$\${(val/1000)}k\`} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dash-border)" />
                <Tooltip content={<CustomTooltip />} />
                <Legend verticalAlign="top" height={36}/>
                <Area type="monotone" dataKey="wonSum" name="Closed Won ($)" stroke="#1D9E75" fillOpacity={1} fill="url(#colorWon)" activeDot={{ r: 6 }}/>
                <Area type="monotone" dataKey="pipelineSum" name="Pipeline Value ($)" stroke="#3498DB" fillOpacity={1} fill="url(#colorPipe)" />
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
                    <Cell key={\`cell-\${index}\`} fill={entry.fill} />
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
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--dash-border)" />
                <XAxis dataKey="name" stroke="var(--dash-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" orientation="left" stroke="var(--dash-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="var(--dash-text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--dash-border)', opacity: 0.4 }} />
                <Legend verticalAlign="top" height={36}/>
                <Bar yAxisId="left" dataKey="deals" name="Deals Assigned" fill="#9B59B6" radius={[4, 4, 0, 0]} animationDuration={1500} />
                <Bar yAxisId="right" dataKey="activities" name="Logged Activities" fill="#F39C12" radius={[4, 4, 0, 0]} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bento-card">
          <h3 className="card-title">Real-Time Activity</h3>
          <p className="card-subtitle">Tracking the pulse of your workspace.</p>
          <div className="feed-list">
            {ACTIVITIES.map((act: any) => (
              <div className="feed-item" key={act.id}>
                <div className="feed-icon" style={{ color: act.color, borderColor: \`\${act.color}40\`, background: \`\${act.color}10\` }}>
                  {act.type === 'call' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>}
                  {act.type === 'email' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>}
                  {act.type === 'stage_change' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                  {act.type === 'ticket' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>}
                  {act.type === 'note' && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>}
                </div>
                <div className="feed-content">
                  <div className="feed-header">
                    <span className="feed-subject">{act.subject}</span>
                    <span className="feed-time">{act.time}</span>
                  </div>
                  <div className="feed-desc">{act.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
