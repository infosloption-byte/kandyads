import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { services } from '../src/site-data.js';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('process lists six clear stages and does not use the old timeline layout',()=>{
 const page=read('../src/pages/ProcessPage.jsx');
 for(const stage of ['Discover','Site review','Design','Production','Installation','Support'])assert.ok(page.includes(`title:'${stage}'`),`Missing stage ${stage}`);
 assert.match(page,/process-method-grid/);
 assert.doesNotMatch(page,/className="container timeline"/);
 assert.match(page,/aria-label="Kandy Ads six-step workflow"/);
});

test('about page covers who we are, story, capabilities, strengths and results',()=>{
 const page=read('../src/pages/AboutPage.jsx');
 for(const label of ['WHO WE ARE','OUR STORY','WHAT WE CAN DO','OUR STRENGTHS','THE RESULT','WHAT GUIDES US'])assert.ok(page.includes(label),`Missing ${label}`);
 assert.match(page,/services\.map/);
 assert.equal(services.length,6);
 assert.match(page,/concept visualisation|Concept visualisation/i);
 assert.match(page,/\/about\/about-result\.webp/);
});

test('redesign layout includes tablet/mobile and reduced motion',()=>{
 const css=read('../src/styles/about-process.css');
 assert.match(css,/max-width:980px/);
 assert.match(css,/max-width:700px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.about-result-visual img/);
});
