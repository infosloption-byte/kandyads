import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { buildApp } from '../src/app.js';
import { prisma } from '../src/lib/prisma.js';

const base='/api/v1';
let app:Awaited<ReturnType<typeof buildApp>>;
let token='';
let employeeId=0;
let roleId=0;
let skillA=0;
let skillB=0;

async function request(path:string,options:RequestInit={}){const headers=new Headers(options.headers);headers.set('content-type','application/json');if(token)headers.set('authorization',`Bearer ${token}`);const response=await app.inject({method:(options.method??'GET') as any,url:path,headers:Object.fromEntries(headers.entries()),payload:options.body});const body=response.body?JSON.parse(response.body):{};assert.ok(response.statusCode<500,`${response.statusCode}: ${response.body}`);return {status:response.statusCode,body};}

before(async()=>{if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');app=buildApp();await app.ready();const login=await app.inject({method:'POST',url:`${base}/auth/login`,headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});assert.equal(login.statusCode,200);token=JSON.parse(login.body).data.token;const stamp=Date.now();const employee=await prisma.employee.create({data:{code:`TEST-CAP-${stamp}`,name:`Capability Fixture ${stamp}`,hourlyCost:1000,status:'ACTIVE'}});employeeId=employee.id;});

after(async()=>{if(employeeId){await prisma.$executeRaw`DELETE FROM EmployeeSkill WHERE employeeId=${employeeId}`;await prisma.$executeRaw`DELETE FROM EmployeeRoleAssignment WHERE employeeId=${employeeId}`;await prisma.employee.delete({where:{id:employeeId}}).catch(()=>undefined);}if(skillA)await prisma.$executeRaw`DELETE FROM Skill WHERE id=${skillA}`;if(skillB)await prisma.$executeRaw`DELETE FROM Skill WHERE id=${skillB}`;if(roleId)await prisma.$executeRaw`DELETE FROM EmployeeRole WHERE id=${roleId}`;await app.close();await prisma.$disconnect();});

test('role and skill management assigns capabilities atomically',async()=>{const role=await request(`${base}/employee-roles`,{method:'POST',body:JSON.stringify({name:`Installer ${Date.now()}`,description:'Field installer'})});assert.equal(role.status,201);roleId=role.body.data.id;const skillOne=await request(`${base}/skills`,{method:'POST',body:JSON.stringify({name:`Vinyl ${Date.now()}`,description:'Vinyl application'})});assert.equal(skillOne.status,201);skillA=skillOne.body.data.id;const skillTwo=await request(`${base}/skills`,{method:'POST',body:JSON.stringify({name:`LED ${Date.now()}`,description:'LED assembly'})});assert.equal(skillTwo.status,201);skillB=skillTwo.body.data.id;const assigned=await request(`${base}/employees/${employeeId}/capabilities`,{method:'PUT',body:JSON.stringify({roleId,skills:[{skillId:skillA,level:4},{skillId:skillB,level:2}]})});assert.equal(assigned.status,200);assert.equal(assigned.body.data.role.id,roleId);assert.equal(assigned.body.data.skills.length,2);assert.equal(assigned.body.data.skills.find((s:any)=>s.id===skillA).level,4);const detail=await request(`${base}/employees/${employeeId}/capabilities`);assert.equal(detail.status,200);assert.equal(detail.body.data.role.name,role.body.data.name);assert.equal(detail.body.data.skills.length,2);});

test('capability validation rejects missing and inactive related records',async()=>{const missing=await request(`${base}/employees/${employeeId}/capabilities`,{method:'PUT',body:JSON.stringify({roleId,skills:[{skillId:999999999,level:3}]})});assert.equal(missing.status,400);const inactive=await request(`${base}/skills/${skillA}`,{method:'PATCH',body:JSON.stringify({active:false})});assert.equal(inactive.status,200);const rejected=await request(`${base}/employees/${employeeId}/capabilities`,{method:'PUT',body:JSON.stringify({roleId,skills:[{skillId:skillA,level:3}]})});assert.equal(rejected.status,400);assert.match(rejected.body.error.message,/inactive skill/i);const cleared=await request(`${base}/employees/${employeeId}/capabilities`,{method:'PUT',body:JSON.stringify({roleId:null,skills:[]})});assert.equal(cleared.status,200);assert.equal(cleared.body.data.role,null);assert.equal(cleared.body.data.skills.length,0);});

test('capability management enforces read authorization',async()=>{const saved=token;token='';const response=await request(`${base}/employees/${employeeId}/capabilities`);token=saved;assert.equal(response.status,401);});
