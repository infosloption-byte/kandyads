import React from 'react';

const initial={sku:'',name:'',categoryId:'',unit:'Nos',standardCost:'',sellingPrice:'',reorderLevel:'0',minimumStock:'0',preferredVendorId:''};

export default function MaterialForm({categories=[],vendors=[],onSubmit,submitting=false}){
  const [form,setForm]=React.useState(initial);
  const update=(key,value)=>setForm((state)=>({...state,[key]:value}));
  const submit=(event)=>{event.preventDefault();onSubmit({
    ...form,
    categoryId:form.categoryId||null,
    preferredVendorId:form.preferredVendorId||null,
    standardCost:Number(form.standardCost||0),
    sellingPrice:form.sellingPrice===''?null:Number(form.sellingPrice),
    reorderLevel:Number(form.reorderLevel||0),
    minimumStock:Number(form.minimumStock||0),
  });};
  return <form className="entity-form" onSubmit={submit}>
    <div className="form-grid two">
      <label>SKU<input required value={form.sku} onChange={e=>update('sku',e.target.value)} placeholder="MAT-001"/></label>
      <label>Unit<input required value={form.unit} onChange={e=>update('unit',e.target.value)} placeholder="Nos / sqft / m"/></label>
    </div>
    <label>Material name<input required value={form.name} onChange={e=>update('name',e.target.value)} placeholder="3mm Acrylic Sheet"/></label>
    <div className="form-grid two">
      <label>Category<select value={form.categoryId} onChange={e=>update('categoryId',e.target.value)}><option value="">Uncategorized</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label>Preferred vendor<select value={form.preferredVendorId} onChange={e=>update('preferredVendorId',e.target.value)}><option value="">None</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.companyName}</option>)}</select></label>
    </div>
    <div className="form-grid two">
      <label>Standard cost<input required type="number" min="0" step="0.01" value={form.standardCost} onChange={e=>update('standardCost',e.target.value)} /></label>
      <label>Selling price<input type="number" min="0" step="0.01" value={form.sellingPrice} onChange={e=>update('sellingPrice',e.target.value)} /></label>
      <label>Reorder level<input type="number" min="0" step="0.001" value={form.reorderLevel} onChange={e=>update('reorderLevel',e.target.value)} /></label>
      <label>Minimum stock<input type="number" min="0" step="0.001" value={form.minimumStock} onChange={e=>update('minimumStock',e.target.value)} /></label>
    </div>
    <button className="primary form-submit" disabled={submitting}>{submitting?'Saving…':'Create material'}</button>
  </form>;
}
