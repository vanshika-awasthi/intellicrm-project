/**
 * LoginPage.jsx
 * Multi-tenant CRM — Login Page
 *
 * Features:
 *  - Company ID + Employee ID + Password fields
 *  - Zod-style inline validation (no external dep)
 *  - Mock CAPTCHA (swap in hCaptcha / reCAPTCHA token)
 *  - JWT stored in memory (access) + httpOnly cookie (refresh via server)
 *  - Zustand authStore integration
 *  - Staggered entrance animation via CSS keyframes
 *  - Password visibility toggle
 *  - Accessible: aria-labels, role="alert" on errors
 *  - Dark-mode aware via CSS custom properties
 */
"use client"
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginUser } from "../auth.service";
import { useAuthStore } from "@/app/store/authStore";

   
const RULES = {
  company_id: [
    { test: (v) => v.trim().length > 0,   msg: "Company ID is required" },
    { test: (v) => /^[a-z0-9-]+$/.test(v.trim()), msg: "Use lowercase letters, numbers, and hyphens only" },
  ],
  employee_id: [
    { test: (v) => v.trim().length > 0, msg: "Employee ID is required" },
    { test: (v) => v.trim().length >= 2, msg: "Employee ID must be at least 2 characters" },
  ],
  password: [
    { test: (v) => v.length > 0,  msg: "Password is required" },
    { test: (v) => v.length >= 8, msg: "Password must be at least 8 characters" },
  ],
};

function validate(fields) {
  const errors = {};
  for (const [key, rules] of Object.entries(RULES)) {
    for (const rule of rules) {
      if (!rule.test(fields[key] ?? "")) {
        errors[key] = rule.msg;
        break;
      }
    }
  }
  return errors;
}

/* ─── Mock CAPTCHA hook (replace with hCaptcha / reCAPTCHA widget) ────────── */

function useMockCaptcha() {
  const [verified, setVerified]   = useState(false);
  const [checking, setChecking]   = useState(false);

  const verify = () => {
    if (verified) return;
    setChecking(true);
    setTimeout(() => {
      setChecking(false);
      setVerified(true);
    }, 900);
  };

  return { verified, checking, verify };
}

