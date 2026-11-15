import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { serviceWorkPreviews, serviceWorkImageStyle } from '../src/data/service-work-previews.js';
import { services, portfolio } from '../src/site-data.js';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('all six service cards map to their own portfolio images', () => {
  assert.equal(services.length, 6);
  assert.deepEqual(Object.keys(serviceWorkPreviews).sort(), services.map(s=>s.slug).sort());
  const projects = portfolio.map(([title]) => title);
  for (const service of services) {
    const preview = serviceWorkPreviews[service.slug];
    assert.ok(projects.includes(preview.projectTitle), `No project for ${service.title}`);
    const imageName = portfolio.find(([title]) => title === preview.projectTitle)[2];
    assert.ok(existsSync(new URL(`../src/assets/${imageName}`, import.meta.url)), `Missing image for ${service.title}`);
  }
});

test('crops stay inside the original raster and preserve the 16:9 ratio', () => {
  for (const { projectTitle, source, crop } of Object.values(serviceWorkPreviews)) {
    const imageName = portfolio.find(([title]) => title === projectTitle)[2];
    const png = readFileSync(new URL(`../src/assets/${imageName}`, import.meta.url));
    assert.equal(png.readUInt32BE(16), source.width);
    assert.equal(png.readUInt32BE(20), source.height);
    assert.ok(crop.x >= 0 && crop.y >= 0);
    assert.ok(crop.width > 0 && crop.height > 0);
    assert.ok(crop.x + crop.width <= source.width);
    assert.ok(crop.y + crop.height <= source.height);
    assert.ok(Math.abs(crop.width / crop.height - 16 / 9) < 0.001);
    const style = serviceWorkImageStyle({source, crop});
    for (const prop of ['width', 'height', 'left', 'top']) assert.match(style[prop], /%$/);
  }
});

test('service previews reuse the original ProjectImage helper and responsive crop frame', () => {
  const page = read('../src/pages/ServicesPage.jsx');
  const css = read('../src/styles/service-work-previews.css');
  assert.match(page, /<ServiceWorkPreview service={service} \/>/);
  assert.match(page, /<ProjectImage/);
  assert.match(page, /serviceWorkImageStyle\(preview\)/);
  assert.match(css, /aspect-ratio:\s*16 \/ 9/);
  assert.match(css, /overflow:\s*hidden/);
  assert.match(css, /max-width:\s*740px/);
  assert.match(css, /max-width:\s*520px/);
  assert.doesNotMatch(page, /\/src\/assets\//);
});
