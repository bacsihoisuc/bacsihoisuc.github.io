/* Bác sĩ Hồi sức — dựng thẻ tin, danh sách bài, sóng monitor từ dữ liệu. Cần: hinh.js, tin-tuc.js */
(function () {
  var root = document.documentElement.getAttribute("data-root") || "./";
  var LOAI = window.CATRUC_LOAI_TIN || {};

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function href(link) { return /^https?:\/\//.test(link || "") ? link : root + (link || ""); }
  function ext(link) { return /^https?:\/\//.test(link || "") ? ' target="_blank" rel="noopener"' : ""; }
  function kicker(t) { return '<span class="kicker k-' + esc(t.loai) + '">' + esc(LOAI[t.loai] || t.loai) + (t.chu_de ? " · " + esc(t.chu_de) : "") + "</span>"; }
  function fig(t, slice) { return '<span class="fig">' + window.CatrucHinh.svg(t.hinh, "Minh họa: " + t.tieu_de, slice) + "</span>"; }
  function byline(t) { return t.nguon ? '<span class="byline">' + esc(t.nguon) + "</span>" : ""; }

  var UI = {
    esc: esc, href: href,
    story: function (t, o) {
      o = o || {};
      return '<a class="story" href="' + href(t.link) + '"' + ext(t.link) + ">" + (o.fig === false ? "" : fig(t)) + kicker(t) +
        '<span class="story-title">' + esc(t.tieu_de) + "</span>" +
        (o.sum ? '<span class="story-sum">' + esc(t.tom_tat) + "</span>" : "") + byline(t) + "</a>";
    },
    lead: function (t) {
      return '<a class="lead-story" href="' + href(t.link) + '"' + ext(t.link) + '><span class="ls-text">' + kicker(t) +
        '<span class="story-title">' + esc(t.tieu_de) + '</span><span class="story-sum">' + esc(t.tom_tat) + "</span>" + byline(t) + "</span>" + fig(t, true) + "</a>";
    },
    feature: function (t) {
      return '<a class="feature-card" href="' + href(t.link) + '"' + ext(t.link) + ">" + fig(t) + '<span class="fc-cap">' + kicker(t).replace("kicker ", "kicker k-dark ") +
        '<span class="story-title">' + esc(t.tieu_de) + '</span><span class="story-sum">' + esc(t.tom_tat) + "</span>" + byline(t) + "</span></a>";
    },
    paperItem: function (p) {
      var type = p.chu_de.indexOf("Guideline") >= 0 ? "Guideline" : "Nghiên cứu";
      return '<a class="list-item" href="' + root + "nghien-cuu/index.html#" + esc(p.id) + '">' +
        '<span class="kicker k-' + (type === "Guideline" ? "guideline" : "nghien-cuu") + '">' + esc(p.chu_de.join(" · ")) + "</span>" +
        '<span class="story-title">' + esc(p.ten) + "</span>" +
        '<span class="story-sum">' + esc(p.ket_qua.split(". ")[0].replace(/\.$/, "")) + ".</span>" +
        '<span class="byline"><strong>' + type + "</strong> | " + esc(p.nguon) + " | " +
        (p.viet_nam ? '<span class="badge-vn">Việt Nam</span>' : '<span class="badge-dich">Bản tóm tắt tiếng Việt</span>') + "</span></a>";
    },
    /* Đường sóng monitor dài 2400 đơn vị, lặp lại đều để chạy liên tục */
    wave: function (kind) {
      var g = function (p, c, s) { return Math.exp(-Math.pow((p - c) / s, 2)); };
      var fn = kind === "icp"
        ? function (p) { return g(p, 0.14, 0.05) + 0.9 * g(p, 0.32, 0.06) + 0.55 * g(p, 0.52, 0.07); }
        : function (p) { return p < 0.1 ? Math.sin(p / 0.1 * Math.PI / 2) : Math.exp(-(p - 0.1) * 3.4) * 0.95 + 0.14 * Math.exp(-Math.pow((p - 0.36) / 0.035, 2)); };
      var base = kind === "icp" ? 100 : 84, amp = kind === "icp" ? 80 : 72, d = "";
      for (var x = 0; x <= 2400; x += 3) {
        var p = (x % 150) / 150;
        d += (x ? "L" : "M") + x + " " + (base - amp * fn(p)).toFixed(1) + " ";
      }
      return d;
    },
    waveSvg: function (kind, color) {
      return '<div class="wave-clip"><svg class="wave-run" viewBox="0 0 2400 110" preserveAspectRatio="none" aria-hidden="true"><path d="' + UI.wave(kind) +
        '" fill="none" stroke="' + color + '" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></div>';
    }
  };
  window.CatrucUI = UI;
})();
(function () {
  Array.prototype.forEach.call(document.querySelectorAll("[data-hinh]"), function (el) {
    el.innerHTML = window.CatrucHinh.svg(el.getAttribute("data-hinh"), el.getAttribute("data-label"), el.hasAttribute("data-slice"));
  });
  Array.prototype.forEach.call(document.querySelectorAll("[data-wave]"), function (el) {
    el.innerHTML = window.CatrucUI.waveSvg(el.getAttribute("data-wave"), el.getAttribute("data-color") || "#6ee7a8");
  });
})();
