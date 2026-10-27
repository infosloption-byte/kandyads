import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { portfolio } from '../src/site-data.js';

const root = fileURLToPath(new URL('../src/', import.meta.url));
const projectPath = resolve(root, 'assets');
const projectPages = ['pages/ProjectsPage.jsx', 'pages/ServiceDetailPage.jsx', 'pages/AboutPage.jsx'];

test('all 19 portfolio entries point to actual bundled source images', () => {
  assert.equal(portfolio.length, 19);
  for (const [title, , imageName] of portfolio) {
    assert.ok(existsSync(resolve(projectPath, imageName)), `Missing asset for ${title}: ${imageName}`);
  }
});

test('portfolio references are unique and use image filenames, not source URLs', () => {
  const filenames = portfolio.map(project => project[2]);
  assert.equal(new Set(filenames).size, filenames.length);
  for (const filename of filenames) {
    assert.equal(filename.includes('/'), false, `Expected a filename, got: ${filename}`);
  }
});

test('project-related pages do not construct broken /src/assets/ production URLs', () => {
  for (const page of projectPages) {
    const source = readFileSync(resolve(root, page), 'utf8');
    assert.equal(source.includes('/src/assets/'), false, `Broken source-asset URL in ${page}`);
    assert.ok(source.includes('ProjectImage'), `Expected ProjectImage helper in ${page}`);
  }
});

test('project asset helper uses Vite resolution and includes a checked-in fallback', () => {
  const helper = readFileSync(resolve(root, 'components/ProjectImage.jsx'), 'utf8');
  assert.ok(helper.includes('import.meta.glob'));
  assert.ok(helper.includes('onError='));
  assert.ok(existsSync(resolve(projectPath, 'projects/project-fallback.svg')));
});
