// Builds www/ from src/index.html: vendors three.js + JSZip locally (offline)
// and adds a shim so blob "downloads" open the Android share/save sheet.
import fs from 'node:fs';
import path from 'node:path';

const out = 'www';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(`${out}/lib/three/build`, { recursive: true });

fs.cpSync('node_modules/three/build/three.module.js', `${out}/lib/three/build/three.module.js`);
fs.cpSync('node_modules/three/examples/jsm', `${out}/lib/three/examples/jsm`, { recursive: true });
fs.cpSync('node_modules/jszip/dist/jszip.min.js', `${out}/lib/jszip.min.js`);

let html = fs.readFileSync('src/index.html', 'utf8');

const before = html;
html = html
  .replace('https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js', './lib/jszip.min.js')
  .replace('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js', './lib/three/build/three.module.js')
  .replace('https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/', './lib/three/examples/jsm/');

if (/https?:\/\/cdn\./.test(html.replace(/<footer>.*?<\/footer>/s, ''))) {
  console.warn('WARNING: some CDN URLs are still in the page:');
  console.warn(html.match(/https?:\/\/cdn\.[^"'\s)]+/g));
}
if (html === before) throw new Error('No CDN URLs were replaced - did the HTML change?');

html = html.replace('Requires an internet connection on first load for the Three.js rendering library.', 'Works fully offline.');

const shim = fs.readFileSync('shim.js', 'utf8');
html = html.replace('<script src="./lib/jszip.min.js"></script>', `<script>\n${shim}\n</script>\n<script src="./lib/jszip.min.js"></script>`);

fs.writeFileSync(`${out}/index.html`, html);
console.log('www/ ready,', (html.length / 1024).toFixed(0), 'KB html');
