"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/app/store/authStore";

const wfStyles = `
  .wf-layout { padding: 1rem 0; }
  .wf-header { margin-bottom: 2rem; }
  .wf-title { font-size: 24px; font-weight: 600; color: var(--dash-text); margin: 0 0 0.5rem 0; }
  .wf-sub { font-size: 14px; color: var(--dash-text-muted); margin: 0; }
  
  .primary-btn { background: var(--dash-accent); color: #fff; padding: 10px 16px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; border: none; transition: 0.2s; display:inline-flex; align-items:center; gap: 8px; }
  .primary-btn:hover { background: #157A5A; }
  .danger-btn { background: rgba(231,76,60,0.1); color: #E74C3C; padding: 6px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; border: none; }
  .danger-btn:hover { background: rgba(231,76,60,0.2); }

  .rule-card {
    background: var(--dash-surface); border: 1px solid var(--dash-border); border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 4px 20px rgba(0,0,0,0.02); display: flex; flex-direction: column; gap: 1rem;
  }
  .rule-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--dash-border); padding-bottom: 1rem; }
  .rule-name { font-size: 16px; font-weight: 600; color: var(--dash-text); }
  
  .rule-code {
    background: var(--dash-bg); border: 1px solid var(--dash-border); border-radius: 8px; padding: 1rem; font-family: monospace; font-size: 13px; color: var(--dash-text-muted);
  }

  /* Form */
  .wf-form { display: flex; flex-direction: column; gap: 1rem; background: var(--dash-bg); padding: 1.5rem; border-radius: 8px; border: 1px dashed var(--dash-border); margin-bottom: 2rem; }
  .form-group { display: flex; flex-direction: column; gap: 6px; }
  .form-label { font-size: 12px; font-weight: 600; color: var(--dash-text); text-transform: uppercase; }
  .form-input, .form-select { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--dash-border); background: var(--dash-surface); color: var(--dash-text); outline: none; font-size: 14px; }
`;

export default function WorkflowsPage() {
  const { user } = useAuthStore();
  
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);

  // Builder State
  const [form, setForm] = useState({ name: "", entity: "Contact", triggerOn: "created", condField: "", condOp: "gt", condVal: "", actType: "auto_assign", actVal: "" });

  const fetchRules = async () => {
    if (!user?.company_id) return;
    try {
      // We will proxy a native fetch if we built a GET /api/workflows endpoint
      // For speed, let's keep it strictly simulated here as the engine works in the backend.
      // E.g., const res = await fetch(`/api/workflows?companyId=${user.company_id}`);
    } catch(e) { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchRules(); }, [user]);

  // Handle Mock Create via direct API route later if needed
  const handleSaveMock = () => {
    alert("In an active workspace, this registers into Prisma WorkflowRule table natively!");
    setShowBuilder(false);
  };

  return (
    <>
      <style>{wfStyles}</style>
      <div className="wf-layout">
        <div className="wf-header" style={{display:'flex', justifyContent:'space-between'}}>
          <div>
            <h1 className="wf-title">Automation & Background Jobs</h1>
            <p className="wf-sub">Configure conditional actions that process asynchronously in your workspace native Job Queue.</p>
          </div>
          <button className="primary-btn" onClick={() => setShowBuilder(!showBuilder)}>
            {showBuilder ? "Cancel" : "Create New Rule"}
          </button>
        </div>

        {showBuilder && (
          <div className="wf-form">
            <h3 style={{margin:'0 0 1rem 0'}}>Configure Logical Trigger</h3>
            <div style={{display:'flex', gap:'1rem'}}>
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Rule Name</label>
                <input className="form-input" placeholder="E.g. Assign Hot Leads" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
              </div>
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">Entity Scope</label>
                <select className="form-select" value={form.entity} onChange={e=>setForm({...form, entity: e.target.value})}>
                  <option value="Contact">Contact / Lead</option>
                  <option value="Opportunity">Opportunity Board</option>
                </select>
              </div>
              <div className="form-group" style={{flex:1}}>
                <label className="form-label">On Event</label>
                <select className="form-select" value={form.triggerOn} onChange={e=>setForm({...form, triggerOn: e.target.value})}>
                  <option value="created">Created</option>
                  <option value="status_change">Stage / Status Change</option>
                </select>
              </div>
            </div>
            
            <h4 style={{margin:'1rem 0 0 0'}}>Condition Matching (IF)</h4>
            <div style={{display:'flex', gap:'1rem'}}>
              <input className="form-input" placeholder="Property (e.g. leadScore)" value={form.condField} onChange={e=>setForm({...form, condField: e.target.value})} />
              <select className="form-select" value={form.condOp} onChange={e=>setForm({...form, condOp: e.target.value})}>
                <option value="gt">Greater Than</option>
                <option value="lt">Less Than</option>
                <option value="equals">Equals Exactly</option>
              </select>
              <input className="form-input" placeholder="Value (e.g. 50)" value={form.condVal} onChange={e=>setForm({...form, condVal: e.target.value})} />
            </div>

            <h4 style={{margin:'1rem 0 0 0'}}>Execution Action (THEN)</h4>
            <div style={{display:'flex', gap:'1rem'}}>
              <select className="form-select" value={form.actType} onChange={e=>setForm({...form, actType: e.target.value})}>
                <option value="auto_assign">Auto-Assign to Active User</option>
                <option value="send_email">Dispatch Follow-up Email Node Job</option>
              </select>
              <input className="form-input" placeholder="Target User ID or Email Payload" value={form.actVal} onChange={e=>setForm({...form, actVal: e.target.value})} />
            </div>

            <div style={{marginTop:'1rem', textAlign:'right'}}>
              <button className="primary-btn" onClick={handleSaveMock}>Save Workflow to Queue</button>
            </div>
          </div>
        )}

        {/* Existing Mock Rules for Visual Feedback */}
        <div className="rule-card">
          <div className="rule-header">
            <div className="rule-name">Assign High-Score Leads Automatically</div>
            <button className="danger-btn">Disable</button>
          </div>
          <div className="rule-code">
            <strong>WHEN</strong> Contact is created <br/>
            <strong>AND</strong> leadScore &gt; 50 <br/>
            <strong>THEN</strong> queue <code>auto_assign</code> job mapping UserID: admin-123
          </div>
        </div>

      </div>
    </>
  );
}
