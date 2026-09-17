const fs = require('fs');
const vm = require('vm');
const s = fs.readFileSync('public/ps/coverage-studio.html', 'utf8');
const parts = (s.match(/<script[^>]*>([\s\S]*?)<\/script>/g) || [])
  .map(x => x.replace(/^<script[^>]*>/, '').replace(/<\/script>$/, ''));
vm.compileFunction(parts.join('\n;\n'), []);
console.log('OK inline script, blocks=' + parts.length);
console.log('reorder-btn occurrences: ' + (s.match(/id="reorder-btn"/g) || []).length);
console.log('in covers card header: ' + /cover-sidebar-header[\s\S]{0,300}?reorder-btn/.test(s));
console.log('in context bar: ' + /studio-context-bar[\s\S]{0,400}?reorder-btn/.test(s));
console.log('in page header: ' + !/product-studio-actions[\s\S]{0,200}?reorder-btn/.test(s));