// _page.html (temiz HTML) -> index.html template bloguna geri yazar.
// Kullanim: node _rebuild.js
const fs = require("fs");
const page = fs.readFileSync("_page.html", "utf8");
let idx = fs.readFileSync("index.html", "utf8");

const re = /(<script type="__bundler\/template">)([\s\S]*?)(<\/script>)/;
if (!re.test(idx)) { console.error("template blok bulunamadi!"); process.exit(1); }

// JSON string + tum / -> / (literal </script> kacirma, lossless: JSON.parse geri cevirir)
const encoded = JSON.stringify(page).replace(/\//g, "\\u002F");
const newInner = "\n" + encoded + "\n  ";

// guvenlik dogrulamasi
const decoded = JSON.parse(newInner.trim().replace(/\\u002F/g, "/"));
if (decoded !== page) { console.error("ROUND-TRIP BOZUK - iptal"); process.exit(1); }
if (newInner.includes("</script")) { console.error("literal </script tag var - iptal"); process.exit(1); }

idx = idx.replace(re, (m, a, b, c) => a + newInner + c);

// Netlify Forms: statik gizli form — siparis bildirimleri icin (musteri goremez)
// Once eski kopyalari temizle (tekrarlanan rebuild'lerde cogalmasin)
idx = idx.replace(/\n?<!-- Netlify Forms:[\s\S]*?<\/form>/g, "");
idx = idx.replace(/<form name="pasta-siparis"[\s\S]*?<\/form>/g, "");
const netlifyForm = `
<!-- Netlify Forms: pasta-siparis bildirimi (otomatik email) -->
<form name="pasta-siparis" data-netlify="true" data-netlify-honeypot="bot-field" hidden aria-hidden="true">
  <input type="hidden" name="form-name" value="pasta-siparis">
  <input name="bot-field" type="hidden">
  <input name="ad" type="text">
  <input name="telefon" type="text">
  <input name="pasta" type="text">
  <input name="tarih" type="text">
  <input name="kisi" type="text">
  <input name="ozel" type="text">
  <input name="teslimat" type="text">
</form>`;
idx = idx.replace("</body>", netlifyForm + "\n</body>");

fs.writeFileSync("index.html", idx);
console.log("OK - index.html guncellendi. page bytes:", page.length, "index bytes:", idx.length);
