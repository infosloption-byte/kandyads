import React from 'react';
import { ArrowLeft, Edit3, FileText, History, UserRound, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import EnquiryForm from '../components/EnquiryForm';
import EnquiryQuoteForm from '../components/EnquiryQuoteForm';
import './enquiry-detail.css';

const date = (v) => v ? new Date(v).toLocaleDateString() : '—';
const dateTime = (v) => v ? new Date(v).toLocaleString() : '—';
const statusOptions = {
  OPEN: ['QUOTING','CLOSED'],
  QUOTING: ['CONVERTED','CLOSED'],
  CONVERTED: [],
  CLOSED: [],
};

function Section({title,icon:Icon,children}){return <section className="enquiry-section"><div className="enquiry-section-head"><h2>{title}</h2>{Icon&&<Icon size={18}/>}</div>{children}</section>}

export default function EnquiryDetailPage(){
  const {id}=useParams();
  const [state,setState]=React.useState({loading:true,error:'',data:null});
  const [activity,setActivity]=React.useState([]);
  const [editing,setEditing]=React.useState(false);
  const [converting,setConverting]=React.useState(false);
  const [status,setStatus]=React.useState('');
  const [saving,setSaving]=React.useState(false);
  const [notice,setNotice]=React.useState('');
  const load=React.useCallback(async()=>{setState({loading:true,error:'',data:null});try{const [detail,history]=await Promise.all([api.getEnquiry(id),api.getEnquiryActivity(id)]);setState({loading:false,error:'',data:detail.data});setActivity(history.data||[])}catch(e){setState({loading:false,error:e.message||'Unable to load enquiry',data:null})}},[id]);
  React.useEffect(()=>{load()},[load]);
  async function save(input){setSaving(true);try{const r=await api.updateEnquiry(id,input);setEditing(false);setState(s=>({...s,data:{...s.data,...r.data}}));await load();}finally{setSaving(false)}}
  async function changeStatus(next){if(!next)return;setSaving(true);setNotice('');try{await api.updateEnquiryStatus(id,{status:next});setStatus('');setNotice(`Enquiry moved to ${next.replaceAll('_',' ')}.`);await load()}catch(e){setNotice(e.message||'Unable to update status.')}finally{setSaving(false)}}
  async function createQuote(input){setSaving(true);setNotice('');try{const result=await api.convertEnquiryToQuote(id,input);setConverting(false);setNotice(`Converted to quote ${result.data.number}.`);await load()}catch(e){setNotice(e.message||'Unable to create quote.')}finally{setSaving(false)}}
  if(state.loading)return <div className="detail-state">Loading enquiry…</div>;
  if(state.error)return <div className="detail-state error-state">{state.error}</div>;
  const e=state.data;
  const nextStatuses=statusOptions[e.status]||[];
  return <div className="enquiry-detail">
    <Link className="back-link" to="/enquiries"><ArrowLeft size={15}/> Back to Enquiries</Link>
    <div className="enquiry-hero"><div><p className="eyebrow">SALES / {e.number}</p><h1>{e.client?.companyName||'Enquiry'}</h1><p>{e.requirement}</p></div><div className="page-actions"><span className="table-status">{e.status.replaceAll('_',' ')}</span>{e.status!=='CLOSED'&&e.status!=='CONVERTED'&&<button className="secondary" onClick={()=>setEditing(true)}><Edit3 size={15}/> Edit</button>}{nextStatuses.length>0&&<select value={status} onChange={ev=>{setStatus(ev.target.value);changeStatus(ev.target.value)}} disabled={saving}><option value="">Change status…</option>{nextStatuses.map(v=><option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}</select>}</div></div>
    {notice&&<div className="enquiry-notice">{notice}</div>}
    <div className="enquiry-info-grid">
      <div><span>Client</span><strong>{e.client?.companyName||'—'}</strong></div>
      <div><span>Source</span><strong>{e.source||'—'}</strong></div>
      <div><span>Priority</span><strong>{e.priority||'—'}</strong></div>
      <div><span>Target date</span><strong>{date(e.targetDate)}</strong></div>
      <div><span>Site / location</span><strong>{e.siteLocation||'—'}</strong></div>
      <div><span>Created</span><strong>{dateTime(e.createdAt)}</strong></div>
    </div>
    <Section title="Requirement" icon={FileText}><p className="enquiry-requirement">{e.requirement}</p></Section>
    <Section title="Quotation" icon={FileText}>{e.quote?<div className="enquiry-quote-card"><div><strong>{e.quote.number}</strong><small>{e.quote.status} · {date(e.quote.createdAt)}</small></div><div className="enquiry-quote-right"><strong>LKR {Number(e.quote.total||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</strong><Link className="secondary compact" to={`/quotes/${e.quote.id}`}><ArrowRight size={14}/> Open quote</Link></div></div>:['OPEN','QUOTING'].includes(e.status)?<button className="primary" onClick={()=>setConverting(true)}><ArrowRight size={15}/> Create quotation</button>:<div className="empty-note">No quotation linked.</div>}</Section>
    <Section title="Activity" icon={History}>{activity.length?activity.map(a=><div className="activity-row" key={String(a.id)}><div><strong>{a.action.replaceAll('_',' ')}</strong><small>{a.user?.name||a.user?.email||'System'} · {dateTime(a.createdAt)}</small></div><span>{a.afterJson?.status||''}</span></div>):<div className="empty-note">No activity recorded yet.</div>}</Section>
    <Modal open={editing} title="Edit enquiry" description={`Update ${e.number}.`} onClose={()=>setEditing(false)} width="760px"><EnquiryForm initialValues={e} editing onSubmit={save} onCancel={()=>setEditing(false)} submitting={saving}/></Modal>
    <Modal open={converting} title="Create quote from enquiry" description={`${e.number} · ${e.client?.companyName||''}`} onClose={()=>setConverting(false)} width="820px"><EnquiryQuoteForm enquiry={e} onSubmit={createQuote} onCancel={()=>setConverting(false)} submitting={saving}/></Modal>
  </div>;
}
