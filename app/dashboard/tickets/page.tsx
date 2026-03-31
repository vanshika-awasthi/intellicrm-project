"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/app/store/authStore";

const PRIORITY_COLORS: Record<string, string> = {
  low: "#82C91E",
  medium: "#FAB005",
  high: "#FD7E14",
  critical: "#E03131",
};

const STATUS_COLORS: Record<string, { bg: string, text: string }> = {
  open: { bg: "rgba(52, 152, 219, 0.15)", text: "#3498DB" },
  in_progress: { bg: "rgba(241, 196, 15, 0.15)", text: "#F1C40F" },
  resolved: { bg: "rgba(46, 204, 113, 0.15)", text: "#2ECC71" },
  closed: { bg: "rgba(149, 165, 166, 0.15)", text: "#95A5A6" }
};

const pageStyles = `
  .tickets-header {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; animation: fadeIn 0.4s ease both;
  }
  .header-content h1 { font-size: 24px; font-weight: 700; color: var(--dash-text); margin: 0; letter-spacing: -0.02em; }
  .header-content p { font-size: 14px; color: var(--dash-text-muted); margin: 4px 0 0 0; }
  
  .primary-btn {
    background: transparent; color: #E2E8F0; padding: 10px 18px; border-radius: 10px; font-size: 14px; font-weight: 500; cursor: pointer; border: 1px solid #475569; transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); display:inline-flex; align-items:center; gap: 8px; box-shadow: none;
  }
  .primary-btn:hover { background: rgba(255,255,255,0.05); border-color: #94A3B8; color: #fff; }

  .tickets-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }

  .ticket-card {
    background: #1E293B;
    backdrop-filter: blur(12px);
    border: 1px solid var(--dash-border);
    border-radius: 16px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: fadeIn 0.5s ease both;
    position: relative;
    overflow: hidden;
  }
  
  .ticket-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(0,0,0,0.25);
    border-color: rgba(99,102,241,0.15);
  }

  .ticket-top {
    display: flex; justify-content: space-between; align-items: flex-start;
  }
  .ticket-title { font-size: 16px; font-weight: 600; color: var(--dash-text); margin: 0; line-height: 1.4; }
  
  .ticket-badge {
    padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; flex-shrink: 0;
  }

  .ticket-desc {
    font-size: 13px; color: var(--dash-text-muted); line-height: 1.5;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  }

  .ticket-meta {
    display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--dash-text-muted); padding-top: 8px; border-top: 1px solid var(--dash-border);
  }
  
  .ticket-meta-icon { display: flex; align-items: center; gap: 6px; }

  .ticket-actions {
    display: flex; gap: 8px; margin-top: auto; padding-top: 12px;
  }
  .action-select {
    padding: 6px 10px; border-radius: 6px; border: 1px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text); font-size: 12px; font-weight: 500; cursor: pointer; outline: none; flex: 1; transition: border-color 0.2s;
  }
  .action-select:focus { border-color: var(--dash-accent); }

  /* Modals */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; z-index: 999;
    animation: fadeIn 0.2s ease both;
  }
  .modal-content {
    background: #1E293B; backdrop-filter: blur(20px); border-radius: 16px; width: 480px; max-width: 90vw;
    padding: 1.5rem; border: 1px solid rgba(99,102,241,0.15);
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  }
  .modal-header { font-size: 18px; font-weight: 600; margin-bottom: 1.5rem; color: var(--dash-text); }
  .form-group { margin-bottom: 1rem; }
  .form-label { display: block; font-size: 12px; font-weight: 500; margin-bottom: 6px; color: var(--dash-text-muted); }
  .form-input, .form-select, .form-textarea {
    width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--dash-border);
    background: var(--dash-bg); color: var(--dash-text); outline: none; font-size: 13px;
  }
  .form-textarea { resize: vertical; min-height: 80px; }
  .form-input:focus, .form-select:focus, .form-textarea:focus { border-color: var(--dash-accent); }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

export default function TicketsPage() {
  const { user } = useAuthStore();
  
  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", assignedTo: "", contactId: "" });

  const fetchData = async () => {
    if (!user?.company_id) return;
    try {
      const [tRes, uRes, cRes] = await Promise.all([
        fetch(`/api/tickets?companyId=${user.company_id}`).then(r => r.json()),
        fetch(`/api/users?companyId=${user.company_id}`).then(r => r.json()),
        fetch(`/api/contacts?companyId=${user.company_id}`).then(r => r.json())
      ]);
      if (Array.isArray(tRes)) setTickets(tRes);
      if (uRes.success) setUsers(uRes.data);
      if (cRes.success) setContacts(cRes.data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: user?.company_id, ...form })
      });
      if(res.ok) {
        setModalOpen(false);
        setForm({ title: "", description: "", priority: "medium", assignedTo: "", contactId: "" });
        fetchData();
      }
    } catch (err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const updateTicket = async (id: string, updates: any) => {
    // Optimistic UI update
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    try {
      await fetch(`/api/tickets/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      fetchData(); // Sync exact data (like resolvedAt timestamps)
    } catch (err) {
      console.error(err);
      fetchData(); // Rollback
    }
  };

  if (loading) return <div style={{padding:'2rem'}}>Loading Tickets...</div>;

  const openTicketsCount = tickets.filter(t => t.status !== "closed" && t.status !== "resolved").length;

  return (
    <>
      <style>{pageStyles}</style>
      <div>
        <div className="tickets-header">
          <div className="header-content">
            <h1>Support Tickets</h1>
            <p>Track, manage, and resolve customer issues. You have {openTicketsCount} open tickets.</p>
          </div>
          <button className="primary-btn" onClick={() => setModalOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"></path></svg>
            Create Ticket
          </button>
        </div>

        <div className="tickets-grid">
          {tickets.map(ticket => (
            <div key={ticket.id} className="ticket-card">
              <div className="ticket-top">
                <h3 className="ticket-title">{ticket.title}</h3>
                <div className="ticket-badge" style={{ color: PRIORITY_COLORS[ticket.priority], border: `1px solid ${PRIORITY_COLORS[ticket.priority]}50`, background: `${PRIORITY_COLORS[ticket.priority]}15` }}>
                  {ticket.priority}
                </div>
              </div>

              {ticket.description && <p className="ticket-desc">{ticket.description}</p>}

              <div className="ticket-actions">
                <select 
                  className="action-select" 
                  value={ticket.status} 
                  onChange={(e) => updateTicket(ticket.id, { status: e.target.value })}
                  style={{ background: STATUS_COLORS[ticket.status].bg, color: STATUS_COLORS[ticket.status].text, borderColor: 'transparent' }}
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>

                <select 
                  className="action-select" 
                  value={ticket.assignedTo || ""} 
                  onChange={(e) => updateTicket(ticket.id, { assignedTo: e.target.value || null })}
                >
                  <option value="">Unassigned</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.fullName || u.employeeId}</option>)}
                </select>
              </div>

              <div className="ticket-meta">
                <div className="ticket-meta-icon" title="Customer">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  {ticket.contact?.name || "No Contact"}
                </div>
                &bull;
                <div className="ticket-meta-icon" title="Created At">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
                {ticket.resolvedAt && (
                  <>
                    &bull;
                    <div className="ticket-meta-icon" title="Resolved At" style={{color: '#2ECC71'}}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                      {new Date(ticket.resolvedAt).toLocaleDateString()}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="modal-header">Create New Ticket</h3>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Issue Title</label>
                  <input required className="form-input" type="text" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Cannot reset password" />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Provide details about the issue..."></textarea>
                </div>

                <div style={{display:'flex', gap:'1rem'}}>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Priority</label>
                    <select className="form-select" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Assign To Worker</label>
                    <select className="form-select" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})}>
                      <option value="">Unassigned</option>
                      {users.map(u => <option key={u.id} value={u.id}>{u.fullName || u.employeeId}</option>)}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Link to Contact (Customer)</label>
                  <select className="form-select" value={form.contactId} onChange={e => setForm({...form, contactId: e.target.value})}>
                    <option value="">-- No Contact Linked --</option>
                    {contacts.map(c => <option key={c.id} value={c.id}>{c.name} {c.companyName ? `(${c.companyName})` : ''}</option>)}
                  </select>
                </div>
                
                <div style={{display:'flex', justifyContent:'flex-end', gap:'8px', marginTop:'2rem'}}>
                  <button type="button" onClick={() => setModalOpen(false)} style={{padding:'8px 14px', background:'transparent', border:'none', color:'var(--dash-text-muted)', cursor:'pointer'}}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Ticket"}
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
