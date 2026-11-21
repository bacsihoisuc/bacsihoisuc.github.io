/* Bác sĩ Hồi sức — ứng dụng quản trị (Firebase Auth + Firestore).
   Quyền thật sự do quy tắc bảo mật Firestore quyết định; giao diện chỉ ẩn/hiện cho gọn. */
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, query, where, serverTimestamp, writeBatch, Timestamp
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const app = initializeApp(window.BSHS_FIREBASE);
const auth = getAuth(app);
const db = getFirestore(app);
const SITE = "https://bacsihoisuc.github.io/";
const root = document.getElementById("app");

const LOAI = window.CATRUC_LOAI_TIN || { "nghien-cuu": "Nghiên cứu", "san-pham": "Sản phẩm", "sang-tao": "Sáng tạo", "su-kien": "Sự kiện & đào tạo", "simulation": "Simulation" };
const LOAI_MAU = { "nghien-cuu": "#0a6f93", "san-pham": "#9a4f08", "sang-tao": "#0f7a4f", "su-kien": "#6b3fa0", "simulation": "#b42d3a" };
const KHUNG = { day_du: "Nghiên cứu · bản đầy đủ", abstract: "Nghiên cứu · từ abstract", kinh_dien: "Nghiên cứu · kinh điển", sang_tao: "Sáng tạo", san_pham: "Sản phẩm", su_kien: "Sự kiện", ngan: "Tin ngắn (có link)" };
const ST = { nhap: "Nháp", cho_duyet: "Chờ duyệt", da_dang: "Đã đăng", tra_ve: "Trả về Claude", tu_choi: "Từ chối", luu_tru: "Lưu trữ" };
const ST_LH = { moi: "Mới", da_lien_he: "Đã liên hệ", dang_xu_ly: "Đang xử lý", dong: "Đóng" };
const VAI = { quan_tri: "Quản trị", nhan_vien: "Nhân viên", claude_bot: "Claude Bot" };
const HINH = ["prx-cpp", "icp-brain", "ct-ich", "nirs", "pbto2", "alta", "neuro-screen", "sibicc", "pi-spinal", "hpi-wave"];
const CAM = /(báo giá|giá bán|\bgiá\b|vnđ|vnd|triệu đồng|gói thầu|hồ sơ thầu|\bthầu\b|tskt)/i;

let me = null, profile = null, cache = { tin: null, lh: null };

/* ---------- tiện ích ---------- */
const esc = (s) => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const toDate = (v) => (v && v.toDate ? v.toDate() : v ? new Date(v) : null);
function fmt(v) {
  const d = toDate(v); if (!d || isNaN(d)) return "—";
  const now = new Date(), same = d.toDateString() === now.toDateString();
  const hm = d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
  return same ? "Hôm nay " + hm : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }) + " " + hm;
}
function toast(t) { const el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2600); }
const isAdmin = () => profile && profile.vai_tro === "quan_tri";
const tacGia = (t) => (t.tac_gia && t.tac_gia.ten) || (t.tac_gia && t.tac_gia.vai_tro === "claude_bot" ? "Claude Bot" : "—");
const av = (t) => (t.tac_gia && t.tac_gia.vai_tro === "claude_bot") ? '<span class="pill-s" style="background:#6ee7a8;color:#05221a;font-family:var(--font-mono)">CB</span>' : "";
const pubLink = (t) => SITE + (t.link || "tin-tuc/bai.html?id=" + encodeURIComponent(t.id));
async function loadTin(force) { if (!cache.tin || force) { const s = await getDocs(collection(db, "tin")); cache.tin = s.docs.map((d) => ({ id: d.id, ...d.data() })); } return cache.tin; }
async function loadLH(force) { if (!cache.lh || force) { const s = await getDocs(collection(db, "yeu_cau")); cache.lh = s.docs.map((d) => ({ id: d.id, ...d.data() })); } return cache.lh; }
const byTime = (k) => (a, b) => (toDate(b[k]) || 0) - (toDate(a[k]) || 0);

