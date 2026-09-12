/* ============================================================
   Pastacihanı — App
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
  const docEl = document.documentElement;
  const waURL = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
  const unsplash = (id, w, h) => (window.__resources && window.__resources[id]) ? window.__resources[id] : `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&h=${h || w}&q=80`;

  /* ---- animation-timeline liveness guard (frozen-tab fallback) ---- */
  let frameTicks = 0;
  const liveTick = () => { if (++frameTicks < 2) requestAnimationFrame(liveTick); };
  requestAnimationFrame(liveTick);
  function forceVisible() { docEl.classList.remove("anim"); docEl.classList.add("no-anim"); }
  // (a) rAF never ticks at all -> fully frozen
  setTimeout(() => { if (frameTicks < 2) forceVisible(); }, 700);
  // (b) rAF ticked but CSS transitions are stuck (offscreen/throttled): if every
  //     revealed element is still effectively invisible well after the transition
  //     should have finished, drop the animation gate so nothing stays hidden.
  function watchdog() {
    if (docEl.classList.contains("no-anim")) return;
    const inEls = $$(".reveal.in");
    if (inEls.length && inEls.every((el) => parseFloat(getComputedStyle(el).opacity) < 0.5)) forceVisible();
  }
  setTimeout(watchdog, 1700);
  setTimeout(watchdog, 3200);
  const animOn = () => docEl.classList.contains("anim");

  /* ============================================================ NAV */
  const nav = $(".nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  $(".hamburger").addEventListener("click", () => nav.classList.toggle("open"));
  $$(".nav-links a").forEach((a) => a.addEventListener("click", () => nav.classList.remove("open")));

  /* ============================================================ CATEGORIES — Cloudinary cover görselleri */
  const CLOUD_CAT = "do7gjdvb0";
  const CAT_SLUG = { dogumgunu:"dogumgunu", nisan:"nisan", soz:"soz", dugun:"dugun", babyshower:"babyshower", yildonumu:"yildonumu", dilim:"dogumgunu", butik:"dogumgunu", ozel:"dogumgunu" };
  const catStack = $("#catStack");
  CATEGORIES.forEach((cat, i) => {
    const card = document.createElement("article");
    card.className = "cat-card reveal";
    card.dataset.cat = cat.id;
    const slug = CAT_SLUG[cat.id] || "dogumgunu";
    const placeholder = `https://res.cloudinary.com/${CLOUD_CAT}/image/upload/f_auto,q_auto,w_900,c_fill,ar_9:11/${slug}`;
    // Cloudinary tag'inden ilk görsel çek
    fetch(`https://res.cloudinary.com/${CLOUD_CAT}/image/list/${slug}.json?ts=`+Date.now())
      .then(r=>r.ok?r.json():{resources:[]})
      .then(d=>{
        const r=(d.resources||[]).sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||""))[0];
        if(r){
          const img=card.querySelector("img");
          if(img) img.src=`https://res.cloudinary.com/${CLOUD_CAT}/image/upload/f_auto,q_auto,w_900,c_fill,ar_9:11/v${r.version}/${r.public_id}.${r.format}`;
        }
      }).catch(()=>{});
    card.innerHTML = `
      <img src="${placeholder}" alt="${cat.name}" loading="lazy" />
      <div class="cat-body">
        <span class="ci">0${i + 1}</span>
        <h3>${cat.name}</h3>
        <p>${cat.tag}</p>
        <span class="cat-go">Ürünleri Gör
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </span>
      </div>`;
    card.addEventListener("click", () => openCategory(cat.id));
    catStack.appendChild(card);
  });

  /* filter tabs */
  const tabBar = $("#tabBar");
  CATEGORIES.forEach((cat) => {
    const t = document.createElement("button");
    t.className = "tab";
    t.textContent = cat.name;
    t.dataset.cat = cat.id;
    t.addEventListener("click", () => renderProducts(cat.id));
    tabBar.appendChild(t);
  });

  const prodGrid = $("#prodGrid");
  const prodTitle = $("#prodTitle");
  const catDefault = $("#catDefault");
  const productsView = $("#productsView");

  /* ürün için akıllı WhatsApp mesajı (kod + ad, kategoriye özel CTA) */
  function orderMsg(p) {
    if (p.catId === "dugun") return `Merhaba, düğün pastası için bilgi almak istiyorum 🎂 (${p.code} - ${p.name})`;
    if (p.catId === "ozel") return `Merhaba, özel tasarım pasta yaptırmak istiyorum 🎂 (${p.code} - ${p.name})`;
    return `Merhaba Pastacihanı, ${p.code} - ${p.name} siparişi vermek istiyorum 🎂`;
  }

  /* paylaşılan ürün kartı (kategori, arama ve sihirbaz sonuçları kullanır) */
  function buildProductCard(p, i) {
    const card = document.createElement("article");
    card.className = "prod-card";
    if (animOn() && typeof i === "number") card.style.animation = `lbPop .5s ease both ${Math.min(i, 8) * 0.06}s`;
    card.innerHTML = `
      <div class="prod-media" data-img="${p.img}" data-title="${p.name}">
        <span class="pcode">${p.code}</span>
        <img src="${unsplash(p.img, 760, 1000)}" alt="${p.name}" loading="lazy" />
        <span class="zoom"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg></span>
      </div>
      <div class="prod-info">
        <span class="order-badge"><span class="ob-ic">${p.order.icon}</span> ${p.order.label}</span>
        <h4>${p.name}</h4>
        <p>${p.desc}</p>
        <a class="order-btn" target="_blank" rel="noopener" href="${waURL(orderMsg(p))}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.3-.9-2.8-1.2-4.5-4.1-4.6-4.3-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.1c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.5c-.2.2-.3.3-.1.6.5.8 1 1.3 1.7 1.8.2.1.4.1.5 0l.7-.8c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.2.1.9-.1 1.6Z"/></svg>
          Sipariş Ver
        </a>
      </div>`;
    return card;
  }

  function renderProducts(catId) {
    const cat = CATEGORIES.find((c) => c.id === catId);
    if (!cat) return;
    prodTitle.innerHTML = `${cat.name} <span class="cat-series">(${cat.code} serisi)</span>`;
    $$(".tab", tabBar).forEach((t) => t.classList.toggle("active", t.dataset.cat === catId));
    prodGrid.innerHTML = "";
    const items = cat.products.map((p) => ({ ...p, catId: cat.id, catName: cat.name, order: cat.order }));
    items.forEach((p, i) => {
      const card = buildProductCard(p, i);
      card.querySelector(".prod-media").addEventListener("click", () => {
        openLightbox(items.map((x) => ({ img: x.img, title: `${x.code} · ${x.name}` })), i);
      });
      prodGrid.appendChild(card);
    });
    if (cat.comingSoon) {
      const soon = document.createElement("article");
      soon.className = "prod-soon";
      soon.innerHTML = `
        <div class="ps-mark">+</div>
        <h4>Yeni tasarımlar ekleniyor</h4>
        <p>Bu koleksiyona özenle hazırlanmış yeni pastalar yakında eklenecek. Aklınızdaki tasarımı hemen birlikte oluşturalım.</p>
        <a class="order-btn" target="_blank" rel="noopener" href="${waURL(cat.waIntro + " 🎂")}">
          <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.4A10 10 0 1 0 12 2Zm5.5 14.1c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 .1-3.3-.9-2.8-1.2-4.5-4.1-4.6-4.3-.1-.2-1.1-1.4-1.1-2.7s.7-1.9.9-2.1c.2-.2.5-.3.6-.3h.5c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .5l-.4.5c-.2.2-.3.3-.1.6.5.8 1 1.3 1.7 1.8.2.1.4.1.5 0l.7-.8c.2-.2.3-.2.6-.1l1.8.9c.2.1.4.2.4.3.1.2.1.9-.1 1.6Z"/></svg>
          Tasarımını Anlat
        </a>`;
      prodGrid.appendChild(soon);
    }
  }

  function scrollToPastalar() {
    const top = $("#pastalar").getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top, behavior: "smooth" });
  }
  function openCategory(catId) {
    catDefault.classList.add("hidden");
    productsView.classList.add("active");
    renderProducts(catId);
    scrollToPastalar();
  }
  $("#backToCats").addEventListener("click", () => {
    productsView.classList.remove("active");
    catDefault.classList.remove("hidden");
    scrollToPastalar();
  });

  /* ============================================================ CONFIGURATOR
     (3D tasarımcı artık ayrı "Pasta Atölyesi.html" sayfasında — bu blok
     yalnızca eski yerleşik panel DOM'da varsa çalışır) */
  if ($("#cfgType")) {
  const DEFAULT_COLOR = "#F2BFC9";
  const state = { tur: "", shape: "Yuvarlak", katman: 2, kisi: 10, color: "", colorName: "", coating: "Krema", decor: "Yok", yaziOn: false, yazi: "", aroma: [] };

  // type cards
  const typeRow = $("#cfgType");
  CFG_TYPES.forEach((t) => {
    const el = document.createElement("button");
    el.className = "type-card";
    el.dataset.val = t.val;
    el.innerHTML = `<img src="${unsplash(t.img, 320, 340)}" alt="${t.val}" loading="lazy" /><span class="tl">${t.val}</span>`;
    el.addEventListener("click", () => {
      state.tur = t.val;
      $$(".type-card", typeRow).forEach((c) => c.classList.toggle("sel", c === el));
      update();
    });
    typeRow.appendChild(el);
  });

  // shape cards (3D modele birebir yansır)
  const shapeRow = $("#cfgShape");
  CFG_SHAPES.forEach((s) => {
    const el = document.createElement("button");
    el.className = "shape-card" + (s.val === state.shape ? " sel" : "");
    el.dataset.val = s.val;
    el.innerHTML = `${s.icon}<span class="sl">${s.val}</span>`;
    el.addEventListener("click", () => {
      state.shape = s.val;
      $$(".shape-card", shapeRow).forEach((c) => c.classList.toggle("sel", c === el));
      update();
    });
    shapeRow.appendChild(el);
  });

  // layer pills
  const layerRow = $("#cfgLayer");
  [1, 2, 3].forEach((n) => {
    const el = document.createElement("button");
    el.className = "pill" + (n === 2 ? " sel" : "");
    el.textContent = n + " Kat";
    el.dataset.val = n;
    el.addEventListener("click", () => {
      state.katman = n;
      $$(".pill", layerRow).forEach((p) => p.classList.toggle("sel", p === el));
      update();
    });
    layerRow.appendChild(el);
  });

  // kişi number
  const kisiInput = $("#cfgKisi");
  const KMIN = 1, KMAX = 500;
  function setKisi(v, fromInput) {
    let n = parseInt(v, 10);
    if (isNaN(n)) n = 10;
    n = Math.max(KMIN, Math.min(KMAX, n));
    state.kisi = n;
    if (!fromInput) kisiInput.value = n;
    update();
  }
  kisiInput.addEventListener("input", () => {
    if (kisiInput.value === "") { state.kisi = ""; update(); return; }
    setKisi(kisiInput.value, true);
  });
  kisiInput.addEventListener("blur", () => setKisi(kisiInput.value));
  $("#kisiMinus").addEventListener("click", () => setKisi((parseInt(kisiInput.value, 10) || 10) - 1));
  $("#kisiPlus").addEventListener("click", () => setKisi((parseInt(kisiInput.value, 10) || 10) + 1));

  // color swatches
  const swRow = $("#cfgColor");
  CFG_COLORS.forEach((c) => {
    const wrap = document.createElement("div");
    wrap.className = "swatch";
    wrap.innerHTML = `<button style="background:${c.hex}" aria-label="${c.name}"></button><span class="sn">${c.name}</span>`;
    wrap.querySelector("button").addEventListener("click", () => {
      state.color = c.hex; state.colorName = c.name;
      $$(".swatch", swRow).forEach((s) => s.classList.toggle("sel", s === wrap));
      update();
    });
    swRow.appendChild(wrap);
  });

  // coating segmented (her birinde doku farklı)
  const coatRow = $("#cfgCoating");
  CFG_COATINGS.forEach((c) => {
    const el = document.createElement("button");
    el.textContent = c.val;
    el.dataset.val = c.val;
    if (c.val === state.coating) el.classList.add("sel");
    el.addEventListener("click", () => {
      state.coating = c.val;
      $$("button", coatRow).forEach((b) => b.classList.toggle("sel", b === el));
      update();
    });
    coatRow.appendChild(el);
  });

  // decor segmented
  const segRow = $("#cfgDecor");
  ["Yok", "Minimal", "Orta", "Bol"].forEach((d) => {
    const el = document.createElement("button");
    el.textContent = d;
    el.dataset.val = d;
    if (d === "Yok") el.classList.add("sel");
    el.addEventListener("click", () => {
      state.decor = d;
      $$("button", segRow).forEach((b) => b.classList.toggle("sel", b === el));
      update();
    });
    segRow.appendChild(el);
  });

  // yazı toggle + text
  const tg = $("#cfgYaziTg");
  const yaziText = $("#cfgYaziText");
  tg.addEventListener("click", () => {
    state.yaziOn = !state.yaziOn;
    tg.classList.toggle("on", state.yaziOn);
    yaziText.disabled = !state.yaziOn;
    if (state.yaziOn) yaziText.focus();
    update();
  });
  yaziText.addEventListener("input", () => { state.yazi = yaziText.value; update(); });

  // aroma chips
  const aromaRow = $("#cfgAroma");
  ["Çikolatalı", "Vanilyalı", "Meyveli", "Red Velvet", "Karamel"].forEach((a) => {
    const el = document.createElement("button");
    el.className = "achip";
    el.textContent = a;
    el.addEventListener("click", () => {
      const idx = state.aroma.indexOf(a);
      if (idx >= 0) state.aroma.splice(idx, 1); else state.aroma.push(a);
      el.classList.toggle("sel");
      update();
    });
    aromaRow.appendChild(el);
  });

  /* summary -> 3D + hint */
  function update() {
    if (window.Cake3D) {
      window.Cake3D.update({
        layers: state.katman,
        color: state.color || DEFAULT_COLOR,
        decor: state.decor,
        text: state.yaziOn ? state.yazi : "",
        topper: state.tur,
        shape: state.shape,
        coating: state.coating,
      });
    }
    const hint = $("#cfgHint");
    hint.classList.remove("warn");
    hint.textContent = "Seçimleriniz anlık olarak modele yansır.";
  }

  /* ---- tasarım görseli (paylaşılabilir kart) ---- */
  function roundRectPath(x, rx, ry, w, h, r) {
    x.beginPath(); x.moveTo(rx + r, ry);
    x.arcTo(rx + w, ry, rx + w, ry + h, r); x.arcTo(rx + w, ry + h, rx, ry + h, r);
    x.arcTo(rx, ry + h, rx, ry, r); x.arcTo(rx, ry, rx + w, ry, r); x.closePath();
  }
  function triggerDownload(dataURL) {
    const a = document.createElement("a");
    a.href = dataURL; a.download = "pastacihani-tasarimim.png";
    document.body.appendChild(a); a.click(); a.remove();
  }
  function generateDesignImage() {
    if (!window.Cake3D || !Cake3D.snapshot) return;
    const cakeURL = Cake3D.snapshot(1200);
    const draw = () => {
      const W = 1080, H = 1500, x = document.createElement("canvas").getContext("2d");
      x.canvas.width = W; x.canvas.height = H;
      const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, "#FBF4EC"); bg.addColorStop(1, "#F0E4D5");
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      x.textAlign = "center";
      x.fillStyle = "#B0697F"; x.font = "600 28px Jost, sans-serif";
      x.fillText("P A S T A   T A S A R I M I M", W / 2, 92);
      x.fillStyle = "#2A1E22"; x.font = "600 78px 'Cormorant Garamond', Georgia, serif";
      x.fillText("Pastacihanı", W / 2, 176);
      x.strokeStyle = "#C2A062"; x.lineWidth = 2; x.beginPath(); x.moveTo(W / 2 - 64, 204); x.lineTo(W / 2 + 64, 204); x.stroke();
      const sx = 70, sy = 244, sw = W - 140, sh = 720;
      roundRectPath(x, sx, sy, sw, sh, 30);
      const rg = x.createRadialGradient(W / 2, sy + sh * 0.42, 40, W / 2, sy + sh * 0.5, sw * 0.72);
      rg.addColorStop(0, "#3a2b30"); rg.addColorStop(0.64, "#241a1d"); rg.addColorStop(1, "#181012");
      x.fillStyle = rg; x.fill();
      const finish = () => {
        // alt özet
        const yazi = state.yaziOn && state.yazi.trim() ? state.yazi.trim() : "Yok";
        const rows = [
          ["Tür", state.tur || "—"], ["Şekil", state.shape],
          ["Katman", state.katman + " Kat"], ["Kişi", state.kisi + " Kişilik"],
          ["Kaplama", (state.colorName || "—") + " · " + state.coating], ["Süsleme", state.decor],
          ["Yazı", yazi], ["Aroma", state.aroma.length ? state.aroma.join(", ") : "—"],
        ];
        const colL = 116, colR = W / 2 + 24, top = 1040, rowH = 104;
        x.textAlign = "left";
        rows.forEach((it, i) => {
          const cx = i % 2 ? colR : colL, cy = top + Math.floor(i / 2) * rowH;
          x.fillStyle = "#B0697F"; x.font = "600 22px Jost, sans-serif";
          x.fillText(it[0].toUpperCase(), cx, cy);
          x.fillStyle = "#2A1E22"; x.font = "500 34px 'Cormorant Garamond', Georgia, serif";
          let v = it[1]; if (v.length > 26) v = v.slice(0, 25) + "…";
          x.fillText(v, cx, cy + 40);
        });
        x.textAlign = "center"; x.fillStyle = "#6E5C61"; x.font = "500 26px Jost, sans-serif";
        x.fillText("0554 810 6301   ·   İstanbul Silivri   ·   pastacihanı.com", W / 2, H - 52);
        triggerDownload(x.canvas.toDataURL("image/png"));
      };
      const img = new Image();
      img.onload = () => { const s = Math.min(sw, sh); x.drawImage(img, W / 2 - s / 2, sy + sh / 2 - s / 2, s, s); finish(); };
      img.onerror = finish;
      img.src = cakeURL;
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw); else draw();
  }

  $("#cfgSend").addEventListener("click", () => {
    const missing = [];
    if (!state.tur) missing.push("pasta türü");
    if (!state.kisi) missing.push("kişi sayısı");
    if (!state.colorName) missing.push("kaplama rengi");
    if (state.aroma.length === 0) missing.push("aroma");
    const hint = $("#cfgHint");
    if (missing.length) {
      hint.classList.add("warn");
      hint.textContent = `Lütfen önce şunları seçin: ${missing.join(", ")} 🙏`;
      return;
    }
    const yazi = state.yaziOn && state.yazi.trim() ? state.yazi.trim() : "Yok";
    const msg =
      `Merhaba Pastacihanı 🎂 Pasta tasarımım:\n` +
      `• Tür: ${state.tur}\n` +
      `• Şekil: ${state.shape}\n` +
      `• Katman: ${state.katman}\n` +
      `• Kişi: ${state.kisi}\n` +
      `• Kaplama: ${state.colorName} (${state.coating})\n` +
      `• Süsleme: ${state.decor}\n` +
      `• Yazı: ${yazi}\n` +
      `• Aroma: ${state.aroma.join(", ")}\n` +
      `📸 Tasarım görselimi mesaja ekliyorum.`;
    window.open(waURL(msg), "_blank", "noopener");
    generateDesignImage();
    hint.classList.remove("warn");
    hint.textContent = "Tasarım görseliniz indirildi 📸 WhatsApp'ta mesaja ekleyip gönderebilirsiniz.";
  });

  update();

  // drag hint (after canvas mounts)
  (function () {
    const stage = $("#cakeStage");
    if (stage && !stage.querySelector(".drag-hint")) {
      const h = document.createElement("div");
      h.className = "drag-hint";
      h.innerHTML = '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/></svg> Döndürmek için sürükleyin';
      stage.appendChild(h);
    }
  })();
  } // CONFIGURATOR koruması sonu

  /* ============================================================ GALLERY — Cloudinary'den gerçek görseller */
  const galGrid = $("#galGrid");
  if (galGrid) {
    const CLOUD = "do7gjdvb0";
    const GAL_CATS = ["dogumgunu","dugun","nisan","babyshower","yildonumu","soz"];
    const GAL_LABELS = { dogumgunu:"Doğum Günü", dugun:"Düğün", nisan:"Nişan", babyshower:"Baby Shower", yildonumu:"Yıldönümü", soz:"Söz" };
    const SPANS = ["tall","","wide","","","tall"];
    function cldGal(r,w,h){ return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_${w},c_fill,ar_${w}:${h}/v${r.version}/${r.public_id}.${r.format}`; }
    // Fisher-Yates karıştırma — her ziyarette farklı sıra
    function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
    Promise.all(GAL_CATS.map(slug =>
      fetch(`https://res.cloudinary.com/${CLOUD}/image/list/${slug}.json?ts=`+Date.now())
        .then(r=>r.ok?r.json():{resources:[]})
        // O kategorinin TÜM resimlerini karışık sırayla tut — kartlar bunlar arasında döner
        .then(d=>({ slug, list:shuffle((d.resources||[]).slice()) }))
        .catch(()=>({ slug, list:[] }))
    )).then(results=>{
      galGrid.innerHTML="";
      results.forEach(({slug,list},cardIdx)=>{
        if(!list.length)return;
        const span=SPANS[GAL_CATS.indexOf(slug)]||"";
        const w=span==="wide"?900:560, h=span==="tall"?1100:span==="wide"?560:720;
        // kart tıklaması galeri sayfasındaki ilgili kategoriye götürür
        const item=document.createElement("a");
        item.href=`/galeri?kat=${slug}`;
        item.setAttribute("aria-label",`${GAL_LABELS[slug]} pastalarını galeride gör`);
        // NOT: reveal kullanma — sonradan JS ile eklenen kartlar gözlemciye bağlanmıyor, boş kalıyor
        item.className="gal-item"+(span?" "+span:"");
        item.innerHTML=`<img class="gal-ph" decoding="async" alt="${GAL_LABELS[slug]} pasta tasarımı" src="${cldGal(list[0],w,h)}"/><div class="gov"><span class="gt">${GAL_LABELS[slug]} · Galeride Gör →</span></div>`;
        galGrid.appendChild(item);

        // ---- otomatik resim döngüsü: sabit kalmasın, o kategorinin diğer pastaları dönsün ----
        if(list.length>1){
          const imgEl=item.querySelector("img");
          let i=0;
          const rotate=()=>{
            i=(i+1)%list.length;
            const nextUrl=cldGal(list[i],w,h);
            const pre=new Image();
            pre.onload=()=>{ // önce indir, sonra yumuşak geçişle değiştir (boş/atlama olmaz)
              imgEl.style.opacity="0";
              setTimeout(()=>{ imgEl.src=nextUrl; imgEl.style.opacity="1"; }, 320);
            };
            pre.src=nextUrl;
          };
          // her karta farklı ritim — hepsi aynı anda değişmesin
          setInterval(rotate, 4200 + cardIdx*750);
        }
      });
    });
  }

  /* ============================================================ LIGHTBOX */
  const lb = $("#lightbox");
  const lbFrame = $("#lbFrame");
  const lbCaption = $("#lbCaption");
  const lbPrev = $("#lbPrev");
  const lbNext = $("#lbNext");
  let lbItems = [], lbIndex = 0;

  function renderLb() {
    const it = lbItems[lbIndex];
    // Tam URL (Cloudinary vs.) ise doğrudan kullan; kısa ID ise unsplash/bundle'dan al
    const src = (it.img && (it.img.startsWith("http") || it.img.startsWith("/")))
      ? it.img
      : unsplash(it.img, 1200, 1500);
    lbFrame.innerHTML = `<img src="${src}" alt="${it.title}" />`;
    lbCaption.textContent = it.title;
    const multi = lbItems.length > 1;
    lbPrev.classList.toggle("hidden", !multi);
    lbNext.classList.toggle("hidden", !multi);
  }
  function openLightbox(items, idx) {
    lbItems = items; lbIndex = idx; renderLb();
    lb.classList.add("open"); document.body.style.overflow = "hidden";
  }
  function closeLb() { lb.classList.remove("open"); document.body.style.overflow = ""; }
  function step(d) { lbIndex = (lbIndex + d + lbItems.length) % lbItems.length; renderLb(); }
  $("#lbClose").addEventListener("click", closeLb);
  $("#lbBg").addEventListener("click", closeLb);
  lbPrev.addEventListener("click", () => step(-1));
  lbNext.addEventListener("click", () => step(1));
  document.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("open")) return;
    if (e.key === "Escape") closeLb();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  /* ============================================================ TESTIMONIALS */
  const track = $("#tTrack");
  const buildT = (t) => {
    const el = document.createElement("article");
    el.className = "tcard";
    const stars = "★".repeat(t.stars || 5);
    el.innerHTML = `
      <div class="thead">
        <div class="stars">${stars}</div>
        <span class="tdate">${t.date || ""}</span>
      </div>
      <p class="tq">"${t.text}"</p>
      <div class="who">
        <span class="av av-init" style="background:var(--rose)">${t.name.charAt(0).toUpperCase()}</span>
        <div><div class="nm">${t.name}</div><div class="mt">${t.meta}</div></div>
      </div>`;
    return el;
  };
  if (track) [...TESTIMONIALS, ...TESTIMONIALS].forEach((t) => track.appendChild(buildT(t)));

  /* ============================================================ FAVORİLER */
  (function renderFavorites() {
    const grid = $("#favGrid");
    if (!grid) return;
    const CLOUD = "do7gjdvb0";
    const CATS = [
      { slug:"dogumgunu",  label:"Doğum Günü" },
      { slug:"dugun",      label:"Düğün" },
      { slug:"nisan",      label:"Nişan" },
      { slug:"babyshower", label:"Baby Shower" },
      { slug:"yildonumu",  label:"Yıldönümü" },
      { slug:"soz",        label:"Söz" },
    ];
    function cldUrl(r, w, h) {
      const ar = h ? `,ar_${w}:${h}` : "";
      return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_${w},c_fill${ar}/v${r.version}/${r.public_id}.${r.format}`;
    }
    // İskelet kartlar
    CATS.forEach(() => {
      const sk = document.createElement("article");
      sk.className = "fav-card fav-skel";
      grid.appendChild(sk);
    });
    // Her kategoriden ilk 2 görsel çek, toplamda 12 kart
    Promise.all(CATS.map(cat =>
      fetch(`https://res.cloudinary.com/${CLOUD}/image/list/${cat.slug}.json?ts=` + Date.now())
        .then(r => r.ok ? r.json() : { resources:[] })
        .then(d => ({ cat, resources: (d.resources||[]).sort((a,b)=>(b.created_at||"").localeCompare(a.created_at||"")).slice(0,2) }))
        .catch(() => ({ cat, resources:[] }))
    )).then(results => {
      grid.innerHTML = "";
      results.forEach(({ cat, resources }) => {
        resources.forEach(r => {
          const el = document.createElement("article");
          el.className = "fav-card reveal";
          el.innerHTML = `
            <img src="${cldUrl(r,600,740)}" alt="${cat.label} pasta tasarımı" loading="lazy" />
            <div class="fav-body">
              <div class="fav-cat">${cat.label}</div>
              <span class="fav-go">Galeride Gör
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
              </span>
            </div>`;
          el.addEventListener("click", () => { window.location.href = `/galeri?kat=${cat.slug}`; });
          grid.appendChild(el);
        });
      });
    });
  })();

  /* ============================================================ GÜVEN ROZETLERİ */
  (function renderTrust() {
    const strip = $("#trustStrip");
    if (!strip || typeof TRUST_BADGES === "undefined") return;
    TRUST_BADGES.forEach((b) => {
      const el = document.createElement("div");
      el.className = "trust-card";
      el.innerHTML = `<span class="trust-ic">${b.icon}</span><span class="trust-lbl">${b.label}</span>`;
      strip.appendChild(el);
    });
  })();

  /* ============================================================ TESLİMAT BÖLGELERİ */
  (function renderDelivery() {
    const list = $("#deliveryList");
    if (!list || typeof DELIVERY_ZONES === "undefined") return;
    DELIVERY_ZONES.forEach((z) => {
      const el = document.createElement("div");
      el.className = "dz-row" + (z.free ? " free" : "");
      el.innerHTML = `
        <span class="dz-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
        <span class="dz-txt"><span class="dz-zone">${z.zone}</span><span class="dz-note">${z.note}</span></span>`;
      list.appendChild(el);
    });
  })();

  /* ============================================================ PUBLIC API (features.js) */
  window.PC = {
    unsplash, waURL, orderMsg, buildProductCard, openCategory,
    openLightbox: (items, idx) => openLightbox(items, idx),
  };

  /* ============================================================ REVEAL */
  const revealEls = $$(".reveal");
  function checkReveal() {
    const vh = window.innerHeight;
    revealEls.forEach((el) => {
      if (el.classList.contains("in")) return;
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) {
        const sibs = [...el.parentElement.querySelectorAll(".reveal")];
        const delay = Math.min(Math.max(sibs.indexOf(el), 0), 5) * 90;
        setTimeout(() => el.classList.add("in"), delay);
      }
    });
  }
  window.addEventListener("scroll", checkReveal, { passive: true });
  window.addEventListener("resize", checkReveal);
  checkReveal();
  requestAnimationFrame(checkReveal);
  setTimeout(checkReveal, 320);

  /* ============================================================ INSTAGRAM QR */
  (function renderIgQr() {
    const cv = $("#igQr");
    if (!cv || typeof QRCode === "undefined") return;
    try {
      QRCode.render(cv, "https://www.instagram.com/pastacihani.online/", { ecl: "M", size: 270, dark: "#2A1E22", light: "#ffffff", quiet: 2 });
    } catch (e) {}
  })();
})();
