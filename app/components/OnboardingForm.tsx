"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";

const formStyles = `
  .ob-wrap {
    max-width: 800px;
    margin: 0 auto;
    background: var(--dash-surface);
    border: 1px solid var(--dash-border);
    border-radius: 16px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    overflow: hidden;
  }
  .ob-header {
    padding: 2rem;
    border-bottom: 1px solid var(--dash-border);
    text-align: center;
  }
  .ob-title {
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }
  /* Stepper */
  .stepper {
    display: flex;
    justify-content: center;
    gap: 1rem;
  }
  .step-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 13px;
    font-weight: 500;
    color: var(--dash-text-muted);
    position: relative;
  }
  .step-item.active {
    color: var(--dash-accent);
  }
  .step-item.completed {
    color: var(--dash-text);
  }
  .step-circle {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--dash-bg);
    border: 1px solid var(--dash-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
  }
  .step-item.active .step-circle {
    background: linear-gradient(135deg, #6366F1, #A855F7);
    border-color: #6366F1;
    color: #fff;
    box-shadow: 0 2px 10px rgba(99,102,241,0.3);
  }
  .step-item.completed .step-circle {
    background: #22C55E;
    border-color: #22C55E;
    color: #fff;
  }
  .step-line {
    width: 40px;
    height: 2px;
    background: var(--dash-border);
  }
  
  /* Body */
  .ob-body {
    padding: 2rem;
    min-height: 400px;
  }
  .field-group {
    margin-bottom: 1.5rem;
  }
  .field-label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--dash-text);
  }
  .field-input, .field-select {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--dash-border);
    border-radius: 8px;
    background: var(--dash-bg);
    color: var(--dash-text);
    font-size: 14px;
    transition: border-color 0.2s;
  }
  .field-input:focus, .field-select:focus {
    outline: none;
    border-color: var(--dash-accent);
  }
  .field-error {
    color: #E74C3C;
    font-size: 12px;
    margin-top: 6px;
    display: block;
  }
  
  /* Buttons */
  .ob-footer {
    padding: 1.5rem 2rem;
    border-top: 1px solid var(--dash-border);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--dash-bg);
  }
  .btn-prev {
    padding: 10px 20px;
    border-radius: 8px;
    border: 1px solid var(--dash-border);
    background: var(--dash-surface);
    color: var(--dash-text);
    cursor: pointer;
    font-weight: 500;
  }
  .btn-next {
    background: transparent;
    color: #E2E8F0;
    padding: 12px 24px;
    border-radius: 10px;
    font-weight: 500;
    font-size: 15px;
    border: 1px solid #475569;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;
  }
  .btn-next:hover:not(:disabled) { background: rgba(255,255,255,0.05); border-color: #94A3B8; color: #fff; }
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
  .btn-next:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Preview Grid */
  .preview-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
  }
  .preview-card {
    padding: 1.5rem;
    border: 1px solid var(--dash-border);
    border-radius: 12px;
    background: var(--dash-bg);
  }
  .preview-card h4 {
    margin: 0 0 1rem 0;
    font-size: 14px;
    color: var(--dash-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .p-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
  }
  .p-key { color: var(--dash-text-muted); }
  .p-val { font-weight: 500; }
  
  /* Mock File Upload */
  .file-drop {
    border: 2px dashed var(--dash-border);
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.2s;
  }
  .file-drop:hover {
    border-color: var(--dash-accent);
  }
  .file-drop-icon {
    width: 32px; height: 32px;
    color: var(--dash-text-muted);
    margin-bottom: 10px;
  }
  
  /* Toggle Switch */
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
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  input:checked + .slider { background-color: #6366F1; }
  input:checked + .slider:before { transform: translateX(20px); }
  
  /* Success Frame */
  .success-frame {
    text-align: center;
    padding: 4rem 2rem;
  }
  .success-icon {
    width: 64px; height: 64px;
    background: var(--dash-accent-light);
    color: var(--dash-accent);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1.5rem auto;
  }
`;

