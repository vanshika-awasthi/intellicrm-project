/**
 * SignupPage.jsx
 * Multi-tenant CRM — Workspace Signup Page
 *
 * Features:
 *  - 3-step form: Workspace → Your details → Security
 *  - Per-step validation before advancing
 *  - Company ID slug auto-generation from company name
 *  - Password strength meter (4-level)
 *  - Confirm password match validation
 *  - Mock CAPTCHA on final step
 *  - JWT stored in memory (access) + httpOnly cookie (refresh)
 *  - Zustand authStore integration
 *  - Animated step transitions
 *  - Fully accessible: aria-live, aria-invalid, role="alert"
 *  - Dark-mode aware via CSS custom properties
 */
"use client"
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signupUser } from "../auth.service";
import { useAuthStore } from "@/app/store/authStore";

/* ─── Slug helper ────────────────────────────────────────────────────────── */

function toSlug(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
}

/* ─── Password strength ──────────────────────────────────────────────────── */

function getStrength(pwd) {
  if (!pwd) return { level: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8)                       score++;
  if (pwd.length >= 12)                      score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd))                     score++;
  if (/[^A-Za-z0-9]/.test(pwd))             score++;
  if (score <= 1) return { level: 1, label: "Weak",   color: "#C0392B" };
  if (score <= 2) return { level: 2, label: "Fair",   color: "#E67E22" };
  if (score <= 3) return { level: 3, label: "Good",   color: "#2980B9" };
  return             { level: 4, label: "Strong", color: "#1D9E75" };
}



const STEP_RULES = [
  // Step 0: Workspace
  {
    company_name: [
      { test: (v) => v.trim().length > 0,   msg: "Company name is required" },
      { test: (v) => v.trim().length >= 2,  msg: "Must be at least 2 characters" },
    ],
    company_id: [
      { test: (v) => v.trim().length > 0,   msg: "Company ID is required" },
      { test: (v) => /^[a-z0-9-]+$/.test(v), msg: "Use lowercase letters, numbers, and hyphens" },
      { test: (v) => v.length >= 3,          msg: "Must be at least 3 characters" },
      { test: (v) => v.length <= 40,         msg: "Must be 40 characters or fewer" },
    ],
  },
  // Step 1: Your details
  {
    employee_id: [
      { test: (v) => v.trim().length > 0,  msg: "Employee ID is required" },
      { test: (v) => v.trim().length >= 2, msg: "Must be at least 2 characters" },
    ],
    full_name: [
      { test: (v) => v.trim().length > 0, msg: "Full name is required" },
    ],
    email: [
      { test: (v) => v.trim().length > 0, msg: "Email is required" },
      { test: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: "Enter a valid email address" },
    ],
  },
  // Step 2: Security
  {
    password: [
      { test: (v) => v.length > 0,   msg: "Password is required" },
      { test: (v) => v.length >= 8,  msg: "Must be at least 8 characters" },
      { test: (v) => /[A-Z]/.test(v), msg: "Include at least one uppercase letter" },
      { test: (v) => /[0-9]/.test(v), msg: "Include at least one number" },
    ],
    confirm_password: [
      { test: (v) => v.length > 0, msg: "Please confirm your password" },
    ],
  },
];

function validateStep(step, fields) {
  const rules = STEP_RULES[step];
  const errors = {};
  for (const [key, fieldRules] of Object.entries(rules)) {
    for (const rule of fieldRules) {
      if (!rule.test(fields[key] ?? "")) {
        errors[key] = rule.msg;
        break;
      }
    }
  }
  if (step === 2 && fields.password !== fields.confirm_password) {
    errors.confirm_password = "Passwords do not match";
  }
  return errors;
}

/* ─── Mock CAPTCHA hook ──────────────────────────────────────────────────── */

function useMockCaptcha() {
  const [verified, setVerified] = useState(false);
  const [checking, setChecking] = useState(false);
  const verify = () => {
    if (verified) return;
    setChecking(true);
    setTimeout(() => { setChecking(false); setVerified(true); }, 900);
  };
  return { verified, checking, verify };
}

