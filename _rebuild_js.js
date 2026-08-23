// Düzenlenen JS dosyalarını gzip+base64 ile manifest'e geri yazar.
// Kullanim: node _rebuild_js.js
const fs = require("fs"), zlib = require("zlib");

const MAP = {
  "_js0.js": "38f00ad7-1a86-4ec8-9968-0dfb4b3c6d24",
  "_js1.js": "cebf6828-c321-4da2-9dbd-d93e7edc9f4b",
  "_js2.js": "2fa2de86-4aec-4a15-bb5b-fe72aca1c44f",
  "_js3.js": "d9e00edc-cb00-4e84-bf3c-fc36c9fc6a3d",
};

let idx = fs.readFileSync("index.html", "utf8");
const re = /(<script type="__bundler\/manifest">)([\s\S]*?)(<\/script>)/;
const m = idx.match(re);
if (!m) { console.error("manifest blok bulunamadi!"); process.exit(1); }
const man = JSON.parse(m[2]);

let changed = 0;
for (const [file, uuid] of Object.entries(MAP)) {
  if (!fs.existsSync(file)) continue;
  const src = fs.readFileSync(file, "utf8");
  const entry = man[uuid];
  if (!entry) { console.error("manifest'te yok:", uuid); continue; }
  // mevcut hali decode et, degisti mi diye bak
  let cur = Buffer.from(entry.data, "base64");
  if (entry.compressed) cur = zlib.gunzipSync(cur);
  if (cur.toString("utf8") === src) continue; // degismemis, atla
  // NOT sikistirilmiyor: DecompressionStream bazi tarayicilarda (ozellikle
  // IG/FB uygulama-ici WebView) yok/bozuk oluyor ve JS sessizce calismiyor —
  // preloader hic kapanmiyor. Boyut kucuk oldugu icin risk almaya degmez.
  entry.compressed = false;
  entry.data = Buffer.from(src, "utf8").toString("base64");
  changed++;
  console.log("guncellendi:", file, "->", uuid, "(", src.length, "byte )");
}

if (!changed) { console.log("JS degisikligi yok."); process.exit(0); }

// manifest JSON'unu </script> kacirarak geri yaz (runtime JSON.parse eder)
const newMan = JSON.stringify(man).split("</").join("<\\u002F");
idx = idx.replace(re, (mm, a, b, c) => a + newMan + c);
fs.writeFileSync("index.html", idx);
console.log("OK - manifest guncellendi.", changed, "asset. index bytes:", idx.length);
