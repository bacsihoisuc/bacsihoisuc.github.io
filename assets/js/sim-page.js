/* Bác sĩ Hồi sức — nối trang simulator với bộ mô phỏng. Thiết bị lấy từ <body data-device="neurosmart|hemosphere">. */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var device = document.body.getAttribute("data-device") || "neurosmart";
  var INTERVENTIONS = {
    neurosmart: [
      ["Tăng MAP 10 mmHg", function (s) { s.raiseMap(10); return "Đã tăng MAP 10 mmHg (vận mạch). CPP tăng sau khoảng 30–60 giây mô phỏng."; }],
      ["Giảm MAP 10 mmHg", function (s) { s.raiseMap(-10); return "Đã giảm MAP 10 mmHg. Quan sát CPP, PRx và pO2."; }]
    ],
    hemosphere: [
      ["Bù dịch 250 ml", function (s) { s.giveFluid(); if (s.alta) s.alta.events.unshift({ t: s.simT, kind: "int", color: "#3a8ee6", text: "Crystalloid – 250 mL" }); return "Đang truyền 250 ml dịch tinh thể. Quan sát SV và SVV trong 1–2 phút mô phỏng."; }],
      ["Dùng vận mạch", function (s) { s.giveVaso(); if (s.alta) s.alta.events.unshift({ t: s.simT, kind: "int", color: "#54c45e", text: "Vasopressor – Start" }); return "Bắt đầu thuốc co mạch. MAP tăng, HPI giảm."; }]
    ]
  };
  var sim;
  var ui = {
    onLoad: function (sc) {
      $("sim-note").textContent = sc.desc;
      $("question").hidden = true;
      renderScenarios();
      $("btn-play").textContent = "Tạm dừng";
    },
    onNote: function (t) { $("sim-note").textContent = t; },
    onEnd: function () { $("btn-play").textContent = "Chạy tiếp"; $("sim-note").textContent = "Kết thúc kịch bản. Bấm “Chạy lại” hoặc chọn kịch bản khác."; },
    onScreen: function (id) { syncScreenTabs(id); },
    onQuestion: function (q) {
      $("btn-play").textContent = "Chạy tiếp";
      $("question").hidden = false;
      $("q-text").textContent = q.q;
      $("q-why").hidden = true; $("q-continue").hidden = true;
      var box = $("q-opts"); box.innerHTML = "";
      q.opts.forEach(function (o, i) {
        var b = document.createElement("button");
        b.type = "button"; b.className = "q-opt"; b.textContent = o;
        b.addEventListener("click", function () {
          Array.prototype.forEach.call(box.children, function (c, j) {
            c.disabled = true;
            if (j === q.a) c.classList.add("right");
            else if (j === i) c.classList.add("wrong");
          });
          $("q-why").textContent = (i === q.a ? "Đúng. " : "Chưa đúng. ") + q.why;
          $("q-why").hidden = false; $("q-continue").hidden = false;
        });
        box.appendChild(b);
      });
    },
    onTick: function (s) {
      var sc = s.scenario();
      var m = function (t) { t = Math.floor(t); return (t < 600 ? "0" : "") + Math.floor(t / 60) + ":" + ("0" + (t % 60)).slice(-2); };
      $("sim-clock").textContent = m(s.simT) + " / " + m(sc.duration);
      $("progress-bar").style.width = (s.simT / sc.duration * 100).toFixed(1) + "%";
    }
  };
  function renderScenarios() {
    var list = $("scenario-list"); list.innerHTML = "";
    CatrucSim.SCENARIOS[device].forEach(function (sc) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "scenario";
      b.setAttribute("aria-pressed", sim && sim.sid === sc.id ? "true" : "false");
      b.innerHTML = "<strong></strong><span></span>";
      b.querySelector("strong").textContent = sc.name;
      b.querySelector("span").textContent = sc.desc;
      b.addEventListener("click", function () { sim.load(sc.id); });
      list.appendChild(b);
    });
    var iv = $("interventions"); iv.innerHTML = "";
    INTERVENTIONS[device].forEach(function (it) {
      var b = document.createElement("button");
      b.type = "button"; b.className = "btn btn-ghost"; b.textContent = it[0];
      b.addEventListener("click", function () { $("sim-note").textContent = it[1](sim); });
      iv.appendChild(b);
    });
  }
  function syncScreenTabs(id) {
    Array.prototype.forEach.call(document.querySelectorAll("#screen-tabs button"), function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-screen") === id ? "true" : "false");
    });
  }
  sim = new CatrucSim.Sim($("sim-screen"), ui);
  if (device !== "neurosmart") sim.setDevice(device);
  renderScenarios();

  Array.prototype.forEach.call(document.querySelectorAll("#screen-tabs button"), function (b) {
    b.addEventListener("click", function () { sim.screen = b.getAttribute("data-screen"); syncScreenTabs(sim.screen); });
  });
  $("btn-play").addEventListener("click", function () {
    sim.running = !sim.running;
    if (sim.running) $("question").hidden = true;
    this.textContent = sim.running ? "Tạm dừng" : "Chạy tiếp";
  });
  $("btn-restart").addEventListener("click", function () { sim.load(sim.sid); });
  $("btn-next").addEventListener("click", function () { $("question").hidden = true; sim.skipToNext(); $("btn-play").textContent = "Tạm dừng"; });
  $("speed").addEventListener("change", function () { sim.speed = +this.value; });
  $("q-continue").addEventListener("click", function () { $("question").hidden = true; sim.running = true; $("btn-play").textContent = "Tạm dừng"; });
  function setMode(m) {
    sim.mode = m;
    $("mode-teach").setAttribute("aria-pressed", m === "teach" ? "true" : "false");
    $("mode-learn").setAttribute("aria-pressed", m === "learn" ? "true" : "false");
  }
  $("mode-teach").addEventListener("click", function () { setMode("teach"); });
  $("mode-learn").addEventListener("click", function () { setMode("learn"); });
  var fs = $("btn-full");
  if (fs) fs.addEventListener("click", function () {
    var el = document.querySelector(".device");
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (document.fullscreenElement) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    else if (req) { var r = req.call(el); if (r && r.catch) r.catch(function () {}); }
  });
})();
