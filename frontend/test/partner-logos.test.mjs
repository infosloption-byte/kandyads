import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { brandExamples } from '../src/site-data.js';

const read=(path)=>readFileSync(new URL(path,import.meta.url),'utf8');

test('all eight gallery brands retain their original order and each has a logo source',()=>{
  assert.deepEqual(brandExamples.map(b=>b.name),['DSI','NinetyNine','KFC','Pepsi','Puma','Fancy Point','Arpico','Ceylon Brands']);
  for(const brand of brandExamples){
    assert.ok(brand.logo.startsWith('https://'),'Missing HTTPS logo URL for '+brand.name);
  }
});

test('brand gallery uses images with accessible text fallback and error handling',()=>{
  const home=read('../src/pages/HomePage.jsx');
  assert.match(home,/function BrandLogo/);
  assert.match(home,/alt={`\$\{brand.name\} logo`}/);
  assert.match(home,/onError={\(\)=>setFailed\(true\)}/);
  assert.match(home,/className="partner-logo-fallback"/);
  assert.match(home,/className="partner-logo-label"/);
  assert.doesNotMatch(home,/Replace these with confirmed client-partner logos/);
});

test('logo image sizing is responsive and never crops the mark',()=>{
  const css=read('../src/styles/site.css');
  assert.match(css,/\.partner-item \.partner-logo-wrap img/);
  assert.match(css,/object-fit:contain/);
  assert.match(css,/@media\(max-width:600px\)/);
});
