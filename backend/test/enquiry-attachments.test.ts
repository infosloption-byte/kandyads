import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let token='';
let clientId=0;
let enquiryId=0;
const attachmentIds:number[]=[];

async function request(path:string,options:RequestInit={}){const headers=new Headers(options.headers);headers.set('content-type','application/json');if(token)headers.set('authorization',`Bearer ${token}`);const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});const body=response.body?JSON.parse(response.body):{};assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);return {status:response.statusCode,body};}

before(async()=>{if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');app=buildApp();await app.ready();const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});assert.equal(login.statusCode,200);token=JSON.parse(login.body).data.token;const stamp=Date.now();const client=await prisma.client.create({data:{code:`TEST-ENQ-ATT-${stamp}`,companyName:`Enquiry attachment fixture ${stamp}`}});clientId=client.id;const enquiry=await prisma.enquiry.create({data:{number:`TEST-ENQ-ATT-${stamp}`,clientId,requirement:'Attachment workflow test'}});enquiryId=enquiry.id;});

after(async()=>{for(const id of attachmentIds){await prisma.attachment.delete({where:{id}}).catch(()=>undefined);}if(enquiryId)await prisma.enquiry.delete({where:{id:enquiryId}}).catch(()=>undefined);if(clientId)await prisma.client.delete({where:{id:clientId}}).catch(()=>undefined);await app.close();await prisma.$disconnect();});

test('enquiry detail exposes URL attachment and attachment API enforces related-record validation',async()=>{const detail=await request(`${base}/enquiries/${enquiryId}`);assert.equal(detail.status,200);assert.deepEqual(detail.body.data.attachments,[]);const missing=await request(`${base}/attachments`,{method:'POST',body:JSON.stringify({entityType:'ENQUIRY',entityId:999999999,name:'Missing',url:'https://example.com/missing.pdf'})});assert.equal(missing.status,400);const invalid=await request(`${base}/attachments`,{method:'POST',body:JSON.stringify({entityType:'ENQUIRY',entityId:enquiryId,name:'No URL or storage'})});assert.equal(invalid.status,400);const created=await request(`${base}/attachments`,{method:'POST',body:JSON.stringify({entityType:'ENQUIRY',entityId:enquiryId,name:'Site photo',description:'Client supplied site photo',mimeType:'image/jpeg',url:'https://example.com/site-photo.jpg'})});assert.equal(created.status,201);attachmentIds.push(created.body.data.id);const list=await request(`${base}/attachments?entityType=ENQUIRY&entityId=${enquiryId}`);assert.equal(list.status,200);assert.equal(list.body.data.length,1);const after=await request(`${base}/enquiries/${enquiryId}`);assert.equal(after.status,200);assert.equal(after.body.data.attachments.length,1);assert.equal(after.body.data.attachments[0].id,created.body.data.id);});

test('enquiry attachments require enquiry read/write authorization',async()=>{const saved=token;token='';const read=await request(`${base}/attachments?entityType=ENQUIRY&entityId=${enquiryId}`);assert.equal(read.status,401);const write=await request(`${base}/attachments`,{method:'POST',body:JSON.stringify({entityType:'ENQUIRY',entityId:enquiryId,name:'Denied',url:'https://example.com/denied.pdf'})});assert.equal(write.status,401);token=saved;});
