/* ============================================================
   Pastacihanı — bağımsız QR üreteci (saf JS, çevrimdışı çalışır)
   nayuki "QR Code generator" algoritmasının derli toplu uyarlaması.
   Kullanım:  QRCode.render(canvas, "https://...", {ecl:"M", dark:"#2A1E22", light:"#fff"})
   ============================================================ */
(function (global) {
  "use strict";

  // ---- Galois alanı GF(256), primitif 0x11D ----
  var EXP = new Array(256), LOG = new Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
    EXP[255] = EXP[0];
  })();
  function gmul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[(LOG[a] + LOG[b]) % 255]; }

  // EC kod sözcüğü / blok (satır: L,M,Q,H), sürüm 1..20
  var ECCPB = {
    L: [7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28],
    M: [10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26],
    Q: [13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30],
    H: [17,26,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,30]
  };
  var NBLK = {
    L: [1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8],
    M: [1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16],
    Q: [1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20],
    H: [1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25]
  };
  var ALIGN = {
    1:[],2:[6,18],3:[6,22],4:[6,26],5:[6,30],6:[6,34],
    7:[6,22,38],8:[6,24,42],9:[6,26,46],10:[6,28,50],
    11:[6,30,54],12:[6,32,58],13:[6,34,62],14:[6,26,46,66],
    15:[6,26,48,70],16:[6,26,50,74],17:[6,30,54,78],18:[6,30,56,82],
    19:[6,30,58,86],20:[6,34,62,90]
  };

  function rawModules(ver) {
    var r = (16 * ver + 128) * ver + 64;
    if (ver >= 2) { var n = Math.floor(ver / 7) + 2; r -= (25 * n - 10) * n - 55; if (ver >= 7) r -= 36; }
    return r;
  }
  function dataCodewords(ver, ecl) {
    var total = Math.floor(rawModules(ver) / 8);
    return total - ECCPB[ecl][ver - 1] * NBLK[ecl][ver - 1];
  }

  function rsCompute(data, degree) {
    // üretici polinom
    var gen = [1];
    for (var i = 0; i < degree; i++) {
      gen.push(0);
      for (var j = gen.length - 1; j > 0; j--) gen[j] = gen[j - 1] ^ gmul(gen[j], EXP[i]);
      gen[0] = gmul(gen[0], EXP[i]);
    }
    var res = new Array(degree).fill(0);
    for (var k = 0; k < data.length; k++) {
      var factor = data[k] ^ res[0];
      res.shift(); res.push(0);
      for (var m = 0; m < gen.length; m++) res[m] ^= gmul(gen[m], factor);
    }
    return res;
  }

  function encode(text, ecl) {
    ecl = ecl || "M";
    // UTF-8 baytları
    var bytes = [];
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) { bytes.push(0xC0 | (c >> 6), 0x80 | (c & 0x3F)); }
      else { bytes.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 0x3F), 0x80 | (c & 0x3F)); }
    }
    // uygun sürümü seç
    var ver = 0;
    for (var v = 1; v <= 20; v++) {
      var cc = v < 10 ? 8 : 16;
      var cap = dataCodewords(v, ecl) * 8;
      var need = 4 + cc + bytes.length * 8;
      if (need <= cap) { ver = v; break; }
    }
    if (!ver) throw new Error("Veri çok uzun");

    var cc = ver < 10 ? 8 : 16;
    var bb = [];
    function put(val, len) { for (var b = len - 1; b >= 0; b--) bb.push((val >> b) & 1); }
    put(4, 4);            // byte modu
    put(bytes.length, cc);
    for (var n = 0; n < bytes.length; n++) put(bytes[n], 8);

    var dcw = dataCodewords(ver, ecl);
    var capBits = dcw * 8;
    for (var t = 0; t < 4 && bb.length < capBits; t++) bb.push(0); // terminator
    while (bb.length % 8 !== 0) bb.push(0);
    var dataBytes = [];
    for (var p = 0; p < bb.length; p += 8) { var byte = 0; for (var q = 0; q < 8; q++) byte = (byte << 1) | bb[p + q]; dataBytes.push(byte); }
    var pad = [0xEC, 0x11], pi = 0;
    while (dataBytes.length < dcw) { dataBytes.push(pad[pi & 1]); pi++; }

    // bloklara böl + EC
    var nb = NBLK[ecl][ver - 1], ecpb = ECCPB[ecl][ver - 1];
    var shortBlocks = nb - (dcw % nb), shortLen = Math.floor(dcw / nb);
    var blocks = [], ecBlocks = [], off = 0;
    for (var bI = 0; bI < nb; bI++) {
      var len = shortLen + (bI < shortBlocks ? 0 : 1);
      var blk = dataBytes.slice(off, off + len); off += len;
      blocks.push(blk);
      ecBlocks.push(rsCompute(blk, ecpb));
    }
    // serpiştir
    var result = [];
    var maxLen = shortLen + 1;
    for (var col = 0; col < maxLen; col++)
      for (var b2 = 0; b2 < nb; b2++)
        if (col < blocks[b2].length) result.push(blocks[b2][col]);
    for (var col2 = 0; col2 < ecpb; col2++)
      for (var b3 = 0; b3 < nb; b3++) result.push(ecBlocks[b3][col2]);

    return buildMatrix(ver, ecl, result);
  }

  function buildMatrix(ver, ecl, codewords) {
    var size = ver * 4 + 17;
    var mod = []; var fn = [];
    for (var i = 0; i < size; i++) { mod.push(new Array(size).fill(0)); fn.push(new Array(size).fill(0)); }

    function setFn(x, y, v) { mod[y][x] = v; fn[y][x] = 1; }
    function finder(cx, cy) {
      for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
        var xx = cx + dx, yy = cy + dy; if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue;
        var d = Math.max(Math.abs(dx), Math.abs(dy));
        setFn(xx, yy, (d !== 2 && d !== 4) ? 1 : 0);
      }
    }
    finder(3, 3); finder(size - 4, 3); finder(3, size - 4);
    // timing
    for (var t = 0; t < size; t++) { if (!fn[6][t]) setFn(t, 6, t % 2 === 0 ? 1 : 0); if (!fn[t][6]) setFn(6, t, t % 2 === 0 ? 1 : 0); }
    // alignment
    var ap = ALIGN[ver];
    for (var a = 0; a < ap.length; a++) for (var b = 0; b < ap.length; b++) {
      var ax = ap[a], ay = ap[b];
      if ((ax === 6 && ay === 6) || (ax === 6 && ay === size - 7) || (ax === size - 7 && ay === 6)) continue;
      for (var yy2 = -2; yy2 <= 2; yy2++) for (var xx2 = -2; xx2 <= 2; xx2++) {
        var dd = Math.max(Math.abs(xx2), Math.abs(yy2));
        setFn(ax + xx2, ay + yy2, dd !== 1 ? 1 : 0);
      }
    }
    // dark module
    setFn(8, size - 8, 1);
    // format/version alanlarını rezerve et (geçici)
    for (var f = 0; f < 9; f++) { if (!fn[8][f]) { fn[8][f] = 1; } if (!fn[f][8]) { fn[f][8] = 1; } }
    for (var f2 = 0; f2 < 8; f2++) { fn[8][size - 1 - f2] = 1; fn[size - 1 - f2][8] = 1; }
    if (ver >= 7) {
      for (var vi = 0; vi < 18; vi++) { var r = Math.floor(vi / 3), cc = vi % 3; fn[size - 11 + cc][r] = 1; fn[r][size - 11 + cc] = 1; }
    }

    // veri yerleştirme (zigzag)
    var bitIdx = 0, total = codewords.length * 8;
    function bitAt(i) { return (codewords[i >> 3] >> (7 - (i & 7))) & 1; }
    for (var col = size - 1; col > 0; col -= 2) {
      if (col === 6) col = 5;
      for (var row = 0; row < size; row++) {
        for (var c = 0; c < 2; c++) {
          var x = col - c;
          var upward = ((col + 1) & 2) === 0;
          var y = upward ? size - 1 - row : row;
          if (fn[y][x]) continue;
          var bit = bitIdx < total ? bitAt(bitIdx) : 0; bitIdx++;
          mod[y][x] = bit;
        }
      }
    }

    // maskeleme — en iyi maskeyi seç
    var best = null, bestPen = Infinity, bestMask = 0;
    for (var mask = 0; mask < 8; mask++) {
      var test = mod.map(function (r) { return r.slice(); });
      applyMask(test, fn, mask, size);
      drawFormat(test, fn, ecl, mask, size, ver);
      var pen = penalty(test, size);
      if (pen < bestPen) { bestPen = pen; best = test; bestMask = mask; }
    }
    return best;
  }

  function applyMask(m, fn, mask, size) {
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
      if (fn[y][x]) continue;
      var inv;
      switch (mask) {
        case 0: inv = (x + y) % 2 === 0; break;
        case 1: inv = y % 2 === 0; break;
        case 2: inv = x % 3 === 0; break;
        case 3: inv = (x + y) % 3 === 0; break;
        case 4: inv = (Math.floor(y / 2) + Math.floor(x / 3)) % 2 === 0; break;
        case 5: inv = (x * y) % 2 + (x * y) % 3 === 0; break;
        case 6: inv = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
        case 7: inv = ((x + y) % 2 + (x * y) % 3) % 2 === 0; break;
      }
      if (inv) m[y][x] ^= 1;
    }
  }

  function drawFormat(m, fn, ecl, mask, size, ver) {
    var eccBits = { M: 0, L: 1, H: 2, Q: 3 }[ecl];
    var data = (eccBits << 3) | mask;
    var rem = data;
    for (var i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >> 9) * 0x537);
    var bits = ((data << 10) | rem) ^ 0x5412;
    // yatay+dikey iki kopya
    for (var k = 0; k <= 5; k++) m[8][k] = (bits >> k) & 1;
    m[8][7] = (bits >> 6) & 1; m[8][8] = (bits >> 7) & 1; m[7][8] = (bits >> 8) & 1;
    for (var k2 = 9; k2 < 15; k2++) m[14 - k2][8] = (bits >> k2) & 1;
    for (var k3 = 0; k3 < 8; k3++) m[size - 1 - k3][8] = (bits >> k3) & 1;
    for (var k4 = 8; k4 < 15; k4++) m[8][size - 15 + k4] = (bits >> k4) & 1;
    m[size - 8][8] = 1; // dark module

    if (ver >= 7) {
      var vrem = ver;
      for (var i2 = 0; i2 < 12; i2++) vrem = (vrem << 1) ^ ((vrem >> 11) * 0x1F25);
      var vbits = (ver << 12) | vrem;
      for (var j = 0; j < 18; j++) {
        var bit = (vbits >> j) & 1, r = Math.floor(j / 3), c = j % 3;
        m[r][size - 11 + c] = bit; m[size - 11 + c][r] = bit;
      }
    }
  }

  function penalty(m, size) {
    var p = 0, i, j, run, color;
    // kural 1: ardışık
    for (i = 0; i < size; i++) {
      run = 1; color = m[i][0];
      for (j = 1; j < size; j++) { if (m[i][j] === color) { run++; } else { if (run >= 5) p += run - 2; run = 1; color = m[i][j]; } }
      if (run >= 5) p += run - 2;
      run = 1; color = m[0][i];
      for (j = 1; j < size; j++) { if (m[j][i] === color) { run++; } else { if (run >= 5) p += run - 2; run = 1; color = m[j][i]; } }
      if (run >= 5) p += run - 2;
    }
    // kural 2: 2x2 bloklar
    for (i = 0; i < size - 1; i++) for (j = 0; j < size - 1; j++) {
      var v = m[i][j]; if (v === m[i][j + 1] && v === m[i + 1][j] && v === m[i + 1][j + 1]) p += 3;
    }
    // kural 3: finder benzeri kalıp
    var pat1 = [1,0,1,1,1,0,1,0,0,0,0], pat2 = [0,0,0,0,1,0,1,1,1,0,1];
    function match(arr, x, y, dx, dy) {
      for (var k = 0; k < 11; k++) { var xx = x + dx * k, yy = y + dy * k; if (xx >= size || yy >= size) return false; if (m[yy][xx] !== arr[k]) return false; }
      return true;
    }
    for (i = 0; i < size; i++) for (j = 0; j < size; j++) {
      if (match(pat1, j, i, 1, 0) || match(pat2, j, i, 1, 0)) p += 40;
      if (match(pat1, j, i, 0, 1) || match(pat2, j, i, 0, 1)) p += 40;
    }
    // kural 4: koyu oran
    var dark = 0; for (i = 0; i < size; i++) for (j = 0; j < size; j++) dark += m[i][j];
    var ratio = dark / (size * size) * 100;
    p += Math.floor(Math.abs(ratio - 50) / 5) * 10;
    return p;
  }

  function render(canvas, text, opts) {
    opts = opts || {};
    var m = encode(text, opts.ecl || "M");
    var size = m.length;
    var quiet = opts.quiet == null ? 4 : opts.quiet;
    var total = size + quiet * 2;
    var px = opts.modulePx || Math.max(2, Math.floor((opts.size || 320) / total));
    var dim = total * px;
    canvas.width = dim; canvas.height = dim;
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = opts.light || "#ffffff"; ctx.fillRect(0, 0, dim, dim);
    ctx.fillStyle = opts.dark || "#000000";
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) if (m[y][x]) ctx.fillRect((x + quiet) * px, (y + quiet) * px, px, px);
    return canvas;
  }

  global.QRCode = { encode: encode, render: render };
})(window);
