import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { industries } from '../src/site-data.js';

const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('industry gallery includes eight existing sectors and one bundled generated asset',()=>{
  assert.equal(industries.length,8);
  const page=read('../src/pages/IndustriesPage.jsx');
  for(const name of industries) assert.ok(page.includes("'"+name+"':"),'Missing industry image mapping: '+name);
  assert.match(page,/industry-scenes\.webp/);
  assert.match(page,/industry-card-image/);
  const path=new URL('../src/assets/industries/industry-scenes.webp',import.meta.url);
  assert.ok(existsSync(path),'Generated 3x2 industry scene image missing');
  const file=readFileSync(path);
  assert.equal(file.subarray(0,4).toString(),'RIFF');
  assert.equal(file.subarray(8,12).toString(),'WEBP');
});

test('responsive industry image tiles use uncropped 16:9 scenes in proper sprite positions',()=>{
  const page=read('../src/pages/IndustriesPage.jsx');
  const css=read('../src/styles/industry-images.css');
  assert.match(page,/backgroundPosition:\x60\$\{scene\.col\*50\}% \$\{scene\.row\*100\}%\x60/);
  assert.match(css,/background-size:\s*300% 200%/);
  assert.match(css,/aspect-ratio:\s*16 \/ 9/);
  assert.match(css,/@media \(max-width: 600px\)/);
});
