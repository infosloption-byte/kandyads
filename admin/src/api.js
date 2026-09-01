const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api/v1';
export function getToken(){ return localStorage.getItem('kandyads_admin_token'); }
export function clearToken(){ localStorage.removeItem('kandyads_admin_token'); localStorage.removeItem('kandyads_admin_user'); }
async function request(path, options={}){const token=getToken();const response=await fetch(`${API_BASE}${path}`,{headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token]}`}:{}) ,...options.headers},...options});const payload=await response.json().catch(()=>({}));if(!response.ok){if(response.status===401)clearToken();throw new Error(payload?.error?.message||'Request failed')}return payload}
