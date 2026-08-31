const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
export function getToken(){ return localStorage.getItem('kandyads_admin_token'); }
export function clearToken(){ localStorage.removeItem('kandyads_admin_token'); localStorage.removeItem('kandyads_admin_user'); }
async function request(path, options={}){const token=getToken();const response=await fetch(`${API_BASE}${path}`,{headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...options});const payload=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401)clearToken();throw new Error(payload?.error?.message||'Request failed')}return payload}
const list=(resource,params={})=>{const clean=Object.fromEntries(Object.entries(params).filter(([,value])=>value!==undefined&&value!==''));const query=new URLSearchParams(clean).toString();return request(`/${resource}${query?`?${query}`:''}`)};
const create=(resource,input)=>request(`/${resource}`,{method:'POST',body:JSON.stringify(input)});
export const api={
  login:async input=>{const result=await request('/auth/login',{method:'POST',body:JSON.stringify(input)});localStorage.setItem('kandyads_admin_token',result.data.token);localStorage.setItem('kandyads_admin_user',JSON.stringify(result.data.user));return result.data.user},
  me:()=>request('/auth/me'),logout:()=>clearToken(),getDashboardSummary:()=>request('/dashboard/summary'),
  listClients:p=>list('clients',p),createClient:i=>create('clients',i),
  listEnquiries:p=>list('enquiries',p),createEnquiry:i=>create('enquiries',i),
  listQuotes:p=>list('quotes',p),createQuote:i=>create('quotes',i),
  listProjects:p=>list('projects',p),createProject:i=>create('projects',i),
  listServices:p=>list('services',p),createService:i=>create('services',i),
  listJobs:p=>list('jobs',p),createJob:i=>create('jobs',i),
  listTasks:p=>list('tasks',p),createTask:i=>create('tasks',i),
  listEmployees:p=>list('employees',p),createEmployee:i=>create('employees',i),
  listTime:p=>list('time',p),createTime:i=>create('time',i),
};
