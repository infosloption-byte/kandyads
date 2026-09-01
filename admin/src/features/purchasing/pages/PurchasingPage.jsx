import React from 'react';
import { Plus, Search, PackageCheck, ClipboardPlus } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ResourceTable from '../../shared/components/ResourceTable';

function Field({label,children}){return <label className="form-field"><span>{label}</span>{children}</label>}

export default function PurchasingPage(){
  const [tab,setTab]=React.useState('orders');
  const [orders,setOrders]=React.useState([]); const [requests,setRequests]=React.useState([]); const [receipts,setReceipts]=React.useState([]);
  const [vendors,setVendors]=React.useState([]); const [materials,setMaterials]=React.useState([]); const [warehouses,setWarehouses]=React.useState([]);
  const [open,setOpen]=React.useState(null); const [query,setQuery]=React.useState(''); const [loading,setLoading]=React.useState(true); const [error,setError]=React.useState('');
  const [form,setForm]=React.useState({number:'',vendorId:'',projectId:'',jobId:'',orderDate:new Date().toISOString().slice(0,10),expectedDate:'',materialId:'',description:'',quantity:1,unit:'Nos',unitCost:0});
  const [requestForm,setRequestForm]=React.useState({number:'',materialId:'',requestedQty:1,estimatedUnitCost:0,purpose:''});
  const [receiptForm,setReceiptForm]=React.useState({number:'',purchaseOrderId:'',warehouseId:'',receivedDate:new Date().toISOString().slice(0,10),purchaseOrderItemId:'',receivedQty:1,unitCost:0});

  const load=React.useCallback(async()=>{setLoading(true);setError('');try{const [o,r,g,v,m,w]=await Promise.all([api.listPurchaseOrders(),api.listPurchaseRequests(),api.listGoodsReceipts(),api.listVendors(),api.listMaterials(),api.listWarehouses()]);setOrders(o.data??[]);setRequests(r.data??[]);setReceipts(g.data??[]);setVendors(v.data??[]);setMaterials(m.data??[]);setWarehouses(w.data??[])}catch(e){setError(e.message)}finally{setLoading(false)}},[]);
  React.useEffect(()=>{load()},[load]);

  const createOrder=async()=>{try{const qty=Number(form.quantity),cost=Number(form.unitCost),subtotal=qty*cost;await api.createPurchaseOrder({number:form.number,vendorId:Number(form.vendorId),projectId:form.projectId?Number(form.projectId):null,jobId:form.jobId?Number(form.jobId):null,orderDate:new Date(form.orderDate).toISOString(),expectedDate:form.expectedDate?new Date(form.expectedDate).toISOString():null,subtotal,discount:0,tax:0,total:subtotal,status:'DRAFT',items:[{materialId:Number(form.materialId),description:form.description||materials.find(m=>m.id===Number(form.materialId))?.name||'Material',quantity:qty,unit:form.unit,unitCost:cost,total:subtotal}]});setOpen(null);await load()}catch(e){setError(e.message)}};
  const createRequest=async()=>{try{await api.createPurchaseRequest({number:requestForm.number,purpose:requestForm.purpose,requiredBy:new Date().toISOString(),status:'DRAFT',items:[{materialId:Number(requestForm.materialId),requestedQty:Number(requestForm.requestedQty),estimatedUnitCost:Number(requestForm.estimatedUnitCost)}]});setOpen(null);await load()}catch(e){setError(e.message)}};
  const createReceipt=async()=>{try{const po=orders.find(o=>o.id===Number(receiptForm.purchaseOrderId));const item=po?.items?.find(i=>i.id===Number(receiptForm.purchaseOrderItemId));if(!item)throw new Error('Select a purchase-order item');await api.createGoodsReceipt({number:receiptForm.number,purchaseOrderId:Number(receiptForm.purchaseOrderId),warehouseId:Number(receiptForm.warehouseId),receivedDate:new Date(receiptForm.receivedDate).toISOString(),items:[{purchaseOrderItemId:Number(receiptForm.purchaseOrderItemId),receivedQty:Number(receiptForm.receivedQty),unitCost:Number(receiptForm.unitCost||item.unitCost)}]});setOpen(null);await load()}catch(e){setError(e.message)}};

  const selectedPo=orders.find(o=>o.id===Number(receiptForm.purchaseOrderId));
  const columns=tab==='orders'?[{key:'number',label:'PO'},{key:'vendor',label:'Vendor',render:r=>r.vendor?.companyName||'—'},{key:'orderDate',label:'Date',render:r=>new Date(r.orderDate).toLocaleDateString()},{key:'total',label:'Total',render:r=>`LKR ${Number(r.total).toLocaleString()}`},{key:'status',label:'Status'}]:tab==='requests'?[{key:'number',label:'PR'},{key:'purpose',label:'Purpose'},{key:'preferredVendor',label:'Vendor',render:r=>r.preferredVendor?.companyName||'—'},{key:'status',label:'Status'}]:[{key:'number',label:'GRN'},{key:'purchaseOrder',label:'Purchase Order',render:r=>r.purchaseOrder?.number||'—'},{key:'warehouse',label:'Warehouse',render:r=>r.warehouse?.name||'—'},{key:'receivedDate',label:'Received',render:r=>new Date(r.receivedDate).toLocaleDateString()},{key:'status',label:'Status'}];
  const rows=(tab==='orders'?orders:tab==='requests'?requests:receipts).filter(r=>JSON.stringify(r).toLowerCase().includes(query.toLowerCase()));

  return <>
    <div className="page-head"><div><p className="eyebrow">PRODUCTION / PURCHASING</p><h1>Purchasing</h1><p>Manage purchase requests, supplier orders and goods received into stock.</p></div><div className="page-actions">{tab==='requests'&&<button className="secondary" onClick={()=>setOpen('request')}><ClipboardPlus size={16}/> New request</button>}{tab==='orders'&&<button className="primary" onClick={()=>setOpen('order')}><Plus size={16}/> New purchase order</button>}{tab==='receipts'&&<button className="primary" onClick={()=>setOpen('receipt')}><PackageCheck size={16}/> Receive goods</button>}</div></div>
    <div className="section-tabs"><button className={tab==='orders'?'active':''} onClick={()=>setTab('orders')}>Purchase Orders</button><button className={tab==='requests'?'active':''} onClick={()=>setTab('requests')}>Purchase Requests</button><button className={tab==='receipts'?'active':''} onClick={()=>setTab('receipts')}>Goods Receipts</button></div>
    <div className="toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search purchasing records"/></div></div>
    <ResourceTable columns={columns} rows={rows} loading={loading} error={error}/>

    <Modal open={open==='order'} title="New purchase order" description="Create a supplier order for production materials." onClose={()=>setOpen(null)} width="760px">
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
      <div className="modal-actions"><button className="secondary" onClick={()=>setOpen(null)}>Cancel</button><button className="primary" disabled={!form.number||!form.vendorId||!form.materialId} onClick={createOrder}>Create purchase order</button></div>
    </Modal>

    <Modal open={open==='request'} title="New purchase request" description="Request materials before they are converted into a supplier order." onClose={()=>setOpen(null)}>
      <div className="form-grid form-grid-2">
        <Field label="Request number"><input value={requestForm.number} onChange={e=>setRequestForm({...requestForm,number:e.target.value})} placeholder="PR-2026-001"/></Field>
        <Field label="Material"><select value={requestForm.materialId} onChange={e=>setRequestForm({...requestForm,materialId:e.target.value})}><option value="">Select material</option>{materials.map(m=><option key={m.id} value={m.id}>{m.sku} · {m.name}</option>)}</select></Field>
        <Field label="Requested quantity"><input type="number" min="0.001" step="0.001" value={requestForm.requestedQty} onChange={e=>setRequestForm({...requestForm,requestedQty:e.target.value})}/></Field>
        <Field label="Estimated unit cost"><input type="number" min="0" step="0.01" value={requestForm.estimatedUnitCost} onChange={e=>setRequestForm({...requestForm,estimatedUnitCost:e.target.value})}/></Field>
        <Field label="Purpose"><textarea value={requestForm.purpose} onChange={e=>setRequestForm({...requestForm,purpose:e.target.value})} placeholder="Why are these materials needed?"/></Field>
      </div>
      <div className="modal-actions"><button className="secondary" onClick={()=>setOpen(null)}>Cancel</button><button className="primary" disabled={!requestForm.number||!requestForm.materialId} onClick={createRequest}>Create request</button></div>
    </Modal>

    <Modal open={open==='receipt'} title="Receive goods" description="Post received material into a warehouse and update the purchase order." onClose={()=>setOpen(null)}>
      <div className="form-grid form-grid-2">
        <Field label="GRN number"><input value={receiptForm.number} onChange={e=>setReceiptForm({...receiptForm,number:e.target.value})} placeholder="GRN-2026-001"/></Field>
        <Field label="Purchase order"><select value={receiptForm.purchaseOrderId} onChange={e=>setReceiptForm({...receiptForm,purchaseOrderId:e.target.value,purchaseOrderItemId:'',unitCost:0})}><option value="">Select purchase order</option>{orders.filter(o=>o.status!=='RECEIVED'&&o.status!=='CANCELLED').map(o=><option key={o.id} value={o.id}>{o.number} · {o.vendor?.companyName}</option>)}</select></Field>
        <Field label="Warehouse"><select value={receiptForm.warehouseId} onChange={e=>setReceiptForm({...receiptForm,warehouseId:e.target.value})}><option value="">Select warehouse</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></Field>
        <Field label="Received date"><input type="date" value={receiptForm.receivedDate} onChange={e=>setReceiptForm({...receiptForm,receivedDate:e.target.value})}/></Field>
        <Field label="PO item"><select value={receiptForm.purchaseOrderItemId} onChange={e=>{const item=selectedPo?.items?.find(i=>i.id===Number(e.target.value));setReceiptForm({...receiptForm,purchaseOrderItemId:e.target.value,unitCost:item?Number(item.unitCost):0})}}><option value="">Select item</option>{selectedPo?.items?.filter(i=>Number(i.receivedQty)<Number(i.quantity)).map(i=><option key={i.id} value={i.id}>{i.description} · {i.quantity} {i.unit}</option>)}</select></Field>
        <Field label="Received quantity"><input type="number" min="0.001" step="0.001" value={receiptForm.receivedQty} onChange={e=>setReceiptForm({...receiptForm,receivedQty:e.target.value})}/></Field>
        <Field label="Unit cost (LKR)"><input type="number" min="0" step="0.01" value={receiptForm.unitCost} onChange={e=>setReceiptForm({...receiptForm,unitCost:e.target.value})}/></Field>
      </div>
      <div className="modal-actions"><button className="secondary" onClick={()=>setOpen(null)}>Cancel</button><button className="primary" disabled={!receiptForm.number||!receiptForm.purchaseOrderId||!receiptForm.purchaseOrderItemId||!receiptForm.warehouseId} onClick={createReceipt}>Post receipt</button></div>
    </Modal>
  </>;
}
