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
  }
  .contacts-title {
    font-size: 24px; font-weight: 600; color: var(--dash-text);
  }
  .contacts-sub {
    font-size: 14px; color: var(--dash-text-muted); margin-top: 4px;
  }
  
  .primary-btn {
    background: var(--dash-accent);
    color: #fff;
    padding: 10px 16px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    border: none;
    transition: background 0.2s;
    display:flex; align-items:center; gap: 8px;
  }
  .primary-btn:hover { background: #157A5A; }

  /* Data Table Card */
  .table-card {
    background: var(--dash-surface);
    border: 1px solid var(--dash-border);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
  }
  .table-toolbar {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid var(--dash-border);
    display: flex; gap: 12px;
  }
  .search-input {
    flex: 1; max-width: 300px;
    padding: 10px 14px; border-radius: 6px;
    border: 1px solid var(--dash-border);
    background: var(--dash-bg); color: var(--dash-text);
    outline: none; font-size: 13px;
  }
  .search-input:focus { border-color: var(--dash-accent); }

  .data-table {
    width: 100%; border-collapse: collapse; text-align: left;
  }
  .data-table th {
    padding: 14px 1.5rem;
    font-size: 12px; font-weight: 600; text-transform: uppercase;
    color: var(--dash-text-muted);
    border-bottom: 1px solid var(--dash-border);
    background: rgba(0,0,0,0.01);
  }
  .data-table td {
    padding: 1rem 1.5rem; font-size: 14px; color: var(--dash-text);
    border-bottom: 1px solid var(--dash-border);
  }
  .data-table tr:last-child td { border-bottom: none; }
  .data-table tr { transition: background 0.15s; }
  .data-table tr:hover { background: var(--dash-bg); }

  /* Type Badges */
  .badge {
    padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase;
  }
  .badge.lead { background: rgba(230,126,34,0.1); color: #E67E22; }
  .badge.prospect { background: rgba(41,128,185,0.1); color: #2980B9; }
  .badge.customer { background: rgba(29,158,117,0.1); color: #1D9E75; }

  .action-wrap { display: flex; gap: 8px; }
  .action-btn {
    background: transparent; border: none; cursor: pointer;
    color: var(--dash-text-muted); padding: 4px; border-radius: 4px; transition: all 0.2s;
  }
  .action-btn:hover { background: var(--dash-border); color: var(--dash-text); }
  .action-btn.delete:hover { background: #FDEDEC; color: #E74C3C; }

  /* Modal Overlays */
  .modal-overlay {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.5); backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center; z-index: 999;
  }
  .modal-content {
    background: var(--dash-surface); border-radius: 12px; width: 440px;
    padding: 1.5rem; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    border: 1px solid var(--dash-border);
  }
  .modal-header { font-size: 18px; font-weight: 600; margin-bottom: 1.5rem; color: var(--dash-text); }
  
  .form-group { margin-bottom: 1rem; }
  .form-label { display: block; font-size: 12px; font-weight: 500; margin-bottom: 6px; color: var(--dash-text-muted); }
  .form-input, .form-select {
    width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--dash-border);
    background: var(--dash-bg); color: var(--dash-text); outline: none; font-size: 13px;
  }
  .form-input:focus { border-color: var(--dash-accent); }
  
  .modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 2rem; }
  .btn-ghost { padding: 8px 14px; background: transparent; border: none; cursor: pointer; color: var(--dash-text-muted); border-radius: 6px; font-size: 13px; }
  .btn-ghost:hover { background: var(--dash-bg); }
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
