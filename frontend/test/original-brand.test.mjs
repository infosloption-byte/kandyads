import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('original Kandy Ads artwork uses all-red wordmark and intact symbol', () => {
  const logo = read('../public/brand/kandy-ads-logo.svg');
  assert.match(logo, /<title id="title">kandy Ads<\/title>/);
  assert.match(logo, /fill="#F3201B"/);
  assert.match(logo, /fill="#050505"/);
  assert.match(logo, /fill="#fff"/);
  assert.doesNotMatch(logo, /KANDY<span/);
});

test('browser favicon matches the symbol used throughout the site', () => {
  assert.equal(read('../public/favicon.svg'), read('../public/brand/kandy-ads-symbol.svg'));
  assert.match(read('../index.html'), /favicon.svg\?v=20261115/);
});

test('main site shell uses the authentic image without an extra mixed-color wordmark', () => {
  const shell = read('../src/site-shell.jsx');
  assert.match(shell, /className="brand original-brand"/);
  assert.match(shell, /className="brand footer-brand original-brand"/);
  assert.doesNotMatch(shell, /KANDY<span/);
});
