/* ============================================================
   Pastacihanı — Pasta Atölyesi 3D motoru (Three.js r128)
   v3 — boyut ölçeği · 4 kaplama · düz/ombre/mermer · bağımsız
   süslemeler · topper & el yazısı · dilim kesiti animasyonu
   API: window.Atelier3D = { supported, init(state), update(state),
        toggleSlice(open), snapshot(size), onUserInteract }
   ============================================================ */
(function () {
  "use strict";

  function webglOK() {
    try {
      const c = document.createElement("canvas");
      return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl")));
    } catch (e) { return false; }
  }

  const stub = { supported: false, init() {}, update() {}, toggleSlice() {}, snapshot() { return ""; }, FLAVORS: {} };
  if (typeof THREE === "undefined" || !window.AtelierParts || !webglOK()) { window.Atelier3D = stub; return; }

  const P = window.AtelierParts;
  const C = P.C, lighten = P.lighten;

  /* ---------- tatlar (pandispanya + krema renkleri) ---------- */
  const FLAVORS = {
    cikolata: { name: "Çikolatalı",  sponge: "#4a2b18", cream: "#8a5a36" },
    vanilya:  { name: "Vanilyalı",   sponge: "#efddb5", cream: "#fbf3e2" },
    frambuaz: { name: "Frambuazlı",  sponge: "#f0ddc9", cream: "#d96a8b" },
    limon:    { name: "Limonlu",     sponge: "#e8d088", cream: "#f8eec9" },
    lotus:    { name: "Lotuslu",     sponge: "#d8a96e", cream: "#ecc695" },
    fistik:   { name: "Fıstıklı",    sponge: "#e8e3c2", cream: "#a8c487" },
  };
  const DRIP_COLORS = { sutlu: "#46230e", beyaz: "#f6ead9", karamel: "#b9772a" };
  const SIZE_SCALE = { s: 0.8, m: 1.0, l: 1.18, xl: 1.38 };
  const PRESETS = {
    1: [{ r: 1.42, h: 0.96 }],
    2: [{ r: 1.54, h: 0.80 }, { r: 1.10, h: 0.66 }],
    3: [{ r: 1.62, h: 0.70 }, { r: 1.22, h: 0.60 }, { r: 0.84, h: 0.52 }],
  };
  const SHAPE_SCALE = { round: 1.0, square: 0.92, heart: 1.04 };
  const BEVEL = 0.05;

  const isMobile = () => (window.innerWidth || 1024) < 768;
  const dq = (n) => (isMobile() ? Math.max(1, Math.round(n / 2)) : n);

  /* ============================================================ */
  let renderer, scene, camera, controls, container;
  let root, cakeGroup, sliceGroup, shadowPlane;
  let running = false, inited = false;
  let cur = null;                 // son durum (JSON karşılaştırma)
  let curObj = null;              // son durum nesnesi
  let flames = [];                // titreşen alevler
  let colorTweens = [];           // {col, from, to, t, dur}
  let camAnim = null;             // {fromPos, toPos, fromTg, toTg, t, dur}
  let userTouched = false;
  let sliceOpen = false, sliceT = 0, sliceDir = new THREE.Vector3(0, 0, 1);
  let bumpTex = null;
  let clockLast = 0;

  function init(state) {
    if (inited) { update(state); return; }
    container = document.getElementById("atelierStage");
    if (!container) return;
    inited = true;

    renderer = new THREE.WebGLRenderer({ antialias: !isMobile(), alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile() ? 1.6 : 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.82;
    renderer.physicallyCorrectLights = true;
    container.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block", touchAction: "none" });

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    camera.position.set(0, 3.0, 6.6);

    /* prosedürel stüdyo ortamı (yansımalar) */
    (function buildEnv() {
      const c = document.createElement("canvas"); c.width = 64; c.height = 256;
      const x = c.getContext("2d");
      const g = x.createLinearGradient(0, 0, 0, 256);
      g.addColorStop(0.00, "#fff6ec");
      g.addColorStop(0.34, "#f0d7c4");
      g.addColorStop(0.52, "#a07d72");
      g.addColorStop(0.74, "#41302f");
      g.addColorStop(1.00, "#1b1316");
      x.fillStyle = g; x.fillRect(0, 0, 64, 256);
      x.fillStyle = "rgba(255,244,228,0.95)";
      x.beginPath(); x.ellipse(18, 54, 9, 30, 0, 0, 7); x.fill();
      x.fillStyle = "rgba(206,224,238,0.55)";
      x.beginPath(); x.ellipse(46, 82, 7, 24, 0, 0, 7); x.fill();
      x.fillStyle = "rgba(255,230,200,0.4)";
      x.beginPath(); x.ellipse(34, 150, 12, 40, 0, 0, 7); x.fill();
      const tex = new THREE.CanvasTexture(c);
      tex.mapping = THREE.EquirectangularReflectionMapping;
      try {
        const pmrem = new THREE.PMREMGenerator(renderer);
        pmrem.compileEquirectangularShader();
        scene.environment = pmrem.fromEquirectangular(tex).texture;
        tex.dispose(); pmrem.dispose();
      } catch (e) { scene.environment = tex; }
    })();

    /* yumuşak stüdyo ışığı */
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    scene.add(new THREE.HemisphereLight(0xfff3ea, 0x2a2024, 0.5));
    const key = new THREE.DirectionalLight(0xfff2e4, 1.85);
    key.position.set(-4.2, 7.0, 4.4);
    key.castShadow = true;
    key.shadow.mapSize.set(isMobile() ? 1024 : 2048, isMobile() ? 1024 : 2048);
    key.shadow.camera.near = 1; key.shadow.camera.far = 26;
    key.shadow.camera.left = -6; key.shadow.camera.right = 6;
    key.shadow.camera.top = 6; key.shadow.camera.bottom = -6;
    key.shadow.radius = 9; key.shadow.bias = -0.0004;
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffe9da, 0.5);
    fill.position.set(5.2, 2.0, 3.4); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffeede, 0.9);
    rim.position.set(-1.5, 4.2, -5.4); scene.add(rim);

    shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(26, 26), new THREE.ShadowMaterial({ opacity: 0.22 }));
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.001;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.085;
    controls.enablePan = false;
    controls.minPolarAngle = 0.5;
    controls.maxPolarAngle = 1.5;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.85;
    controls.target.set(0, 1.0, 0);
    controls.addEventListener("start", () => {
      userTouched = true;
      controls.autoRotate = false;
      camAnim = null;
      if (window.Atelier3D && Atelier3D.onUserInteract) Atelier3D.onUserInteract();
    });

    root = new THREE.Group(); scene.add(root);
    cakeGroup = new THREE.Group(); root.add(cakeGroup);
    sliceGroup = new THREE.Group(); root.add(sliceGroup);

    /* krema spatula bump dokusu */
    (function buildBump() {
      const c = document.createElement("canvas"); c.width = c.height = 512;
      const x = c.getContext("2d");
      x.fillStyle = "#808080"; x.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 110; i++) {
        x.beginPath();
        const cx = Math.random() * 512, cy = Math.random() * 512, r = 22 + Math.random() * 80, a0 = Math.random() * 6.3;
        x.arc(cx, cy, r, a0, a0 + 1 + Math.random() * 2.4);
        const v = Math.random() > 0.5 ? 240 : 70;
        x.strokeStyle = `rgba(${v},${v},${v},0.13)`;
        x.lineWidth = 3 + Math.random() * 11; x.stroke();
      }
      bumpTex = new THREE.CanvasTexture(c);
      bumpTex.wrapS = bumpTex.wrapT = THREE.RepeatWrapping;
      bumpTex.repeat.set(3, 2);
    })();

    window.addEventListener("resize", resize);
    if ("IntersectionObserver" in window) {
      const vio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) start(); else running = false; }), { threshold: 0.04 });
      vio.observe(container);
    }
    build(state || {});
    start();
    /* el yazısı fontu sonradan yüklenirse yazıyı tazele */
    if (document.fonts && document.fonts.load) {
      document.fonts.load("700 40px Caveat").then(() => {
        if (curObj && (curObj.text || curObj.topper === "mutlu" || curObj.topper === "name")) { cur = null; build(curObj); }
      }).catch(() => {});
    }
  }

  /* ---------- renk yardımcıları ---------- */
  function isDark(hex) { const o = {}; new THREE.Color(hex).getHSL(o); return o.l < 0.42; }
  function richColor(hex) {
    const o = {}; new THREE.Color(hex).getHSL(o);
    return new THREE.Color().setHSL(o.h, Math.min(1, o.s + (o.s > 0.06 ? 0.12 : 0.02)), Math.min(o.l, 0.76)).convertSRGBToLinear();
  }

  /* ---------- mermer dokusu ---------- */
  function marbleTexture(hex) {
    const c = document.createElement("canvas"); c.width = c.height = 1024;
    const x = c.getContext("2d");
    x.fillStyle = "#" + lighten(hex, 0.16).getHexString();
    x.fillRect(0, 0, 1024, 1024);
    const vein = (color, w, alpha, n) => {
      x.strokeStyle = color; x.globalAlpha = alpha; x.lineCap = "round";
      for (let i = 0; i < n; i++) {
        x.lineWidth = w * (0.5 + Math.random());
        x.beginPath();
        let px = Math.random() * 1024, py = Math.random() * 1024;
        x.moveTo(px, py);
        const steps = 5 + (Math.random() * 5 | 0);
        for (let s = 0; s < steps; s++) {
          const nx = px + (Math.random() - 0.5) * 360, ny = py + (Math.random() - 0.5) * 360;
          x.quadraticCurveTo(px + (Math.random() - 0.5) * 200, py + (Math.random() - 0.5) * 200, nx, ny);
          px = nx; py = ny;
        }
        x.stroke();
      }
      x.globalAlpha = 1;
    };
    vein("#ffffff", 26, 0.5, 9);
    vein("#ffffff", 10, 0.7, 12);
    vein("#" + C(hex).lerp(C("#5a4a52"), 0.45).getHexString(), 5, 0.35, 8);
    vein("#c2a062", 3, 0.5, 4);
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(0.28, 0.28);
    tex.offset.set(0.5, 0.5);
    tex.anisotropy = 4;
    return tex;
  }

  /* ---------- ombre (dünya-Y bazlı renk geçişi) ---------- */
  function applyOmbre(mat, botHex, topHex, hMax) {
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uOmbreBot = { value: richColor(botHex) };
      sh.uniforms.uOmbreTop = { value: lighten(botHex, 0.2) };
      sh.uniforms.uOmbreH = { value: hMax };
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vOmbreY;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvOmbreY = (modelMatrix * vec4(position,1.0)).y;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vOmbreY;\nuniform vec3 uOmbreBot;\nuniform vec3 uOmbreTop;\nuniform float uOmbreH;")
        .replace("vec4 diffuseColor = vec4( diffuse, opacity );",
          "vec4 diffuseColor = vec4( mix(uOmbreBot, uOmbreTop, smoothstep(0.35, uOmbreH, vOmbreY)), opacity );");
      mat.userData.shader = sh;
    };
    mat.needsUpdate = true;
  }

  /* ---------- kaplama malzemesi ---------- */
  function bodyMaterial(st, hMax) {
    const coating = st.coating || "butter";
    const p = { metalness: 0.0, bumpMap: bumpTex, envMapIntensity: 0.6 };
    if (coating === "fondant") {
      Object.assign(p, { roughness: 0.22, clearcoat: 0.7, clearcoatRoughness: 0.16, bumpScale: 0.003, envMapIntensity: 0.55 });
    } else if (coating === "santi") {
      Object.assign(p, { roughness: 0.78, clearcoat: 0.1, clearcoatRoughness: 0.6, bumpScale: 0.02, envMapIntensity: 0.42 });
    } else { // buttercream
      Object.assign(p, { roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.45, bumpScale: 0.013, envMapIntensity: 0.6 });
    }
    if (st.colorMode === "marble") {
      p.color = new THREE.Color("#ffffff");
      p.map = marbleTexture(st.color);
    } else {
      p.color = richColor(st.color);
    }
    const mat = new THREE.MeshPhysicalMaterial(p);
    if (st.colorMode === "ombre") applyOmbre(mat, st.color, "#fdf8f0", hMax);
    return mat;
  }

  /* ---------- şekiller ---------- */
  function roundedRect(s, x, y, w, h, r) {
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  }
  function heartShape(shape, r) {
    const pts = [], N = 90;
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      const px = 16 * Math.pow(Math.sin(t), 3);
      const py = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      pts.push([px, py]);
    }
    let mnx = 1e9, mxx = -1e9, mny = 1e9, mxy = -1e9;
    pts.forEach((p) => { mnx = Math.min(mnx, p[0]); mxx = Math.max(mxx, p[0]); mny = Math.min(mny, p[1]); mxy = Math.max(mxy, p[1]); });
    const cx = (mnx + mxx) / 2, cy = (mny + mxy) / 2, half = Math.max(mxx - mnx, mxy - mny) / 2, sc = r / half;
    pts.forEach((p, i) => { const X = (p[0] - cx) * sc, Y = (p[1] - cy) * sc; i ? shape.lineTo(X, Y) : shape.moveTo(X, Y); });
    shape.closePath();
  }
  function shape2D(kind, r) {
    const s = new THREE.Shape();
    if (kind === "square") { const a = r * 0.95, rad = Math.min(0.2, a * 0.2); roundedRect(s, -a, -a, a * 2, a * 2, rad); }
    else if (kind === "heart") { heartShape(s, r); }
    else { s.absarc(0, 0, r, 0, Math.PI * 2, false); }
    return s;
  }
  function resampleClosed(pts, M) {
    const seg = [], n = pts.length; let total = 0;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; const d = Math.hypot(b.x - a.x, b.y - a.y); seg.push(d); total += d; }
    const out = []; let target = 0, acc = 0, i = 0;
    const step = total / M;
    for (let k = 0; k < M; k++) {
      target = k * step;
      while (i < n - 1 && acc + seg[i] < target) { acc += seg[i]; i++; }
      const a = pts[i], b = pts[(i + 1) % n], t = seg[i] ? (target - acc) / seg[i] : 0;
      out.push({ x: a.x + (b.x - a.x) * t, z: -(a.y + (b.y - a.y) * t) });
    }
    return out;
  }
  function outlineOf(kind, r, M) {
    const s = shape2D(kind, r);
    const raw = s.getPoints(kind === "round" ? 96 : 160);
    return resampleClosed(raw, M);
  }
  function scaleLoop(loop, k) { return loop.map((p) => ({ x: p.x * k, z: p.z * k })); }
  function loopPerimeter(loop) { let t = 0; for (let i = 0; i < loop.length; i++) { const a = loop[i], b = loop[(i + 1) % loop.length]; t += Math.hypot(b.x - a.x, b.z - a.z); } return t; }

  function extrudeBody(kind, r, h, mat, baseY, bevel) {
    const bv = bevel == null ? BEVEL : bevel;
    const geo = new THREE.ExtrudeGeometry(shape2D(kind, r), {
      depth: h, bevelEnabled: bv > 0, bevelThickness: bv, bevelSize: bv,
      bevelSegments: 3, curveSegments: kind === "round" ? 72 : 16, steps: 1,
    });
    geo.rotateX(-Math.PI / 2);
    geo.computeBoundingBox();
    geo.translate(0, baseY - geo.boundingBox.min.y, 0);
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  function creamRing(loop, y, tubeR, mat) {
    const v = loop.map((p) => new THREE.Vector3(p.x, y, p.z));
    const curve = new THREE.CatmullRomCurve3(v, true, "catmullrom", 0.25);
    const geo = new THREE.TubeGeometry(curve, Math.max(50, loop.length), tubeR, 12, true);
    const m = new THREE.Mesh(geo, mat); m.castShadow = true; return m;
  }
  function pipedBorder(loop, y, sphereR, mat, group) {
    loop.forEach((p) => {
      const m = new THREE.Mesh(P.dropletGeo, mat);
      m.position.set(p.x, y, p.z); m.scale.set(sphereR, sphereR * 1.32, sphereR);
      m.castShadow = true; group.add(m);
    });
  }

  /* drip — üst kenardan akan damlalar + üst gölet */
  function addDrips(kind, topR, topY, hex, group) {
    const mat = new THREE.MeshPhysicalMaterial({ color: C(hex), roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.3, envMapIntensity: 0.35 });
    /* gölet: üst yüzeyde ince katman */
    const pool = extrudeBody(kind, topR * 0.995, 0.035, mat, topY - 0.01, 0.025);
    group.add(pool);
    /* damlalar */
    const loop = outlineOf(kind, topR, dq(Math.round(loopPerimeter(outlineOf(kind, topR, 40)) / 0.21)));
    loop.forEach((p, i) => {
      const len = 0.13 + ((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1 * 0.27;
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.048, len, 8), mat);
      tube.position.set(p.x * 1.005, topY + 0.02 - len / 2, p.z * 1.005); group.add(tube);
      const bead = new THREE.Mesh(P.dropletGeo, mat);
      bead.scale.setScalar(0.052); bead.position.set(p.x * 1.005, topY + 0.02 - len, p.z * 1.005);
      bead.castShadow = true; group.add(bead);
    });
  }

  /* ---------- inşa ---------- */
  const seededRand = (seed) => { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; };

  function build(st) {
    P.disposeGroup(cakeGroup);
    P.disposeGroup(sliceGroup);
    flames = [];
    sliceOpen = false; sliceT = 0;

    st = normalize(st);
    const sc = (SHAPE_SCALE[st.shape] || 1) * (SIZE_SCALE[st.size] || 1);
    const hScale = 0.55 + 0.45 * (SIZE_SCALE[st.size] || 1);
    const specs = (PRESETS[st.layers] || PRESETS[2]).map((s) => ({ r: s.r * sc, h: s.h * hScale }));
    const totalH = specs.reduce((a, s) => a + s.h + 2 * BEVEL, 0) + 0.18;
    const dark = isDark(st.colorMode === "marble" ? "#f5f0e8" : st.color);
    const naked = st.coating === "naked";

    const bodyMat = naked ? null : bodyMaterial(st, totalH + 0.2);
    if (bodyMat) bodyMat.userData.isBody = true;
    const creamCol = lighten(st.color, dark ? 0.3 : 0.16);
    const creamMat = new THREE.MeshPhysicalMaterial({ color: creamCol, roughness: 0.52, clearcoat: 0.25, clearcoatRoughness: 0.4, bumpMap: bumpTex, bumpScale: 0.012, envMapIntensity: 0.55 });
    creamMat.userData.isCream = true;
    const nakedCreamMat = new THREE.MeshPhysicalMaterial({ color: C("#fbf3e4"), roughness: 0.6, clearcoat: 0.15, bumpMap: bumpTex, bumpScale: 0.014, envMapIntensity: 0.45 });

    /* porselen stand */
    const baseR = specs[0].r + 0.52;
    const plate = new THREE.Mesh(
      new THREE.CylinderGeometry(baseR, baseR + 0.06, 0.11, 80),
      new THREE.MeshPhysicalMaterial({ color: C("#f6f3ee"), roughness: 0.08, clearcoat: 0.75, clearcoatRoughness: 0.08, envMapIntensity: 1.1 })
    );
    plate.position.y = 0.32; plate.castShadow = true; plate.receiveShadow = true; cakeGroup.add(plate);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.46, 0.28, 48),
      new THREE.MeshPhysicalMaterial({ color: C("#efe9e0"), roughness: 0.12, clearcoat: 0.6, envMapIntensity: 0.9 }));
    stem.position.y = 0.14; stem.castShadow = true; cakeGroup.add(stem);
    const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.72, 0.06, 56),
      new THREE.MeshPhysicalMaterial({ color: C("#efe9e0"), roughness: 0.12, clearcoat: 0.6, envMapIntensity: 0.9 }));
    foot.position.y = 0.03; cakeGroup.add(foot);

    let baseY = 0.375, topY = baseY, topR = specs[0].r;
    const tierTops = [];

    specs.forEach((s, ti) => {
      const flavor = FLAVORS[st.flavors[ti]] || FLAVORS.vanilya;
      if (naked) {
        /* çıplak pasta: pandispanya dilimleri + arada görünür krema */
        const creamH = 0.085, n = 3;
        const spongeH = (s.h + 2 * BEVEL - (n - 1) * creamH) / n;
        const spongeMat = new THREE.MeshStandardMaterial({ color: C(flavor.sponge), roughness: 0.95, bumpMap: bumpTex, bumpScale: 0.02, envMapIntensity: 0.3 });
        let y = baseY;
        for (let i = 0; i < n; i++) {
          cakeGroup.add(extrudeBody(st.shape, s.r, spongeH - 0.02, spongeMat, y, 0.018));
          y += spongeH;
          if (i < n - 1) {
            cakeGroup.add(extrudeBody(st.shape, s.r * 1.012, creamH, nakedCreamMat, y - creamH * 0.7, 0.022));
          }
        }
        /* üstte ince krema örtüsü */
        cakeGroup.add(extrudeBody(st.shape, s.r * 1.01, 0.05, nakedCreamMat, y - 0.02, 0.025));
        baseY = y + 0.05; topY = baseY; topR = s.r;
      } else {
        const th = s.h + 2 * BEVEL;
        cakeGroup.add(extrudeBody(st.shape, s.r, s.h, bodyMat, baseY));
        const top = baseY + th;
        const loopFull = outlineOf(st.shape, s.r, Math.max(60, Math.round(s.r * 70)));
        cakeGroup.add(creamRing(scaleLoop(loopFull, 1.012), baseY + 0.05, 0.042, creamMat));
        if (st.coating !== "fondant") {
          const spR = 0.066;
          const peri = loopPerimeter(loopFull);
          const count = Math.max(14, Math.round(peri / (spR * 1.75)));
          pipedBorder(scaleLoop(outlineOf(st.shape, s.r, count), 0.97), top - 0.015, spR, creamMat, cakeGroup);
        } else {
          cakeGroup.add(creamRing(scaleLoop(loopFull, 1.005), top - 0.045, 0.03, creamMat));
        }
        baseY = top; topY = top; topR = s.r;
      }
      tierTops.push({ y: topY, r: s.r });
    });

    /* ---- süslemeler ---- */
    const rng = seededRand(20260610);
    const decoY = topY + (st.drip ? 0.055 : 0);
    const onTop = (g, x, z, y) => { g.position.set(x, (y == null ? decoY : y) + 0.004, z); cakeGroup.add(g); };
    const palette = harmonized(st.color);

    if (st.drip) addDrips(st.shape, topR, topY, DRIP_COLORS[st.drip] || DRIP_COLORS.sutlu, cakeGroup);

    if (st.ganache) {
      const n = dq(Math.max(8, Math.round(loopPerimeter(outlineOf(st.shape, topR, 30)) / 0.34)));
      outlineOf(st.shape, topR * 0.84, n).forEach((p) => {
        const sw = P.makeGanacheSwirl("#3a2014");
        onTop(sw, p.x, p.z);
      });
    }
    if (st.flowers) {
      const cols = palette.flowers;
      const n = dq(st.layers > 1 ? 5 : 4);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.4;
        onTop(P.makeRose(cols[i % cols.length], 0.92), Math.cos(a) * topR * 0.52, Math.sin(a) * topR * 0.52);
      }
      onTop(P.makeRose(cols[0], 1.12), 0, st.text ? -topR * 0.55 : 0);
      /* alt katların kenarına zarif tekli güller */
      tierTops.slice(0, -1).forEach((t, i) => {
        const a = 1.1 + i * 2.4;
        const r2 = P.makeRose(cols[(i + 1) % cols.length], 0.8);
        r2.position.set(Math.cos(a) * t.r * 0.82, t.y + 0.004, Math.sin(a) * t.r * 0.82);
        cakeGroup.add(r2);
      });
    }
    if (st.fruit) {
      const n = dq(st.flowers ? 2 : 3);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 1.9;
        onTop(P.fruitCluster(i), Math.cos(a) * topR * 0.5, Math.sin(a) * topR * 0.5);
      }
    }
    if (st.macaron) {
      const cols = palette.macaron, n = dq(7);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.15;
        const mc = P.makeMacaron(cols[i % cols.length]);
        mc.scale.setScalar(1.3);
        onTop(mc, Math.cos(a) * topR * 0.78, Math.sin(a) * topR * 0.78);
      }
    }
    if (st.leaf) P.scatterLeaf(cakeGroup, topR * 0.8, dq(9), decoY, st.leaf);
    if (st.pearls) {
      const n = dq(Math.max(10, Math.round(topR * 16)));
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        onTop(P.makePearl(0.04 + rng() * 0.02), Math.cos(a) * topR * 0.66, Math.sin(a) * topR * 0.66);
      }
      /* alt kat tabanına inci dizisi */
      if (st.layers > 1) {
        outlineOf(st.shape, specs[1] ? specs[0].r : topR, dq(26)).forEach((p) => {
          const pr = P.makePearl(0.038);
          pr.position.set(p.x * 0.99, tierTops[0].y + 0.03, p.z * 0.99);
          cakeGroup.add(pr);
        });
      }
    }

    /* ---- yazı ---- */
    if (st.text) {
      const decal = P.makeTextDecal(st.text, topR, dark || st.drip === "sutlu");
      decal.position.set(0, topY + (st.drip ? 0.06 : 0.012), st.flowers || st.fruit ? 0.1 : 0);
      cakeGroup.add(decal);
    }

    /* ---- topper & mumlar ---- */
    let tY = topY;
    if (st.topper === "number") {
      const t = P.makeNumberCandle(st.topperValue || "1", palette.accent);
      t.position.set(0, tY, st.text ? -topR * 0.3 : 0); cakeGroup.add(t);
      if (t.userData.flame) flames.push(t.userData.flame);
    } else if (st.topper === "mutlu" || st.topper === "name") {
      const t = P.makeScriptTopper(st.topper === "mutlu" ? "Mutlu Yıllar" : (st.topperValue || "İsim"), topR);
      t.position.set(0, tY, -topR * 0.18); cakeGroup.add(t);
    } else if (st.topper === "heart") {
      const t = P.makeHeartTopper();
      t.position.set(0, tY, -topR * 0.15); cakeGroup.add(t);
    }
    if (st.candles > 0) {
      const n = Math.min(12, st.candles);
      const ringR = n === 1 ? 0 : topR * (st.topper !== "none" || st.text ? 0.62 : 0.42);
      const cols = palette.candles;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.7;
        const cd = P.makeCandle(cols[i % cols.length], 0.46);
        cd.position.set(Math.cos(a) * ringR, tY, Math.sin(a) * ringR);
        cakeGroup.add(cd);
        flames.push(cd.userData.flame);
      }
      const glow = new THREE.PointLight(0xffa64d, 3.4, 2.8, 2);
      glow.position.set(0, tY + 0.62, 0); cakeGroup.add(glow);
    }

    cur = JSON.stringify(st);
    curObj = st;
    fitCamera();
    renderOnce();
  }

  /* uyumlu süsleme paletleri (gövde rengine göre) */
  function harmonized(hex) {
    const o = {}; C(hex).getHSL(o);
    const h = o.h;
    const mk = (dh, s, l) => "#" + new THREE.Color().setHSL((h + dh + 1) % 1, s, l).getHexString();
    return {
      flowers: [mk(0, 0.55, 0.72), "#fdf6ec", mk(0.06, 0.45, 0.62), mk(-0.06, 0.4, 0.78)],
      macaron: [mk(0.02, 0.5, 0.74), mk(0.1, 0.42, 0.7), "#fbf3e2", mk(-0.08, 0.45, 0.72), mk(0.5, 0.3, 0.72)],
      candles: ["#fbf3e2", mk(0, 0.5, 0.7), "#e3c98f"],
      accent: mk(0, 0.5, 0.66),
    };
  }

  function normalize(st) {
    return {
      layers: Math.min(3, Math.max(1, st.layers || 2)),
      shape: st.shape || "round",
      size: st.size || "m",
      coating: st.coating || "butter",
      colorMode: st.colorMode || "solid",
      color: st.color || "#F2BFC9",
      drip: st.drip || null,
      flowers: !!st.flowers, fruit: !!st.fruit, macaron: !!st.macaron,
      pearls: !!st.pearls, ganache: !!st.ganache,
      leaf: st.leaf || null,
      text: (st.text || "").trim().slice(0, 25),
      topper: st.topper || "none",
      topperValue: (st.topperValue || "").trim().slice(0, 14),
      candles: Math.min(12, Math.max(0, st.candles | 0)),
      flavors: (st.flavors && st.flavors.length ? st.flavors : ["cikolata", "vanilya", "frambuaz"]).slice(0, 3),
    };
  }

  /* ---------- güncelle (yumuşak renk geçişi) ---------- */
  function update(st) {
    if (!inited) { init(st); return; }
    st = normalize(st);
    const j = JSON.stringify(st);
    if (j === cur) return;
    /* yalnız renk değiştiyse ve düz renkse: malzemeleri yumuşakça boya */
    if (curObj && st.colorMode === "solid" && curObj.colorMode === "solid" && curObj.coating !== "naked" &&
        JSON.stringify({ ...st, color: "" }) === JSON.stringify({ ...curObj, color: "" })) {
      tweenColors(st.color);
      cur = j; curObj = st;
      return;
    }
    build(st);
  }

  function tweenColors(hex) {
    const dark = isDark(hex);
    const bodyTo = richColor(hex);
    const creamTo = lighten(hex, dark ? 0.3 : 0.16);
    const mats = new Set();
    cakeGroup.traverse((o) => {
      const m = o.material;
      if (m && m.userData && (m.userData.isBody || m.userData.isCream)) mats.add(m);
    });
    colorTweens = [];
    mats.forEach((m) => {
      colorTweens.push({ col: m.color, from: m.color.clone(), to: m.userData.isBody ? bodyTo : creamTo, t: 0, dur: 0.45 });
    });
  }

  /* ---------- dilim kesiti ---------- */
  function buildSlice(st) {
    P.disposeGroup(sliceGroup);
    const sc = (SHAPE_SCALE[st.shape] || 1) * (SIZE_SCALE[st.size] || 1);
    const hScale = 0.55 + 0.45 * (SIZE_SCALE[st.size] || 1);
    const spec = (PRESETS[st.layers] || PRESETS[2])[0];
    const r = spec.r * sc * 0.92, h = spec.h * hScale + 2 * BEVEL;
    const flavor = FLAVORS[st.flavors[0]] || FLAVORS.vanilya;
    const theta = 0.85;

    const pie = (rr) => {
      const s = new THREE.Shape();
      s.moveTo(0, 0);
      s.lineTo(Math.cos(-theta / 2) * rr, Math.sin(-theta / 2) * rr);
      s.absarc(0, 0, rr, -theta / 2, theta / 2, false);
      s.lineTo(0, 0);
      return s;
    };
    const slab = (shape, hh, mat, y) => {
      const geo = new THREE.ExtrudeGeometry(shape, { depth: hh, bevelEnabled: false, curveSegments: 24 });
      geo.rotateX(-Math.PI / 2);
      geo.computeBoundingBox();
      geo.translate(0, y - geo.boundingBox.min.y, 0);
      const m = new THREE.Mesh(geo, mat);
      m.castShadow = true; return m;
    };

    const spongeMat = new THREE.MeshStandardMaterial({ color: C(flavor.sponge), roughness: 0.95, bumpMap: bumpTex, bumpScale: 0.018, envMapIntensity: 0.3 });
    const creamMat = new THREE.MeshStandardMaterial({ color: C(flavor.cream), roughness: 0.6, envMapIntensity: 0.4 });
    const creamH = 0.07, n = 3;
    const spongeH = (h - (n - 1) * creamH) / n;
    let y = 0;
    for (let i = 0; i < n; i++) {
      sliceGroup.add(slab(pie(r), spongeH, spongeMat, y));
      y += spongeH;
      if (i < n - 1) { sliceGroup.add(slab(pie(r * 0.995), creamH, creamMat, y)); y += creamH; }
    }
    /* dış kaplama kabuğu + üst kapak */
    if (st.coating !== "naked") {
      const shellMat = bodyMaterial({ ...st, colorMode: st.colorMode === "ombre" ? "solid" : st.colorMode }, h);
      const band = new THREE.Shape();
      band.absarc(0, 0, r + 0.05, -theta / 2, theta / 2, false);
      band.absarc(0, 0, r, theta / 2, -theta / 2, true);
      sliceGroup.add(slab(band, h, shellMat, 0));
      sliceGroup.add(slab(pie(r + 0.05), 0.06, shellMat, h));
    } else {
      sliceGroup.add(slab(pie(r * 0.99), 0.05, new THREE.MeshStandardMaterial({ color: C("#fbf3e4"), roughness: 0.6 }), h));
    }
    /* küçük porselen tabak */
    const pl = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.85, r * 0.92, 0.05, 48),
      new THREE.MeshPhysicalMaterial({ color: C("#f6f3ee"), roughness: 0.08, clearcoat: 0.7, envMapIntensity: 1.0 }));
    pl.position.set(r * 0.42, -0.025, 0);
    pl.castShadow = true; pl.receiveShadow = true;
    sliceGroup.add(pl);
    sliceGroup.visible = false;
  }

  function toggleSlice(open) {
    if (!inited || !curObj) return;
    if (open) {
      buildSlice(curObj);
      const dir = new THREE.Vector3().subVectors(camera.position, controls.target);
      dir.y = 0; dir.normalize();
      sliceDir.copy(dir);
      sliceOpen = true;
      controls.autoRotate = false;
    } else {
      sliceOpen = false;
    }
  }

  function animSlice(dt) {
    const target = sliceOpen ? 1 : 0;
    if (Math.abs(sliceT - target) < 0.001) {
      if (!sliceOpen && sliceGroup.visible && sliceT === 0) sliceGroup.visible = false;
      return;
    }
    sliceT += (target - sliceT) * Math.min(1, dt * 4.5);
    if (Math.abs(sliceT - target) < 0.01) sliceT = target;
    const t = sliceT * sliceT * (3 - 2 * sliceT); // smoothstep
    sliceGroup.visible = t > 0.02;
    const sc = (SHAPE_SCALE[curObj.shape] || 1) * (SIZE_SCALE[curObj.size] || 1);
    const baseR = (PRESETS[curObj.layers] || PRESETS[2])[0].r * sc;
    const dist = 0.15 + t * (baseR * 1.35 + 0.55);
    const yaw = -Math.atan2(sliceDir.z, sliceDir.x);
    sliceGroup.rotation.y = yaw + t * 0.85;
    sliceGroup.position.set(sliceDir.x * dist, 0.375 + t * 0.22 + Math.sin(t * Math.PI) * 0.18, sliceDir.z * dist);
  }

  /* ---------- kamera ---------- */
  function fitCamera() {
    const box = new THREE.Box3().setFromObject(cakeGroup);
    if (box.isEmpty()) return;
    const sphere = box.getBoundingSphere(new THREE.Sphere());
    /* boyut algısı: küçük pasta küçük görünsün — sabit referansla harmanla */
    const refR = sphere.radius * 0.55 + 2.05 * 0.45;
    const fitDist = (refR * 1.22) / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const dir = userTouched
      ? new THREE.Vector3().subVectors(camera.position, controls.target).normalize()
      : new THREE.Vector3(0, 0.6, 1).normalize();
    const toPos = sphere.center.clone().add(dir.multiplyScalar(fitDist));
    camera.near = Math.max(0.1, fitDist - refR * 3);
    camera.far = fitDist + refR * 6;
    camera.updateProjectionMatrix();
    controls.minDistance = fitDist * 0.55;
    controls.maxDistance = fitDist * 1.8;
    camAnim = {
      fromPos: camera.position.clone(), toPos,
      fromTg: controls.target.clone(), toTg: sphere.center.clone(),
      t: 0, dur: 0.65,
    };
  }

  function resize() {
    if (!inited) return;
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  function renderOnce() { resize(); renderer.render(scene, camera); }

  function snapshot(size) {
    if (!inited) return "";
    size = size || 1400;
    const oldW = container.clientWidth || 1, oldH = container.clientHeight || 1, oldDpr = renderer.getPixelRatio();
    const savedPos = camera.position.clone();
    renderer.setPixelRatio(1);
    renderer.setSize(size, size, false);
    camera.aspect = 1;
    const box = new THREE.Box3().setFromObject(cakeGroup);
    if (!box.isEmpty()) {
      const sph = box.getBoundingSphere(new THREE.Sphere());
      const dist = (sph.radius * 1.12) / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5));
      camera.position.copy(sph.center).add(new THREE.Vector3(0.42, 0.6, 1).normalize().multiplyScalar(dist));
      camera.lookAt(sph.center);
    }
    camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    let url = "";
    try { url = renderer.domElement.toDataURL("image/png"); } catch (e) {}
    renderer.setPixelRatio(oldDpr);
    renderer.setSize(oldW, oldH, false);
    camera.aspect = oldW / oldH; camera.position.copy(savedPos);
    camera.lookAt(controls.target); camera.updateProjectionMatrix();
    renderer.render(scene, camera);
    return url;
  }

  /* ---------- döngü ---------- */
  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, (now - clockLast) / 1000 || 0.016);
    clockLast = now;
    if (camAnim) {
      camAnim.t += dt / camAnim.dur;
      const k = camAnim.t >= 1 ? 1 : 1 - Math.pow(1 - camAnim.t, 3);
      camera.position.lerpVectors(camAnim.fromPos, camAnim.toPos, k);
      controls.target.lerpVectors(camAnim.fromTg, camAnim.toTg, k);
      if (camAnim.t >= 1) camAnim = null;
    }
    controls.update();
    animSlice(dt);
    if (colorTweens.length) {
      for (const tw of colorTweens) {
        tw.t += dt / tw.dur;
        const k = Math.min(1, tw.t);
        tw.col.copy(tw.from).lerp(tw.to, k * k * (3 - 2 * k));
      }
      colorTweens = colorTweens.filter((tw) => tw.t < 1);
    }
    const tm = now / 1000;
    for (let i = 0; i < flames.length; i++) {
      const f = flames[i];
      f.scale.y = 0.12 * (1 + 0.16 * Math.sin(tm * 12 + i * 1.7));
      f.scale.x = f.scale.z = 0.058 * (1 + 0.1 * Math.cos(tm * 9 + i));
    }
    renderer.render(scene, camera);
  }
  function start() {
    if (!inited || running) return;
    running = true;
    clockLast = performance.now();
    resize();
    requestAnimationFrame(loop);
  }

  window.Atelier3D = {
    supported: true,
    FLAVORS,
    init, update, toggleSlice, snapshot,
    isSliceOpen: () => sliceOpen,
    _dbg: () => ({ scene, renderer, camera, controls, cakeGroup }),
    onUserInteract: null,
  };
})();
