import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let token='';
let employeeId=0;
let jobId=0;
const taskIds:number[]=[];

async function request(path:string,options:RequestInit={}){const headers=new Headers(options.headers);headers.set('content-type','application/json');if(token)headers.set('authorization',`Bearer ${token}`);const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});const body=response.body?JSON.parse(response.body):{};assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);return {status:response.statusCode,body};}

before(async()=>{if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');app=buildApp();await app.ready();const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});assert.equal(login.statusCode,200);token=JSON.parse(login.body).data.token;const project=await prisma.project.findFirst({orderBy:{id:'asc'},select:{id:true}});assert.ok(project);const stamp=Date.now();const employee=await prisma.employee.create({data:{code:`TEST-PVA-${stamp}`,name:`Plan Actual Fixture ${stamp}`,hourlyCost:1200,status:'ACTIVE'}});employeeId=employee.id;const job=await prisma.job.create({data:{number:`TEST-PVA-JOB-${stamp}`,projectId:project.id,title:`Plan actual fixture ${stamp}`}});jobId=job.id;});

after(async()=>{for(const id of taskIds){await prisma.timeEntry.deleteMany({where:{taskId:id}}).catch(()=>undefined);await prisma.task.delete({where:{id}}).catch(()=>undefined);}if(jobId)await prisma.job.delete({where:{id:jobId}}).catch(()=>undefined);if(employeeId)await prisma.employee.delete({where:{id:employeeId}}).catch(()=>undefined);await app.close();await prisma.$disconnect();});

test('planned versus actual report includes completed work and logged time variance',async()=>{const task=await prisma.task.create({data:{jobId,employeeId,title:'Print production set',status:'COMPLETED',estimatedHours:10,actualHours:9,startDate:new Date(Date.now()-86400000),dueDate:new Date(Date.now()+86400000)}});taskIds.push(task.id);await prisma.timeEntry.create({data:{employeeId,jobId,taskId:task.id,workDate:new Date(),hours:7}});await prisma.timeEntry.create({data:{employeeId,jobId,taskId:task.id,workDate:new Date(),hours:1}});const response=await request(`${base}/reports/planned-vs-actual-hours?employeeId=${employeeId}`);assert.equal(response.status,200);assert.equal(response.body.meta.totalTasks,1);assert.equal(response.body.data.summary.plannedHours,10);assert.equal(response.body.data.summary.actualHours,8);assert.equal(response.body.data.summary.varianceHours,-2);assert.equal(response.body.data.rows[0].status,'COMPLETED');assert.equal(response.body.data.rows[0].employee.name,`Plan Actual Fixture ${taskIds.length?String(taskIds[0]):''}`.replace(/\d+$/,''));});

test('hours report validates employee and date range and requires authorization',async()=>{const missing=await request(`${base}/reports/planned-vs-actual-hours?employeeId=999999999`);assert.equal(missing.status,404);const invalid=await request(`${base}/reports/planned-vs-actual-hours?from=${encodeURIComponent(new Date().toISOString())}&to=${encodeURIComponent(new Date(Date.now()-86400000).toISOString())}`);assert.equal(invalid.status,400);const saved=token;token='';const denied=await request(`${base}/reports/planned-vs-actual-hours`);token=saved;assert.equal(denied.status,401);});
