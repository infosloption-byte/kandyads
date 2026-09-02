import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { createPasswordHash } from '../src/modules/auth/auth.routes.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let adminToken='';
let limitedToken='';
let limitedUserId=0;
let limitedRoleId=0;
let jobId=0;
const jobNumber=`JOB-AUDIT-${Date.now()}`;
const limitedEmail=`job-audit-limited-${Date.now()}@kandyads.lk`;

async function request(path:string,options:RequestInit={},authToken=adminToken){
  const headers=new Headers(options.headers); headers.set('content-type','application/json');
  if(authToken) headers.set('authorization',`Bearer ${authToken}`);
  const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});
  const body=response.body?JSON.parse(response.body):{};
  assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);
  return {status:response.statusCode,body};
}

async function login(email:string,password:string){
  const response=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email,password})});
  assert.equal(response.statusCode,200); return JSON.parse(response.body).data.token as string;
}

before(async()=>{
  if(process.env.NODE_ENV==='production') throw new Error('Tests must not run against production');
  if(!process.env.KANDYADS_TEST_MODE) throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');
  app=buildApp(); await app.ready();
  adminToken=await login('admin@kandyads.lk','ChangeMe!123');
  const limitedRole=await prisma.role.create({data:{name:`Job Audit Limited ${Date.now()}`}}); limitedRoleId=limitedRole.id;
  const limitedUser=await prisma.user.create({data:{name:'Job Audit Limited User',email:limitedEmail,passwordHash:createPasswordHash('Original!123'),roleId:limitedRole.id,status:'ACTIVE'}}); limitedUserId=limitedUser.id;
  limitedToken=await login(limitedEmail,'Original!123');
});

after(async()=>{
  if(jobId){await prisma.auditLog.deleteMany({where:{entity:'Job',entityId:String(jobId)}}).catch(()=>undefined);await prisma.job.delete({where:{id:jobId}}).catch(()=>undefined);}
  if(limitedUserId) await prisma.user.delete({where:{id:limitedUserId}}).catch(()=>undefined);
  if(limitedRoleId) await prisma.role.delete({where:{id:limitedRoleId}}).catch(()=>undefined);
  await app.close(); await prisma.$disconnect();
});

test('job activity is audited and completion requires approval',async()=>{
  const project=await prisma.project.findFirst({orderBy:{id:'asc'}}); assert.ok(project);
  const created=await request(`${base}/jobs`,{method:'POST',body:JSON.stringify({number:jobNumber,projectId:project.id,title:'Job audit workflow',description:'Audit test job',status:'DRAFT'})});
  assert.equal(created.status,201); jobId=created.body.data.id;

  const move=async(status:string)=>{const response=await request(`${base}/jobs/${jobId}/status`,{method:'PATCH',body:JSON.stringify({status})});assert.equal(response.status,200);};
  await move('READY'); await move('IN_PROGRESS'); await move('REVIEW');

  const approved=await request(`${base}/approvals/jobs/${jobId}/complete`,{method:'POST',body:'{}'});
  assert.equal(approved.status,200); assert.equal(approved.body.data.status,'COMPLETED');

  const activity=await request(`${base}/jobs/${jobId}/activity`);
  assert.equal(activity.status,200); assert.ok(activity.body.data.some((entry:any)=>entry.action==='CREATED')); assert.ok(activity.body.data.some((entry:any)=>entry.action==='STATUS_CHANGED' && entry.afterJson?.status==='REVIEW')); assert.ok(activity.body.data.some((entry:any)=>entry.action==='COMPLETION_APPROVED'));
});

test('job completion approval requires review state and admin permission',async()=>{
  const project=await prisma.project.findFirst({orderBy:{id:'asc'}}); assert.ok(project);
  const response=await request(`${base}/jobs`,{method:'POST',body:JSON.stringify({number:`JOB-AUDIT-RULE-${Date.now()}`,projectId:project.id,title:'Job approval rule test',status:'DRAFT'})},adminToken);
  assert.equal(response.status,201);
  const id=response.body.data.id;
  try{
    const denied=await request(`${base}/approvals/jobs/${id}/complete`,{method:'POST',body:'{}'},limitedToken);
    assert.equal(denied.status,403);
    const notReview=await request(`${base}/approvals/jobs/${id}/complete`,{method:'POST',body:'{}'},adminToken);
    assert.equal(notReview.status,400);
  } finally {
    await prisma.auditLog.deleteMany({where:{entity:'Job',entityId:String(id)}}).catch(()=>undefined);
    await prisma.job.delete({where:{id}}).catch(()=>undefined);
  }
});