/* ─── Inline CSS ─────────────────────────────────────────────────────────── */

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
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes checkPop {
    0%   { transform:scale(0) rotate(-10deg); opacity:0; }
    60%  { transform:scale(1.2) rotate(4deg); }
    100% { transform:scale(1) rotate(0deg); opacity:1; }
  }
  @keyframes slideIn {
    from { opacity:0; transform:translateX(24px); }
    to   { opacity:1; transform:translateX(0); }
  }

  .su-root {
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    font-family: var(--font-body);
    color: var(--text-primary);
  }

  /* Left panel */
  .su-panel {
    width: 380px;
    flex-shrink: 0;
    background: #0A1F16;
    padding: 3rem 2.5rem;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    animation: fadeUp 0.6s ease both;
  }
  @media (max-width: 860px) { .su-panel { display: none; } }

  .su-panel-dots {
    position: absolute; inset: 0;
    background-image: radial-gradient(rgba(29,158,117,0.18) 1px, transparent 1px);
    background-size: 28px 28px;
  }
  .su-panel-glow {
    position: absolute;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(29,158,117,0.2) 0%, transparent 70%);
    bottom: -60px; left: -60px;
    pointer-events: none;
  }

  .su-panel-logo {
    position: relative;
    display: flex; align-items: center; gap: 10px; color: #fff;
  }
  .su-logo-mark {
    width: 34px; height: 34px;
    border-radius: 9px; background: #1D9E75;
    display: flex; align-items: center; justify-content: center;
  }
  .su-logo-mark svg { width: 17px; height: 17px; }
  .su-logo-name { font-size: 15px; font-weight: 500; }

  .su-panel-headline {
    position: relative;
    font-family: var(--font-display);
    font-size: 2rem;
    line-height: 1.2;
    color: #fff;
    font-style: italic;
    margin-bottom: 1rem;
  }
  .su-panel-sub { font-size: 13px; color: rgba(255,255,255,0.45); line-height: 1.65; position: relative; }

  .su-steps-preview {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .su-step-preview {
    display: flex; align-items: center; gap: 12px;
  }
  .su-step-preview-num {
    width: 26px; height: 26px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 500; flex-shrink: 0;
    border: 1px solid rgba(255,255,255,0.15);
    color: rgba(255,255,255,0.5);
    transition: all 0.3s;
  }
  .su-step-preview-num.done {
    background: #1D9E75; border-color: #1D9E75; color: #fff;
  }
  .su-step-preview-num.active {
    background: rgba(29,158,117,0.2); border-color: #1D9E75; color: #1D9E75;
  }
  .su-step-preview-label { font-size: 13px; color: rgba(255,255,255,0.55); transition: color 0.3s; }
  .su-step-preview-label.active { color: #fff; font-weight: 500; }

  /* Right form */
  .su-form-col {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .su-card {
    width: 100%;
    max-width: 440px;
    background: var(--surface);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    padding: 2.5rem;
    box-shadow: var(--shadow-card);
    animation: fadeUp 0.55s ease both;
  }

  /* Step progress bar */
  .su-progress {
    display: flex; gap: 6px; margin-bottom: 2rem;
  }
  .su-progress-seg {
    flex: 1; height: 3px; border-radius: 2px;
    background: var(--border);
    transition: background 0.35s;
  }
  .su-progress-seg.done { background: var(--accent); }
  .su-progress-seg.active { background: var(--accent); opacity: 0.5; }

  .su-step-header { margin-bottom: 1.75rem; }
  .su-step-eyebrow {
    font-size: 11px; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--accent); margin-bottom: 0.4rem;
  }
  .su-step-title {
    font-family: var(--font-display);
    font-size: 1.75rem;
    line-height: 1.2;
    color: var(--text-primary);
    margin-bottom: 0.3rem;
  }
  .su-step-sub { font-size: 14px; color: var(--text-muted); }

  /* Step content animation */
  .su-step-content { animation: slideIn 0.28s ease both; }

  /* Field */
  .su-field { margin-bottom: 1.1rem; }
  .su-label {
    display: flex; align-items: center; justify-content: space-between;
    font-size: 12px; font-weight: 500; color: var(--text-muted);
    margin-bottom: 6px; letter-spacing: 0.01em;
  }
  .su-input-wrap { position: relative; }
  .su-input {
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
  .su-input::placeholder { color: var(--text-hint); }
  .su-input:focus {
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px rgba(29,158,117,0.12);
  }
  .su-input.error {
    border-color: var(--error);
    box-shadow: 0 0 0 3px rgba(192,57,43,0.10);
  }
  .su-input.has-right { padding-right: 44px; }
  .su-input-right {
    position: absolute; right: 12px; top: 50%;
    transform: translateY(-50%);
    background: none; border: none; cursor: pointer;
    color: var(--text-hint); display: flex; align-items: center;
  }
  .su-input-right svg { width: 17px; height: 17px; }
  .su-input-hint {
    font-size: 11px; color: var(--text-hint);
    margin-top: 4px; display: flex; align-items: center; gap: 4px;
  }
  .su-field-error {
    font-size: 12px; color: var(--error);
    margin-top: 5px; display: flex; align-items: center; gap: 4px;
  }
  .su-field-error svg { width: 12px; height: 12px; }

  /* Slug preview chip */
  .su-slug-chip {
    display: inline-flex; align-items: center; gap: 6px;
    background: var(--accent-light);
    border-radius: var(--radius-sm);
    padding: 5px 10px;
    font-size: 12px;
    color: #085041;
    margin-top: 6px;
    font-family: 'Courier New', monospace;
    letter-spacing: 0.02em;
  }

  /* Password strength meter */
  .su-strength { margin-top: 8px; }
  .su-strength-bars {
    display: flex; gap: 4px; margin-bottom: 4px;
  }
  .su-strength-bar {
    flex: 1; height: 3px; border-radius: 2px;
    background: var(--border);
    transition: background 0.25s;
  }
  .su-strength-label { font-size: 11px; color: var(--text-hint); }

  /* CAPTCHA */
  .su-captcha {
    display: flex; align-items: center; gap: 12px;
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    padding: 11px 14px;
    margin-bottom: 1.25rem;
    cursor: pointer; user-select: none;
    transition: border-color 0.15s;
    background: var(--bg);
  }
  .su-captcha:hover { border-color: rgba(0,0,0,0.18); }
  .su-captcha.verified { border-color: var(--accent); }
  .su-captcha.has-error { border-color: var(--error); }
  .su-captcha-box {
    width: 20px; height: 20px;
    border: 1.5px solid var(--border);
    border-radius: 4px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    background: var(--surface);
    transition: background 0.15s, border-color 0.15s;
  }
  .su-captcha.verified .su-captcha-box { background: var(--accent); border-color: var(--accent); }
  .su-captcha-spinner {
    width: 11px; height: 11px;
    border: 2px solid rgba(0,0,0,0.1);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }
  .su-captcha-label { font-size: 13px; color: var(--text-primary); flex: 1; }
  .su-captcha-brand { font-size: 10px; color: var(--text-hint); text-align: right; line-height: 1.3; }

  /* Terms */
  .su-terms {
    font-size: 12px; color: var(--text-muted);
    margin-bottom: 1.25rem; line-height: 1.5;
  }
  .su-terms a { color: var(--accent); text-decoration: none; }
  .su-terms a:hover { text-decoration: underline; }

  /* Buttons */
  .su-btn-row {
    display: flex; gap: 10px;
  }
  .su-btn {
    flex: 1; padding: 11px;
    font-size: 14px; font-weight: 500;
    font-family: var(--font-body);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.15s, transform 0.1s, opacity 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .su-btn:active:not(:disabled) { transform: scale(0.99); }
  .su-btn:disabled { opacity: 0.55; cursor: not-allowed; }

  .su-btn-secondary {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-muted);
    max-width: 90px;
  }
  .su-btn-secondary:hover:not(:disabled) { background: var(--bg); }

  .su-btn-primary {
    background: var(--accent);
    border: none;
    color: #fff;
  }
  .su-btn-primary:hover:not(:disabled) { background: var(--accent-dark); }

  .su-btn-spinner {
    width: 16px; height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
  }

  .su-footer {
    text-align: center; font-size: 13px;
    color: var(--text-muted); margin-top: 1.25rem;
  }
  .su-footer a { color: var(--accent); text-decoration: none; font-weight: 500; }
  .su-footer a:hover { text-decoration: underline; }

  /* Global error */
  .su-error-banner {
    background: var(--error-bg);
    border: 1px solid rgba(192,57,43,0.2);
    border-radius: var(--radius-sm);
    padding: 10px 14px; font-size: 13px; color: var(--error);
    margin-bottom: 1.25rem;
    display: flex; align-items: center; gap: 8px;
    animation: fadeUp 0.2s ease both;
  }
  .su-error-banner svg { width: 15px; height: 15px; flex-shrink: 0; }

  /* Success screen */
  .su-success {
    text-align: center; padding: 1rem 0;
    animation: fadeUp 0.4s ease both;
  }
  .su-success-icon {
    width: 56px; height: 56px;
    border-radius: 50%; background: var(--accent-light);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.25rem;
  }
  .su-success-icon svg { width: 26px; height: 26px; }
  .su-success-title {
    font-family: var(--font-display);
    font-size: 1.6rem; color: var(--text-primary);
    margin-bottom: 0.5rem;
  }
  .su-success-sub { font-size: 14px; color: var(--text-muted); }
`;

/* ─── Shared sub-components ──────────────────────────────────────────────── */

function FieldError({ msg }) {
  if (!msg) return null;
  return (
    <div className="su-field-error" role="alert">
      <svg viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.5h1.5v4.25h-1.5V4.5zm0 5.5h1.5v1.5h-1.5V10z"/>
      </svg>
      {msg}
    </div>
  );
}

function EyeToggle({ show, onToggle }) {
  return (
    <button type="button" className="su-input-right" onClick={onToggle}
      aria-label={show ? "Hide password" : "Show password"}>
      {show ? (
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
      )}
    </button>
  );
}

function StrengthMeter({ password }) {
  const { level, label, color } = getStrength(password);
  if (!password) return null;
  return (
    <div className="su-strength">
      <div className="su-strength-bars">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="su-strength-bar"
            style={{ background: i <= level ? color : undefined }}
          />
        ))}
      </div>
      <span className="su-strength-label" style={{ color }}>
        {label} password
      </span>
    </div>
  );
}

function CaptchaWidget({ verified, checking, onVerify, hasError }) {
  return (
    <div
      className={`su-captcha${verified ? " verified" : ""}${hasError ? " has-error" : ""}`}
      onClick={onVerify}
      role="checkbox"
      aria-checked={verified}
      tabIndex={0}
      onKeyDown={(e) => e.key === " " && onVerify()}
    >
      <div className="su-captcha-box">
        {checking && <div className="su-captcha-spinner" />}
        {verified && !checking && (
          <svg width="12" height="12" viewBox="0 0 12 12" style={{ animation: "checkPop 0.3s ease both" }}>
            <polyline points="2,6 5,9 10,3" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <span className="su-captcha-label">
        {checking ? "Verifying…" : verified ? "Verified" : "I'm not a robot"}
      </span>
      <span className="su-captcha-brand">hCaptcha<br/>Privacy · Terms</span>
    </div>
  );
}

/* ─── Step components ────────────────────────────────────────────────────── */

function StepWorkspace({ fields, errors, touched, onChange, onBlur }) {
  const slugRef = useRef(false);

  const handleNameChange = (val) => {
    onChange("company_name", val);
    if (!slugRef.current) {
      onChange("company_id", toSlug(val));
    }
  };

  const handleSlugChange = (val) => {
    slugRef.current = true; // user manually edited — stop auto-sync
    onChange("company_id", toSlug(val));
  };

  return (
    <div className="su-step-content">
      <div className="su-field">
        <label className="su-label" htmlFor="company_name">Company name</label>
        <input
          id="company_name"
          className={`su-input${errors.company_name && touched.company_name ? " error" : ""}`}
          type="text"
          autoComplete="organization"
          value={fields.company_name}
          onChange={(e) => handleNameChange(e.target.value)}
          onBlur={() => onBlur("company_name")}
          placeholder="Acme Corporation"
          autoFocus
        />
        <FieldError msg={touched.company_name && errors.company_name} />
      </div>

      <div className="su-field">
        <label className="su-label" htmlFor="company_id">
          Company ID
          <span style={{ color: "var(--text-hint)", fontWeight: 400 }}>Your workspace URL slug</span>
        </label>
        <input
          id="company_id"
          className={`su-input${errors.company_id && touched.company_id ? " error" : ""}`}
          type="text"
          value={fields.company_id}
          onChange={(e) => handleSlugChange(e.target.value)}
          onBlur={() => onBlur("company_id")}
          placeholder="acme-corporation"
        />
        {fields.company_id && !errors.company_id && (
          <div className="su-slug-chip">
            app.nexuscrm.io / {fields.company_id}
          </div>
        )}
        <FieldError msg={touched.company_id && errors.company_id} />
        <div className="su-input-hint">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.5h1.5v4.25h-1.5V4.5zm0 5.5h1.5v1.5h-1.5V10z"/>
          </svg>
          Lowercase letters, numbers, hyphens. Cannot be changed later.
        </div>
      </div>
    </div>
  );
}

function StepDetails({ fields, errors, touched, onChange, onBlur }) {
  return (
    <div className="su-step-content">
      <div className="su-field">
        <label className="su-label" htmlFor="full_name">Full name</label>
        <input
          id="full_name"
          className={`su-input${errors.full_name && touched.full_name ? " error" : ""}`}
          type="text"
          autoComplete="name"
          value={fields.full_name}
          onChange={(e) => onChange("full_name", e.target.value)}
          onBlur={() => onBlur("full_name")}
          placeholder="Alex Kim"
          autoFocus
        />
        <FieldError msg={touched.full_name && errors.full_name} />
      </div>

      <div className="su-field">
        <label className="su-label" htmlFor="email">Work email</label>
        <input
          id="email"
          className={`su-input${errors.email && touched.email ? " error" : ""}`}
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={(e) => onChange("email", e.target.value)}
          onBlur={() => onBlur("email")}
          placeholder="alex@acme.com"
        />
        <FieldError msg={touched.email && errors.email} />
      </div>

      <div className="su-field">
        <label className="su-label" htmlFor="employee_id">
          Employee ID
          <span style={{ color: "var(--text-hint)", fontWeight: 400 }}>Used to log in</span>
        </label>
        <input
          id="employee_id"
          className={`su-input${errors.employee_id && touched.employee_id ? " error" : ""}`}
          type="text"
          value={fields.employee_id}
          onChange={(e) => onChange("employee_id", e.target.value)}
          onBlur={() => onBlur("employee_id")}
          placeholder="EMP001"
        />
        <FieldError msg={touched.employee_id && errors.employee_id} />
      </div>
    </div>
  );
}

function StepSecurity({ fields, errors, touched, onChange, onBlur,
  showPwd, setShowPwd, showConfirm, setShowConfirm,
  captchaVerified, captchaChecking, verifyCaptcha, captchaError }) {
  return (
    <div className="su-step-content">
      <div className="su-field">
        <label className="su-label" htmlFor="password">Password</label>
        <div className="su-input-wrap">
          <input
            id="password"
            className={`su-input has-right${errors.password && touched.password ? " error" : ""}`}
            type={showPwd ? "text" : "password"}
            autoComplete="new-password"
            value={fields.password}
            onChange={(e) => onChange("password", e.target.value)}
            onBlur={() => onBlur("password")}
            placeholder="Create a strong password"
            autoFocus
          />
          <EyeToggle show={showPwd} onToggle={() => setShowPwd((p) => !p)} />
        </div>
        <StrengthMeter password={fields.password} />
        <FieldError msg={touched.password && errors.password} />
      </div>

      <div className="su-field">
        <label className="su-label" htmlFor="confirm_password">Confirm password</label>
        <div className="su-input-wrap">
          <input
            id="confirm_password"
            className={`su-input has-right${errors.confirm_password && touched.confirm_password ? " error" : ""}`}
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            value={fields.confirm_password}
            onChange={(e) => onChange("confirm_password", e.target.value)}
            onBlur={() => onBlur("confirm_password")}
            placeholder="Repeat password"
          />
          <EyeToggle show={showConfirm} onToggle={() => setShowConfirm((p) => !p)} />
        </div>
        <FieldError msg={touched.confirm_password && errors.confirm_password} />
      </div>

      <CaptchaWidget
        verified={captchaVerified}
        checking={captchaChecking}
        onVerify={verifyCaptcha}
        hasError={captchaError}
      />
      {captchaError && !captchaVerified && (
        <div className="su-field-error" role="alert" style={{ marginTop: -8, marginBottom: 12 }}>
          Please complete the CAPTCHA
        </div>
      )}

      <p className="su-terms">
        By creating an account you agree to our{" "}
        <a href="/terms">Terms of Service</a> and{" "}
        <a href="/privacy">Privacy Policy</a>. Your data is encrypted at rest
        and in transit in accordance with GDPR.
      </p>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

const STEP_META = [
  { eyebrow: "Step 1 of 3", title: "Your workspace", sub: "Set up your company's CRM workspace.", preview: "Workspace setup" },
  { eyebrow: "Step 2 of 3", title: "Your details",   sub: "Tell us about the admin account.",    preview: "Admin account"   },
  { eyebrow: "Step 3 of 3", title: "Security",        sub: "Create a strong password to protect your account.", preview: "Security"  },
];

export default function SignupPage() {
  const router = useRouter();
  const setAuth  = useAuthStore((s) => s.setAuth);

  const [step, setStep]     = useState(0);
  const [done, setDone]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const [fields, setFields] = useState({
    company_name: "",
    company_id:   "",
    full_name:    "",
    email:        "",
    employee_id:  "",
    password:     "",
    confirm_password: "",
  });
  const [errors,  setErrors]  = useState({});
  const [touched, setTouched] = useState({});
  const [showPwd, setShowPwd]           = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [captchaError, setCaptchaError] = useState(false);
  const { verified: captchaVerified, checking: captchaChecking, verify: verifyCaptcha } =
    useMockCaptcha();

  const onChange = useCallback((key, val) => {
    setFields((p) => ({ ...p, [key]: val }));
    if (touched[key]) {
      const errs = validateStep(step, { ...fields, [key]: val });
      setErrors((p) => ({ ...p, [key]: errs[key] }));
    }
  }, [fields, touched, step]);

  const onBlur = useCallback((key) => {
    setTouched((p) => ({ ...p, [key]: true }));
    const errs = validateStep(step, fields);
    setErrors((p) => ({ ...p, [key]: errs[key] }));
  }, [fields, step]);

  const advanceStep = () => {
    const errs = validateStep(step, fields);
    const stepKeys = Object.keys(STEP_RULES[step]);
    const newTouched = stepKeys.reduce((a, k) => ({ ...a, [k]: true }), {});
    setTouched((p) => ({ ...p, ...newTouched }));
    setErrors((p) => ({ ...p, ...errs }));
    if (Object.keys(errs).length > 0) return;
    setStep((s) => s + 1);
    setGlobalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step < 2) { advanceStep(); return; }

    /* Final step validation */
    const errs = validateStep(2, fields);
    setTouched((p) => ({ ...p, password: true, confirm_password: true }));
    setErrors((p) => ({ ...p, ...errs }));
    if (Object.keys(errs).length > 0) return;

    if (!captchaVerified) { setCaptchaError(true); return; }
    setCaptchaError(false);

    setLoading(true);
    setGlobalError("");
    try {
      const data = await signupUser({
        company_id:   fields.company_id.trim().toLowerCase(),
        company_name: fields.company_name.trim(),
        employee_id:  fields.employee_id.trim(),
        full_name:    fields.full_name.trim(),
        email:        fields.email.trim().toLowerCase(),
        password:     fields.password,
        captcha_token: "mock-token", /* replace with real hCaptcha token */
      });

      setAuth({
        accessToken: data.access_token,
        user: {
          id:          data.user.id,
          company_id:  data.user.company_id,
          employee_id: data.user.employee_id,
          role:        data.user.role,
        },
      });

      setDone(true);
      /* Brief success screen, then navigate */
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch (err) {
      const error = err as Error;
      const msg = error.message ?? "Something went wrong. Please try again.";
      setGlobalError(msg);
    } finally {
      setLoading(false);
    }
  };

  const meta = STEP_META[step];

  return (
    <>
      <style>{styles}</style>
      <div className="su-root">
        {/* ── Left decorative panel ── */}
        <aside className="su-panel" aria-hidden="true">
          <div className="su-panel-dots" />
          <div className="su-panel-glow" />

          <div className="su-panel-logo">
            <div className="su-logo-mark">
              <svg viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.6">
                <path d="M9 2L2 6v6l7 4 7-4V6z"/>
                <path d="M2 6l7 4 7-4M9 10v6"/>
              </svg>
            </div>
            <span className="su-logo-name">NexusCRM</span>
          </div>

          <div>
            <h2 className="su-panel-headline">
              Set up your<br />team&apos;s workspace<br />in minutes.
            </h2>
            <p className="su-panel-sub">
              Multi-tenant, fully isolated, and enterprise-ready from day one.
            </p>
          </div>

          <div className="su-steps-preview">
            {STEP_META.map((s, i) => (
              <div className="su-step-preview" key={i}>
                <div className={`su-step-preview-num${i < step ? " done" : i === step ? " active" : ""}`}>
                  {i < step ? (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <polyline points="2,6 5,9 10,3" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                    </svg>
                  ) : i + 1}
                </div>
                <span className={`su-step-preview-label${i === step ? " active" : ""}`}>
                  {s.preview}
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Right form column ── */}
        <main className="su-form-col">
          <div className="su-card">
            {done ? (
              /* ── Success screen ── */
              <div className="su-success">
                <div className="su-success-icon">
                  <svg viewBox="0 0 26 26" fill="none" stroke="#1D9E75" strokeWidth="2">
                    <circle cx="13" cy="13" r="11"/>
                    <polyline points="8,13 11,16 18,9" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h2 className="su-success-title">Workspace created!</h2>
                <p className="su-success-sub">Redirecting you to the dashboard…</p>
              </div>
            ) : (
              <>
                {/* Step progress */}
                <div className="su-progress" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`su-progress-seg${i < step ? " done" : i === step ? " active" : ""}`}
                    />
                  ))}
                </div>

                <header className="su-step-header">
                  <p className="su-step-eyebrow">{meta.eyebrow}</p>
                  <h1 className="su-step-title">{meta.title}</h1>
                  <p className="su-step-sub">{meta.sub}</p>
                </header>

                {globalError && (
                  <div className="su-error-banner" role="alert">
                    <svg viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.75 3.5h1.5v4.25h-1.5V4.5zm0 5.5h1.5v1.5h-1.5V10z"/>
                    </svg>
                    {globalError}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  {/* Step 0 */}
                  {step === 0 && (
                    <StepWorkspace
                      fields={fields} errors={errors}
                      touched={touched} onChange={onChange} onBlur={onBlur}
                    />
                  )}
                  {/* Step 1 */}
                  {step === 1 && (
                    <StepDetails
                      fields={fields} errors={errors}
                      touched={touched} onChange={onChange} onBlur={onBlur}
                    />
                  )}
                  {/* Step 2 */}
                  {step === 2 && (
                    <StepSecurity
                      fields={fields} errors={errors}
                      touched={touched} onChange={onChange} onBlur={onBlur}
                      showPwd={showPwd} setShowPwd={setShowPwd}
                      showConfirm={showConfirm} setShowConfirm={setShowConfirm}
                      captchaVerified={captchaVerified}
                      captchaChecking={captchaChecking}
                      verifyCaptcha={verifyCaptcha}
                      captchaError={captchaError}
                    />
                  )}

                  {/* Navigation buttons */}
                  <div className="su-btn-row">
                    {step > 0 && (
                      <button
                        type="button"
                        className="su-btn su-btn-secondary"
                        onClick={() => setStep((s) => s - 1)}
                        disabled={loading}
                      >
                        Back
                      </button>
                    )}
                    <button
                      type="submit"
                      className="su-btn su-btn-primary"
                      disabled={loading}
                      aria-busy={loading}
                    >
                      {loading && <span className="su-btn-spinner" />}
                      {loading
                        ? "Creating…"
                        : step < 2
                        ? "Continue"
                        : "Create workspace"}
                    </button>
                  </div>
                </form>

                <p className="su-footer">
                  Already have an account?{" "}
                  <Link href="/auth/login">Sign in</Link>
                </p>
              </>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

/*
 * INTEGRATION NOTES
 * ─────────────────
 * Same axiosClient + authStore setup as LoginPage.jsx.
 *
 * Server must respond to POST /auth/signup with:
 * {
 *   access_token: "...",
 *   user: { id, company_id, employee_id, role }
 * }
 * and set a httpOnly refresh_token cookie.
 *
 * Company ID uniqueness:
 *   The server should return 409 { error: "Company ID already taken" }
 *   if the company_id already exists. This surfaces via globalError.
 *
 * hCaptcha (production):
 *   npm install @hcaptcha/react-hcaptcha
 *   Replace <CaptchaWidget> with:
 *   <HCaptcha sitekey={import.meta.env.VITE_HCAPTCHA_SITE_KEY}
 *             onVerify={token => setCaptchaToken(token)} />
 *   Then pass captchaToken in the POST body.
 *
 * Email verification (optional):
 *   After signup, redirect to /verify-email?email=... instead of /dashboard.
 *   The server sends a verification link; the user clicks it to activate.
 */
