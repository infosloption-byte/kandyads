import React from 'react';
import { Save } from 'lucide-react';

export default function EmployeeForm({initialValues={},onSubmit,onCancel,submitting=false,editMode=false}){
 const [form,setForm]=React.useState({code:'',name:'',phone:'',email:'',department:'',employmentType:'',hourlyCost:'',dailyCost:'',status:'ACTIVE',...initialValues});const [error,setError]=React.useState('');
 const set=k=>e=>setForm(v=>({...v,[k]:e.target.value}));
 async function submit(e){e.preventDefault();setError('');if(!form.code?.trim()||!form.name?.trim()||form.hourlyCost===''||Number(form.hourlyCost)<0){setError('Employee code, name and hourly cost are required.');return;}try{await onSubmit({code:form.code.trim(),name:form.name.trim(),phone:form.phone||undefined,email:form.email||undefined,department:form.department||undefined,employmentType:form.employmentType||undefined,hourlyCost:Number(form.hourlyCost),dailyCost:form.dailyCost===''?undefined:Number(form.dailyCost),status:form.status});}catch(err){setError(err.message||'Unable to save employee.');}}
 return <form className="entity-form" onSubmit={submit}><div className="form-grid two">
  <label>Employee code<input value={form.code} onChange={set('code')} placeholder="EMP-001" disabled={editMode} required/></label>
  <label>Name<input value={form.name} onChange={set('name')} placeholder="Employee name" required/></label>
  <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
  <label>Email<input type="email" value={form.email} onChange={set('email')} /></label>
  <label>Department<input value={form.department} onChange={set('department')} placeholder="Production" /></label>
  <label>Employment type<input value={form.employmentType} onChange={set('employmentType')} placeholder="Full time" /></label>
  <label>Hourly cost (LKR)<input type="number" min="0" step="0.01" value={form.hourlyCost} onChange={set('hourlyCost')} required/></label>
  <label>Daily cost (LKR)<input type="number" min="0" step="0.01" value={form.dailyCost} onChange={set('dailyCost')} /></label>
  <label>Status<select value={form.status} onChange={set('status')}><option>ACTIVE</option><option>INACTIVE</option></select></label>
 </div>{error&&<div className="form-error">{error}</div>}<div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={submitting}>{submitting?'Saving…':<><Save size={16}/> {editMode?'Save Changes':'Create Employee'}</>}</button></div></form>;
}
