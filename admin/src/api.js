const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
export function getToken(){ return localStorage.getItem('kandyads_admin_token'); }
export function clearToken(){ localStorage.removeItem('kandyads_admin_token'); localStorage.removeItem('kandyads_admin_user'); }
async function request(path, options={}){const token=getToken();const response=await fetch(`${API_BASE}${path}`,{...options,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{}) ,...(options.headers||{})}});const payload=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401)clearToken();throw new Error(payload?.error?.message||'Request failed')}return payload}
const list=(resource,params={})=>{const clean=Object.fromEntries(Object.entries(params).filter(([,value])=>value!==undefined&&value!==''));const query=new URLSearchParams(clean).toString();return request(`/${resource}${query?`?${query}`:''}`)};
const create=(resource,input)=>request(`/${resource}`,{method:'POST',body:JSON.stringify(input)});
const patch=(resource,id,input)=>request(`/${resource}/${id}`,{method:'PATCH',body:JSON.stringify(input)});
const postNested=(resource,id,action,input)=>request(`/${resource}/${id}/${action}`,{method:'POST',body:JSON.stringify(input)});
const approval=(resource,id,action,input={})=>request(`/approvals/${resource}/${id}/${action}`,{method:'POST',body:JSON.stringify(input)});
export const api={
 login:async input=>{const result=await request('/auth/login',{method:'POST',body:JSON.stringify(input)});localStorage.setItem('kandyads_admin_token',result.data.token);localStorage.setItem('kandyads_admin_user',JSON.stringify(result.data.user));return result.data.user},
 me:()=>request('/auth/me'),logout:()=>clearToken(),getDashboardSummary:()=>request('/dashboard/summary'),
 listLeads:p=>list('leads',p),createLead:i=>create('leads',i),updateLead:(id,i)=>patch('leads',id,i),convertLead:(id,i={})=>request(`/leads/${id}/convert`,{method:'POST',body:JSON.stringify(i)}),
 listClients:p=>list('clients',p),getClient:id=>request(`/clients/${id}`),createClient:i=>create('clients',i),
 listEnquiries:p=>list('enquiries',p),createEnquiry:i=>create('enquiries',i),convertEnquiryToQuote:(id,i)=>request(`/enquiries/${id}/convert-to-quote`,{method:'POST',body:JSON.stringify(i)}),
 listQuotes:p=>list('quotes',p),createQuote:i=>create('quotes',i),updateQuoteStatus:(id,i)=>request(`/quotes/${id}/status`,{method:'PATCH',body:JSON.stringify(i)}),convertQuoteToProject:(id,i={})=>request(`/quotes/${id}/convert-to-project`,{method:'POST',body:JSON.stringify(i)}),
 listProjects:p=>list('projects',p),getProject:id=>request(`/projects/${id}`),createProject:i=>create('projects',i),updateProjectStatus:(id,i)=>request(`/projects/${id}/status`,{method:'PATCH',body:JSON.stringify(i)}),
 listServices:p=>list('services',p),createService:i=>create('services',i),
 listJobs:p=>list('jobs',p),getJob:id=>request(`/jobs/${id}`),createJob:i=>create('jobs',i),updateJobStatus:(id,i)=>request(`/jobs/${id}/status`,{method:'PATCH',body:JSON.stringify(i)}),createJobAssignment:(id,i)=>postNested('jobs',id,'assignments',i),createJobMaterialRequirement:(id,i)=>postNested('jobs',id,'material-requirements',i),createJobStockMovement:(id,i)=>postNested('jobs',id,'stock-movements',i),createJobTimeEntry:(id,i)=>postNested('jobs',id,'time-entries',i),
 listTasks:p=>list('tasks',p),getTask:id=>request(`/tasks/${id}`),createTask:i=>create('tasks',i),updateTask:(id,i)=>patch('tasks',id,i),updateTaskStatus:(id,i)=>request(`/tasks/${id}/status`,{method:'PATCH',body:JSON.stringify(i)}),
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
 listGoodsReceipts:p=>list('goods-receipts',p),createGoodsReceipt:i=>create('goods-receipts',i),
 listInstallations:p=>list('installations',p),createInstallation:i=>create('installations',i),updateInstallationStatus:(id,i)=>request(`/installations/${id}/status`,{method:'PATCH',body:JSON.stringify(i)}),
 listInvoices:p=>list('invoices',p),createInvoice:i=>create('invoices',i),getInvoice:id=>request(`/invoices/${id}`),
 listPayments:p=>list('payments',p),createPayment:i=>create('payments',i),
 listProfitabilityProjects:p=>list('profitability/projects',p),listProfitabilityJobs:p=>list('profitability/jobs',p),getProfitabilitySummary:()=>request('/profitability/summary'),getJobProfitability:id=>request(`/profitability/jobs/${id}`),
 listSettingsUsers:p=>list('settings/users',p),createSettingsUser:i=>create('settings/users',i),updateSettingsUser:(id,i)=>patch('settings/users',id,i),
 listSettingsRoles:()=>request('/settings/roles'),createSettingsRole:i=>create('settings/roles',i),
 listSettingsPermissions:()=>request('/settings/permissions'),updateSettingsRolePermissions:(id,i)=>request(`/settings/roles/${id}/permissions`,{method:'PUT',body:JSON.stringify(i)}),
 getApprovalSummary:()=>request('/approvals/summary'),getPendingApprovals:()=>request('/approvals/pending'),getApprovalAudit:p=>list('approvals/audit',p),
 submitPurchaseRequest:(id)=>approval('purchase-requests',id,'submit'),approvePurchaseRequest:(id)=>approval('purchase-requests',id,'approve'),rejectPurchaseRequest:(id,reason)=>approval('purchase-requests',id,'reject',{reason}),
 approvePurchaseOrder:(id)=>approval('purchase-orders',id,'approve'),sendPurchaseOrder:(id)=>approval('purchase-orders',id,'send'),
 submitExpense:(id)=>approval('expenses',id,'submit'),approveExpense:(id)=>approval('expenses',id,'approve'),rejectExpense:(id,reason)=>approval('expenses',id,'reject',{reason}),markExpensePaid:(id)=>approval('expenses',id,'mark-paid'),
 approveOutsource:(id)=>approval('outsourcing',id,'approve'),rejectOutsource:(id,reason)=>approval('outsourcing',id,'reject',{reason}),
 approveTimeEntry:(id)=>approval('time',id,'approve'),
};
