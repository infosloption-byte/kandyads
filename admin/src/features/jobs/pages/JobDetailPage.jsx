import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock3, Package, Users, Truck, Wallet, CheckSquare } from 'lucide-react';
import { api } from '../../../api';
import './job-detail.css';
const money=v=>`LKR ${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const date=v=>v?new Date(v).toLocaleDateString():'—';
function Metric({label,value}){return <div className="job-metric"><span>{label}</span><strong>{value}</strong></div>}
function Section({title,icon:Icon,children}){return <section className="job-section"><div className="job-section-head"><h2>{title}</h2>{Icon&&<Icon size={17}/>}</div>{children}</section>}
export default function JobDetailPage(){
 const {id}=useParams();const [state,setState]=React.useState({loading:true,error:'',data:null});
 const load=React.useCallback(async()=>{setState({loading:true,error:'',data:null});try{const r=await api.getJob(id);const profit=await api.getJobProfitability(id);setState({loading:false,error:'',data:{...r.data,profitability:profit.data}})}catch(e){setState({loading:false,error:e.message||'Unable to load job',data:null})}},[id]);
 React.useEffect(()=>{load()},[load]);
 if(state.loading)return <div className="detail-state">Loading job…</div>; if(state.error)return <div className="detail-state error-state">{state.error}</div>;
 const j=state.data, p=j.profitability;
 return <div className="job-detail">
  <Link className="back-link" to="/jobs"><ArrowLeft size={15}/> Back to Jobs</Link>
  <div className="job-hero"><div><p className="eyebrow">JOB / {j.number}</p><h1>{j.title}</h1><p>{j.project?.name||'—'} · {j.project?.client?.companyName||'—'}</p></div><span className="table-status">{String(j.status).replaceAll('_',' ')}</span></div>
  <div className="job-metrics"><Metric label="Revenue" value={money(j.revenue)}/><Metric label="Estimated cost" value={money((Number(j.estimatedMaterial)+Number(j.estimatedLabour)+Number(j.estimatedOutsource)+Number(j.estimatedExpense)))}/><Metric label="Actual cost" value={money(p?.actual?.total)}/><Metric label="Margin" value={p?.marginPercent==null?'—':`${Number(p.marginPercent).toFixed(1)}%`}/></div>
  <div className="detail-grid-2">
   <Section title="Tasks" icon={CheckSquare}>{j.tasks?.length?j.tasks.map(t=><div className="related-row" key={t.id}><div><strong>{t.title}</strong><small>{t.employee?.name||'Unassigned'} · {t.status}</small></div><span>{t.estimatedHours||0}h planned</span></div>):<div className="empty-note">No tasks yet.</div>}</Section>
   <Section title="Assignments" icon={Users}>{j.assignments?.length?j.assignments.map(a=><div className="related-row" key={a.id}><div><strong>{a.employee?.name||a.vendor?.companyName||'Unassigned'}</strong><small>{a.employee?'Internal':'External'}</small></div><span>{a.estimatedHours||0}h</span></div>):<div className="empty-note">No assignments yet.</div>}</Section>
   <Section title="Material requirements" icon={Package}>{j.materialRequirements?.length?j.materialRequirements.map(m=><div className="related-row" key={m.id}><div><strong>{m.material?.name||'Material'}</strong><small>{m.material?.sku||''}</small></div><span>{m.requiredQty} required</span></div>):<div className="empty-note">No material requirements yet.</div>}</Section>
   <Section title="Outsourcing" icon={Truck}>{j.outsourceOrders?.length?j.outsourceOrders.map(o=><div className="related-row" key={o.id}><div><strong>{o.number}</strong><small>{o.vendor?.companyName||'Vendor'} · {o.status}</small></div><span>{money(o.agreedCost)}</span></div>):<div className="empty-note">No outsourcing orders.</div>}</Section>
   <Section title="Time & labour" icon={Clock3}><div className="summary-lines"><span>Hours recorded <b>{p?.hours||0}h</b></span><span>Labour cost <b>{money(p?.actual?.labour)}</b></span></div></Section>
   <Section title="Direct expenses" icon={Wallet}>{j.expenses?.length?j.expenses.map(e=><div className="related-row" key={e.id}><div><strong>{e.number}</strong><small>{e.category?.name||'Expense'} · {e.status}</small></div><span>{money(e.amount)}</span></div>):<div className="empty-note">No job expenses.</div>}</Section>
  </div>
  <div className="cost-card"><div><p className="eyebrow">ACTUAL COST</p><h2>{money(p?.actual?.total)}</h2></div><div><span>Material {money(p?.actual?.material)}</span><span>Labour {money(p?.actual?.labour)}</span><span>Outsource {money(p?.actual?.outsource)}</span><span>Expenses {money(p?.actual?.expense)}</span></div></div>
 </div>;
}
