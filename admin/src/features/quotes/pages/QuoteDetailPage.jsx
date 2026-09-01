import React from 'react';
import { ArrowLeft, CheckCircle2, Download, Edit3, FolderKanban, Share2, XCircle } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import QuoteForm from '../components/QuoteForm';
import './quote-detail.css';

const money = v => `LKR ${Number(v || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const date = v => v ? new Date(v).toLocaleDateString() : '—';

export default function QuoteDetailPage(){
  const {id}=useParams(); const navigate=useNavigate();
  const [state,setState]=React.useState({loading:true,error:'',data:null});
  const [audit,setAudit]=React.useState([]); const [editing,setEditing]=React.useState(false); const [saving,setSaving]=React.useState(false); const [busy,setBusy]=React.useState(false); const [message,setMessage]=React.useState('');
  const load=React.useCallback(async()=>{setState({loading:true,error:'',data:null});try{const [quote,a]=await Promise.all([api.getQuote(id),api.getApprovalAudit({entity:'Quote',entityId:id})]);setState({loading:false,error:'',data:quote.data});setAudit(a.data||[])}catch(e){setState({loading:false,error:e.message||'Unable to load quote',data:null})}},[id]);
  React.useEffect(()=>{load()},[load]);
  async function save(input){setSaving(true);try{await api.updateQuote(id,input);setEditing(false);await load()}catch(e){setMessage(e.message||'Unable to save quote.')}finally{setSaving(false)}}
  async function changeStatus(status){const reason=status==='REJECTED'?window.prompt('Reason for client rejection (optional):')||undefined:status==='ACCEPTED'?window.prompt('Client approval note (optional):')||undefined:undefined;setBusy(true);setMessage('');try{await api.updateQuoteStatus(id,{status,reason});await load()}catch(e){setMessage(e.message||'Unable to update quote status.')}finally{setBusy(false)}}
  async function openPdf(){setBusy(true);setMessage('');try{const url=await api.downloadQuotePdf(id);window.open(url,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e){setMessage(e.message||'Unable to generate PDF.')}finally{setBusy(false)}}
  async function sharePdf(){setBusy(true);setMessage('');try{const shared=await api.shareQuotePdf(id,state.data?.number);if(!shared)setMessage('Native file sharing is not available here. Use PDF to open the quotation, then share it from your PDF viewer.')}catch(e){if(e?.name!=='AbortError')setMessage(e.message||'Unable to share PDF.')}finally{setBusy(false)}}
  async function convert(){setBusy(true);setMessage('');try{const result=await api.convertQuoteToProject(id,{});navigate(`/projects/${result.data.id}`)}catch(e){setMessage(e.message||'Unable to convert quote.')}finally{setBusy(false)}}
  if(state.loading)return <div className="detail-state">Loading quote…</div>;
  if(state.error)return <div className="detail-state error-state">{state.error}</div>;
  const q=state.data; const editable=['DRAFT','SENT','VIEWED'].includes(q.status); const canConvert=q.status==='ACCEPTED'&&!q.project;
  return <div className="quote-detail">
    <Link className="back-link" to="/quotes"><ArrowLeft size={15}/> Back to Quotes</Link>
    <div className="quote-hero"><div><p className="eyebrow">QUOTE / {q.number}</p><h1>{q.client?.companyName||'—'}</h1><p>{q.client?.contactName||'No contact'} · {q.client?.email||'No email'}</p></div><span className="table-status">{q.status}</span></div>
    {message&&<div className="form-error quote-message">{message}</div>}
    <div className="quote-actions"><button className="secondary" onClick={openPdf} disabled={busy}><Download size={16}/> PDF</button><button className="secondary" onClick={sharePdf} disabled={busy}><Share2 size={16}/> Share</button>{editable&&<button className="secondary" onClick={()=>setEditing(true)} disabled={busy}><Edit3 size={16}/> Edit</button>}{q.status!=='ACCEPTED'&&q.status!=='REJECTED'&&q.status!=='CANCELLED'&&<><button className="secondary" onClick={()=>changeStatus('REJECTED')} disabled={busy}><XCircle size={16}/> Reject</button><button className="primary" onClick={()=>changeStatus('ACCEPTED')} disabled={busy}><CheckCircle2 size={16}/> Client Accepted</button></>}{canConvert&&<button className="primary" onClick={convert} disabled={busy}><FolderKanban size={16}/> Convert to Project</button>}{q.project&&<Link className="secondary action-link" to={`/projects/${q.project.id}`}>Open Project</Link>}</div>
    <div className="quote-grid">
      <section className="panel quote-card"><div className="panel-head"><div><span>CLIENT</span><h2>Quote details</h2></div></div><div className="detail-list"><span><b>Client</b>{q.client?.companyName||'—'}</span><span><b>Contact</b>{q.client?.contactName||'—'}</span><span><b>Phone</b>{q.client?.phone||'—'}</span><span><b>Email</b>{q.client?.email||'—'}</span><span><b>Valid until</b>{date(q.validUntil)}</span><span><b>Enquiry</b>{q.enquiry?.number||'—'}</span></div></section>
      <section className="panel quote-card"><div className="panel-head"><div><span>FINANCIALS</span><h2>Quote economics</h2></div></div><div className="detail-list"><span><b>Subtotal</b>{money(q.subtotal)}</span><span><b>Discount</b>{money(q.discount)}</span><span><b>Tax</b>{money(q.tax)}</span><span><b>Total</b>{money(q.total)}</span><span><b>Expected margin</b>{money(q.expectedMargin)}</span></div></section>
    </div>
    <section className="panel quote-card"><div className="panel-head"><div><span>LINE ITEMS</span><h2>Services & pricing</h2></div></div><div className="quote-lines"><div className="quote-line quote-line-head"><span>Description</span><span>Qty</span><span>Rate</span><span>Total</span></div>{q.items?.map(item=><div className="quote-line" key={item.id}><div><strong>{item.description}</strong><small>{item.service?.name||item.unit}</small></div><span>{Number(item.quantity).toLocaleString()} {item.unit}</span><span>{money(item.rate)}</span><strong>{money(item.total)}</strong></div>)}</div></section>
    <section className="panel quote-card"><div className="panel-head"><div><span>CLIENT DECISION HISTORY</span><h2>Approval / status audit</h2></div></div>{audit.length?<div className="audit-list">{audit.map(item=><div className="audit-row" key={String(item.id)}><div><strong>{item.action.replaceAll('_',' ')}</strong><small>{item.user?.name||'System'} · {new Date(item.createdAt).toLocaleString()}</small></div><span>{item.afterJson?.reason||item.afterJson?.status||'—'}</span></div>)}</div>:<div className="empty-note">No decision history recorded yet.</div>}</section>
    <Modal open={editing} onClose={()=>setEditing(false)} title={`Edit quote ${q.number}`} description="Update pricing, expected costs and line items before client acceptance." width="980px"><QuoteForm initialQuote={q} onSubmit={save} onCancel={()=>setEditing(false)} submitting={saving}/></Modal>
  </div>;
}
