import React from 'react';
import { Save } from 'lucide-react';
import { api } from '../../../api';

const initial={number:'',projectId:'',serviceId:'',title:'',description:'',priority:'',startDate:'',dueDate:'',status:'DRAFT',assignmentType:'INTERNAL',revenue:'',estimatedMaterial:'',estimatedLabour:'',estimatedOutsource:'',estimatedExpense:''};
export default function JobForm({projects=[],services=[],onSubmit,onCancel,submitting=false}){
 const [form,setForm]=React.useState(initial); const [error,setError]=React.useState('');
 const set=k=>e=>setForm(v=>({...v,[k]:e.target.value}));
 async function submit(e){e.preventDefault();setError(''); if(!form.number.trim()||!form.projectId||!form.title.trim()){setError('Job number, project and title are required.');return;} try{await onSubmit({...form,projectId:Number(form.projectId),serviceId:form.serviceId?Number(form.serviceId):undefined,revenue:Number(form.revenue||0),estimatedMaterial:Number(form.estimatedMaterial||0),estimatedLabour:Number(form.estimatedLabour||0),estimatedOutsource:Number(form.estimatedOutsource||0),estimatedExpense:Number(form.estimatedExpense||0)});}catch(err){setError(err.message||'Unable to save job.');}}
 return <form className="entity-form" onSubmit={submit}><div className="form-grid two">
  <label>Job number<input value={form.number} onChange={set('number')} placeholder="JOB-0001" required/></label>
  <label>Project<select value={form.projectId} onChange={set('projectId')} required><option value="">Select project</option>{projects.map(p=><option key={p.id} value={p.id}>{p.number} — {p.name}</option>)}</select></label>
  <label>Service<select value={form.serviceId} onChange={set('serviceId')}><option value="">Select service</option>{services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
  <label>Priority<input value={form.priority} onChange={set('priority')} placeholder="Normal"/></label>
  <label className="full">Job title<input value={form.title} onChange={set('title')} placeholder="e.g. LED fascia sign fabrication" required/></label>
  <label>Status<select value={form.status} onChange={set('status')}>{['DRAFT','READY','IN_PROGRESS','BLOCKED','REVIEW','COMPLETED','CANCELLED'].map(v=><option key={v}>{v}</option>)}</select></label>
  <label>Assignment<select value={form.assignmentType} onChange={set('assignmentType')}>{['INTERNAL','OUTSOURCED','MIXED'].map(v=><option key={v}>{v}</option>)}</select></label>
  <label>Start date<input type="date" value={form.startDate} onChange={set('startDate')}/></label>
  <label>Due date<input type="date" value={form.dueDate} onChange={set('dueDate')}/></label>
  <label className="full">Description<textarea rows="3" value={form.description} onChange={set('description')} /></label>
 </div><div className="form-grid two" style={{marginTop:16}}>
  <label>Revenue (LKR)<input type="number" min="0" step="0.01" value={form.revenue} onChange={set('revenue')}/></label>
  <label>Estimated material (LKR)<input type="number" min="0" step="0.01" value={form.estimatedMaterial} onChange={set('estimatedMaterial')}/></label>
  <label>Estimated labour (LKR)<input type="number" min="0" step="0.01" value={form.estimatedLabour} onChange={set('estimatedLabour')}/></label>
  <label>Estimated outsourcing (LKR)<input type="number" min="0" step="0.01" value={form.estimatedOutsource} onChange={set('estimatedOutsource')}/></label>
  <label>Estimated other expense (LKR)<input type="number" min="0" step="0.01" value={form.estimatedExpense} onChange={set('estimatedExpense')}/></label>
 </div>{error&&<div className="form-error">{error}</div>}<div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={submitting}>{submitting?'Saving…':<><Save size={16}/> Create Job</>}</button></div></form>;
}
