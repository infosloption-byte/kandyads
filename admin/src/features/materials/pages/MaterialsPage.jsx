import React from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from '../../../api';
import Modal from '../../../components/common/Modal';
import ResourceTable from '../../shared/components/ResourceTable';
import MaterialForm from '../components/MaterialForm';

export default function MaterialsPage(){
  const [rows,setRows]=React.useState([]);const [categories,setCategories]=React.useState([]);const [query,setQuery]=React.useState('');const [open,setOpen]=React.useState(false);const [loading,setLoading]=React.useState(true);const [submitting,setSubmitting]=React.useState(false);const [error,setError]=React.useState('');
  const load=React.useCallback(async()=>{setLoading(true);setError('');try{const [materials,cats]=await Promise.all([api.listMaterials({q:query}),api.listMaterialCategories()]);setRows(materials.data??[]);setCategories(cats.data??[])}catch(e){setError(e.message)}finally{setLoading(false)}},[query]);
  React.useEffect(()=>{load()},[load]);
  const createMaterial=async(input)=>{setSubmitting(true);setError('');try{await api.createMaterial(input);setOpen(false);await load()}catch(e){setError(e.message)}finally{setSubmitting(false)}};
  const columns=[{key:'sku',label:'SKU'},{key:'name',label:'Material'},{key:'category',label:'Category',render:r=>r.category?.name||'—'},{key:'unit',label:'Unit'},{key:'standardCost',label:'Cost',render:r=>`LKR ${Number(r.standardCost).toLocaleString()}`},{key:'stockOnHand',label:'On hand',render:r=>Number(r.stockOnHand||0).toLocaleString()}];
  return <><div className="page-head"><div><p className="eyebrow">INVENTORY / MATERIALS</p><h1>Materials</h1><p>Maintain production materials, standard costs and current stock.</p></div><button className="primary" onClick={()=>setOpen(true)}><Plus size={16}/> Add material</button></div>
    <div className="toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search SKU or material name"/></div></div>
    <ResourceTable columns={columns} rows={rows} loading={loading} error={error}/>
    <Modal open={open} title="Create material" description="Add a material to the production catalogue." onClose={()=>setOpen(false)}><MaterialForm categories={categories} onSubmit={createMaterial} submitting={submitting}/></Modal>
  </>;
}
