/* Bác sĩ Hồi sức — đọc/ghi Firestore cho trang công khai qua REST (nhẹ, không cần tải bộ Firebase).
   Quy tắc bảo mật cho phép: đọc tin có trang_thai "da_dang", đọc cai_dat, gửi form liên hệ. */
(function () {
  var cfg = window.BSHS_FIREBASE || {};
  var BASE = "https://firestore.googleapis.com/v1/projects/" + cfg.projectId + "/databases/(default)/documents";
  var KEY = "?key=" + encodeURIComponent(cfg.apiKey || "");

  function fromValue(v) {
    if (!v) return null;
    if ("stringValue" in v) return v.stringValue;
    if ("booleanValue" in v) return v.booleanValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return v.doubleValue;
    if ("timestampValue" in v) return v.timestampValue;
    if ("nullValue" in v) return null;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromValue);
    if ("mapValue" in v) return fromFields(v.mapValue.fields || {});
    return null;
  }
  function fromFields(f) { var o = {}; Object.keys(f || {}).forEach(function (k) { o[k] = fromValue(f[k]); }); return o; }
  function toValue(x) {
    if (x === null || x === undefined) return { nullValue: null };
    if (x instanceof Date) return { timestampValue: x.toISOString() };
    if (typeof x === "boolean") return { booleanValue: x };
    if (typeof x === "number") return Number.isInteger(x) ? { integerValue: String(x) } : { doubleValue: x };
    if (Array.isArray(x)) return { arrayValue: { values: x.map(toValue) } };
    if (typeof x === "object") { var f = {}; Object.keys(x).forEach(function (k) { f[k] = toValue(x[k]); }); return { mapValue: { fields: f } }; }
    return { stringValue: String(x) };
  }
  function docOf(d) { var o = fromFields(d.fields); o.id = d.name.split("/").pop(); return o; }
  function withTimeout(p, ms) { return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })]); }

  var FS = {
    /* Tin đã đăng, mới nhất trước */
    publishedNews: function () {
      var body = { structuredQuery: { from: [{ collectionId: "tin" }], where: { fieldFilter: { field: { fieldPath: "trang_thai" }, op: "EQUAL", value: { stringValue: "da_dang" } } }, limit: 200 } };
      return withTimeout(fetch(BASE + ":runQuery" + KEY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }), 6000)
        .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
        .then(function (rows) {
          return rows.filter(function (r) { return r.document; }).map(function (r) { return docOf(r.document); })
            .sort(function (a, b) { return String(b.dang_luc || b.tao_luc || "").localeCompare(String(a.dang_luc || a.tao_luc || "")) || (a.thu_tu || 0) - (b.thu_tu || 0); });
        });
    },
    getDoc: function (path) {
      return withTimeout(fetch(BASE + "/" + path + KEY), 6000).then(function (r) {
        if (r.status === 404 || r.status === 403) return null;
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json().then(docOf);
      });
    },
    /* Gửi form liên hệ vào collection yeu_cau */
    createContact: function (data) {
      var fields = {};
      Object.keys(data).forEach(function (k) { fields[k] = toValue(data[k]); });
      return fetch(BASE + "/yeu_cau" + KEY, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields: fields }) })
        .then(function (r) { if (!r.ok) return r.text().then(function (t) { throw new Error(t); }); return r.json(); });
    }
  };

  /* Tin cho trang công khai: lấy từ hệ thống quản trị; nếu chưa có hoặc lỗi mạng thì dùng tệp tin-tuc.js */
  FS.news = function () {
    var fallback = (window.CATRUC_TIN || []).slice();
    return FS.publishedNews().then(function (list) { return list.length ? list : fallback; }).catch(function () { return fallback; });
  };
  window.BSHS_FS = FS;
})();
