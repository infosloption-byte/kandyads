import React from 'react';

export default function StockMovementForm({materials=[],warehouses=[],projects=[],jobs=[],onSubmit,submitting=false}){
  const [form,setForm]=React.useState({materialId:'',warehouseId:'',type:'PURCHASE_RECEIPT',quantity:'1',unitCost:'',projectId:'',jobId:'',reference:''});
  const update=(key,value)=>setForm(s=>({...s,[key]:value}));
  const submit=(event)=>{event.preventDefault();onSubmit({...form,materialId:Number(form.materialId),warehouseId:Number(form.warehouseId),quantity:Number(form.quantity),unitCost:form.unitCost===''?null:Number(form.unitCost),projectId:form.projectId||null,jobId:form.jobId||null,reference:form.reference||null})};
  return <form className="entity-form" onSubmit={submit}>
    <div className="form-grid two">
      <label>Material<select required value={form.materialId} onChange={e=>update('materialId',e.target.value)}><option value="">Select material</option>{materials.map(m=><option key={m.id} value={m.id}>{m.sku} · {m.name}</option>)}</select></label>
      <label>Warehouse<select required value={form.warehouseId} onChange={e=>update('warehouseId',e.target.value)}><option value="">Select warehouse</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></label>
    </div>
    <div className="form-grid two">
      <label>Movement type<select value={form.type} onChange={e=>update('type',e.target.value)}>{['PURCHASE_RECEIPT','ISSUE','RETURN','TRANSFER','ADJUSTMENT','WASTE'].map(v=><option key={v} value={v}>{v.replaceAll('_',' ')}</option>)}</select></label>
      <label>Quantity<input required type="number" min="0.001" step="0.001" value={form.quantity} onChange={e=>update('quantity',e.target.value)}/></label>
      <label>Unit cost<input type="number" min="0" step="0.01" value={form.unitCost} onChange={e=>update('unitCost',e.target.value)} placeholder="Optional"/></label>
      <label>Reference<input value={form.reference} onChange={e=>update('reference',e.target.value)} placeholder="GRN / job / manual ref"/></label>
    </div>
    <div className="form-grid two">
      <label>Project (optional)<select value={form.projectId} onChange={e=>update('projectId',e.target.value)}><option value="">None</option>{projects.map(p=><option key={p.id} value={p.id}>{p.number} · {p.name}</option>)}</select></label>
      <label>Job (optional)<select value={form.jobId} onChange={e=>update('jobId',e.target.value)}><option value="">None</option>{jobs.map(j=><option key={j.id} value={j.id}>{j.number} · {j.title}</option>)}</select></label>
    </div>
    <button className="primary form-submit" disabled={submitting}>{submitting?'Posting…':'Post movement'}</button>
  </form>;
}
