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

test('portfolio screenshots are portrait image files, so the full poster must remain visible', () => {
  for (const [title, , imageName] of portfolio) {
    const png = readFileSync(resolve(projectPath, imageName));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `Not a PNG: ${title}`);
    const width = png.readUInt32BE(16);
    const height = png.readUInt32BE(20);
    assert.ok(height > width, `Expected a portrait collage for ${title}, got ${width}x${height}`);
  }
});

test('Projects page preserves whole portfolio images and allows full-size viewing', () => {
  const page = readFileSync(resolve(root, 'pages/ProjectsPage.jsx'), 'utf8');
  const css = readFileSync(resolve(root, 'styles/project-gallery.css'), 'utf8');
  assert.ok(page.includes('project-grid project-poster-grid'));
  assert.ok(page.includes('href={resolveProjectImage(project[2])}'));
  assert.match(css, /\.project-grid\.project-poster-grid \.project-card img\s*\{[^}]*object-fit:\s*contain/s);
  assert.match(css, /\.project-grid\.project-poster-grid \.project-card img\s*\{[^}]*aspect-ratio:\s*auto/s);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 600px\)/);
});
