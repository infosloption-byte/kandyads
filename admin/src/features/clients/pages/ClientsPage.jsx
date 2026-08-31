import React from 'react';
import { Plus, RefreshCw, Search } from 'lucide-react';
import { api } from '../../../api';
import ResourceTable from '../../shared/components/ResourceTable';
import Modal from '../../../components/common/Modal';
import ClientForm from '../components/ClientForm';

export default function ClientsPage(){
  const [search,setSearch]=React.useState('');
  const [open,setOpen]=React.useState(false);
  const [saving,setSaving]=React.useState(false);
  const [state,setState]=React.useState({loading:true,error:'',items:[],total:0});
  const load=React.useCallback(async()=>{setState(s=>({...s,loading:true,error:''}));try{const r=await api.listClients({search:search||undefined});setState({loading:false,error:'',items:r.data||[],total:r.meta?.total||0});}catch(e){setState({loading:false,error:e.message||'Unable to load clients',items:[],total:0})}},[search]);
  React.useEffect(()=>{const t=setTimeout(load,250);return()=>clearTimeout(t)},[load]);
  async function createClient(input){setSaving(true);try{await api.createClient(input);setOpen(false);await load();}finally{setSaving(false);}}
  return <div>
    <div className="page-head"><div><p className="eyebrow">CRM</p><h1>Clients</h1><p>Companies and customer relationships used across enquiries, projects, jobs and finance.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> New Client</button></div>
    <section className="panel table-panel"><div className="table-toolbar"><label className="search-box"><Search size={17}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search clients…"/></label><button className="icon-button" onClick={load} aria-label="Refresh clients"><RefreshCw size={16}/></button><span className="table-count">{state.total} clients</span></div><ResourceTable loading={state.loading} error={state.error} rows={state.items} columns={[{key:'code',label:'Code'},{key:'companyName',label:'Company',render:r=><><strong>{r.companyName}</strong><small>{r.industry||'—'}</small></>},{key:'contactName',label:'Contact'},{key:'phone',label:'Phone'},{key:'email',label:'Email'},{key:'active',label:'Status',render:r=><span className="table-status">{r.active?'Active':'Inactive'}</span>}]} /></section>
    <Modal open={open} title="New client" description="Create the client record that will be reused across enquiries, quotes and projects." onClose={()=>setOpen(false)}><ClientForm onSubmit={createClient} onCancel={()=>setOpen(false)} submitting={saving}/></Modal>
  </div>;
}
