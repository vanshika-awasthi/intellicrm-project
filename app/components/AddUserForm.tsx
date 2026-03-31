"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";

const formStyles = `
  .add-user-wrap {
    max-width: 600px;
    margin: 0 auto;
    background: var(--dash-surface);
    border: 1px solid var(--dash-border);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    padding: 2.5rem;
    animation: fadeIn 0.4s ease both;
  }
  .add-user-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    color: var(--dash-text);
  }
  .add-user-sub {
    font-size: 14px;
    color: var(--dash-text-muted);
    margin: 0 0 2rem 0;
  }
  
  .form-row {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
  }
  .form-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    margin-bottom: 1.5rem;
  }
  .form-row .form-group { margin-bottom: 0; }
  
  .field-label {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 8px;
    color: var(--dash-text);
  }
  .field-input, .field-select {
    padding: 12px 14px;
    border: 1px solid var(--dash-border);
    border-radius: 8px;
    background: var(--dash-bg);
    color: var(--dash-text);
    font-size: 14px;
    transition: all 0.2s;
    outline: none;
  }
  .field-input:focus, .field-select:focus {
    border-color: rgba(99,102,241,0.5);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
  }
  .field-error {
    color: #E74C3C;
    font-size: 12px;
    margin-top: 6px;
  }

  /* Toggle */
  .toggle-wrap {
    display: flex; align-items: center; gap: 12px;
    margin-bottom: 2rem;
    padding: 1rem;
    background: var(--dash-bg);
    border-radius: 8px;
    border: 1px solid var(--dash-border);
  }
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
  }
  .toggle-switch input { opacity: 0; width: 0; height: 0; }
  .slider {
    position: absolute; cursor: pointer;
    top: 0; left: 0; right: 0; bottom: 0;
    background-color: var(--dash-border);
    transition: .4s;
    border-radius: 24px;
  }
  .slider:before {
    position: absolute; content: "";
    height: 18px; width: 18px;
    left: 3px; bottom: 3px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  input:checked + .slider { background-color: #6366F1; }
  input:checked + .slider:before { transform: translateX(20px); }
  
  /* Submit */
  .submit-btn {
    background: transparent;
    color: #E2E8F0;
    padding: 14px 24px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
    border: 1px solid #475569;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;
    width: 100%;
    margin-top: 1rem;
    position: relative;
    overflow: hidden;
  }
  .submit-btn:hover:not(:disabled) { background: rgba(255,255,255,0.05); border-color: #94A3B8; color: #fff; }
  .submit-btn:disabled {
    opacity: 0.6; cursor: not-allowed;
  }

  .api-error {
    background: rgba(244,63,94,0.1);
    color: #FB7185;
    padding: 12px;
    border-radius: 10px;
    font-size: 13px;
    margin-bottom: 1.5rem;
    border: 1px solid rgba(244,63,94,0.2);
  }

  /* Success State */
  .success-pane {
    text-align: center;
    padding: 2rem 0;
  }
  .success-icon {
    width: 64px; height: 64px;
    background: var(--dash-accent-light);
    color: var(--dash-accent);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.5rem;
  }
  .copy-grid {
    background: var(--dash-bg);
    border: 1px solid var(--dash-border);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1.5rem;
    text-align: left;
    font-family: monospace;
    font-size: 13px;
    color: var(--dash-text-muted);
  }
`;

export default function AddUserForm() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    employeeId: "",
    role: "employee", // "admin", "manager", "employee"
    password: "",
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validate = () => {
    let errs: Record<string, string> = {};
    if (!formData.fullName.trim()) errs.fullName = "Full name required.";
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
      errs.email = "Valid email required.";
    }
    if (!formData.employeeId.trim()) errs.employeeId = "Alias/ID required.";
    
    if (formData.password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    } else if (!/[A-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errs.password = "Requires at least 1 uppercase and 1 number.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError("");
    
    if (!validate()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          companyId: user?.company_id // Attach active tenant
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to create user.");
      
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <style>{formStyles}</style>
        <div className="add-user-wrap">
          <div className="success-pane">
            <div className="success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 className="add-user-title">Team Member Added!</h2>
            <p className="add-user-sub">They can now log in using your workspace credentials.</p>
            
            <div className="copy-grid">
              <div><strong>Workspace (Company ID):</strong> {user?.company_id}</div>
              <div style={{marginTop:'8px'}}><strong>Employee ID:</strong> {formData.employeeId}</div>
              <div style={{marginTop:'8px'}}><strong>Initial Password:</strong> {formData.password}</div>
            </div>

            <button 
              className="submit-btn" 
              style={{ marginTop: '2rem' }}
              onClick={() => router.push("/dashboard")}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{formStyles}</style>
      <div className="add-user-wrap">
        <h2 className="add-user-title">Provision New User</h2>
        <p className="add-user-sub">Add a new structured team member into your active <strong>{user?.company_id}</strong> workspace.</p>

        {apiError && <div className="api-error">{apiError}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="field-label">Full Name</label>
            <input 
              type="text" 
              className="field-input" 
              placeholder="E.g. Sarah Jenkins"
              value={formData.fullName}
              onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            />
            {errors.fullName && <div className="field-error">{errors.fullName}</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="field-label">Employee ID (Login Alias)</label>
              <input 
                type="text" 
                className="field-input" 
                placeholder="E.g. SJENKINS"
                value={formData.employeeId}
                onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
              />
              {errors.employeeId && <div className="field-error">{errors.employeeId}</div>}
            </div>
            <div className="form-group">
              <label className="field-label">Account Role</label>
              <select 
                className="field-select"
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="employee">Standard Employee</option>
                <option value="manager">Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="field-label">Work Email</label>
            <input 
              type="email" 
              className="field-input" 
              placeholder="sarah@yourcompany.com"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="form-group">
            <label className="field-label">Initial Password</label>
            <input 
              type="text" 
              className="field-input" 
              placeholder="Temporary secure password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
            />
            <div style={{fontSize: '11px', color:'var(--dash-text-muted)', marginTop:'6px'}}>
              Must be at least 8 chars with 1 uppercase and 1 number.
            </div>
            {errors.password && <div className="field-error">{errors.password}</div>}
          </div>

          <div className="toggle-wrap">
            <label className="toggle-switch">
              <input 
                type="checkbox" 
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
              <span className="slider"></span>
            </label>
            <div>
              <div style={{fontWeight: 600, fontSize: '13px', color: 'var(--dash-text)'}}>Account Active</div>
              <div style={{fontSize: '12px', color: 'var(--dash-text-muted)'}}>They can immediately log in upon creation.</div>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"></circle>
                <path d="M12 2A10 10 0 002 12"></path>
              </svg>
            ) : "Create Account"}
          </button>
        </form>
      </div>
    </>
  );
}
