import React from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ResourceTable from '../../shared/components/ResourceTable';

function Field({label,children}){return <label className="form-field"><span>{label}</span>{children}</label>}

export default function PurchasingPage(){
  const [tab,setTab]=React.useState('orders');
  const [orders,setOrders]=React.useState([]); const [requests,setRequests]=React.useState([]); const [receipts,setReceipts]=React.useState([]);
  const [vendors,setVendors]=React.useState([]); const [materials,setMaterials]=React.useState([]); const [warehouses,setWarehouses]=React.useState([]);
  const [open,setOpen]=React.useState(false); const [query,setQuery]=React.useState(''); const [loading,setLoading]=React.useState(true); const [error,setError]=React.useState('');
  const [form,setForm]=React.useState({number:'',vendorId:'',projectId:'',jobId:'',orderDate:new Date().toISOString().slice(0,10),expectedDate:'',materialId:'',description:'',quantity:1,unit:'Nos',unitCost:0});

  const load=React.useCallback(async()=>{setLoading(true);setError('');try{const [o,r,g,v,m,w]=await Promise.all([api.listPurchaseOrders(),api.listPurchaseRequests(),api.listGoodsReceipts(),api.listVendors(),api.listMaterials(),api.listWarehouses()]);setOrders(o.data??[]);setRequests(r.data??[]);setReceipts(g.data??[]);setVendors(v.data??[]);setMaterials(m.data??[]);setWarehouses(w.data??[])}catch(e){setError(e.message)}finally{setLoading(false)}},[]);
  React.useEffect(()=>{load()},[load]);

  const createOrder=async()=>{try{const qty=Number(form.quantity),cost=Number(form.unitCost),subtotal=qty*cost;await api.createPurchaseOrder({number:form.number,vendorId:Number(form.vendorId),projectId:form.projectId?Number(form.projectId):null,jobId:form.jobId?Number(form.jobId):null,orderDate:new Date(form.orderDate).toISOString(),expectedDate:form.expectedDate?new Date(form.expectedDate).toISOString():null,subtotal,discount:0,tax:0,total:subtotal,status:'DRAFT',items:[{materialId:Number(form.materialId),description:form.description||materials.find(m=>m.id===Number(form.materialId))?.name||'Material',quantity:qty,unit:form.unit,unitCost:cost,total:subtotal}]});setOpen(false);await load()}catch(e){setError(e.message)}};

  const columns=tab==='orders'?[{key:'number',label:'PO'},{key:'vendor',label:'Vendor',render:r=>r.vendor?.companyName||'—'},{key:'orderDate',label:'Date',render:r=>new Date(r.orderDate).toLocaleDateString()},{key:'total',label:'Total',render:r=>`LKR ${Number(r.total).toLocaleString()}`},{key:'status',label:'Status'}]:tab==='requests'?[{key:'number',label:'PR'},{key:'purpose',label:'Purpose'},{key:'preferredVendor',label:'Vendor',render:r=>r.preferredVendor?.companyName||'—'},{key:'status',label:'Status'}]:[{key:'number',label:'GRN'},{key:'purchaseOrder',label:'Purchase Order',render:r=>r.purchaseOrder?.number||'—'},{key:'warehouse',label:'Warehouse',render:r=>r.warehouse?.name||'—'},{key:'receivedDate',label:'Received',render:r=>new Date(r.receivedDate).toLocaleDateString()},{key:'status',label:'Status'}];
  const rows=(tab==='orders'?orders:tab==='requests'?requests:receipts).filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));

  return <>
    <div className="page-head"><div><p className="eyebrow">PRODUCTION / PURCHASING</p><h1>Purchasing</h1><p>Manage purchase requests, supplier orders and goods received into stock.</p></div>{tab==='orders'&&<button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> New purchase order</button>}</div>
    <div className="section-tabs"><button className={tab==='orders'?'active':''} onClick={()=>setTab('orders')}>Purchase Orders</button><button className={tab==='requests'?'active':''} onClick={()=>setTab('requests')}>Purchase Requests</button><button className={tab==='receipts'?'active':''} onClick={()=>setTab('receipts')}>Goods Receipts</button></div>
    <div className="toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search purchasing records"/></div></div>
    <ResourceTable columns={columns} rows={rows} loading={loading} error={error}/>
    <Modal open={open} title="New purchase order" description="Create a supplier order for production materials." onClose={()=>setOpen(false)} width="760px">
      <div className="form-grid form-grid-2">
        <Field label="PO number"><input value={form.number} onChange={e=>setForm({...form,number:e.target.value})} placeholder="PO-2026-001"/></Field>
        <Field label="Vendor"><select value={form.vendorId} onChange={e=>setForm({...form,vendorId:e.target.value})}><option value="">Select vendor</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.companyName}</option>)}</select></Field>
        <Field label="Order date"><input type="date" value={form.orderDate} onChange={e=>setForm({...form,orderDate:e.target.value})}/></Field>
        <Field label="Expected delivery"><input type="date" value={form.expectedDate} onChange={e=>setForm({...form,expectedDate:e.target.value})}/></Field>
        <Field label="Material"><select value={form.materialId} onChange={e=>setForm({...form,materialId:e.target.value})}><option value="">Select material</option>{materials.map(m=><option key={m.id} value={m.id}>{m.sku} · {m.name}</option>)}</select></Field>
        <Field label="Description"><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Material description"/></Field>
        <Field label="Quantity"><input type="number" min="0.001" step="0.001" value={form.quantity} onChange={e=>setForm({...form,quantity:e.target.value})}/></Field>
        <Field label="Unit"><input value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})}/></Field>
        <Field label="Unit cost (LKR)"><input type="number" min="0" step="0.01" value={form.unitCost} onChange={e=>setForm({...form,unitCost:e.target.value})}/></Field>
      </div>
      <div className="modal-actions"><button className="secondary" onClick={()=>setOpen(false)}>Cancel</button><button className="primary" disabled={!form.number||!form.vendorId||!form.materialId} onClick={createOrder}>Create purchase order</button></div>
    </Modal>
  </>;
}
