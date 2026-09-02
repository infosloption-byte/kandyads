import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;let token='';let projectId=0;let installationId=0;
async function request(path:string,options:RequestInit={}){const headers=new Headers(options.headers);headers.set('content-type','application/json');if(token)headers.set('authorization',`Bearer ${token}`);const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});const body=response.body?JSON.parse(response.body):{};assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);return{status:response.statusCode,body};}

before(async()=>{if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');app=buildApp();await app.ready();const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});assert.equal(login.statusCode,200);token=JSON.parse(login.body).data.token;const project=await prisma.project.findFirst({orderBy:{id:'asc'},select:{id:true}});assert.ok(project);projectId=project.id;const stamp=Date.now();const installation=await prisma.installation.create({data:{number:`TEST-INS-PROOF-${stamp}`,projectId,siteAddress:'Test installation proof site',status:'SCHEDULED'}});installationId=installation.id;});

after(async()=>{if(installationId)await prisma.installation.delete({where:{id:installationId}}).catch(()=>undefined);await app.close();await prisma.$disconnect();});

test('installation completion requires before and after photos',async()=>{const denied=await request(`${base}/installations/${installationId}/status`,{method:'PATCH',body:JSON.stringify({status:'COMPLETED'})});assert.equal(denied.status,400);assert.match(denied.body.error?.message??'',/before and after photo/i);
  const completed=await request(`${base}/installations/${installationId}/status`,{method:'PATCH',body:JSON.stringify({status:'COMPLETED',beforePhotoUrl:'https://example.com/before.jpg',afterPhotoUrl:'https://example.com/after.jpg'})});assert.equal(completed.status,200);assert.equal(completed.body.data.status,'COMPLETED');assert.equal(completed.body.data.beforePhotoUrl,'https://example.com/before.jpg');assert.equal(completed.body.data.afterPhotoUrl,'https://example.com/after.jpg');assert.ok(completed.body.data.completedAt);
});

test('installation detail exposes completion proof and attachments',async()=>{const detail=await request(`${base}/installations/${installationId}`);assert.equal(detail.status,200);assert.equal(detail.body.data.beforePhotoUrl,'https://example.com/before.jpg');assert.equal(detail.body.data.afterPhotoUrl,'https://example.com/after.jpg');assert.deepEqual(detail.body.data.attachments,[]);const saved=token;token='';const denied=await request(`${base}/installations/${installationId}`);assert.equal(denied.status,401);token=saved;});

test('completed installation cannot be created without both proof photos',async()=>{const response=await request(`${base}/installations`,{method:'POST',body:JSON.stringify({number:`TEST-INS-NOPROOF-${Date.now()}`,projectId,siteAddress:'Test site',status:'COMPLETED'})});assert.equal(response.status,400);assert.match(response.body.error?.message??'',/before and after photo/i);});