/* ─── Inline CSS (avoids Tailwind / CSS Module dependency) ───────────────── */

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg:          #F7F5F0;
    --surface:     #FFFFFF;
    --border:      rgba(0,0,0,0.10);
    --border-focus:#1D9E75;
    --text-primary:#1A1A1A;
    --text-muted:  #6B6B6B;
    --text-hint:   #9E9E9E;
    --accent:      #1D9E75;
    --accent-dark: #157A5A;
    --accent-light:#E1F5EE;
    --error:       #C0392B;
    --error-bg:    #FDEDEC;
    --font-display:'DM Serif Display', Georgia, serif;
    --font-body:   'DM Sans', system-ui, sans-serif;
    --radius-sm:   6px;
    --radius-md:   10px;
    --radius-lg:   16px;
    --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.06);
  }

  @media (prefers-color-scheme: dark) {
    :root {
      --bg:          #111410;
      --surface:     #1C1F1A;
      --border:      rgba(255,255,255,0.10);
      --border-focus:#1D9E75;
      --text-primary:#F0EFE9;
      --text-muted:  #9B9B9B;
      --text-hint:   #666;
      --accent-light:#0F3D2E;
      --error-bg:    #2D1515;
      --shadow-card: 0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.3);
    }
  }

  @keyframes fadeUp {
    from { opacity:0; transform:translateY(18px); }
    to   { opacity:1; transform:translateY(0); }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @keyframes checkPop {
    0%   { transform:scale(0) rotate(-10deg); opacity:0; }
    60%  { transform:scale(1.2) rotate(4deg); }
    100% { transform:scale(1) rotate(0deg); opacity:1; }
  }

  .lp-root {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    font-family: var(--font-body);
    color: var(--text-primary);
  }

  /* Left accent panel — decorative */
  .lp-panel {
    width: 420px;
    flex-shrink: 0;
    background: #0D2B1F;
    padding: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    animation: fadeUp 0.6s ease both;
  }
  @media (max-width: 860px) { .lp-panel { display: none; } }

  .lp-panel-grid {
    position: absolute; inset: 0;
    background-image:
      linear-gradient(rgba(29,158,117,0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(29,158,117,0.08) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .lp-panel-orb {
    position: absolute;
    width: 340px; height: 340px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(29,158,117,0.25) 0%, transparent 70%);
    top: -80px; right: -80px;
    pointer-events: none;
  }

  .lp-panel-logo {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    color: #fff;
  }
  .lp-panel-logo-mark {
    width: 36px; height: 36px;
    border-radius: 9px;
    background: #1D9E75;
    display: flex; align-items: center; justify-content: center;
  }
  .lp-panel-logo-mark svg { width: 18px; height: 18px; }
  .lp-panel-logo-name { font-size: 16px; font-weight: 500; letter-spacing: -0.02em; }

  .lp-panel-copy { position: relative; }
  .lp-panel-headline {
    font-family: var(--font-display);
    font-size: 2.4rem;
    line-height: 1.18;
    color: #FFFFFF;
    margin-bottom: 1rem;
    font-style: italic;
  }
  .lp-panel-sub { font-size: 14px; color: rgba(255,255,255,0.5); line-height: 1.6; }

  .lp-panel-stats {
    position: relative;
    display: flex;
    gap: 1.5rem;
  }
  .lp-panel-stat-val {
    font-size: 22px;
    font-weight: 500;
    color: #fff;
    display: block;
  }
  .lp-panel-stat-label { font-size: 12px; color: rgba(255,255,255,0.4); }

  /* Right form column */
  .lp-form-col {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .lp-card {
    width: 100%;
    max-width: 420px;
    background: var(--surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    padding: 2.5rem;
    box-shadow: var(--shadow-card);
    animation: fadeUp 0.55s ease both;
  }

  .lp-card-header { margin-bottom: 2rem; }
  .lp-card-eyebrow {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 0.5rem;
  }
  .lp-card-title {
    font-family: var(--font-display);
    font-size: 1.9rem;
    line-height: 1.2;
    color: var(--text-primary);
    margin-bottom: 0.35rem;
  }
  .lp-card-sub { font-size: 14px; color: var(--text-muted); }

  /* Global error banner */
  .lp-error-banner {
    background: var(--error-bg);
    border: 1px solid rgba(192,57,43,0.2);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    font-size: 13px;
    color: var(--error);
    margin-bottom: 1.25rem;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: fadeUp 0.2s ease both;
  }
  .lp-error-banner svg { width:15px; height:15px; flex-shrink:0; }

  /* Form field */
  .lp-field { margin-bottom: 1.1rem; }
  .lp-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 12px;
    font-weight: 500;
    color: var(--text-muted);
    margin-bottom: 6px;
    letter-spacing: 0.01em;
  }
  .lp-input-wrap { position: relative; }
  .lp-input {
    width: 100%;
    padding: 10px 14px;
    font-size: 14px;
    font-family: var(--font-body);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    background: var(--bg);
    color: var(--text-primary);
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }
  .lp-input::placeholder { color: var(--text-hint); }
  .lp-input:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(29,158,117,0.12);
  }
  .lp-input.error {
    border-color: var(--error);
    box-shadow: 0 0 0 3px rgba(192,57,43,0.10);
  }
  .lp-input.has-right { padding-right: 44px; }
  .lp-input-right {
    position: absolute;
    right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--text-hint);
    display: flex; align-items: center; justify-content: center;
    padding: 2px;
  }
  .lp-input-right svg { width: 17px; height: 17px; }
  .lp-field-error {
    font-size: 12px;
    color: var(--error);
    margin-top: 5px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  /* CAPTCHA */
  .lp-captcha {
    display: flex;
    align-items: center;
    gap: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 11px 14px;
    margin-bottom: 1.25rem;
    cursor: pointer;
    user-select: none;
    transition: border-color 0.15s;
    background: var(--bg);
  }
  .lp-captcha:hover { border-color: rgba(0,0,0,0.18); }
  .lp-captcha.verified { border-color: var(--accent); }
  .lp-captcha.captcha-error { border-color: var(--error); }

  .lp-captcha-box {
    width: 20px; height: 20px;
    border: 1.5px solid var(--border);
    border-radius: 4px;
    flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: var(--surface);
    transition: border-color 0.15s, background 0.15s;
    position: relative;
    overflow: hidden;
  }
  .lp-captcha.verified .lp-captcha-box {
    background: var(--accent);
    border-color: var(--accent);
  }
  .lp-captcha-check {
    animation: checkPop 0.3s ease both;
  }
  .lp-captcha-spinner {
    width: 12px; height: 12px;
    border: 2px solid rgba(0,0,0,0.12);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  .lp-captcha-label { font-size: 13px; color: var(--text-primary); flex: 1; }
  .lp-captcha-brand { font-size: 10px; color: var(--text-hint); text-align: right; line-height: 1.3; }

  /* Submit button */
  .lp-btn {
    width: 100%;
    padding: 11px;
    font-size: 14px;
    font-weight: 500;
    font-family: var(--font-body);
    border: none;
    border-radius: var(--radius-md);
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    transition: background 0.15s, transform 0.1s, opacity 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .lp-btn:hover:not(:disabled) { background: var(--accent-dark); }
  .lp-btn:active:not(:disabled) { transform: scale(0.99); }
  .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .lp-btn-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .lp-footer {
    text-align: center;
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 1.25rem;
  }
  .lp-footer a {
    color: var(--accent);
    text-decoration: none;
    font-weight: 500;
  }
  .lp-footer a:hover { text-decoration: underline; }

  .lp-divider {
    display: flex; align-items: center; gap: 10px;
    margin: 1.25rem 0;
    font-size: 12px; color: var(--text-hint);
  }
  .lp-divider::before, .lp-divider::after {
    content: ''; flex: 1;
    height: 1px; background: var(--border);
  }

  .lp-tenant-hint {
    background: var(--accent-light);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    font-size: 12px;
    color: #085041;
    margin-bottom: 1.25rem;
    display: flex; gap: 6px; align-items: center;
  }
`;

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <div className="lp-field-error" role="alert">
      <svg viewBox="0 0 16 16" fill="currentColor" width="12" height="12">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.5h1.5v4.25h-1.5V4.5zm0 5.5h1.5v1.5h-1.5V10z"/>
      </svg>
      {msg}
    </div>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

function Captcha({ verified, checking, onVerify, hasError }) {
  return (
    <div
      className={`lp-captcha${verified ? " verified" : ""}${hasError ? " captcha-error" : ""}`}
      onClick={onVerify}
      role="checkbox"
      aria-checked={verified}
      tabIndex={0}
      onKeyDown={(e) => e.key === " " && onVerify()}
    >
      <div className="lp-captcha-box">
        {checking && <div className="lp-captcha-spinner" />}
        {verified && !checking && (
          <svg className="lp-captcha-check" width="12" height="12" viewBox="0 0 12 12">
            <polyline points="2,6 5,9 10,3" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <span className="lp-captcha-label">
        {checking ? "Verifying…" : verified ? "Verified" : "I'm not a robot"}
      </span>
      <span className="lp-captcha-brand">hCaptcha<br/>Privacy · Terms</span>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function LoginPage() {
  const router = useRouter();
  const setAuth  = useAuthStore((s) => s.setAuth);

  const [fields, setFields] = useState({ company_id: "", employee_id: "", password: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [touched, setTouched]   = useState({});
  const [captchaError, setCaptchaError] = useState(false);
  const { verified: captchaVerified, checking: captchaChecking, verify: verifyCaptcha } = useMockCaptcha();

  const firstInputRef = useRef(null);
  useEffect(() => { firstInputRef.current?.focus(); }, []);

  /* Live validation on blur */
  const handleBlur = (key) => {
    setTouched((p) => ({ ...p, [key]: true }));
    const errs = validate(fields);
    setErrors((p) => ({ ...p, [key]: errs[key] }));
  };

  const handleChange = (key, val) => {
    setFields((p) => ({ ...p, [key]: val }));
    if (touched[key]) {
      const errs = validate({ ...fields, [key]: val });
      setErrors((p) => ({ ...p, [key]: errs[key] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError("");

    /* Validate all fields */
    const errs = validate(fields);
    setErrors(errs);
    setTouched({ company_id: true, employee_id: true, password: true });

    if (Object.keys(errs).length > 0) return;

    /* CAPTCHA gate */
    if (!captchaVerified) {
      setCaptchaError(true);
      return;
    }
    setCaptchaError(false);

    setLoading(true);
    try {
      const data = await loginUser({
        company_id:  fields.company_id.trim().toLowerCase(),
        employee_id: fields.employee_id.trim(),
        password:    fields.password,
        /* In production: pass the real hCaptcha / reCAPTCHA token here */
        captcha_token: "mock-token",
      });

      /*
       * access_token  → stored in memory via Zustand (never localStorage)
       * refresh_token → httpOnly cookie set by the server (withCredentials:true)
       */
      setAuth({
        accessToken: data.access_token,
        user: {
          id:          data.user.id,
          company_id:  data.user.company_id,
          employee_id: data.user.employee_id,
          role:        data.user.role,
        },
      });

      router.push("/dashboard");
    } catch (err) {
      const error = err as Error;
      const msg = error.message ?? "Something went wrong. Please try again.";
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="lp-root">
        {/* ── Left decorative panel ── */}
        <aside className="lp-panel" aria-hidden="true">
          <div className="lp-panel-grid" />
          <div className="lp-panel-orb" />

          <div className="lp-panel-logo">
            <div className="lp-panel-logo-mark">
              <svg viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.6">
                <path d="M9 2L2 6v6l7 4 7-4V6z"/>
                <path d="M2 6l7 4 7-4M9 10v6"/>
              </svg>
            </div>
            <span className="lp-panel-logo-name">NexusCRM</span>
          </div>

          <div className="lp-panel-copy">
            <h2 className="lp-panel-headline">
              Every deal,<br />every relationship,<br />in one place.
            </h2>
            <p className="lp-panel-sub">
              Multi-tenant CRM built for teams who move fast and close faster.
            </p>
          </div>

          <div className="lp-panel-stats">
            <div>
              <span className="lp-panel-stat-val">12k+</span>
              <span className="lp-panel-stat-label">Active users</span>
            </div>
            <div>
              <span className="lp-panel-stat-val">98%</span>
              <span className="lp-panel-stat-label">Uptime SLA</span>
            </div>
            <div>
              <span className="lp-panel-stat-val">SOC 2</span>
              <span className="lp-panel-stat-label">Certified</span>
            </div>
          </div>
        </aside>

        {/* ── Right form column ── */}
        <main className="lp-form-col">
          <div className="lp-card">
            <header className="lp-card-header">
              <p className="lp-card-eyebrow">Welcome back</p>
              <h1 className="lp-card-title">Sign in</h1>
              <p className="lp-card-sub">Enter your workspace credentials to continue.</p>
            </header>

            {/* Global error */}
            {globalError && (
              <div className="lp-error-banner" role="alert">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.5h1.5v4.25h-1.5V4.5zm0 5.5h1.5v1.5h-1.5V10z"/>
                </svg>
                {globalError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Company ID */}
              <div className="lp-field">
                <label className="lp-label" htmlFor="company_id">
                  Company ID
                  <span style={{ color: "var(--text-hint)", fontWeight: 400 }}>e.g. acme-corp</span>
                </label>
                <div className="lp-input-wrap">
                  <input
                    id="company_id"
                    ref={firstInputRef}
                    className={`lp-input${errors.company_id && touched.company_id ? " error" : ""}`}
                    type="text"
                    autoComplete="organization"
                    value={fields.company_id}
                    onChange={(e) => handleChange("company_id", e.target.value)}
                    onBlur={() => handleBlur("company_id")}
                    placeholder="your-company"
                    aria-describedby="company_id-error"
                    aria-invalid={!!errors.company_id}
                  />
                </div>
                <FieldError msg={touched.company_id && errors.company_id} />
              </div>

              {/* Employee ID */}
              <div className="lp-field">
                <label className="lp-label" htmlFor="employee_id">Employee ID</label>
                <div className="lp-input-wrap">
                  <input
                    id="employee_id"
                    className={`lp-input${errors.employee_id && touched.employee_id ? " error" : ""}`}
                    type="text"
                    autoComplete="username"
                    value={fields.employee_id}
                    onChange={(e) => handleChange("employee_id", e.target.value)}
                    onBlur={() => handleBlur("employee_id")}
                    placeholder="EMP001"
                    aria-invalid={!!errors.employee_id}
                  />
                </div>
                <FieldError msg={touched.employee_id && errors.employee_id} />
              </div>

              {/* Password */}
              <div className="lp-field">
                <label className="lp-label" htmlFor="password">
                  Password
                  <Link
                    href="/forgot-password"
                    style={{ color: "var(--accent)", textDecoration: "none", fontWeight: 400 }}
                  >
                    Forgot?
                  </Link>
                </label>
                <div className="lp-input-wrap">
                  <input
                    id="password"
                    className={`lp-input has-right${errors.password && touched.password ? " error" : ""}`}
                    type={showPwd ? "text" : "password"}
                    autoComplete="current-password"
                    value={fields.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={() => handleBlur("password")}
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    className="lp-input-right"
                    onClick={() => setShowPwd((p) => !p)}
                    aria-label={showPwd ? "Hide password" : "Show password"}
                  >
                    <EyeIcon open={showPwd} />
                  </button>
                </div>
                <FieldError msg={touched.password && errors.password} />
              </div>

              {/* CAPTCHA */}
              <Captcha
                verified={captchaVerified}
                checking={captchaChecking}
                onVerify={verifyCaptcha}
                hasError={captchaError}
              />
              {captchaError && !captchaVerified && (
                <div className="lp-field-error" role="alert" style={{ marginTop: -8, marginBottom: 12 }}>
                  Please complete the CAPTCHA
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="lp-btn"
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? <span className="lp-btn-spinner" /> : null}
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <div className="lp-divider">or</div>

            <p className="lp-footer">
              Don&apos;t have an account?{" "}
              <Link href="/auth/signup">Create workspace</Link>
            </p>
          </div>
        </main>
      </div>
    </>
  );
}

/*
 * INTEGRATION NOTES
 * ─────────────────
 * 1. axiosClient (src/api/axiosClient.js):
 *      import axios from 'axios';
 *      const api = axios.create({
 *        baseURL: import.meta.env.VITE_API_URL,
 *        withCredentials: true,   // sends httpOnly refresh cookie
 *      });
 *      // Attach access token from Zustand on every request:
 *      api.interceptors.request.use(cfg => {
 *        const token = useAuthStore.getState().accessToken;
 *        if (token) cfg.headers.Authorization = `Bearer ${token}`;
 *        return cfg;
 *      });
 *      export default api;
 *
 * 2. authStore (src/store/authStore.js):
 *      import { create } from 'zustand';
 *      export const useAuthStore = create(set => ({
 *        accessToken: null,
 *        user: null,
 *        setAuth: ({ accessToken, user }) => set({ accessToken, user }),
 *        clearAuth: () => set({ accessToken: null, user: null }),
 *      }));
 *
 * 3. Router (src/routes/ProtectedRoute.jsx):
 *      import { Navigate } from 'react-router-dom';
 *      import { useAuthStore } from '../store/authStore';
 *      export function ProtectedRoute({ children }) {
 *        const token = useAuthStore(s => s.accessToken);
 *        return token ? children : <Navigate to="/login" replace />;
 *      }
 *
 * 4. hCaptcha integration:
 *      npm install @hcaptcha/react-hcaptcha
 *      Replace the <Captcha> component with <HCaptcha sitekey="..." onVerify={setToken} />
 *      Pass the real token in the POST body as captcha_token.
 *
 * 5. Token refresh:
 *      Add a 401 response interceptor on axiosClient that calls POST /auth/refresh,
 *      updates the store with the new access token, then retries the failed request.
 */