export default function OnboardingForm() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Director",
    department: "",
    address: "",
    fileName: "",
    status: "lead", // "lead", "qualified", "proposal", "closed_won"
    targetValue: 0,
    targetDate: "",
    notify: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (currentStep: number) => {
    let newErrors: Record<string, string> = {};
    if (currentStep === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required.";
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
        newErrors.email = "A valid email is required.";
      }
    } else if (currentStep === 3) {
      if (formData.targetValue < 0) newErrors.targetValue = "Value cannot be negative.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) setStep((prev) => prev + 1);
  };
  const prevStep = () => setStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: user?.company_id,
          userId: user?.id,
          ...formData
        })
      });
      if (!res.ok) throw new Error("Failed to onboard client");
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Submission Error!");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <style>{formStyles}</style>
        <div className="ob-wrap">
          <div className="success-frame">
            <div className="success-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
            <h2 className="ob-title">Onboarding Complete!</h2>
            <p style={{ color: 'var(--dash-text-muted)', marginBottom: '2rem' }}>
              We have successfully provisioned the records for {formData.name}. Your dashboard is now updated with live Opportunity Metrics and Contact logs.
            </p>
            <button className="btn-next" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{formStyles}</style>
      <div className="ob-wrap">
        <div className="ob-header">
          <h2 className="ob-title">New Client Registration</h2>
          <div className="stepper">
            <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-circle">1</div> Profile
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-circle">2</div> Details
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${step >= 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
              <div className="step-circle">3</div> Pipeline
            </div>
            <div className="step-line"></div>
            <div className={`step-item ${step === 4 ? 'active' : ''}`}>
              <div className="step-circle">4</div> Preview
            </div>
          </div>
        </div>

        <div className="ob-body">
          {/* STEP 1: BASICS */}
          {step === 1 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div className="field-group">
                <label className="field-label">Full Name</label>
                <input 
                  type="text" 
                  className="field-input" 
                  placeholder="e.g. Acme Corporation or John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="field-group">
                <label className="field-label">Email Address</label>
                <input 
                  type="email" 
                  className="field-input" 
                  placeholder="contact@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="field-group">
                <label className="field-label">Job Title / Role</label>
                <select 
                  className="field-select"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="Director">Director</option>
                  <option value="Manager">Manager</option>
                  <option value="Executive">Executive</option>
                  <option value="Consultant">Consultant</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 2 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div className="field-group">
                <label className="field-label">Department</label>
                <input 
                  type="text" 
                  className="field-input" 
                  placeholder="e.g. Sales, Enterprise, Engineering"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                />
              </div>
              <div className="field-group">
                <label className="field-label">Primary Address</label>
                <input 
                  type="text" 
                  className="field-input" 
                  placeholder="123 Ocean Drive, Suite 100, City, ST"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="field-group">
                <label className="field-label">NDA / Supporting Document (Optional)</label>
                <div 
                  className="file-drop" 
                  onClick={() => {
                    const mockFile = prompt("Enter a mock filename to simulate upload:");
                    if (mockFile) setFormData({...formData, fileName: mockFile});
                  }}
                >
                  <svg className="file-drop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  <div>{formData.fileName ? `Uploaded: ${formData.fileName}` : "Click to simulate file upload"}</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PIPELINE & METRICS */}
          {step === 3 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <div className="field-group">
                <label className="field-label">Pipeline Stage (Status)</label>
                <select 
                  className="field-select"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="lead">New Lead</option>
                  <option value="qualified">Qualified</option>
                  <option value="proposal">In Proposal</option>
                  <option value="closed_won">Closed Won</option>
                </select>
              </div>
              <div className="field-group">
                <label className="field-label">Opportunity Target Value (₹)</label>
                <input 
                  type="number" 
                  className="field-input" 
                  min="0"
                  value={formData.targetValue}
                  onChange={(e) => setFormData({...formData, targetValue: Number(e.target.value)})}
                />
                 {errors.targetValue && <span className="field-error">{errors.targetValue}</span>}
              </div>
              <div className="field-group">
                <label className="field-label">Expected Close Date</label>
                <input 
                  type="date" 
                  className="field-input" 
                  value={formData.targetDate}
                  onChange={(e) => setFormData({...formData, targetDate: e.target.value})}
                />
              </div>
              <div className="field-group" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '2rem' }}>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={formData.notify} 
                    onChange={(e) => setFormData({...formData, notify: e.target.checked})} 
                  />
                  <span className="slider"></span>
                </label>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dash-text)' }}>Send Welcome Notification</div>
                  <div style={{ fontSize: '12px', color: 'var(--dash-text-muted)' }}>Automatically dispatch introductory materials.</div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: PREVIEW */}
          {step === 4 && (
            <div style={{ animation: 'fadeIn 0.3s' }}>
              <p style={{ color: 'var(--dash-text-muted)', marginBottom: '1.5rem', textAlign: 'center' }}>
                Please review the mapped dashboard elements below before confirming. 
              </p>
              <div className="preview-grid">
                <div className="preview-card">
                  <h4>Contact Record</h4>
                  <div className="p-row"><span className="p-key">Name:</span> <span>{formData.name}</span></div>
                  <div className="p-row"><span className="p-key">Email:</span> <span>{formData.email}</span></div>
                  <div className="p-row"><span className="p-key">Role:</span> <span>{formData.role}</span></div>
                  <div className="p-row"><span className="p-key">Dept:</span> <span>{formData.department || '--'}</span></div>
                  <div className="p-row"><span className="p-key">Address:</span> <span style={{textAlign: 'right'}}>{formData.address || '--'}</span></div>
                </div>
                <div className="preview-card">
                  <h4>Opportunity Metric</h4>
                  <div className="p-row"><span className="p-key">Title:</span> <span>New Deal: {formData.name}</span></div>
                  <div className="p-row"><span className="p-key">Stage:</span> <span style={{textTransform: 'capitalize'}}>{formData.status.replace('_', ' ')}</span></div>
                  <div className="p-row"><span className="p-key">Value Added:</span> <span style={{color: '#818CF8', fontWeight: 600}}>₹{formData.targetValue.toLocaleString()}</span></div>
                  <div className="p-row"><span className="p-key">Close Date:</span> <span>{formData.targetDate || 'TBD'}</span></div>
                  <div className="p-row"><span className="p-key">Docs:</span> <span>{formData.fileName || 'None'}</span></div>
                </div>
              </div>
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--dash-accent-light)', color: 'var(--dash-text)', borderRadius: '8px', fontSize: '13px' }}>
                <strong>Dashboard Action:</strong> Submitting will increment your Total Contacts by 1, inject ₹{formData.targetValue.toLocaleString()} to your Pipeline, and log a &quot;{formData.notify ? 'Welcome Email' : 'Onboarded Contact'}&quot; activity.
              </div>
            </div>
          )}

        </div>

        <div className="ob-footer">
          {step > 1 ? (
            <button className="btn-prev" onClick={prevStep} disabled={loading}>Back</button>
          ) : (
            <div></div> // Placeholder for flex spacing
          )}
          
          {step < 4 ? (
            <button className="btn-next" onClick={nextStep}>Next Step</button>
          ) : (
            <button className="btn-next" onClick={handleSubmit} disabled={loading}>
              {loading ? "Provisioning Database..." : "Confirm & Send to Dashboard"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
