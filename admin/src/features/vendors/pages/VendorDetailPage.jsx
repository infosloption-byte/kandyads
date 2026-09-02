import React from 'react';
import { ArrowLeft, Paperclip, Plus, RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';

const dateTime=v=>v?new Date(v).toLocaleString():'—';

export default function VendorDetailPage(){
  const {id}=useParams();
  const [state,setState]=React.useState({loading:true,error:'',vendor:null});
  const [open,setOpen]=React.useState(false),[saving,setSaving]=React.useState(false);
  const [form,setForm]=React.useState({name:'',description:'',url:''});
  const load=React.useCallback(async()=>{
    setState(s=>({...s,loading:true,error:''}));
    try{const result=await api.getVendor(id);setState({loading:false,error:'',vendor:result.data})}
    catch(e){setState({loading:false,error:e.message||'Unable to load vendor',vendor:null})}
  },[id]);
  React.useEffect(()=>{load()},[load]);
  async function add(e){
    e.preventDefault();setSaving(true);
    try{await api.createAttachment({entityType:'VENDOR',entityId:Number(id),name:form.name.trim(),description:form.description||undefined,url:form.url.trim()});setForm({name:'',description:'',url:''});setOpen(false);await load()}
    catch(err){setState(s=>({...s,error:err.message||'Unable to add vendor document'}))}
    finally{setSaving(false)}
  }
  if(state.loading)return <div className="detail-state">Loading vendor…</div>;
  if(state.error&&!state.vendor)return <div className="detail-state error-state">{state.error}</div>;
  const vendor=state.vendor;
  return <div>
    <Link className="back-link" to="/vendors"><ArrowLeft size={15}/> Back to Vendors</Link>
    <div className="page-head"><div><p className="eyebrow">VENDOR / {vendor.code}</p><h1>{vendor.companyName}</h1><p>{vendor.category||'Production partner'} · {vendor.active?'Active':'Inactive'}</p></div><div style={{display:'flex',gap:8}}><button className="icon-button" onClick={load} aria-label="Refresh vendor"><RefreshCw size={16}/></button><button className="primary" onClick={()=>setOpen(true)}><Plus size={15}/> Add document</button></div></div>
    <section className="panel" style={{marginBottom:16}}><div className="panel-head"><div><span>VENDOR DETAILS</span><h2>{vendor.contactName||'No contact name'}</h2></div></div><div className="detail-grid"><div><small>Phone</small><strong>{vendor.phone||'—'}</strong></div><div><small>Email</small><strong>{vendor.email||'—'}</strong></div><div><small>WhatsApp</small><strong>{vendor.whatsapp||'—'}</strong></div><div><small>Payment terms</small><strong>{vendor.paymentTerms||'—'}</strong></div><div><small>Address</small><strong>{vendor.address||'—'}</strong></div><div><small>Bank / payment details</small><strong>{vendor.bankDetails||'—'}</strong></div></div></section>
    <section className="panel table-panel"><div className="panel-head"><div><span>VENDOR DOCUMENTS</span><h2><Paperclip size={17}/> {vendor.attachments?.length||0} document{(vendor.attachments?.length||0)===1?'':'s'}</h2></div></div>{vendor.attachments?.length?vendor.attachments.map(item=><div className="list-row compact" key={item.id}><div><strong>{item.name}</strong><small>{item.description||item.mimeType||'Document'} · {item.uploadedBy?.name||item.uploadedBy?.email||'System'} · {dateTime(item.createdAt)}</small></div>{item.url&&<a className="secondary" href={item.url} target="_blank" rel="noreferrer">Open</a>}</div>):<div className="empty-note">No vendor documents have been registered.</div>}</section>
    <Modal open={open} title="Add vendor document" description={`Register a document or reference for ${vendor.companyName}.`} onClose={()=>setOpen(false)} width="620px"><form className="entity-form" onSubmit={add}><label>Name<input value={form.name} onChange={e=>setForm(v=>({...v,name:e.target.value}))} required/></label><label>Description<textarea rows="3" value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))}/></label><label>URL<input type="url" value={form.url} onChange={e=>setForm(v=>({...v,url:e.target.value}))} placeholder="https://…" required/></label><div className="form-actions"><button type="button" className="secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="primary" disabled={saving}>{saving?'Adding…':'Add document'}</button></div></form></Modal>
  </div>;
}
