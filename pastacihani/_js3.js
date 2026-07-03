/* ============================================================
   Pastacihanı — Yeni Özellikler (features.js)
   Arama · Sihirbaz · SSS · Preloader · WhatsApp balonu
   app.js'in window.PC API'sini kullanır.
   ============================================================ */
(function () {
  "use strict";
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => [...(c || document).querySelectorAll(s)];
  const PC = window.PC || {};
  const waURL = PC.waURL || ((t) => `https://wa.me/${typeof WA_NUMBER !== "undefined" ? WA_NUMBER : "905548106301"}?text=${encodeURIComponent(t)}`);

  /* Türkçe duyarsız normalize */
  function norm(s) {
    return (s || "")
      .toString()
      .replace(/[İI]/g, "i").replace(/ı/g, "i")
      .replace(/[Şş]/g, "s").replace(/[Ğğ]/g, "g")
      .replace(/[Üü]/g, "u").replace(/[Öö]/g, "o").replace(/[Çç]/g, "c")
      .replace(/[Ââ]/g, "a")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  /* ============================================================ PRELOADER */
  (function preloader() {
    const pl = $("#preloader");
    if (!pl) return;
    const start = Date.now();
    const MIN = 900;
    let hidden = false;
    function kill() { pl.style.display = "none"; }
    function hide() {
      if (hidden) return; hidden = true;
      const wait = Math.max(0, MIN - (Date.now() - start));
      setTimeout(() => {
        pl.classList.add("done");
        // Sağlam temizlik: fade biter bitmez gizle. Sekme arka plandaysa
        // CSS transition'ı donar ve "transitionend" hiç gelmez; bu yüzden
        // setTimeout ile (gizli sekmede bile çalışır) display:none'a zorla.
        pl.addEventListener("transitionend", kill, { once: true });
        setTimeout(kill, 900);
      }, wait);
    }
    if (document.readyState === "complete") hide();
    else window.addEventListener("load", hide);
    // güvenlik ağı: yük olayı gelmese bile kapat + ilk etkileşimde kapat
    setTimeout(hide, 2000);
    ["scroll", "pointerdown", "keydown", "touchstart"].forEach((ev) =>
      window.addEventListener(ev, hide, { once: true, passive: true })
    );
  })();

  /* ============================================================ ARAMA */
  (function search() {
    const input = $("#searchInput");
    const bar = $("#searchBar");
    const clearBtn = $("#searchClear");
    const view = $("#searchView");
    const grid = $("#searchGrid");
    const meta = $("#searchMeta");
    const empty = $("#searchEmpty");
    const catDefault = $("#catDefault");
    const productsView = $("#productsView");
    if (!input || typeof ALL_PRODUCTS === "undefined" || !PC.buildProductCard) return;

    // arama indeksini önceden hazırla
    const index = ALL_PRODUCTS.map((p) => ({
      p,
      hay: norm(`${p.code} ${p.name} ${p.catName} ${p.desc} ${p.tags.join(" ")}`),
    }));

    function exitSearch() {
      view.classList.remove("active");
      catDefault.classList.remove("hidden");
      productsView.classList.remove("active");
    }

    function wireCard(card, p) {
      const media = card.querySelector(".prod-media");
      if (media) media.addEventListener("click", () => PC.openLightbox([{ img: p.img, title: `${p.code} · ${p.name}` }], 0));
    }

    function run(qRaw) {
      const q = norm(qRaw);
      bar.classList.toggle("has-text", qRaw.length > 0);
      if (!q) { exitSearch(); return; }

      catDefault.classList.add("hidden");
      productsView.classList.remove("active");
      view.classList.add("active");

      const terms = q.split(" ").filter(Boolean);
      const matches = index.filter((it) => terms.every((t) => it.hay.includes(t))).map((it) => it.p);

      grid.innerHTML = "";
      if (matches.length === 0) {
        grid.style.display = "none";
        meta.style.display = "none";
        empty.style.display = "block";
        return;
      }
      empty.style.display = "none";
      grid.style.display = "";
      meta.style.display = "";
      meta.innerHTML = `<strong>"${qRaw.trim()}"</strong> için ${matches.length} sonuç`;
      matches.slice(0, 60).forEach((p, i) => {
        const card = PC.buildProductCard(p, i);
        wireCard(card, p);
        grid.appendChild(card);
      });
    }

    let deb;
    input.addEventListener("input", () => { clearTimeout(deb); deb = setTimeout(() => run(input.value), 90); });
    clearBtn.addEventListener("click", () => { input.value = ""; bar.classList.remove("has-text"); exitSearch(); input.focus(); });
    input.addEventListener("keydown", (e) => { if (e.key === "Escape") { input.value = ""; bar.classList.remove("has-text"); exitSearch(); } });
  })();

  /* ============================================================ SİHİRBAZ */
  (function wizard() {
    const wiz = $("#wizard");
    if (!wiz || typeof ALL_PRODUCTS === "undefined" || !PC.buildProductCard) return;
    const steps = $$(".wiz-step", wiz);
    const dots = $$(".wiz-dot", wiz);
    const nav = $("#wizNav");
    const nextBtn = $("#wizNext");
    const backBtn = $("#wizBack");
    const peopleInput = $("#wizPeople");
    const results = $("#wizResults");
    const summary = $("#wizSummary");
    const waBtn = $("#wizWa");
    const galBtn = $("#wizGallery");

    // Galeri kategorileriyle eşleşir (galeri.html CATS) — slug'lar /galeri?kat= ile birebir
    const CAT_NAMES = { dogumgunu: "Doğum Günü", nisan: "Nişan", soz: "Söz", dugun: "Düğün", babyshower: "Baby Shower", yildonumu: "Yıldönümü" };
    const state = { day: "", people: 10, cat: "", catName: "" };
    let step = 1;

    function setStep(n) {
      step = n;
      steps.forEach((s) => s.classList.toggle("active", +s.dataset.step === n));
      dots.forEach((d) => {
        const dn = +d.dataset.step;
        d.classList.toggle("active", dn === n);
        d.classList.toggle("done", dn < n);
      });
      backBtn.classList.toggle("hidden", n === 1);
      nav.style.display = n === 4 ? "none" : "flex";
      nextBtn.textContent = n === 3 ? "Sonuçları Gör" : "Devam";
      refreshNext();
    }
    function canAdvance() {
      if (step === 1) return !!state.day;
      if (step === 2) return !!state.people;
      if (step === 3) return !!state.cat;
      return true;
    }
    function refreshNext() {
      const ok = canAdvance();
      nextBtn.style.opacity = ok ? "1" : ".45";
      nextBtn.style.pointerEvents = ok ? "auto" : "none";
    }

    // adım 1 — gün
    $$("#wizDay .wiz-opt").forEach((b) => b.addEventListener("click", () => {
      state.day = b.dataset.val;
      $$("#wizDay .wiz-opt").forEach((x) => x.classList.toggle("sel", x === b));
      refreshNext();
    }));

    // "Acil Teslimat" butonu → sihirbaza getir + bugünü ACİL olarak seç
    const acilBtn = document.getElementById("acilBtn");
    if (acilBtn) acilBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const sec = document.getElementById("sihirbaz");
      if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      const bugun = $('#wizDay .wiz-opt[data-val="Bugün"]');
      $$("#wizDay .wiz-opt").forEach((x) => x.classList.toggle("sel", x === bugun));
      state.day = "Bugün — ACİL ⚡";
      setStep(1);
      refreshNext();
    });
    // adım 2 — kişi
    const KMIN = 1, KMAX = 500;
    function setPeople(v) {
      let n = parseInt(v, 10); if (isNaN(n)) n = 10;
      n = Math.max(KMIN, Math.min(KMAX, n));
      state.people = n; peopleInput.value = n; refreshNext();
    }
    peopleInput.addEventListener("input", () => { const n = parseInt(peopleInput.value, 10); state.people = isNaN(n) ? "" : n; refreshNext(); });
    peopleInput.addEventListener("blur", () => setPeople(peopleInput.value));
    $("#wizMinus").addEventListener("click", () => setPeople((parseInt(peopleInput.value, 10) || 10) - 1));
    $("#wizPlus").addEventListener("click", () => setPeople((parseInt(peopleInput.value, 10) || 10) + 1));
    // adım 3 — tür
    $$("#wizType .wiz-chip").forEach((b) => b.addEventListener("click", () => {
      state.cat = b.dataset.cat; state.catName = CAT_NAMES[b.dataset.cat] || b.textContent;
      $$("#wizType .wiz-chip").forEach((x) => x.classList.toggle("sel", x === b));
      refreshNext();
    }));

    function buildResults() {
      // ALL_PRODUCTS kartları kaldırıldı — sadece Cloudinary galeri göster
      results.innerHTML = "";
      results.style.display = "none";
      summary.textContent = `${state.day} · ${state.people} kişilik · ${state.catName}`;
      // Galeriyle eşli çalışma: seçilen kategoriyi galeride aç
      if (galBtn) {
        galBtn.href = `/galeri?kat=${encodeURIComponent(state.cat)}`;
        galBtn.textContent = `Galeride ${state.catName} Tasarımları`;
      }
      const msg = `Merhaba Pastacihanı 🎂 Hızlı sipariş tercihlerim:\n• Tarih: ${state.day}\n• Kişi: ${state.people} kişilik\n• Tür: ${state.catName}\nUygun seçenekler için bilgi alabilir miyim?`;
      waBtn.href = waURL(msg);

      // Galeriden örnekler (Cloudinary) — seçilen kategoriye göre 10 görsel
      renderGalleryStrip(state.cat);
    }

    // ---- Sihirbaz galeri şeridi: Cloudinary'den seçili kategori örnekleri ----
    const CLOUD = "do7gjdvb0";
    const strip = $("#wizGalleryStrip");
    const stripGrid = $("#wizGalleryGrid");
    const stripMore = $("#wizGalleryMore");
    const stripCache = {};
    function cldThumb(r) { return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_300,c_fill,ar_1:1/v${r.version}/${r.public_id}.${r.format}`; }
    function cldBig(r) { return `https://res.cloudinary.com/${CLOUD}/image/upload/f_auto,q_auto,w_1300/v${r.version}/${r.public_id}.${r.format}`; }

    function renderGalleryStrip(slug) {
      if (!strip || !stripGrid) return;
      const galHref = `/galeri?kat=${encodeURIComponent(slug)}`;
      if (stripMore) stripMore.href = galHref;
      strip.hidden = false;
      // iskelet
      stripGrid.innerHTML = "";
      for (let i = 0; i < 10; i++) { const s = document.createElement("div"); s.className = "wg-skel"; stripGrid.appendChild(s); }

      const done = (resources) => {
        stripGrid.innerHTML = "";
        const pics = (resources || []).slice(0, 9);
        if (!pics.length) { strip.hidden = true; return; }
        const lbItems = pics.map((r) => ({ img: cldBig(r), title: CAT_NAMES[slug] || "Pastacihanı" }));
        pics.forEach((r, i) => {
          const cell = document.createElement("button");
          cell.type = "button"; cell.className = "wg-cell";
          cell.innerHTML = `<img loading="lazy" decoding="async" alt="${(CAT_NAMES[slug] || "Pasta")} örneği" src="${cldThumb(r)}">`;
          cell.addEventListener("click", () => { if (PC.openLightbox) PC.openLightbox(lbItems, i); });
          stripGrid.appendChild(cell);
        });
      };

      if (stripCache[slug]) { done(stripCache[slug]); return; }
      fetch(`https://res.cloudinary.com/${CLOUD}/image/list/${slug}.json?ts=` + Date.now())
        .then((r) => (r.ok ? r.json() : { resources: [] }))
        .then((d) => {
          const list = (d.resources || []).sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
          stripCache[slug] = list;
          done(list);
        })
        .catch(() => { strip.hidden = true; });
    }

    nextBtn.addEventListener("click", () => {
      if (!canAdvance()) return;
      if (step === 3) { buildResults(); setStep(4); }
      else setStep(step + 1);
    });
    backBtn.addEventListener("click", () => { if (step > 1) setStep(step - 1); });
    $("#wizRestart").addEventListener("click", () => {
      state.day = ""; state.cat = ""; state.catName = ""; state.people = 10;
      peopleInput.value = 10;
      $$("#wizDay .wiz-opt, #wizType .wiz-chip").forEach((x) => x.classList.remove("sel"));
      if (strip) strip.hidden = true;
      setStep(1);
    });

    setStep(1);
  })();

  /* ============================================================ SSS — Akordeon */
  (function faq() {
    const wrap = $("#faqWrap");
    if (!wrap || typeof FAQS === "undefined") return;
    FAQS.forEach((f, i) => {
      const item = document.createElement("div");
      item.className = "faq-item";
      item.innerHTML = `
        <button class="faq-q" aria-expanded="false">
          <h4>${f.q}</h4>
          <span class="faq-ic"></span>
        </button>
        <div class="faq-a"><div class="faq-a-in">${f.a}</div></div>`;
      const btn = item.querySelector(".faq-q");
      const ans = item.querySelector(".faq-a");
      btn.addEventListener("click", () => {
        const open = item.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        ans.style.maxHeight = open ? ans.scrollHeight + "px" : "0px";
        // başka açık olanları kapat (akordeon)
        $$(".faq-item.open", wrap).forEach((other) => {
          if (other !== item) {
            other.classList.remove("open");
            other.querySelector(".faq-q").setAttribute("aria-expanded", "false");
            other.querySelector(".faq-a").style.maxHeight = "0px";
          }
        });
      });
      wrap.appendChild(item);
    });
    window.addEventListener("resize", () => {
      const open = $(".faq-item.open .faq-a", wrap);
      if (open) open.style.maxHeight = open.scrollHeight + "px";
    });
  })();

  /* ============================================================ WHATSAPP BALONU */
  (function waBubble() {
    const bubble = $("#waBubble");
    const titleEl = $("#waBubbleTitle");
    const subEl = $("#waBubbleSub");
    const closeBtn = $("#waBubbleClose");
    if (!bubble) return;
    const msgs = [
      { t: "Online — şu an aktifiz", s: "Genelde 5 dakikada yanıt veriyoruz 🎂" },
      { t: "Pastanızı birlikte tasarlayalım", s: "WhatsApp'tan yazın, hemen yardımcı olalım." },
      { t: "Bugüne özel sipariş?", s: "Dilim pastalarda aynı gün teslimat ⚡" },
    ];
    let i = 0, dismissed = false, timer;
    function show() {
      if (dismissed) return;
      titleEl.textContent = msgs[i].t;
      subEl.textContent = msgs[i].s;
      bubble.classList.add("show");
      timer = setTimeout(() => {
        bubble.classList.remove("show");
        i = (i + 1) % msgs.length;
        timer = setTimeout(show, 9000);
      }, 6000);
    }
    closeBtn.addEventListener("click", (e) => {
      e.preventDefault(); e.stopPropagation();
      dismissed = true; clearTimeout(timer); bubble.classList.remove("show");
    });
    setTimeout(show, 3600);
  })();
})();
