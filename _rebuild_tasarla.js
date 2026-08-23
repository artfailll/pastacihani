// _tasarla_tpl.html + _tasarla_app.js kaynaklarını tasarla.html paketine yazar.
// Kullanım: node _rebuild_tasarla.js
const fs = require('fs');
const zlib = require('zlib');

const APP_ID = 'a643cbf2-c2c5-46dc-a81b-0066696c9abf';
const bundlePath = 'tasarla.html';
const template = fs.readFileSync('_tasarla_tpl.html', 'utf8');
const app = fs.readFileSync('_tasarla_app.js');
let bundle = fs.readFileSync(bundlePath, 'utf8');

const manifestRe = /(<script type="__bundler\/manifest">\s*)([\s\S]*?)(\s*<\/script>)/;
const templateRe = /(<script type="__bundler\/template">\s*)([\s\S]*?)(\s*<\/script>)/;
const manifestMatch = bundle.match(manifestRe);
if (!manifestMatch || !templateRe.test(bundle)) throw new Error('Tasarla paket blokları bulunamadı');

const manifest = JSON.parse(manifestMatch[2]);
if (!manifest[APP_ID]) throw new Error('Uygulama varlığı manifestte bulunamadı');
manifest[APP_ID] = {
  ...manifest[APP_ID],
  mime: 'application/javascript',
  compressed: true,
  data: zlib.gzipSync(app, { level: 9 }).toString('base64')
};

const encodedTemplate = JSON.stringify(template).replace(/\//g, '\\u002F');
bundle = bundle.replace(manifestRe, `$1${JSON.stringify(manifest)}$3`);
bundle = bundle.replace(templateRe, `$1${encodedTemplate}$3`);

const verifyTemplate = JSON.parse(encodedTemplate.replace(/\\u002F/g, '/'));
if (verifyTemplate !== template) throw new Error('Template doğrulaması başarısız');

fs.writeFileSync(bundlePath, bundle);
console.log('OK - tasarla.html güncellendi:', bundle.length, 'bayt');
