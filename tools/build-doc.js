const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const dir = path.join('docs', 'techdoc');
const files = fs.readdirSync(dir).filter(f => /^\d\d.*\.md$/.test(f)).sort();
let md = files.map(f => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n\n');

md = md.replace(/!\[([^\]]*)\]\(\.\.\/screenshots\/([^)]+)\)/g, (m, alt, file) => {
  const data = fs.readFileSync(path.join('docs', 'screenshots', file)).toString('base64');
  return '<img alt="' + alt + '" src="data:image/png;base64,' + data + '">';
});
md = md.replace(/!\[([^\]]*)\]\(\.\.\/architecture\.png\)/g, (m, alt) => {
  const data = fs.readFileSync(path.join('docs', 'architecture.png')).toString('base64');
  return '<img alt="' + alt + '" src="data:image/png;base64,' + data + '">';
});

const css = 'body{font-family:Segoe UI,Arial,sans-serif;font-size:10pt;line-height:1.3;margin:0;padding:0}h1{border-bottom:2px solid #2a4a9a;padding-bottom:4px;color:#1f3a7a}h2{color:#2a4a9a}table{border-collapse:collapse;width:100%;margin:6px 0;font-size:8.5pt}th,td{border:1px solid #999;padding:4px 6px;vertical-align:top}th{background:#e8edf8}code{background:#f0f0f0;padding:1px 3px;font-size:9.5pt}img{max-width:70%;max-height:230px;border:1px solid #ccc;margin:4px 0}h1{font-size:16pt;margin:10px 0 4px}h2{font-size:12pt;margin:8px 0 3px}p,li{margin:3px 0}@page{margin:14mm}.pb{page-break-after:always}';
const html = '<!doctype html><html><head><meta charset="utf-8"><title>Technical Documentation</title><style>' + css + '</style></head><body>' + marked.parse(md, { breaks: true }) + '</body></html>';
fs.writeFileSync(path.join('docs', 'technical-documentation.html'), html);
console.log('Built from: ' + files.join(', '));


