/* Bác sĩ Hồi sức — HemoSphere Alta simulator (FloTrac / Acumen IQ sensor, minimally-invasive mode)
   On-device UI in English, built after the HemoSphere Alta Operator's Manual (DOC-0589824A v3.5):
   Trend (graphical/tabular), Cockpit and Split views; parameter configuration menu; Clinical Tools side panel
   (HPI secondary screen, Goal Directed Therapy, Fluid Responsiveness Test, Derived Value Calculator,
   Events & Intervention); status bar quick settings; alarm sub-menu; Patient, Zero & Waveform, Settings.
   Load after simulator.js. All values are simulated for training only. */
(function () {
  "use strict";
  var Sim = window.CatrucSim.Sim, U = window.CatrucSim.util;
  var W = 1280, H = 800, txt = U.txt, fmt = U.fmt, clamp = U.clamp, clock = U.clock, hhmm = U.hhmm, waveFromBuf = U.waveFromBuf;
  var BSA = 1.73;

  var C = { bg: "#000", panel: "#121216", panel2: "#1b1b21", line: "#2c2c33", dim: "#9aa0a8", text: "#fff", green: "#54c45e", yellow: "#f2c21b", red: "#e0262d", zone: "rgba(60,150,70,0.22)", teal: "#1b9e93", blue: "#2a6fdb", navy: "#0e2a4f", btn: "#2b2c32", btnHi: "#3b6fd4", art: "#ff3b3b", sel: "#2a6fdb" };

  /* Parameters: alarm low, target low, target high, alarm high (BD defaults, Table D-4; non-indexed from BSA 1.73) */
  var P = {
    map: { name: "MAP", unit: "mmHg", dec: 0, cat: "Pressure", def: [60, 70, 100, 120], scale: [50, 130] },
    sys: { name: "SYS", sub: "ART", unit: "mmHg", dec: 0, cat: "Pressure", def: [90, 100, 130, 150], scale: [60, 180] },
    dia: { name: "DIA", sub: "ART", unit: "mmHg", dec: 0, cat: "Pressure", def: [60, 70, 90, 100], scale: [30, 120] },
    hr: { name: "PR", unit: "bpm", dec: 0, cat: "Pressure", def: [60, 70, 100, 120], scale: [40, 130] },
    ppv: { name: "PPV", unit: "%", dec: 0, cat: "Pressure", def: [0, 0, 13, 20], scale: [0, 50] },
    co: { name: "CO", unit: "L/min", dec: 1, cat: "Flow", def: [1.7, 3.5, 6.9, 10.4], scale: [1.4, 8.2] },
    ci: { name: "CI", unit: "L/min/m²", dec: 1, cat: "Flow", def: [1.0, 2.0, 4.0, 6.0], scale: [1, 5] },
    sv: { name: "SV", unit: "mL/b", dec: 0, cat: "Flow", def: [35, 52, 87, 121], scale: [20, 120] },
    svi: { name: "SVI", unit: "mL/b/m²", dec: 0, cat: "Flow", def: [20, 30, 50, 70], scale: [10, 80] },
    svv: { name: "SVV", unit: "%", dec: 0, cat: "Flow", def: [0, 0, 13, 20], scale: [0, 50] },
    svr: { name: "SVR", unit: "dyne-s/cm⁵", dec: 0, cat: "Resistance", def: [578, 1139, 1382, 1734], scale: [400, 2000] },
    svri: { name: "SVRI", unit: "dyne-s-m²/cm⁵", dec: 0, cat: "Resistance", def: [1000, 1970, 2390, 3000], scale: [700, 3500] },
    hpi: { name: "HPI", unit: "/100", dec: 0, cat: "Acumen", def: [0, null, null, 85], scale: [0, 100], fixed: true },
    dpdt: { name: "dP/dt", unit: "mmHg/s", dec: 0, cat: "Acumen", def: [380, 480, 1300, 1800], scale: [0, 2000] },
    eadyn: { name: "Eadyn", unit: "", dec: 1, cat: "Acumen", def: [null, null, null, null], scale: [0.2, 1.5], fixed: true }
  };
  var CATS = ["Pressure", "Flow", "Resistance", "Acumen"];
  var RANGES = [[60, "1 min"], [300, "5 min"], [600, "10 min"], [900, "15 min"], [1800, "30 min"], [3600, "1 h"]];
  var INCS = [[60, "1 min"], [300, "5 min"], [600, "10 min"], [900, "15 min"], [1800, "30 min"], [3600, "60 min"]];

  function freshState() {
    var lim = {};
    Object.keys(P).forEach(function (k) { var d = P[k].def; lim[k] = { alo: d[0], tlo: d[1], thi: d[2], ahi: d[3], on: true, scale: P[k].scale.slice() }; });
    return {
      lim: lim, keys: ["co", "sv", "svv", "hpi"], cockpit: ["co", "sv", "svv", "hpi"],
      view: "trend", tabular: false, split: "physio", range: 600, inc: 60,
      panel: null, hpiView: "rel", hpiThr: 65, alwaysHpi: true, smartAlerts: true, smartThr: 15,
      hpiShown: null, hpiTick: -1, hpiHigh: 0, hpiAck: false,
      events: [], prevAl: {}, gdt: null, frt: null, cvp: 5, cvpSrc: "Default",
      vol: 80, bright: 5, lockedAt: null, lockAfter: null, trendColors: true,
      zeroAt: 0, nonPulsatile: false, pr: { id: "SK-0001", age: 56, sex: "Male", h: 168, w: 64 }
    };
  }

  function statusColor(a, k, x) {
    var l = a.lim[k], p = P[k];
    if (x == null || isNaN(x)) return null;
    if (k === "hpi") return x > 85 ? C.red : null;
    if (p.fixed || !l.on) return null;
    if ((l.alo != null && x < l.alo) || (l.ahi != null && x > l.ahi)) return C.red;
    if ((l.tlo != null && x < l.tlo) || (l.thi != null && x > l.thi)) return C.yellow;
    return C.green;
  }
  function valOf(v, k) { return v[k]; }
  function fmtP(k, x) { return fmt(x, P[k].dec); }

  /* ---------- Main draw ---------- */
  Sim.prototype.drawHS = function () {
    var ctx = this.ctx, v = this.v;
    if (!this.alta) this.alta = freshState();
    var a = this.alta;
    // HPI updates every 20 s (simulation time)
    var tick = Math.floor(this.simT / 20);
    if (tick !== a.hpiTick) {
      a.hpiTick = tick; a.hpiShown = Math.round(v.hpi);
      if (a.hpiShown > 85) a.hpiHigh++; else { a.hpiHigh = 0; a.hpiAck = false; }
    }
    // GDT accumulation
    if (a.gdt && a.gdt.state === "active") {
      var sec = Math.floor(this.simT);
      if (sec !== a.gdt.lastSec) {
        a.gdt.lastSec = sec; a.gdt.total++;
        a.gdt.params.forEach(function (g) { var x = v[g.k]; if (x >= g.lo && x <= g.hi) g.inT++; });
      }
    }
    this.altaFrt();
    this.altaLogAlarms();
    if (a.lockAfter != null && a.lockedAt == null && this.realT > a.lockAfter) { a.lockedAt = this.realT; this.locked = true; }

    ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
    this.altaStatus();
    var gx = a.panel ? 316 : 8;
    if (a.view === "cockpit") this.altaCockpit(gx);
    else if (a.view === "split") this.altaSplit(gx);
    else this.altaTrend(gx, 872, a.keys);
    if (a.panel) this.altaPanel();
    this.altaHpiAlert();
    this.altaNav();
    this.drawOverlay();
  };

  /* ---------- Status bar ---------- */
  Sim.prototype.altaAlarms = function () {
    var a = this.alta, v = this.v, out = [];
    if (a.nonPulsatile) return [{ k: "np", pri: 1, msg: "Non-Pulsatile Mode" }];
    var shown = a.keys.concat(["map", "sys", "dia", "hr"]);
    var seen = {};
    shown.forEach(function (k) {
      if (seen[k]) return; seen[k] = 1;
      var l = a.lim[k], x = k === "hpi" ? a.hpiShown : v[k];
      if (k === "hpi") { if (x > 85) out.push({ k: k, pri: 2, msg: "Alarm: HPI – Sustained Hypotension Risk" }); return; }
      if (P[k].fixed || !l.on) return;
      var label = (P[k].sub ? P[k].name + "ART" : P[k].name);
      if (l.alo != null && x < l.alo) out.push({ k: k, pri: 2, msg: "Alarm: FloTrac " + label + " is below low limit" });
      else if (l.ahi != null && x > l.ahi) out.push({ k: k, pri: 2, msg: "Alarm: FloTrac " + label + " is above high limit" });
    });
    return out;
  };
  Sim.prototype.altaLogAlarms = function () {
    var a = this.alta, cur = {}, self = this;
    this.altaAlarms().forEach(function (x) {
      cur[x.msg] = 1;
      if (!a.prevAl[x.msg]) a.events.unshift({ t: self.simT, kind: "alarm", text: x.msg });
    });
    a.prevAl = cur;
  };
  Sim.prototype.altaStatus = function () {
    var ctx = this.ctx, a = this.alta, v = this.v, al = this.alarmOn() ? this.altaAlarms() : [], self = this;
    var n = al.length, idx = n ? Math.floor(this.realT / 2) % n : 0;
    ctx.fillStyle = n ? (al[idx].pri === 2 ? C.red : "#b88a00") : "#1a1a1f"; ctx.fillRect(0, 0, 640, 40);
    if (n) txt(ctx, "#" + (idx + 1) + "/" + n + "  " + al[idx].msg, 14, 28, 20, "#fff", "left", "500");
    else if (!this.alarmOn()) txt(ctx, "Audible alarms silenced", 14, 28, 20, C.yellow, "left", "500");
    this.hit(0, 0, 640, 40, function () { this.altaAlarmList(); });
    ctx.fillStyle = "#1a1a1f"; ctx.fillRect(644, 0, 636, 40);
    txt(ctx, a.pr.id, 660, 27, 16, "#fff");
    // snapshot
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(756, 13, 24, 16); ctx.beginPath(); ctx.arc(768, 21, 4.5, 0, 7); ctx.stroke();
    this.hit(748, 4, 40, 34, function () { this.toast("Snapshot: insert a USB stick to save screen captures"); });
    if (a.alwaysHpi) {
      var hc = a.hpiShown > 85 ? C.red : "#fff";
      txt(ctx, (a.hpiShown == null ? "--" : a.hpiShown) + "/100", 806, 28, 18, hc, "left", "700");
      this.hit(800, 4, 80, 34, function () { this.altaOpenPanel("hpi"); });
    }
    txt(ctx, "PR " + Math.round(v.hr) + " bpm", 892, 28, 18, "#fff", "left", "500");
    // battery, brightness, volume, lock, clock
    ctx.strokeRect(1010, 14, 26, 14); ctx.fillStyle = "#fff"; ctx.fillRect(1036, 18, 3, 6); ctx.fillRect(1013, 17, 18, 8);
    ctx.beginPath(); ctx.arc(1060, 21, 6, 0, 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(1082, 17); ctx.lineTo(1088, 17); ctx.lineTo(1094, 12); ctx.lineTo(1094, 30); ctx.lineTo(1088, 25); ctx.lineTo(1082, 25); ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = this.locked ? C.yellow : "#fff"; ctx.strokeRect(1110, 20, 14, 11); ctx.beginPath(); ctx.arc(this.locked ? 1117 : 1113, 19, 5, Math.PI, 0); ctx.stroke();
    txt(ctx, clock(this.simT), 1268, 19, 14, "#fff", "right"); txt(ctx, "11/20/2026", 1268, 35, 12, "#fff", "right");
    this.hit(1000, 0, 280, 40, function () { this.altaQuick(); }, "lock");
  };
  Sim.prototype.altaQuick = function () {
    var a = this.alta, self = this;
    this.modal = { outside: true, draw: function (ctx) {
      var x = 860, y = 44, w = 410, h = 360;
      ctx.fillStyle = C.panel2; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.btnHi; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
      txt(ctx, "Brightness", x + 20, y + 36, 18, "#fff");
      ctx.fillStyle = "#333"; ctx.fillRect(x + 70, y + 52, 270, 14); ctx.fillStyle = C.btnHi; ctx.fillRect(x + 70, y + 52, 270 * a.bright / 5, 14);
      self.button(x + 16, y + 44, 44, 32, "−", function () { a.bright = Math.max(1, a.bright - 1); self.bright = a.bright; }, { fill: C.btn, size: 22 });
      self.button(x + 350, y + 44, 44, 32, "+", function () { a.bright = Math.min(5, a.bright + 1); self.bright = a.bright; }, { fill: C.btn, size: 22 });
      txt(ctx, "Alarm Volume  " + a.vol + "%", x + 20, y + 112, 18, "#fff");
      ctx.fillStyle = "#333"; ctx.fillRect(x + 70, y + 128, 270, 14); ctx.fillStyle = C.btnHi; ctx.fillRect(x + 70, y + 128, 270 * a.vol / 100, 14);
      self.button(x + 16, y + 120, 44, 32, "−", function () { a.vol = Math.max(20, a.vol - 20); if (a.vol === 20) self.toast("Do not lower the alarm volume below an audible level"); }, { fill: C.btn, size: 22 });
      self.button(x + 350, y + 120, 44, 32, "+", function () { a.vol = Math.min(100, a.vol + 20); }, { fill: C.btn, size: 22 });
      txt(ctx, "Lock", x + 20, y + 192, 18, "#fff");
      if (self.locked) self.button(x + 20, y + 210, w - 40, 54, "Unlock Screen", function () { self.locked = false; a.lockedAt = null; a.lockAfter = null; self.closeModal(); self.toast("Screen unlocked"); }, { fill: C.btnHi });
      else [["1 min", 60], ["10 min", 600], ["20 min", 1200]].forEach(function (o, i) {
        self.button(x + 20 + i * 126, y + 210, 118, 54, o[0], function () { a.lockAfter = self.realT + o[1] / 60 * 3; self.closeModal(); self.toast("Screen will lock after " + o[0] + " (shortened in simulation)"); }, { fill: C.btn, size: 18 });
      });
      self.button(x + 20, y + 290, w - 40, 50, "Lock Now", function () { self.locked = true; a.lockedAt = self.realT; self.closeModal(); }, { fill: C.btn, size: 18 });
    } };
    // allow quick settings even when locked
    var m = this.modal; m.lockOk = true;
  };

  /* ---------- Trend view (graphical / tabular) ---------- */
  Sim.prototype.altaTrend = function (gx, gx2, keys, compact) {
    var ctx = this.ctx, a = this.alta, v = this.v, self = this;
    var tileW = compact ? 230 : 392, tx = gx2 + 8, x0 = gx + 52, pw = gx2 - x0 - 6;
    // ART waveform row
    ctx.fillStyle = C.panel; ctx.fillRect(gx, 44, gx2 - gx, 118);
    txt(ctx, "130", x0 - 6, 60, 13, C.dim, "right"); txt(ctx, "50", x0 - 6, 156, 13, C.dim, "right");
    txt(ctx, "25", gx + 22, 108, 22, "#fff", "center", "500"); txt(ctx, "mm/sec", gx + 22, 124, 10, C.dim, "center");
    if (!a.nonPulsatile) waveFromBuf(ctx, this.artBuf, this.head, x0, 48, pw, 110, 50, 130, C.art);
    this.hit(gx, 44, gx2 - gx, 118, function () { this.altaZero(); });
    this.altaArtTile(tx, 44, tileW, 118);
    // key parameter rows
    var n = keys.length, top = 168, bottom = 664, rh = (bottom - top) / Math.max(1, n);
    keys.forEach(function (k, i) {
      var y = top + i * rh;
      if (a.tabular) self.altaTableRow(gx, gx2, y, rh - 6, k, x0, pw);
      else self.altaPlot(gx, gx2, y, rh - 6, k, x0, pw);
      self.altaTile(tx, y, tileW, rh - 6, k);
    });
    // x axis
    ctx.fillStyle = C.panel; ctx.fillRect(gx, 668, gx2 - gx, 30);
    if (a.tabular) {
      for (var c = 0; c < 7; c++) { var t = Math.max(0, this.simT - (6 - c) * a.inc); txt(ctx, hhmm(t), x0 + pw * (c + 0.5) / 7, 688, 13, C.dim, "center"); }
    } else {
      txt(ctx, hhmm(Math.max(0, this.simT - a.range)), x0, 688, 13, C.dim); txt(ctx, hhmm(this.simT), x0 + pw - 60, 688, 13, C.dim, "right");
      txt(ctx, (RANGES.filter(function (r) { return r[0] === a.range; })[0] || [0, ""])[1], x0 + pw / 2, 688, 13, "#fff", "center");
    }
    this.hit(gx, 668, gx2 - gx - 70, 30, function () { this.altaRangeMenu(); });
    // graphical/tabular toggle
    var sx = gx2 - 60;
    ctx.fillStyle = a.tabular ? C.btnHi : "#444"; ctx.fillRect(sx, 674, 48, 20);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(a.tabular ? sx + 38 : sx + 10, 684, 8, 0, 7); ctx.fill();
    this.hit(sx - 6, 668, 62, 30, function () { a.tabular = !a.tabular; });
    if (!compact && keys.length < 5) {
      this.button(tx + tileW - 44, 670, 40, 26, "+", function () { this.altaParamMenu(null, "select"); }, { fill: C.btn, size: 22 });
    }
  };
  Sim.prototype.altaArtTile = function (x, y, w, h) {
    var ctx = this.ctx, v = this.v, a = this.alta, col = statusColor(a, "map", v.map);
    ctx.fillStyle = col === C.red && this.alarmOn() && Math.floor(this.realT * 2) % 2 ? "#5a0c0f" : C.panel; ctx.fillRect(x, y, w, h);
    if (col) { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); }
    ctx.fillStyle = C.teal; ctx.fillRect(x + 10, y + 8, 78, 18); txt(ctx, "IQ Sensor", x + 49, y + 22, 12, "#fff", "center", "500");
    txt(ctx, "A-Line", x + 10, y + 42, 12, "#fff");
    if (a.nonPulsatile) { txt(ctx, "--/--", x + w - 70, y + 66, 44, "#fff", "right", "500"); }
    else {
      txt(ctx, v.sys + "/" + v.dia, x + w - 70, y + 62, 44, "#fff", "right", "500");
      txt(ctx, "(" + Math.round(v.map) + ")", x + w - 96, y + 108, 38, "#fff", "right", "300");
    }
    txt(ctx, "ART", x + 10, y + 92, 26, "#fff", "left", "500"); txt(ctx, "mmHg", x + 10, y + 108, 11, C.dim);
    txt(ctx, String(Math.round(v.hr)), x + w - 10, y + 70, 28, "#fff", "right"); txt(ctx, "PR bpm", x + w - 10, y + 88, 11, C.dim, "right");
    this.hit(x, y, w, h, function () { this.altaParamMenu("map", "targets"); });
  };
  Sim.prototype.altaPlot = function (gx, gx2, y, h, k, x0, pw) {
    var ctx = this.ctx, a = this.alta, l = a.lim[k], lo = l.scale[0], hi = l.scale[1], self = this;
    ctx.fillStyle = C.panel; ctx.fillRect(gx, y, gx2 - gx, h);
    var py = function (x) { return y + 6 + (1 - (clamp(x, lo, hi) - lo) / (hi - lo)) * (h - 12); };
    if (!P[k].fixed && l.on && l.tlo != null && a.trendColors) { ctx.fillStyle = C.zone; ctx.fillRect(x0, py(l.thi), pw, py(l.tlo) - py(l.thi)); }
    ctx.strokeStyle = C.line; ctx.lineWidth = 1;
    for (var q = 1; q < 6; q++) { var xx = x0 + pw * q / 6; ctx.beginPath(); ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); ctx.stroke(); }
    txt(ctx, String(hi), x0 - 6, y + 16, 13, C.dim, "right"); txt(ctx, String(lo), x0 - 6, y + h - 4, 13, C.dim, "right");
    if (!P[k].fixed && l.on) {
      if (l.ahi != null && l.ahi < hi) { ctx.fillStyle = C.red; ctx.fillRect(gx + 4, py(l.ahi) - 8, 40, 16); txt(ctx, fmt(l.ahi, P[k].dec), gx + 24, py(l.ahi) + 5, 12, "#fff", "center"); }
      if (l.alo != null && l.alo > lo) { ctx.fillStyle = C.red; ctx.fillRect(gx + 4, py(l.alo) - 8, 40, 16); txt(ctx, fmt(l.alo, P[k].dec), gx + 24, py(l.alo) + 5, 12, "#fff", "center"); }
    }
    if (k === "hpi") { ctx.setLineDash([5, 5]); ctx.strokeStyle = C.red; ctx.beginPath(); ctx.moveTo(x0, py(85)); ctx.lineTo(x0 + pw, py(85)); ctx.stroke(); ctx.setLineDash([]); }
    var start = Math.max(0, Math.floor(this.simT - a.range)), step = Math.max(1, Math.floor(a.range / 300)), prev = null;
    ctx.lineWidth = 2.5;
    for (var s = start; s < this.hist.length; s += step) {
      var x = this.hist[s][k], px = x0 + (s - (this.simT - a.range)) / a.range * pw, pyy = py(x);
      var col = k === "hpi" ? (x > 85 ? C.red : "#fff") : (a.trendColors ? (statusColor(a, k, x) || "#fff") : "#fff");
      if (prev) { ctx.strokeStyle = col; ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(px, pyy); ctx.stroke(); }
      prev = [px, pyy];
    }
    var cur = this.v[k];
    if (cur > hi || cur < lo) { ctx.fillStyle = "#4aa3ff"; ctx.beginPath(); var ay = cur > hi ? y + 10 : y + h - 10, dir = cur > hi ? -1 : 1; ctx.moveTo(x0 + pw - 14, ay - 6 * dir); ctx.lineTo(x0 + pw - 4, ay - 6 * dir); ctx.lineTo(x0 + pw - 9, ay + 6 * dir); ctx.fill(); }
    this.hit(gx, y, gx2 - gx, h, function () { self.altaParamMenu(k, "targets"); });
  };
  Sim.prototype.altaTableRow = function (gx, gx2, y, h, k, x0, pw) {
    var ctx = this.ctx, a = this.alta, self = this, now = Math.floor(this.simT);
    ctx.fillStyle = C.panel; ctx.fillRect(gx, y, gx2 - gx, h);
    for (var c = 0; c < 7; c++) {
      var t = now - (6 - c) * a.inc, cx = x0 + pw * c / 7;
      ctx.strokeStyle = C.line; ctx.strokeRect(cx + 3, y + 6, pw / 7 - 6, h - 12);
      var hs = t >= 0 ? this.hist[Math.min(t, this.hist.length - 1)] : null;
      var x = hs ? hs[k] : null;
      txt(ctx, x == null ? "" : fmtP(k, x), cx + pw / 14, y + h / 2 + 10, 28, x != null && statusColor(a, k, x) === C.red ? C.red : "#fff", "center", "300");
    }
    this.hit(gx, y, gx2 - gx, h, function () { self.altaParamMenu(k, "targets"); });
  };
  Sim.prototype.altaTile = function (x, y, w, h, k) {
    var ctx = this.ctx, a = this.alta, v = this.v, p = P[k], self = this;
    var x0v = k === "hpi" ? a.hpiShown : v[k], col = statusColor(a, k, x0v);
    var alarmBlink = col === C.red && this.alarmOn() && Math.floor(this.realT * 2) % 2;
    if (alarmBlink) { var g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, "#2a0607"); g.addColorStop(1, C.red); ctx.fillStyle = g; } else ctx.fillStyle = C.panel;
    ctx.fillRect(x, y, w, h);
    if (col && k !== "hpi") { ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); }
    if (k === "hpi" && col) { ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); }
    ctx.fillStyle = C.teal; ctx.fillRect(x + 10, y + 8, 78, 18); txt(ctx, "IQ Sensor", x + 49, y + 22, 12, "#fff", "center", "500");
    txt(ctx, "A-Line", x + 10, y + 40, 12, "#fff");
    var big = Math.min(70, h * 0.62);
    txt(ctx, x0v == null ? "--" : fmtP(k, x0v), x + w - 12, y + h * 0.62, big, "#fff", "right", "300");
    txt(ctx, p.name, x + w - (p.unit ? 12 + Math.min(110, ctx.measureText ? 8 * p.unit.length + 6 : 60) : 12), y + h - 10, 24, "#fff", "right", "500");
    txt(ctx, p.unit, x + w - 12, y + h - 10, 12, C.dim, "right");
    if (k === "hpi") {
      txt(ctx, "Hypotension", x + 10, y + h - 46, 12, C.dim); txt(ctx, "Threshold: " + a.hpiThr + " mmHg ✎", x + 10, y + h - 30, 12, "#fff");
      this.hit(x, y + h - 60, 170, 60, function () { this.altaHpiSettings(); });
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.strokeRect(x + w - 34, y + 8, 24, 18); ctx.beginPath(); ctx.moveTo(x + w - 28, y + 20); ctx.lineTo(x + w - 22, y + 14); ctx.lineTo(x + w - 16, y + 18); ctx.stroke();
      this.hit(x + w - 44, y, 44, 34, function () { this.altaOpenPanel("hpi"); });
    }
    if (k === "svr" || k === "svri") { txt(ctx, a.cvpSrc, x + 10, y + h - 46, 12, C.dim); txt(ctx, a.cvp + " CVP mmHg ✎", x + 10, y + h - 28, 13, "#fff"); }
    if (a.gdt && a.gdt.state !== "setup") {
      var g = a.gdt.params.filter(function (q) { return q.k === k; })[0];
      if (g) txt(ctx, (a.gdt.total ? Math.round(g.inT / a.gdt.total * 100) : 0) + "%", x + w - 12, y + 24, 16, C.green, "right", "700");
    }
    var d = this.altaDelta(k, 600);
    if (d != null && k !== "hpi" && !(a.gdt && a.gdt.state !== "setup")) txt(ctx, (d >= 0 ? "↑" : "↓") + Math.abs(Math.round(d)) + "% 10 min", x + w - 12, y + 22, 12, C.dim, "right");
    if (!this.alarmOn() && col === C.red) txt(ctx, "🔕", x + w - 120, y + 24, 14, "#fff");
    this.hit(x, y, w, h, function () { self.altaParamMenu(k, "targets"); });
    this.hit(x + w - 140, y + h - 40, 130, 40, function () { self.altaParamMenu(k, "select"); });
  };
  Sim.prototype.altaDelta = function (k, back) {
    var n = this.hist.length; if (n < back + 2) return null;
    var now = this.hist[n - 1][k], old = this.hist[n - 1 - back][k];
    if (!old) return null; return (now - old) / Math.abs(old) * 100;
  };
  Sim.prototype.altaRangeMenu = function () {
    var a = this.alta, list = a.tabular ? INCS : RANGES, self = this;
    this.modal = { outside: true, draw: function (ctx) {
      var x = 240, y = 470, w = 600, h = 190;
      ctx.fillStyle = C.panel2; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.btnHi; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
      txt(ctx, a.tabular ? "Tabular Increment" : "Time Range", x + 20, y + 34, 20, "#fff", "left", "500");
      list.forEach(function (r, i) {
        var cur = a.tabular ? a.inc === r[0] : a.range === r[0];
        self.button(x + 20 + (i % 3) * 190, y + 54 + Math.floor(i / 3) * 64, 178, 54, r[1], function () { if (a.tabular) a.inc = r[0]; else a.range = r[0]; self.closeModal(); }, { fill: cur ? C.btnHi : C.btn, size: 18 });
      });
    } };
  };

  /* ---------- Parameter configuration menu ---------- */
  Sim.prototype.altaParamMenu = function (k, tab) {
    var a = this.alta, self = this;
    var st = { tab: tab || "targets", k: k || null, slot: k ? a.keys.indexOf(k) : -1, d: null };
    function load() { if (st.k) { var l = a.lim[st.k]; st.d = { alo: l.alo, tlo: l.tlo, thi: l.thi, ahi: l.ahi, on: l.on, smin: l.scale[0], smax: l.scale[1] }; } }
    load();
    this.modal = { outside: false, draw: function (ctx) {
      var x = 120, y = 70, w = 1040, h = 600;
      ctx.fillStyle = "#0d0d10"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.btnHi; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
      // left: key parameter list
      ctx.fillStyle = C.panel; ctx.fillRect(x, y, 240, h);
      txt(ctx, "Key Parameters", x + 16, y + 34, 17, C.dim);
      a.keys.forEach(function (kk, i) {
        var yy = y + 50 + i * 62, cur = kk === st.k;
        self.button(x + 46, yy, 186, 54, "", function () { st.k = kk; st.slot = i; load(); }, { fill: cur ? C.sel : C.btn });
        txt(ctx, P[kk].name, x + 60, yy + 34, 20, "#fff", "left", "500");
        txt(ctx, fmtP(kk, kk === "hpi" ? a.hpiShown : self.v[kk]), x + 222, yy + 36, 22, "#fff", "right", "300");
        if (a.keys.length > 1) self.button(x + 8, yy + 12, 32, 32, "✕", function () { a.keys.splice(i, 1); if (st.k === kk) { st.k = a.keys[0]; st.slot = 0; load(); } }, { fill: "#222", size: 16 });
      });
      if (a.keys.length < 5) self.button(x + 46, y + 50 + a.keys.length * 62, 186, 48, "+", function () { st.slot = a.keys.length; st.k = null; st.tab = "select"; }, { fill: C.btn, size: 26 });
      // tabs
      var tabs = [["select", "Select Parameter"], ["targets", "Set Targets"], ["scale", "Y Scale"]];
      if (st.k === "svr" || st.k === "svri") tabs.push(["cvp", "CVP Entry"]);
      tabs.forEach(function (t, i) {
        self.button(x + 260 + i * 190, y + 14, 180, 46, t[1], function () { st.tab = t[0]; }, { fill: st.tab === t[0] ? C.sel : C.btn, size: 17 });
      });
      self.button(x + w - 60, y + 10, 50, 50, "⌂", function () { self.closeModal(); }, { fill: C.btn, size: 26 });
      var cx = x + 260, cy = y + 90, cw = w - 280;
      if (st.tab === "select") {
        CATS.forEach(function (cat, ci) {
          txt(ctx, cat, cx + ci * 190, cy + 20, 18, C.dim);
          Object.keys(P).filter(function (pk) { return P[pk].cat === cat && pk !== "sys" && pk !== "dia"; }).forEach(function (pk, j) {
            var inKeys = a.keys.indexOf(pk) >= 0, isCur = pk === st.k;
            self.button(cx + ci * 190, cy + 34 + j * 58, 176, 50, P[pk].name, function () {
              if (inKeys && !isCur) { self.toast(P[pk].name + " is already a key parameter"); return; }
              if (st.slot >= 0 && st.slot < a.keys.length) a.keys[st.slot] = pk; else { a.keys.push(pk); st.slot = a.keys.length - 1; }
              st.k = pk; load(); st.tab = "targets";
            }, { fill: isCur ? "#b8961a" : inKeys ? C.sel : C.btn, size: 18 });
          });
        });
        txt(ctx, "Blue: key parameters · Yellow: current selection", cx, y + h - 24, 15, C.dim);
      } else if (!st.k) {
        txt(ctx, "Select a parameter first.", cx, cy + 40, 20, "#fff");
      } else if (st.tab === "targets") {
        var p = P[st.k], d = st.d, dec = p.dec, stp = dec ? 0.1 : (st.k === "svr" || st.k === "svri" || st.k === "dpdt" ? 10 : 1);
        txt(ctx, p.name + " (" + p.unit + ")   current " + fmtP(st.k, st.k === "hpi" ? a.hpiShown : self.v[st.k]), cx, cy + 10, 22, "#fff", "left", "500");
        if (p.fixed) {
          txt(ctx, st.k === "hpi" ? "The alarm limit and target range for HPI are not adjustable (alarm > 85)." : "Targets are not available for this parameter.", cx, cy + 70, 19, C.yellow);
          if (st.k === "hpi") self.button(cx, cy + 110, 360, 56, "Hypotension Threshold: " + a.hpiThr + " mmHg", function () { self.altaHpiSettings(); }, { fill: C.btn, size: 18 });
        } else {
          var rows = [["ahi", "Alarm High", C.red], ["thi", "Target High", C.green], ["tlo", "Target Low", C.green], ["alo", "Alarm Low", C.red]];
          rows.forEach(function (r, i) {
            var ry = cy + 50 + i * 78;
            ctx.fillStyle = r[2]; ctx.fillRect(cx, ry, 8, 60);
            txt(ctx, r[1], cx + 22, ry + 38, 20, "#fff");
            self.button(cx + 220, ry, 80, 60, "−", function () { d[r[0]] = Math.round((d[r[0]] - stp) * 10) / 10; }, { fill: C.btn, size: 32 });
            ctx.fillStyle = "#000"; ctx.fillRect(cx + 310, ry, 160, 60); ctx.strokeStyle = C.line; ctx.strokeRect(cx + 310, ry, 160, 60);
            txt(ctx, fmt(d[r[0]], dec), cx + 390, ry + 42, 30, "#fff", "center", "300");
            self.button(cx + 480, ry, 80, 60, "+", function () { d[r[0]] = Math.round((d[r[0]] + stp) * 10) / 10; }, { fill: C.btn, size: 32 });
          });
          self.button(cx + 600, cy + 50, 150, 60, d.on ? "Alarms On" : "Alarms Off", function () { d.on = !d.on; if (!d.on) self.toast("Do not turn off alarms where patient safety could be compromised"); }, { fill: d.on ? C.btnHi : "#5a2a2a", size: 18 });
          self.button(cx + 600, cy + 128, 150, 60, "Defaults", function () { var df = p.def; d.alo = df[0]; d.tlo = df[1]; d.thi = df[2]; d.ahi = df[3]; d.on = true; }, { fill: C.btn, size: 18 });
          // gauge preview
          var gy = cy + 380; var lo = Math.min(d.alo, l2(st.k).scale[0]), hi = Math.max(d.ahi, l2(st.k).scale[1]);
          function X(val) { return cx + (val - lo) / (hi - lo) * 740; }
          ctx.fillStyle = C.red; ctx.fillRect(cx, gy, 740, 18);
          ctx.fillStyle = C.yellow; ctx.fillRect(X(d.alo), gy, X(d.ahi) - X(d.alo), 18);
          ctx.fillStyle = C.green; ctx.fillRect(X(d.tlo), gy, X(d.thi) - X(d.tlo), 18);
          var cv = self.v[st.k]; ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.moveTo(X(clamp(cv, lo, hi)), gy - 4); ctx.lineTo(X(clamp(cv, lo, hi)) - 8, gy - 16); ctx.lineTo(X(clamp(cv, lo, hi)) + 8, gy - 16); ctx.fill();
          self.button(cx + cw - 200, y + h - 70, 190, 54, "Save", function () {
            if (!(d.alo <= d.tlo && d.tlo <= d.thi && d.thi <= d.ahi)) { self.toast("Invalid range: Alarm Low ≤ Target Low ≤ Target High ≤ Alarm High"); return; }
            var l = a.lim[st.k]; l.alo = d.alo; l.tlo = d.tlo; l.thi = d.thi; l.ahi = d.ahi; l.on = d.on;
            self.toast(p.name + " alarms/targets saved"); self.closeModal();
          }, { fill: C.btnHi });
          self.button(cx + cw - 400, y + h - 70, 190, 54, "Cancel", function () { self.closeModal(); }, { fill: C.btn });
        }
      } else if (st.tab === "scale") {
        var dd = st.d, sp = P[st.k], sstp = sp.dec ? 0.5 : (st.k === "svr" || st.k === "svri" || st.k === "dpdt" ? 100 : 5);
        txt(ctx, sp.name + " Y scale", cx, cy + 10, 22, "#fff", "left", "500");
        [["smax", "Upper"], ["smin", "Lower"]].forEach(function (r, i) {
          var ry = cy + 50 + i * 90;
          txt(ctx, r[1], cx, ry + 40, 22, "#fff");
          self.button(cx + 180, ry, 80, 60, "−", function () { dd[r[0]] = Math.round((dd[r[0]] - sstp) * 10) / 10; }, { fill: C.btn, size: 32 });
          ctx.fillStyle = "#000"; ctx.fillRect(cx + 270, ry, 160, 60);
          txt(ctx, fmt(dd[r[0]], sp.dec), cx + 350, ry + 42, 30, "#fff", "center", "300");
          self.button(cx + 440, ry, 80, 60, "+", function () { dd[r[0]] = Math.round((dd[r[0]] + sstp) * 10) / 10; }, { fill: C.btn, size: 32 });
        });
        self.button(cx + cw - 200, y + h - 70, 190, 54, "Save", function () { if (dd.smin >= dd.smax) { self.toast("Lower must be less than upper"); return; } a.lim[st.k].scale = [dd.smin, dd.smax]; self.closeModal(); }, { fill: C.btnHi });
        self.button(cx + cw - 400, y + h - 70, 190, 54, "Defaults", function () { dd.smin = sp.scale[0]; dd.smax = sp.scale[1]; }, { fill: C.btn });
      } else if (st.tab === "cvp") {
        txt(ctx, "CVP Entry (SVR calculation)", cx, cy + 10, 22, "#fff", "left", "500");
        self.button(cx, cy + 50, 80, 60, "−", function () { a.cvp = Math.max(0, a.cvp - 1); a.cvpSrc = "Manual"; }, { fill: C.btn, size: 32 });
        ctx.fillStyle = "#000"; ctx.fillRect(cx + 90, cy + 50, 160, 60); txt(ctx, a.cvp + " mmHg", cx + 170, cy + 92, 28, "#fff", "center", "300");
        self.button(cx + 260, cy + 50, 80, 60, "+", function () { a.cvp = Math.min(30, a.cvp + 1); a.cvpSrc = "Manual"; }, { fill: C.btn, size: 32 });
        txt(ctx, "Default CVP when no source is detected: 5 mmHg. Review periodically.", cx, cy + 160, 17, C.dim);
      }
    } };
    function l2(kk) { return a.lim[kk]; }
  };

  /* ---------- Cockpit ---------- */
  Sim.prototype.altaCockpit = function (gx) {
    var ctx = this.ctx, a = this.alta, self = this, keys = a.cockpit, n = keys.length;
    var cols = n <= 4 ? 2 : 3, rows = Math.ceil(n / cols), aw = W - 8 - gx, cw = aw / cols, ch = 652 / rows;
    keys.forEach(function (k, i) {
      var x = gx + (i % cols) * cw, y = 46 + Math.floor(i / cols) * ch;
      self.altaGauge(x + 4, y + 4, cw - 8, ch - 8, k);
    });
    if (n < 6) this.button(W - 60, 652, 50, 40, "+", function () {
      var avail = Object.keys(P).filter(function (pk) { return keys.indexOf(pk) < 0 && pk !== "sys" && pk !== "dia"; });
      keys.push(avail[0]); self.toast(P[avail[0]].name + " added – touch the globe to change parameter");
    }, { fill: C.btn, size: 26 });
  };
  Sim.prototype.altaGauge = function (x, y, w, h, k) {
    var ctx = this.ctx, a = this.alta, l = a.lim[k], p = P[k], val = k === "hpi" ? a.hpiShown : this.v[k], self = this;
    ctx.fillStyle = "#0a0a0c"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = "#222"; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = C.teal; ctx.fillRect(x + 10, y + 10, 78, 18); txt(ctx, "IQ Sensor", x + 49, y + 24, 12, "#fff", "center", "500");
    var cx = x + w / 2, cy = y + h * 0.56, r = Math.min(w, h) * 0.36, lo = l.scale[0], hi = l.scale[1];
    var A0 = Math.PI * 0.75, A1 = Math.PI * 2.25;
    function ang(vv) { return A0 + (clamp(vv, lo, hi) - lo) / (hi - lo) * (A1 - A0); }
    function arc(v1, v2, c) { ctx.strokeStyle = c; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(cx, cy, r, ang(v1), ang(v2)); ctx.stroke(); }
    if (k === "hpi") { arc(lo, 50, "#777"); arc(50, 85, C.yellow); arc(85, hi, C.red); }
    else if (p.fixed || !l.on) arc(lo, hi, "#555");
    else { arc(lo, hi, C.red); arc(Math.max(lo, l.alo), Math.min(hi, l.ahi), C.yellow); arc(Math.max(lo, l.tlo), Math.min(hi, l.thi), C.green); }
    var t = ang(val); ctx.fillStyle = "#fff"; ctx.beginPath();
    ctx.moveTo(cx + Math.cos(t) * (r + 14), cy + Math.sin(t) * (r + 14)); ctx.lineTo(cx + Math.cos(t - 0.07) * (r - 14), cy + Math.sin(t - 0.07) * (r - 14)); ctx.lineTo(cx + Math.cos(t + 0.07) * (r - 14), cy + Math.sin(t + 0.07) * (r - 14)); ctx.fill();
    var col = statusColor(a, k, val), blink = col === C.red && this.alarmOn() && Math.floor(this.realT * 2) % 2;
    txt(ctx, val == null ? "--" : fmtP(k, val), cx, cy + r * 0.22, r * 0.62, blink ? C.red : "#fff", "center", "300");
    txt(ctx, p.name, cx, cy + r * 0.62, 26, "#fff", "center", "500"); txt(ctx, p.unit, cx, cy + r * 0.62 + 22, 14, C.dim, "center");
    txt(ctx, fmt(lo, p.dec), cx - r * 0.75, cy + r * 0.95, 13, C.dim, "center"); txt(ctx, fmt(hi, p.dec), cx + r * 0.75, cy + r * 0.95, 13, C.dim, "center");
    this.hit(x, y, w, h, function () {
      var i = a.cockpit.indexOf(k);
      self.modal = { outside: true, draw: function (ctx2) {
        var mx = 340, my = 180, mw = 600, mh = 360;
        ctx2.fillStyle = C.panel2; ctx2.fillRect(mx, my, mw, mh); ctx2.strokeStyle = C.btnHi; ctx2.strokeRect(mx, my, mw, mh);
        txt(ctx2, "Globe: " + p.name, mx + 20, my + 40, 22, "#fff", "left", "500");
        Object.keys(P).filter(function (pk) { return pk !== "sys" && pk !== "dia"; }).forEach(function (pk, j) {
          self.button(mx + 20 + (j % 4) * 142, my + 60 + Math.floor(j / 4) * 58, 134, 50, P[pk].name, function () { a.cockpit[i] = pk; self.closeModal(); }, { fill: pk === k ? "#b8961a" : a.cockpit.indexOf(pk) >= 0 ? C.sel : C.btn, size: 17 });
        });
        self.button(mx + 20, my + mh - 64, 200, 50, "Set Targets", function () { self.altaParamMenu(k, "targets"); }, { fill: C.btn, size: 17 });
        if (a.cockpit.length > 1) self.button(mx + 230, my + mh - 64, 200, 50, "Remove", function () { a.cockpit.splice(i, 1); self.closeModal(); }, { fill: "#5a2a2a", size: 17 });
      } };
    });
  };

  /* ---------- Split screen ---------- */
  Sim.prototype.altaSplit = function (gx) {
    var ctx = this.ctx, a = this.alta, self = this, mid = gx + Math.round((W - gx) * 0.5);
    this.altaTrend(gx, mid - 236, a.keys.slice(0, 4), true);
    var rx = mid + 2, rw = W - 8 - rx;
    ctx.fillStyle = "#08080a"; ctx.fillRect(rx, 44, rw, 654);
    var icons = [["physio", "♥"], ["gps", "⊕"], ["trend2", "∿"]];
    icons.forEach(function (ic, i) { self.button(W - 56, 52 + i * 58, 48, 50, ic[1], function () { a.split = ic[0]; }, { fill: a.split === ic[0] ? C.sel : C.btn, size: 24 }); });
    var cw = rw - 60;
    if (a.split === "physio") this.altaPhysio(rx, cw);
    else if (a.split === "gps") this.altaGps(rx, cw);
    else this.altaTrend(rx, rx + cw - 160, ["map", "hr", "dpdt", "eadyn"].filter(function (k) { return a.keys.indexOf(k) < 0; }).slice(0, 4), true);
  };
  Sim.prototype.altaPhysio = function (x, w) {
    var ctx = this.ctx, v = this.v, a = this.alta, self = this, cx = x + w / 2, cy = 360;
    var beat = 1 + 0.06 * Math.max(0, Math.sin(this.realT * Math.PI * 2 * v.hr / 60));
    // vessels: arterial (red) and venous (blue) loops
    var con = clamp((v.svr - 600) / 1400, 0, 1), aw = 26 - con * 12;
    ctx.lineWidth = aw; ctx.strokeStyle = "#c62828"; ctx.beginPath(); ctx.moveTo(cx + 20, cy - 40); ctx.bezierCurveTo(cx + 170, cy - 180, cx + 190, cy + 190, cx + 40, cy + 230); ctx.stroke();
    ctx.lineWidth = 24; ctx.strokeStyle = "#1e4fa8"; ctx.beginPath(); ctx.moveTo(cx - 20, cy - 40); ctx.bezierCurveTo(cx - 170, cy - 180, cx - 190, cy + 190, cx - 40, cy + 230); ctx.stroke();
    ctx.lineWidth = 22; ctx.strokeStyle = "#7a2a6a"; ctx.beginPath(); ctx.moveTo(cx - 40, cy + 230); ctx.lineTo(cx + 40, cy + 230); ctx.stroke();
    // flow dots
    var spd = clamp(v.co / 5, 0.3, 2);
    for (var i = 0; i < 6; i++) {
      var t = ((this.realT * 0.25 * spd) + i / 6) % 1;
      var bx = Math.pow(1 - t, 3) * (cx + 20) + 3 * Math.pow(1 - t, 2) * t * (cx + 170) + 3 * (1 - t) * t * t * (cx + 190) + t * t * t * (cx + 40);
      var by = Math.pow(1 - t, 3) * (cy - 40) + 3 * Math.pow(1 - t, 2) * t * (cy - 180) + 3 * (1 - t) * t * t * (cy + 190) + t * t * t * (cy + 230);
      ctx.fillStyle = "#ffb3b3"; ctx.beginPath(); ctx.arc(bx, by, 4, 0, 7); ctx.fill();
    }
    // heart
    ctx.save(); ctx.translate(cx, cy - 60); ctx.scale(beat, beat);
    ctx.fillStyle = "#d0383f"; ctx.beginPath(); ctx.moveTo(0, 40); ctx.bezierCurveTo(-70, -10, -40, -70, 0, -38); ctx.bezierCurveTo(40, -70, 70, -10, 0, 40); ctx.fill(); ctx.restore();
    // brain
    ctx.fillStyle = "#e7a6b6"; ctx.beginPath(); ctx.ellipse(cx, 110, 46, 32, 0, 0, 7); ctx.fill();
    function mini(mx, my, k, label) {
      var val = self.v[k], col = statusColor(a, k, val);
      ctx.fillStyle = "#141418"; ctx.fillRect(mx, my, 118, 64); if (col) { ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(mx + 1, my + 1, 116, 62); }
      txt(ctx, fmtP(k, val), mx + 110, my + 38, 28, "#fff", "right", "300"); txt(ctx, label || P[k].name, mx + 8, my + 56, 13, "#fff", "left", "500");
      self.hit(mx, my, 118, 64, function () { self.altaParamMenu(k, "targets"); });
    }
    mini(x + 12, 160, "sv"); mini(x + 12, 236, "svv"); mini(x + w - 130, 160, "co"); mini(x + w - 130, 236, "hr", "PR"); mini(x + w - 130, 312, "map"); mini(cx - 59, 560, "svr");
    // SVV slope indicator (Frank-Starling)
    var sx = x + 12, sy = 320, sw = 118, sh = 84;
    ctx.fillStyle = "#141418"; ctx.fillRect(sx, sy, sw, sh);
    ctx.strokeStyle = "#ddd"; ctx.lineWidth = 2; ctx.beginPath();
    for (var q = 0; q <= 40; q++) { var px = sx + 8 + q / 40 * (sw - 16), py = sy + sh - 10 - (sh - 26) * (1 - Math.exp(-q / 12)); if (q) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
    var pos = clamp(1 - v.svv / 26, 0, 1) * 40, lx = sx + 8 + pos / 40 * (sw - 16), ly = sy + sh - 10 - (sh - 26) * (1 - Math.exp(-pos / 12));
    ctx.fillStyle = statusColor(a, "svv", v.svv) || C.green; ctx.beginPath(); ctx.arc(lx, ly, 7, 0, 7); ctx.fill();
    txt(ctx, "SVV slope", sx + 8, sy + 16, 11, C.dim);
  };
  Sim.prototype.altaGps = function (x, w) {
    var ctx = this.ctx, a = this.alta, self = this, gx = x + 70, gy = 80, gw = w - 100, gh = 520;
    var kx = a.gpsX || "sv", ky = a.gpsY || "co", lx = a.lim[kx], ly = a.lim[ky];
    function X(v) { return gx + (clamp(v, lx.scale[0], lx.scale[1]) - lx.scale[0]) / (lx.scale[1] - lx.scale[0]) * gw; }
    function Y(v) { return gy + gh - (clamp(v, ly.scale[0], ly.scale[1]) - ly.scale[0]) / (ly.scale[1] - ly.scale[0]) * gh; }
    ctx.fillStyle = "#050507"; ctx.fillRect(gx, gy, gw, gh); ctx.strokeStyle = "#333"; ctx.strokeRect(gx, gy, gw, gh);
    ctx.fillStyle = "rgba(60,150,70,0.35)"; ctx.fillRect(X(lx.tlo), gy, X(lx.thi) - X(lx.tlo), gh); ctx.fillRect(gx, Y(ly.thi), gw, Y(ly.tlo) - Y(ly.thi));
    ctx.fillStyle = "rgba(60,180,70,0.6)"; ctx.fillRect(X(lx.tlo), Y(ly.thi), X(lx.thi) - X(lx.tlo), Y(ly.tlo) - Y(ly.thi));
    ctx.setLineDash([6, 6]); ctx.strokeStyle = C.red;
    [[X(lx.alo), 1], [X(lx.ahi), 1]].forEach(function (p) { ctx.beginPath(); ctx.moveTo(p[0], gy); ctx.lineTo(p[0], gy + gh); ctx.stroke(); });
    [Y(ly.alo), Y(ly.ahi)].forEach(function (py) { ctx.beginPath(); ctx.moveTo(gx, py); ctx.lineTo(gx + gw, py); ctx.stroke(); });
    ctx.setLineDash([]);
    var iv = a.gpsInt == null ? 60 : a.gpsInt;
    if (iv) for (var i = 5; i >= 1; i--) {
      var t = Math.floor(this.simT) - i * iv; if (t < 0) continue; var h = this.hist[t];
      ctx.strokeStyle = "rgba(255,255,255," + (0.15 + 0.1 * (5 - i)) + ")"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(X(h[kx]), Y(h[ky]), 6 + (5 - i) * 2, 0, 7); ctx.stroke();
    }
    ctx.fillStyle = C.green; ctx.beginPath(); ctx.arc(X(this.v[kx]), Y(this.v[ky]), 14, 0, 7); ctx.fill();
    txt(ctx, P[kx].name + " " + P[kx].unit, gx + gw / 2, gy + gh + 34, 16, "#fff", "center", "500");
    ctx.save(); ctx.translate(gx - 44, gy + gh / 2); ctx.rotate(-Math.PI / 2); txt(ctx, P[ky].name + " " + P[ky].unit, 0, 0, 16, "#fff", "center", "500"); ctx.restore();
    txt(ctx, String(ly.scale[1]), gx - 6, gy + 12, 12, C.dim, "right"); txt(ctx, String(ly.scale[0]), gx - 6, gy + gh, 12, C.dim, "right");
    txt(ctx, String(lx.scale[0]), gx, gy + gh + 16, 12, C.dim); txt(ctx, String(lx.scale[1]), gx + gw, gy + gh + 16, 12, C.dim, "right");
    var opts = ["co", "sv", "svv", "map", "svr", "ci", "svi", "ppv", "hr", "dpdt"];
    this.hit(gx, gy + gh + 4, gw, 40, function () { var i2 = opts.indexOf(kx); a.gpsX = opts[(i2 + 1) % opts.length]; if (a.gpsX === ky) a.gpsX = opts[(i2 + 2) % opts.length]; });
    this.hit(gx - 64, gy, 60, gh, function () { var i2 = opts.indexOf(ky); a.gpsY = opts[(i2 + 1) % opts.length]; if (a.gpsY === kx) a.gpsY = opts[(i2 + 2) % opts.length]; });
    this.button(gx + gw - 120, gy + 8, 112, 36, iv ? (iv / 60) + " min" : "Off", function () { var seq = [60, 300, 600, 0]; a.gpsInt = seq[(seq.indexOf(iv) + 1) % seq.length]; }, { fill: C.btn, size: 15 });
    txt(ctx, "Touch an axis to change parameter", gx, gy - 14, 13, C.dim);
  };

  /* ---------- Navigation bar ---------- */
  Sim.prototype.altaNav = function () {
    var ctx = this.ctx, a = this.alta, self = this, al = this.altaAlarms();
    ctx.fillStyle = "#16161b"; ctx.fillRect(0, 702, W, 98);
    var items = [
      ["Alarm", 56, function () { if (this.alarmOn()) { this.silencedUntil = this.simT + 120 * 1; this.toast("Alarms silenced for 2 min (touch and hold for options)"); } else { this.silencedUntil = -1; } }, function () { this.altaAlarmMenu(); }],
      ["Patient", 170, function () { this.altaPatient(); }],
      ["Zero", 284, function () { this.altaZero(); }],
      ["Venous\nOximetry", 398, function () { this.toast("No HemoSphere oximetry cable connected"); }],
      ["Clinical\nTools", 840, function () { a.panel = a.panel ? null : "menu"; }],
      ["Screen", 950, function () { this.altaScreenMenu(); }],
      ["Gesture", 1060, function () { this.toast("Gesture control: not available in this simulation"); }],
      ["Help", 1150, function () { this.altaHelp(); }],
      ["Settings", 1236, function () { this.altaSettings(); }]
    ];
    items.forEach(function (it, i) {
      var cx = it[1], active = (i === 0 && (al.length || !self.alarmOn())) || (i === 4 && a.panel);
      ctx.fillStyle = i === 0 && al.length && self.alarmOn() ? C.red : active ? "#33343c" : "#16161b"; ctx.fillRect(cx - 52, 708, 104, 86);
      ctx.strokeStyle = "#fff"; ctx.fillStyle = "#fff"; ctx.lineWidth = 2.5; ctx.beginPath(); var cy = 736;
      if (i === 0) { ctx.moveTo(cx - 12, cy + 10); ctx.lineTo(cx + 12, cy + 10); ctx.moveTo(cx - 9, cy + 8); ctx.quadraticCurveTo(cx - 9, cy - 13, cx, cy - 13); ctx.quadraticCurveTo(cx + 9, cy - 13, cx + 9, cy + 8); if (!self.alarmOn()) { ctx.moveTo(cx - 14, cy - 14); ctx.lineTo(cx + 14, cy + 14); } }
      else if (i === 1) { ctx.arc(cx, cy - 7, 7, 0, 7); ctx.moveTo(cx - 12, cy + 14); ctx.quadraticCurveTo(cx, cy - 4, cx + 12, cy + 14); }
      else if (i === 2) { ctx.stroke(); txt(ctx, "·0·", cx, cy + 8, 22, "#fff", "center", "700"); ctx.beginPath(); }
      else if (i === 3) { ctx.moveTo(cx, cy - 14); ctx.quadraticCurveTo(cx + 12, cy + 2, cx, cy + 12); ctx.quadraticCurveTo(cx - 12, cy + 2, cx, cy - 14); }
      else if (i === 4) { ctx.rect(cx - 13, cy - 9, 26, 20); ctx.moveTo(cx - 6, cy - 9); ctx.lineTo(cx - 6, cy - 14); ctx.lineTo(cx + 6, cy - 14); ctx.lineTo(cx + 6, cy - 9); ctx.moveTo(cx, cy - 4); ctx.lineTo(cx, cy + 6); ctx.moveTo(cx - 5, cy + 1); ctx.lineTo(cx + 5, cy + 1); }
      else if (i === 5) { ctx.moveTo(cx - 14, cy + 8); ctx.lineTo(cx - 6, cy - 2); ctx.lineTo(cx + 2, cy + 4); ctx.lineTo(cx + 14, cy - 10); }
      else if (i === 6) { ctx.moveTo(cx - 6, cy + 12); ctx.lineTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy - 6); ctx.lineTo(cx + 6, cy + 12); ctx.moveTo(cx - 2, cy - 6); ctx.lineTo(cx - 2, cy - 14); }
      else if (i === 7) { ctx.arc(cx, cy, 13, 0, 7); ctx.stroke(); txt(ctx, "?", cx, cy + 7, 18, "#fff", "center", "700"); ctx.beginPath(); }
      else { ctx.arc(cx, cy, 12, 0, 7); ctx.moveTo(cx + 5, cy); ctx.arc(cx, cy, 5, 0, 7); }
      ctx.stroke();
      var lines = it[0].split("\n");
      lines.forEach(function (s, j) { txt(ctx, s, cx, 772 + j * 16 - (lines.length - 1) * 6, 14, "#fff", "center", "500"); });
      if (i === 0 && !self.alarmOn()) { var left = Math.max(0, Math.ceil((self.silencedUntil - self.simT) / self.speed)); txt(ctx, Math.floor(left / 60) + ":" + ("0" + left % 60).slice(-2), cx + 34, 730, 13, C.yellow, "center"); }
      self.hit(cx - 52, 708, 104, 86, it[2]);
      if (it[3]) self.hits[self.hits.length - 1].hold = it[3];
    });
  };
  Sim.prototype.altaAlarmMenu = function () {
    var a = this.alta, self = this;
    this.modal = { outside: true, draw: function (ctx) {
      var x = 10, y = 420, w = 520, h = 278;
      ctx.fillStyle = C.panel2; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.btnHi; ctx.strokeRect(x, y, w, h);
      txt(ctx, "Alarm Options", x + 20, y + 34, 20, "#fff", "left", "500");
      self.button(x + 20, y + 52, 150, 60, a.nonPulsatile ? "Resume" : "Pause", function () {
        a.nonPulsatile = !a.nonPulsatile; self.closeModal();
        a.events.unshift({ t: self.simT, kind: "sys", text: a.nonPulsatile ? "Non-Pulsatile Mode entered" : "Monitoring resumed" });
        self.toast(a.nonPulsatile ? "Non-Pulsatile Mode: CO monitoring paused" : "Monitoring resumed");
      }, { fill: C.btn, size: 18 });
      self.button(x + 180, y + 52, 150, 60, "Reset", function () { self.closeModal(); self.toast("Latched faults reset"); }, { fill: C.btn, size: 18 });
      txt(ctx, "Silence for:", x + 20, y + 146, 17, C.dim);
      [1, 2, 3, 4, 5].forEach(function (m, i) {
        self.button(x + 20 + i * 98, y + 160, 90, 52, m + " min", function () { self.silencedUntil = self.simT + m * 60; self.closeModal(); self.toast("Alarms silenced for " + m + " min"); }, { fill: C.btn, size: 17 });
      });
      self.button(x + 20, y + 220, w - 40, 46, "Silence All Alarms Permanently", function () { self.toast("Requires Super User password"); }, { fill: "#3a2224", size: 16 });
    } };
  };
  Sim.prototype.altaAlarmList = function () {
    var self = this;
    this.modal = { outside: true, draw: function (ctx) {
      var x = 10, y = 44, w = 640, al = self.altaAlarms(), h = 110 + Math.max(1, al.length) * 58;
      ctx.fillStyle = C.panel2; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.btnHi; ctx.strokeRect(x, y, w, h);
      txt(ctx, "Active Alarms", x + 20, y + 34, 20, "#fff", "left", "500");
      if (!al.length) txt(ctx, "No active alarms", x + 20, y + 80, 18, C.dim);
      al.forEach(function (q, i) { ctx.fillStyle = "#2a0607"; ctx.fillRect(x + 16, y + 52 + i * 58, w - 32, 50); ctx.fillStyle = q.pri === 2 ? C.red : C.yellow; ctx.fillRect(x + 16, y + 52 + i * 58, 8, 50); txt(ctx, q.msg, x + 36, y + 84 + i * 58, 18, "#fff"); });
    } };
  };
  Sim.prototype.altaScreenMenu = function () {
    var a = this.alta, self = this;
    this.modal = { outside: true, draw: function (ctx) {
      var x = 760, y = 470, w = 500, h = 226;
      ctx.fillStyle = C.panel2; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.btnHi; ctx.strokeRect(x, y, w, h);
      txt(ctx, "Monitoring Screen", x + 20, y + 34, 20, "#fff", "left", "500");
      [["trend", "Trend"], ["cockpit", "Cockpit"], ["split", "Split"]].forEach(function (s, i) {
        self.button(x + 20 + i * 158, y + 56, 148, 140, "", function () { a.view = s[0]; self.closeModal(); }, { fill: a.view === s[0] ? C.sel : C.btn });
        var bx = x + 20 + i * 158, by = y + 56;
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
        if (i === 0) { ctx.beginPath(); ctx.moveTo(bx + 24, by + 80); ctx.lineTo(bx + 54, by + 50); ctx.lineTo(bx + 84, by + 70); ctx.lineTo(bx + 124, by + 34); ctx.stroke(); }
        else if (i === 1) { ctx.beginPath(); ctx.arc(bx + 74, by + 66, 30, Math.PI * 0.75, Math.PI * 2.25); ctx.stroke(); }
        else { ctx.strokeRect(bx + 24, by + 30, 46, 60); ctx.strokeRect(bx + 78, by + 30, 46, 60); }
        txt(ctx, s[1], bx + 74, by + 124, 18, "#fff", "center", "500");
      });
    } };
  };

  /* ---------- Side panel ---------- */
  Sim.prototype.altaOpenPanel = function (name) { this.alta.panel = name; this.closeModal(); };
  Sim.prototype.altaPanel = function () {
    var ctx = this.ctx, a = this.alta, self = this, x = 8, y = 44, w = 300, h = 654;
    if (a.panel === "hpi") { this.altaHpiPanel(); return; }
    ctx.fillStyle = "#0f0f13"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = "#2c2c33"; ctx.strokeRect(x, y, w, h);
    var titles = { menu: "Clinical Tools", gdt: "Goal Directed Therapy", frt: "Fluid Responsiveness Test", calc: "Derived Value Calculator", events: "Events & Intervention", intervention: "Intervention" };
    txt(ctx, titles[a.panel] || "", x + 14, y + 32, 18, "#fff", "left", "500");
    if (a.panel !== "menu") this.button(x + w - 44, y + 6, 38, 38, "‹", function () { a.panel = a.panel === "intervention" ? "events" : "menu"; }, { fill: C.btn, size: 24 });
    if (a.panel === "menu") {
      var items = [["Assisted Fluid Management", function () { this.toast("AFM requires the Acumen AFM software feature"); }],
        ["Derived Value Calculator", function () { a.panel = "calc"; }],
        ["Events & Intervention", function () { a.panel = "events"; }],
        ["Fluid Responsiveness Test", function () { a.panel = "frt"; if (!a.frt) a.frt = { state: "menu", type: "Passive Leg Raise", param: "SV", dur: 60 }; }],
        ["Goal Directed Therapy", function () { a.panel = "gdt"; if (!a.gdt) a.gdt = { state: "setup", params: [{ k: "sv", lo: a.lim.sv.tlo, hi: a.lim.sv.thi, inT: 0 }, { k: "map", lo: a.lim.map.tlo, hi: a.lim.map.thi, inT: 0 }, { k: "svv", lo: a.lim.svv.tlo, hi: a.lim.svv.thi, inT: 0 }], total: 0 }; }],
        ["Hypotension Prediction Index", function () { a.panel = "hpi"; }]];
      items.forEach(function (it, i) { self.button(x + 10, y + 52 + i * 70, w - 20, 62, it[0], it[1], { fill: "#202027", size: 16 }); });
    } else if (a.panel === "calc") this.altaCalc(x, y, w);
    else if (a.panel === "events") this.altaEvents(x, y, w, h);
    else if (a.panel === "intervention") this.altaIntervention(x, y, w, h);
    else if (a.panel === "frt") this.altaFrtPanel(x, y, w, h);
    else if (a.panel === "gdt") this.altaGdtPanel(x, y, w, h);
  };
  Sim.prototype.altaCalc = function (x, y, w) {
    var ctx = this.ctx, v = this.v, a = this.alta, self = this;
    var rows = [["CVP (entered)", a.cvp + " mmHg"], ["CI", fmt(v.ci, 1) + " L/min/m²"], ["SVI", fmt(v.svi, 0) + " mL/b/m²"], ["SVR", fmt(v.svr, 0) + " dyne-s/cm⁵"], ["SVRI", fmt(v.svri, 0)], ["BSA", "1.73 m²"]];
    rows.forEach(function (r, i) { txt(ctx, r[0], x + 14, y + 80 + i * 46, 15, C.dim); txt(ctx, r[1], x + w - 14, y + 80 + i * 46, 17, "#fff", "right"); });
    this.button(x + 14, y + 360, 80, 46, "CVP −", function () { a.cvp = Math.max(0, a.cvp - 1); a.cvpSrc = "Manual"; }, { fill: C.btn, size: 15 });
    this.button(x + 104, y + 360, 80, 46, "CVP +", function () { a.cvp = Math.min(30, a.cvp + 1); a.cvpSrc = "Manual"; }, { fill: C.btn, size: 15 });
    this.button(x + 14, y + 420, w - 28, 54, "Log Values", function () { a.events.unshift({ t: self.simT, kind: "calc", text: "Derived values: SVR " + fmt(v.svr, 0) + ", CI " + fmt(v.ci, 1) }); self.toast("Values logged to Events & Intervention"); }, { fill: C.btnHi, size: 17 });
  };
  Sim.prototype.altaEvents = function (x, y, w, h) {
    var ctx = this.ctx, a = this.alta;
    var list = a.events.slice(0, 10);
    if (!list.length) txt(ctx, "No events yet", x + 14, y + 80, 15, C.dim);
    list.forEach(function (e, i) {
      var yy = y + 52 + i * 52;
      ctx.fillStyle = "#18181d"; ctx.fillRect(x + 8, yy, w - 16, 46);
      var col = e.kind === "alarm" ? C.red : e.kind === "int" ? (e.color || C.green) : C.dim;
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x + 16, yy + 14); ctx.lineTo(x + 26, yy + 14); ctx.lineTo(x + 21, yy + 26); ctx.fill();
      txt(ctx, hhmm(e.t), x + 34, yy + 20, 13, C.dim);
      var s = e.text.length > 34 ? e.text.slice(0, 33) + "…" : e.text;
      txt(ctx, s, x + 34, yy + 38, 13, "#fff");
    });
    this.button(x + 14, y + h - 66, w - 28, 54, "Intervention", function () { this.alta.panel = "intervention"; this.alta.iv = { type: null, detail: null }; }, { fill: C.btnHi, size: 17 });
  };
  var IV = [
    ["Intervention", C.green, ["Inotrope", "Vasodilator", "Vasopressor"], ["Start", "Increase", "Decrease", "Stop"]],
    ["Positional", "#8e5bd6", ["Passive Leg Raise", "Trendelenburg"], ["Start", "Stop"]],
    ["Fluids", "#3a8ee6", ["Red Blood Cells", "Colloid", "Crystalloid"], ["100 mL", "250 mL", "500 mL", "Unspecified"]]
  ];
  Sim.prototype.altaIntervention = function (x, y, w, h) {
    var ctx = this.ctx, a = this.alta, self = this, iv = a.iv || (a.iv = { type: null, detail: null }), yy = y + 48;
    IV.forEach(function (g) {
      txt(ctx, g[0], x + 14, yy + 16, 13, g[1]); yy += 22;
      g[2].forEach(function (t) {
        self.button(x + 10, yy, w - 20, 38, t, function () { iv.type = t; iv.group = g; iv.detail = null; }, { fill: iv.type === t ? C.sel : "#202027", size: 15 });
        yy += 42;
      });
    });
    if (iv.type) {
      var opts = iv.group[3];
      opts.forEach(function (o, i) { self.button(x + 10 + (i % 2) * 142, yy + 4 + Math.floor(i / 2) * 42, 136, 38, o, function () { iv.detail = o; }, { fill: iv.detail === o ? C.sel : "#202027", size: 14 }); });
    }
    this.button(x + 14, y + h - 58, w - 28, 50, "Log", function () {
      if (!iv.type || !iv.detail) { self.toast("Select an intervention type and detail"); return; }
      a.events.unshift({ t: self.simT, kind: "int", color: iv.group[1], text: iv.type + " – " + iv.detail });
      self.altaApplyIntervention(iv.type, iv.detail);
      a.panel = "events"; self.toast("Intervention logged");
    }, { fill: C.btnHi, size: 17 });
  };
  Sim.prototype.altaApplyIntervention = function (type, detail) {
    var up = detail === "Start" || detail === "Increase", down = detail === "Decrease" || detail === "Stop";
    if (type === "Vasopressor") { if (up) this.giveVaso(); else if (down) { this.vasoT = null; this.vaso = 0; } }
    else if (type === "Inotrope") { this.ino = up ? 1 : 0; }
    else if (type === "Vasodilator") { this.raiseMap(up ? -8 : 8); }
    else if (type === "Passive Leg Raise") { this.plr = detail === "Start"; }
    else if (type === "Trendelenburg") { this.raiseMap(detail === "Start" ? 4 : -4); }
    else this.giveFluid();
  };

  /* ---------- Fluid Responsiveness Test ---------- */
  Sim.prototype.altaFrt = function () {
    var a = this.alta, f = a.frt; if (!f) return;
    var key = f.param === "CO" ? "co" : "sv", now = this.simT;
    if (f.state === "baseline") { f.vals.push(this.v[key]); if (now - f.t0 >= 60) { f.base = avg(f.vals); f.state = "baseDone"; } }
    else if (f.state === "count5") { if (now - f.t0 >= 5) { f.state = "challenge"; f.t0 = now; f.vals = []; if (f.type === "Passive Leg Raise") this.plr = true; else this.giveFluid(); } }
    else if (f.state === "challenge") {
      f.vals.push(this.v[key]);
      if (now - f.t0 >= f.dur) { f.end = f.type === "Passive Leg Raise" ? Math.max.apply(null, f.vals) : avg(f.vals.slice(-Math.max(1, Math.floor(f.vals.length / 4)))); f.state = "result"; this.plr = false; a.events.unshift({ t: now, kind: "int", color: "#8e5bd6", text: "FRT " + f.type + ": " + f.param + " " + (f.end >= f.base ? "+" : "") + fmt((f.end - f.base) / f.base * 100, 0) + "%" }); }
    }
    function avg(arr) { return arr.reduce(function (s, x) { return s + x; }, 0) / Math.max(1, arr.length); }
  };
  Sim.prototype.altaFrtPanel = function (x, y, w, h) {
    var ctx = this.ctx, a = this.alta, f = a.frt, self = this, key = f.param === "CO" ? "co" : "sv";
    function sel(row, label, opts, cur, set) {
      var ry = y + 60 + row * 86;
      txt(ctx, label, x + 14, ry + 14, 14, C.dim);
      self.button(x + 10, ry + 22, 40, 46, "‹", function () { var i = opts.indexOf(cur); set(opts[(i - 1 + opts.length) % opts.length]); }, { fill: C.btn, size: 22 });
      ctx.fillStyle = "#18181d"; ctx.fillRect(x + 56, ry + 22, w - 122, 46); txt(ctx, String(cur), x + w / 2, ry + 52, 15, "#fff", "center");
      self.button(x + w - 50, ry + 22, 40, 46, "›", function () { var i = opts.indexOf(cur); set(opts[(i + 1) % opts.length]); }, { fill: C.btn, size: 22 });
    }
    if (f.state === "menu") {
      sel(0, "Fluid Challenge", ["Passive Leg Raise", "Fluid Bolus"], f.type, function (v2) { f.type = v2; f.dur = v2 === "Fluid Bolus" ? 300 : 60; });
      sel(1, "Technology", ["IQ Sensor (FloTrac)"], "IQ Sensor (FloTrac)", function () {});
      sel(2, "Parameter", ["SV", "CO"], f.param, function (v2) { f.param = v2; });
      var durs = f.type === "Fluid Bolus" ? [[300, "5 min"], [600, "10 min"], [900, "15 min"]] : [[60, "1 min"], [90, "1 min 30 sec"], [120, "2 min"]];
      var curLabel = (durs.filter(function (d) { return d[0] === f.dur; })[0] || durs[0])[1];
      sel(3, "Duration", durs.map(function (d) { return d[1]; }), curLabel, function (lbl) { f.dur = durs.filter(function (d) { return d[1] === lbl; })[0][0]; });
      this.button(x + 14, y + h - 66, w - 28, 54, "Next", function () { f.state = "ready"; }, { fill: C.btnHi, size: 18 });
    } else if (f.state === "ready") {
      txt(ctx, f.type === "Passive Leg Raise" ? "Place patient semi-recumbent." : "Prepare the fluid bolus.", x + 14, y + 80, 15, "#fff");
      txt(ctx, "Baseline: 1 min, keep patient still.", x + 14, y + 106, 15, "#fff");
      this.button(x + 14, y + h - 66, w - 28, 54, "Start Baseline", function () { f.state = "baseline"; f.t0 = this.simT; f.vals = []; }, { fill: C.btnHi, size: 18 });
      this.button(x + 14, y + h - 128, w - 28, 50, "Cancel", function () { f.state = "menu"; }, { fill: C.btn, size: 16 });
    } else if (f.state === "baseline" || f.state === "challenge" || f.state === "count5") {
      var dur = f.state === "baseline" ? 60 : f.state === "count5" ? 5 : f.dur, left = Math.max(0, Math.ceil(dur - (this.simT - f.t0)));
      txt(ctx, f.state === "baseline" ? "Measuring baseline" : f.state === "count5" ? "Raise legs to 45° now" : (f.type === "Passive Leg Raise" ? "Passive leg raise" : "Fluid bolus") + " in progress", x + 14, y + 80, 16, "#fff", "left", "500");
      txt(ctx, Math.floor(left / 60) + ":" + ("0" + left % 60).slice(-2), x + w / 2, y + 170, 56, C.yellow, "center", "300");
      this.altaSpark(x + 14, y + 210, w - 28, 140, key, 180);
      txt(ctx, f.param + " now: " + fmtP(key, this.v[key]), x + 14, y + 386, 16, "#fff");
      if (f.base) txt(ctx, "Baseline: " + fmtP(key, f.base), x + 14, y + 412, 16, C.dim);
      this.button(x + 14, y + h - 66, w - 28, 54, "Cancel", function () { f.state = "menu"; this.plr = false; }, { fill: C.btn, size: 17 });
    } else if (f.state === "baseDone") {
      txt(ctx, "Baseline " + f.param + ": " + fmtP(key, f.base), x + 14, y + 90, 20, "#fff", "left", "500");
      txt(ctx, f.type === "Passive Leg Raise" ? "Place patient supine, then Start." : "Administer the bolus and touch Start.", x + 14, y + 124, 15, "#fff");
      this.button(x + 14, y + h - 66, w - 28, 54, "Start", function () { if (f.type === "Passive Leg Raise") { f.state = "count5"; f.t0 = this.simT; } else { f.state = "challenge"; f.t0 = this.simT; f.vals = []; this.giveFluid(); } }, { fill: C.btnHi, size: 18 });
      this.button(x + 14, y + h - 128, w - 28, 50, "Restart Baseline", function () { f.state = "ready"; }, { fill: C.btn, size: 16 });
    } else if (f.state === "result") {
      var ch = (f.end - f.base) / f.base * 100;
      txt(ctx, "Result", x + 14, y + 80, 18, "#fff", "left", "500");
      txt(ctx, "Baseline " + f.param + ": " + fmtP(key, f.base), x + 14, y + 120, 17, "#fff");
      txt(ctx, (f.type === "Passive Leg Raise" ? "Peak" : "Final") + " " + f.param + ": " + fmtP(key, f.end), x + 14, y + 150, 17, "#fff");
      txt(ctx, (ch >= 0 ? "+" : "") + fmt(ch, 0) + "%", x + w / 2, y + 250, 70, ch >= 10 ? C.green : "#fff", "center", "300");
      txt(ctx, "Δ" + f.param, x + w / 2, y + 282, 16, C.dim, "center");
      this.button(x + 14, y + h - 66, w - 28, 54, "Back to Main", function () { f.state = "menu"; }, { fill: C.btnHi, size: 18 });
    }
  };
  Sim.prototype.altaSpark = function (x, y, w, h, k, secs) {
    var ctx = this.ctx, n = this.hist.length, start = Math.max(0, n - secs), lo = Infinity, hi = -Infinity;
    for (var i = start; i < n; i++) { lo = Math.min(lo, this.hist[i][k]); hi = Math.max(hi, this.hist[i][k]); }
    if (!isFinite(lo)) return; if (hi - lo < 1e-6) { hi = lo + 1; }
    ctx.fillStyle = "#0a0a0c"; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath();
    for (var j = start; j < n; j++) { var px = x + (j - start) / Math.max(1, secs - 1) * w, py = y + h - 6 - (this.hist[j][k] - lo) / (hi - lo) * (h - 12); if (j === start) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();
  };

  /* ---------- Goal Directed Therapy ---------- */
  Sim.prototype.altaGdtPanel = function (x, y, w, h) {
    var ctx = this.ctx, a = this.alta, g = a.gdt, self = this;
    g.params.forEach(function (p, i) {
      var yy = y + 54 + i * 120, pp = P[p.k], stp = pp.dec ? 0.1 : 1;
      ctx.fillStyle = "#18181d"; ctx.fillRect(x + 8, yy, w - 16, 112);
      txt(ctx, pp.name, x + 18, yy + 26, 18, "#fff", "left", "500");
      var tt = g.total ? Math.round(p.inT / g.total * 100) : 0;
      if (g.state !== "setup") txt(ctx, "Time-In-Target " + tt + "%", x + w - 16, yy + 26, 15, C.green, "right", "700");
      txt(ctx, "Target " + fmt(p.lo, pp.dec) + " – " + fmt(p.hi, pp.dec) + " " + pp.unit, x + 18, yy + 52, 14, C.dim);
      if (g.state === "setup") {
        [["lo", -1], ["lo", 1], ["hi", -1], ["hi", 1]].forEach(function (b, j) {
          self.button(x + 16 + j * 68, yy + 64, 62, 38, (b[0] === "lo" ? "L" : "H") + (b[1] < 0 ? "−" : "+"), function () { p[b[0]] = Math.round((p[b[0]] + b[1] * stp) * 10) / 10; }, { fill: C.btn, size: 15 });
        });
      } else {
        var x0 = self.v[p.k], inT = x0 >= p.lo && x0 <= p.hi;
        txt(ctx, fmtP(p.k, x0), x + w - 16, yy + 92, 30, inT ? C.green : C.yellow, "right", "300");
      }
    });
    if (g.state === "setup") this.button(x + 14, y + h - 66, w - 28, 54, "▶  Start Tracking", function () { g.state = "active"; g.total = 0; g.params.forEach(function (p) { p.inT = 0; }); a.events.unshift({ t: this.simT, kind: "sys", text: "GDT tracking started" }); }, { fill: C.btnHi, size: 18 });
    else {
      this.button(x + 14, y + h - 66, (w - 38) / 2, 54, g.state === "paused" ? "▶ Resume" : "❚❚ Pause", function () { g.state = g.state === "paused" ? "active" : "paused"; }, { fill: C.btn, size: 16 });
      this.button(x + 24 + (w - 38) / 2, y + h - 66, (w - 38) / 2, 54, "■ Stop", function () { a.events.unshift({ t: this.simT, kind: "sys", text: "GDT session ended" }); a.gdt = null; a.panel = "menu"; }, { fill: "#5a2a2a", size: 16 });
    }
  };

  /* ---------- HPI ---------- */
  Sim.prototype.altaHpiAlert = function () {
    var a = this.alta, ctx = this.ctx;
    if (!(a.hpiHigh >= 2 || a.hpiShown >= 100) || a.hpiAck || this.modal) return;
    var x = 8, y = 44, w = 300, h = 360;
    ctx.fillStyle = "#1a0405"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
    txt(ctx, "HPI High Alert", x + w / 2, y + 44, 24, "#fff", "center", "500");
    txt(ctx, String(a.hpiShown), x + w / 2, y + 150, 90, C.red, "center", "300");
    txt(ctx, "Hypotension Threshold: " + a.hpiThr + " mmHg", x + w / 2, y + 190, 14, C.dim, "center");
    this.button(x + 14, y + 220, w - 28, 56, "Review", function () { a.hpiAck = true; a.panel = "hpi"; }, { fill: C.btnHi, size: 18 });
    this.button(x + 14, y + 288, w - 28, 56, "Acknowledge", function () { a.hpiAck = true; a.events.unshift({ t: this.simT, kind: "alarm", text: "HPI High Alert acknowledged" }); }, { fill: C.btn, size: 18 });
  };
  Sim.prototype.altaHpiPanel = function () {
    var ctx = this.ctx, a = this.alta, v = this.v, self = this, x = 8, y = 44, w = 864, h = 654;
    ctx.fillStyle = "#0b0b0e"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = "#2c2c33"; ctx.strokeRect(x, y, w, h);
    this.button(x + 14, y + 12, 220, 42, (a.hpiView === "rel" ? "‹  Relationship  ›" : "‹  Smart Trend  ›"), function () { a.hpiView = a.hpiView === "rel" ? "smart" : "rel"; }, { fill: C.btn, size: 16 });
    txt(ctx, (a.hpiShown == null ? "--" : a.hpiShown), x + 430, y + 48, 40, a.hpiShown > 85 ? C.red : "#fff", "right", "500");
    txt(ctx, "HPI /100", x + 436, y + 34, 15, "#fff"); txt(ctx, "IQ Sensor  Hypotension Threshold: " + a.hpiThr + " mmHg", x + 436, y + 52, 13, C.dim);
    this.button(x + w - 120, y + 12, 50, 42, "≡", function () { self.altaHpiSettings(); }, { fill: C.btn, size: 22 });
    this.button(x + w - 60, y + 12, 50, 42, "✕", function () { a.panel = null; }, { fill: C.btn, size: 20 });
    function box(bx, by, bw, bh, k, label, foot) {
      var val = v[k], col = statusColor(a, k, val);
      var fill = col === C.red ? "#8e1116" : col === C.yellow ? "#7b6d10" : "#2a2a30";
      ctx.fillStyle = fill; ctx.fillRect(bx, by, bw, bh);
      txt(ctx, fmtP(k, val), bx + 12, by + 46, 36, "#fff", "left", "500");
      txt(ctx, label, bx + 12, by + 70, 13, "#fff");
      var d = self.altaDelta(k, 600); if (d != null) txt(ctx, (d >= 0 ? "↑" : "↓") + Math.abs(Math.round(d)) + "% 10 min", bx + bw - 10, by + 18, 12, "#fff", "right");
      self.altaSparkIn(bx + bw - 120, by + 26, 108, 42, k);
      if (foot) { ctx.fillStyle = "#3a3a42"; ctx.fillRect(bx, by + bh - 40, bw, 40); txt(ctx, foot[0], bx + bw / 2, by + bh - 24, 12, "#ddd", "center"); txt(ctx, foot[1], bx + bw / 2, by + bh - 7, 15, "#fff", "center", "700"); }
      self.hit(bx, by, bw, bh, function () { self.altaParamMenu(k, "targets"); });
    }
    if (a.hpiView === "rel") {
      txt(ctx, v.sys + "/" + v.dia, x + 300, y + 112, 26, "#fff", "center", "500"); txt(ctx, "SYS/DIA mmHg", x + 300, y + 130, 11, C.dim, "center");
      txt(ctx, fmt(v.map, 0), x + 460, y + 112, 32, statusColor(a, "map", v.map) === C.red ? C.red : "#fff", "center", "500"); txt(ctx, "MAP mmHg", x + 460, y + 130, 11, C.dim, "center");
      var dm = this.altaDelta("map", 600); if (dm != null) txt(ctx, (dm >= 0 ? "↑" : "↓") + Math.abs(Math.round(dm)) + "% 10 min", x + 560, y + 112, 13, "#fff");
      ctx.strokeStyle = "#666"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + 430, y + 140); ctx.lineTo(x + 430, y + 160); ctx.moveTo(x + 250, y + 160); ctx.lineTo(x + 640, y + 160); ctx.moveTo(x + 250, y + 160); ctx.lineTo(x + 250, y + 172); ctx.moveTo(x + 640, y + 160); ctx.lineTo(x + 640, y + 172); ctx.stroke();
      box(x + 130, y + 172, 250, 90, "co", "CO L/min");
      box(x + 520, y + 172, 250, 140, "svr", "SVR dyne-s/cm⁵");
      txt(ctx, a.cvp + " CVP mmHg (" + a.cvpSrc + ")", x + 532, y + 300, 12, "#fff");
      ctx.beginPath(); ctx.moveTo(x + 255, y + 262); ctx.lineTo(x + 255, y + 280); ctx.moveTo(x + 120, y + 280); ctx.lineTo(x + 390, y + 280); ctx.moveTo(x + 120, y + 280); ctx.lineTo(x + 120, y + 292); ctx.moveTo(x + 390, y + 280); ctx.lineTo(x + 390, y + 292); ctx.stroke();
      box(x + 14, y + 292, 230, 90, "hr", "PR bpm");
      box(x + 268, y + 292, 230, 90, "svi", "SVI mL/b/m²");
      box(x + 14, y + 420, 270, 150, "svv", "SVV %", ["Stroke Volume Variation", "PRELOAD"]);
      box(x + 298, y + 420, 270, 150, "dpdt", "dP/dt mmHg/s", ["Systolic Slope", "CONTRACTILITY"]);
      box(x + 582, y + 420, 270, 150, "eadyn", "Eadyn", ["Dynamic Arterial Elastance", "AFTERLOAD"]);
    } else {
      var rows = [["svv", "PRELOAD · SVV %"], ["dpdt", "CONTRACTILITY · dP/dt mmHg/s"], ["eadyn", "AFTERLOAD · Eadyn"]];
      rows.forEach(function (r, i) {
        var yy = y + 80 + i * 186;
        ctx.fillStyle = "#16161b"; ctx.fillRect(x + 14, yy, w - 28, 176);
        txt(ctx, r[1], x + 28, yy + 28, 16, "#fff", "left", "500");
        txt(ctx, fmtP(r[0], v[r[0]]), x + w - 30, yy + 70, 44, "#fff", "right", "300");
        var d = self.altaDelta(r[0], 600), alert = a.smartAlerts && d != null && Math.abs(d) >= a.smartThr;
        if (d != null) txt(ctx, (d >= 0 ? "↑" : "↓") + Math.abs(Math.round(d)) + "% 10 min", x + w - 30, yy + 100, 15, alert ? C.yellow : C.dim, "right", alert ? "700" : "400");
        if (alert) { ctx.fillStyle = C.yellow; ctx.fillRect(x + 14, yy, 8, 176); }
        self.altaSparkIn(x + 28, yy + 44, w - 260, 120, r[0]);
      });
    }
    txt(ctx, "Training simulation · values are illustrative", x + w - 14, y + h - 10, 12, C.dim, "right");
  };
  Sim.prototype.altaSparkIn = function (x, y, w, h, k) {
    var ctx = this.ctx, n = this.hist.length, secs = 600, start = Math.max(0, n - secs), lo = Infinity, hi = -Infinity;
    for (var i = start; i < n; i++) { lo = Math.min(lo, this.hist[i][k]); hi = Math.max(hi, this.hist[i][k]); }
    if (!isFinite(lo)) return; if (hi - lo < 1e-6) hi = lo + 1;
    ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.beginPath();
    for (var j = start; j < n; j += 3) { var px = x + (j - start) / (secs - 1) * w, py = y + h - 4 - (this.hist[j][k] - lo) / (hi - lo) * (h - 8); if (j === start) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
    ctx.stroke();
  };
  Sim.prototype.altaHpiSettings = function () {
    var a = this.alta, self = this, d = { thr: a.hpiThr, always: a.alwaysHpi, smart: a.smartAlerts, sthr: a.smartThr };
    this.modal = { outside: false, draw: function (ctx) {
      var x = 200, y = 90, w = 880, h = 560;
      ctx.fillStyle = "#101014"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.btnHi; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
      self.button(x + 20, y + 20, w - 40, 48, (d.always ? "☑" : "☐") + "  Always Show HPI and Alert", function () { d.always = !d.always; }, { fill: "#1d1d23", size: 18 });
      txt(ctx, "Hypotension Threshold:", x + 24, y + 104, 18, "#fff");
      [55, 60, 65, 70, 75, 80, 85].forEach(function (t, i) {
        self.button(x + 24 + (i % 4) * 150, y + 120 + Math.floor(i / 4) * 62, 140, 52, t + " mmHg" + (t === 65 ? "*" : ""), function () { d.thr = t; }, { fill: d.thr === t ? C.btnHi : C.btn, size: 17 });
      });
      txt(ctx, "*Default", x + 24, y + 262, 13, C.dim);
      txt(ctx, "Smart Trends and Alerts", x + 24, y + 302, 18, "#fff");
      self.button(x + 24, y + 318, 260, 48, "Smart Trend Alerts: " + (d.smart ? "On" : "Off"), function () { d.smart = !d.smart; }, { fill: d.smart ? C.btnHi : C.btn, size: 16 });
      txt(ctx, "Δ Threshold %", x + 24, y + 400, 16, "#fff");
      self.button(x + 200, y + 376, 50, 40, "‹", function () { d.sthr = Math.max(5, d.sthr - 5); }, { fill: C.btn, size: 20 });
      txt(ctx, d.sthr + "%", x + 300, y + 404, 18, "#fff", "center");
      self.button(x + 350, y + 376, 50, 40, "›", function () { d.sthr = Math.min(50, d.sthr + 5); }, { fill: C.btn, size: 20 });
      self.button(x + 24, y + h - 70, 200, 54, "Restore Defaults", function () { d.thr = 65; d.always = true; d.smart = true; d.sthr = 15; }, { fill: C.btn, size: 16 });
      self.button(x + w - 440, y + h - 70, 200, 54, "Cancel", function () { self.closeModal(); }, { fill: C.btn });
      self.button(x + w - 224, y + h - 70, 200, 54, "Save", function () { a.hpiThr = d.thr; a.alwaysHpi = d.always; a.smartAlerts = d.smart; a.smartThr = d.sthr; self.closeModal(); self.toast("HPI settings saved"); }, { fill: C.btnHi });
    } };
  };

  /* ---------- Patient, Zero, Help, Settings ---------- */
  Sim.prototype.altaDlg = function (x, y, w, h, title) {
    var ctx = this.ctx;
    ctx.fillStyle = "#101014"; ctx.fillRect(x, y, w, h); ctx.strokeStyle = C.btnHi; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#1d1d23"; ctx.fillRect(x, y, w, 58); txt(ctx, title, x + 20, y + 38, 22, "#fff", "left", "500");
    this.button(x + w - 58, y + 6, 46, 46, "⌂", function () { this.closeModal(); }, { fill: C.btn, size: 24 });
  };
  Sim.prototype.altaPatient = function () {
    var a = this.alta, self = this;
    this.modal = { outside: false, confirm: false, draw: function (ctx) {
      var m = this.modal, x = 260, y = 100, w = 760, h = 520, p = a.pr;
      this.altaDlg(x, y, w, h, "Patient Data");
      var bsa = Math.sqrt(p.h * p.w / 3600);
      [["Patient ID", p.id], ["Age", p.age + " years"], ["Gender", p.sex], ["Height", p.h + " cm"], ["Weight", p.w + " kg"], ["BSA (DuBois)", fmt(bsa, 2) + " m²"]].forEach(function (r, i) {
        txt(ctx, r[0], x + 30, y + 110 + i * 52, 19, C.dim); ctx.fillStyle = "#1b1b21"; ctx.fillRect(x + 300, y + 80 + i * 52, 300, 44); txt(ctx, r[1], x + 316, y + 110 + i * 52, 20, "#fff");
      });
      self.button(x + 620, y + 184, 56, 44, "−", function () { p.h = Math.max(100, p.h - 1); }, { fill: C.btn, size: 22 });
      self.button(x + 684, y + 184, 56, 44, "+", function () { p.h = Math.min(220, p.h + 1); }, { fill: C.btn, size: 22 });
      self.button(x + 620, y + 236, 56, 44, "−", function () { p.w = Math.max(30, p.w - 1); }, { fill: C.btn, size: 22 });
      self.button(x + 684, y + 236, 56, 44, "+", function () { p.w = Math.min(200, p.w + 1); }, { fill: C.btn, size: 22 });
      if (!m.confirm) self.button(x + w - 230, y + h - 70, 210, 54, "End Session", function () { m.confirm = true; }, { fill: "#5a2a2a" });
      else {
        txt(ctx, "End the monitoring session? It cannot be resumed.", x + 30, y + h - 36, 17, C.yellow);
        self.button(x + w - 230, y + h - 70, 100, 54, "No", function () { m.confirm = false; }, { fill: C.btn });
        self.button(x + w - 120, y + h - 70, 100, 54, "Yes", function () { self.closeModal(); self.alta = null; self.load(self.sid); self.toast("New session started"); }, { fill: "#8e1116" });
      }
    } };
  };
  Sim.prototype.altaZero = function () {
    var a = this.alta, self = this;
    this.modal = { outside: false, draw: function (ctx) {
      var x = 160, y = 90, w = 960, h = 560;
      this.altaDlg(x, y, w, h, "Zero & Waveform");
      ctx.fillStyle = "#000"; ctx.fillRect(x + 20, y + 80, w - 40, 260);
      var zeroing = this.realT - a.zeroAt < 3;
      if (zeroing) { ctx.strokeStyle = C.art; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x + 30, y + 310); ctx.lineTo(x + w - 30, y + 310); ctx.stroke(); }
      else waveFromBuf(ctx, this.artBuf, this.head, x + 30, y + 90, w - 60, 240, 40, 160, C.art);
      txt(ctx, "160", x + 28, y + 100, 12, C.dim); txt(ctx, "40", x + 28, y + 336, 12, C.dim);
      txt(ctx, "ART – IQ Sensor (Port 1)", x + 30, y + 380, 19, "#fff", "left", "500");
      txt(ctx, zeroing ? "Zeroing… 0 mmHg" : "Last zeroed: " + (a.zeroAt ? hhmm(a.zeroSim || 0) : "08:00"), x + 30, y + 410, 16, zeroing ? C.yellow : C.dim);
      txt(ctx, "Level the transducer to the phlebostatic axis, open the stopcock to air, then touch Zero.", x + 30, y + 450, 16, "#fff");
      self.button(x + w - 250, y + 370, 220, 64, "-0-  Zero", function () { a.zeroAt = self.realT; a.zeroSim = self.simT; a.events.unshift({ t: self.simT, kind: "sys", text: "ART zeroed" }); self.toast("Pressure zeroed successfully"); }, { fill: C.btnHi, size: 20 });
      self.button(x + w - 250, y + 450, 220, 54, "Square Wave Test", function () { self.toast("Flush test: check for 1.5–2 oscillations (optimally damped)"); }, { fill: C.btn, size: 16 });
    } };
  };
  Sim.prototype.altaHelp = function () {
    this.modal = { outside: true, draw: function (ctx) {
      var x = 200, y = 90, w = 880, h = 560;
      this.altaDlg(x, y, w, h, "Help");
      ["Touch a parameter tile: change parameter, alarms/targets, Y scale.",
        "Touch the time axis: change time range or tabular increment.",
        "Toggle switch (bottom right of trends): graphical / tabular trend.",
        "Screen: Trend, Cockpit or Split (Physiology, Goal Positioning).",
        "Clinical Tools: HPI, GDT, Fluid Responsiveness Test, Derived Values,",
        "    Events & Intervention.",
        "Alarm: touch to silence 2 min; touch and hold for Pause / Reset / Silence.",
        "Status bar right side: brightness, alarm volume, lock screen.",
        "HPI on status bar or tile shortcut: HPI secondary screen."].forEach(function (s, i) { txt(ctx, s, x + 30, y + 106 + i * 46, 18, "#fff"); });
    } };
  };
  Sim.prototype.altaSettings = function () {
    var a = this.alta, self = this;
    this.modal = { outside: false, tab: "main", draw: function (ctx) {
      var m = this.modal, x = 200, y = 80, w = 880, h = 590;
      this.altaDlg(x, y, w, h, m.tab === "alarms" ? "Settings › Alarms / Targets" : m.tab === "general" ? "Settings › General Monitor Settings" : "Settings");
      if (m.tab === "main") {
        [["General Monitor Settings", function () { m.tab = "general"; }], ["Alarms / Targets", function () { m.tab = "alarms"; }], ["CVP Settings", function () { m.tab = "cvp"; }],
          ["Advanced Settings", function () { self.toast("Advanced Settings require a Secure User password"); }], ["Demo Mode", function () { self.toast("This whole screen is already a simulation"); }], ["Export Data", function () { self.toast("Insert a USB stick to export data"); }]].forEach(function (b, i) {
          self.button(x + 30 + (i % 2) * 415, y + 90 + Math.floor(i / 2) * 110, 400, 94, b[0], b[1], { fill: C.btn, size: 20 });
        });
      } else if (m.tab === "general") {
        txt(ctx, "Language", x + 30, y + 110, 19, "#fff"); txt(ctx, "English", x + w - 40, y + 110, 19, "#fff", "right");
        txt(ctx, "Date / Time format", x + 30, y + 166, 19, "#fff"); txt(ctx, "MM/DD/YYYY · 24 h", x + w - 40, y + 166, 19, "#fff", "right");
        txt(ctx, "Trend Target Colors", x + 30, y + 222, 19, "#fff");
        self.button(x + w - 200, y + 192, 160, 46, a.trendColors ? "On" : "Off", function () { a.trendColors = !a.trendColors; }, { fill: a.trendColors ? C.btnHi : C.btn });
        txt(ctx, "Alarm Volume", x + 30, y + 278, 19, "#fff"); txt(ctx, a.vol + "%", x + w - 40, y + 278, 19, "#fff", "right");
        txt(ctx, "Units", x + 30, y + 334, 19, "#fff"); txt(ctx, "mmHg · °C · g/dL", x + w - 40, y + 334, 19, "#fff", "right");
        self.button(x + 30, y + h - 70, 160, 54, "Back", function () { m.tab = "main"; }, { fill: C.btn });
      } else if (m.tab === "cvp") {
        txt(ctx, "Default CVP when no source is detected", x + 30, y + 110, 19, "#fff");
        self.button(x + 30, y + 130, 80, 60, "−", function () { a.cvp = Math.max(0, a.cvp - 1); }, { fill: C.btn, size: 30 });
        txt(ctx, a.cvp + " mmHg", x + 200, y + 172, 26, "#fff", "center");
        self.button(x + 290, y + 130, 80, 60, "+", function () { a.cvp = Math.min(30, a.cvp + 1); }, { fill: C.btn, size: 30 });
        self.button(x + 30, y + h - 70, 160, 54, "Back", function () { m.tab = "main"; }, { fill: C.btn });
      } else {
        txt(ctx, "Parameter", x + 30, y + 86, 14, C.dim); ["Alarm Low", "Target Low", "Target High", "Alarm High"].forEach(function (s, i) { txt(ctx, s, x + 300 + i * 140, y + 86, 14, C.dim, "center"); });
        ["map", "hr", "co", "sv", "svv", "svr", "dpdt", "hpi"].forEach(function (k, i) {
          var l = a.lim[k], yy = y + 98 + i * 52, dec = P[k].dec;
          self.button(x + 20, yy, w - 40, 46, "", function () { self.altaParamMenu(k, "targets"); }, { fill: i % 2 ? "#17171c" : "#1d1d23" });
          txt(ctx, P[k].name + " " + P[k].unit, x + 36, yy + 30, 17, "#fff", "left", "500");
          [l.alo, l.tlo, l.thi, l.ahi].forEach(function (val, j) { txt(ctx, val == null ? "N/A" : fmt(val, dec), x + 300 + j * 140, yy + 30, 18, j === 0 || j === 3 ? "#ff8a8a" : "#9be89b", "center"); });
        });
        self.button(x + 30, y + h - 70, 160, 54, "Back", function () { m.tab = "main"; }, { fill: C.btn });
        self.button(x + w - 330, y + h - 70, 300, 54, "Restore BD Defaults", function () { var fs = freshState(); a.lim = fs.lim; self.toast("Alarms/targets restored to BD defaults"); }, { fill: C.btn, size: 17 });
      }
    } };
  };

  /* Values extension: indexed parameters, PPV, inotrope and passive leg raise effects */
  var baseValues = Sim.prototype.values;
  Sim.prototype.values = function (t) {
    var v = baseValues.call(this, t);
    if (this.device !== "hemosphere") return v;
    var sc = this.scenario(), p = sc.p(t), resp = p.responsive ? 1 : 0.3;
    if (this.plr) { v.sv *= 1 + 0.14 * resp; v.svv = Math.max(3, v.svv - 4 * resp); }
    if (this.ino) { v.sv *= 1.12; v.dpdt *= 1.35; v.map += 3; }
    v.co = v.sv * v.hr / 1000;
    var cvp = this.alta ? this.alta.cvp : 5;
    v.svr = (v.map - cvp) * 80 / v.co;
    v.ci = v.co / BSA; v.svi = v.sv / BSA; v.svri = v.svr * BSA; v.ppv = v.svv * 1.15;
    v.sys = Math.round(v.map + (v.pp || 45) * 2 / 3); v.dia = Math.round(v.map - (v.pp || 45) / 3);
    return v;
  };
})();
