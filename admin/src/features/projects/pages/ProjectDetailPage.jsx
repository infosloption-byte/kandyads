import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, Edit3, FileText, Receipt, RefreshCw, ShoppingCart, Truck, Wallet } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ProjectForm from '../components/ProjectForm';
import './project-detail.css';

const money = (v) => `LKR ${Number(v || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const date = (v) => v ? new Date(v).toLocaleDateString() : '—';
const statusOptions=['PLANNED','ACTIVE','ON_HOLD','COMPLETED','CANCELLED'];

function Metric({label,value}){return <div className="project-metric"><span>{label}</span><strong>{value}</strong></div>}
function Section({title,icon:Icon,children}){return <section className="project-section"><div className="project-section-head"><div><p>{title}</p></div>{Icon&&<Icon size={18}/>}</div>{children}</section>}

export default function ProjectDetailPage(){
  const {id}=useParams(); const [state,setState]=React.useState({loading:true,error:'',data:null}); const [activity,setActivity]=React.useState([]); const [editOpen,setEditOpen]=React.useState(false); const [saving,setSaving]=React.useState(false); const [statusSaving,setStatusSaving]=React.useState(false); const [activityLoading,setActivityLoading]=React.useState(true); const [actionError,setActionError]=React.useState('');
  const load=React.useCallback(async()=>{setState({loading:true,error:'',data:null});try{const r=await api.getProject(id);setState({loading:false,error:'',data:r.data})}catch(e){setState({loading:false,error:e.message||'Unable to load project',data:null})}},[id]);
  const loadActivity=React.useCallback(async()=>{setActivityLoading(true);try{const r=await api.getProjectActivity(id);setActivity(r.data||[])}catch(e){setActivity([]);setActionError(e.message||'Unable to load activity')}finally{setActivityLoading(false)}},[id]);
  React.useEffect(()=>{load();loadActivity()},[load,loadActivity]);
  async function saveProject(input){setSaving(true);setActionError('');try{await api.updateProject(id,input);setEditOpen(false);await Promise.all([load(),loadActivity()])}catch(e){setActionError(e.message||'Unable to save project')}finally{setSaving(false)}}
  async function changeStatus(e){const status=e.target.value;if(!status||status===state.data.status)return;setStatusSaving(true);setActionError('');try{await api.updateProjectStatus(id,{status});await Promise.all([load(),loadActivity()])}catch(e){setActionError(e.message||'Unable to change project status')}finally{setStatusSaving(false)}}
  if(state.loading)return <div className="detail-state">Loading project…</div>;
  if(state.error)return <div className="detail-state error-state">{state.error}</div>;
  const p=state.data; const editable=!['COMPLETED','CANCELLED'].includes(p.status);
  return <div className="project-detail">
    <Link className="back-link" to="/projects"><ArrowLeft size={15}/> Back to Projects</Link>
    <div className="project-hero"><div><p className="eyebrow">PROJECT / {p.number}</p><h1>{p.name}</h1><p>{p.client?.companyName||'—'} · {p.client?.contactName||'No contact'}</p></div><div className="project-actions"><select aria-label="Project status" value={p.status} onChange={changeStatus} disabled={statusSaving||['COMPLETED','CANCELLED'].includes(p.status)}>{statusOptions.map(s=><option key={s} value={s}>{s.replaceAll('_',' ')}</option>)}</select>{editable&&<button className="secondary" onClick={()=>setEditOpen(true)}><Edit3 size={15}/> Edit</button>}<button className="icon-button" onClick={()=>{load();loadActivity()}} aria-label="Refresh project"><RefreshCw size={16}/></button></div></div>
    {actionError&&<div className="form-error project-action-error">{actionError}</div>}
    <div className="project-metrics"><Metric label="Project value" value={money(p.value)}/><Metric label="Jobs" value={p.jobs?.length||0}/><Metric label="Invoices" value={p.invoices?.length||0}/><Metric label="Due" value={date(p.dueDate)}/></div>
    <div className="detail-grid-2">
      <Section title="Jobs" icon={BriefcaseBusiness}>{p.jobs?.length ? p.jobs.map(j=><Link className="related-row" key={j.id} to={`/jobs/${j.id}`}><div><strong>{j.number}</strong><small>{j.title} · {j.status}</small></div><span>{money(j.revenue)}</span></Link>) : <div className="empty-note">No jobs created yet.</div>}</Section>
      <Section title="Invoices" icon={Receipt}>{p.invoices?.length ? p.invoices.map(i=><div className="related-row" key={i.id}><div><strong>{i.number}</strong><small>{date(i.invoiceDate)} · {i.status}</small></div><span>{money(i.total)}</span></div>) : <div className="empty-note">No invoices yet.</div>}</Section>
      <Section title="Purchasing" icon={ShoppingCart}><div className="summary-lines"><span>Purchase requests <b>{p.purchaseRequests?.length||0}</b></span><span>Purchase orders <b>{p.purchaseOrders?.length||0}</b></span></div></Section>
      <Section title="Field operations" icon={Truck}>{p.installations?.length ? p.installations.map(i=><div className="related-row" key={i.id}><div><strong>{i.number}</strong><small>{i.siteAddress}</small></div><span>{i.status}</span></div>) : <div className="empty-note">No installation orders yet.</div>}</Section>
      <Section title="Expenses" icon={Wallet}>{p.expenses?.length ? p.expenses.map(e=><div className="related-row" key={e.id}><div><strong>{e.number}</strong><small>{e.category?.name||'Expense'}</small></div><span>{money(e.amount)}</span></div>) : <div className="empty-note">No project-level expenses.</div>}</Section>
      <Section title="Dates & ownership" icon={CalendarDays}><div className="summary-lines"><span>Start date <b>{date(p.startDate)}</b></span><span>Due date <b>{date(p.dueDate)}</b></span><span>Owner <b>{p.owner?.name||'Unassigned'}</b></span></div></Section>
      <Section title="Activity history" icon={CalendarDays}>{activityLoading?<div className="empty-note">Loading activity…</div>:activity.length?activity.map(entry=><div className="related-row" key={entry.id}><div><strong>{String(entry.action).replaceAll('_',' ')}</strong><small>{date(entry.createdAt)} · {entry.user?.name||entry.user?.email||'System'}</small></div><span>Project</span></div>):<div className="empty-note">No recorded activity yet.</div>}</Section>
    </div>
    <div className="project-quick-links"><Link to={`/profitability?projectId=${p.id}`}><FileText size={15}/> View profitability</Link></div>
    <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="Edit project" description="Update project identity, ownership, dates and value." width="760px"><ProjectForm project={p} onSubmit={saveProject} onCancel={()=>setEditOpen(false)} submitting={saving}/></Modal>
  </div>;
}
