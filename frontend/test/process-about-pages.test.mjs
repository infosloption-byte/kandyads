import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { processSteps, services } from '../src/site-data.js';

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

test('process page has all six consistent stages, a responsive grid, and no old timeline markup',()=>{
  assert.deepEqual(processSteps.map(s=>s[1]),['DISCOVER','SITE SURVEY','DESIGN','PRODUCTION','INSTALLATION','SUPPORT']);
  const page=read('../src/pages/ProcessPage.jsx');
  const styles=read('../src/styles/process-redesign.css');
  assert.match(page,/process-method-grid/);
  assert.match(page,/processSteps\.map/);
  assert.match(page,/stageDetails\[index\]/);
  assert.doesNotMatch(page,/className="container timeline"/);
  assert.match(styles,/repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(styles,/@media\(max-width:600px\)/);
});

test('home preview follows the same six-stage process',()=>{
  const home=read('../src/pages/HomePage.jsx');
  const styles=read('../src/home-refinement.css');
  assert.match(home,/processSteps\.map/);
  assert.match(home,/six-stage workflow/);
  assert.match(styles,/process-rail\{display:grid;grid-template-columns:repeat\(6,1fr\)/);
});

test('about page includes company focus, capabilities, strengths and an honest concept caption',()=>{
  const about=read('../src/pages/AboutPage.jsx');
  const css=read('../src/styles/about-redesign.css');
  for(const label of ['WHO WE ARE','WHAT WE CAN DO','OUR STRENGTHS','THE RESULT','HOW WE WORK'])assert.ok(about.includes(label),label);
  assert.match(about,/services\.map/);
  assert.equal(services.length,6);
  assert.match(about,/Illustrative design concept/);
  assert.match(about,/Explore our six-step process/);
  assert.match(css,/@media\(max-width:650px\)/);
  assert.ok(existsSync(new URL('../src/assets/about/kandyads-result-concept.svg',import.meta.url)));
});
