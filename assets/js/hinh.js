/* Bác sĩ Hồi sức — hình minh họa (SVG tự vẽ, tông monitor tối). Dùng: CatrucHinh.svg("prx-cpp", "mô tả") */
(function () {
  var G = "#6ee7a8", B = "#7cc7ff", R = "#ff8a8a", A = "#f5b342", T = "#aebfcc", M = "#8fa3b3";
  var F = 'font-family="JetBrains Mono, monospace"';
  var grid = '<g stroke="rgba(124,199,255,0.07)" stroke-width="1"><path d="M0 60H640M0 120H640M0 180H640M0 240H640M0 300H640M80 0V360M160 0V360M240 0V360M320 0V360M400 0V360M480 0V360M560 0V360"/></g>';
  var brain = function (sx, sy, k, fill) {
    return '<g transform="translate(' + sx + " " + sy + ") scale(" + k + ')"><path d="M110 150 C 92 92, 160 52, 220 70 C 262 42, 336 62, 334 112 C 372 132, 360 188, 312 190 L 132 190 C 104 186, 98 168, 110 150 Z" fill="' + (fill || "rgba(110,231,168,0.08)") + '" stroke="' + G + '" stroke-width="4"/><path d="M170 90 C 190 110, 180 130, 200 150 M250 80 C 240 110, 270 130, 260 160" stroke="' + G + '" stroke-width="3" fill="none" opacity="0.55"/></g>';
  };
  var H = {
    "prx-cpp": grid +
      '<rect x="70" y="40" width="270" height="250" fill="rgba(255,138,138,0.09)"/>' +
      '<path d="M70 290H610M70 290V40" stroke="#4a6070" stroke-width="1.5" fill="none"/>' +
      '<path d="M82 62 C 160 140, 235 266, 340 272 S 530 238, 606 205" stroke="rgba(124,199,255,0.25)" stroke-width="12" fill="none" stroke-linecap="round"/>' +
      '<path d="M82 62 C 160 140, 235 266, 340 272 S 530 238, 606 205" stroke="' + B + '" stroke-width="3" fill="none" stroke-linecap="round"/>' +
      '<path d="M340 40V290" stroke="' + G + '" stroke-width="2" stroke-dasharray="6 6"/>' +
      '<circle cx="246" cy="247" r="14" fill="rgba(245,179,66,0.2)"/><circle cx="246" cy="247" r="6" fill="' + A + '"/>' +
      '<g ' + F + ' font-size="14"><text x="350" y="62" fill="' + G + '">CPPopt</text><text x="84" y="278" fill="' + R + '">CPP &lt; CPPopt</text><text x="262" y="232" fill="' + A + '">bệnh nhân</text><text x="520" y="318" fill="' + M + '">CPP mmHg</text><text x="22" y="54" fill="' + M + '">PRx</text></g>',
    "icp-brain": grid + brain(70, 20, 1.45) +
      '<path d="M40 322 L150 322 L168 284 L188 314 L206 292 L226 322 L600 322" stroke="' + B + '" stroke-width="4" fill="none"/>' +
      '<g ' + F + ' font-size="15"><text x="40" y="44" fill="' + G + '">ICP</text><text x="96" y="44" fill="' + B + '">PRx</text></g>',
    "ct-ich": grid +
      '<ellipse cx="320" cy="180" rx="124" ry="146" fill="none" stroke="' + T + '" stroke-width="6"/>' +
      '<ellipse cx="320" cy="180" rx="100" ry="122" fill="#14222e"/>' +
      '<path d="M320 64V296" stroke="#4a6070" stroke-width="3" stroke-dasharray="8 8"/>' +
      '<path d="M356 146 C 404 134, 412 192, 378 210 C 342 224, 330 170, 356 146 Z" fill="' + R + '" opacity="0.85"/>' +
      '<path d="M270 14 L 292 126" stroke="' + G + '" stroke-width="5"/><circle cx="292" cy="130" r="9" fill="' + G + '"/>' +
      '<path d="M470 120 L500 120 L510 96 L522 140 L534 112 L560 120 L610 120" stroke="' + G + '" stroke-width="3" fill="none"/>',
    "nirs": '<rect x="0" y="176" width="640" height="60" fill="#2a1d22"/><rect x="0" y="236" width="640" height="64" fill="#3a1f27"/><rect x="0" y="300" width="640" height="60" fill="#4a1f2b"/>' +
      '<rect x="176" y="134" width="288" height="42" rx="12" fill="#dbe6ee"/><circle cx="224" cy="155" r="10" fill="' + A + '"/>' +
      '<rect x="360" y="146" width="22" height="18" rx="3" fill="#091119"/><rect x="418" y="146" width="22" height="18" rx="3" fill="#091119"/>' +
      '<path d="M224 176 C 240 272, 360 272, 371 176" stroke="' + B + '" stroke-width="5" fill="none"/>' +
      '<path d="M224 176 C 240 344, 420 344, 429 176" stroke="' + B + '" stroke-width="5" fill="none" opacity="0.6"/>' +
      '<g ' + F + '><text x="38" y="78" font-size="40" fill="' + B + '">tHb</text><text x="38" y="112" font-size="16" fill="' + M + '">liên tục · không xâm lấn</text></g>',
    "pbto2": grid + brain(60, 40, 1.45, "rgba(110,231,168,0.06)") +
      '<path d="M390 0 L 390 200" stroke="#dbe6ee" stroke-width="6"/><circle cx="390" cy="206" r="11" fill="' + B + '"/>' +
      '<g fill="none" stroke="' + B + '" stroke-width="3"><circle cx="452" cy="226" r="18"/><circle cx="490" cy="182" r="12"/><circle cx="318" cy="228" r="14"/></g>' +
      '<text x="32" y="54" ' + F + ' font-size="30" fill="' + B + '">PbtO₂ + ICP</text>',
    "alta": grid +
      '<rect x="106" y="40" width="428" height="258" rx="22" fill="#0f1c27" stroke="' + T + '" stroke-width="5"/>' +
      '<path d="M136 132 L210 132 L228 84 L248 176 L268 116 L294 132 L504 132" stroke="' + R + '" stroke-width="4" fill="none"/>' +
      '<rect x="136" y="190" width="104" height="80" rx="8" fill="rgba(255,138,138,0.2)"/><rect x="252" y="190" width="104" height="80" rx="8" fill="rgba(255,255,255,0.08)"/><rect x="368" y="190" width="136" height="80" rx="8" fill="rgba(245,179,66,0.25)"/>' +
      '<g ' + F + ' font-weight="700"><text x="150" y="240" font-size="22" fill="' + R + '">MAP</text><text x="266" y="240" font-size="22" fill="#e6eef3">CO</text><text x="382" y="240" font-size="24" fill="' + A + '">HPI</text></g>' +
      '<circle cx="478" cy="262" r="30" fill="none" stroke="' + G + '" stroke-width="3"/><circle cx="478" cy="262" r="10" fill="' + G + '"/>',
    "neuro-screen": grid +
      '<rect x="96" y="40" width="448" height="270" rx="22" fill="#0f1c27" stroke="' + T + '" stroke-width="5"/>' +
      '<path d="M126 130 L190 130 L200 104 L212 126 L222 112 L236 130 L300 130 L310 104 L322 126 L332 112 L346 130 L410 130 L420 104 L432 126 L442 112 L456 130 L514 130" stroke="' + G + '" stroke-width="4" fill="none"/>' +
      '<rect x="126" y="180" width="120" height="96" rx="8" fill="rgba(110,231,168,0.14)"/><rect x="258" y="180" width="120" height="96" rx="8" fill="rgba(245,179,66,0.2)"/><rect x="390" y="180" width="124" height="96" rx="8" fill="rgba(124,199,255,0.14)"/>' +
      '<g ' + F + ' font-weight="700"><text x="140" y="214" font-size="16" fill="' + M + '">ICP</text><text x="140" y="256" font-size="34" fill="' + G + '">18</text><text x="272" y="214" font-size="16" fill="' + M + '">CPP</text><text x="272" y="256" font-size="34" fill="' + A + '">62</text><text x="404" y="214" font-size="16" fill="' + M + '">CPPopt</text><text x="404" y="256" font-size="34" fill="' + B + '">74</text></g>',
    "sibicc": grid +
      '<path d="M40 112 H610" stroke="' + R + '" stroke-width="2" stroke-dasharray="8 6"/><text x="44" y="102" ' + F + ' font-size="14" fill="' + R + '">ICP &gt; 22 mmHg</text>' +
      '<rect x="60" y="240" width="150" height="70" fill="rgba(110,231,168,0.18)" stroke="' + G + '" stroke-width="2"/>' +
      '<rect x="210" y="196" width="150" height="114" fill="rgba(124,199,255,0.16)" stroke="' + B + '" stroke-width="2"/>' +
      '<rect x="360" y="156" width="150" height="154" fill="rgba(245,179,66,0.16)" stroke="' + A + '" stroke-width="2"/>' +
      '<rect x="510" y="124" width="90" height="186" fill="rgba(255,138,138,0.16)" stroke="' + R + '" stroke-width="2"/>' +
      '<g ' + F + ' font-size="15" font-weight="700"><text x="76" y="276" fill="' + G + '">BẬC 0</text><text x="226" y="232" fill="' + B + '">BẬC 1</text><text x="376" y="192" fill="' + A + '">BẬC 2</text><text x="522" y="160" fill="' + R + '">BẬC 3</text></g>' +
      '<g ' + F + ' font-size="12" fill="' + T + '"><text x="376" y="214">thử thách MAP</text></g>',
    "pi-spinal": grid +
      '<path d="M40 250 C 120 250, 140 120, 200 120 S 290 250, 360 250 S 440 120, 500 120 S 580 250, 620 250" stroke="' + G + '" stroke-width="4" fill="none"/>' +
      '<path d="M40 300 L600 300" stroke="#4a6070" stroke-width="1.5"/>' +
      '<path d="M120 80 L120 300 M420 160 L420 300" stroke="' + A + '" stroke-width="2" stroke-dasharray="6 6"/>' +
      '<g ' + F + ' font-size="15"><text x="40" y="54" fill="' + G + '">PI</text><text x="128" y="96" fill="' + A + '">trước gây tê</text><text x="428" y="176" fill="' + A + '">sau gây tê</text></g>',
    "hpi-wave": grid +
      '<path d="M40 210 L90 210 L102 150 L118 230 L132 196 L150 210 L210 210 L222 156 L238 230 L252 198 L270 210 L330 210 L342 166 L358 232 L372 204 L390 210 L450 210 L462 180 L478 234 L492 210 L600 214" stroke="' + R + '" stroke-width="4" fill="none"/>' +
      '<path d="M40 290 C 200 286, 380 270, 600 236" stroke="' + A + '" stroke-width="4" fill="none"/>' +
      '<g ' + F + '><text x="40" y="60" font-size="34" font-weight="700" fill="' + A + '">HPI</text><text x="40" y="90" font-size="15" fill="' + M + '">dự báo tụt huyết áp</text></g>'
  };
  /* Hình thiết bị (minh họa chung, không phải ảnh thật) */
  H["dev-neurosmart"] = '<rect x="170" y="70" width="300" height="200" rx="18" fill="#0f1c27" stroke="' + T + '" stroke-width="5"/>' +
    '<path d="M196 140 L246 140 L256 116 L268 136 L278 124 L292 140 L346 140 L356 116 L368 136 L378 124 L392 140 L446 140" stroke="' + G + '" stroke-width="4" fill="none"/>' +
    '<rect x="196" y="176" width="72" height="64" rx="6" fill="rgba(110,231,168,0.16)"/><rect x="280" y="176" width="72" height="64" rx="6" fill="rgba(245,179,66,0.2)"/><rect x="364" y="176" width="82" height="64" rx="6" fill="rgba(124,199,255,0.16)"/>' +
    '<path d="M300 270 L290 300 M340 270 L350 300 M270 300 H370" stroke="' + T + '" stroke-width="5" stroke-linecap="round"/>';
  H["dev-mpr2"] = '<rect x="232" y="78" width="176" height="200" rx="16" fill="#0f1c27" stroke="' + T + '" stroke-width="5"/>' +
    '<rect x="252" y="100" width="136" height="96" rx="4" fill="#cfdde6"/>' +
    '<path d="M262 160 L292 160 L300 138 L310 156 L318 146 L328 160 L378 160" stroke="#1c252e" stroke-width="3" fill="none"/>' +
    '<g fill="#2a3d4f"><rect x="256" y="214" width="34" height="18" rx="4"/><rect x="303" y="214" width="34" height="18" rx="4"/><rect x="350" y="214" width="34" height="18" rx="4"/><rect x="256" y="242" width="128" height="18" rx="4"/></g>' +
    '<path d="M408 220 C 470 220, 470 300, 540 300" stroke="' + B + '" stroke-width="4" fill="none"/>';
  H["dev-alta"] = '<rect x="140" y="56" width="360" height="226" rx="20" fill="#0f1c27" stroke="' + T + '" stroke-width="5"/>' +
    '<path d="M166 132 L230 132 L244 92 L262 172 L278 116 L300 132 L474 132" stroke="' + R + '" stroke-width="4" fill="none"/>' +
    '<rect x="166" y="184" width="92" height="72" rx="8" fill="rgba(255,138,138,0.2)"/><rect x="270" y="184" width="92" height="72" rx="8" fill="rgba(255,255,255,0.08)"/><rect x="374" y="184" width="100" height="72" rx="8" fill="rgba(245,179,66,0.25)"/>' +
    '<path d="M320 282 V 316 M262 316 H378" stroke="' + T + '" stroke-width="5" stroke-linecap="round"/>';

  window.CatrucHinh = {
    has: function (k) { return !!H[k]; },
    svg: function (key, label, slice) {
      var body = H[key] || H["icp-brain"];
      var a11y = label ? ' role="img" aria-label="' + String(label).replace(/"/g, "&quot;") + '"' : ' aria-hidden="true"';
      return '<svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid ' + (slice ? "slice" : "meet") + '"' + a11y + ">" + body + "</svg>";
    }
  };
})();
