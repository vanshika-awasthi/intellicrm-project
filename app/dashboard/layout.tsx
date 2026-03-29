"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/app/store/authStore";

const sidebarStyles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  :root {
    --dash-bg: #F9F9F8;
    --dash-surface: #FFFFFF;
    --dash-surface-hover: #F2F2F0;
    --dash-border: rgba(0,0,0,0.08);
    --dash-text: #171717;
    --dash-text-muted: #666666;
    --dash-accent: #1D9E75;
    --dash-accent-light: #E1F5EE;
    --sidebar-w: 260px;
    --header-h: 64px;
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --dash-bg: #0C0D0C;
      --dash-surface: #141514;
      --dash-surface-hover: #1E1F1E;
      --dash-border: rgba(255,255,255,0.08);
      --dash-text: #EFEFEF;
      --dash-text-muted: #888888;
      --dash-accent-light: #0F3D2E;
    }
  }

  body {
    margin: 0;
    background: var(--dash-bg);
    color: var(--dash-text);
    font-family: 'DM Sans', sans-serif;
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
    background: var(--dash-surface);
    border-right: 1px solid var(--dash-border);
    display: flex;
    flex-direction: column;
    transition: transform 0.3s ease;
    z-index: 50;
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
    gap: 10px;
    font-weight: 600;
    font-size: 16px;
    color: var(--dash-text);
    text-decoration: none;
  }

  .brand-icon {
    width: 28px; height: 28px;
    background: var(--dash-accent);
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: #fff;
  }

  .nav-group {
    padding: 1.5rem 1rem;
    flex: 1;
    overflow-y: auto;
  }

  .nav-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--dash-text-muted);
    font-weight: 600;
    margin-bottom: 10px;
    padding-left: 10px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: 8px;
    color: var(--dash-text-muted);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: background 0.2s, color 0.2s;
    margin-bottom: 4px;
  }

  .nav-item:hover {
    background: var(--dash-surface-hover);
    color: var(--dash-text);
  }

  .nav-item.active {
    background: var(--dash-accent-light);
    color: var(--dash-accent);
  }

  .nav-item svg {
    width: 18px;
    height: 18px;
  }

  /* User Profile Bottom */
  .sidebar-footer {
    padding: 1rem;
    border-top: 1px solid var(--dash-border);
  }

  .user-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .user-card:hover {
    background: var(--dash-surface-hover);
  }

  .user-avatar {
    width: 32px; height: 32px;
    border-radius: 50%;
    background: var(--dash-text-muted);
    display: flex; align-items: center; justify-content: center;
    color: var(--dash-surface);
    font-size: 14px;
    font-weight: 600;
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
  }

  /* Topnav */
  .topnav {
    height: var(--header-h);
    background: var(--dash-surface);
    border-bottom: 1px solid var(--dash-border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 2rem;
    position: sticky;
    top: 0;
    z-index: 40;
    backdrop-filter: blur(12px);
    background: color-mix(in srgb, var(--dash-surface) 80%, transparent);
  }

  .search-wrap {
    position: relative;
    width: 300px;
  }

  .search-input {
    width: 100%;
    padding: 8px 16px 8px 36px;
    border-radius: 20px;
    border: 1px solid var(--dash-border);
    background: var(--dash-bg);
    color: var(--dash-text);
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    border-color: var(--dash-accent);
  }

  .search-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--dash-text-muted);
  }

  .content-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 2rem;
  }
`;

const NAV_LINKS = [
  { name: "Overview", href: "/dashboard", icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path> },
  { name: "Contacts", href: "/dashboard/contacts", icon: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path> },
  { name: "Opportunities", href: "/dashboard/opportunities", icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path> },
  { name: "Tickets", href: "/dashboard/tickets", icon: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path> },
  { name: "Activities", href: "/dashboard/activities", icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path> },
  { name: "Onboard Lead", href: "/dashboard/onboarding", icon: <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path> },
  { name: "Add Team Member", href: "/dashboard/users/new", icon: <><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="23" y1="11" x2="17" y2="11"></line></> },
  { name: "Automations", href: "/dashboard/workflows", icon: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></> }
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

  if (!user) return null; // Avoid hydration mismatch while redirecting

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
                <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <path d="M9 2L2 6v6l7 4 7-4V6z" />
                  <path d="M2 6l7 4 7-4M9 10v6" />
                </svg>
              </div>
              IntelliCRM
            </Link>
          </div>

          <nav className="nav-group">
            <div className="nav-label">Main Menu</div>
            {NAV_LINKS.map((link) => (
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
          </nav>

          <div className="sidebar-footer">
            <button className="user-card" onClick={handleLogout} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left' }}>
              <div className="user-avatar">
                {user.employee_id.substring(0, 2).toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">{user.id}</div>
                <div className="user-role">{user.role} | {user.company_id}</div>
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
              <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" className="search-input" placeholder="Search contacts, deals, tickets..." />
            </div>


            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button style={{ background: 'none', border: 'none', color: 'var(--dash-text-muted)', cursor: 'pointer' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
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
