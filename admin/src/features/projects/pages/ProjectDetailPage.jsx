import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, CalendarDays, FileText, Receipt, ShoppingCart, Truck, Wallet } from 'lucide-react';
import { api } from '../../../api';
import './project-detail.css';

const money = (v) => `LKR ${Number(v || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const date = (v) => v ? new Date(v).toLocaleDateString() : '—';

function Metric({label,value}){return <div className="project-metric"><span>{label}</span><strong>{value}</strong></div>}
function Section({title,icon:Icon,children}){return <section className="project-section"><div className="project-section-head"><div><p>{title}</p></div>{Icon&&<Icon size={18}/>}</div>{children}</section>}

export default function ProjectDetailPage(){
  const {id}=useParams(); const [state,setState]=React.useState({loading:true,error:'',data:null});
  const load=React.useCallback(async()=>{setState({loading:true,error:'',data:null});try{const r=await api.getProject(id);setState({loading:false,error:'',data:r.data})}catch(e){setState({loading:false,error:e.message||'Unable to load project',data:null})}},[id]);
  React.useEffect(()=>{load()},[load]);
  if(state.loading)return <div className="detail-state">Loading project…</div>;
  if(state.error)return <div className="detail-state error-state">{state.error}</div>;
  const p=state.data;
  return <div className="project-detail">
    <Link className="back-link" to="/projects"><ArrowLeft size={15}/> Back to Projects</Link>
    <div className="project-hero"><div><p className="eyebrow">PROJECT / {p.number}</p><h1>{p.name}</h1><p>{p.client?.companyName||'—'} · {p.client?.contactName||'No contact'}</p></div><span className="table-status">{String(p.status).replaceAll('_',' ')}</span></div>
    <div className="project-metrics"><Metric label="Project value" value={money(p.value)}/><Metric label="Jobs" value={p.jobs?.length||0}/><Metric label="Invoices" value={p.invoices?.length||0}/><Metric label="Due" value={date(p.dueDate)}/></div>
    <div className="detail-grid-2">
      <Section title="Jobs" icon={BriefcaseBusiness}>{p.jobs?.length ? p.jobs.map(j=><Link className="related-row" key={j.id} to={`/jobs/${j.id}`}><div><strong>{j.number}</strong><small>{j.title}</small></div><span>{money(j.revenue)}</span></Link>) : <div className="empty-note">No jobs created yet.</div>}</Section>
      <Section title="Invoices" icon={Receipt}>{p.invoices?.length ? p.invoices.map(i=><div className="related-row" key={i.id}><div><strong>{i.number}</strong><small>{date(i.invoiceDate)} · {i.status}</small></div><span>{money(i.total)}</span></div>) : <div className="empty-note">No invoices yet.</div>}</Section>
      <Section title="Purchasing" icon={ShoppingCart}><div className="summary-lines"><span>Purchase requests <b>{p.purchaseRequests?.length||0}</b></span><span>Purchase orders <b>{p.purchaseOrders?.length||0}</b></span></div></Section>
      <Section title="Field operations" icon={Truck}>{p.installations?.length ? p.installations.map(i=><div className="related-row" key={i.id}><div><strong>{i.number}</strong><small>{i.siteAddress}</small></div><span>{i.status}</span></div>) : <div className="empty-note">No installation orders yet.</div>}</Section>
      <Section title="Expenses" icon={Wallet}>{p.expenses?.length ? p.expenses.map(e=><div className="related-row" key={e.id}><div><strong>{e.number}</strong><small>{e.category?.name||'Expense'}</small></div><span>{money(e.amount)}</span></div>) : <div className="empty-note">No project-level expenses.</div>}</Section>
      <Section title="Timeline" icon={CalendarDays}><div className="summary-lines"><span>Start date <b>{date(p.startDate)}</b></span><span>Due date <b>{date(p.dueDate)}</b></span><span>Owner <b>{p.owner?.name||'Unassigned'}</b></span></div></Section>
    </div>
    <div className="project-quick-links"><Link to={`/profitability?projectId=${p.id}`}><FileText size={15}/> View profitability</Link></div>
  </div>;
}
