/* Bác sĩ Hồi sức — hiển thị thư viện nghiên cứu (dùng cho trang Nghiên cứu dịch và Guideline). Cần: nghien-cuu.js */
(function () {
  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d"); }
  function paper(p) {
    var el = document.createElement("article");
    el.className = "paper";
    el.id = p.id;
    el.innerHTML = '<div class="paper-meta"><span class="tags"></span></div><h3></h3><p class="byline src"></p><p class="finding"></p>' +
      '<p class="meaning"><strong>Ý nghĩa lâm sàng: </strong><span></span></p><div class="paper-foot"><a target="_blank" rel="noopener">Đọc bài gốc ↗</a><span class="draft-note"></span></div>';
    var tags = el.querySelector(".tags");
    (p.viet_nam ? ["Việt Nam"] : []).concat(p.chu_de).forEach(function (t) {
      var s = document.createElement("span"); s.className = "tag" + (t === "Việt Nam" ? " vn" : ""); s.textContent = t; tags.appendChild(s);
    });
    el.querySelector("h3").textContent = p.ten;
    el.querySelector(".src").textContent = p.tac_gia + " · " + p.nguon;
    el.querySelector(".finding").textContent = p.ket_qua;
    el.querySelector(".meaning span").textContent = p.y_nghia;
    el.querySelector("a").href = p.link;
    el.querySelector(".draft-note").textContent = p.nhap ? "Bản nháp, chờ bác sĩ duyệt" : "";
    return el;
  }

  window.CatrucThuVien = {
    mount: function (opts) {
      var data = (window.CATRUC_NGHIEN_CUU || []).filter(opts.filter || function () { return true; });
      var list = document.getElementById(opts.list), count = document.getElementById(opts.count);
      var chips = opts.chips && document.getElementById(opts.chips), input = opts.search && document.getElementById(opts.search);
      var params = new URLSearchParams(location.search);
      var active = params.get("chu-de") || "Tất cả", q = "";
      if (chips) {
        var topics = ["Tất cả", "Nghiên cứu Việt Nam"].concat((window.CATRUC_CHU_DE || []).filter(function (t) { return t !== "Guideline"; }));
        if (topics.indexOf(active) < 0) active = "Tất cả";
        topics.forEach(function (t) {
          var b = document.createElement("button");
          b.type = "button"; b.className = "chip"; b.textContent = t;
          b.setAttribute("aria-pressed", t === active ? "true" : "false");
          b.addEventListener("click", function () {
            active = t;
            Array.prototype.forEach.call(chips.children, function (c) { c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
            render();
          });
          chips.appendChild(b);
        });
      }
      if (input) {
        input.addEventListener("input", function () { q = norm(this.value); render(); });
        if (location.hash === "#tim") setTimeout(function () { input.focus(); }, 50);
      }
      function render() {
        list.innerHTML = "";
        var shown = data.filter(function (p) {
          if (active === "Nghiên cứu Việt Nam" && !p.viet_nam) return false;
          if (active !== "Tất cả" && active !== "Nghiên cứu Việt Nam" && p.chu_de.indexOf(active) < 0) return false;
          if (q && norm([p.ten, p.tac_gia, p.nguon, p.ket_qua, p.y_nghia, p.chu_de.join(" ")].join(" ")).indexOf(q) < 0) return false;
          return true;
        });
        if (count) count.textContent = shown.length + " bài";
        if (!shown.length) { list.innerHTML = '<p class="empty">Không có bài phù hợp. Thử từ khóa khác hoặc chọn “Tất cả”.</p>'; return; }
        shown.forEach(function (p) { list.appendChild(paper(p)); });
      }
      render();
      // Mở đúng bài khi đến từ link #mã-bài
      var id = location.hash.replace("#", "");
      if (id && id !== "tim") {
        var target = document.getElementById(id);
        if (target) { target.classList.add("hl"); setTimeout(function () { target.scrollIntoView({ block: "start" }); }, 60); }
      }
    }
  };
})();