/* ---------- khung trang ---------- */
const NAV = [
  ["tong-quan", "Tổng quan", "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10"],
  ["tin", "Tin đăng", "M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"],
  ["lien-he", "Liên hệ", "M4 6h16v12H4zM4 7l8 6 8-6"],
  ["cai-dat", "Cài đặt", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12h2M3 12h2M12 3v2M12 19v2"]
];
function shell(active, badges) {
  const icon = (d) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const items = NAV.filter((n) => n[0] !== "cai-dat" || isAdmin()).map((n) =>
    `<a href="#${n[0]}"${n[0] === active ? ' aria-current="page"' : ""}>${icon(n[2])}<span>${n[1]}</span>${badges[n[0]] ? `<span class="badge">${badges[n[0]]}</span>` : ""}</a>`).join("");
  const photo = me.photoURL ? `<img src="${esc(me.photoURL)}" alt="">` : `<span class="av">${esc((me.displayName || "?").slice(0, 1))}</span>`;
  root.innerHTML = `
  <div class="adm-mtop"><b>bác sĩ hồi sức</b><span>QUẢN TRỊ</span></div>
  <div class="adm">
    <aside class="adm-side">
      <div class="adm-brand"><b>bác sĩ hồi sức</b><span>QUẢN TRỊ</span></div>
      <nav class="adm-nav" aria-label="Điều hướng quản trị">${items}</nav>
      <div class="adm-note">Simulator không chỉnh ở đây. Muốn sửa kịch bản, nhắn Claude.</div>
      <div class="adm-user">
        <a class="link-btn" href="${SITE}" target="_blank" rel="noopener">Xem trang web ↗</a>
        <div class="adm-me">${photo}<div><b>${esc(me.displayName || me.email)}</b><span>${esc(VAI[profile.vai_tro] || "")}</span></div></div>
        <button class="link-btn" id="logout" type="button">Đăng xuất</button>
      </div>
    </aside>
    <main class="adm-main" id="view"><p class="empty-s">Đang tải…</p></main>
  </div>
  <nav class="adm-bottom" aria-label="Điều hướng">${items}</nav>`;
  root.querySelector("#logout").onclick = () => signOut(auth);
}

/* ---------- định tuyến ---------- */
async function route() {
  if (!me || !profile) return;
  const h = location.hash.replace(/^#/, "") || "tong-quan";
  const [name, arg] = h.split("/");
  const tin = await loadTin().catch(() => []);
  const lh = await loadLH().catch(() => []);
  const badges = { tin: tin.filter((t) => t.trang_thai === "cho_duyet").length || "", "lien-he": lh.filter((x) => x.trang_thai === "moi").length || "" };
  const active = name === "soan" ? "tin" : name;
  shell(active, badges);
  const v = document.getElementById("view");
  try {
    if (name === "tin") viewTin(v, tin);
    else if (name === "soan") await viewSoan(v, arg);
    else if (name === "lien-he") viewLienHe(v, lh, arg);
    else if (name === "cai-dat" && isAdmin()) await viewCaiDat(v);
    else viewTongQuan(v, tin, lh);
  } catch (e) { console.error(e); v.innerHTML = `<p class="empty-s">Có lỗi khi tải: ${esc(e.message)}</p>`; }
  window.scrollTo(0, 0);
}
window.addEventListener("hashchange", route);

/* ---------- Tổng quan ---------- */
function viewTongQuan(v, tin, lh) {
  const cho = tin.filter((t) => t.trang_thai === "cho_duyet").sort(byTime("cap_nhat_luc"));
  const week = Date.now() - 7 * 864e5;
  const dangTuan = tin.filter((t) => t.trang_thai === "da_dang" && (toDate(t.dang_luc) || 0) > week).length;
  const moi = lh.filter((x) => x.trang_thai === "moi").sort(byTime("tao_luc"));
  const today = new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  v.innerHTML = `
  <div class="adm-top"><div><div class="sub">${esc(today)}</div><h1>Chào ${esc((me.displayName || "").split(" ").pop() || "anh")}</h1></div>
    <div class="adm-actions"><a class="btn btn-primary" href="#soan/moi">+ Viết tin mới</a></div></div>
  <div class="kpis">
    <a class="kpi${cho.length ? " warn" : ""}" href="#tin/cho_duyet"><span class="l">Chờ duyệt</span><span class="v">${cho.length}</span><span class="s">${cho.filter((t) => t.tac_gia && t.tac_gia.vai_tro === "claude_bot").length} từ Claude Bot</span></a>
    <div class="kpi"><span class="l">Đã đăng 7 ngày qua</span><span class="v">${dangTuan}</span><span class="s">Mục tiêu 5–8 tin/tuần</span></div>
    <div class="kpi"><span class="l">Tổng tin đã đăng</span><span class="v">${tin.filter((t) => t.trang_thai === "da_dang").length}</span><span class="s">${tin.length} tin trong hệ thống</span></div>
    <a class="kpi${moi.length ? " warn" : ""}" href="#lien-he"><span class="l">Liên hệ mới</span><span class="v">${moi.length}</span><span class="s">Chưa liên hệ lại</span></a>
  </div>
  <div class="cols">
    <section class="panel c2"><div class="panel-h"><h2>Chờ anh duyệt</h2><a href="#tin/cho_duyet">Xem tất cả →</a></div>
      ${cho.length ? cho.slice(0, 6).map(rowTin).join("") : `<p class="empty-s">Không có tin nào chờ duyệt.${tin.length ? "" : " Hệ thống chưa có tin: vào Cài đặt để nhập 10 tin đang có trên web."}</p>`}</section>
    <div class="c1" style="display:grid;gap:18px">
      <section class="panel"><div class="panel-h"><h2>Liên hệ mới</h2><a href="#lien-he">Xem →</a></div>
        ${moi.length ? moi.slice(0, 4).map((x) => `<a class="row-item" href="#lien-he/${x.id}"><span class="t"><b style="font-family:var(--font-body);font-size:14px">${esc(x.ten)}${x.khoa ? " · " + esc(x.khoa) : ""}</b><span class="m">${esc(x.nhu_cau || "")} · ${esc(x.benh_vien || "")} · ${fmt(x.tao_luc)}</span></span></a>`).join("") : '<p class="empty-s">Chưa có liên hệ mới.</p>'}</section>
      <section class="panel dark"><div class="panel-b"><h2 style="font-family:var(--font-body);font-size:16px">Claude Bot</h2>
        <span>Lịch tự động chưa bật. Khi bật, Claude sẽ tạo bản nháp và đưa vào mục “Chờ duyệt”, không tự đăng.</span>
        ${isAdmin() ? '<a href="#cai-dat" style="color:#6ee7a8;font-weight:600;text-decoration:none">Cài đặt lịch và nguồn tin →</a>' : ""}</div></section>
    </div>
  </div>`;
}
function rowTin(t) {
  return `<a class="row-item" href="#soan/${t.id}"><span class="t"><span class="kk" style="color:${LOAI_MAU[t.loai] || "#5b6670"}">${esc(LOAI[t.loai] || t.loai)}${t.chu_de ? " · " + esc(t.chu_de) : ""}</span><b>${esc(t.tieu_de)}</b><span class="m">${esc(tacGia(t))} · ${fmt(t.cap_nhat_luc || t.tao_luc)}${t.nguon ? " · " + esc(t.nguon) : ""}</span></span>${av(t)}<span class="pill-s st-${t.trang_thai}">${ST[t.trang_thai] || t.trang_thai}</span></a>`;
}

/* ---------- Tin đăng ---------- */
function viewTin(v, tin) {
  let tab = location.hash.split("/")[1] || "tat-ca", loai = "", q = "";
  const counts = (k) => (k === "tat-ca" ? tin.filter((t) => t.trang_thai !== "luu_tru").length : tin.filter((t) => t.trang_thai === k).length);
  v.innerHTML = `
  <div class="adm-top"><div><div class="sub">Nội dung</div><h1>Tin đăng</h1></div><a class="btn btn-primary" href="#soan/moi">+ Viết tin mới</a></div>
  <div class="tabs" role="tablist" aria-label="Trạng thái">${["tat-ca", "cho_duyet", "nhap", "da_dang", "tra_ve", "tu_choi", "luu_tru"].map((k) =>
    `<button type="button" role="tab" data-k="${k}" aria-selected="${k === tab}">${k === "tat-ca" ? "Tất cả" : ST[k]} <span class="n">${counts(k)}</span></button>`).join("")}</div>
  <div class="filters"><label class="visually-hidden" for="q">Tìm tin</label><input type="search" id="q" placeholder="Tìm theo tiêu đề, nguồn, chủ đề">
    <label>Chuyên mục <select id="loai"><option value="">Tất cả</option>${Object.keys(LOAI).map((k) => `<option value="${k}">${esc(LOAI[k])}</option>`).join("")}</select></label></div>
  <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Tiêu đề</th><th>Người viết</th><th>Trạng thái</th><th>Cập nhật</th><th></th></tr></thead><tbody id="rows"></tbody></table></div>`;
  const draw = () => {
    const rows = tin.filter((t) => (tab === "tat-ca" ? t.trang_thai !== "luu_tru" : t.trang_thai === tab))
      .filter((t) => !loai || t.loai === loai)
      .filter((t) => !q || [t.tieu_de, t.nguon, t.chu_de, t.tom_tat].join(" ").toLowerCase().includes(q))
      .sort(byTime("cap_nhat_luc"));
    v.querySelector("#rows").innerHTML = rows.length ? rows.map((t) => `<tr>
      <td><a class="ttl" href="#soan/${t.id}"><span class="kk" style="color:${LOAI_MAU[t.loai] || "#5b6670"}">${esc(LOAI[t.loai] || t.loai)}${t.chu_de ? " · " + esc(t.chu_de) : ""}</span><b>${esc(t.tieu_de)}</b></a></td>
      <td style="white-space:nowrap">${esc(tacGia(t))}</td>
      <td><span class="pill-s st-${t.trang_thai}">${ST[t.trang_thai] || t.trang_thai}</span></td>
      <td style="white-space:nowrap;color:var(--muted)">${fmt(t.cap_nhat_luc || t.tao_luc)}</td>
      <td style="text-align:right;white-space:nowrap"><a href="#soan/${t.id}" style="font-weight:600;text-decoration:none">${t.trang_thai === "cho_duyet" ? "Duyệt" : "Mở"}</a>${t.trang_thai === "da_dang" ? ` · <a href="${esc(pubLink(t))}" target="_blank" rel="noopener" style="text-decoration:none">Xem ↗</a>` : ""}</td></tr>`).join("")
      : `<tr><td colspan="5" class="empty-s">Không có tin.</td></tr>`;
  };
  v.querySelectorAll(".tabs button").forEach((b) => b.onclick = () => { tab = b.dataset.k; v.querySelectorAll(".tabs button").forEach((x) => x.setAttribute("aria-selected", x === b)); history.replaceState(null, "", "#tin/" + tab); draw(); });
  v.querySelector("#q").oninput = (e) => { q = e.target.value.trim().toLowerCase(); draw(); };
  v.querySelector("#loai").onchange = (e) => { loai = e.target.value; draw(); };
  draw();
}

/* ---------- Soạn và duyệt ---------- */
function checks(t) {
  const out = [], research = t.loai === "nghien-cuu", needSrc = ["nghien-cuu", "sang-tao", "san-pham"].includes(t.loai) && t.khung !== "ngan";
  if (needSrc) out.push(t.link_goc ? ["ok", "Có link bài gốc"] : ["bad", "Chưa có link bài gốc"]);
  if (research && t.khung !== "abstract") out.push((t.han_che || "").trim() ? ["ok", "Có mục hạn chế"] : ["bad", "Chưa có mục hạn chế (bắt buộc với nghiên cứu)"]);
  if (research && t.khung === "abstract") out.push(["ok", "Gắn nhãn “Điểm tin, tóm tắt từ abstract”"]);
  const txt = [t.tieu_de, t.tom_tat, (t.tom_nhanh || []).join(" "), t.boi_canh, t.thiet_ke, t.ket_qua, t.y_nghia, t.han_che, t.noi_dung].join(" ");
  out.push(CAM.test(txt) ? ["bad", "Có từ liên quan giá hoặc thầu: kiểm tra lại"] : ["ok", "Không có giá, thông số thầu"]);
  if (t.loai === "san-pham") out.push(["no", "Tin sản phẩm: chỉ dùng thông tin chính thức của hãng"]);
  if (t.ai_ho_tro) out.push(t.nguoi_duyet_cm ? ["ok", "Đã có người duyệt chuyên môn: " + t.nguoi_duyet_cm] : ["no", "Sẽ hiện nhãn “Biên soạn với hỗ trợ của AI, chờ bác sĩ duyệt”"]);
  return out;
}
async function viewSoan(v, id) {
  let t = { loai: "nghien-cuu", khung: "day_du", trang_thai: "nhap", hinh: "icp-brain", tom_nhanh: [], ai_ho_tro: false };
  if (id && id !== "moi") {
    const s = await getDoc(doc(db, "tin", id));
    if (!s.exists()) { v.innerHTML = '<p class="empty-s">Không tìm thấy tin.</p>'; return; }
    t = { id: s.id, ...s.data() };
  }
  const isNew = !t.id;
  const L = (k, label, inner, hint) => `<label class="fld" for="f-${k}">${label}${hint ? ` <span class="hint">${hint}</span>` : ""}${inner}</label>`;
  const inp = (k, ph) => `<input id="f-${k}" name="${k}" value="${esc(t[k] || "")}" placeholder="${esc(ph || "")}">`;
  const ta = (k, rows, ph) => `<textarea id="f-${k}" name="${k}" rows="${rows}" placeholder="${esc(ph || "")}">${esc(t[k] || "")}</textarea>`;
  v.innerHTML = `
  <div class="adm-top"><div><div class="sub"><a href="#tin" style="text-decoration:none">Tin đăng</a> / ${isNew ? "Viết tin mới" : "Soạn và duyệt"}</div>
    <h1 style="display:flex;flex-wrap:wrap;gap:10px;align-items:center">${isNew ? "Viết tin mới" : "Duyệt tin"} ${isNew ? "" : `<span class="pill-s st-${t.trang_thai}">${ST[t.trang_thai] || ""}</span>`}</h1>
    ${isNew ? "" : `<div class="sub">${esc(tacGia(t))} · tạo ${fmt(t.tao_luc)}${t.ghi_chu_duyet ? " · Ghi chú duyệt: " + esc(t.ghi_chu_duyet) : ""}</div>`}</div>
    ${t.trang_thai === "da_dang" ? `<a class="btn btn-white" href="${esc(pubLink(t))}" target="_blank" rel="noopener">Xem trên web ↗</a>` : ""}</div>
  <form id="f" class="cols" novalidate>
    <section class="panel c2"><div class="panel-b">
      <div class="fgrid">
        ${L("loai", "Chuyên mục", `<select id="f-loai" name="loai">${Object.keys(LOAI).map((k) => `<option value="${k}"${t.loai === k ? " selected" : ""}>${esc(LOAI[k])}</option>`).join("")}</select>`)}
        ${L("chu_de", "Chủ đề", inp("chu_de", "Ví dụ: Áp lực nội sọ"))}
        ${L("khung", "Khung bài", `<select id="f-khung" name="khung">${Object.keys(KHUNG).map((k) => `<option value="${k}"${t.khung === k ? " selected" : ""}>${esc(KHUNG[k])}</option>`).join("")}</select>`)}
      </div>
      ${L("tieu_de", "Tiêu đề", `<input id="f-tieu_de" name="tieu_de" class="big" value="${esc(t.tieu_de || "")}" placeholder="Nói luôn kết luận">`, "nói luôn kết luận")}
      ${L("tom_tat", "Tóm tắt ngắn", ta("tom_tat", 2, "Hiện trên thẻ tin, 1–2 câu"), "hiện trên thẻ tin")}
      ${L("tom_nhanh", "Tóm nhanh", `<textarea id="f-tom_nhanh" name="tom_nhanh" rows="3" placeholder="Mỗi dòng một ý">${esc((t.tom_nhanh || []).join("\n"))}</textarea>`, "mỗi dòng một ý, tối đa 3")}
      <div data-g="nc">${L("boi_canh", "Bối cảnh", ta("boi_canh", 2))}${L("thiet_ke", "Thiết kế", ta("thiet_ke", 3, "Loại nghiên cứu, đối tượng, cỡ mẫu, can thiệp/so sánh, kết cục chính"))}
        ${L("ket_qua", "Kết quả chính", ta("ket_qua", 3, "Có số liệu: OR/RR, KTC 95%, p"))}${L("y_nghia", "Ý nghĩa lâm sàng", ta("y_nghia", 3))}
        <div data-g="hc">${L("han_che", "Hạn chế", ta("han_che", 2), "bắt buộc")}</div></div>
      <div data-g="nd">${L("noi_dung", "Nội dung", ta("noi_dung", 8, "Mỗi đoạn cách nhau một dòng"))}</div>
      <div class="fgrid">${L("nguon", "Nguồn", inp("nguon", "Tác giả · Tạp chí năm"))}${L("link_goc", "Link bài gốc", inp("link_goc", "https://doi.org/…"))}</div>
      <div class="fgrid">${L("link", "Link trong web (không bắt buộc)", inp("link", "Ví dụ: simulator/hemosphere/index.html"), "để trống: mở trang bài viết")}
        ${L("nguoi_duyet_cm", "Người duyệt chuyên môn", inp("nguoi_duyet_cm", "Ví dụ: BS. Nguyễn Văn A"))}</div>
    </div></section>
    <aside class="c1" style="display:grid;gap:16px">
      <section class="panel"><div class="panel-b"><h2 style="font-family:var(--font-body);font-size:15px">Kiểm tra trước khi đăng</h2><div class="checks" id="checks"></div></div></section>
      <section class="panel"><div class="panel-b"><h2 style="font-family:var(--font-body);font-size:15px">Hình minh họa</h2>
        <div class="figs" id="figs">${HINH.map((k) => `<button type="button" data-h="${k}" aria-pressed="${t.hinh === k}" aria-label="Hình ${k}">${window.CatrucHinh.svg(k)}</button>`).join("")}</div></div></section>
      <section class="panel"><div class="panel-b"><h2 style="font-family:var(--font-body);font-size:15px">Đăng</h2>
        <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" name="noi_bat"${t.noi_bat ? " checked" : ""}> Đưa lên vị trí tin chính trang chủ</label>
        <label style="display:flex;gap:8px;align-items:center;font-size:13px"><input type="checkbox" name="ai_ho_tro"${t.ai_ho_tro ? " checked" : ""}> Bài có AI hỗ trợ biên soạn</label>
        <button class="btn btn-primary" type="button" data-act="dang">${t.trang_thai === "da_dang" ? "Lưu và cập nhật trên web" : "Duyệt và đăng"}</button>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-white btn-sm" type="button" data-act="luu">Lưu nháp</button>
          ${t.trang_thai !== "da_dang" ? '<button class="btn btn-white btn-sm" type="button" data-act="tra_ve">Trả về Claude</button><button class="btn btn-danger btn-sm" type="button" data-act="tu_choi">Từ chối</button>' : '<button class="btn btn-white btn-sm" type="button" data-act="go">Gỡ khỏi web</button>'}
          ${!isNew && isAdmin() ? '<button class="btn btn-white btn-sm" type="button" data-act="luu_tru">Lưu trữ</button>' : ""}
        </div>
        <label class="fld" id="note-box" hidden>Ghi chú cho Claude<textarea name="ghi_chu_duyet" rows="3" placeholder="Ví dụ: viết ngắn hơn, thêm câu liên hệ simulator">${esc(t.ghi_chu_duyet || "")}</textarea>
          <button class="btn btn-green btn-sm" type="button" data-act="tra_ve_gui">Gửi Claude sửa lại</button></label>
      </div></section>
      <section class="panel"><div class="panel-b"><h2 style="font-family:var(--font-body);font-size:15px">Bài Zalo soạn sẵn</h2><div class="zalo" id="zalo"></div>
        <button class="btn btn-white btn-sm" type="button" id="copy" style="justify-self:start">Sao chép</button></div></section>
    </aside>
  </form>`;
  const f = v.querySelector("#f");
  let hinh = t.hinh || "icp-brain";
  const read = () => {
    const d = Object.fromEntries(new FormData(f).entries());
    return {
      loai: d.loai, chu_de: (d.chu_de || "").trim(), khung: d.khung, tieu_de: (d.tieu_de || "").trim(), tom_tat: (d.tom_tat || "").trim(),
      tom_nhanh: (d.tom_nhanh || "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 3),
      boi_canh: d.boi_canh || "", thiet_ke: d.thiet_ke || "", ket_qua: d.ket_qua || "", y_nghia: d.y_nghia || "", han_che: d.han_che || "", noi_dung: d.noi_dung || "",
      nguon: (d.nguon || "").trim(), link_goc: (d.link_goc || "").trim(), link: (d.link || "").trim(), nguoi_duyet_cm: (d.nguoi_duyet_cm || "").trim(),
      noi_bat: !!d.noi_bat, ai_ho_tro: !!d.ai_ho_tro, ghi_chu_duyet: d.ghi_chu_duyet || "", hinh
    };
  };
  const refresh = () => {
    const d = read(), research = d.loai === "nghien-cuu";
    f.querySelector('[data-g="nc"]').hidden = !research;
    f.querySelector('[data-g="hc"]').hidden = d.khung === "abstract";
    f.querySelector('[data-g="nd"]').hidden = research && d.khung !== "ngan";
    v.querySelector("#checks").innerHTML = checks(d).map((c) => `<span class="${c[0]}">${esc(c[1])}</span>`).join("");
    v.querySelector("#zalo").textContent = (d.tieu_de || "[Tiêu đề]") + (d.tom_nhanh[0] ? "\n" + d.tom_nhanh[0] : d.tom_tat ? "\n" + d.tom_tat : "") +
      (d.nguon ? "\nNguồn: " + d.nguon : "") + "\nĐọc tóm tắt tiếng Việt: " + (t.id ? pubLink({ ...t, link: d.link }) : "[link sau khi đăng]");
  };
  f.addEventListener("input", refresh); f.addEventListener("change", refresh);
  v.querySelectorAll("#figs button").forEach((b) => b.onclick = () => { hinh = b.dataset.h; v.querySelectorAll("#figs button").forEach((x) => x.setAttribute("aria-pressed", x === b)); });
  v.querySelector("#copy").onclick = () => navigator.clipboard.writeText(v.querySelector("#zalo").textContent).then(() => toast("Đã sao chép"), () => toast("Không sao chép được, hãy chọn và sao chép tay"));
  refresh();

  async function save(status, extra) {
    const d = read();
    if (!d.tieu_de) { toast("Cần có tiêu đề"); f.tieu_de.focus(); return; }
    const data = { ...d, ...(extra || {}), trang_thai: status, cap_nhat_luc: serverTimestamp() };
    if (status === "da_dang" && t.trang_thai !== "da_dang") { data.dang_luc = serverTimestamp(); data.nguoi_dang = { uid: me.uid, ten: me.displayName || me.email }; }
    v.querySelectorAll("button").forEach((b) => (b.disabled = true));
    try {
      if (data.noi_bat && status === "da_dang") {
        const others = await getDocs(query(collection(db, "tin"), where("noi_bat", "==", true)));
        const batch = writeBatch(db);
        others.docs.filter((x) => x.id !== t.id).forEach((x) => batch.update(x.ref, { noi_bat: false }));
        await batch.commit();
      }
      if (t.id) await updateDoc(doc(db, "tin", t.id), data);
      else {
        data.tao_luc = serverTimestamp(); data.tac_gia = { uid: me.uid, ten: me.displayName || me.email, vai_tro: profile.vai_tro };
        const r = await addDoc(collection(db, "tin"), data); t.id = r.id;
      }
      cache.tin = null;
      toast(status === "da_dang" ? "Đã đăng lên web" : "Đã lưu: " + ST[status]);
      const target = "#soan/" + t.id; if (location.hash === target) route(); else location.hash = target;
    } catch (e) { console.error(e); toast("Không lưu được: " + e.message); v.querySelectorAll("button").forEach((b) => (b.disabled = false)); }
  }
  v.querySelectorAll("[data-act]").forEach((b) => b.onclick = () => {
    const a = b.dataset.act;
    if (a === "dang") {
      const bad = checks(read()).filter((c) => c[0] === "bad");
      if (bad.length && !b.dataset.confirm) { b.dataset.confirm = "1"; b.textContent = "Vẫn đăng (còn " + bad.length + " mục cần xem)"; toast("Còn mục cần kiểm tra. Bấm lần nữa nếu vẫn muốn đăng."); return; }
      save("da_dang");
    } else if (a === "luu") save(t.trang_thai === "da_dang" ? "da_dang" : "nhap");
    else if (a === "tra_ve") { v.querySelector("#note-box").hidden = false; v.querySelector("#note-box textarea").focus(); }
    else if (a === "tra_ve_gui") save("tra_ve");
    else if (a === "tu_choi") save("tu_choi");
    else if (a === "go") save("nhap");
    else if (a === "luu_tru") save("luu_tru");
  });
}

/* ---------- Liên hệ ---------- */
function viewLienHe(v, lh, selId) {
  const list = lh.slice().sort(byTime("tao_luc"));
  let tab = "mo", sel = selId || (list[0] && list[0].id);
  v.innerHTML = `
  <div class="adm-top"><div><div class="sub">Form trên trang Liên hệ gửi thẳng vào đây</div><h1>Liên hệ</h1></div></div>
  <div class="tabs" role="tablist">${[["mo", "Đang mở"], ["tat-ca", "Tất cả"], ["dong", "Đã đóng"]].map((x) => `<button type="button" role="tab" data-k="${x[0]}" aria-selected="${x[0] === tab}">${x[1]}</button>`).join("")}</div>
  <div class="cols"><div class="c2 tbl-wrap"><table class="tbl" style="min-width:640px"><thead><tr><th>Người gửi</th><th>Nội dung</th><th>Thiết bị</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody id="rows"></tbody></table></div>
    <aside class="c1 panel"><div class="panel-b" id="detail"></div></aside></div>`;
  const draw = () => {
    const rows = list.filter((x) => tab === "tat-ca" || (tab === "dong" ? x.trang_thai === "dong" : x.trang_thai !== "dong"));
    v.querySelector("#rows").innerHTML = rows.length ? rows.map((x) => `<tr${x.id === sel ? ' style="background:#eef6fa"' : ""}>
      <td><button type="button" data-id="${x.id}" style="all:unset;cursor:pointer;display:grid"><b>${esc(x.ten)}</b><span style="font-size:12px;color:var(--muted)">${esc([x.khoa, x.benh_vien].filter(Boolean).join(" · "))}</span></button></td>
      <td>${esc(x.nhu_cau || "")}</td><td style="white-space:nowrap">${esc(x.thiet_bi || "")}</td>
      <td><span class="pill-s st-${x.trang_thai}">${ST_LH[x.trang_thai] || x.trang_thai}</span></td><td style="white-space:nowrap;color:var(--muted)">${fmt(x.tao_luc)}</td></tr>`).join("")
      : '<tr><td colspan="5" class="empty-s">Chưa có liên hệ nào. Khi khách gửi form ở trang Liên hệ, thư sẽ hiện ở đây.</td></tr>';
    v.querySelectorAll("#rows [data-id]").forEach((b) => b.onclick = () => { sel = b.dataset.id; history.replaceState(null, "", "#lien-he/" + sel); draw(); });
    const x = list.find((y) => y.id === sel);
    const det = v.querySelector("#detail");
    if (!x) { det.innerHTML = '<p class="empty-s" style="padding:0">Chọn một liên hệ để xem.</p>'; return; }
    det.innerHTML = `<span class="kk" style="color:#9a4f08">${esc(x.nhu_cau || "Liên hệ")}</span>
      <h2 style="font-size:20px">${esc(x.ten)}</h2>
      <div class="dl"><span>Khoa</span><span>${esc(x.khoa || "—")}</span><span>Bệnh viện</span><span>${esc(x.benh_vien || "—")}</span>
        <span>Điện thoại</span><span>${x.dien_thoai ? `<a href="tel:${esc(x.dien_thoai)}">${esc(x.dien_thoai)}</a>` : "—"}</span>
        <span>Email</span><span>${x.email ? esc(x.email) : "—"}</span><span>Thiết bị</span><span>${esc(x.thiet_bi || "—")}</span><span>Gửi lúc</span><span>${fmt(x.tao_luc)}</span></div>
      ${x.noi_dung ? `<div class="msg-box">${esc(x.noi_dung)}</div>` : ""}
      <label class="fld">Ghi chú nội bộ<textarea id="gc" rows="3" placeholder="Ví dụ: đã gọi, hẹn gặp trưởng khoa thứ Ba">${esc(x.ghi_chu_noi_bo || "")}</textarea></label>
      <label class="fld">Trạng thái<select id="st">${Object.keys(ST_LH).map((k) => `<option value="${k}"${x.trang_thai === k ? " selected" : ""}>${ST_LH[k]}</option>`).join("")}</select></label>
      <button class="btn btn-primary" type="button" id="save-lh">Lưu</button>`;
    det.querySelector("#save-lh").onclick = async (e) => {
      e.target.disabled = true;
      try {
        const upd = { trang_thai: det.querySelector("#st").value, ghi_chu_noi_bo: det.querySelector("#gc").value, cap_nhat_luc: serverTimestamp(), xu_ly_boi: me.displayName || me.email };
        await updateDoc(doc(db, "yeu_cau", x.id), upd); Object.assign(x, upd, { cap_nhat_luc: new Date() }); cache.lh = null; toast("Đã lưu"); draw();
      } catch (er) { toast("Không lưu được: " + er.message); e.target.disabled = false; }
    };
  };
  v.querySelectorAll(".tabs button").forEach((b) => b.onclick = () => { tab = b.dataset.k; v.querySelectorAll(".tabs button").forEach((y) => y.setAttribute("aria-selected", y === b)); draw(); });
  draw();
}

/* ---------- Cài đặt ---------- */
async function viewCaiDat(v) {
  const chung = (await getDoc(doc(db, "cai_dat", "chung")).catch(() => null))?.data() || {};
  const bot = (await getDoc(doc(db, "noi_bo", "claude_bot")).catch(() => null))?.data() || {};
  const users = (await getDocs(collection(db, "nguoi_dung")).catch(() => ({ docs: [] }))).docs.map((d) => ({ id: d.id, ...d.data() }));
  const tin = await loadTin();
  const val = (o, k, d) => esc(o[k] != null ? o[k] : d || "");
  v.innerHTML = `
  <div class="adm-top"><div><div class="sub">Chỉ Quản trị thấy mục này</div><h1>Cài đặt</h1></div></div>
  <div class="cols">
    <div class="c2" style="display:grid;gap:18px">
      <section class="panel"><div class="panel-h"><h2>Người dùng</h2></div>
        ${users.map((u) => `<div class="row-item"><span class="t"><b style="font-family:var(--font-body);font-size:14px">${esc(u.ten || u.email || u.id)}</b><span class="m">${esc(u.email || "")}</span></span><span class="pill-s st-da_dang">${esc(VAI[u.vai_tro] || u.vai_tro)}</span></div>`).join("")}
        <p class="empty-s" style="padding-top:8px">Vai trò: Quản trị, Nhân viên, Claude Bot. Quyền chi tiết và cách thêm Nhân viên sẽ làm khi cần.</p></section>
      <section class="panel"><div class="panel-h"><h2>Thông tin liên hệ trên web</h2></div><form class="panel-b" id="f-chung">
        <div class="fgrid"><label class="fld">Người phụ trách<input name="ten" value="${val(chung, "ten", "Sơn Bùi")}"></label>
          <label class="fld">Điện thoại<input name="dien_thoai" value="${val(chung, "dien_thoai")}"></label></div>
        <div class="fgrid"><label class="fld">Zalo<input name="zalo" value="${val(chung, "zalo")}"></label>
          <label class="fld">Email<input name="email" value="${val(chung, "email")}"></label></div>
        <label class="fld">Dòng minh bạch ở trang Liên hệ<textarea name="minh_bach" rows="2" placeholder="Ví dụ: Bác sĩ Hồi sức do Sơn Bùi sáng lập…">${val(chung, "minh_bach")}</textarea></label>
        <button class="btn btn-primary" type="submit" style="justify-self:start">Lưu thông tin liên hệ</button></form></section>
      <section class="panel"><div class="panel-h"><h2>Dữ liệu</h2></div><div class="panel-b">
        <span>Hệ thống đang có <b>${tin.length}</b> tin. Trang web đang hiển thị ${tin.some((t) => t.trang_thai === "da_dang") ? "tin từ hệ thống quản trị" : "10 tin có sẵn trong mã nguồn"}.</span>
        <button class="btn btn-white" type="button" id="import" style="justify-self:start">Nhập ${(window.CATRUC_TIN || []).length} tin có sẵn vào hệ thống</button>
        <span class="hint" style="font-size:12px;color:var(--muted)">Tin đã có cùng mã sẽ được giữ nguyên, không ghi đè.</span></div></section>
    </div>
    <section class="c1 panel dark"><form class="panel-b" id="f-bot">
      <h2 style="font-family:var(--font-body);font-size:16px">Claude Bot · lịch và nguồn tin</h2>
      <span style="font-size:13px">Lưu ở đây để Claude đọc khi chạy. Bật lịch tự động thì nhắn Claude.</span>
      <div class="fgrid"><label class="fld" style="color:#c3d1dc">Chạy<select name="tan_suat"><option value="tuan"${bot.tan_suat !== "ngay" ? " selected" : ""}>Hằng tuần</option><option value="ngay"${bot.tan_suat === "ngay" ? " selected" : ""}>Hằng ngày</option></select></label>
        <label class="fld" style="color:#c3d1dc">Thứ / giờ<input name="gio" value="${val(bot, "gio", "Thứ Hai 07:40")}"></label>
        <label class="fld" style="color:#c3d1dc">Số tin<input name="so_tin" value="${val(bot, "so_tin", "5–8")}"></label></div>
      <label class="fld" style="color:#c3d1dc">Tỷ lệ nghiên cứu (sản phẩm / xu hướng / kinh điển)<input name="ty_le" value="${val(bot, "ty_le", "50 / 30 / 20")}"></label>
      <label class="fld" style="color:#c3d1dc">Nguồn tin<textarea name="nguon" rows="4">${val(bot, "nguon", "PubMed\nCritical Care\nIntensive Care Medicine\nNeurocritical Care\nAnesthesiology\nBJA\nFDA · CE\nMedTech Dive\nRAUMEDIC · BD")}</textarea></label>
      <label class="fld" style="color:#c3d1dc">Thương hiệu cần tránh<textarea name="tranh" rows="3" placeholder="Mỗi dòng một tên">${val(bot, "tranh")}</textarea></label>
      <button class="btn btn-green" type="submit" style="justify-self:start">Lưu cài đặt Claude Bot</button></form></section>
  </div>`;
  v.querySelector("#f-chung").onsubmit = async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target).entries());
    try { await setDoc(doc(db, "cai_dat", "chung"), { ...d, cap_nhat_luc: serverTimestamp() }, { merge: true }); toast("Đã lưu, trang Liên hệ sẽ hiện thông tin mới"); } catch (er) { toast("Không lưu được: " + er.message); }
  };
  v.querySelector("#f-bot").onsubmit = async (e) => {
    e.preventDefault(); const d = Object.fromEntries(new FormData(e.target).entries());
    try { await setDoc(doc(db, "noi_bo", "claude_bot"), { ...d, cap_nhat_luc: serverTimestamp() }, { merge: true }); toast("Đã lưu cài đặt Claude Bot"); } catch (er) { toast("Không lưu được: " + er.message); }
  };
  v.querySelector("#import").onclick = async (e) => {
    const btn = e.target; btn.disabled = true; btn.textContent = "Đang nhập…";
    try {
      const have = new Set(tin.map((t) => t.id)), src = window.CATRUC_TIN || [], batch = writeBatch(db);
      let n = 0, base = Date.now();
      src.forEach((x, i) => {
        if (have.has(x.id)) return; n++;
        const when = Timestamp.fromMillis(base - i * 60000);
        batch.set(doc(db, "tin", x.id), {
          loai: x.loai, chu_de: x.chu_de || "", khung: x.link ? "ngan" : "day_du", tieu_de: x.tieu_de, tom_tat: x.tom_tat || "", tom_nhanh: [],
          nguon: x.nguon || "", link: x.link || "", link_goc: "", hinh: x.hinh || "icp-brain", noi_bat: !!x.noi_bat, ai_ho_tro: false,
          trang_thai: "da_dang", tao_luc: when, cap_nhat_luc: when, dang_luc: when, thu_tu: i,
          tac_gia: { uid: me.uid, ten: me.displayName || me.email, vai_tro: profile.vai_tro }, nguon_nhap: "tin-tuc.js"
        });
      });
      if (n) await batch.commit();
      cache.tin = null; toast(n ? "Đã nhập " + n + " tin" : "Không có tin mới để nhập"); route();
    } catch (er) { toast("Không nhập được: " + er.message); btn.disabled = false; }
  };
}

