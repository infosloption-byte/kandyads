import React from 'react';
import { Save } from 'lucide-react';
import { api } from '../../../api';

const empty={number:'',name:'',clientId:'',quoteId:'',ownerId:'',startDate:'',dueDate:'',value:''};
const asDate=v=>v?new Date(v).toISOString().slice(0,10):'';

export default function ProjectForm({project=null,onSubmit,onCancel,submitting=false}){
  const [form,setForm]=React.useState(project?{number:project.number||'',name:project.name||'',clientId:project.clientId||'',quoteId:project.quoteId||'',ownerId:project.ownerId||'',startDate:asDate(project.startDate),dueDate:asDate(project.dueDate),value:project.value??''}:empty),[clients,setClients]=React.useState([]),[quotes,setQuotes]=React.useState([]),[employees,setEmployees]=React.useState([]),[error,setError]=React.useState(''),[loading,setLoading]=React.useState(true);
  React.useEffect(()=>{Promise.all([api.listClients({pageSize:100}),api.listQuotes({pageSize:100,status:'ACCEPTED'}),api.listEmployees({pageSize:100})]).then(([c,q,e])=>{setClients(c.data||[]);setQuotes(q.data||[]);setEmployees(e.data||[])}).catch(e=>setError(e.message||'Unable to load project options')).finally(()=>setLoading(false));},[]);
  const set=(k)=>(e)=>setForm(v=>({...v,[k]:e.target.value}));
  async function submit(e){e.preventDefault();setError('');if(!form.number.trim()||!form.name.trim()||!form.clientId){setError('Project number, name and client are required.');return;}try{await onSubmit({...form,clientId:Number(form.clientId),quoteId:form.quoteId?Number(form.quoteId):undefined,ownerId:form.ownerId?Number(form.ownerId):undefined,value:form.value!==''?Number(form.value):0,startDate:form.startDate||undefined,dueDate:form.dueDate||undefined});}catch(err){setError(err.message||'Unable to save project.');}}
  return <form className="entity-form" onSubmit={submit}><div className="form-grid two">
    <label>Project number<input value={form.number} onChange={set('number')} placeholder="PRJ-0001" required/></label>
    <label>Project name<input value={form.name} onChange={set('name')} placeholder="Client project name" required/></label>
    <label>Client<select value={form.clientId} onChange={set('clientId')} required disabled={loading}><option value="">Select client</option>{clients.map(c=><option key={c.id} value={c.id}>{c.companyName} ({c.code})</option>)}</select></label>
    <label>Accepted quote<select value={form.quoteId} onChange={set('quoteId')} disabled={loading}><option value="">Optional</option>{quotes.map(q=><option key={q.id} value={q.id}>{q.number} — LKR {Number(q.total||0).toLocaleString()}</option>)}</select></label>
    <label>Project owner<select value={form.ownerId} onChange={set('ownerId')} disabled={loading}><option value="">Unassigned</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></label>
    <label>Start date<input type="date" value={form.startDate} onChange={set('startDate')}/></label>
    <label>Due date<input type="date" value={form.dueDate} onChange={set('dueDate')}/></label>
    <label className="full">Project value (LKR)<input type="number" min="0" step="0.01" value={form.value} onChange={set('value')} placeholder="0.00"/></label>
  </div>{error&&<div className="form-error">{error}</div>}<div className="form-actions"><button type="button" className="secondary" onClick={onCancel}>Cancel</button><button className="primary" disabled={submitting||loading}>{submitting?'Saving…':<><Save size={16}/> {project?'Save Changes':'Save Project'}</>}</button></div></form>;
}
