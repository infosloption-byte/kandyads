import React from 'react';
import { Plus, Warehouse as WarehouseIcon } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ResourceTable from '../../shared/components/ResourceTable';
import StockMovementForm from '../components/StockMovementForm';

function WarehouseForm({onSubmit,submitting}){const [form,setForm]=React.useState({name:'',address:''});return <form className="entity-form" onSubmit={e=>{e.preventDefault();onSubmit(form)}}><label>Warehouse name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Main Warehouse"/></label><label>Address<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Pilimathalawa"/></label><button className="primary form-submit" disabled={submitting}>{submitting?'Saving…':'Create warehouse'}</button></form>}

export default function InventoryPage(){
  const [materials,setMaterials]=React.useState([]),[warehouses,setWarehouses]=React.useState([]),[projects,setProjects]=React.useState([]),[jobs,setJobs]=React.useState([]),[rows,setRows]=React.useState([]);const [openMovement,setOpenMovement]=React.useState(false),[openWarehouse,setOpenWarehouse]=React.useState(false);const [loading,setLoading]=React.useState(true),[submitting,setSubmitting]=React.useState(false),[error,setError]=React.useState('');
  const load=React.useCallback(async()=>{setLoading(true);setError('');try{const [m,w,p,j,s]=await Promise.all([api.listMaterials(),api.listWarehouses(),api.listProjects(),api.listJobs(),api.listStockMovements()]);setMaterials(m.data??[]);setWarehouses(w.data??[]);setProjects(p.data??[]);setJobs(j.data??[]);setRows(s.data??[])}catch(e){setError(e.message)}finally{setLoading(false)}},[]);
  React.useEffect(()=>{load()},[load]);
  const createMovement=async(input)=>{setSubmitting(true);setError('');try{await api.createStockMovement(input);setOpenMovement(false);await load()}catch(e){setError(e.message)}finally{setSubmitting(false)}};
  const createWarehouse=async(input)=>{setSubmitting(true);setError('');try{await api.createWarehouse(input);setOpenWarehouse(false);await load()}catch(e){setError(e.message)}finally{setSubmitting(false)}};
  const columns=[{key:'createdAt',label:'Date',render:r=>new Date(r.createdAt).toLocaleDateString()},{key:'material',label:'Material',render:r=>`${r.material?.sku??''} · ${r.material?.name??''}`},{key:'warehouse',label:'Warehouse',render:r=>r.warehouse?.name??'—'},{key:'type',label:'Movement',render:r=>r.type.replaceAll('_',' ')},{key:'quantity',label:'Qty',render:r=>Number(r.quantity).toLocaleString()},{key:'reference',label:'Reference'}];
  return <><div className="page-head"><div><p className="eyebrow">MATERIALS / INVENTORY</p><h1>Inventory</h1><p>Track receipts, issues, returns, adjustments and material usage by warehouse.</p></div><div className="page-actions"><button className="secondary" onClick={()=>setOpenWarehouse(true)}><WarehouseIcon size={16}/> Add warehouse</button><button className="primary" onClick={()=>setOpenMovement(true)}><Plus size={16}/> Stock movement</button></div></div>
    <div className="stats-row"><div className="stat-card"><span>Materials</span><strong>{materials.length}</strong></div><div className="stat-card"><span>Warehouses</span><strong>{warehouses.length}</strong></div><div className="stat-card"><span>Recent movements</span><strong>{rows.length}</strong></div></div>
    <ResourceTable columns={columns} rows={rows} loading={loading} error={error}/>
    <Modal open={openMovement} title="Post stock movement" description="Every inventory transaction should reference the material and warehouse involved." onClose={()=>setOpenMovement(false)} width="720px"><StockMovementForm materials={materials} warehouses={warehouses} projects={projects} jobs={jobs} onSubmit={createMovement} submitting={submitting}/></Modal>
    <Modal open={openWarehouse} title="Create warehouse" description="Add a physical stock location." onClose={()=>setOpenWarehouse(false)}><WarehouseForm onSubmit={createWarehouse} submitting={submitting}/></Modal>
  </>;
}
