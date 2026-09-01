import React from 'react';
import { Save } from 'lucide-react';

const localDate=v=>v?new Date(v).toISOString().slice(0,10):'';
const localTime=v=>v?new Date(v).toISOString().slice(0,16):'';
export default function TimeEntryForm({initialValues={},employees=[],jobs=[],editMode=false,onSubmit,onCancel,submitting=false}){
 const [form,setForm]=React.useState({employeeId:'',projectId:'',jobId:'',taskId:'',workDate:localDate(new Date()),startTime:'',endTime:'',hours:'',billable:false,notes:'',...initialValues,workDate:localDate(initialValues.workDate)||localDate(new Date()),startTime:localTime(initialValues.startTime),endTime:localTime(initialValues.endTime)});const [error,setError]=React.useState('');
 const set=k=>e=>setForm(v=>({...v,[k]:e.target.type==='checkbox'?e.target.checked:e.target.value}));
 async function submit(e){e.preventDefault();setError('');if(!form.employeeId||!form.workDate||!form.hours||Number(form.hours)<=0){setError('Employee, work date and positive hours are required.');return;}try{await onSubmit({employeeId:Number(form.employeeId),projectId:form.projectId?Number(form.projectId):undefined,jobId:form.jobId?Number(form.jobId):undefined,taskId:form.taskId?Number(form.taskId):undefined,workDate:new Date(`${form.workDate}T00:00:00`).toISOString(),startTime:form.startTime?new Date(form.startTime).toISOString():undefined,endTime:form.endTime?new Date(form.endTime).toISOString():undefined,hours:Number(form.hours),billable:Boolean(form.billable),notes:form.notes||undefined});}catch(err){setError(err.message||'Unable to save time entry.');}}
 return <form className="entity-form" onSubmit={submit}><div className="form-grid two">
  <label>Employee<select value={form.employeeId} onChange={set('employeeId')} required><option value="">Select employee</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name} — {e.code}</option>)}</select></label>
  <label>Job<select value={form.jobId} onChange={set('jobId')}><option value="">Optional</option>{jobs.map(j=><option key={j.id} value={j.id}>{j.number} — {j.title}</option>)}</select></label>
  <label>Work date<input type="date" value={form.workDate} onChange={set('workDate')} required/></label>
  <label>Hours<input type="number" min="0.01" step="0.25" value={form.hours} onChange={set('hours')} required/></label>
  <label>Start time<input type="datetime-local" value={form.startTime} onChange={set('startTime')}/></label>
  <label>End time<input type="datetime-local" value={form.endTime} onChange={set('endTime')}/></label>
  <label className="full"><input type="checkbox" checked={Boolean(form.billable)} onChange={set('billable')}/> Billable time</label>
  <label className="full">Notes<textarea rows="3" value={form.notes||''} onChange={set('notes')} /></label>
 </div>{editMode&&<div className="form-hint">Approved time entries are locked and cannot be edited.</div>}{error&&<div className="form-error">{error}</div>}<div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={submitting}>{submitting?'Saving…':<><Save size={16}/> {editMode?'Save Changes':'Log Time'}</>}</button></div></form>;
}
