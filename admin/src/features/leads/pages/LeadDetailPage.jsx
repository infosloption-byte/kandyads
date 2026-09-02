import React from 'react';
import { ArrowLeft, CalendarClock, Edit3, MessageSquare, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Modal from '../../../components/common/Modal';
import LeadForm from '../components/LeadForm';
import { api } from '../../../api';
import './lead-detail.css';

const date=v=>v?new Date(v).toLocaleString():'—';
const money=v=>v==null?'—':`LKR ${Number(v).toLocaleString()}`;

export default function LeadDetailPage(){
  const {id}=useParams();
  const [state,setState]=React.useState({loading:true,error:'',data:null,activity:[]});
  const [employees,setEmployees]=React.useState([]);const [clients,setClients]=React.useState([]);const [editing,setEditing]=React.useState(false);const [saving,setSaving]=React.useState(false);const [note,setNote]=React.useState('');const [addingNote,setAddingNote]=React.useState(false);const [notice,setNotice]=React.useState('');
  const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const [lead,e,c]=await Promise.all([api.getLead(id),api.listEmployees(),api.listClients()]);setState({loading:false,error:'',data:lead.data,activity:lead.activity||[]});setEmployees(e.data||[]);setClients(c.data||[]);}catch(err){setState({loading:false,error:err.message||'Unable to load lead',data:null,activity:[]});}},[id]);
  React.useEffect(()=>{load()},[load]);
  async function save(input){setSaving(true);try{const r=await api.updateLead(id,input);setEditing(false);setState(s=>({...s,data:{...s.data,...r.data}}));setNotice('Lead updated.');}catch(e){throw e}finally{setSaving(false)}}
  async function addNote(e){e.preventDefault();if(!note.trim())return;setAddingNote(true);try{await api.addLeadNote(id,{note});setNote('');setNotice('Note added.');await load()}catch(err){setNotice(err.message||'Unable to add note.')}finally{setAddingNote(false)}}
  if(state.loading)return <div className="detail-state">Loading lead…</div>;
  if(state.error)return <div className="detail-state error-state">{state.error}</div>;
  const l=state.data;
  const notes=state.activity.filter(a=>a.action==='NOTE_ADDED');
  return <div className="lead-detail"><Link className="back-link" to="/leads"><ArrowLeft size={15}/> Back to Leads</Link><div className="lead-hero"><div><p className="eyebrow">SALES / LEAD #{l.id}</p><h1>{l.name}</h1><p>{l.company||'No company'} · {l.email||l.phone||'No contact detail'}</p></div><div className="page-actions"><span className="table-status">{l.status}</span><button className="secondary" onClick={()=>setEditing(true)}><Edit3 size={15}/> Edit lead</button></div></div>
    {notice&&<div className="lead-notice">{notice}</div>}
    <div className="lead-info-grid"><div><span>Company</span><strong>{l.company||'—'}</strong></div><div><span>Owner</span><strong>{l.assignedTo?.name||'Unassigned'}</strong></div><div><span>Source</span><strong>{l.source||'—'}</strong></div><div><span>Estimated value</span><strong>{money(l.estimatedValue)}</strong></div><div><span>Follow-up</span><strong>{date(l.followUpAt)}</strong></div><div><span>Client</span><strong>{l.client?.companyName||'Not converted'}</strong></div></div>
    <section className="lead-section"><div className="lead-section-head"><h2>Requirement</h2><UserRound size={18}/></div><p>{l.requirement||'No requirement recorded.'}</p></section>
    <section className="lead-section"><div className="lead-section-head"><h2>Notes</h2><MessageSquare size={18}/></div><form onSubmit={addNote} className="lead-note-form"><textarea value={note} onChange={e=>setNote(e.target.value)} rows="3" placeholder="Add a sales follow-up note…"/><div><button className="primary" disabled={addingNote}>{addingNote?'Adding…':'Add note'}</button></div></form>{notes.length===0?<div className="empty-note">No notes yet.</div>:notes.map(n=><div className="lead-note" key={String(n.id)}><div>{n.afterJson?.note||'—'}</div><small>{n.user?.name||'System'} · {date(n.createdAt)}</small></div>)}</section>
    <section className="lead-section"><div className="lead-section-head"><h2>Activity</h2><CalendarClock size={18}/></div>{state.activity.length===0?<div className="empty-note">No activity recorded.</div>:state.activity.map(a=><div className="lead-activity" key={String(a.id)}><strong>{a.action.replaceAll('_',' ')}</strong><span>{a.user?.name||'System'} · {date(a.createdAt)}</span></div>)}</section>
    <Modal open={editing} title="Edit lead" description={`Update ${l.name}.`} onClose={()=>setEditing(false)} width="760px"><LeadForm employees={employees} clients={clients} initialValues={l} editing onSubmit={save} onCancel={()=>setEditing(false)} submitting={saving}/></Modal>
  </div>;
}
