"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/app/store/authStore";

const detailStyles = `
  .split-layout {
    display: flex; gap: 2rem; align-items: flex-start;
  }
  .left-col { flex: 1; max-width: 350px; }
  .right-col { flex: 2; }

  .crm-card {
    background: var(--dash-surface);
    border: 1px solid var(--dash-border);
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
    margin-bottom: 1.5rem;
  }
  
  /* Left Col Profile */
  .profile-header { display: flex; align-items: center; gap: 14px; margin-bottom: 1.5rem; }
  .avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--dash-accent-light); color: var(--dash-accent); display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: 600; text-transform: uppercase; }
  .profile-name { font-size: 20px; font-weight: 600; color: var(--dash-text); margin: 0 0 4px 0; }
  .profile-type { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; display: inline-block; background: rgba(29,158,117,0.1); color: var(--dash-accent); }
  
  .info-list { list-style: none; margin: 0; padding: 0; }
  .info-item { display: flex; flex-direction: column; margin-bottom: 1rem; }
  .info-label { font-size: 11px; font-weight: 600; color: var(--dash-text-hint); text-transform: uppercase; margin-bottom: 4px; }
  .info-value { font-size: 14px; color: var(--dash-text); }

  /* Right Col Timeline */
  .timeline-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
  .timeline-title { font-size: 18px; font-weight: 600; color: var(--dash-text); }
  .timeline-actions { display: flex; gap: 8px; }
  
  .btn-sm {
    padding: 8px 12px; background: var(--dash-bg); color: var(--dash-text); border: 1px solid var(--dash-border); border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: 0.15s;
  }
  .btn-sm:hover { background: var(--dash-accent); color: #fff; border-color: var(--dash-accent); }

  .timeline {
    position: relative; margin-top: 1rem; padding-left: 20px;
  }
  .timeline::before {
    content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--dash-border);
  }
  .log-item { position: relative; margin-bottom: 1.5rem; }
  .log-dot {
    position: absolute; left: -25px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: var(--dash-accent); border: 2px solid var(--dash-surface);
  }
  .log-dot.call { background: #E67E22; }
  .log-dot.email { background: #2980B9; }
  
  .log-content { background: var(--dash-bg); padding: 12px 16px; border-radius: 8px; border: 1px solid var(--dash-border); }
  .log-head { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .log-subj { font-weight: 600; font-size: 13px; color: var(--dash-text); }
  .log-time { font-size: 11px; color: var(--dash-text-hint); }
  .log-body { font-size: 13px; color: var(--dash-text-muted); line-height: 1.5; white-space: pre-wrap; }

  /* Generic UI */
  .back-link { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; color: var(--dash-text-muted); text-decoration: none; margin-bottom: 1.5rem; cursor: pointer; transition: 0.15s; }
  .back-link:hover { color: var(--dash-accent); }
  
  .form-input, .form-textarea {
    width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--dash-border); background: var(--dash-bg); color: var(--dash-text); outline: none; font-size: 13px; margin-bottom: 12px;
  }
  .form-textarea { resize: vertical; min-height: 80px; }
`;

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  
  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Note Modal State
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteForm, setNoteForm] = useState({ type: "note", subject: "", body: "" });
  const [savingNote, setSavingNote] = useState(false);

  const fetchContact = async () => {
    try {
      const res = await fetch(`/api/contacts/${resolvedParams.id}`);
      const json = await res.json();
      if (json.success) setContact(json.data);
      else router.push("/dashboard/contacts");
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchContact(); }, [resolvedParams.id]);

  const handlePostNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNote(true);
    try {
      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          companyId: user?.company_id, 
          contactId: contact.id,
          ...noteForm 
        })
      });
      if(res.ok) {
        setNoteForm({ type: "note", subject: "", body: "" });
        setNoteOpen(false);
        fetchContact(); // Refresh timeline
      }
    } catch(err) { console.error(err); }
    finally { setSavingNote(false); }
  };

  if (loading) return <div style={{padding:'2rem'}}>Loading profile...</div>;
  if (!contact) return null;

  return (
    <>
      <style>{detailStyles}</style>
      <div>
        <div className="back-link" onClick={() => router.push("/dashboard/contacts")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Directory
        </div>

        <div className="split-layout">
          {/* Left: Contact Info */}
          <div className="left-col">
            <div className="crm-card">
              <div className="profile-header">
                <div className="avatar">
                  {contact.name.charAt(0)}
                </div>
                <div>
                  <h1 className="profile-name">{contact.name}</h1>
                  <div className="profile-type">{contact.type}</div>
                </div>
              </div>
              
              <ul className="info-list">
                <li className="info-item">
                  <span className="info-label">Email</span>
                  <span className="info-value">{contact.email || "—"}</span>
                </li>
                <li className="info-item">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{contact.phone || "—"}</span>
                </li>
                <li className="info-item">
                  <span className="info-label">Organization</span>
                  <span className="info-value">{contact.companyName || "—"}</span>
                </li>
                <li className="info-item">
                  <span className="info-label">Date Added</span>
                  <span className="info-value">{new Date(contact.createdAt).toLocaleDateString()}</span>
                </li>
              </ul>
            </div>
            
            {/* Note Entry Block */}
            <div className="crm-card">
              <h3 style={{fontSize:'14px', margin:'0 0 1rem 0'}}>Quick Log</h3>
              <form onSubmit={handlePostNote}>
                <div style={{display:'flex', gap:'8px', marginBottom:'12px'}}>
                  <select className="form-input" style={{flex:1, marginBottom:0}} value={noteForm.type} onChange={e => setNoteForm({...noteForm, type: e.target.value})}>
                    <option value="note">Note</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
                <input required className="form-input" type="text" placeholder="Subject..." value={noteForm.subject} onChange={e => setNoteForm({...noteForm, subject: e.target.value})} />
                <textarea className="form-textarea" placeholder="Details or meeting notes..." value={noteForm.body} onChange={e => setNoteForm({...noteForm, body: e.target.value})} />
                <button type="submit" className="btn-sm" style={{width:'100%', justifyContent:'center'}} disabled={savingNote}>
                  {savingNote ? "Saving..." : "Save Log"}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Timeline Feed */}
          <div className="right-col">
            <div className="crm-card">
              <div className="timeline-header">
                <h2 className="timeline-title">Activity Timeline</h2>
              </div>
              
              {contact.activities && contact.activities.length > 0 ? (
                <div className="timeline">
                  {contact.activities.map((act: any) => (
                    <div className="log-item" key={act.id}>
                      <div className={`log-dot ${act.type}`}></div>
                      <div className="log-content">
                        <div className="log-head">
                          <span className="log-subj">
                            {act.type.toUpperCase()}: {act.subject}
                          </span>
                          <span className="log-time">
                            {new Date(act.createdAt).toLocaleString(undefined, {
                              month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                            })}
                          </span>
                        </div>
                        {act.body && <div className="log-body">{act.body}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{textAlign:'center', padding: '3rem 1rem', color:'var(--dash-text-muted)', fontSize:'13px'}}>
                  No activities logged yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
