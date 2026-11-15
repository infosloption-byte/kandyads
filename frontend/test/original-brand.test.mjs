import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const image = () => readFileSync(new URL('../public/brand/kandy-ads-logo-horizontal.png', import.meta.url));

test('approved transparent horizontal Kandy Ads logo is a valid PNG asset', () => {
  const png = image();
  assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  assert.ok(png.length > 1000);
  const data = read('../src/site-data.js');
  assert.match(data, /kandy-ads-logo-horizontal\.png\?v=20261115c/);
  assert.doesNotMatch(data, /kandy-ads-logo\.svg\?/);
});

test('favicon stays as the existing symbol, not the horizontal wordmark', () => {
  assert.equal(read('../public/favicon.svg'), read('../public/brand/kandy-ads-symbol.svg'));
  assert.match(read('../index.html'), /favicon\.svg\?v=20261115b/);
  assert.match(read('../index.html'), /apple-touch-icon\.png\?v=20261115b/);
});

test('all public branded locations reference the shared horizontal logo', () => {
  const shell = read('../src/site-shell.jsx');
  const quote = read('../src/pages/quote-page.jsx');
  assert.match(shell, /className="brand original-brand"/);
  assert.match(shell, /className="brand footer-brand original-brand"/);
  assert.doesNotMatch(shell, /KANDY<span/);
  assert.match(quote, /kandy-ads-logo-horizontal\.png\?v=20261115c/);
  assert.equal((quote.match(/className="quote-brand original-brand"/g)||[]).length, 2);
  assert.doesNotMatch(quote, /KANDY<span/);
});

test('footer logo has no white rectangle and uses responsive horizontal sizing', () => {
  const css = read('../src/styles/original-brand.css');
  assert.match(css, /background:\s*transparent/);
  assert.doesNotMatch(css, /#fbfaf8|background:\s*(?:white|#fff)/i);
  assert.match(css, /@media \(max-width: 600px\)/);
});
