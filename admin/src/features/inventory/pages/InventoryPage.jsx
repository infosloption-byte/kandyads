import React from 'react';
import { AlertTriangle, Plus, Warehouse as WarehouseIcon } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ResourceTable from '../../shared/components/ResourceTable';
import StockMovementForm from '../components/StockMovementForm';

function WarehouseForm({onSubmit,submitting}){const [form,setForm]=React.useState({name:'',address:''});return <form className="entity-form" onSubmit={e=>{e.preventDefault();onSubmit(form)}}><label>Warehouse name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Main Warehouse"/></label><label>Address<input value={form.address} onChange={e=>setForm({...form,address:e.target.value})} placeholder="Pilimathalawa"/></label><button className="primary form-submit" disabled={submitting}>{submitting?'Saving…':'Create warehouse'}</button></form>}

const qty=value=>Number(value??0).toLocaleString(undefined,{maximumFractionDigits:3});
const movementTypes=['','PURCHASE_RECEIPT','ISSUE','RETURN','TRANSFER','ADJUSTMENT','WASTE'];

export default function InventoryPage(){
  const [materials,setMaterials]=React.useState([]),[warehouses,setWarehouses]=React.useState([]),[projects,setProjects]=React.useState([]),[jobs,setJobs]=React.useState([]),[summary,setSummary]=React.useState([]),[alerts,setAlerts]=React.useState([]),[rows,setRows]=React.useState([]);
  const [ledgerMeta,setLedgerMeta]=React.useState({page:1,pageSize:25,total:0,totalPages:1});
  const [ledgerFilters,setLedgerFilters]=React.useState({materialId:'',warehouseId:'',type:''});
  const [openMovement,setOpenMovement]=React.useState(false),[openWarehouse,setOpenWarehouse]=React.useState(false);
  const [loading,setLoading]=React.useState(true),[ledgerLoading,setLedgerLoading]=React.useState(true),[submitting,setSubmitting]=React.useState(false),[error,setError]=React.useState('');

  const loadLedger=React.useCallback(async(page=1)=>{setLedgerLoading(true);try{const result=await api.listStockMovements({page,pageSize:25,...ledgerFilters});setRows(result.data??[]);setLedgerMeta(result.meta??{page,pageSize:25,total:0,totalPages:1})}catch(e){setError(e.message)}finally{setLedgerLoading(false)}},[ledgerFilters]);
  const load=React.useCallback(async()=>{setLoading(true);setError('');try{const [m,w,p,j,s,a]=await Promise.all([api.listMaterials(),api.listWarehouses(),api.listProjects(),api.listJobs(),api.getInventorySummary(),api.listInventoryReorderAlerts()]);setMaterials(m.data??[]);setWarehouses(w.data??[]);setProjects(p.data??[]);setJobs(j.data??[]);setSummary(s.data??[]);setAlerts(a.data??[]);await loadLedger(1)}catch(e){setError(e.message)}finally{setLoading(false)}},[loadLedger]);
  React.useEffect(()=>{load()},[load]);
  const createMovement=async(input)=>{setSubmitting(true);setError('');try{await api.createStockMovement(input);setOpenMovement(false);await load()}catch(e){setError(e.message)}finally{setSubmitting(false)}};
  const createWarehouse=async(input)=>{setSubmitting(true);setError('');try{await api.createWarehouse(input);setOpenWarehouse(false);await load()}catch(e){setError(e.message)}finally{setSubmitting(false)}};
  const onHand=summary.reduce((sum,row)=>sum+Number(row.stockOnHand??0),0);
  const reserved=summary.reduce((sum,row)=>sum+Number(row.reservedQty??0),0);
  const available=summary.reduce((sum,row)=>sum+Number(row.availableQty??0),0);
  const summaryColumns=[
    {key:'material',label:'Material',render:r=><><strong>{r.sku}</strong><span className="cell-subtext">{r.name}</span></>},
    {key:'stockOnHand',label:'On hand',render:r=>qty(r.stockOnHand)},
    {key:'reservedQty',label:'Reserved',render:r=>qty(r.reservedQty)},
    {key:'availableQty',label:'Available',render:r=>qty(r.availableQty)},
    {key:'reorderLevel',label:'Reorder level',render:r=>qty(r.reorderLevel)},
    {key:'status',label:'Status',render:r=>r.reorderAlert?<span className="status-pill danger">Reorder</span>:<span className="status-pill success">OK</span>},
  ];
  const alertColumns=[
    {key:'material',label:'Material',render:r=>`${r.sku} · ${r.name}`},
    {key:'availableQty',label:'Available',render:r=>qty(r.availableQty)},
    {key:'reorderLevel',label:'Reorder at',render:r=>qty(r.reorderLevel)},
    {key:'preferredVendor',label:'Preferred vendor',render:r=>r.preferredVendor?.companyName??'—'},
  ];
  const ledgerColumns=[
    {key:'createdAt',label:'Date',render:r=>new Date(r.createdAt).toLocaleString()},
    {key:'material',label:'Material',render:r=>`${r.material?.sku??''} · ${r.material?.name??''}`},
    {key:'warehouse',label:'Warehouse',render:r=>r.warehouse?.name??'—'},
    {key:'type',label:'Movement',render:r=>r.type.replaceAll('_',' ')},
    {key:'signedQuantity',label:'Signed qty',render:r=><span className={Number(r.signedQuantity)<0?'negative-number':''}>{qty(r.signedQuantity)}</span>},
    {key:'reference',label:'Reference',render:r=>r.reference??'—'},
  ];
  const updateFilter=(key,value)=>setLedgerFilters(filters=>({...filters,[key]:value}));
  const resetFilters=()=>setLedgerFilters({materialId:'',warehouseId:'',type:''});

  return <>
    <div className="page-head"><div><p className="eyebrow">MATERIALS / INVENTORY</p><h1>Inventory</h1><p>Track on-hand, reserved and available stock, reorder needs, and the full movement ledger.</p></div><div className="page-actions"><button className="secondary" onClick={()=>setOpenWarehouse(true)}><WarehouseIcon size={16}/> Add warehouse</button><button className="primary" onClick={()=>setOpenMovement(true)}><Plus size={16}/> Stock movement</button></div></div>
    {error&&<div className="error-state">{error}</div>}
    <div className="stats-row"><div className="stat-card"><span>Materials</span><strong>{summary.length||materials.length}</strong></div><div className="stat-card"><span>On hand</span><strong>{qty(onHand)}</strong></div><div className="stat-card"><span>Reserved</span><strong>{qty(reserved)}</strong></div><div className="stat-card"><span>Available</span><strong>{qty(available)}</strong></div><div className="stat-card"><span>Reorder alerts</span><strong>{alerts.length}</strong></div></div>
    <section className="content-section"><div className="section-head"><div><h2>Stock overview</h2><p>Available stock is on-hand quantity less active job reservations.</p></div></div><ResourceTable columns={summaryColumns} rows={summary} loading={loading} /></section>
    <section className="content-section"><div className="section-head"><div><h2><AlertTriangle size={17}/> Reorder alerts</h2><p>Materials at or below their configured reorder level.</p></div></div><ResourceTable columns={alertColumns} rows={alerts} loading={loading} /></section>
    <section className="content-section"><div className="section-head"><div><h2>Stock ledger</h2><p>Filter the complete movement history by material, warehouse and movement type.</p></div></div>
      <div className="filter-bar">
        <label>Material<select value={ledgerFilters.materialId} onChange={e=>updateFilter('materialId',e.target.value)}><option value="">All materials</option>{materials.map(m=><option key={m.id} value={m.id}>{m.sku} · {m.name}</option>)}</select></label>
        <label>Warehouse<select value={ledgerFilters.warehouseId} onChange={e=>updateFilter('warehouseId',e.target.value)}><option value="">All warehouses</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
        <label>Movement<select value={ledgerFilters.type} onChange={e=>updateFilter('type',e.target.value)}>{movementTypes.map(v=><option key={v} value={v}>{v?v.replaceAll('_',' '):'All movements'}</option>)}</select></label>
        <button className="secondary" onClick={resetFilters}>Clear</button>
        <button className="primary" onClick={()=>loadLedger(1)}>Apply</button>
      </div>
      <ResourceTable columns={ledgerColumns} rows={rows} loading={ledgerLoading}/>
      <div className="pagination-row"><span>Page {ledgerMeta.page} of {ledgerMeta.totalPages} · {ledgerMeta.total} movements</span><div><button className="secondary" disabled={ledgerLoading||ledgerMeta.page<=1} onClick={()=>loadLedger(ledgerMeta.page-1)}>Previous</button><button className="secondary" disabled={ledgerLoading||ledgerMeta.page>=ledgerMeta.totalPages} onClick={()=>loadLedger(ledgerMeta.page+1)}>Next</button></div></div>
    </section>
    <Modal open={openMovement} title="Post stock movement" description="Every inventory transaction should reference the material and warehouse involved." onClose={()=>setOpenMovement(false)} width="720px"><StockMovementForm materials={materials} warehouses={warehouses} projects={projects} jobs={jobs} onSubmit={createMovement} submitting={submitting}/></Modal>
    <Modal open={openWarehouse} title="Create warehouse" description="Add a physical stock location." onClose={()=>setOpenWarehouse(false)}><WarehouseForm onSubmit={createWarehouse} submitting={submitting}/></Modal>
  </>;
}
