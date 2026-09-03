import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { buildApp } from '../src/app.js';

let app:Awaited<ReturnType<typeof buildApp>>;
let token='';

before(async()=>{if(process.env.NODE_ENV==='production')throw new Error('Tests must not run against production');if(!process.env.KANDYADS_TEST_MODE)throw new Error('Set KANDYADS_TEST_MODE=1 before running the integration suite.');app=buildApp();await app.ready();const response=await app.inject({method:'POST',url:'/api/v1/auth/login',headers:{'content-type':'application/json'},payload:JSON.stringify({email:'admin@kandyads.lk',password:'ChangeMe!123'})});assert.equal(response.statusCode,200);token=JSON.parse(response.body).data.token;});

after(async()=>{await app.close();});

const get=async(url:string)=>app.inject({method:'GET',url,headers:{authorization:`Bearer ${token}`}});

test('dashboard exports require authentication',async()=>{const response=await app.inject({method:'GET',url:'/api/v1/dashboard/export?report=jobs'});assert.equal(response.statusCode,401);});

test('dashboard export validates report and window',async()=>{const badReport=await get('/api/v1/dashboard/export?report=unknown');assert.equal(badReport.statusCode,400);const badDays=await get('/api/v1/dashboard/export?report=jobs&days=0');assert.equal(badDays.statusCode,400);});

test('dashboard exports return CSV for every supported operational report',async()=>{for(const report of ['jobs','inventory','purchasing','installations','workload','finance']){const response=await get(`/api/v1/dashboard/export?report=${report}&days=14`);assert.equal(response.statusCode,200,`${report}: ${response.body}`);assert.match(response.headers['content-type']??'',/text\/csv/);assert.match(response.headers['content-disposition']??'',new RegExp(`kandyads-${report}-report\\.csv`));assert.ok(response.body.includes(','),`${report} should contain CSV data`);}});
