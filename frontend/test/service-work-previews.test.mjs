import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { services } from '../src/site-data.js';

const read = (name) => readFileSync(new URL(name, import.meta.url), 'utf8');
const imageBySlug = Object.fromEntries(services.map(service => [
  service.slug,
  new URL(`../src/assets/services/${service.slug}.webp`, import.meta.url),
]));

test('all six service cards have committed optimized generated images', () => {
  assert.equal(services.length, 6);
  assert.equal(Object.keys(imageBySlug).length, 6);
  for (const service of services) {
    const imagePath = imageBySlug[service.slug];
    assert.ok(existsSync(imagePath), `Missing illustration: ${service.slug}`);
    const content = readFileSync(imagePath);
    assert.equal(content.toString('ascii', 0, 4), 'RIFF');
    assert.equal(content.toString('ascii', 8, 12), 'WEBP');
    assert.ok(statSync(imagePath).size > 40000, `Unexpectedly small image: ${service.slug}`);
    assert.ok(statSync(imagePath).size < 300000, `Image too heavy: ${service.slug}`);
  }
});

test('services use bundled Vite image imports rather than stale portfolio crops', () => {
  const jsx = read('../src/pages/ServicesPage.jsx');
  for (const slug of services.map(s => s.slug)) {
    assert.ok(jsx.includes(`../assets/services/${slug}.webp`), `Missing Vite import: ${slug}`);
  }
  assert.match(jsx, /<ServiceWorkPreview service={service} \/>/);
  assert.match(jsx, /AI-generated illustration/);
  assert.doesNotMatch(jsx, /ProjectImage|serviceWorkPreviews|serviceWorkImageStyle|\/src\/assets\//);
});

test('new image rules preserve original responsive service card layout', () => {
  const css = read('../src/styles/service-work-previews.css');
  assert.match(css, /object-fit:\s*cover/);
  assert.match(css, /aspect-ratio:\s*16 \/ 9/);
  assert.match(css, /@media \(max-width:\s*740px\)/);
  assert.match(css, /@media \(max-width:\s*520px\)/);
  assert.doesNotMatch(css, /position:\s*absolute/);
});
