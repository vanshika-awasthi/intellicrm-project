"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";

const COLUMNS = [
  { id: "lead", label: "Lead", color: "#E67E22" },
  { id: "qualified", label: "Qualified", color: "#3498DB" },
  { id: "proposal", label: "Proposal", color: "#9B59B6" },
  { id: "closed_won", label: "Closed Won", color: "#1D9E75" },
  { id: "closed_lost", label: "Closed Lost", color: "#E74C3C" }
];

const boardStyles = `
  .kanban-layout {
    display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem;
    min-height: 75vh;
  }
  
  .kanban-col {
    flex: 1; min-width: 280px;
    background: #1E293B;
    backdrop-filter: blur(12px);
    border: 1px solid var(--dash-border);
    border-radius: 16px;
    display: flex; flex-direction: column;
    transition: all 0.3s;
  }
  
  .col-header {
    padding: 1rem; border-bottom: 1px solid var(--dash-border);
    display: flex; justify-content: space-between; align-items: center;
  }
  .col-title { font-size: 14px; font-weight: 600; color: var(--dash-text); display: flex; align-items: center; gap: 8px;}
  .col-dot { width: 10px; height: 10px; border-radius: 50%; }
  .col-total { font-size: 13px; font-weight: 500; color: var(--dash-text-muted); }
  
  .col-body {
    flex: 1; padding: 1rem; display: flex; flex-direction: column; gap: 12px;
    min-height: 150px; /* Empty drop zone target */
  }

  /* Card */
  .deal-card {
    background: var(--dash-bg);
    border: 1px solid var(--dash-border);
    border-radius: 8px;
    padding: 1rem;
    cursor: grab;
    transition: transform 0.15s, box-shadow 0.15s;
    user-select: none;
  }
  .deal-card:active { cursor: grabbing; transform: scale(0.97); }
  .deal-card:hover { border-color: rgba(99,102,241,0.2); box-shadow: 0 4px 20px rgba(99,102,241,0.08); }
  
  .deal-title { font-size: 14px; font-weight: 600; color: var(--dash-text); margin-bottom: 4px; }
  .deal-val { font-size: 16px; font-weight: 600; color: var(--dash-text); margin-bottom: 12px; }
  .deal-meta { font-size: 11px; color: var(--dash-text-muted); display: flex; align-items: center; gap: 6px; }
  
  .contact-link { color: var(--dash-accent); text-decoration: none; font-weight: 500; }
  .contact-link:hover { text-decoration: underline; }

  /* Generic Modals */
  .primary-btn {
    background: transparent; color: #E2E8F0; padding: 10px 16px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; border: 1px solid #475569; transition: all 0.2s; display:inline-flex; align-items:center; gap: 8px; box-shadow: none;
  }
  .primary-btn:hover { background: rgba(255,255,255,0.05); border-color: #94A3B8; color: #fff; }
  
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; z-index: 999;
  }
  .modal-content {
    background: #1E293B; backdrop-filter: blur(20px); border-radius: 16px; width: 440px;
    padding: 1.5rem; border: 1px solid rgba(99,102,241,0.15);
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  }
  .modal-header { font-size: 18px; font-weight: 600; margin-bottom: 1.5rem; color: var(--dash-text); }
  .form-group { margin-bottom: 1rem; }
  .form-label { display: block; font-size: 12px; font-weight: 500; margin-bottom: 6px; color: var(--dash-text-muted); }
  .form-input, .form-select {
    width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--dash-border);
    background: var(--dash-bg); color: var(--dash-text); outline: none; font-size: 13px;
  }
`;

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
};

