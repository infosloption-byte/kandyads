import React from 'react';
import { Save } from 'lucide-react';

const blank={jobId:'',title:'',description:'',employeeId:'',priority:'',startDate:'',dueDate:'',estimatedHours:'',status:'PENDING'};
const statuses=['PENDING','READY','IN_PROGRESS','BLOCKED','REVIEW','COMPLETED','CANCELLED'];
const inputDate=v=>v?new Date(v).toISOString().slice(0,10):'';
export default function TaskForm({jobs=[],employees=[],initialValues,onSubmit,onCancel,submitting=false,editMode=false}){
 const [form,setForm]=React.useState({...blank,...initialValues,jobId:initialValues?.jobId??'',employeeId:initialValues?.employeeId??'',startDate:inputDate(initialValues?.startDate),dueDate:inputDate(initialValues?.dueDate)}); const [error,setError]=React.useState('');
 const set=k=>e=>setForm(v=>({...v,[k]:e.target.value}));
 async function submit(e){e.preventDefault();setError('');if((!editMode&&!form.jobId)||!form.title.trim()){setError(editMode?'Task title is required.':'Job and task title are required.');return;}try{await onSubmit({...form,jobId:form.jobId?Number(form.jobId):undefined,employeeId:form.employeeId?Number(form.employeeId):undefined,estimatedHours:form.estimatedHours?Number(form.estimatedHours):undefined,startDate:form.startDate||undefined,dueDate:form.dueDate||undefined});}catch(err){setError(err.message||'Unable to save task.');}}
 return <form className="entity-form" onSubmit={submit}><div className="form-grid two">
  {!editMode&&<label>Job<select value={form.jobId} onChange={set('jobId')} required><option value="">Select job</option>{jobs.map(j=><option key={j.id} value={j.id}>{j.number} — {j.title}</option>)}</select></label>}
  <label className={editMode?'full':''}>Assign employee<select value={form.employeeId} onChange={set('employeeId')}><option value="">Unassigned</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name} — {e.code}</option>)}</select></label>
  <label className="full">Task title<input value={form.title} onChange={set('title')} placeholder="e.g. Prepare production artwork" required/></label>
  <label>Priority<input value={form.priority} onChange={set('priority')} placeholder="Normal"/></label>
  <label>Status<select value={form.status} onChange={set('status')}>{statuses.map(v=><option key={v}>{v}</option>)}</select></label>
  <label>Start date<input type="date" value={form.startDate} onChange={set('startDate')}/></label>
  <label>Due date<input type="date" value={form.dueDate} onChange={set('dueDate')}/></label>
  <label>Estimated hours<input type="number" min="0" step="0.25" value={form.estimatedHours} onChange={set('estimatedHours')}/></label>
  <label className="full">Description<textarea rows="3" value={form.description} onChange={set('description')} /></label>
 </div>{error&&<div className="form-error">{error}</div>}<div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={submitting}>{submitting?'Saving…':<><Save size={16}/> {editMode?'Save Changes':'Create Task'}</>}</button></div></form>;
}
