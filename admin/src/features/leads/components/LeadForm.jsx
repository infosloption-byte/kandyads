import React from 'react';

const blank={name:'',company:'',phone:'',email:'',source:'',requirement:'',estimatedValue:'',status:'NEW',assignedToId:'',clientId:'',followUpAt:''};

export default function LeadForm({ employees=[], clients=[], initialValues=null, editing=false, onSubmit, onCancel, submitting }) {
  const [form,setForm]=React.useState(()=>({...blank,...(initialValues||{}),estimatedValue:initialValues?.estimatedValue==null?'':String(initialValues.estimatedValue),assignedToId:initialValues?.assignedToId?String(initialValues.assignedToId):'',clientId:initialValues?.clientId?String(initialValues.clientId):'',followUpAt:initialValues?.followUpAt?new Date(initialValues.followUpAt).toISOString().slice(0,16):''}));
  const [error,setError]=React.useState('');
  React.useEffect(()=>{if(initialValues)setForm({...blank,...initialValues,estimatedValue:initialValues.estimatedValue==null?'':String(initialValues.estimatedValue),assignedToId:initialValues.assignedToId?String(initialValues.assignedToId):'',clientId:initialValues.clientId?String(initialValues.clientId):'',followUpAt:initialValues.followUpAt?new Date(initialValues.followUpAt).toISOString().slice(0,16):''});},[initialValues]);
  function set(key,value){setForm(current=>({...current,[key]:value}));}
  async function submit(e){e.preventDefault();setError('');try{await onSubmit({...form,estimatedValue:form.estimatedValue===''?null:Number(form.estimatedValue),assignedToId:form.assignedToId?Number(form.assignedToId):null,clientId:form.clientId?Number(form.clientId):null,followUpAt:form.followUpAt?new Date(form.followUpAt).toISOString():null});}catch(err){setError(err.message||'Unable to save lead.');}}
  return <form className="entity-form" onSubmit={submit}>
    {error&&<div className="form-error">{error}</div>}
    <div className="form-grid form-grid-2">
      <label className="form-field"><span>Contact name *</span><input required value={form.name||''} onChange={e=>set('name',e.target.value)} /></label>
      <label className="form-field"><span>Company</span><input value={form.company||''} onChange={e=>set('company',e.target.value)} /></label>
      <label className="form-field"><span>Phone</span><input value={form.phone||''} onChange={e=>set('phone',e.target.value)} /></label>
      <label className="form-field"><span>Email</span><input type="email" value={form.email||''} onChange={e=>set('email',e.target.value)} /></label>
      <label className="form-field"><span>Lead source</span><input placeholder="Website, Facebook, Referral..." value={form.source||''} onChange={e=>set('source',e.target.value)} /></label>
      <label className="form-field"><span>Estimated value (LKR)</span><input type="number" min="0" step="0.01" value={form.estimatedValue} onChange={e=>set('estimatedValue',e.target.value)} /></label>
      <label className="form-field"><span>Status</span><select value={form.status||'NEW'} onChange={e=>set('status',e.target.value)}>{['NEW','CONTACTED','QUALIFIED','PROPOSAL','NEGOTIATION','WON','LOST'].map(x=><option key={x}>{x}</option>)}</select></label>
      <label className="form-field"><span>Sales owner</span><select value={form.assignedToId} onChange={e=>set('assignedToId',e.target.value)}><option value="">Unassigned</option>{employees.map(e=><option key={e.id} value={e.id}>{e.code} · {e.name}</option>)}</select></label>
      <label className="form-field"><span>Existing client</span><select value={form.clientId} onChange={e=>set('clientId',e.target.value)}><option value="">None / create during conversion</option>{clients.map(c=><option key={c.id} value={c.id}>{c.code} · {c.companyName}</option>)}</select></label>
      <label className="form-field"><span>Follow-up date</span><input type="datetime-local" value={form.followUpAt} onChange={e=>set('followUpAt',e.target.value)} /></label>
    </div>
    <label className="form-field"><span>Requirement</span><textarea rows="5" value={form.requirement||''} onChange={e=>set('requirement',e.target.value)} placeholder="What does the prospect need?" /></label>
    <div className="modal-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={submitting}>{submitting?'Saving…':editing?'Save changes':'Create lead'}</button></div>
  </form>;
}
