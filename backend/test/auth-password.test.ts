import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { createPasswordHash } from '../src/modules/auth/auth.routes.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let userId=0;
let token='';
const email=`password-test-${Date.now()}@kandyads.lk`;

async function request(path:string,options:RequestInit={},authToken=token){
  const headers=new Headers(options.headers);
  headers.set('content-type','application/json');
  if(authToken)headers.set('authorization',`Bearer ${authToken}`);
  const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});
  const body=response.body?JSON.parse(response.body):{};
  assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);
  return {status:response.statusCode,body};
}

before(async()=>{
  if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');
  if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');
  app=buildApp();
  await app.ready();
  const role=await prisma.role.findFirst({where:{name:'Administrator'}});
  assert.ok(role);
  const user=await prisma.user.create({data:{name:'Password Test User',email,passwordHash:createPasswordHash('Original!123'),roleId:role.id,status:'ACTIVE'}});
  userId=user.id;
  const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email,password:'Original!123'})});
  assert.equal(login.statusCode,200);
  token=JSON.parse(login.body).data.token;
});

after(async()=>{
  if(userId){
    await prisma.auditLog.deleteMany({where:{entity:'User',entityId:String(userId)}}).catch(()=>undefined);
    await prisma.user.delete({where:{id:userId}}).catch(()=>undefined);
  }
  await app.close();
  await prisma.$disconnect();
});

test('password change rejects an incorrect current password',async()=>{
  const response=await request(`${base}/auth/change-password`,{method:'POST',body:JSON.stringify({currentPassword:'Wrong!123',newPassword:'Changed!123'})});
  assert.equal(response.status,401);
  assert.equal(response.body.error.message,'Current password is incorrect');
});

test('password change validates a different new password',async()=>{
  const response=await request(`${base}/auth/change-password`,{method:'POST',body:JSON.stringify({currentPassword:'Original!123',newPassword:'Original!123'})});
  assert.equal(response.status,400);
  assert.ok(response.body.error.details?.some((item:any)=>item.message==='New password must differ from current password'));
});

test('password change updates credentials and writes an audit record atomically',async()=>{
  const response=await request(`${base}/auth/change-password`,{method:'POST',body:JSON.stringify({currentPassword:'Original!123',newPassword:'Changed!123'})});
  assert.equal(response.status,200);
  assert.deepEqual(response.body.data,{changed:true});
  const oldLogin=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email,password:'Original!123'})});
  assert.equal(oldLogin.statusCode,401);
  const newLogin=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email,password:'Changed!123'})});
  assert.equal(newLogin.statusCode,200);
  const audit=await prisma.auditLog.findFirst({where:{entity:'User',entityId:String(userId),action:'PASSWORD_CHANGED'},orderBy:{createdAt:'desc'}});
  assert.ok(audit);
  assert.equal((audit.afterJson as {passwordChanged?:boolean}).passwordChanged,true);
});

test('password change requires authentication',async()=>{
  const response=await request(`${base}/auth/change-password`,{method:'POST',body:JSON.stringify({currentPassword:'Changed!123',newPassword:'ChangedAgain!123'})},'');
  assert.equal(response.status,401);
});
