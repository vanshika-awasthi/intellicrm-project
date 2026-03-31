"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";

const pageStyles = `
  .contacts-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    animation: fadeIn 0.4s ease both;
  }
  .contacts-title {
    font-size: 24px; font-weight: 700; color: var(--dash-text); letter-spacing: -0.02em;
  }
  .contacts-sub {
    font-size: 14px; color: var(--dash-text-muted); margin-top: 4px;
  }
  
  .primary-btn {
    background: transparent;
    color: #E2E8F0;
    padding: 10px 18px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: 1px solid #475569;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display:flex; align-items:center; gap: 8px;
    box-shadow: none;
  }
  .primary-btn:hover { background: rgba(255,255,255,0.05); border-color: #94A3B8; color: #fff; }

  /* Data Table Card */
  .table-card {
    background: #1E293B;
    backdrop-filter: blur(12px);
    border: 1px solid var(--dash-border);
    border-radius: 16px;
    overflow: hidden;
    animation: fadeIn 0.5s ease both;
    animation-delay: 0.1s;
  }
  .table-toolbar {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--dash-border);
    display: flex; gap: 12px;
  }
  .search-input {
    flex: 1; max-width: 300px;
    padding: 10px 14px; border-radius: 10px;
    border: 1px solid var(--dash-border);
    background: var(--dash-bg); color: var(--dash-text);
    outline: none; font-size: 13px; font-family: inherit;
    transition: all 0.3s;
  }
  .search-input:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

  .data-table {
    width: 100%; border-collapse: collapse; text-align: left;
  }
  .data-table th {
    padding: 14px 1.5rem;
    font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em;
    color: #64748B;
    border-bottom: 1px solid var(--dash-border);
    background: rgba(0,0,0,0.15);
  }
  .data-table td {
    padding: 1rem 1.5rem; font-size: 14px; color: var(--dash-text);
    border-bottom: 1px solid var(--dash-border);
  }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr { transition: all 0.2s; }
  .data-table tr:hover { background: rgba(99,102,241,0.04); }

  /* Type Badges */
  .badge {
    padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em;
  }
  .badge.lead { background: rgba(249,115,22,0.12); color: #FB923C; }
  .badge.prospect { background: rgba(6,182,212,0.12); color: #22D3EE; }
  .badge.customer { background: rgba(34,197,94,0.12); color: #4ADE80; }

  .action-wrap { display: flex; gap: 8px; }
  .action-btn {
    background: transparent; border: none; cursor: pointer;
    color: var(--dash-text-muted); padding: 6px; border-radius: 8px; transition: all 0.2s;
  }
  .action-btn:hover { background: var(--dash-surface-hover); color: var(--dash-text); }
  .action-btn.delete:hover { background: rgba(244,63,94,0.1); color: #FB7185; }

  /* Modal Overlays */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center; z-index: 999;
    animation: fadeIn 0.2s ease both;
  }
  .modal-content {
    background: #1E293B; backdrop-filter: blur(20px);
    border-radius: 16px; width: 440px;
    padding: 1.5rem; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    border: 1px solid rgba(99,102,241,0.15);
  }
  .modal-header { font-size: 18px; font-weight: 700; margin-bottom: 1.5rem; color: var(--dash-text); letter-spacing: -0.02em; }
  
  .form-group { margin-bottom: 1rem; }
  .form-label { display: block; font-size: 12px; font-weight: 600; margin-bottom: 6px; color: var(--dash-text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
  .form-input, .form-select {
    width: 100%; padding: 10px; border-radius: 10px; border: 1px solid var(--dash-border);
    background: var(--dash-bg); color: var(--dash-text); outline: none; font-size: 13px; font-family: inherit;
    transition: all 0.3s;
  }
  .form-input:focus, .form-select:focus { border-color: rgba(99,102,241,0.5); box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
  
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 2rem; }
  .btn-ghost { padding: 8px 14px; background: transparent; border: none; cursor: pointer; color: var(--dash-text-muted); border-radius: 8px; font-size: 13px; font-family: inherit; transition: all 0.2s; }
  .btn-ghost:hover { background: var(--dash-surface-hover); color: var(--dash-text); }

  @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function ContactsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", companyName: "", type: "lead" });

  const fetchContacts = async () => {
    if (!user?.company_id) return;
    try {
      const res = await fetch(`/api/contacts?companyId=${user.company_id}`);
      const json = await res.json();
      if (json.success) setContacts(json.data);
    } catch(e) { console.error("Filter Fetch Error", e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContacts(); }, [user]);

  const filtered = contacts.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.companyName || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, companyId: user?.company_id })
      });
      if(res.ok) {
        setModalOpen(false);
        setFormData({ name: "", email: "", phone: "", companyName: "", type: "lead" });
        fetchContacts();
      }
    } catch(err) { console.error(err); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(!confirm("Are you sure you want to delete this contact entirely?")) return;
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: user?.company_id })
      });
      if(res.ok) fetchContacts();
    } catch(err) { console.error(err); }
  };

  return (
    <>
      <style>{pageStyles}</style>
      <div>
        <div className="contacts-header">
          <div>
            <h1 className="contacts-title">Contacts Directory</h1>
            <p className="contacts-sub">Manage your active CRM relationships and timelines.</p>
          </div>
          <button className="primary-btn" onClick={() => setModalOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Contact
          </button>
        </div>

        <div className="table-card">
          <div className="table-toolbar">
            <input 
              type="text" 
              className="search-input" 
              placeholder="Search by name or company..." 
              value={search} onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          
          <table className="data-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Status</th>
                <th>Company</th>
                <th>Email / Phone</th>
                <th style={{width: '80px'}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{textAlign:'center', padding: '2rem'}}>Loading contacts...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} style={{textAlign:'center', padding: '2rem'}}>No contacts found.</td></tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} style={{cursor: 'pointer'}} onClick={() => router.push(`/dashboard/contacts/${c.id}`)}>
                    <td>
                      <div style={{fontWeight: 500}}>{c.name}</div>
                      <div style={{fontSize: '12px', color: 'var(--dash-text-muted)'}}>Added {new Date(c.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td><span className={`badge ${c.type}`}>{c.type}</span></td>
                    <td>{c.companyName || "—"}</td>
                    <td>
                      <div style={{fontSize:'13px'}}>{c.email || "—"}</div>
                      <div style={{fontSize:'12px', color:'var(--dash-text-muted)'}}>{c.phone}</div>
                    </td>
                    <td>
                      <div className="action-wrap">
                        <button className="action-btn delete" onClick={(e) => handleDelete(c.id, e)} title="Delete Contact">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 className="modal-header">Create New Contact</h3>
              <form onSubmit={handleCreate}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input required className="form-input" type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Jane Doe" />
                </div>
                <div style={{display:'flex', gap:'1rem'}}>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="jane@example.com" />
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Phone</label>
                    <input className="form-input" type="text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="123-456-7890" />
                  </div>
                </div>
                <div style={{display:'flex', gap:'1rem'}}>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Company / Account</label>
                    <input className="form-input" type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} placeholder="Acme Corp" />
                  </div>
                  <div className="form-group" style={{flex:1}}>
                    <label className="form-label">Lifecycle Stage</label>
                    <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                      <option value="lead">Lead</option>
                      <option value="prospect">Prospect</option>
                      <option value="customer">Customer</option>
                    </select>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-ghost" onClick={() => setModalOpen(false)}>Cancel</button>
                  <button type="submit" className="primary-btn" disabled={submitting}>
                    {submitting ? "Saving..." : "Create"}
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