export default function KanbanPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [deals, setDeals] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drag State
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", value: "", stage: "lead", contactId: "" });

  const fetchData = async () => {
    if (!user?.company_id) return;
    try {
      const p1 = fetch(`/api/opportunities?companyId=${user.company_id}`).then(r => r.json());
      const p2 = fetch(`/api/contacts?companyId=${user.company_id}`).then(r => r.json());
      const [oRes, cRes] = await Promise.all([p1, p2]);
      if(oRes.success) setDeals(oRes.data);
      if(cRes.success) setContacts(cRes.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [user]);

  // Handle Drag
  const handleDragStart = (id: string) => {
    setDraggedId(id);
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // necessary to allow dropping
  };
  const handleDrop = async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    if (!draggedId) return;

    // Optimistically update UI
    const updatedDeals = deals.map(d => 
      d.id === draggedId ? { ...d, stage: targetStage } : d
    );
    setDeals(updatedDeals);
    setDraggedId(null);

    // Persist Drop & Trigger Lead Score logic!
    try {
      await fetch(`/api/opportunities/${draggedId}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: user?.company_id, stage: targetStage })
      });
    } catch(err) {
      console.error(err);
      fetchData(); // Reset on failure
    }
  };

  // Create Flow
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          companyId: user?.company_id, 
          ...form 
        })
      });
      if(res.ok) {
        setModalOpen(false);
        setForm({ title: "", value: "", stage: "lead", contactId: "" });
        fetchData();
      }
    } catch(err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  if (loading) return <div style={{padding:'2rem'}}>Loading Pipeline...</div>;

  return (
    <>
      <style>{boardStyles}</style>
      <div>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '2rem'}}>
          <div>
            <h1 style={{fontSize:'24px', fontWeight:600, color:'var(--dash-text)', margin:0}}>Sales Pipeline</h1>
            <p style={{fontSize:'14px', color:'var(--dash-text-muted)', margin:'4px 0 0 0'}}>Drag deals across stages to instantly recalculate Lead Scores.</p>
          </div>
          <button className="primary-btn" onClick={() => setModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Opportunity
          </button>
        </div>

        <div className="kanban-layout">
          {COLUMNS.map(col => {
            const colDeals = deals.filter(d => d.stage === col.id);
            const colTotal = colDeals.reduce((sum, d) => sum + (d.value || 0), 0);

            return (
              <div 
                key={col.id} className="kanban-col"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
              >
                <div className="col-header">
                  <div className="col-title">
                    <span className="col-dot" style={{background: col.color}}></span>
                    {col.label} ({colDeals.length})
                  </div>
                  <div className="col-total">{formatCurrency(colTotal)}</div>
                </div>

                <div className="col-body">
                  {colDeals.map(deal => (
                    <div 
                      key={deal.id} 
                      className="deal-card"
                      draggable
                      onDragStart={() => handleDragStart(deal.id)}
                    >
                      <div className="deal-title">{deal.title}</div>
                      <div className="deal-val">{formatCurrency(deal.value)}</div>
                      
                      {deal.contact && (
                        <div className="deal-meta" style={{marginBottom: '8px'}}>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                           <span 
                             className="contact-link" 
                             onClick={() => router.push(`/dashboard/contacts/${deal.contactId}`)}
                             title="Navigate to profile"
                             style={{cursor:'pointer'}}
                           >
                             {deal.contact.name}
                           </span>
                        </div>
                      )}
                      
                      {deal.expectedClose && (
                        <div className="deal-meta">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                          {new Date(deal.expectedClose).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="modal-header">Register Opportunity</h3>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Deal Name</label>
                  <input required className="form-input" type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Q4 Enterprise Expansion" />
                </div>
                
                <div style={{display:'flex', gap:'1rem'}}>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Estimated Value (₹)</label>
                    <input required className="form-input" type="number" min="0" value={form.value} onChange={e => setForm({...form, value: e.target.value})} placeholder="50000" />
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Initial Stage</label>
                    <select className="form-select" value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}>
                      {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Link to Contact (Scores Lead automatically)</label>
                  <select className="form-select" value={form.contactId} onChange={e => setForm({...form, contactId: e.target.value})}>
                    <option value="">-- No Contact --</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>)}
                  </select>
                </div>
                
                <div style={{display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'2rem'}}>
                  <button type="button" onClick={() => setModalOpen(false)} style={{padding:'8px 14px', background:'transparent', border:'none', color:'var(--dash-text-muted)', cursor:'pointer'}}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={submitting}>
                    {submitting ? "Saving..." : "Create Deal"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
