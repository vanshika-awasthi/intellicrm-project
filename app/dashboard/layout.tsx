"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/app/store/authStore";

const sidebarStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --dash-bg: #0B0D14;
    --dash-surface: #1E293B;
    --dash-surface-hover: #1F2937;
    --dash-border: rgba(255,255,255,0.06);
    --dash-text: #F1F5F9;
    --dash-text-muted: #94A3B8;
    --dash-accent: #6366F1;
    --dash-accent-light: rgba(99,102,241,0.12);
    --dash-gradient: linear-gradient(135deg, #6366F1, #A855F7, #EC4899);
    --sidebar-w: 260px;
    --header-h: 64px;
  }

  body {
    margin: 0;
    background: var(--dash-bg);
    color: var(--dash-text);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  /* Layout */
  .layout-root {
    display: flex;
    height: 100vh;
    overflow: hidden;
  }

  /* Sidebar */
  .sidebar {
    width: var(--sidebar-w);
    background: #06080D; /* Sleek deep darker background */
    border-right: 1px solid var(--dash-border);
    display: flex;
    flex-direction: column;
    z-index: 50;
    position: relative;
  }

  .sidebar-header {
    height: var(--header-h);
    display: flex;
    align-items: center;
    padding: 0 1.5rem;
    border-bottom: 1px solid var(--dash-border);
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 700;
    font-size: 17px;
    color: var(--dash-text);
    text-decoration: none;
    letter-spacing: -0.02em;
  }

  .brand-icon {
    width: 32px; height: 32px;
    background: linear-gradient(135deg, #2563EB, #60A5FA);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
  }

  .nav-group {
    padding: 1.5rem 0.75rem;
    flex: 1;
    overflow-y: auto;
  }

  /* Scrollbar */
  .nav-group::-webkit-scrollbar { width: 4px; }
  .nav-group::-webkit-scrollbar-track { background: transparent; }
  .nav-group::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

  .nav-label {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748B;
    font-weight: 600;
    margin-bottom: 10px;
    padding-left: 12px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 10px;
    color: var(--dash-text-muted);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    margin-bottom: 2px;
    position: relative;
  }

  .nav-item:hover {
    background: var(--dash-surface-hover);
    color: var(--dash-text);
    transform: translateX(2px);
  }

  .nav-item.active {
    background: #000000;
    color: #FFFFFF;
    font-weight: 600;
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.05);
  }

  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 3px;
    height: 20px;
    background: #FFFFFF;
    border-radius: 0 4px 4px 0;
  }

  .nav-item svg {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  /* User Profile Bottom */
  .sidebar-footer {
    padding: 0.75rem;
    border-top: 1px solid var(--dash-border);
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.25s;
  }

  .user-card:hover {
    background: var(--dash-surface-hover);
  }

  .user-avatar {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: var(--dash-gradient);
    display: flex; align-items: center; justify-content: center;
    color: #fff;
    font-size: 13px;
    font-weight: 700;
    position: relative;
    box-shadow: 0 2px 10px rgba(99,102,241,0.2);
  }

  .user-avatar::after {
    content: '';
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 10px;
    height: 10px;
    background: #22C55E;
    border-radius: 50%;
    border: 2px solid var(--dash-surface);
    box-shadow: 0 0 6px rgba(34,197,94,0.4);
  }

  .user-info {
    flex: 1;
    overflow: hidden;
  }

  .user-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--dash-text);
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .user-role {
    font-size: 11px;
    color: var(--dash-text-muted);
    text-transform: capitalize;
  }

  /* Main Content Area */
  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    background: var(--dash-bg);
  }

  /* Topnav */
  .topnav {
    height: var(--header-h);
    background: rgba(11, 13, 20, 0.8);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--dash-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .search-wrap {
    position: relative;
    width: 400px;
  }

  .search-input {
    width: 100%;
    padding: 10px 18px 10px 40px;
    border-radius: 12px;
    border: 1px solid var(--dash-border);
    background: var(--dash-surface);
    color: var(--dash-text);
    font-size: 13px;
    outline: none;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    font-family: inherit;
  }

  .search-input::placeholder {
    color: #475569;
  }

  .search-input:focus {
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1), 0 4px 20px rgba(99,102,241,0.08);
    background: rgba(17,24,39,0.9);
  }

  .search-icon {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: #475569;
  }

  .notif-btn {
    background: none;
    border: none;
    color: var(--dash-text-muted);
    cursor: pointer;
    position: relative;
    padding: 8px;
    border-radius: 10px;
    transition: all 0.2s;
  }

  .notif-btn:hover {
    background: var(--dash-surface-hover);
    color: var(--dash-text);
  }

  .notif-dot {
    position: absolute;
    top: 6px;
    right: 6px;
    width: 8px;
    height: 8px;
    background: #EF4444;
    border-radius: 50%;
    border: 2px solid var(--dash-bg);
    box-shadow: 0 0 8px rgba(239,68,68,0.4);
  }

  .content-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
  }

  .content-scroll::-webkit-scrollbar { width: 6px; }
  .content-scroll::-webkit-scrollbar-track { background: transparent; }
  .content-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 10px; }
`;

const MENU_SECTIONS = [
  {
    label: "MAIN MENU",
    links: [
      { name: "Overview", href: "/dashboard", icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path> },
      { name: "VARKS Analyst", href: "/dashboard/ai-review", icon: <><path d="M12 2a10 10 0 1 0 10 10H12V2z"></path><path d="M12 6v6l4 2"></path></> },
      { name: "Contacts", href: "/dashboard/contacts", icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></> },
      { name: "Opportunities", href: "/dashboard/opportunities", icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path> },
      { name: "Tickets", href: "/dashboard/tickets", icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></> },
    ]
  },
  {
    label: "MANAGEMENT",
    links: [
      { name: "Onboard Lead", href: "/dashboard/onboarding", icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="11" x2="20" y2="17"></line><line x1="17" y1="14" x2="23" y2="14"></line></> },
      { name: "Automations", href: "/dashboard/workflows", icon: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></> },
      { name: "Add Team Member", href: "/dashboard/users/new", icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></> },
    ]
  }
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, clearAuth } = useAuthStore();

  // Basic route protection
  useEffect(() => {
    if (!user) {
      router.push("/auth/login");
    }
  }, [user, router]);

  if (!user) return null;

  const handleLogout = () => {
    clearAuth();
    router.push("/auth/login");
  };

  return (
    <>
      <style>{sidebarStyles}</style>
      <div className="layout-root">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <Link href="/dashboard" className="brand">
              <div className="brand-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                </svg>
              </div>
              IntelliCRM
            </Link>
          </div>

          <nav className="nav-group">
            {MENU_SECTIONS.map((section) => (
              <div key={section.label} style={{ marginBottom: '1.5rem' }}>
                <div className="nav-label">{section.label}</div>
                {section.links.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`nav-item ${pathname === link.href ? "active" : ""}`}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {link.icon}
                    </svg>
                    {link.name}
                  </Link>
                ))}
              </div>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="user-card" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', fontFamily: 'inherit' }}>
              <div className="user-avatar">
                {user.employee_id.substring(0, 2).toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">{user.employee_id}</div>
                <div className="user-role">{user.role}</div>
              </div>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--dash-text-muted)" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <div className="main-area">
          <header className="topnav">
            <div className="search-wrap">
              <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" className="search-input" placeholder="Search contacts, deals, tickets..." />
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button className="notif-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span className="notif-dot"></span>
              </button>
            </div>
          </header>

          <main className="content-scroll">
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
