/* ============================================================
   Pastacihanı — Atölye 3D parça kütüphanesi
   Saf THREE fabrikaları: süslemeler, mumlar, topperlar, yazı.
   atelier3d.js tarafından kullanılır.
   ============================================================ */
window.AtelierParts = (function () {
  "use strict";
  if (typeof THREE === "undefined") return null;

  /* renkler doğru (linear) uzayda — koyu tonlar soluklaşmaz */
  const C = (h) => new THREE.Color(h).convertSRGBToLinear();
  function lighten(hex, amt) {
    const o = {}; new THREE.Color(hex).getHSL(o);
    return new THREE.Color().setHSL(o.h, Math.max(0, o.s - amt * 0.4), Math.min(1, o.l + amt)).convertSRGBToLinear();
  }

  /* ---- paylaşılan geometriler ---- */
  const dropletGeo = new THREE.SphereGeometry(1, 14, 12);
  const sprinkleGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.065, 5);
  const leafGeo = new THREE.PlaneGeometry(0.1, 0.13);
  const SHARED_GEOS = new Set([dropletGeo, sprinkleGeo, leafGeo]);

  /* ---- paylaşılan malzemeler ---- */
  const pearlMat = new THREE.MeshPhysicalMaterial({ color: C("#fff6ee"), metalness: 0.7, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.3 });
  const flameMat = new THREE.MeshStandardMaterial({ color: C("#ffd27a"), emissive: C("#ff8a1e"), emissiveIntensity: 2.6, roughness: 0.3 });
  const goldMat = new THREE.MeshStandardMaterial({ color: C("#cfa75e"), metalness: 1, roughness: 0.24, side: THREE.DoubleSide, envMapIntensity: 1.5 });
  const silverMat = new THREE.MeshStandardMaterial({ color: C("#cdd2d8"), metalness: 1, roughness: 0.2, side: THREE.DoubleSide, envMapIntensity: 1.6 });
  const leafMatG = new THREE.MeshStandardMaterial({ color: C("#3f7d3a"), roughness: 0.5 });
  const stickMat = new THREE.MeshStandardMaterial({ color: C("#e8dcc8"), roughness: 0.55 });
  const wickMat = new THREE.MeshStandardMaterial({ color: C("#3a2a22") });
  const SHARED_MATS = new Set([pearlMat, flameMat, goldMat, silverMat, leafMatG, stickMat, wickMat]);

  /* ============================ SÜSLEMELER ============================ */
  function makePearl(s) {
    const m = new THREE.Mesh(dropletGeo, pearlMat);
    m.scale.setScalar(s); m.castShadow = true; return m;
  }

  function makeRose(petalHex, scale) {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: C(petalHex), roughness: 0.44, clearcoat: 0.3, clearcoatRoughness: 0.4, envMapIntensity: 0.6 });
    const bud = new THREE.Mesh(dropletGeo, mat); bud.scale.setScalar(0.05); bud.position.y = 0.04; g.add(bud);
    [{ r: 0.07, c: 5, s: 0.075, tilt: 0.5 }, { r: 0.13, c: 8, s: 0.092, tilt: 0.9 }].forEach((ring) => {
      for (let i = 0; i < ring.c; i++) {
        const a = (i / ring.c) * Math.PI * 2 + ring.r * 4;
        const petal = new THREE.Mesh(dropletGeo, mat);
        petal.scale.set(ring.s, ring.s * 0.4, ring.s * 1.55);
        petal.position.set(Math.cos(a) * ring.r, 0.03, Math.sin(a) * ring.r);
        petal.rotation.y = -a; petal.rotation.x = ring.tilt; petal.castShadow = true; g.add(petal);
      }
    });
    g.scale.setScalar(scale || 1);
    return g;
  }

  function makeMacaron(hex) {
    const g = new THREE.Group();
    const shell = new THREE.MeshPhysicalMaterial({ color: C(hex), roughness: 0.5, clearcoat: 0.25, envMapIntensity: 0.5 });
    const dome = new THREE.SphereGeometry(0.1, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const top = new THREE.Mesh(dome, shell); top.scale.y = 0.7; top.position.y = 0.05; top.castShadow = true; g.add(top);
    const bot = new THREE.Mesh(dome, shell); bot.scale.y = 0.7; bot.rotation.x = Math.PI; bot.position.y = 0.02; bot.castShadow = true; g.add(bot);
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.092, 0.092, 0.04, 18), new THREE.MeshStandardMaterial({ color: lighten(hex, 0.18), roughness: 0.6 }));
    fill.position.y = 0.035; g.add(fill);
    g.rotation.z = Math.PI / 2;
    return g;
  }

  function makeStrawberry() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.17, 16), new THREE.MeshPhysicalMaterial({ color: C("#c61f33"), roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.9 }));
    body.position.y = 0.085; body.castShadow = true; g.add(body);
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.04, 6), leafMatG); leaf.position.y = 0.17; g.add(leaf);
    return g;
  }
  function makeBlackberry() {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: C("#2d2438"), roughness: 0.34, clearcoat: 0.55, envMapIntensity: 0.9 });
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(dropletGeo, mat);
      b.scale.setScalar(0.032);
      const a = (i / 6) * Math.PI * 2;
      if (i === 6) b.position.set(0, 0.085, 0);
      else b.position.set(Math.cos(a) * 0.038, 0.05, Math.sin(a) * 0.038);
      b.castShadow = true; g.add(b);
    }
    return g;
  }
  function fruitCluster(seed) {
    const g = new THREE.Group();
    g.add(makeStrawberry());
    const bb = makeBlackberry(); bb.position.set(0.13, 0, 0.04); g.add(bb);
    if (seed % 2 === 0) { const s2 = makeStrawberry(); s2.scale.setScalar(0.82); s2.position.set(-0.11, 0, 0.08); s2.rotation.y = 1.4; g.add(s2); }
    else { const b2 = makeBlackberry(); b2.position.set(-0.1, 0, -0.07); g.add(b2); }
    return g;
  }

  function scatterLeaf(group, area, count, y, metal) {
    const mat = metal === "silver" ? silverMat : goldMat;
    for (let i = 0; i < count; i++) {
      const f = new THREE.Mesh(leafGeo, mat);
      const a = Math.random() * Math.PI * 2, r = Math.sqrt(Math.random()) * area;
      f.position.set(Math.cos(a) * r, y + 0.02, Math.sin(a) * r);
      f.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
      f.scale.setScalar(0.6 + Math.random() * 0.7); f.castShadow = true; group.add(f);
    }
  }

  /* ganaj rozeti: kıvrımlı koyu çikolata sıkması */
  function makeGanacheSwirl(hex) {
    const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({ color: C(hex || "#3a2014"), roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.18, envMapIntensity: 1.1 });
    [[0.085, 0], [0.062, 0.052], [0.038, 0.095]].forEach(([s, y]) => {
      const b = new THREE.Mesh(dropletGeo, mat);
      b.scale.set(s, s * 0.72, s); b.position.y = y + s * 0.5; b.castShadow = true; g.add(b);
    });
    return g;
  }

  /* ============================ MUMLAR ============================ */
  /* klasik ince mum — flame referansı döner (titreşim animasyonu için) */
  function makeCandle(colorHex, h) {
    h = h || 0.52;
    const g = new THREE.Group();
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.043, h, 14),
      new THREE.MeshPhysicalMaterial({ color: C(colorHex), roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.25, envMapIntensity: 0.7 }));
    c.position.y = h / 2; c.castShadow = true; g.add(c);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.04, 6), wickMat);
    w.position.y = h + 0.02; g.add(w);
    const f = new THREE.Mesh(dropletGeo, flameMat);
    f.scale.set(0.058, 0.12, 0.058); f.position.y = h + 0.08; g.add(f);
    g.userData.flame = f;
    return g;
  }

  /* rakam mum — şerit desenli rakam levhası + çubuk + alev */
  function makeNumberCandle(digits, accentHex) {
    digits = String(digits || "1").slice(0, 2);
    const fs = 300, pad = 30;
    const meas = document.createElement("canvas").getContext("2d");
    meas.font = `800 ${fs}px Jost, Futura, sans-serif`;
    const tw = meas.measureText(digits).width;
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(tw + pad * 2); cv.height = fs + pad * 2;
    const x = cv.getContext("2d");
    const accent = accentHex || "#e0879f";
    const grad = x.createLinearGradient(0, 0, cv.width, cv.height);
    grad.addColorStop(0, accent); grad.addColorStop(1, "#d9a8b6");
    x.font = `800 ${fs}px Jost, Futura, sans-serif`;
    x.textAlign = "center"; x.textBaseline = "middle";
    x.lineJoin = "round";
    x.strokeStyle = "#6e4a52"; x.lineWidth = 18;
    x.strokeText(digits, cv.width / 2, cv.height / 2 + 10);
    x.fillStyle = grad;
    x.fillText(digits, cv.width / 2, cv.height / 2 + 10);
    x.save();
    x.globalCompositeOperation = "source-atop";
    x.strokeStyle = "rgba(255,255,255,0.55)"; x.lineWidth = 14;
    for (let d = -cv.height; d < cv.width + cv.height; d += 52) {
      x.beginPath(); x.moveTo(d, 0); x.lineTo(d + cv.height, cv.height); x.stroke();
    }
    x.restore();
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 8; tex.encoding = THREE.sRGBEncoding;
    const H = 0.56, W = H * (cv.width / cv.height);
    const g = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.22, 8), stickMat);
    stick.position.y = 0.1; g.add(stick);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(W, H),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.5, side: THREE.DoubleSide, alphaTest: 0.08 }));
    plate.position.y = 0.2 + H / 2; plate.castShadow = true; g.add(plate);
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.05, 6), wickMat);
    w.position.y = 0.2 + H + 0.02; g.add(w);
    const f = new THREE.Mesh(dropletGeo, flameMat);
    f.scale.set(0.05, 0.1, 0.05); f.position.y = 0.2 + H + 0.08; g.add(f);
    g.userData.flame = f;
    return g;
  }

  /* el yazısı altın topper ("Mutlu Yıllar" / isim) — iki çubuk üstünde */
  function makeScriptTopper(text, topR) {
    text = (text || "").slice(0, 18);
    const fs = 150, pad = 60;
    const meas = document.createElement("canvas").getContext("2d");
    const fontStr = `700 ${fs}px 'Caveat', 'Segoe Script', cursive`;
    meas.font = fontStr;
    const tw = Math.max(220, meas.measureText(text).width);
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(tw + pad * 2); cv.height = fs + pad * 2;
    const x = cv.getContext("2d");
    x.font = fontStr; x.textAlign = "center"; x.textBaseline = "middle";
    const grad = x.createLinearGradient(0, pad, 0, cv.height - pad);
    grad.addColorStop(0, "#e9cf92"); grad.addColorStop(0.5, "#c2a062"); grad.addColorStop(1, "#a8854a");
    x.lineJoin = "round";
    x.strokeStyle = "#8a6c3a"; x.lineWidth = 10;
    x.strokeText(text, cv.width / 2, cv.height / 2);
    x.fillStyle = grad;
    x.fillText(text, cv.width / 2, cv.height / 2);
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 8; tex.encoding = THREE.sRGBEncoding;
    const maxW = Math.min(topR * 1.7, 1.6);
    let W = 1.1 * (tw / 360); if (W > maxW) W = maxW;
    const H = W * (cv.height / cv.width);
    const g = new THREE.Group();
    const stickH = 0.3;
    [-W * 0.32, W * 0.32].forEach((dx) => {
      const s = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, stickH + H * 0.5, 8), stickMat);
      s.position.set(dx, (stickH + H * 0.5) / 2, 0); g.add(s);
    });
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(W, H),
      new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.4, metalness: 0.35, side: THREE.DoubleSide, alphaTest: 0.06, envMapIntensity: 1.1 }));
    plate.position.y = stickH + H / 2; plate.castShadow = true; g.add(plate);
    return g;
  }

  /* kalp topper — altın tel kalp çubukta */
  function makeHeartTopper() {
    const shape = new THREE.Shape();
    const pts = [], N = 60;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      const px = 16 * Math.pow(Math.sin(t), 3);
      const py = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push([px / 34, py / 34]);
    }
    pts.forEach((p, i) => (i ? shape.lineTo(p[0], p[1]) : shape.moveTo(p[0], p[1])));
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 2, curveSegments: 24 });
    geo.center();
    const heart = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: C("#cfa75e"), metalness: 0.95, roughness: 0.2, clearcoat: 0.6, envMapIntensity: 1.5 }));
    heart.scale.setScalar(0.5); heart.castShadow = true;
    const g = new THREE.Group();
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.34, 8), stickMat);
    stick.position.y = 0.17; g.add(stick);
    heart.position.y = 0.34 + 0.21;
    g.add(heart);
    return g;
  }

  /* pasta üstü el yazısı — düz yatan şeffaf dekal */
  function makeTextDecal(text, topR, darkSurface) {
    text = (text || "").slice(0, 25);
    const fs = 170, pad = 70;
    const meas = document.createElement("canvas").getContext("2d");
    const fontStr = `700 ${fs}px 'Caveat', 'Segoe Script', cursive`;
    meas.font = fontStr;
    const tw = Math.max(200, meas.measureText(text).width);
    const cv = document.createElement("canvas");
    cv.width = Math.ceil(tw + pad * 2); cv.height = fs + pad * 2;
    const x = cv.getContext("2d");
    x.font = fontStr; x.textAlign = "center"; x.textBaseline = "middle";
    const ink = darkSurface ? "#fdf3e3" : "#5a3322";
    x.lineJoin = "round"; x.lineCap = "round";
    x.strokeStyle = ink; x.lineWidth = 13;
    x.strokeText(text, cv.width / 2, cv.height / 2);
    x.fillStyle = ink;
    x.fillText(text, cv.width / 2, cv.height / 2);
    const tex = new THREE.CanvasTexture(cv); tex.anisotropy = 8; tex.encoding = THREE.sRGBEncoding;
    const maxW = topR * 1.34;
    let W = 1.25 * (tw / 420); if (W > maxW) W = maxW; if (W < 0.5) W = 0.5;
    const H = W * (cv.height / cv.width);
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    plane.rotation.x = -Math.PI / 2;
    plane.renderOrder = 3;
    return plane;
  }

  /* ---- temizlik (paylaşılanlar korunur) ---- */
  function disposeGroup(g) {
    g.traverse((o) => {
      if (o.geometry && !SHARED_GEOS.has(o.geometry)) o.geometry.dispose();
      if (o.material && !SHARED_MATS.has(o.material)) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
          if (SHARED_MATS.has(m)) return;
          if (m.map) m.map.dispose();
          m.dispose();
        });
      }
    });
    g.clear();
  }

  return {
    C, lighten, dropletGeo, sprinkleGeo,
    pearlMat, flameMat, goldMat, silverMat,
    makePearl, makeRose, makeMacaron, makeStrawberry, makeBlackberry, fruitCluster,
    scatterLeaf, makeGanacheSwirl,
    makeCandle, makeNumberCandle, makeScriptTopper, makeHeartTopper, makeTextDecal,
    disposeGroup,
  };
})();
