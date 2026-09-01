const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
export function getToken(){ return localStorage.getItem('kandyads_admin_token'); }
export function clearToken(){ localStorage.removeItem('kandyads_admin_token'); localStorage.removeItem('kandyads_admin_user'); }
async function request(path, options={}){const token=getToken();const response=await fetch(`${API_BASE}${path}`,{headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...options.headers},...options});const payload=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401)clearToken();throw new Error(payload?.error?.message||'Request failed')}return payload}
const list=(resource,params={})=>{const clean=Object.fromEntries(Object.entries(params).filter(([,value])=>value!==undefined&&value!==''));const query=new URLSearchParams(clean).toString();return request(`/${resource}${query?`?${query}`:''}`)};
const create=(resource,input)=>request(`/${resource}`,{method:'POST',body:JSON.stringify(input)});
const patch=(resource,id,input)=>request(`/${resource}/${id}`,{method:'PATCH',body:JSON.stringify(input)});
export const api={
 login:async input=>{const result=await request('/auth/login',{method:'POST',body:JSON.stringify(input)});localStorage.setItem('kandyads_admin_token',result.data.token);localStorage.setItem('kandyads_admin_user',JSON.stringify(result.data.user));return result.data.user},
 me:()=>request('/auth/me'),logout:()=>clearToken(),getDashboardSummary:()=>request('/dashboard/summary'),
 listLeads:p=>list('leads',p),createLead:i=>create('leads',i),updateLead:(id,i)=>patch('leads',id,i),convertLead:(id,i={})=>request(`/leads/${id}/convert`,{method:'POST',body:JSON.stringify(i)}),
 listClients:p=>list('clients',p),createClient:i=>create('clients',i),
 listEnquiries:p=>list('enquiries',p),createEnquiry:i=>create('enquiries',i),
 listQuotes:p=>list('quotes',p),createQuote:i=>create('quotes',i),
 listProjects:p=>list('projects',p),createProject:i=>create('projects',i),
 listServices:p=>list('services',p),createService:i=>create('services',i),
 listJobs:p=>list('jobs',p),createJob:i=>create('jobs',i),
 listTasks:p=>list('tasks',p),createTask:i=>create('tasks',i),
 listEmployees:p=>list('employees',p),createEmployee:i=>create('employees',i),
 listTime:p=>list('time',p),createTime:i=>create('time',i),
 listMaterialCategories:p=>list('material-categories',p),createMaterialCategory:i=>create('material-categories',i),
 listMaterials:p=>list('materials',p),createMaterial:i=>create('materials',i),
 listWarehouses:p=>list('warehouses',p),createWarehouse:i=>create('warehouses',i),
 listStockMovements:p=>list('stock-movements',p),createStockMovement:i=>create('stock-movements',i),
 listVendors:p=>list('vendors',p),createVendor:i=>create('vendors',i),
 listOutsourcing:p=>list('outsourcing',p),createOutsourceOrder:i=>create('outsourcing',i),
 listExpenseCategories:p=>list('expense-categories',p),createExpenseCategory:i=>create('expense-categories',i),
 listExpenses:p=>list('expenses',p),createExpense:i=>create('expenses',i),
 listPurchaseRequests:p=>list('purchase-requests',p),createPurchaseRequest:i=>create('purchase-requests',i),
 listPurchaseOrders:p=>list('purchase-orders',p),createPurchaseOrder:i=>create('purchase-orders',i),
 listGoodsReceipts:p=>list('goods-receipts',p),createGoodsReceipt:i=>createGoodsReceipt(i),
 listInstallations:p=>list('installations',p),createInstallation:i=>create('installations',i),updateInstallationStatus:(id,i)=>request(`/installations/${id}/status`,{method:'PATCH',body:JSON.stringify(i)}),
 listInvoices:p=>list('invoices',p),createInvoice:i=>create('invoices',i),getInvoice:id=>request(`/invoices/${id}`),
 listPayments:p=>list('payments',p),createPayment:i=>create('payments',i),
 listProfitabilityProjects:p=>list('profitability/projects',p),listProfitabilityJobs:p=>list('profitability/jobs',p),getProfitabilitySummary:()=>request('/profitability/summary'),getJobProfitability:id=>request(`/profitability/jobs/${id}`),
};
