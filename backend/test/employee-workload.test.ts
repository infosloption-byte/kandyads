import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let token='';
let employeeId=0;
let jobId=0;
let jobNumber='';
const taskIds:number[]=[];

async function request(path:string,options:RequestInit={}){const headers=new Headers(options.headers);headers.set('content-type','application/json');if(token)headers.set('authorization',`Bearer ${token}`);const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});const body=response.body?JSON.parse(response.body):{};assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);return {status:response.statusCode,body};}

before(async()=>{if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');app=buildApp();await app.ready();const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});assert.equal(login.statusCode,200);token=JSON.parse(login.body).data.token;const project=await prisma.project.findFirst({orderBy:{id:'asc'},select:{id:true}});assert.ok(project);const stamp=Date.now();const employee=await prisma.employee.create({data:{code:`TEST-WL-${stamp}`,name:`Workload Fixture ${stamp}`,hourlyCost:1500,status:'ACTIVE'}});employeeId=employee.id;const job=await prisma.job.create({data:{number:`TEST-WL-JOB-${stamp}`,projectId:project.id,title:`Workload fixture job ${stamp}`}});jobId=job.id;jobNumber=job.number;});

after(async()=>{for(const id of taskIds){await prisma.timeEntry.deleteMany({where:{taskId:id}}).catch(()=>undefined);await prisma.task.delete({where:{id}}).catch(()=>undefined);}if(jobId)await prisma.job.delete({where:{id:jobId}}).catch(()=>undefined);if(employeeId)await prisma.employee.delete({where:{id:employeeId}}).catch(()=>undefined);await app.close();await prisma.$disconnect();});

test('workload returns active assigned tasks with planned, actual and overdue metrics',async()=>{const task=await prisma.task.create({data:{jobId,employeeId,title:'Install display panels',status:'IN_PROGRESS',estimatedHours:8,actualHours:2,dueDate:new Date(Date.now()-86400000)}});taskIds.push(task.id);await prisma.timeEntry.create({data:{employeeId,jobId,taskId:task.id,workDate:new Date(),hours:3}});const response=await request(`${base}/employees/workload?employeeId=${employeeId}`);assert.equal(response.status,200);assert.equal(response.body.meta.totalEmployees,1);assert.equal(response.body.meta.totalTasks,1);const row=response.body.data[0];assert.equal(row.id,employeeId);assert.equal(row.assignedTaskCount,1);assert.equal(row.plannedHours,8);assert.equal(row.actualHours,3);assert.equal(row.remainingHours,5);assert.equal(row.overdueTasks,1);assert.equal(row.tasks[0].jobId,jobId);assert.equal(row.tasks[0].jobNumber,jobNumber);});

test('workload date range and validation rules are enforced',async()=>{const future=new Date(Date.now()+30*86400000);const response=await request(`${base}/employees/workload?employeeId=${employeeId}&from=${encodeURIComponent(future.toISOString())}&to=${encodeURIComponent(future.toISOString())}`);assert.equal(response.status,200);assert.equal(response.body.data[0].assignedTaskCount,0);const invalidRange=await request(`${base}/employees/workload?from=${encodeURIComponent(future.toISOString())}&to=${encodeURIComponent(new Date(Date.now()-86400000).toISOString())}`);assert.equal(invalidRange.status,400);const missing=await request(`${base}/employees/workload?employeeId=999999999`);assert.equal(missing.status,404);});

test('workload endpoint requires read authorization',async()=>{const saved=token;token='';const response=await request(`${base}/employees/workload`);token=saved;assert.equal(response.status,401);});
