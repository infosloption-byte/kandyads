import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';
import Modal from '../../../components/common/Modal';
import ProjectForm from '../components/ProjectForm';

export default function ProjectsPage(){
 const [search,setSearch]=React.useState('');const [state,setState]=React.useState({loading:true,error:'',items:[],total:0});const [open,setOpen]=React.useState(false);const [saving,setSaving]=React.useState(false);
 const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const r=await api.listProjects({search:search||undefined});setState({loading:false,error:'',items:r.data||[],total:r.meta?.total||0})}catch(e){setState({loading:false,error:e.message||'Unable to load projects',items:[],total:0})}},[search]);
 React.useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[load]);
 async function create(input){setSaving(true);try{await api.createProject(input);setOpen(false);await load()}finally{setSaving(false)}}
 return <div><div className="page-head"><div><p className="eyebrow">DELIVERY</p><h1>Projects</h1><p>Client engagements that contain the jobs, production costs, field work and financial history.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> New Project</button></div><section className="panel table-panel"><div className="table-toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects…"/></label><button className="icon-button" onClick={load} aria-label="Refresh projects"><RefreshCw size={16}/></button><span className="table-count">{state.total} projects</span></div><ResourceTable loading={state.loading} error={state.error} rows={state.items} columns={[{key:'number',label:'Project',render:r=><Link className="record-link" to={`/projects/${r.id}`}>{r.number}</Link>},{key:'name',label:'Name',render:r=><><strong>{r.name}</strong><small>{r.client?.companyName||'—'}</small></>},{key:'status',label:'Status',render:r=><span className="table-status">{r.status.replaceAll('_',' ')}</span>},{key:'value',label:'Value',render:r=>`LKR ${Number(r.value||0).toLocaleString()}`},{key:'owner',label:'Owner',render:r=>r.owner?.name||'—'},{key:'dueDate',label:'Due',render:r=>r.dueDate?new Date(r.dueDate).toLocaleDateString():'—'}]} /></section><Modal open={open} onClose={()=>setOpen(false)} title="New project" description="Create the client engagement that will contain jobs, tasks, production and financial activity." width="760px"><ProjectForm onSubmit={create} onCancel={()=>setOpen(false)} submitting={saving}/></Modal></div>;
}
