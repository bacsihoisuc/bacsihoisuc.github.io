/* Bác sĩ Hồi sức — dải bản tin, thanh menu, chân trang dùng chung cho mọi trang.
   Sửa menu: danh sách NAV. Sửa thông tin liên hệ: LIEN_HE (để trống thì không hiện). */
(function () {
  var root = document.documentElement.getAttribute("data-root") || "./";
  var current = document.documentElement.getAttribute("data-page") || "";

  var LIEN_HE = {
    ten: "Sơn Bùi",
    vai_tro: "Người sáng lập",
    email: "",
    dien_thoai: "",
    zalo: ""
  };
  window.CATRUC_LIEN_HE = LIEN_HE;

  var NAV = [
    { id: "home", href: "index.html", label: "Trang chủ" },
    { id: "tin-tuc", label: "Tin tức", children: [
      { href: "tin-tuc/index.html", label: "Tất cả tin" },
      { sep: true },
      { href: "tin-tuc/index.html?loai=nghien-cuu", label: "Nghiên cứu" },
      { href: "tin-tuc/index.html?loai=san-pham", label: "Sản phẩm" },
      { href: "tin-tuc/index.html?loai=sang-tao", label: "Sáng tạo HSCC – GMHS" },
      { href: "tin-tuc/index.html?loai=su-kien", label: "Sự kiện & đào tạo" }
    ] },
    { id: "san-pham", label: "Sản phẩm", children: [
      { href: "san-pham/index.html", label: "Tổng quan danh mục" },
      { group: "Theo dõi thần kinh" },
      { href: "san-pham/neurosmart-logo/index.html", label: "NeuroSmart logO" },
      { href: "san-pham/mpr2-logo/index.html", label: "MPR2 logO" },
      { group: "Theo dõi huyết động" },
      { href: "san-pham/hemosphere-alta/index.html", label: "HemoSphere Alta" }
    ] },
    { id: "thu-vien", label: "Thư viện nghiên cứu", children: [
      { href: "guideline/index.html", label: "Guideline" },
      { href: "nghien-cuu/index.html", label: "Nghiên cứu dịch" },
      { href: "quy-trinh/index.html", label: "Quy trình – phác đồ" }
    ] },
    { id: "simulator", label: "Simulation", children: [
      { href: "simulator/neurosmart/index.html", label: "NeuroSmart logO" },
      { href: "simulator/hemosphere/index.html", label: "HemoSphere Alta" },
      { sep: true },
      { href: "simulator/index.html", label: "Tất cả simulator" }
    ] }
  ];

  var CHEV = '<svg class="chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var ICON_SEARCH = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>';
  var ICON_MENU = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  var ICON_CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>';

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function isHere(href) {
    var a = document.createElement("a");
    a.href = root + href;
    var p1 = a.pathname.replace(/index\.html$/, ""), p2 = location.pathname.replace(/index\.html$/, "");
    if (p1 !== p2) return false;
    return (a.search || "") === (location.search || "");
  }

  /* Tuần và ngày theo tiếng Việt */
  var THU = ["Chủ nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
  function isoWeek(d) {
    var t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    var day = t.getUTCDay() || 7;
    t.setUTCDate(t.getUTCDate() + 4 - day);
    var y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
    return Math.ceil(((t - y0) / 86400000 + 1) / 7);
  }

  var header = document.getElementById("site-header");
  if (header) {
    var now = new Date();
    var latest = (window.CATRUC_TIN && window.CATRUC_TIN[0]) || { tieu_de: "Simulator HemoSphere Alta đã mở", link: "simulator/hemosphere/index.html" };
    var topbar = document.createElement("div");
    topbar.className = "topbar";
    topbar.innerHTML = '<div class="wrap"><span><span class="live-dot" aria-hidden="true"></span><strong>Bản tin tuần ' + isoWeek(now) + "</strong> · " +
      THU[now.getDay()] + ", " + now.getDate() + " tháng " + (now.getMonth() + 1) + ", " + now.getFullYear() + "</span>" +
      '<a class="tb-right" href="' + root + esc(latest.link) + '">Mới: ' + esc(latest.tieu_de) + " →</a></div>";
    header.parentNode.insertBefore(topbar, header);

    var items = NAV.map(function (n, i) {
      var cur = n.id === current ? ' aria-current="page"' : "";
      if (!n.children) return '<li class="nav-item"><a class="nav-link" href="' + root + n.href + '"' + cur + ">" + n.label + "</a></li>";
      var subs = n.children.map(function (c) {
        if (c.sep) return '<li class="dd-sep" role="separator"></li>';
        if (c.group) return '<li class="dd-label">' + esc(c.group) + "</li>";
        return '<li><a href="' + root + c.href + '"' + (isHere(c.href) ? ' aria-current="page"' : "") + ">" + esc(c.label) + "</a></li>";
      }).join("");
      return '<li class="nav-item has-sub"><button type="button" class="nav-link" aria-expanded="false" aria-controls="dd-' + i + '"' + cur + ">" + n.label + CHEV + "</button>" +
        '<div class="dropdown" id="dd-' + i + '"><ul>' + subs + "</ul></div></li>";
    }).join("");
    var contactCur = current === "lien-he" ? ' aria-current="page"' : "";

    header.className = "site-header";
    header.innerHTML =
      '<div class="wrap bar">' +
      '<a class="brand" href="' + root + 'index.html" aria-label="Bác sĩ Hồi sức, trang chủ">bác sĩ hồi sức</a>' +
      '<nav class="nav" id="site-nav" aria-label="Điều hướng chính"><ul class="nav-list">' + items +
      '<li class="nav-item nav-cta"><a class="pill" href="' + root + 'lien-he/index.html"' + contactCur + ">Liên hệ</a></li>" +
      "</ul></nav>" +
      '<div class="bar-actions">' +
      '<a class="icon-btn" href="' + root + 'nghien-cuu/index.html#tim" aria-label="Tìm trong thư viện nghiên cứu">' + ICON_SEARCH + "</a>" +
      '<a class="pill" href="' + root + 'lien-he/index.html"' + contactCur + ">Liên hệ</a>" +
      '<button type="button" class="icon-btn menu-btn" aria-expanded="false" aria-controls="site-nav" aria-label="Mở menu">' + ICON_MENU + "</button>" +
      "</div></div>";

    var nav = header.querySelector(".nav");
    var menuBtn = header.querySelector(".menu-btn");
    var subs = Array.prototype.slice.call(header.querySelectorAll(".has-sub"));
    var desktop = window.matchMedia("(hover: hover) and (min-width: 1081px)");
    var closeTimer = null;

    function setOpen(li, open) {
      li.classList.toggle("open", open);
      li.querySelector(".nav-link").setAttribute("aria-expanded", open ? "true" : "false");
    }
    function closeAll(except) { subs.forEach(function (li) { if (li !== except) setOpen(li, false); }); }

    subs.forEach(function (li) {
      var btn = li.querySelector(".nav-link");
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var open = !li.classList.contains("open");
        if (desktop.matches) closeAll(li);
        setOpen(li, open);
      });
      li.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse" || !desktop.matches) return;
        clearTimeout(closeTimer); closeAll(li); setOpen(li, true);
      });
      li.addEventListener("pointerleave", function (e) {
        if (e.pointerType !== "mouse" || !desktop.matches) return;
        closeTimer = setTimeout(function () { setOpen(li, false); }, 180);
      });
    });
    document.addEventListener("click", function (e) {
      if (desktop.matches && !header.contains(e.target)) closeAll();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Escape") return;
      var open = header.querySelector(".has-sub.open");
      if (open) { setOpen(open, false); open.querySelector(".nav-link").focus(); }
      else if (nav.classList.contains("open")) { toggleNav(false); menuBtn.focus(); }
    });
    function toggleNav(open) {
      nav.classList.toggle("open", open);
      document.body.classList.toggle("nav-open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
      menuBtn.innerHTML = open ? ICON_CLOSE : ICON_MENU;
      if (open) {
        document.documentElement.style.setProperty("--nav-top", Math.round(header.getBoundingClientRect().bottom) + "px");
        // Mở sẵn nhóm chứa trang hiện tại
        subs.forEach(function (li) { setOpen(li, !!li.querySelector('[aria-current="page"]')); });
      }
    }
    menuBtn.addEventListener("click", function () { toggleNav(!nav.classList.contains("open")); });
    desktop.addEventListener && desktop.addEventListener("change", function () { toggleNav(false); closeAll(); });
  }

  var footer = document.getElementById("site-footer");
  if (footer) {
    var c = LIEN_HE;
    var contactLines = [c.ten ? "<span>" + esc(c.ten) + "</span>" : "",
      c.email ? '<a href="mailto:' + esc(c.email) + '">' + esc(c.email) + "</a>" : "",
      c.dien_thoai ? "<span>" + esc(c.dien_thoai) + "</span>" : "",
      '<a href="' + root + 'lien-he/index.html">Trang liên hệ →</a>'].join("");
    footer.className = "site-footer";
    footer.innerHTML =
      '<div class="wrap">' +
      '<div class="f-col f-about"><span class="f-brand">bác sĩ hồi sức</span>' +
      '<p class="disclaimer">Nội dung trên Bác sĩ Hồi sức chỉ dùng để tham khảo và đào tạo, không thay thế quyết định lâm sàng của bác sĩ. Simulator là mô phỏng, không dùng cho bệnh nhân.</p></div>' +
      '<div class="f-col"><strong>Nội dung</strong>' +
      '<a href="' + root + 'tin-tuc/index.html">Tin tức</a>' +
      '<a href="' + root + 'guideline/index.html">Guideline</a>' +
      '<a href="' + root + 'nghien-cuu/index.html">Nghiên cứu dịch</a>' +
      '<a href="' + root + 'simulator/index.html">Simulation</a></div>' +
      '<div class="f-col"><strong>Sản phẩm</strong>' +
      '<a href="' + root + 'san-pham/neurosmart-logo/index.html">NeuroSmart logO</a>' +
      '<a href="' + root + 'san-pham/mpr2-logo/index.html">MPR2 logO</a>' +
      '<a href="' + root + 'san-pham/hemosphere-alta/index.html">HemoSphere Alta</a></div>' +
      '<div class="f-col"><strong>Liên hệ</strong>' + contactLines + "</div>" +
      "</div>";
  }
})();
