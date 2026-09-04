import React from 'react';
import { Link } from 'react-router-dom';
import { Edit3, Plus, RefreshCw, Search } from 'lucide-react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';
import Modal from '../../../components/common/Modal';
import ClientForm from '../components/ClientForm';

export default function ClientsPage(){
  const [search,setSearch]=React.useState('');
  const [active,setActive]=React.useState('');
  const [open,setOpen]=React.useState(false);
  const [editing,setEditing]=React.useState(null);
  const [saving,setSaving]=React.useState(false);
  const [state,setState]=React.useState({loading:true,error:'',items:[],total:0});
  const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const r=await api.listClients({search:search||undefined,active:active||undefined});setState({loading:false,error:'',items:r.data||[],total:r.meta?.total||0});}catch(e){setState({loading:false,error:e.message||'Unable to load clients',items:[],total:0})}},[search,active]);
  React.useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[load]);
  async function createClient(input){setSaving(true);try{await api.createClient(input);setOpen(false);await load();}finally{setSaving(false);}}
  async function updateClient(input){setSaving(true);try{const r=await api.updateClient(editing.id,input);setEditing(null);setState(s=>({...s,items:s.items.map(x=>x.id===editing.id?r.data:x)}));}finally{setSaving(false);}}
  const columns=[
    {key:'code',label:'Code',render:r=><Link className="table-link" to={`/clients/${r.id}`}>{r.code}</Link>},
    {key:'companyName',label:'Company',render:r=><Link className="table-link table-primary-link" to={`/clients/${r.id}`}><strong>{r.companyName}</strong><small>{r.industry||'—'}</small></Link>},
    {key:'contactName',label:'Contact'},
    {key:'phone',label:'Phone'},
    {key:'email',label:'Email'},
    {key:'active',label:'Status',render:r=><span className="table-status">{r.active?'Active':'Inactive'}</span>},
    {key:'actions',label:'Actions',render:r=><button className="secondary table-action" onClick={()=>setEditing(r)}><Edit3 size={14}/> Edit</button>}
  ];
  return <div>
    <div className="page-head"><div><p className="eyebrow">CRM</p><h1>Clients</h1><p>Companies and customer relationships used across enquiries, projects, jobs and finance.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> New Client</button></div>
    <section className="panel table-panel"><div className="table-toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients…"/></label><label className="toolbar-select"><span>Status</span><select value={active} onChange={e=>setActive(e.target.value)}><option value="">All</option><option value="true">Active</option><option value="false">Inactive</option></select></label><button className="icon-button" onClick={load} aria-label="Refresh clients"><RefreshCw size={16}/></button><span className="table-count">{state.total} clients</span></div><ResourceTable loading={state.loading} error={state.error} rows={state.items} columns={columns} /></section>
    <Modal open={open} title="New client" description="Create the client record that will be reused across enquiries, quotes and projects." onClose={()=>setOpen(false)}><ClientForm onSubmit={createClient} onCancel={()=>setOpen(false)} submitting={saving}/></Modal>
    <Modal open={Boolean(editing)} title="Edit client" description={editing?`Update ${editing.companyName}.`:'Update client details.'} onClose={()=>setEditing(null)} width="760px"><ClientForm initialValues={editing||undefined} editing onSubmit={updateClient} onCancel={()=>setEditing(null)} submitting={saving}/></Modal>
  </div>;
}
