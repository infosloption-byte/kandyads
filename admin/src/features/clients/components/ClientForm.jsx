import React from 'react';
import { Save } from 'lucide-react';

const initial = { code:'', companyName:'', contactName:'', phone:'', whatsapp:'', email:'', address:'', industry:'', paymentTerms:'', creditLimit:'', notes:'' };

export default function ClientForm({ onSubmit, onCancel, submitting=false }) {
  const [form,setForm]=React.useState(initial);
  const [error,setError]=React.useState('');
  const set=(key)=>(event)=>setForm(v=>({...v,[key]:event.target.value}));
  async function submit(event){
    event.preventDefault(); setError('');
    if(!form.code.trim() || !form.companyName.trim()){ setError('Client code and company name are required.'); return; }
    try { await onSubmit({...form, creditLimit:form.creditLimit?Number(form.creditLimit):undefined}); }
    catch(error){ setError(error.message||'Unable to save client.'); }
  }
  return <form className="entity-form" onSubmit={submit}>
    <div className="form-grid two">
      <label>Client code<input value={form.code} onChange={set('code')} placeholder="CL-0001" required /></label>
      <label>Company name<input value={form.companyName} onChange={set('companyName')} placeholder="Company / organization" required /></label>
      <label>Contact person<input value={form.contactName} onChange={set('contactName')} /></label>
      <label>Industry<input value={form.industry} onChange={set('industry')} /></label>
      <label>Office phone<input value={form.phone} onChange={set('phone')} /></label>
      <label>WhatsApp<input value={form.whatsapp} onChange={set('whatsapp')} /></label>
      <label>Email<input type="email" value={form.email} onChange={set('email')} /></label>
      <label>Credit limit (LKR)<input type="number" min="0" step="0.01" value={form.creditLimit} onChange={set('creditLimit')} /></label>
      <label className="full">Address<textarea value={form.address} onChange={set('address')} rows="2" /></label>
      <label className="full">Payment terms<input value={form.paymentTerms} onChange={set('paymentTerms')} placeholder="e.g. 50% advance / balance on completion" /></label>
      <label className="full">Notes<textarea value={form.notes} onChange={set('notes')} rows="3" /></label>
    </div>
    {error&&<div className="form-error">{error}</div>}
    <div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={submitting}>{submitting?'Saving…':<><Save size={16}/> Save Client</>}</button></div>
  </form>;
}
