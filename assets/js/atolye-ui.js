/* ============================================================
   Pastacihanı — Pasta Atölyesi UI
   5 sekmeli sihirbaz · hazır şablonlar · canlı fiyat · zar ·
   özet kartı · WhatsApp sipariş · PNG indirme · bottom sheet
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];

  const WA_NUMBER = "905548106301";
  const waURL = (text) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

  /* ============================================================
     FİYATLANDIRMA — buradaki rakamları dilediğiniz gibi güncelleyin.
     Tahmini aralık = toplam ± aralikYuzde.
     ============================================================ */
  const PRICING = {
    taban: { s: 950, m: 1450, l: 2350, xl: 4200 },     // boyut taban fiyatı (₺)
    katEk: 300,                                         // 1 kattan sonraki her kat
    kaplama: { santi: 0, butter: 150, fondant: 450, naked: 100 },
    sekil: { round: 0, square: 100, heart: 150 },
    renkModu: { solid: 0, ombre: 120, marble: 220 },
    susleme: { drip: 160, flowers: 280, fruit: 200, macaron: 240, leaf: 190, pearls: 130, ganache: 150 },
    topper: { none: 0, number: 90, mutlu: 120, name: 170, heart: 110 },
    yazi: 80,                                           // pasta üstü yazı
    mum: 8,                                             // mum başına
    aralikYuzde: 0.13,                                  // ± yüzde aralık
  };

  /* ---- seçenek verileri ---- */
  const COLORS = [
    { name: "Beyaz", hex: "#F4EEE3" },
    { name: "Pudra Pembesi", hex: "#F2BFC9" },
    { name: "Gül Kurusu", hex: "#D89BA9" },
    { name: "Fuşya", hex: "#D9558C" },
    { name: "Lila", hex: "#CDB4E2" },
    { name: "Lavanta", hex: "#9B79C9" },
    { name: "Bebek Mavisi", hex: "#B6D8E8" },
    { name: "Gece Mavisi", hex: "#41608A" },
    { name: "Mint", hex: "#BFE3CE" },
    { name: "Limon", hex: "#F2DC9B" },
    { name: "Şeftali", hex: "#F5C9A8" },
    { name: "Çikolata", hex: "#5C3A26" },
  ];
  const SHAPES = [
    { key: "round", name: "Yuvarlak", icon: '<svg viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="13" stroke="currentColor" stroke-width="1.6"></circle></svg>' },
    { key: "square", name: "Kare", icon: '<svg viewBox="0 0 40 40" fill="none"><rect x="8" y="8" width="24" height="24" rx="4" stroke="currentColor" stroke-width="1.6"></rect></svg>' },
    { key: "heart", name: "Kalp", icon: '<svg viewBox="0 0 40 40" fill="none"><path d="M20 31c-1-.8-11-7.4-11-14.2 0-3.6 2.7-6 5.6-6 2.3 0 4 1.3 5.4 3.2 1.4-1.9 3.1-3.2 5.4-3.2 2.9 0 5.6 2.4 5.6 6C31 23.6 21 30.2 20 31Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"></path></svg>' },
  ];
  const SIZES = [
    { key: "s", label: "6–8", sub: "kişilik" },
    { key: "m", label: "10–15", sub: "kişilik" },
    { key: "l", label: "20–30", sub: "kişilik" },
    { key: "xl", label: "40+", sub: "düğün" },
  ];
  const COATINGS = [
    { key: "santi", name: "Krem Şanti", sub: "hafif, bulut dokulu" },
    { key: "butter", name: "Buttercream", sub: "klasik, kadifemsi" },
    { key: "fondant", name: "Fondant", sub: "pürüzsüz, şık" },
    { key: "naked", name: "Naked Cake", sub: "çıplak, rustik" },
  ];
  const COLOR_MODES = [
    { key: "solid", name: "Düz" },
    { key: "ombre", name: "Ombre" },
    { key: "marble", name: "Mermer / Ebru" },
  ];
  const DECORS = [
    { key: "drip", name: "Çikolata Drip" },
    { key: "flowers", name: "Şeker Çiçekleri" },
    { key: "fruit", name: "Taze Meyve" },
    { key: "macaron", name: "Makaron" },
    { key: "pearls", name: "İnci Boncuk" },
    { key: "ganache", name: "Ganaj" },
  ];
  const DRIPS = [
    { key: "sutlu", name: "Sütlü" },
    { key: "beyaz", name: "Beyaz" },
    { key: "karamel", name: "Karamel" },
  ];
  const LEAVES = [
    { key: "gold", name: "Altın Yaprak" },
    { key: "silver", name: "Gümüş Yaprak" },
  ];
  const TOPPERS = [
    { key: "none", name: "Yok" },
    { key: "number", name: "Rakam Mum" },
    { key: "mutlu", name: "“Mutlu Yıllar”" },
    { key: "name", name: "İsim Topper" },
    { key: "heart", name: "Kalp Topper" },
  ];
  const FLAVORS = [
    { key: "cikolata", name: "Çikolatalı", c: "#4a2b18" },
    { key: "vanilya", name: "Vanilyalı", c: "#efddb5" },
    { key: "frambuaz", name: "Frambuazlı", c: "#d96a8b" },
    { key: "limon", name: "Limonlu", c: "#f1e2a4" },
    { key: "lotus", name: "Lotuslu", c: "#c98a52" },
    { key: "fistik", name: "Fıstıklı", c: "#a8c487" },
  ];
  const SIZE_LABEL = { s: "6-8 kişilik", m: "10-15 kişilik", l: "20-30 kişilik", xl: "40+ kişilik (düğün)" };
  const SHAPE_LABEL = { round: "yuvarlak", square: "kare", heart: "kalp" };
  const COATING_LABEL = { santi: "krem şanti", butter: "buttercream", fondant: "fondant", naked: "naked cake" };
  const DRIP_LABEL = { sutlu: "sütlü çikolata drip", beyaz: "beyaz çikolata drip", karamel: "karamel drip" };

  /* ---- hazır şablonlar ---- */
  const blank = { drip: null, flowers: false, fruit: false, macaron: false, pearls: false, ganache: false, leaf: null, text: "", topper: "none", topperValue: "", candles: 0 };
  const TEMPLATES = [
    { name: "Doğum Günü Klasiği", chip: "#F2BFC9", st: { ...blank, layers: 2, shape: "round", size: "m", coating: "butter", colorMode: "solid", color: "#F2BFC9", drip: "sutlu", fruit: true, macaron: true, text: "İyi ki doğdun", candles: 5, flavors: ["cikolata", "vanilya"] } },
    { name: "Romantik Söz / Nişan", chip: "#D89BA9", st: { ...blank, layers: 2, shape: "heart", size: "m", coating: "fondant", colorMode: "ombre", color: "#D89BA9", flowers: true, pearls: true, topper: "heart", flavors: ["frambuaz", "vanilya"] } },
    { name: "Minimal Şık", chip: "#F4EEE3", st: { ...blank, layers: 1, shape: "round", size: "s", coating: "butter", colorMode: "marble", color: "#F4EEE3", leaf: "gold", flavors: ["limon"] } },
    { name: "Çocuk Doğum Günü", chip: "#B6D8E8", st: { ...blank, layers: 2, shape: "round", size: "m", coating: "santi", colorMode: "solid", color: "#B6D8E8", drip: "beyaz", macaron: true, topper: "number", topperValue: "5", flavors: ["cikolata", "vanilya"] } },
    { name: "Yıldönümü", chip: "#41608A", st: { ...blank, layers: 2, shape: "square", size: "m", coating: "fondant", colorMode: "solid", color: "#41608A", leaf: "gold", ganache: true, text: "Nice yıllara", flavors: ["lotus", "cikolata"] } },
    { name: "Baby Shower", chip: "#BFE3CE", st: { ...blank, layers: 2, shape: "round", size: "l", coating: "santi", colorMode: "solid", color: "#BFE3CE", pearls: true, flowers: true, text: "Hoş geldin bebek", flavors: ["vanilya", "limon"] } },
  ];

  /* ---- zar kombinasyonları (uyumlu, şık) ---- */
  const DICE_COMBOS = [
    { coating: "butter", colorMode: "solid", drip: "sutlu", macaron: true },
    { coating: "butter", colorMode: "solid", drip: "karamel", fruit: true },
    { coating: "fondant", colorMode: "ombre", flowers: true, pearls: true },
    { coating: "butter", colorMode: "marble", leaf: "gold" },
    { coating: "santi", colorMode: "solid", drip: "beyaz", fruit: true },
    { coating: "naked", colorMode: "solid", fruit: true, flowers: true },
    { coating: "fondant", colorMode: "solid", ganache: true, leaf: "silver" },
    { coating: "butter", colorMode: "solid", flowers: true, leaf: "gold" },
    { coating: "fondant", colorMode: "ombre", pearls: true, macaron: true },
  ];

  /* ---- durum ---- */
  const state = {
    layers: 2, shape: "round", size: "m",
    coating: "butter", colorMode: "solid", color: "#F2BFC9", colorName: "Pudra Pembesi",
    drip: null, flowers: false, fruit: false, macaron: false, pearls: false, ganache: false, leaf: null,
    text: "", topper: "none", topperValue: "", candles: 0,
    flavors: ["cikolata", "vanilya", "frambuaz"],
  };

  /* ============================================================ 3D köprüsü */
  let booted = false;
  function engineState() {
    return { ...state, flavors: state.flavors.slice(0, state.layers) };
  }
  function update3d() {
    if (booted && window.Atelier3D && Atelier3D.supported) Atelier3D.update(engineState());
    syncSliceBtns();
  }
  function boot() {
    if (booted) return;
    if (!window.Atelier3D || !Atelier3D.supported) { showFallback(); return; }
    booted = true;
    Atelier3D.init(engineState());
    Atelier3D.onUserInteract = () => { const h = $("#stageHint"); if (h) h.classList.add("gone"); };
    $("#atelierStage").classList.add("ready");
  }
  function showFallback() {
    $("#atelierFallback").classList.add("show");
    $$(".stage-fab").forEach((b) => b.style.display = "none");
    const h = $("#stageHint"); if (h) h.style.display = "none";
  }

  /* ============================================================ arka plan uyumu */
  function hexMix(a, b, t) {
    const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
    const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return "#" + pa.map((v, i) => Math.round(v + (pb[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }
  function renderBg() {
    const c = state.color;
    document.documentElement.style.setProperty("--stage-c1", hexMix(c, "#FFFDFA", 0.82));
    document.documentElement.style.setProperty("--stage-c2", hexMix(c, "#F4E9DC", 0.55));
    document.documentElement.style.setProperty("--stage-c3", hexMix(c, "#D9C4B2", 0.42));
  }

  /* ============================================================ kontrol render */
  function pillRow(el, items, getKey, isSel, onPick, render) {
    el.innerHTML = "";
    items.forEach((it) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "atl-pill" + (isSel(it) ? " sel" : "");
      b.innerHTML = render ? render(it) : it.name;
      b.addEventListener("click", () => { onPick(it); renderControls(); commit(); });
      el.appendChild(b);
    });
  }

  function renderControls() {
    /* 1 — boyut & şekil */
    pillRow($("#optLayers"), [1, 2, 3], null, (n) => state.layers === n, (n) => {
      state.layers = n;
      while (state.flavors.length < n) state.flavors.push("vanilya");
    }, (n) => `${n} Kat`);
    const shapeEl = $("#optShape"); shapeEl.innerHTML = "";
    SHAPES.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "atl-shape" + (state.shape === s.key ? " sel" : "");
      b.innerHTML = `${s.icon}<span>${s.name}</span>`;
      b.addEventListener("click", () => { state.shape = s.key; renderControls(); commit(); });
      shapeEl.appendChild(b);
    });
    const sizeEl = $("#optSize"); sizeEl.innerHTML = "";
    SIZES.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "atl-size" + (state.size === s.key ? " sel" : "");
      b.innerHTML = `<strong>${s.label}</strong><span>${s.sub}</span>`;
      b.addEventListener("click", () => { state.size = s.key; renderControls(); commit(); });
      sizeEl.appendChild(b);
    });

    /* 2 — kaplama & renk */
    const coatEl = $("#optCoating"); coatEl.innerHTML = "";
    COATINGS.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "atl-coat" + (state.coating === c.key ? " sel" : "");
      b.innerHTML = `<strong>${c.name}</strong><span>${c.sub}</span>`;
      b.addEventListener("click", () => { state.coating = c.key; renderControls(); commit(); });
      coatEl.appendChild(b);
    });
    const colEl = $("#optColors"); colEl.innerHTML = "";
    COLORS.forEach((c) => {
      const w = document.createElement("button");
      w.type = "button";
      w.className = "atl-swatch" + (state.color === c.hex ? " sel" : "");
      w.title = c.name;
      w.setAttribute("aria-label", c.name);
      w.style.background = c.hex;
      w.addEventListener("click", () => { state.color = c.hex; state.colorName = c.name; renderControls(); commit(); });
      colEl.appendChild(w);
    });
    $("#colorName").textContent = state.colorName;
    pillRow($("#optColorMode"), COLOR_MODES, null, (m) => state.colorMode === m.key, (m) => { state.colorMode = m.key; });

    /* 3 — süsleme */
    const decEl = $("#optDecor"); decEl.innerHTML = "";
    DECORS.forEach((d) => {
      const on = d.key === "drip" ? !!state.drip : !!state[d.key];
      const b = document.createElement("button");
      b.type = "button";
      b.className = "atl-chip" + (on ? " sel" : "");
      b.innerHTML = `<span class="tick"></span>${d.name}`;
      b.addEventListener("click", () => {
        if (d.key === "drip") state.drip = state.drip ? null : "sutlu";
        else state[d.key] = !state[d.key];
        renderControls(); commit();
      });
      decEl.appendChild(b);
    });
    LEAVES.forEach((l) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "atl-chip" + (state.leaf === l.key ? " sel" : "");
      b.innerHTML = `<span class="tick"></span>${l.name}`;
      b.addEventListener("click", () => { state.leaf = state.leaf === l.key ? null : l.key; renderControls(); commit(); });
      decEl.appendChild(b);
    });
    const dripSub = $("#dripSub");
    dripSub.classList.toggle("show", !!state.drip);
    if (state.drip) {
      pillRow($("#optDrip"), DRIPS, null, (d) => state.drip === d.key, (d) => { state.drip = d.key; });
    }

    /* 4 — tepe & yazı */
    $("#inpText").value = state.text;
    $("#txtCount").textContent = `${state.text.length}/25`;
    const topEl = $("#optTopper"); topEl.innerHTML = "";
    TOPPERS.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "atl-pill" + (state.topper === t.key ? " sel" : "");
      b.textContent = t.name;
      b.addEventListener("click", () => { state.topper = t.key; renderControls(); commit(); });
      topEl.appendChild(b);
    });
    const sub = $("#topperSub");
    if (state.topper === "number") {
      sub.className = "topper-sub show";
      sub.innerHTML = `<label>Rakam</label><input type="text" id="inpTopperVal" maxlength="2" inputmode="numeric" placeholder="örn. 5" value="${state.topperValue.replace(/"/g, "")}" />`;
    } else if (state.topper === "name") {
      sub.className = "topper-sub show";
      sub.innerHTML = `<label>İsim</label><input type="text" id="inpTopperVal" maxlength="14" placeholder="örn. Elif" value="${state.topperValue.replace(/"/g, "")}" />`;
    } else {
      sub.className = "topper-sub";
      sub.innerHTML = "";
    }
    const tv = $("#inpTopperVal");
    if (tv) tv.addEventListener("input", () => { state.topperValue = tv.value; commitDebounced(); });
    $("#candleVal").textContent = state.candles;

    /* 5 — kat tatları */
    const fl = $("#flavorRows"); fl.innerHTML = "";
    const labels = state.layers === 1 ? ["Tek Kat"] : state.layers === 2 ? ["Alt Kat", "Üst Kat"] : ["Alt Kat", "Orta Kat", "Üst Kat"];
    for (let i = 0; i < state.layers; i++) {
      const row = document.createElement("div");
      row.className = "flavor-row";
      row.innerHTML = `<div class="fr-label">${labels[i]}</div><div class="fr-opts"></div>`;
      const opts = row.querySelector(".fr-opts");
      FLAVORS.forEach((f) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "atl-flavor" + (state.flavors[i] === f.key ? " sel" : "");
        b.innerHTML = `<span class="fdot" style="background:${f.c}"></span>${f.name}`;
        b.addEventListener("click", () => { state.flavors[i] = f.key; renderControls(); commit(); });
        opts.appendChild(b);
      });
      fl.appendChild(row);
    }
  }

  /* ============================================================ fiyat */
  const round50 = (n) => Math.round(n / 50) * 50;
  const fmt = (n) => n.toLocaleString("tr-TR");
  function priceRange() {
    let t = PRICING.taban[state.size] || PRICING.taban.m;
    t += (state.layers - 1) * PRICING.katEk;
    t += PRICING.kaplama[state.coating] || 0;
    t += PRICING.sekil[state.shape] || 0;
    t += PRICING.renkModu[state.colorMode] || 0;
    if (state.drip) t += PRICING.susleme.drip;
    ["flowers", "fruit", "macaron", "pearls", "ganache"].forEach((k) => { if (state[k]) t += PRICING.susleme[k]; });
    if (state.leaf) t += PRICING.susleme.leaf;
    t += PRICING.topper[state.topper] || 0;
    if (state.text.trim()) t += PRICING.yazi;
    t += state.candles * PRICING.mum;
    return [round50(t * (1 - PRICING.aralikYuzde)), round50(t * (1 + PRICING.aralikYuzde))];
  }
  function renderPrice() {
    const el = $("#priceVal");
    if (!el) return;
    const [lo, hi] = priceRange();
    el.textContent = `${fmt(lo)} – ${fmt(hi)} ₺`;
  }

  /* ============================================================ özet */
  function flavorName(k) { const f = FLAVORS.find((x) => x.key === k); return f ? f.name.toLowerCase() : k; }
  function summaryParts() {
    const p = [];
    p.push(`${state.layers} katlı`);
    p.push(SHAPE_LABEL[state.shape]);
    let cc = `${state.colorName.toLowerCase()} ${COATING_LABEL[state.coating]}`;
    if (state.colorMode === "ombre") cc += " (ombre)";
    if (state.colorMode === "marble") cc += " (mermer)";
    p.push(cc);
    if (state.drip) p.push(DRIP_LABEL[state.drip]);
    if (state.flowers) p.push("şeker çiçekleri");
    if (state.fruit) p.push("taze meyve");
    if (state.macaron) p.push("makaron");
    if (state.leaf) p.push(state.leaf === "gold" ? "altın yaprak" : "gümüş yaprak");
    if (state.pearls) p.push("inci boncuk");
    if (state.ganache) p.push("ganaj");
    if (state.text.trim()) p.push(`“${state.text.trim()}” yazılı`);
    if (state.topper === "number") p.push(`${state.topperValue || "?"} rakam mumu`);
    if (state.topper === "mutlu") p.push("“Mutlu Yıllar” topper");
    if (state.topper === "name") p.push(`“${state.topperValue || "isim"}” topper`);
    if (state.topper === "heart") p.push("kalp topper");
    if (state.candles > 0) p.push(`${state.candles} mum`);
    const fl = state.flavors.slice(0, state.layers);
    if (state.layers === 1) p.push(`${flavorName(fl[0])} kat`);
    else if (state.layers === 2) p.push(`alt kat ${flavorName(fl[0])}, üst kat ${flavorName(fl[1])}`);
    else p.push(`alt ${flavorName(fl[0])}, orta ${flavorName(fl[1])}, üst ${flavorName(fl[2])}`);
    p.push(SIZE_LABEL[state.size]);
    return p;
  }
  function renderSummary() {
    $("#summaryText").textContent = summaryParts().join(" · ");
  }

  /* ============================================================ commit */
  let deb = null;
  function commit() { renderPrice(); renderSummary(); renderBg(); update3d(); }
  function commitDebounced() {
    renderPrice(); renderSummary();
    clearTimeout(deb);
    deb = setTimeout(update3d, 350);
  }

  /* ============================================================ şablonlar */
  function renderTemplates() {
    const row = $("#tplRow");
    TEMPLATES.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "atl-tpl";
      b.innerHTML = `<span class="tpl-chip" style="background:${t.chip}"></span><span class="tpl-name">${t.name}</span>`;
      b.addEventListener("click", () => {
        Object.assign(state, JSON.parse(JSON.stringify(t.st)));
        const col = COLORS.find((c) => c.hex === state.color);
        state.colorName = col ? col.name : "Özel";
        while (state.flavors.length < 3) state.flavors.push("vanilya");
        $$(".atl-tpl", row).forEach((x) => x.classList.toggle("sel", x === b));
        renderControls(); commit();
      });
      row.appendChild(b);
    });
  }

  /* ============================================================ zar 🎲 */
  function rollDice() {
    const combo = DICE_COMBOS[(Math.random() * DICE_COMBOS.length) | 0];
    const col = COLORS[(Math.random() * (COLORS.length - 1)) | 0]; // çikolata rengi hariç
    Object.assign(state, { drip: null, flowers: false, fruit: false, macaron: false, pearls: false, ganache: false, leaf: null });
    Object.assign(state, combo);
    state.color = col.hex; state.colorName = col.name;
    state.layers = [1, 2, 2, 2, 3][(Math.random() * 5) | 0];
    state.shape = ["round", "round", "round", "square", "heart"][(Math.random() * 5) | 0];
    while (state.flavors.length < 3) state.flavors.push("vanilya");
    $$(".atl-tpl").forEach((x) => x.classList.remove("sel"));
    const btn = $("#diceBtn");
    btn.classList.remove("spin"); void btn.offsetWidth; btn.classList.add("spin");
    renderControls(); commit();
  }

  /* ============================================================ dilim */
  function syncSliceBtns() {
    const open = booted && window.Atelier3D && Atelier3D.supported && Atelier3D.isSliceOpen();
    $$(".slice-toggle").forEach((b) => b.classList.toggle("on", open));
  }
  function toggleSlice() {
    if (!booted || !window.Atelier3D || !Atelier3D.supported) return;
    Atelier3D.toggleSlice(!Atelier3D.isSliceOpen());
    syncSliceBtns();
  }

  /* ============================================================ WhatsApp + PNG + gerçek pasta */
  function waMessage() {
    return (
      `Merhaba Pastacihanı 🎂 Pasta Atölyesi'nde bu tasarımı oluşturdum:\n\n` +
      `${summaryParts().join(" · ")}\n\n` +
      `Fiyat, tarih ve teslimat için bilgi alabilir miyim?`
    );
  }
  function roundRectPath(x, rx, ry, w, h, r) {
    x.beginPath(); x.moveTo(rx + r, ry);
    x.arcTo(rx + w, ry, rx + w, ry + h, r); x.arcTo(rx + w, ry + h, rx, ry + h, r);
    x.arcTo(rx, ry + h, rx, ry, r); x.arcTo(rx, ry, rx + w, ry, r); x.closePath();
  }
  function downloadDesign() {
    if (!booted || !window.Atelier3D || !Atelier3D.supported) return;
    const cakeURL = Atelier3D.snapshot(1200);
    const draw = () => {
      const W = 1080, H = 1420, x = document.createElement("canvas").getContext("2d");
      x.canvas.width = W; x.canvas.height = H;
      const bg = x.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, hexMix(state.color, "#FFFDFA", 0.85));
      bg.addColorStop(1, hexMix(state.color, "#F0E4D5", 0.55));
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      x.textAlign = "center";
      x.fillStyle = "#B0697F"; x.font = "600 26px Jost, sans-serif";
      x.fillText("P A S T A   A T Ö L Y E S İ", W / 2, 88);
      x.fillStyle = "#2A1E22"; x.font = "600 74px 'Cormorant Garamond', Georgia, serif";
      x.fillText("Pastacihanı", W / 2, 168);
      x.strokeStyle = "#C2A062"; x.lineWidth = 2;
      x.beginPath(); x.moveTo(W / 2 - 64, 196); x.lineTo(W / 2 + 64, 196); x.stroke();
      const sx = 90, sy = 232, sw = W - 180, sh = 690;
      roundRectPath(x, sx, sy, sw, sh, 28);
      x.fillStyle = "#FFFDFA"; x.fill();
      x.strokeStyle = "rgba(194,160,98,.5)"; x.lineWidth = 2; x.stroke();
      const finish = () => {
        const parts = summaryParts();
        x.fillStyle = "#2A1E22"; x.font = "500 38px 'Cormorant Garamond', Georgia, serif";
        /* özet — satırlara böl */
        const lines = [];
        let line = "";
        parts.forEach((p) => {
          const tryLine = line ? line + " · " + p : p;
          if (x.measureText(tryLine).width > W - 200) { lines.push(line); line = p; }
          else line = tryLine;
        });
        if (line) lines.push(line);
        lines.slice(0, 4).forEach((l, i) => x.fillText(l, W / 2, 990 + i * 52));
        x.fillStyle = "#934F66"; x.font = "italic 600 35px 'Cormorant Garamond', Georgia, serif";
        x.fillText("Hayalinizdeki tasarım hazır", W / 2, 1248);
        x.fillStyle = "#6E5C61"; x.font = "500 24px Jost, sans-serif";
        x.fillText("Sipariş ve detaylar için WhatsApp'tan yazın", W / 2, 1292);
        x.fillText("0554 810 6301 · İstanbul Silivri · pastacihanı.com", W / 2, H - 50);
        const a = document.createElement("a");
        a.href = x.canvas.toDataURL("image/png");
        a.download = "pastacihani-tasarimim.png";
        document.body.appendChild(a); a.click(); a.remove();
      };
      const img = new Image();
      img.onload = () => { const s = Math.min(sw - 20, sh - 20); x.drawImage(img, W / 2 - s / 2, sy + sh / 2 - s / 2, s, s); finish(); };
      img.onerror = finish;
      img.src = cakeURL;
    };
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw); else draw();
  }

  function snapshotAsJpeg() {
    const size = 768;
    const source = Atelier3D.snapshot(size);
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = size; canvas.height = size;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#FBF4EC"; ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = () => reject(new Error("Tasarım görüntüsü alınamadı"));
      img.src = source;
    });
  }

  function setRealCakeLoading() {
    $("#realCakeTitle").textContent = "Tasarımın gerçek pastaya dönüşüyor";
    $("#realCakeStatus").style.display = "grid";
    $("#realCakeStatus").innerHTML = '<div><div class="real-spinner"></div><p>Katları, renkleri ve süslemeleri koruyarak hazırlıyoruz. Genellikle 20–60 saniye sürer; bu pencereyi açık tutabilirsiniz.</p></div>';
    $("#realCakeResult").classList.remove("show");
  }

  function wait(ms, signal) {
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        window.clearTimeout(timer);
        reject(new DOMException("İstek zaman aşımına uğradı", "AbortError"));
      };
      const timer = window.setTimeout(() => {
        signal.removeEventListener("abort", onAbort);
        resolve();
      }, ms);
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  async function waitForRealCake(jobId, signal) {
    while (!signal.aborted) {
      const res = await fetch(`/api/realistic-cake-status?id=${encodeURIComponent(jobId)}`, {
        headers: { "Accept": "application/json" },
        signal
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Görsel durumu alınamadı. Lütfen tekrar deneyin.");
      if (data.status === "completed" && data.imageUrl) return data.imageUrl;
      if (data.status === "failed") throw new Error(data.error || "Görsel üretilemedi. Lütfen tekrar deneyin.");
      await wait(2500, signal);
    }
    throw new DOMException("İstek zaman aşımına uğradı", "AbortError");
  }

  async function createRealCake() {
    if (!booted || !window.Atelier3D || !Atelier3D.supported) return;
    const btn = $("#realCakeBtn");
    btn.disabled = true;
    setRealCakeLoading();
    $("#realCakeModal").classList.add("open");
    document.body.style.overflow = "hidden";
    const controller = new AbortController();
    const requestTimeout = window.setTimeout(() => controller.abort(), 165_000);
    try {
      const imageDataUrl = await snapshotAsJpeg();
      const res = await fetch("/api/realistic-cake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, designSummary: summaryParts().join(" · ") }),
        signal: controller.signal
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.jobId) {
        if (res.status === 429) throw new Error("Yeni bir görsel için lütfen bir dakika bekleyin.");
        throw new Error(data.error || "Görsel üretilemedi. Lütfen tekrar deneyin.");
      }
      const imageUrl = await waitForRealCake(data.jobId, controller.signal);
      $("#realCakeStatus").style.display = "none";
      $("#realCakeTitle").textContent = "Gerçek pasta önizlemen hazır";
      $("#realCakeImage").src = imageUrl;
      $("#realCakeDownload").href = imageUrl;
      $("#realCakeOrder").href = waURL(
        `${waMessage()}\n\nGerçek pasta önizlemesi: ${imageUrl}`
      );
      $("#realCakeResult").classList.add("show");
    } catch (error) {
      $("#realCakeTitle").textContent = "Görsel hazırlanamadı";
      $("#realCakeStatus").style.display = "grid";
      const message = error?.name === "AbortError"
        ? "Görsel üretimi beklenenden uzun sürdü. Lütfen tekrar deneyin."
        : (error.message || "Bir hata oluştu");
      $("#realCakeStatus").innerHTML = `<div><p>${String(message).replace(/[<>]/g, "")}</p><button type="button" class="btn-ghost" id="realCakeRetry">Tekrar Dene</button></div>`;
      $("#realCakeRetry").addEventListener("click", createRealCake);
    } finally {
      window.clearTimeout(requestTimeout);
      btn.disabled = false;
    }
  }

  function closeRealCake() {
    $("#realCakeModal").classList.remove("open");
    document.body.style.overflow = "";
  }

  /* ============================================================ sekmeler */
  function initTabs() {
    const tabs = $$(".atl-tab-btn");
    tabs.forEach((t) => t.addEventListener("click", () => {
      tabs.forEach((x) => x.classList.toggle("sel", x === t));
      $$(".atl-pane").forEach((p) => {
        const on = p.dataset.pane === t.dataset.tab;
        p.classList.toggle("show", on);
        p.classList.remove("pane-enter");
        if (on) { void p.offsetWidth; p.classList.add("pane-enter"); setTimeout(() => p.classList.remove("pane-enter"), 420); }
      });
    }));
  }

  /* ============================================================ olaylar */
  function initEvents() {
    $("#inpText").addEventListener("input", (e) => {
      state.text = e.target.value.slice(0, 25);
      $("#txtCount").textContent = `${state.text.length}/25`;
      commitDebounced();
    });
    $("#candleMinus").addEventListener("click", () => { state.candles = Math.max(0, state.candles - 1); $("#candleVal").textContent = state.candles; commit(); });
    $("#candlePlus").addEventListener("click", () => { state.candles = Math.min(12, state.candles + 1); $("#candleVal").textContent = state.candles; commit(); });
    $("#diceBtn").addEventListener("click", rollDice);
    $$(".slice-toggle").forEach((b) => b.addEventListener("click", toggleSlice));
    $("#waBtn").addEventListener("click", () => {
      window.open(waURL(waMessage()), "_blank", "noopener");
    });
    $("#pngBtn").addEventListener("click", downloadDesign);
    $("#realCakeBtn").addEventListener("click", createRealCake);
    $("#realCakeClose").addEventListener("click", closeRealCake);
    $("#realCakeModal").addEventListener("click", (e) => { if (e.target === e.currentTarget) closeRealCake(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeRealCake(); });
  }

  /* ============================================================ başlat */
  initTabs();
  renderTemplates();
  renderControls();
  renderPrice();
  renderSummary();
  renderBg();
  initEvents();

  /* 3D tembel başlangıç: sayfa çizildikten sonra */
  if (document.readyState === "complete") setTimeout(boot, 60);
  else window.addEventListener("load", () => setTimeout(boot, 60));
})();
