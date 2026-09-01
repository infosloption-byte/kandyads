import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';
import Modal from '../../../components/common/Modal';
import TaskForm from '../components/TaskForm';

export default function TasksPage(){
  const [search,setSearch]=React.useState('');
  const [state,setState]=React.useState({loading:true,error:'',items:[],total:0});
  const [open,setOpen]=React.useState(false); const [saving,setSaving]=React.useState(false);
  const [lookups,setLookups]=React.useState({jobs:[],employees:[],error:''});
  const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const r=await api.listTasks({search:search||undefined});setState({loading:false,error:'',items:r.data||[],total:r.meta?.total||0})}catch(e){setState({loading:false,error:e.message||'Unable to load tasks',items:[],total:0})}},[search]);
  React.useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[load]);
  React.useEffect(()=>{let active=true;Promise.all([api.listJobs({pageSize:100}),api.listEmployees({pageSize:100})]).then(([j,e])=>{if(active)setLookups({jobs:j.data||[],employees:e.data||[],error:''})}).catch(e=>{if(active)setLookups(v=>({...v,error:e.message||'Unable to load task form data'}))});return()=>{active=false}},[]);
  async function createTask(input){setSaving(true);try{await api.createTask(input);setOpen(false);await load()}finally{setSaving(false)}}
  return <div><div className="page-head"><div><p className="eyebrow">DELIVERY</p><h1>Tasks</h1><p>Execution steps inside jobs, assigned to employees with planned hours and deadlines.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> New Task</button></div>{lookups.error&&<div className="form-error">{lookups.error}</div>}<section className="panel table-panel"><div className="table-toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tasks…"/></label><button className="icon-button" onClick={load} aria-label="Refresh tasks"><RefreshCw size={16}/></button><span className="table-count">{state.total} tasks</span></div><ResourceTable loading={state.loading} error={state.error} rows={state.items} columns={[{key:'title',label:'Task',render:r=><><Link className="record-link" to={`/tasks/${r.id}`}>{r.title}</Link><small>{r.job?.number||'—'}</small></>},{key:'employee',label:'Employee',render:r=>r.employee?.name||'Unassigned'},{key:'status',label:'Status',render:r=><span className="table-status">{r.status.replaceAll('_',' ')}</span>},{key:'estimatedHours',label:'Planned hrs',render:r=>r.estimatedHours??'—'},{key:'actualHours',label:'Actual hrs',render:r=>r.actualHours??'—'},{key:'dueDate',label:'Due',render:r=>r.dueDate?new Date(r.dueDate).toLocaleDateString():'—'}]} /></section><Modal open={open} title="Create task" description="Add an execution step to a production job and optionally assign an employee." onClose={()=>setOpen(false)} width="720px"><TaskForm jobs={lookups.jobs} employees={lookups.employees} onSubmit={createTask} onCancel={()=>setOpen(false)} submitting={saving}/></Modal></div>;
}
