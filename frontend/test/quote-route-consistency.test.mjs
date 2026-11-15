import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(new URL(path,import.meta.url),'utf8');

test('direct page loading and in-app navigation share one React router',()=>{
 const html=read('../index.html');
 assert.match(html,/src="\/src\/pages-router\.jsx"/);
 assert.doesNotMatch(html,/window\.location\.pathname|import\('\/src\/pages\/quote-page\.jsx'\)/);
 const router=read('../src/pages-router.jsx');
 assert.match(router,/React\.lazy\(\(\)=>import\('\.\/pages\/quote-page\.jsx'\)\)/);
 assert.match(router,/<Route path="\/quote" element=\{<QuotePage\/>/);
 assert.match(router,/<React\.Suspense fallback=\{<PageLoader/);
 assert.doesNotMatch(router,/\.\/pages\/QuotePage/);
});

test('correct standalone calculator exports a component and does not create a second root',()=>{
 const source=read('../src/pages/quote-page.jsx');
 assert.match(source,/Plan your project/);
 assert.match(source,/Know the range/);
 assert.match(source,/export default QuotePage/);
 assert.doesNotMatch(source,/createRoot\(/);
 assert.doesNotMatch(source,/react-dom\/client/);
 assert.equal(existsSync(new URL('../src/pages/QuotePage.jsx',import.meta.url)),false);
});

test('all Get a Quote CTAs and floating action target canonical /quote route',()=>{
 const shell=read('../src/site-shell.jsx');
 assert.match(shell,/to="\/quote"/);
 assert.match(shell,/to='\/quote'/);
 assert.match(shell,/to='\/quote'|to="\/quote"/);
});
