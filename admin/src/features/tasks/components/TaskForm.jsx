import React from 'react';
import { Save } from 'lucide-react';
import { api } from '../../../api';

const initial={jobId:'',title:'',description:'',employeeId:'',priority:'',startDate:'',dueDate:'',estimatedHours:'',status:'PENDING'};
export default function TaskForm({jobs=[],employees=[],onSubmit,onCancel,submitting=false}){
 const [form,setForm]=React.useState(initial); const [error,setError]=React.useState('');
 const set=k=>e=>setForm(v=>({...v,[k]:e.target.value}));
 async function submit(e){e.preventDefault();setError('');if(!form.jobId||!form.title.trim()){setError('Job and task title are required.');return;}try{await onSubmit({...form,jobId:Number(form.jobId),employeeId:form.employeeId?Number(form.employeeId):undefined,estimatedHours:form.estimatedHours?Number(form.estimatedHours):undefined});}catch(err){setError(err.message||'Unable to save task.');}}
 return <form className="entity-form" onSubmit={submit}><div className="form-grid two">
  <label>Job<select value={form.jobId} onChange={set('jobId')} required><option value="">Select job</option>{jobs.map(j=><option key={j.id} value={j.id}>{j.number} — {j.title}</option>)}</select></label>
  <label>Assign employee<select value={form.employeeId} onChange={set('employeeId')}><option value="">Unassigned</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name} — {e.code}</option>)}</select></label>
  <label className="full">Task title<input value={form.title} onChange={set('title')} placeholder="e.g. Prepare production artwork" required/></label>
  <label>Priority<input value={form.priority} onChange={set('priority')} placeholder="Normal"/></label>
  <label>Status<select value={form.status} onChange={set('status')}>{['PENDING','READY','IN_PROGRESS','BLOCKED','REVIEW','COMPLETED','CANCELLED'].map(v=><option key={v}>{v}</option>)}</select></label>
  <label>Start date<input type="date" value={form.startDate} onChange={set('startDate')}/></label>
  <label>Due date<input type="date" value={form.dueDate} onChange={set('dueDate')}/></label>
  <label>Estimated hours<input type="number" min="0" step="0.25" value={form.estimatedHours} onChange={set('estimatedHours')}/></label>
  <label className="full">Description<textarea rows="3" value={form.description} onChange={set('description')} /></label>
 </div>{error&&<div className="form-error">{error}</div>}<div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={submitting}>{submitting?'Saving…':<><Save size={16}/> Create Task</>}</button></div></form>;
}
