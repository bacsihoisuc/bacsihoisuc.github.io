/* Bác sĩ Hồi sức — Simulator NeuroSmart logO và HemoSphere Alta
   Bố cục màn hình dựng theo ảnh trong Hướng dẫn sử dụng của hãng.
   Mọi số liệu là mô phỏng để đào tạo, chưa phải dữ liệu bệnh nhân thật.
   Kịch bản nằm trong SCENARIOS bên dưới: mỗi kịch bản là các mốc [giây, giá trị]. */
(function () {
  "use strict";
  var W = 1280, H = 800;

  /* ---------- Công cụ chung ---------- */
  function kf(points, t) {
    if (t <= points[0][0]) return points[0][1];
    for (var i = 1; i < points.length; i++) {
      if (t <= points[i][0]) {
        var a = points[i - 1], b = points[i];
        return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
      }
    }
    return points[points.length - 1][1];
  }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function gauss(x, c, w) { return Math.exp(-((x - c) * (x - c)) / (2 * w * w)); }
  function fmt(v, d) { return (v == null || isNaN(v)) ? "---" : v.toFixed(d); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function clock(simT) {
    var s = Math.floor(8 * 3600 + simT);
    return pad(Math.floor(s / 3600) % 24) + ":" + pad(Math.floor(s / 60) % 60) + ":" + pad(s % 60);
  }
  function hhmm(simT) {
    var s = Math.floor(8 * 3600 + simT);
    return pad(Math.floor(s / 3600) % 24) + ":" + pad(Math.floor(s / 60) % 60);
  }

  /* Sóng ICP: P1, P2, P3. ratio = P2/P1 */
  function icpWave(t, mean, ratio, hr) {
    var phi = (t * hr / 60) % 1;
    var amp = clamp(1.5 + 0.2 * (mean - 5), 1.5, 14);
    var shape = (gauss(phi, 0.12, 0.034) + ratio * gauss(phi, 0.27, 0.055) + 0.42 * gauss(phi, 0.44, 0.05)) / (Math.max(1, ratio) + 0.15);
    return mean - amp * 0.4 + amp * shape + Math.sin(2 * Math.PI * t * 14 / 60) * 0.6;
  }
  function icpAmp(mean) { return clamp(1.5 + 0.2 * (mean - 5), 1.5, 14); }

  /* Sóng huyết áp động mạch */
  function artWave(t, sys, dia, hr) {
    var phi = (t * hr / 60) % 1;
    var up = phi < 0.12 ? Math.sin(phi / 0.12 * Math.PI / 2) : 1;
    var body = phi < 0.12 ? up : Math.exp(-(phi - 0.12) * 2.6);
    var notch = 0.16 * gauss(phi, 0.4, 0.035) - 0.06 * gauss(phi, 0.35, 0.02);
    var s = clamp(body + notch, 0, 1.1);
    return dia + (sys - dia) * s;
  }

  /* ---------- Kịch bản ---------- */
  var SCENARIOS = {
    neurosmart: [
      {
        id: "ns-on-dinh",
        name: "Theo dõi thường quy",
        desc: "Bệnh nhân chấn thương sọ não nặng, ngày thứ 2. ICP và CPP trong giới hạn, tự điều hòa còn tốt.",
        duration: 600,
        cppopt: 76,
        p: function (t) {
          return { icp: kf([[0, 9], [300, 11], [600, 10]], t), ratio: 0.8, map: kf([[0, 86], [600, 88]], t), pp: 45, hr: 76, pbBase: 26, prxBase: -0.2, temp: 37.2 };
        },
        notes: [
          [0, "Màn hình chính: ICP1 khoảng 10 mmHg, CPP trên 70 mmHg, pO2 mô não trên 20 mmHg."],
          [60, "Bấm biểu tượng sóng ở cột phải để xem sóng ICP. Sóng bình thường có P1 cao hơn P2."],
          [180, "Màn hình tự điều hòa (biểu tượng màn hình): PRx âm cho thấy tự điều hòa áp lực não còn tốt."]
        ],
        questions: [
          { t: 120, q: "CPP được tính như thế nào?", opts: ["MAP − ICP", "SYS − ICP", "MAP + ICP", "ICP − CVP"], a: 0, why: "Áp lực tưới máu não (CPP) bằng huyết áp động mạch trung bình (MAP) trừ áp lực nội sọ (ICP)." },
          { t: 300, q: "Trên sóng ICP bình thường, đỉnh nào cao nhất?", opts: ["P1", "P2", "P3"], a: 0, why: "Khi độ giãn nở nội sọ còn tốt, P1 (sóng đập) cao hơn P2 (sóng dội) và P3." }
        ]
      },
      {
        id: "ns-icp-tang",
        name: "ICP tăng sau chấn thương sọ não",
        desc: "ICP tăng dần trong khoảng 8 phút (thời gian mô phỏng). CPP giảm, PRx tăng, pO2 mô não giảm.",
        duration: 720,
        cppopt: 78,
        p: function (t) {
          var icp = kf([[0, 14], [120, 15], [480, 30], [720, 31]], t);
          return { icp: icp, ratio: clamp(0.85 + (icp - 14) * 0.035, 0.85, 1.45), map: 86, pp: 48, hr: kf([[0, 78], [720, 92]], t), pbBase: 25, prxBase: kf([[0, -0.15], [720, 0.05]], t), temp: kf([[0, 37.4], [720, 38.1]], t) };
        },
        notes: [
          [0, "ICP 14 mmHg, CPP khoảng 72 mmHg. Theo dõi diễn biến."],
          [240, "ICP đang tăng. Xem sóng ICP: P2 bắt đầu cao hơn P1, gợi ý độ giãn nở nội sọ giảm."],
          [330, "ICP vượt 22 mmHg: ngưỡng điều trị theo Brain Trauma Foundation 2016. SIBICC: bắt đầu bậc điều trị 1."],
          [430, "CPP thấp hơn CPPopt: PRx tăng (mất tự điều hòa), pO2 mô não giảm. Thử bấm “Tăng MAP 10 mmHg”."]
        ],
        questions: [
          { t: 340, q: "Theo Brain Trauma Foundation (2016), nên điều trị khi ICP vượt bao nhiêu?", opts: ["15 mmHg", "22 mmHg", "30 mmHg", "40 mmHg"], a: 1, why: "Guideline Brain Trauma Foundation phiên bản 4 khuyến cáo điều trị khi ICP trên 22 mmHg." },
          { t: 450, q: "Sóng ICP có P2 cao hơn P1 gợi ý điều gì?", opts: ["Độ giãn nở nội sọ giảm", "Đầu đo bị trôi", "Bệnh nhân thở máy", "ICP thấp"], a: 0, why: "P2 phản ánh độ giãn nở của nhu mô não. Khi P2 vượt P1, độ giãn nở nội sọ đã giảm." },
          { t: 560, q: "PRx tăng trên 0,3 có ý nghĩa gì?", opts: ["Tự điều hòa áp lực não suy giảm", "Tự điều hòa tốt", "Cần hiệu chuẩn lại máy", "Không có ý nghĩa"], a: 0, why: "PRx là tương quan giữa MAP và ICP. PRx dương, trên khoảng 0,3, cho thấy mạch não thụ động theo huyết áp, tức tự điều hòa suy giảm." }
        ]
      },
      {
        id: "ns-cpp-duoi-opt",
        name: "CPP dưới CPPopt",
        desc: "ICP ổn định nhưng MAP giảm sau tăng liều an thần. CPP xuống dưới CPPopt của bệnh nhân.",
        duration: 720,
        cppopt: 82,
        p: function (t) {
          return { icp: kf([[0, 16], [720, 17]], t), ratio: 1.0, map: kf([[0, 98], [150, 97], [420, 78], [720, 76]], t), pp: 46, hr: 80, pbBase: 25, prxBase: -0.12, temp: 37.3 };
        },
        notes: [
          [0, "CPP khoảng 82 mmHg, gần CPPopt. PRx âm, pO2 mô não tốt."],
          [200, "MAP đang giảm sau khi tăng liều an thần. CPP vẫn trên 60 mmHg, chưa vi phạm ngưỡng chung."],
          [380, "CPP thấp hơn CPPopt khoảng 15 mmHg: PRx tăng và pO2 mô não giảm dù CPP vẫn trên 60. Đây là lý do của đích CPP cá thể hóa."],
          [500, "Bấm “Tăng MAP 10 mmHg” để xem PRx và pO2 cải thiện khi CPP trở lại gần CPPopt."]
        ],
        questions: [
          { t: 420, q: "Theo nghiên cứu của Bögli (2025), CPP lệch về phía nào so với CPPopt liên quan kết cục xấu hơn?", opts: ["Thấp hơn CPPopt", "Cao hơn CPPopt", "Cả hai như nhau", "Không liên quan"], a: 0, why: "Bệnh nhân dễ bị tổn thương khi CPP thấp hơn CPPopt; CPP cao hơn CPPopt nhìn chung không liên quan kết cục xấu. Tác giả đề xuất dùng CPPopt làm giới hạn dưới." }
        ]
      }
    ],
    hemosphere: [
      {
        id: "hs-on-dinh",
        name: "Huyết động ổn định",
        desc: "Bệnh nhân mổ bụng, gây mê nội khí quản, theo dõi FloTrac. Các thông số trong đích.",
        duration: 600,
        p: function (t) {
          return { map: kf([[0, 82], [600, 80]], t), pp: 48, co: 5.1, svv: 8, hr: 72, hpi: kf([[0, 18], [600, 24]], t), cvp: 8 };
        },
        notes: [
          [0, "Ô bên phải: huyết áp động mạch, CO, SV, SVV và HPI. Chạm ô để đổi thông số hoặc vùng mục tiêu; nút Screen để chuyển Trend, Cockpit, Split."],
          [90, "Vùng xanh là vùng mục tiêu. Đường xu hướng xanh: trong mục tiêu; vàng: ngoài mục tiêu; đỏ: vượt giới hạn báo động."]
        ],
        questions: [
          { t: 150, q: "CO được tính từ những đại lượng nào?", opts: ["SV × nhịp tim", "MAP × nhịp tim", "SV × SVV", "MAP / SVR"], a: 0, why: "Cung lượng tim (CO) bằng thể tích nhát bóp (SV) nhân nhịp tim." }
        ]
      },
      {
        id: "hs-giam-the-tich",
        name: "Giảm thể tích tuần hoàn",
        desc: "Mất máu trong mổ. SV giảm, SVV tăng, nhịp tim tăng, huyết áp giảm dần.",
        duration: 720,
        p: function (t) {
          return { map: kf([[0, 80], [120, 79], [480, 64], [720, 62]], t), pp: kf([[0, 48], [480, 34]], t), co: kf([[0, 5.0], [480, 3.9], [720, 3.8]], t), svv: kf([[0, 9], [120, 10], [480, 18], [720, 19]], t), hr: kf([[0, 74], [480, 96], [720, 98]], t), hpi: kf([[0, 25], [300, 70], [430, 88], [720, 92]], t), cvp: kf([[0, 8], [720, 5]], t), responsive: true };
        },
        notes: [
          [0, "Mất máu bắt đầu. Theo dõi SV và SVV."],
          [260, "SVV vượt 12–13%: gợi ý bệnh nhân có đáp ứng bù dịch (khi thở máy, nhịp xoang)."],
          [430, "HPI vượt 85 hai lần cập nhật liên tiếp (mỗi 20 giây): máy hiện HPI High Alert. Chạm Review để mở màn hình phụ HPI."],
          [500, "Thử Clinical Tools › Fluid Responsiveness Test (Fluid Bolus), hoặc nút “Bù dịch 250 ml” bên cạnh, để xem SV tăng, SVV giảm."]
        ],
        questions: [
          { t: 300, q: "SVV tăng cao trên bệnh nhân thở máy, nhịp xoang gợi ý điều gì?", opts: ["Có khả năng đáp ứng bù dịch", "Suy tim", "Quá tải dịch", "Co mạch"], a: 0, why: "Biến thiên thể tích nhát bóp (SVV) cao, thường trên 12–13%, gợi ý tim đang ở phần dốc của đường cong Frank-Starling và có thể đáp ứng bù dịch." }
        ]
      },
      {
        id: "hs-hpi",
        name: "Dự báo tụt huyết áp (HPI)",
        desc: "Sau khởi mê, HPI tăng trước khi huyết áp tụt. Bài tập nhận biết cảnh báo sớm.",
        duration: 600,
        p: function (t) {
          return { map: kf([[0, 84], [240, 78], [360, 70], [430, 60], [600, 58]], t), pp: 44, co: kf([[0, 4.8], [600, 4.3]], t), svv: kf([[0, 9], [600, 11]], t), hr: kf([[0, 70], [600, 64]], t), hpi: kf([[0, 30], [200, 62], [300, 86], [600, 99]], t), cvp: 7, responsive: false, vasoplegia: true };
        },
        notes: [
          [0, "Vừa khởi mê. MAP còn trên 80 mmHg."],
          [300, "HPI vượt 85 trong khi MAP vẫn trên 65: đây là thời gian để can thiệp sớm."],
          [400, "SVV không cao, Eadyn thấp: nguyên nhân nghiêng về giảm trương lực mạch. Mở Clinical Tools › Hypotension Prediction Index để xem, rồi thử Events & Intervention › Vasopressor."]
        ],
        questions: [
          { t: 310, q: "Nghiên cứu của Hatib (2018) cho thấy thuật toán HPI dự báo tụt huyết áp trước bao lâu?", opts: ["Đến 15 phút", "Đến 2 giờ", "Đúng lúc tụt", "Sau khi tụt 5 phút"], a: 0, why: "Thuật toán học máy dự báo tụt huyết áp trước 15 phút với độ nhạy và độ đặc hiệu khoảng 87–88%, càng gần thời điểm tụt càng chính xác." }
        ]
      }
    ]
  };

  /* ---------- Trạng thái mô phỏng ---------- */
  function Sim(canvas, ui) {
    this.c = canvas;
    this.ctx = canvas.getContext("2d");
    this.ui = ui;
    canvas.width = W; canvas.height = H;
    this.device = "neurosmart";
    this.screen = "home";
    this.speed = 5;
    this.mode = "teach";
    this.load(SCENARIOS.neurosmart[0].id);
    var self = this;
    this.hits = []; this.modal = null;
    this.lim = nsDefaultLimits();
    canvas.addEventListener("pointerdown", function (e) { e.preventDefault(); self.onDown(e); });
    canvas.addEventListener("pointerup", function (e) { self.onUp(e); });
    canvas.addEventListener("pointerleave", function () { self.down = null; });
    canvas.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") self.onMove(e); });
    this.last = performance.now();
    requestAnimationFrame(function loop(now) {
      self.tick(now);
      requestAnimationFrame(loop);
    });
  }
  Sim.prototype.scenario = function () {
    var list = SCENARIOS[this.device];
    for (var i = 0; i < list.length; i++) if (list[i].id === this.sid) return list[i];
    return list[0];
  };
  Sim.prototype.load = function (sid) {
    this.sid = sid;
    this.simT = 0; this.realT = 0;
    this.running = true;
    this.hist = [];
    this.mapOffset = 0; this.mapOffsetTarget = 0;
    this.fluid = 0; this.vaso = 0;
    this.asked = {};
    this.noteIdx = -1;
    this.silencedUntil = -1;
    this.modal = null; this.toastMsg = null; this.press = null; this.hpiAckUntil = -1; this.alta = null; this.plr = false; this.ino = 0; this.locked = false; this.fluidT = null; this.vasoT = null;
    this.icpBuf = new Array(560).fill(null); this.artBuf = new Array(560).fill(null); this.head = 0; this.lastCol = null;
    if (this.ui.onLoad) this.ui.onLoad(this.scenario());
  };
  Sim.prototype.setDevice = function (d) {
    this.device = d;
    this.screen = "home";
    this.modal = null; this.hsTools = false; this.hsView = "graph"; this.locked = false;
    this.load(SCENARIOS[d][0].id);
  };

  /* Giá trị tại thời điểm mô phỏng t */
  Sim.prototype.values = function (t) {
    var sc = this.scenario(), p = sc.p(t), v = {};
    if (this.device === "neurosmart") {
      v.icp = p.icp;
      v.map = p.map + this.mapOffset;
      v.cpp = v.map - v.icp;
      v.cppopt = sc.cppopt;
      var d = v.cpp - sc.cppopt;
      v.prx = clamp(p.prxBase + (d < 0 ? 0.0016 * d * d : 0.0003 * d * d), -0.6, 0.95);
      v.pbto2 = clamp(p.pbBase - (d < 0 ? 0.5 * -d : 0) - Math.max(0, v.icp - 25) * 0.4, 4, 60);
      v.orx = clamp(v.prx * 0.85 + 0.05, -0.6, 0.95);
      v.ratio = p.ratio; v.hr = p.hr;
      v.sys = Math.round(v.map + p.pp * 2 / 3); v.dia = Math.round(v.map - p.pp / 3);
      v.icpa = icpAmp(v.icp);
      v.temp = p.temp;
    } else {
      var f = this.fluid, va = this.vaso;
      var resp = p.responsive ? 1 : 0.3;
      v.hr = p.hr - 8 * f * resp;
      v.svv = clamp(p.svv - 7 * f * resp, 3, 30);
      var sv = p.co * 1000 / p.hr + 12 * f * resp;
      v.sv = sv;
      v.co = sv * v.hr / 1000;
      v.map = p.map + 7 * f * resp + 14 * va + this.mapOffset;
      v.pp = p.pp + 6 * f * resp;
      v.sys = Math.round(v.map + v.pp * 2 / 3); v.dia = Math.round(v.map - v.pp / 3);
      v.cvp = p.cvp;
      v.svr = (v.map - v.cvp) * 80 / v.co;
      var hpi = p.hpi - 45 * va - 30 * f * resp;
      if (v.map < 65) hpi = 100;
      v.hpi = clamp(hpi, 1, 100);
      v.dpdt = 420 + 95 * v.co;
      v.eadyn = p.vasoplegia ? clamp(0.58 + 0.3 * va, 0.4, 1.2) : 0.95;
    }
    return v;
  };

  Sim.prototype.tick = function (now) {
    var dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    if (this.running) {
      this.realT += dt;
      this.simT += dt * this.speed;
      this.mapOffset += (this.mapOffsetTarget - this.mapOffset) * Math.min(1, dt * this.speed / 40);
      if (this.fluidT != null) { var k = clamp((this.simT - this.fluidT) / 90, 0, 1); this.fluid = this.fluidBase + k; }
      if (this.vasoT != null) { var k2 = clamp((this.simT - this.vasoT) / 60, 0, 1); this.vaso = k2; }
      var sc = this.scenario();
      if (this.simT >= sc.duration) { this.simT = sc.duration; this.running = false; if (this.ui.onEnd) this.ui.onEnd(); }
      var sec = Math.floor(this.simT);
      while (this.hist.length <= sec) {
        var tt = this.hist.length;
        this.hist.push(this.values(tt));
      }
      for (var i = sc.notes.length - 1; i >= 0; i--) {
        if (this.simT >= sc.notes[i][0]) { if (i !== this.noteIdx) { this.noteIdx = i; if (this.ui.onNote) this.ui.onNote(sc.notes[i][1]); } break; }
      }
      if (this.mode === "learn") {
        for (var q = 0; q < sc.questions.length; q++) {
          var qq = sc.questions[q];
          if (!this.asked[q] && this.simT >= qq.t) { this.asked[q] = true; this.running = false; if (this.ui.onQuestion) this.ui.onQuestion(qq); break; }
        }
      }
    }
    this.v = this.values(this.simT);
    this.fillWave();
    this.hits = [];
    if (this.device === "neurosmart") this.drawNS(); else this.drawHS();
    if (this.ui.onTick) this.ui.onTick(this);
  };

  /* Sóng quét: mỗi cột ứng với một khoảng thời gian thật */
  Sim.prototype.fillWave = function () {
    var cols = 560, secs = 6, pps = cols / secs;
    var head = Math.floor((this.realT * pps) % cols);
    if (this.lastCol === null) this.lastCol = head;
    var span = (head - this.lastCol + cols) % cols;
    if (span > cols / 2) span = 1;
    var v = this.v;
    for (var s = 0; s <= span; s++) {
      var c = (this.lastCol + s) % cols;
      var back = (head - c + cols) % cols;
      var t = this.realT - back / pps;
      if (this.device === "neurosmart") this.icpBuf[c] = icpWave(t, v.icp, v.ratio, v.hr);
      this.artBuf[c] = artWave(t, v.sys, v.dia, v.hr);
    }
    this.lastCol = head; this.head = head;
  };

  Sim.prototype.alarmOn = function () { return this.simT > this.silencedUntil; };

  /* ---------- Vẽ chung ---------- */
  function txt(ctx, s, x, y, size, color, align, weight) {
    ctx.font = (weight || "400") + " " + size + "px Roboto, 'Segoe UI', Arial, sans-serif";
    ctx.fillStyle = color; ctx.textAlign = align || "left"; ctx.textBaseline = "alphabetic";
    ctx.fillText(s, x, y);
  }
  function box(ctx, x, y, w, h, stroke, fill) {
    if (fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, w, h); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); }
  }
  function waveFromBuf(ctx, buf, head, x, y, w, h, lo, hi, color) {
    var n = buf.length;
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.lineJoin = "round";
    ctx.beginPath();
    var on = false;
    for (var i = 0; i < n; i++) {
      var gap = ((i - head + n) % n);
      if (gap > 0 && gap <= 14) { on = false; continue; }
      var v = buf[i]; if (v == null) { on = false; continue; }
      var px = x + i / (n - 1) * w;
      var py = y + h - (clamp(v, lo, hi) - lo) / (hi - lo) * h;
      if (!on) { ctx.moveTo(px, py); on = true; } else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  function trendLine(ctx, hist, key, x, y, w, h, lo, hi, window, nowT, colorFn) {
    var start = Math.max(0, Math.floor(nowT - window));
    var prev = null;
    ctx.lineWidth = 2.5;
    for (var s = start; s < hist.length; s++) {
      var val = hist[s][key];
      var px = x + (s - (nowT - window)) / window * w;
      var py = y + h - (clamp(val, lo, hi) - lo) / (hi - lo) * h;
      if (prev) {
        ctx.strokeStyle = colorFn ? colorFn(val) : "#fff";
        ctx.beginPath(); ctx.moveTo(prev[0], prev[1]); ctx.lineTo(px, py); ctx.stroke();
      }
      prev = [px, py];
    }
  }

  /* ---------- Cảm ứng: vùng bấm, hộp thoại, thông báo ---------- */
  Sim.prototype.hit = function (x, y, w, h, fn, tag) { this.hits.push({ x: x, y: y, w: w, h: h, fn: fn, tag: tag }); };
  Sim.prototype.toast = function (msg) { this.toastMsg = msg; this.toastUntil = this.realT + 2.8; };
  Sim.prototype.closeModal = function () { this.modal = null; };
  Sim.prototype.pos = function (e) {
    var r = this.c.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
  };
  Sim.prototype.findHit = function (p) {
    for (var i = this.hits.length - 1; i >= 0; i--) {
      var h = this.hits[i];
      if (p.x >= h.x && p.x <= h.x + h.w && p.y >= h.y && p.y <= h.y + h.h) return h;
    }
    return null;
  };
  Sim.prototype.onDown = function (e) {
    var p = this.pos(e), h = this.findHit(p);
    this.down = h ? { h: h, t: performance.now() } : null;
    if (h && h.w < W) this.press = { x: h.x, y: h.y, w: h.w, h: h.h, t: this.realT };
  };
  Sim.prototype.onUp = function (e) {
    var d = this.down; this.down = null;
    if (!d) return;
    var h = d.h, held = performance.now() - d.t >= 600;
    var p = this.pos(e);
    if (!(p.x >= h.x - 20 && p.x <= h.x + h.w + 20 && p.y >= h.y - 20 && p.y <= h.y + h.h + 20)) return;
    if (this.locked && h.tag !== "lock" && !(this.modal && this.modal.lockOk)) { this.toast(this.device === "hemosphere" ? "Screen locked – touch the right side of the status bar to unlock" : "Screen locked. Touch the lock icon to unlock."); return; }
    if (held && h.hold) h.hold.call(this); else h.fn.call(this);
  };
  Sim.prototype.onMove = function (e) {
    var h = this.findHit(this.pos(e));
    this.c.style.cursor = h && h.w < W ? "pointer" : "default";
  };
  Sim.prototype.drawOverlay = function () {
    var ctx = this.ctx, self = this;
    if (this.modal) {
      this.hits = [];
      ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, 0, W, H);
      this.hit(0, 0, W, H, function () { if (self.modal && self.modal.outside) self.closeModal(); });
      this.modal.draw.call(this, ctx);
    }
    if (this.press && this.realT - this.press.t < 0.18) {
      ctx.fillStyle = "rgba(255,255,255,0.22)"; ctx.fillRect(this.press.x, this.press.y, this.press.w, this.press.h);
    }
    if (this.bright != null && this.bright < 5) { ctx.fillStyle = "rgba(0,0,0," + (0.12 * (5 - this.bright)) + ")"; ctx.fillRect(0, 0, W, H); }
    if (this.toastMsg && this.realT < this.toastUntil) {
      ctx.font = "500 22px Roboto, Arial, sans-serif";
      var tw = Math.min(1100, ctx.measureText(this.toastMsg).width + 48);
      ctx.fillStyle = "rgba(20,20,24,0.92)"; ctx.fillRect((W - tw) / 2, H - 120, tw, 56);
      ctx.strokeStyle = "#6fc6d8"; ctx.lineWidth = 2; ctx.strokeRect((W - tw) / 2, H - 120, tw, 56);
      txt(ctx, this.toastMsg, W / 2, H - 84, 22, "#fff", "center", "500");
    }
  };

  /* Nút bấm chung */
  Sim.prototype.button = function (x, y, w, h, label, fn, o) {
    var ctx = this.ctx; o = o || {};
    ctx.fillStyle = o.fill || "#3b3d40"; ctx.fillRect(x, y, w, h);
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); }
    if (o.icon === "x" || o.icon === "ok") {
      var cx = x + w / 2, cy = y + h / 2;
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, 15, 0, 7); ctx.fill();
      ctx.strokeStyle = o.fill || "#3b3d40"; ctx.lineWidth = 3.5; ctx.beginPath();
      if (o.icon === "x") { ctx.moveTo(cx - 6, cy - 6); ctx.lineTo(cx + 6, cy + 6); ctx.moveTo(cx + 6, cy - 6); ctx.lineTo(cx - 6, cy + 6); }
      else { ctx.moveTo(cx - 7, cy); ctx.lineTo(cx - 2, cy + 6); ctx.lineTo(cx + 8, cy - 6); }
      ctx.stroke();
    } else txt(ctx, label, x + w / 2, y + h / 2 + (o.size || 22) * 0.36, o.size || 22, o.color || "#fff", "center", o.weight || "500");
    this.hit(x, y, w, h, fn);
  };

  /* ---------- NeuroSmart logO ---------- */
  var NS = { bg: "#000", frame: "#5a5a5a", grey: "#444", lim: "#3d3d3d", cyan: "#2fb7b0", green: "#9be89b", blue: "#8ccff5", red: "#ff2121", orange: "#ffa300", yellow: "#ffff1a", text: "#fff", dlg: "#c9cbcd", dlgLine: "#6fc6d8", act: "#1d9fc4" };
  var NS_SIDE = [
    { id: "home", y: 88 }, { id: "wave", y: 200 }, { id: "auto", y: 312 }, { id: "mute", y: 424 }, { id: "settings", y: 536 }, { id: "help", y: 648 }
  ];
  function nsDefaultLimits() {
    return {
      icp: { label: "ICP1", unit: "mmHg", lo: 0, hi: 22, on: true, step: 1, def: [0, 22, true], v: "icp" },
      icpa: { label: "ICPA", unit: "mmHg", lo: 0, hi: 20, on: false, step: 1, def: [0, 20, false], v: "icpa" },
      cpp: { label: "CPP", unit: "mmHg", lo: 60, hi: 150, on: true, step: 1, def: [60, 150, true], v: "cpp" },
      sys: { label: "SYS", unit: "mmHg", lo: 90, hi: 180, on: false, step: 5, def: [90, 180, false], v: "sys" },
      map: { label: "MAP", unit: "mmHg", lo: 65, hi: 140, on: true, step: 1, def: [65, 140, true], v: "map" },
      dia: { label: "DIA", unit: "mmHg", lo: 40, hi: 100, on: false, step: 5, def: [40, 100, false], v: "dia" },
      po2: { label: "pO2", unit: "mmHg", lo: 20, hi: 80, on: true, step: 1, def: [20, 80, true], v: "pbto2" },
      temp: { label: "T1", unit: "°C", lo: 35.8, hi: 38, on: true, step: 0.1, def: [35.8, 38, true], v: "temp" }
    };
  }
  Sim.prototype.nsAlarms = function () {
    var v = this.v, a = [], L = this.lim;
    Object.keys(L).forEach(function (k) { var l = L[k], x = v[l.v]; if (l.on && (x < l.lo - 1e-6 || x > l.hi + 1e-6)) a.push(k); });
    return a;
  };
  Sim.prototype.isAl = function (k) { return this.alarmOn() && this.nsAlarms().indexOf(k) >= 0; };

  Sim.prototype.drawNS = function () {
    var ctx = this.ctx;
    ctx.fillStyle = NS.bg; ctx.fillRect(0, 0, W, H);
    this.nsStatus();
    this.nsSidebar();
    if (this.screen === "home") this.nsHome();
    else if (this.screen === "wave") this.nsWave();
    else this.nsAuto();
    this.drawOverlay();
  };
  Sim.prototype.nsStatus = function () {
    var ctx = this.ctx, self = this;
    box(ctx, 8, 8, 168, 68, NS.frame);
    txt(ctx, "2026-11-20", 92, 36, 19, NS.text, "center");
    txt(ctx, clock(this.simT), 92, 64, 19, NS.text, "center");
    box(ctx, 184, 8, 488, 68, NS.frame);
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(222, 32, 10, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(222, 58, 17, 11, 0, Math.PI, 0); ctx.fill();
    txt(ctx, "Patient No.", 252, 34, 19, NS.text); txt(ctx, "001", 420, 34, 19, NS.text);
    txt(ctx, "Clinic ID", 252, 62, 19, NS.text); txt(ctx, "CaTruc", 420, 62, 19, NS.text);
    this.hit(184, 8, 488, 68, function () { this.nsPatient(); });
    box(ctx, 680, 8, 156, 68, NS.frame);
    box(ctx, 702, 24, 18, 36, "#fff"); ctx.fillStyle = NS.cyan; ctx.fillRect(706, 34, 10, 22);
    txt(ctx, "96%", 790, 50, 19, NS.text, "center");
    box(ctx, 844, 8, 136, 68, NS.frame);
    box(ctx, 864, 22, 26, 38, "#fff"); ctx.fillStyle = NS.cyan; ctx.fillRect(868, 40, 18, 16);
    txt(ctx, "41%", 940, 50, 19, NS.text, "center");
    box(ctx, 988, 8, 72, 68, NS.frame);
    ctx.strokeStyle = this.locked ? NS.orange : "#fff"; ctx.lineWidth = 3; ctx.strokeRect(1012, 40, 24, 20);
    ctx.beginPath(); if (this.locked) ctx.arc(1024, 38, 8, Math.PI, 0); else ctx.arc(1016, 36, 8, Math.PI, 0); ctx.stroke();
    this.hit(988, 8, 72, 68, function () { self.locked = !self.locked; self.toast(self.locked ? "Screen locked" : "Screen unlocked"); }, "lock");
    box(ctx, 1068, 8, 136, 68, NS.frame);
    var alarm = this.nsAlarms().length > 0;
    if (!this.alarmOn()) {
      var left = Math.ceil((this.silencedUntil - this.simT) / this.speed);
      txt(ctx, Math.floor(left / 60) + ":" + pad(left % 60), 1180, 50, 19, NS.yellow, "right");
    }
    ctx.strokeStyle = alarm && this.alarmOn() && Math.floor(this.realT * 2) % 2 ? NS.red : "#fff"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(1092, 58); ctx.lineTo(1116, 58); ctx.moveTo(1096, 56); ctx.quadraticCurveTo(1096, 30, 1104, 28); ctx.quadraticCurveTo(1112, 30, 1112, 56); ctx.stroke();
    if (!this.alarmOn()) { ctx.beginPath(); ctx.moveTo(1088, 26); ctx.lineTo(1120, 60); ctx.stroke(); }
  };
  Sim.prototype.nsSidebar = function () {
    var ctx = this.ctx, self = this;
    box(ctx, 1210, 82, 66, 714, NS.frame);
    NS_SIDE.forEach(function (b) {
      var x = 1216, y = b.y, w = 54, h = 100;
      var active = (b.id === self.screen) || (b.id === "mute" && !self.alarmOn());
      ctx.fillStyle = active ? "#6a6a6a" : NS.grey; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#fff"; ctx.fillStyle = "#fff"; ctx.lineWidth = 3;
      var cx = x + w / 2, cy = y + h / 2;
      ctx.beginPath();
      if (b.id === "home") { ctx.moveTo(cx - 18, cy); ctx.lineTo(cx, cy - 16); ctx.lineTo(cx + 18, cy); ctx.moveTo(cx - 12, cy - 4); ctx.lineTo(cx - 12, cy + 16); ctx.lineTo(cx + 12, cy + 16); ctx.lineTo(cx + 12, cy - 4); }
      else if (b.id === "wave") { ctx.moveTo(cx - 20, cy); ctx.lineTo(cx - 9, cy); ctx.lineTo(cx - 4, cy - 18); ctx.lineTo(cx + 2, cy + 16); ctx.lineTo(cx + 7, cy); ctx.lineTo(cx + 20, cy); }
      else if (b.id === "auto") { ctx.rect(cx - 20, cy - 14, 40, 26); ctx.moveTo(cx - 8, cy + 18); ctx.lineTo(cx + 8, cy + 18); ctx.moveTo(cx - 12, cy); ctx.lineTo(cx + 8, cy); ctx.moveTo(cx + 2, cy - 6); ctx.lineTo(cx + 8, cy); ctx.lineTo(cx + 2, cy + 6); }
      else if (b.id === "mute") { ctx.moveTo(cx - 14, cy + 12); ctx.lineTo(cx + 14, cy + 12); ctx.moveTo(cx - 10, cy + 10); ctx.quadraticCurveTo(cx - 10, cy - 16, cx, cy - 16); ctx.quadraticCurveTo(cx + 10, cy - 16, cx + 10, cy + 10); ctx.moveTo(cx - 18, cy - 18); ctx.lineTo(cx + 18, cy + 18); }
      else if (b.id === "settings") { ctx.arc(cx, cy, 13, 0, 7); ctx.moveTo(cx + 5, cy); ctx.arc(cx, cy, 5, 0, 7); }
      else { ctx.moveTo(cx - 18, cy - 14); ctx.lineTo(cx + 18, cy - 14); ctx.lineTo(cx + 18, cy + 8); ctx.lineTo(cx - 4, cy + 8); ctx.lineTo(cx - 12, cy + 16); ctx.lineTo(cx - 12, cy + 8); ctx.lineTo(cx - 18, cy + 8); ctx.closePath(); }
      ctx.stroke();
      self.hit(x, y, w, h, function () {
        if (b.id === "home" || b.id === "wave" || b.id === "auto") { self.screen = b.id; if (self.ui.onScreen) self.ui.onScreen(b.id); }
        else if (b.id === "mute") { if (self.alarmOn()) self.silence(); else { self.silencedUntil = -1; self.toast("Alarm sound resumed"); } }
        else if (b.id === "settings") self.nsSettings("General");
        else self.nsHelp();
      });
    });
  };
  /* Ô giới hạn báo động: chạm để đặt ngưỡng */
  Sim.prototype.nsLim = function (x, y, key) {
    var ctx = this.ctx, l = this.lim[key];
    ctx.fillStyle = NS.lim; ctx.fillRect(x, y, 112, 36);
    if (l.on) {
      ctx.fillStyle = NS.cyan; ctx.fillRect(x, y, 36, 36);
      var d = l.step < 1 ? 1 : 0;
      txt(ctx, l.lo.toFixed(d) + "   " + l.hi.toFixed(d), x + 56, y + 26, 18, "#fff", "center");
    } else {
      txt(ctx, "---", x + 56, y + 26, 18, "#fff", "center");
      ctx.strokeStyle = "#bbb"; ctx.lineWidth = 2; ctx.beginPath();
      var bx = x + 132, by = y + 18;
      ctx.moveTo(bx - 9, by + 8); ctx.lineTo(bx + 9, by + 8); ctx.moveTo(bx - 6, by + 7); ctx.quadraticCurveTo(bx - 6, by - 10, bx, by - 10); ctx.quadraticCurveTo(bx + 6, by - 10, bx + 6, by + 7); ctx.moveTo(bx - 12, by - 12); ctx.lineTo(bx + 12, by + 12); ctx.stroke();
    }
    this.hit(x - 4, y - 6, 150, 48, function () { this.nsLimits(key); });
  };
  function nsValue(ctx, s, x, y, size, color, alarm, blink) {
    if (alarm) {
      ctx.fillStyle = blink ? NS.red : "#b10000";
      ctx.fillRect(x - size * 3.1, y - size * 0.95, size * 3.3, size * 1.15);
      txt(ctx, s, x, y, size, "#000", "right", "700");
    } else txt(ctx, s, x, y, size, color, "right", "700");
  }
  Sim.prototype.nsBubble = function (x, y, channel, color) {
    var ctx = this.ctx, msgs = this.nsMessages(channel), alarmed = msgs.length > 0;
    ctx.fillStyle = NS.grey; ctx.fillRect(x, y, 70, 52);
    ctx.strokeStyle = alarmed ? NS.red : (color || "#fff"); ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x + 18, y + 14); ctx.lineTo(x + 52, y + 14); ctx.lineTo(x + 52, y + 34); ctx.lineTo(x + 32, y + 34); ctx.lineTo(x + 24, y + 42); ctx.lineTo(x + 24, y + 34); ctx.lineTo(x + 18, y + 34); ctx.closePath(); ctx.stroke();
    if (alarmed) txt(ctx, String(msgs.length), x + 35, y + 31, 15, NS.red, "center", "700");
    this.hit(x, y, 70, 52, function () { this.nsMessageBox(channel); });
  };
  Sim.prototype.nsMessages = function (channel) {
    var a = this.nsAlarms(), L = this.lim, v = this.v, out = [];
    var map = { ICP1: ["icp", "icpa", "cpp"], ART: ["sys", "map", "dia"], pO2: ["po2"], T1: ["temp"], T2: [] };
    (map[channel] || []).forEach(function (k) {
      if (a.indexOf(k) >= 0) { var l = L[k], x = v[l.v]; out.push(l.label + (x > l.hi ? " high (> " + l.hi + " " + l.unit + ")" : " low (< " + l.lo + " " + l.unit + ")")); }
    });
    return out;
  };
  Sim.prototype.nsHome = function () {
    var ctx = this.ctx, v = this.v, blink = Math.floor(this.realT * 2) % 2 === 0, self = this;
    var L = 8, M = 604, R = 1200, w1 = M - L - 6, w2 = R - M - 6;
    function big(x, y, w, h, key) { self.hit(x, y, 110, 70, function () { this.nsBig(key); }); }
    // ICP1
    box(ctx, L, 84, w1, 268, NS.frame);
    txt(ctx, "ICP1", L + 8, 128, 34, NS.cyan); txt(ctx, "(mmHg)", L + 18, 156, 16, NS.cyan);
    nsValue(ctx, fmt(v.icp, 1), 414, 146, 46, NS.cyan, this.isAl("icp"), blink);
    this.nsLim(432, 108, "icp");
    txt(ctx, "ICPA", 190, 210, 22, NS.cyan, "center"); nsValue(ctx, fmt(v.icpa, 1), 414, 216, 36, NS.cyan, this.isAl("icpa"), blink); this.nsLim(432, 184, "icpa");
    txt(ctx, "CPP", 190, 276, 22, NS.green, "center"); nsValue(ctx, fmt(v.cpp, 0), 414, 284, 40, NS.green, this.isAl("cpp"), blink); this.nsLim(432, 252, "cpp");
    txt(ctx, "SYS/DIA", 180, 334, 17, NS.cyan, "center"); txt(ctx, fmt(v.icp + v.icpa * 0.6, 0) + "/" + fmt(v.icp - v.icpa * 0.4, 0), 414, 336, 20, NS.cyan, "right", "700");
    this.hit(L, 84, 280, 80, function () { this.nsBig("icp"); });
    this.hit(200, 100, 230, 60, function () { this.nsBig("icp"); });
    this.nsBubble(L + 14, 290, "ICP1");
    // ART
    box(ctx, M, 84, w2, 268, NS.frame);
    txt(ctx, "ART", M + 12, 128, 34, NS.red); txt(ctx, "(mmHg)", M + 14, 154, 16, NS.red);
    txt(ctx, "SYS", 790, 140, 24, NS.red, "center"); nsValue(ctx, String(v.sys), 1050, 150, 50, NS.red, this.isAl("sys"), blink); this.nsLim(1070, 116, "sys");
    txt(ctx, "MAP", 790, 212, 22, NS.red, "center"); nsValue(ctx, fmt(v.map, 0), 1050, 216, 28, NS.red, this.isAl("map"), blink); this.nsLim(1070, 188, "map");
    txt(ctx, "DIA", 790, 282, 24, NS.red, "center"); nsValue(ctx, String(v.dia), 1050, 292, 50, NS.red, this.isAl("dia"), blink); this.nsLim(1070, 258, "dia");
    this.hit(M, 84, 110, 60, function () { this.nsBig("map"); });
    // nút zero ART
    ctx.fillStyle = NS.grey; ctx.fillRect(M + 14, 222, 70, 52);
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(M + 49, 248, 9, 0, 7);
    ctx.moveTo(M + 22, 248); ctx.lineTo(M + 36, 248); ctx.moveTo(M + 30, 242); ctx.lineTo(M + 36, 248); ctx.lineTo(M + 30, 254);
    ctx.moveTo(M + 76, 248); ctx.lineTo(M + 62, 248); ctx.moveTo(M + 68, 242); ctx.lineTo(M + 62, 248); ctx.lineTo(M + 68, 254); ctx.stroke();
    this.hit(M + 14, 222, 70, 52, function () { this.nsZero(); });
    this.nsBubble(M + 14, 290, "ART");
    // pO2
    box(ctx, L, 360, w1, 216, NS.frame);
    txt(ctx, "pO2", L + 14, 404, 34, NS.blue); txt(ctx, "(mmHg)", L + 18, 432, 16, NS.blue);
    var poAl = this.isAl("po2");
    ctx.fillStyle = poAl ? (blink ? NS.red : "#b10000") : "#000"; ctx.fillRect(140, 372, 284, 78);
    txt(ctx, fmt(v.pbto2, 1), 414, 434, 50, poAl ? "#000" : NS.blue, "right", "700");
    this.nsLim(432, 392, "po2");
    txt(ctx, "Amplitude", 200, 498, 18, NS.blue, "center"); txt(ctx, "412", 414, 502, 22, NS.blue, "right", "700");
    txt(ctx, "SN", 200, 556, 18, NS.blue, "center"); txt(ctx, "E 820 3410", 414, 556, 18, NS.blue, "right");
    this.hit(L, 360, 420, 90, function () { this.nsBig("po2"); });
    this.nsBubble(L + 14, 510, "pO2");
    // CPPopt
    box(ctx, M, 360, w2, 216, NS.frame);
    txt(ctx, "CPPopt", M + 14, 404, 30, NS.green); txt(ctx, "(mmHg)", M + 16, 430, 16, NS.green);
    var ready = this.hist.length > 120;
    txt(ctx, ready ? String(v.cppopt) : "---", 1050, 430, 50, NS.green, "right", "700");
    txt(ctx, "PRx", M + 14, 500, 30, "#fff"); txt(ctx, fmt(v.prx, 2), 1050, 504, 40, v.prx > 0.3 ? NS.red : "#fff", "right", "700");
    txt(ctx, "ORx", M + 14, 556, 22, "#fff"); txt(ctx, fmt(v.orx, 2), 1050, 558, 26, "#fff", "right", "700");
    this.hit(M, 360, w2, 216, function () { this.screen = "auto"; if (this.ui.onScreen) this.ui.onScreen("auto"); });
    // T1 + T2
    box(ctx, L, 584, w1, 210, NS.frame);
    txt(ctx, "T1", L + 10, 630, 34, NS.orange); txt(ctx, "(°C)", L + 58, 628, 17, NS.orange);
    var tAl = this.isAl("temp");
    ctx.fillStyle = tAl && blink ? NS.red : NS.yellow; ctx.fillRect(140, 598, 284, 78);
    txt(ctx, fmt(v.temp, 2), 414, 660, 50, "#000", "right", "700"); this.nsLim(432, 618, "temp");
    this.hit(140, 598, 284, 78, function () { this.nsBig("temp"); });
    this.nsBubble(L + 14, 716, "T1", NS.yellow);
    box(ctx, M, 584, w2, 210, NS.frame);
    txt(ctx, "T2", M + 12, 630, 34, NS.orange); txt(ctx, "(°C)", M + 60, 628, 17, NS.orange);
    txt(ctx, "---", 1050, 660, 46, "#777", "right", "700");
    this.nsBubble(M + 14, 716, "T2", NS.yellow);
  };

  /* Hộp thoại kiểu NeuroSmart */
  Sim.prototype.nsDialog = function (x, y, w, h, title) {
    var ctx = this.ctx;
    ctx.fillStyle = NS.dlg; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = NS.dlgLine; ctx.lineWidth = 4; ctx.strokeRect(x, y, w, h);
    txt(ctx, title, x + w / 2, y + 46, 30, "#111", "center");
  };
  Sim.prototype.nsOkCancel = function (x, y, w, onOk, onCancel) {
    var half = (w - 12) / 2;
    this.button(x, y, half, 54, "", onCancel || function () { this.closeModal(); }, { icon: "x", fill: "#3b3d40" });
    this.button(x + half + 12, y, half, 54, "", onOk, { icon: "ok", fill: "#3b3d40" });
  };
  Sim.prototype.nsLimits = function (key) {
    var l = this.lim[key], d = { lo: l.lo, hi: l.hi, on: l.on }, dec = l.step < 1 ? 1 : 0;
    function step(which, dir) {
      var nv = Math.round((d[which] + dir * l.step) * 10) / 10;
      if (which === "lo" && nv >= d.hi) return; if (which === "hi" && nv <= d.lo) return;
      d[which] = nv;
    }
    this.modal = { outside: false, draw: function (ctx) {
      var x = 330, y = 150, w = 560, h = 470;
      this.nsDialog(x, y, w, h, "Set Alarm Limits");
      var rows = [["lo", l.label + " min"], ["hi", l.label + " max"]], self = this;
      rows.forEach(function (r, i) {
        var ry = y + 90 + i * 74;
        txt(ctx, r[1] + " (" + l.unit + ")", x + 30, ry + 34, 22, "#111");
        ctx.fillStyle = "#fff"; ctx.fillRect(x + 250, ry, 120, 50);
        txt(ctx, d[r[0]].toFixed(dec), x + 310, ry + 34, 24, "#111", "center", "500");
        self.button(x + 384, ry, 66, 50, "−", function () { step(r[0], -1); }, { size: 32 });
        self.button(x + 458, ry, 66, 50, "+", function () { step(r[0], 1); }, { size: 32 });
      });
      var ty = y + 250;
      this.button(x + 250, ty, 274, 54, (d.on ? "☑  Alarm Active" : "☐  Alarm Inactive"), function () { d.on = !d.on; }, { fill: d.on ? NS.act : "#7d8084", size: 22 });
      this.button(x + 250, ty + 70, 274, 50, "Reset to Default", function () { d.lo = l.def[0]; d.hi = l.def[1]; d.on = l.def[2]; }, { size: 20 });
      this.nsOkCancel(x + 30, y + h - 80, w - 60, function () { l.lo = d.lo; l.hi = d.hi; l.on = d.on; this.closeModal(); this.toast("Alarm limits saved: " + l.label + " " + d.lo.toFixed(dec) + " – " + d.hi.toFixed(dec) + " " + l.unit + (d.on ? "" : " (alarm inactive)")); });
    } };
  };
  Sim.prototype.nsMessageBox = function (channel) {
    this.modal = { outside: true, draw: function (ctx) {
      var x = 300, y = 200, w = 620, h = 360, msgs = this.nsMessages(channel);
      this.nsDialog(x, y, w, h, "Messages · " + channel);
      if (!msgs.length) txt(ctx, "No messages for this channel.", x + w / 2, y + 150, 22, "#333", "center");
      msgs.forEach(function (m, i) { ctx.fillStyle = "#fff"; ctx.fillRect(x + 30, y + 80 + i * 60, w - 60, 50); ctx.fillStyle = NS.red; ctx.fillRect(x + 30, y + 80 + i * 60, 10, 50); txt(ctx, m, x + 56, y + 113 + i * 60, 20, "#111"); });
      this.button(x + 30, y + h - 80, w - 60, 54, "", function () { this.closeModal(); }, { icon: "ok" });
    } };
  };
  Sim.prototype.nsZero = function () {
    this.modal = { outside: false, draw: function (ctx) {
      var x = 300, y = 220, w = 620, h = 320;
      this.nsDialog(x, y, w, h, "Conventional zeroing");
      txt(ctx, "Open the transducer to the atmosphere and wait", x + w / 2, y + 110, 21, "#c00", "center");
      txt(ctx, "5 seconds. Then press the \"Confirmation button\".", x + w / 2, y + 140, 21, "#c00", "center");
            this.nsOkCancel(x + 30, y + h - 80, w - 60, function () { this.closeModal(); this.toast("ART: zeroing completed (0 mmHg)"); });
    } };
  };
  Sim.prototype.nsPatient = function () {
    this.modal = { outside: true, draw: function (ctx) {
      var x = 330, y = 180, w = 560, h = 400;
      this.nsDialog(x, y, w, h, "Patient");
      [["Patient No.", "001"], ["Clinic ID", "CaTruc"], ["Start", "2026-11-20 08:00"], ["Measurement", "Simulation"]].forEach(function (r, i) {
        txt(ctx, r[0], x + 30, y + 110 + i * 56, 21, "#111");
        ctx.fillStyle = "#fff"; ctx.fillRect(x + 200, y + 82 + i * 56, w - 230, 42);
        txt(ctx, r[1], x + 214, y + 110 + i * 56, 19, "#111");
      });
      this.button(x + 30, y + h - 80, w - 60, 54, "", function () { this.closeModal(); }, { icon: "ok" });
    } };
  };
  Sim.prototype.nsBig = function (key) {
    var l = this.lim[key];
    this.modal = { outside: true, draw: function (ctx) {
      ctx.fillStyle = "#000"; ctx.fillRect(8, 84, 1196, 712);
      box(ctx, 8, 84, 1196, 712, NS.frame);
      var colors = { icp: NS.orange, map: NS.red, po2: NS.blue, temp: NS.yellow };
      var c = colors[key] || "#fff", val = this.v[l.v], al = this.isAl(key);
      txt(ctx, l.label, 40, 190, 64, c); txt(ctx, "(" + l.unit + ")", 44, 236, 26, c);
      if (al) { ctx.fillStyle = Math.floor(this.realT * 2) % 2 ? NS.red : "#b10000"; ctx.fillRect(300, 300, 640, 300); }
      txt(ctx, fmt(val, l.step < 1 ? 2 : key === "map" ? 0 : 1), 920, 540, 240, al ? "#000" : c, "right", "700");
      ctx.fillStyle = NS.lim; ctx.fillRect(960, 380, 200, 64);
      if (l.on) { ctx.fillStyle = NS.cyan; ctx.fillRect(960, 380, 64, 64); }
      txt(ctx, l.on ? l.lo + "   " + l.hi : "---", 1060, 424, 28, "#fff", "center");
      this.hit(960, 380, 200, 64, function () { this.nsLimits(key); });
      txt(ctx, "Touch anywhere to return", 606, 760, 20, "#888", "center");
    } };
  };
  Sim.prototype.nsSettings = function (tab) {
    var self = this;
    this.modal = { outside: false, tab: tab || "General", draw: function (ctx) {
      var m = this.modal, x = 200, y = 110, w = 820, h = 600;
      this.nsDialog(x, y, w, h, "Settings");
      var tabs = ["General", "Date/Time", "Alarm Limits", "Info"];
      tabs.forEach(function (t, i) {
        var tx = x + 30 + i * 190;
        self.button(tx, y + 70, 182, 44, t, function () { m.tab = t; }, { fill: m.tab === t ? "#fff" : "#7d8084", color: m.tab === t ? "#111" : "#fff", size: 19 });
      });
      ctx.fillStyle = "#e6e7e8"; ctx.fillRect(x + 30, y + 114, w - 60, 380);
      var cy = y + 160;
      if (m.tab === "General") {
        txt(ctx, "Language", x + 60, cy, 21, "#111"); ctx.fillStyle = "#fff"; ctx.fillRect(x + 380, cy - 32, 240, 44); txt(ctx, "English", x + 500, cy - 2, 20, "#111", "center");
        this.button(x + 630, cy - 32, 60, 44, "◀", function () { self.toast("Language: English"); }, { size: 20 });
        this.button(x + 698, cy - 32, 60, 44, "▶", function () { self.toast("Language: English"); }, { size: 20 });
        cy += 80;
        txt(ctx, "Display Brightness", x + 60, cy, 21, "#111");
        var b = self.bright == null ? 5 : self.bright;
        ctx.fillStyle = "#fff"; ctx.fillRect(x + 380, cy - 32, 240, 44); ctx.fillStyle = NS.act; ctx.fillRect(x + 380, cy - 32, 240 * b / 5, 44);
        this.button(x + 630, cy - 32, 60, 44, "−", function () { self.bright = Math.max(1, b - 1); }, { size: 28 });
        this.button(x + 698, cy - 32, 60, 44, "+", function () { self.bright = Math.min(5, b + 1); }, { size: 28 });
        cy += 80;
        txt(ctx, "Key Sound", x + 60, cy, 21, "#111");
        this.button(x + 380, cy - 32, 378, 44, self.keySound === false ? "☐  Inactive" : "☑  Active", function () { self.keySound = self.keySound === false; }, { fill: self.keySound === false ? "#7d8084" : NS.act, size: 20 });
      } else if (m.tab === "Date/Time") {
        txt(ctx, "Date", x + 60, cy, 21, "#111"); txt(ctx, "2026-11-20", x + 380, cy, 22, "#111");
        txt(ctx, "Time", x + 60, cy + 70, 21, "#111"); txt(ctx, clock(self.simT), x + 380, cy + 70, 22, "#111");
        txt(ctx, "Format", x + 60, cy + 140, 21, "#111"); txt(ctx, "yyyy-mm-dd 24h", x + 380, cy + 140, 22, "#111");
        txt(ctx, "(Time follows the simulation scenario)", x + 60, cy + 210, 18, "#555");
      } else if (m.tab === "Alarm Limits") {
        var keys = ["icp", "icpa", "cpp", "map", "po2", "temp"];
        txt(ctx, "Touch a row to change the limits", x + 60, cy - 10, 18, "#555");
        keys.forEach(function (k, i) {
          var l = self.lim[k], ry = cy + 10 + i * 52, dec = l.step < 1 ? 1 : 0;
          ctx.fillStyle = "#fff"; ctx.fillRect(x + 50, ry, w - 100, 44);
          txt(ctx, l.label, x + 70, ry + 30, 20, "#111", "left", "500");
          txt(ctx, l.lo.toFixed(dec) + " – " + l.hi.toFixed(dec) + " " + l.unit, x + 330, ry + 30, 20, "#111");
          ctx.fillStyle = l.on ? NS.act : "#7d8084"; ctx.fillRect(x + w - 250, ry + 6, 180, 32);
          txt(ctx, l.on ? "Alarm Active" : "Inactive", x + w - 160, ry + 29, 17, "#fff", "center");
          self.hit(x + 50, ry, w - 100, 44, function () { self.nsLimits(k); });
        });
      } else {
        txt(ctx, "Device", x + 60, cy, 21, "#111"); txt(ctx, "NeuroSmart logO (simulation)", x + 380, cy, 21, "#111");
        txt(ctx, "Software", x + 60, cy + 60, 21, "#111"); txt(ctx, "Bác sĩ Hồi sức Simulator 1.0", x + 380, cy + 60, 21, "#111");
        txt(ctx, "Resolution", x + 60, cy + 120, 21, "#111"); txt(ctx, "1280 × 800", x + 380, cy + 120, 21, "#111");
        txt(ctx, "For training only. Not for patient use.", x + 60, cy + 200, 19, "#c00");
      }
      this.nsOkCancel(x + 30, y + h - 82, w - 60, function () { this.closeModal(); });
    } };
  };
  Sim.prototype.nsHelp = function () {
    this.modal = { outside: true, draw: function (ctx) {
      var x = 220, y = 110, w = 780, h = 600;
      this.nsDialog(x, y, w, h, "Help");
      ["Touch ICP1, MAP, pO2 or T1 values: enlarged view.",
        "Touch the grey limit box next to a value: Set Alarm Limits.",
        "Touch the message bubble: channel messages.",
        "Touch →0← in the ART tile: conventional zeroing.",
        "Touch the CPPopt tile: autoregulation screen.",
        "Side bar: Home · Curves · Autoregulation · Alarm mute",
        "     · Settings · Help.",
        "Touch the lock icon: lock or unlock the screen."].forEach(function (s, i) { txt(ctx, s, x + 40, y + 110 + i * 48, 21, "#111"); });
      this.button(x + 30, y + h - 82, w - 60, 54, "", function () { this.closeModal(); }, { icon: "ok" });
    } };
  };

  Sim.prototype.nsWave = function () {
    var ctx = this.ctx, v = this.v, x = 20, w = 840, self = this;
    if (this.waveFrozen == null) this.waveFrozen = false;
    var panels = [
      { y: 92, h: 210, label: "ICP1", unit: "mmHg", lo: 0, hi: Math.max(30, Math.ceil((v.icp + 12) / 10) * 10), buf: this.icpBuf, color: NS.cyan, val: fmt(v.icp, 1) },
      { y: 318, h: 210, label: "ART", unit: "mmHg", lo: 40, hi: 160, buf: this.artBuf, color: NS.red, val: v.sys + "/" + v.dia }
    ];
    panels.forEach(function (p) {
      box(ctx, 8, p.y - 8, 862, p.h + 16, NS.frame);
      ctx.strokeStyle = "#333"; ctx.lineWidth = 1;
      for (var g = 0; g <= 4; g++) { var gy = p.y + p.h * g / 4; ctx.beginPath(); ctx.moveTo(x + 50, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
      txt(ctx, String(p.hi), x + 40, p.y + 16, 16, "#bbb", "right"); txt(ctx, String(p.lo), x + 40, p.y + p.h, 16, "#bbb", "right");
      waveFromBuf(ctx, p.buf, self.head, x + 56, p.y + 4, w - 60, p.h - 8, p.lo, p.hi, p.color);
      box(ctx, 878, p.y - 8, 326, p.h + 16, NS.frame);
      txt(ctx, p.label, 892, p.y + 36, 30, p.color); txt(ctx, "(" + p.unit + ")", 892, p.y + 60, 16, p.color);
      txt(ctx, p.val, 1190, p.y + 150, p.label === "ART" ? 46 : 64, p.color, "right", "700");
    });
    var y = 544, h = 210;
    box(ctx, 8, y - 8, 862, h + 52, NS.frame);
    ctx.strokeStyle = "#333";
    for (var g = 0; g <= 4; g++) { var gy = y + h * g / 4; ctx.beginPath(); ctx.moveTo(x + 50, gy); ctx.lineTo(x + w, gy); ctx.stroke(); }
    txt(ctx, "60", x + 40, y + 16, 16, "#bbb", "right"); txt(ctx, "0", x + 40, y + h, 16, "#bbb", "right");
    ctx.setLineDash([6, 6]); ctx.strokeStyle = NS.red; var ty = y + h - this.lim.po2.lo / 60 * h; ctx.beginPath(); ctx.moveTo(x + 56, ty); ctx.lineTo(x + w, ty); ctx.stroke(); ctx.setLineDash([]);
    trendLine(ctx, this.hist, "pbto2", x + 56, y, w - 60, h, 0, 60, 600, this.simT, function () { return NS.blue; });
    txt(ctx, hhmm(Math.max(0, this.simT - 600)), x + 60, y + h + 32, 16, "#bbb"); txt(ctx, hhmm(this.simT), x + w, y + h + 32, 16, "#bbb", "right");
    txt(ctx, "Trend 10 min", x + w / 2, y + h + 32, 16, "#bbb", "center");
    box(ctx, 878, y - 8, 326, h + 52, NS.frame);
    txt(ctx, "pO2", 892, y + 36, 30, NS.blue); txt(ctx, "(mmHg)", 892, y + 60, 16, NS.blue);
    txt(ctx, fmt(v.pbto2, 1), 1190, y + 150, 64, v.pbto2 < this.lim.po2.lo ? NS.red : NS.blue, "right", "700");
    txt(ctx, "CPP " + fmt(v.cpp, 0), 1190, y + 220, 26, NS.green, "right", "700");
    this.hit(878, 84, 326, 226, function () { this.nsBig("icp"); });
    this.hit(878, 310, 326, 226, function () { this.nsBig("map"); });
    this.hit(878, 536, 326, 262, function () { this.nsBig("po2"); });
  };
  Sim.prototype.nsAuto = function () {
    var ctx = this.ctx, v = this.v, win = 900, now = this.simT;
    function band(y, key) {
      box(ctx, 8, y, 848, 146, NS.frame);
      var gx = 70, gw = 770, gy = y + 12, gh = 92;
      ctx.strokeStyle = "#666"; ctx.lineWidth = 1;
      [1, 0.5, 0, -0.5, -1].forEach(function (k) { var yy = gy + (1 - k) / 2 * gh; txt(ctx, k.toFixed(1), gx - 12, yy + 5, 14, "#ccc", "right"); });
      ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke();
      for (var i = 0; i <= 12; i++) { var xx = gx + gw * i / 12; ctx.beginPath(); ctx.moveTo(xx, gy); ctx.lineTo(xx, gy + gh); ctx.stroke(); }
      trendLine(ctx, this.hist, key, gx, gy, gw, gh, -1, 1, win, now, function () { return "#fff"; });
      var start = Math.max(0, Math.floor(now - win));
      for (var s = start; s < this.hist.length; s += 10) {
        var val = this.hist[s][key];
        ctx.fillStyle = val < 0 ? "#00c000" : val < 0.3 ? "#c8c800" : "#e00000";
        var px = gx + (s - (now - win)) / win * gw;
        ctx.fillRect(px, gy + gh + 6, gw / win * 10 + 1, 22);
      }
    }
    band.call(this, 84, "orx");
    band.call(this, 238, "prx");
    box(ctx, 8, 392, 848, 64, NS.frame);
    for (var i = 0; i <= 6; i++) { var tt = now - win + win * i / 6; txt(ctx, hhmm(Math.max(-28000, tt)), 70 + 770 * i / 6, 432, 16, "#ddd", "center"); }
    ctx.fillStyle = "#fff"; ctx.fillRect(70 + 770 * 5 / 6, 444, 770 / 6, 5);
    var gx = 70, gy = 476, gw = 770, gh = 280;
    box(ctx, 8, 462, 848, 332, NS.frame);
    ctx.strokeStyle = "#666"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx, gy + gh / 2); ctx.lineTo(gx + gw, gy + gh / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.stroke();
    txt(ctx, "1.0", gx - 10, gy + 10, 14, "#ccc", "right"); txt(ctx, "0.0", gx - 10, gy + gh / 2 + 5, 14, "#ccc", "right"); txt(ctx, "-1.0", gx - 10, gy + gh, 14, "#ccc", "right");
    function X(cpp) { return gx + (cpp - 40) / 100 * gw; }
    function Y(prx) { return gy + (1 - clamp(prx, -1, 1)) / 2 * gh; }
    for (var c = 40; c <= 140; c += 5) txt(ctx, String(c), X(c), gy + gh + 26, 14, "#ccc", "center");
    var opt = this.scenario().cppopt, base = this.scenario().p(now).prxBase;
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 2; ctx.beginPath();
    for (var cc = 40; cc <= 136; cc += 1) {
      var d = cc - opt, pr = base + (d < 0 ? 0.0016 * d * d : 0.0003 * d * d);
      if (cc === 40) ctx.moveTo(X(cc), Y(pr)); else ctx.lineTo(X(cc), Y(pr));
    }
    ctx.stroke();
    var bins = {}, start = Math.max(0, Math.floor(now - 4 * 3600));
    for (var s = start; s < this.hist.length; s++) { var b = Math.round(this.hist[s].cpp / 5) * 5; (bins[b] = bins[b] || []).push(this.hist[s].prx); }
    ctx.fillStyle = NS.green;
    Object.keys(bins).forEach(function (k) { var arr = bins[k], m = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length; ctx.beginPath(); ctx.arc(X(+k), Y(m), 6, 0, 7); ctx.fill(); });
    var ready = this.hist.length > 120;
    if (ready) { ctx.strokeStyle = NS.green; ctx.beginPath(); ctx.moveTo(X(opt), gy); ctx.lineTo(X(opt), gy + gh); ctx.stroke(); }
    ctx.strokeStyle = NS.orange; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.moveTo(X(v.cpp), gy); ctx.lineTo(X(v.cpp), gy + gh); ctx.stroke(); ctx.setLineDash([]);
    txt(ctx, "CPP", X(v.cpp) + 6, gy + 22, 14, NS.orange);
    box(ctx, 866, 84, 338, 146, NS.frame);
    txt(ctx, "ORx", 890, 140, 32, "#fff", "left", "700"); txt(ctx, fmt(v.orx, 2), 1188, 144, 46, "#fff", "right", "700");
    txt(ctx, "pO2", 890, 196, 30, NS.blue); txt(ctx, fmt(v.pbto2, 1), 1188, 200, 30, v.pbto2 < this.lim.po2.lo ? NS.red : NS.blue, "right", "700");
    box(ctx, 866, 238, 338, 146, NS.frame);
    txt(ctx, "PRx", 890, 294, 32, "#fff", "left", "700"); txt(ctx, fmt(v.prx, 2), 1188, 298, 46, v.prx > 0.3 ? NS.red : "#fff", "right", "700");
    txt(ctx, "ICP1", 890, 352, 30, NS.yellow); txt(ctx, fmt(v.icp, 1), 1188, 352, 30, NS.yellow, "right", "700");
    box(ctx, 866, 462, 338, 332, NS.frame);
    txt(ctx, "CPPopt", 890, 510, 30, NS.green); txt(ctx, "(mmHg)", 1010, 508, 15, NS.green);
    txt(ctx, ready ? String(opt) : "---", 1035, 600, 72, NS.green, "center", "700");
    txt(ctx, "CPP", 890, 668, 30, NS.green); txt(ctx, fmt(v.cpp, 0), 1188, 668, 30, NS.green, "right", "700");
    txt(ctx, "ART", 890, 720, 30, NS.red); txt(ctx, v.sys + "  /  " + v.dia, 1188, 760, 30, NS.red, "right", "700");
    this.hit(866, 84, 338, 146, function () { this.nsBig("po2"); });
    this.hit(866, 238, 338, 146, function () { this.nsBig("icp"); });
    this.hit(8, 462, 848, 332, function () { this.nsInfo("CPPopt", ["Curve: mean PRx per 5 mmHg CPP bin.", "The curve minimum is CPPopt (best autoregulation).", "Orange line: current CPP.", "Green line: CPPopt."]); });
  };
  Sim.prototype.nsInfo = function (title, lines) {
    this.modal = { outside: true, draw: function (ctx) {
      var x = 260, y = 200, w = 700, h = 140 + lines.length * 44;
      this.nsDialog(x, y, w, h, title);
      lines.forEach(function (s, i) { txt(ctx, s, x + 40, y + 100 + i * 44, 21, "#111"); });
      this.button(x + 30, y + h - 72, w - 60, 50, "", function () { this.closeModal(); }, { icon: "ok" });
    } };
  };

  Sim.prototype.silence = function () {
    this.silencedUntil = this.simT + 120;
    this.toast("Alarm sound paused for 2 min");
  };

  /* Can thiệp của giảng viên */
  Sim.prototype.raiseMap = function (d) { this.mapOffsetTarget += d; };
  Sim.prototype.giveFluid = function () { this.fluidBase = this.fluid; this.fluidT = this.simT; };
  Sim.prototype.giveVaso = function () { this.vasoT = this.simT; };
  Sim.prototype.skipToNext = function () {
    var sc = this.scenario(), next = null;
    sc.notes.concat(sc.questions.map(function (q) { return [q.t]; })).forEach(function (n) { if (n[0] > this.simT + 1 && (next === null || n[0] < next)) next = n[0]; }, this);
    if (next !== null) this.simT = next - 2;
    this.running = true;
  };

  window.CatrucSim = { Sim: Sim, SCENARIOS: SCENARIOS, util: { txt: txt, fmt: fmt, clamp: clamp, clock: clock, hhmm: hhmm, pad: pad, waveFromBuf: waveFromBuf, trendLine: trendLine } };
})();