/* ---------- đăng nhập ---------- */
function viewLogin(msg) {
  root.innerHTML = `<div class="login"><div class="login-card">
    <b class="brand-l">bác sĩ hồi sức</b><span style="font-family:var(--font-mono);font-size:12px;letter-spacing:.08em;color:#0f7a4f">QUẢN TRỊ</span>
    <p style="color:var(--muted)">Đăng nhập bằng tài khoản Google đã được cấp quyền.</p>
    <button class="btn btn-primary g" type="button" id="login"><svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>Đăng nhập bằng Google</button>
    <p class="form-msg" style="color:var(--red)">${esc(msg || "")}</p>
    <a href="${SITE}" style="font-size:13px">← Về trang web</a></div></div>`;
  root.querySelector("#login").onclick = () => signInWithPopup(auth, new GoogleAuthProvider()).catch((e) => viewLogin("Không đăng nhập được: " + (e.code || e.message)));
}

onAuthStateChanged(auth, async (u) => {
  me = u; profile = null; cache = { tin: null, lh: null };
  if (!u) return viewLogin();
  root.innerHTML = '<div class="login"><div class="login-card"><p>Đang kiểm tra quyền…</p></div></div>';
  try {
    const ref = doc(db, "nguoi_dung", u.uid);
    let s = await getDoc(ref);
    if (!s.exists()) {
      // Lần đầu: chỉ tài khoản chủ web được tự tạo hồ sơ Quản trị (quy tắc bảo mật kiểm tra)
      try { await setDoc(ref, { vai_tro: "quan_tri", ten: u.displayName || "", email: u.email || "", tao_luc: serverTimestamp() }); s = await getDoc(ref); } catch (e) { /* không có quyền */ }
    }
    if (!s.exists()) { await signOut(auth); return viewLogin("Tài khoản " + (u.email || "") + " chưa được cấp quyền quản trị."); }
    profile = s.data();
    if (!["quan_tri", "nhan_vien"].includes(profile.vai_tro)) { await signOut(auth); return viewLogin("Tài khoản này không dùng được trang quản trị."); }
    route();
  } catch (e) { console.error(e); viewLogin("Lỗi kết nối: " + e.message); }
});
