import React from 'react';

export default function ClientDocumentForm({clientId,onSubmit,onCancel,submitting=false}){
  const [form,setForm]=React.useState({name:'',description:'',url:'',mimeType:''});
  const [error,setError]=React.useState('');
  const set=(key)=>(e)=>setForm(v=>({...v,[key]:e.target.value}));
  async function submit(e){
    e.preventDefault();setError('');
    if(!form.name.trim()||!form.url.trim()){setError('Document name and URL are required.');return;}
    try{await onSubmit({entityType:'CLIENT',entityId:Number(clientId),name:form.name.trim(),description:form.description.trim()||null,url:form.url.trim(),mimeType:form.mimeType.trim()||null});}
    catch(err){setError(err.message||'Unable to add document.');}
  }
  return <form className="entity-form" onSubmit={submit}>
    <div className="form-grid form-grid-2">
      <label className="form-field"><span>Document name *</span><input value={form.name} onChange={set('name')} placeholder="Business registration certificate" required/></label>
      <label className="form-field"><span>File type</span><input value={form.mimeType} onChange={set('mimeType')} placeholder="application/pdf"/></label>
      <label className="form-field full"><span>Document URL *</span><input type="url" value={form.url} onChange={set('url')} placeholder="https://..." required/></label>
      <label className="form-field full"><span>Description</span><textarea rows="4" value={form.description} onChange={set('description')} placeholder="Optional note about this document"/></label>
    </div>
    {error&&<div className="form-error">{error}</div>}
    <div className="modal-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={submitting}>{submitting?'Saving…':'Add document'}</button></div>
  </form>;
}
