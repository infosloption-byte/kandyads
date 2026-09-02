import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BriefcaseBusiness, Edit3, FileText, Receipt, Wallet, Paperclip, Plus, ExternalLink } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ClientForm from '../components/ClientForm';
import ClientDocumentForm from '../components/ClientDocumentForm';
import './client-detail.css';

const money = (v) => `LKR ${Number(v || 0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;
const date = (v) => v ? new Date(v).toLocaleDateString() : '—';
function Section({title,icon:Icon,action,children}){return <section className="client-section"><div className="client-section-head"><h2>{title}</h2><div className="section-head-actions">{action}{Icon&&<Icon size={18}/>}</div></div>{children}</section>}
function Row({children,to}){const content=<div className="client-related-row">{children}</div>;return to?<Link className="client-related-link" to={to}>{content}</Link>:content;}

export default function ClientDetailPage(){
  const {id}=useParams();
  const [state,setState]=React.useState({loading:true,error:'',data:null});
  const [documents,setDocuments]=React.useState({loading:true,error:'',items:[]});
  const [editing,setEditing]=React.useState(false); const [addingDocument,setAddingDocument]=React.useState(false); const [saving,setSaving]=React.useState(false); const [documentSaving,setDocumentSaving]=React.useState(false);
  const load=React.useCallback(async()=>{setState({loading:true,error:'',data:null});try{const r=await api.getClient(id);setState({loading:false,error:'',data:r.data})}catch(e){setState({loading:false,error:e.message||'Unable to load client',data:null})}},[id]);
  const loadDocuments=React.useCallback(async()=>{setDocuments({loading:true,error:'',items:[]});try{const r=await api.listAttachments('CLIENT',id);setDocuments({loading:false,error:'',items:r.data||[]})}catch(e){setDocuments({loading:false,error:e.message||'Unable to load documents',items:[]})}},[id]);
  React.useEffect(()=>{load();loadDocuments()},[load,loadDocuments]);
  async function save(input){setSaving(true);try{const r=await api.updateClient(id,input);setEditing(false);setState(s=>({...s,data:{...s.data,...r.data}}));}catch(e){throw e}finally{setSaving(false)}}
  async function addDocument(input){setDocumentSaving(true);try{await api.createAttachment(input);setAddingDocument(false);await loadDocuments()}catch(e){throw e}finally{setDocumentSaving(false)}}
  if(state.loading)return <div className="detail-state">Loading client…</div>;
  if(state.error)return <div className="detail-state error-state">{state.error}</div>;
  const c=state.data;
  const outstanding=(c.invoices||[]).reduce((sum,i)=>sum+Number(i.balance||0),0);
  return <div className="client-detail">
    <Link className="back-link" to="/clients"><ArrowLeft size={15}/> Back to Clients</Link>
    <div className="client-hero"><div><p className="eyebrow">CRM / {c.code}</p><h1>{c.companyName}</h1><p>{c.contactName||'No primary contact'} · {c.industry||'Industry not set'}</p></div><div className="page-actions"><span className="table-status">{c.active?'Active':'Inactive'}</span><button className="secondary" onClick={()=>setEditing(true)}><Edit3 size={15}/> Edit client</button></div></div>
    <div className="client-info-grid">
      <div><span>Contact</span><strong>{c.contactName||'—'}</strong></div><div><span>Phone</span><strong>{c.phone||'—'}</strong></div><div><span>WhatsApp</span><strong>{c.whatsapp||'—'}</strong></div><div><span>Email</span><strong>{c.email||'—'}</strong></div><div><span>Address</span><strong>{c.address||'—'}</strong></div><div><span>Payment terms</span><strong>{c.paymentTerms||'—'}</strong></div><div><span>Credit limit</span><strong>{c.creditLimit == null ? '—' : money(c.creditLimit)}</strong></div><div><span>Outstanding invoices</span><strong>{money(outstanding)}</strong></div>
    </div>
    <Section title="Projects" icon={BriefcaseBusiness}>{c.projects?.length?c.projects.map(p=><Row key={p.id} to={`/projects/${p.id}`}><div><strong>{p.number}</strong><small>{p.name} · {p.status}</small></div><span>{money(p.value)}</span></Row>):<div className="empty-note">No projects yet.</div>}</Section>
    <div className="detail-grid-2"><Section title="Quotes" icon={FileText}>{c.quotes?.length?c.quotes.map(q=><Row key={q.id}><div><strong>{q.number}</strong><small>{q.status} · {date(q.createdAt)}</small></div><span>{money(q.total)}</span></Row>):<div className="empty-note">No quotes yet.</div>}</Section><Section title="Invoices" icon={Receipt}>{c.invoices?.length?c.invoices.map(i=><Row key={i.id}><div><strong>{i.number}</strong><small>{i.status} · due {date(i.dueDate)}</small></div><span>{money(i.total)}<small>Balance {money(i.balance)}</small></span></Row>):<div className="empty-note">No invoices yet.</div>}</Section></div>
    <Section title="Client notes" icon={Wallet}><p className="client-notes">{c.notes||'No notes recorded for this client.'}</p></Section>
    <Section title="Client documents" icon={Paperclip} action={<button className="secondary small-button" onClick={()=>setAddingDocument(true)}><Plus size={14}/> Add document</button>}>
      {documents.loading?<div className="empty-note">Loading documents…</div>:documents.error?<div className="empty-note error-state">{documents.error}</div>:documents.items.length?documents.items.map(d=><div key={d.id} className="client-related-row"><div><strong>{d.name}</strong><small>{d.description||d.mimeType||'Document'} · {date(d.createdAt)}{d.uploadedBy?.name?` · ${d.uploadedBy.name}`:''}</small></div>{d.url?<a className="secondary small-button" href={d.url} target="_blank" rel="noreferrer">Open <ExternalLink size={13}/></a>:<span className="table-status">Stored</span>}</div>):<div className="empty-note">No documents linked to this client yet.</div>}
    </Section>
    <Modal open={editing} title="Edit client" description={`Update ${c.companyName}.`} onClose={()=>setEditing(false)} width="760px"><ClientForm initialValues={c} editing onSubmit={save} onCancel={()=>setEditing(false)} submitting={saving}/></Modal>
    <Modal open={addingDocument} title="Add client document" description="Register a secure document link now; binary upload storage can be connected later." onClose={()=>setAddingDocument(false)} width="720px"><ClientDocumentForm clientId={id} onSubmit={addDocument} onCancel={()=>setAddingDocument(false)} submitting={documentSaving}/></Modal>
  </div>;
}
