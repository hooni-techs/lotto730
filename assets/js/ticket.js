/* =====================================================================
 *  로또 용지 SVG 렌더러 (실제 로또 6/45 감열지 영수증 형태)
 *  - 좌표계: 1 단위 = 0.1mm  (viewBox 800 x 1360 = 80mm x 136mm, 세로형)
 *  - index.html(웹 화면)과 print-lotto.html(인쇄용)이 함께 사용합니다.
 *  - QR 코드는 assets/js/qrcode.js (qrcode-generator, MIT) 로 생성합니다.
 * ===================================================================== */
(function (global) {
  "use strict";

  var W = 800;
  var H = 1360;
  var INK = "#1d1d1f";          // 감열지 인쇄 잉크
  var PINK = "#f2a7b8";         // 용지에 미리 인쇄된 분홍색
  var PINK_SOFT = "#f8d3dc";

  var FONT_PRINT = "'Nanum Gothic Coding', 'D2Coding', 'Consolas', monospace";
  var FONT_LOGO = "'Nunito', 'Arial Rounded MT Bold', 'Arial', sans-serif";
  var FONT_KR = "'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  /* ---------- 고정 난수 (같은 설정이면 항상 같은 모양) ---------- */
  function seeded(text) {
    var seed = 0;
    for (var i = 0; i < text.length; i++) seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
    return function () {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  /* ---------- 하트 곡선 위의 6개 위치 계산 ---------- */
  function heartRaw(t) {
    return [
      16 * Math.pow(Math.sin(t), 3),
      -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    ];
  }

  function heartLayout(box, radius, stretch) {
    var N = 1200;
    var pts = [];
    var len = [0];
    var i;
    for (i = 0; i <= N; i++) {
      pts.push(heartRaw((i / N) * Math.PI * 2));
      if (i > 0) {
        len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      }
    }
    var total = len[N];

    // 순서: 왼쪽 위 → 오목점 → 오른쪽 위 → 오른쪽 옆 → 아래 꼭짓점 → 왼쪽 옆 (시계 방향)
    var fractions = [0.87, 0, 0.13, 0.31, 0.5, 0.69];
    var raw = fractions.map(function (f) {
      var target = f * total;
      var j = 0;
      while (j < N && len[j] < target) j++;
      return pts[j];
    });

    var minY = Infinity, maxY = -Infinity;
    pts.forEach(function (p) {
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    });
    var scale = Math.min(
      (box.w - radius * 2) / (32 * stretch),
      (box.h - radius * 2) / (maxY - minY)
    );
    var cx = box.x + box.w / 2;
    var cy = box.y + box.h / 2 - ((minY + maxY) / 2) * scale;

    function map(p) {
      return [cx + p[0] * scale * stretch, cy + p[1] * scale];
    }

    var d = "";
    for (i = 0; i <= N; i += 6) {
      var m = map(pts[i]);
      d += (i === 0 ? "M" : "L") + m[0].toFixed(1) + " " + m[1].toFixed(1);
    }
    d += "Z";

    return { points: raw.map(map), path: d };
  }

  /* ---------- QR 코드 ---------- */
  function qrSvg(url, x, y, size) {
    if (typeof global.qrcode !== "function") {
      return '<rect x="' + x + '" y="' + y + '" width="' + size + '" height="' + size + '" fill="none" stroke="' + INK + '"/>';
    }
    var qr = global.qrcode(0, "M");
    qr.addData(url || " ");
    qr.make();
    var count = qr.getModuleCount();
    var cell = size / count;
    var path = "";
    for (var r = 0; r < count; r++) {
      for (var c = 0; c < count; c++) {
        if (qr.isDark(r, c)) {
          var px = x + c * cell;
          var py = y + r * cell;
          path += "M" + px.toFixed(2) + " " + py.toFixed(2) +
            "h" + (cell + 0.2).toFixed(2) + "v" + (cell + 0.2).toFixed(2) +
            "h-" + (cell + 0.2).toFixed(2) + "z";
        }
      }
    }
    return '<path d="' + path + '" fill="' + INK + '" shape-rendering="crispEdges"/>';
  }

  /* ---------- 하단 2차원 바코드 (PDF417 모양, 장식용) ---------- */
  function pdf417Svg(x, y, w, h, seedText) {
    var rand = seeded(seedText);
    var rows = 14;
    var unit = 2.6;
    var rowH = h / rows;
    var out = "";

    // 시작 / 끝 패턴 (모든 행 공통 굵은 막대)
    function guard(gx, pattern) {
      var cx = gx;
      pattern.forEach(function (bw, k) {
        if (k % 2 === 0) out += '<rect x="' + cx.toFixed(1) + '" y="' + y + '" width="' + (bw * unit).toFixed(1) + '" height="' + h + '"/>';
        cx += bw * unit;
      });
      return cx;
    }
    var startEnd = guard(x, [8, 1, 1, 1, 1, 1, 1, 3]);
    var stopStart = x + w - 18 * unit;
    guard(stopStart, [7, 1, 1, 3, 1, 1, 1, 2, 1]);

    // 데이터 영역: 행마다 무작위 막대
    for (var r = 0; r < rows; r++) {
      var cx = startEnd + unit * 2;
      var ry = y + r * rowH;
      while (cx < stopStart - unit * 3) {
        var bw = unit * (1 + Math.floor(rand() * 4));
        if (cx + bw > stopStart - unit * 2) break;
        out += '<rect x="' + cx.toFixed(1) + '" y="' + ry.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (rowH + 0.3).toFixed(1) + '"/>';
        cx += bw + unit * (1 + Math.floor(rand() * 3));
      }
    }
    return '<g fill="' + INK + '" shape-rendering="crispEdges">' + out + "</g>";
  }

  /* ---------- 복주머니 아이콘 (단순 선 그림) ---------- */
  function pouchIcon(x, y, s) {
    return '<g transform="translate(' + x + " " + y + ") scale(" + s + ')" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">' +
      '<path d="M18 30 C4 44 0 70 10 84 C18 94 70 94 78 84 C88 70 84 44 70 30 Z" fill="#fff"/>' +
      '<path d="M22 30 Q44 38 66 30"/>' +
      '<path d="M30 30 C26 14 34 4 44 10 C54 4 62 14 58 30"/>' +
      '<path d="M28 58 L44 74 L60 58"/>' +
      "</g>";
  }

  /* ---------- 오른쪽 분홍 띠 ---------- */
  function sideStrip(text) {
    var x = W - 44;
    return '<rect x="' + x + '" y="0" width="44" height="' + H + '" fill="' + PINK_SOFT + '"/>' +
      '<rect x="' + (x + 6) + '" y="0" width="32" height="' + H + '" fill="' + PINK + '"/>' +
      '<text transform="translate(' + (x + 30) + " 40) rotate(90)" + '" font-family="' + FONT_KR + '" font-size="21" font-weight="700" letter-spacing="3" fill="#ffffff">' +
      esc(text) + "</text>";
  }

  /* ---------- 미리 인쇄된 옅은 분홍 Lotto 무늬 ---------- */
  function watermark(x, y, size) {
    return '<text x="' + x + '" y="' + y + '" font-family="' + FONT_LOGO + '" font-size="' + size + '" font-weight="900" fill="#fbe4ea">Lotto<tspan font-size="' + Math.round(size * 0.38) + '">6/45</tspan></text>';
  }

  /* ---------- 메인 렌더 ---------- */
  function render(options) {
    var opt = options || {};
    var t = opt.ticket || {};
    var url = opt.url || "";
    var uid = "lt" + Math.random().toString(36).slice(2, 8);

    var nums = (t.numbers || [1, 2, 3, 4, 5, 6]).slice(0, 6).map(Number).sort(function (a, b) { return a - b; });
    var code = String(t.codeLine || "56665 97469 47451 82972 58805 10123 51686");
    var L = 46;          // 왼쪽 인쇄 시작
    var R = 726;         // 오른쪽 인쇄 끝 (분홍 띠 앞)

    var s = [];
    s.push('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + " " + H + '" class="lotto-ticket-svg" role="img" aria-label="로또 6/45 제 ' + esc(t.round) + '회 복권 용지">');
    s.push("<defs>" +
      '<linearGradient id="' + uid + 'g" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#fefefd"/><stop offset="1" stop-color="#f6f6f3"/></linearGradient>' +
      "</defs>");

    // 감열지 바탕 + 미리 인쇄된 무늬
    s.push('<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#' + uid + 'g)"/>');
    s.push(watermark(L - 10, 118, 92));
    s.push(watermark(L - 6, 760, 96));
    s.push(watermark(L - 6, 1350, 96));
    s.push(sideStrip(t.stripText || "문의안내 1588-6450 ■ 인터넷구매 www.dhlottery.co.kr ■ 문의안내 1588-6450"));

    /* 헤더: 로고 + QR */
    s.push(pouchIcon(L + 18, 136, 0.95));
    if (t.issuer) {
      s.push('<text x="' + (L + 230) + '" y="152" text-anchor="middle" font-family="' + FONT_KR + '" font-size="26" font-weight="700" fill="' + INK + '">' + esc(t.issuer) + "</text>");
    }
    s.push('<text x="' + (L + 112) + '" y="222" font-family="' + FONT_LOGO + '" font-size="74" font-weight="900" letter-spacing="-1" fill="' + INK + '">Lotto<tspan font-size="30" font-weight="800" dx="4">6/45</tspan></text>');

    var qrSize = 196;
    var qrX = R - qrSize - 4;
    var qrY = 56;
    s.push(qrSvg(url, qrX, qrY, qrSize));

    /* 회차 / 날짜 / 코드 */
    s.push('<g font-family="' + FONT_PRINT + '" font-weight="700" fill="' + INK + '">');
    s.push('<text x="' + ((L + R) / 2) + '" y="342" text-anchor="middle" font-size="50" letter-spacing="10">제 ' + esc(t.round || 1) + " 회</text>");
    s.push('<text x="' + L + '" y="404" font-size="31" xml:space="preserve">발 행 일 : ' + esc(t.issuedAt || "") + "</text>");
    s.push('<text x="' + L + '" y="446" font-size="31" xml:space="preserve">추 첨 일 : ' + esc(t.drawDate || "") + " " + esc(t.tr || "") + "</text>");
    s.push('<text x="' + L + '" y="488" font-size="31" xml:space="preserve">지급기한 : ' + esc(t.payDeadline || "") + "</text>");
    s.push('<text x="' + L + '" y="530" font-size="26" textLength="' + (R - L - 6) + '" lengthAdjust="spacing">' + esc(code) + "</text>");
    s.push('<text x="' + L + '" y="566" font-size="26">' + esc(t.idLeft || "N5LB7UP2C12CHGFQ") + "</text>");
    s.push('<text x="' + (R - 6) + '" y="566" text-anchor="end" font-size="26">' + esc(t.idRight || "111003480/0000002017") + "</text>");
    s.push("</g>");

    // 점선
    s.push('<line x1="' + L + '" y1="596" x2="' + R + '" y2="596" stroke="' + INK + '" stroke-width="3" stroke-dasharray="12 8"/>');

    /* 게임 영역: A 수동 + 하트 모양 번호 */
    s.push('<g font-family="' + FONT_PRINT + '" font-weight="700" fill="' + INK + '">');
    s.push('<text x="' + L + '" y="650" font-size="40" xml:space="preserve">' + esc(t.gameLabel || "A") + " 수 동</text>");
    s.push("</g>");

    var radius = 46;
    var layout = heartLayout({ x: L + 10, y: 668, w: R - L - 20, h: 372 }, radius, 1.25);
    if (t.showHeartGuide !== false) {
      s.push('<path d="' + layout.path + '" fill="none" stroke="' + INK + '" stroke-opacity="0.45" stroke-width="2.5" stroke-dasharray="1 9" stroke-linecap="round"/>');
    }
    layout.points.forEach(function (p, idx) {
      var x = p[0].toFixed(1);
      var y = p[1].toFixed(1);
      s.push('<circle cx="' + x + '" cy="' + y + '" r="' + radius + '" fill="#fefefd" stroke="' + INK + '" stroke-width="4"/>' +
        '<text x="' + x + '" y="' + (p[1] + 16).toFixed(1) + '" text-anchor="middle" font-family="' + FONT_PRINT + '" font-size="48" font-weight="700" fill="' + INK + '">' + pad2(nums[idx]) + "</text>");
    });

    // 점선
    s.push('<line x1="' + L + '" y1="1060" x2="' + R + '" y2="1060" stroke="' + INK + '" stroke-width="3" stroke-dasharray="12 8"/>');

    /* 금액 + 코드 + 바코드 */
    s.push('<g font-family="' + FONT_PRINT + '" font-weight="700" fill="' + INK + '">');
    s.push('<text x="' + (R - 6) + '" y="1110" text-anchor="end" font-size="40" letter-spacing="2">' + esc(t.price || "₩1,000") + "</text>");
    s.push('<text x="' + L + '" y="1150" font-size="38" letter-spacing="4">금액</text>');
    s.push('<text x="' + L + '" y="1196" font-size="27" textLength="' + (R - L - 6) + '" lengthAdjust="spacing">' + esc(code) + "</text>");
    s.push("</g>");
    s.push(pdf417Svg(L + 14, 1222, R - L - 34, 104, code + (t.round || "")));

    s.push("</svg>");
    return s.join("");
  }

  global.LottoTicket = { render: render, width: W, height: H };
})(window);
