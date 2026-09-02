import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { createPasswordHash } from '../src/modules/auth/auth.routes.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let adminToken='';
let limitedToken='';
let roleId=0;
let userId=0;
const email=`rbac-test-${Date.now()}@kandyads.lk`;

async function request(path:string,options:RequestInit={},authToken=adminToken){
  const headers=new Headers(options.headers);
  headers.set('content-type','application/json');
  if(authToken)headers.set('authorization',`Bearer ${authToken}`);
  const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});
  const body=response.body?JSON.parse(response.body):{};
  assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);
  return {status:response.statusCode,body};
}

async function login(email:string,password:string){
  const response=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email,password})});
  assert.equal(response.statusCode,200);
  return JSON.parse(response.body).data.token as string;
}

before(async()=>{
  if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');
  if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');
  app=buildApp();
  await app.ready();
  adminToken=await login('admin@kandyads.lk','ChangeMe!123');
  const role=await prisma.role.create({data:{name:`RBAC Test ${Date.now()}`}});
  roleId=role.id;
  const user=await prisma.user.create({data:{name:'RBAC Test User',email,passwordHash:createPasswordHash('Original!123'),roleId,status:'ACTIVE'}});
  userId=user.id;
  limitedToken=await login(email,'Original!123');
});

after(async()=>{
  if(userId)await prisma.user.delete({where:{id:userId}}).catch(()=>undefined);
  if(roleId)await prisma.role.delete({where:{id:roleId}}).catch(()=>undefined);
  await app.close();
  await prisma.$disconnect();
});

test('user and role administration is restricted to settings permission holders',async()=>{
  const deniedUsers=await request(`${base}/settings/users`,{},limitedToken);
  assert.equal(deniedUsers.status,403);
  assert.match(deniedUsers.body.error.message,/settings\.write/i);
  const deniedRoles=await request(`${base}/settings/roles`,{},limitedToken);
  assert.equal(deniedRoles.status,403);
  const permissions=await request(`${base}/settings/permissions`,{},limitedToken);
  assert.equal(permissions.status,403);
  const adminRoles=await request(`${base}/settings/roles`);
  assert.equal(adminRoles.status,200);
  assert.ok(adminRoles.body.data.some((item:any)=>item.id===roleId));
});

test('role permission replacement validates permission ids and updates transactionally',async()=>{
  const permissions=await request(`${base}/settings/permissions`);
  assert.equal(permissions.status,200);
  const clientsRead=permissions.body.data.find((item:any)=>item.key==='clients.read');
  const clientsWrite=permissions.body.data.find((item:any)=>item.key==='clients.write');
  assert.ok(clientsRead&&clientsWrite);
  const updated=await request(`${base}/settings/roles/${roleId}/permissions`,{method:'PUT',body:JSON.stringify({permissionIds:[clientsRead.id]})});
  assert.equal(updated.status,200);
  assert.deepEqual(updated.body.data.permissions.map((item:any)=>item.permission.key),['clients.read']);
  const invalid=await request(`${base}/settings/roles/${roleId}/permissions`,{method:'PUT',body:JSON.stringify({permissionIds:[clientsRead.id,999999999]})});
  assert.equal(invalid.status,400);
  const afterInvalid=await prisma.role.findUnique({where:{id:roleId},include:{permissions:{include:{permission:true}}}});
  assert.ok(afterInvalid);
  assert.deepEqual(afterInvalid!.permissions.map(item=>item.permission.key),['clients.read']);
  await request(`${base}/settings/roles/${roleId}/permissions`,{method:'PUT',body:JSON.stringify({permissionIds:[clientsRead.id,clientsWrite.id]})});
});

test('action-level authorization distinguishes read and write permissions',async()=>{
  limitedToken=await login(email,'Original!123');
  const readAllowed=await request(`${base}/clients?pageSize=1`,{},limitedToken);
  assert.equal(readAllowed.status,200);
  const writeDenied=await request(`${base}/clients`,{method:'POST',body:JSON.stringify({companyName:'RBAC should be denied'})},limitedToken);
  assert.equal(writeDenied.status,403);
  assert.match(writeDenied.body.error.message,/clients\.write/i);
});
