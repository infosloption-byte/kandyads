import React from 'react';
import { Save } from 'lucide-react';
import { api } from '../../../api';

const initial = { number:'', clientId:'', source:'', requirement:'', siteLocation:'', targetDate:'', priority:'NORMAL' };

export default function EnquiryForm({ initialValues=initial, editing=false, onSubmit, onCancel, submitting=false }) {
  const [form,setForm]=React.useState({...initial,...initialValues,targetDate:initialValues?.targetDate?String(initialValues.targetDate).slice(0,10):''});
  const [clients,setClients]=React.useState([]);
  const [loadingClients,setLoadingClients]=React.useState(true);
  const [error,setError]=React.useState('');
  React.useEffect(()=>{ api.listClients({pageSize:100}).then(r=>setClients(r.data||[])).catch(e=>setError(e.message||'Unable to load clients')).finally(()=>setLoadingClients(false)); },[]);
  const set=(key)=>(event)=>setForm(v=>({...v,[key]:event.target.value}));
  async function submit(event){
    event.preventDefault(); setError('');
    if((!editing&&!form.number.trim())||!form.clientId||!form.requirement.trim()){setError(editing?'Client and requirement are required.':'Enquiry number, client and requirement are required.');return;}
    try{await onSubmit({...form, ...(editing?{}:{number:form.number.trim()}),clientId:Number(form.clientId),targetDate:form.targetDate||undefined});}catch(e){setError(e.message||'Unable to save enquiry.');}
  }
  return <form className="entity-form" onSubmit={submit}>
    <div className="form-grid two">
      <label>Enquiry number<input value={form.number} onChange={set('number')} placeholder="ENQ-0001" required={!editing} disabled={editing}/></label>
      <label>Client<select value={form.clientId} onChange={set('clientId')} required disabled={loadingClients}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.companyName} ({c.code})</option>)}</select></label>
      <label>Source<input value={form.source||''} onChange={set('source')} placeholder="Website / WhatsApp / Referral"/></label>
      <label>Priority<select value={form.priority||'NORMAL'} onChange={set('priority')}><option>NORMAL</option><option>LOW</option><option>HIGH</option><option>URGENT</option></select></label>
      <label>Target date<input type="date" value={form.targetDate||''} onChange={set('targetDate')}/></label>
      <label>Site / location<input value={form.siteLocation||''} onChange={set('siteLocation')} placeholder="Project site or city"/></label>
      <label className="full">Requirement<textarea value={form.requirement||''} onChange={set('requirement')} rows="5" placeholder="Describe what the client needs…" required/></label>
    </div>
    {error&&<div className="form-error">{error}</div>}
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={submitting||loadingClients}>{submitting?'Saving…':<><Save size={16}/> {editing?'Save changes':'Save Enquiry'}</>}</button></div>
  </form>;
}
