import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');

test('initial HTML shows the existing transparent Kandy Ads logo while JS loads',()=>{
 const html=read('../index.html');
 assert.match(html,/id="root"><div class="page-loader"/);
 assert.match(html,/kandy-ads-logo-horizontal\.png\?v=20261115c/);
 assert.match(html,/role="status"/);
 assert.match(html,/src="\/src\/pages-router\.jsx"/);
});
test('all nine routes including quote share the branded loader while their code loads',()=>{
 const router=read('../src/pages-router.jsx');
 assert.equal((router.match(/React\.lazy\(\(\)=>import\('\.\/pages\//g)||[]).length,9);
 assert.match(router,/React\.Suspense fallback=\{<PageLoader/);
 assert.match(router,/location\.pathname==="\/quote"/);
 assert.doesNotMatch(router,/Loading quote calculator…/);
 assert.doesNotMatch(router,/\bsetTimeout\s*\(/);
});
test('branded animation is accessible and respects reduced motion',()=>{
 const loader=read('../src/components/PageLoader.jsx');
 const css=read('../src/styles/page-loader.css');
 assert.match(loader,/src=\{LOGO\}/);
 assert.match(loader,/role="status"/);
 assert.match(loader,/aria-live="polite"/);
 assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
 assert.match(css,/\.page-loader__line::before/);
 assert.match(css,/animation: ka-logo-breathe/);
 assert.doesNotMatch(css,/rotate\(/);
});
test('quote route loads the correct calculator and no second root',()=>{
 const router=read('../src/pages-router.jsx');
 const quote=read('../src/pages/quote-page.jsx');
 assert.match(router,/React\.lazy\(\(\)=>import\('\.\/pages\/quote-page\.jsx'\)\)/);
 assert.match(router,/<Route path="\/quote" element=\{<QuotePage\/>/);
 assert.match(quote,/Plan your project/);
 assert.match(quote,/Know the range/);
 assert.doesNotMatch(quote,/createRoot\(/);
});
