/* =====================================================================
 *  메인 스크립트
 *  - 문구 / 가방 목록 / 영상 경로는 config.js 에서 수정하세요.
 *  - 테스트용 바로가기: index.html?step=shop  (check, win, reveal, shop, finale, video)
 * ===================================================================== */
(function () {
  "use strict";

  var CFG = window.SITE_CONFIG || {};
  var TEXT = CFG.text || {};
  var TICKET = CFG.ticket || {};
  var VIDEO = CFG.video || {};
  var FINALE = CFG.finale || {};
  var USE_VIDEO = FINALE.mode === "video";
  var BRANDS = CFG.brands || [];
  var BAGS = CFG.bags || [];

  var STEPS = ["check", "win", "reveal", "shop", "transition", "finale", "video"];
  var THEME_COLORS = {
    check: "#f7f3ea", win: "#0e0d0b", reveal: "#f7f3ea",
    shop: "#fbf8f1", transition: "#0e0d0b", finale: "#000000", video: "#000000"
  };
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  }

  function escapeXml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function roundLabel() {
    return "제 " + String(TICKET.round || "") + "회";
  }
  function brandById(id) {
    for (var i = 0; i < BRANDS.length; i++) if (BRANDS[i].id === id) return BRANDS[i];
    return { id: id, name: String(id).toUpperCase(), nameKo: "" };
  }

  /* ---------- 화면 전환과 함께 정리되는 타이머 ---------- */
  var timers = [];
  function later(fn, ms) {
    var id = setTimeout(function () {
      timers = timers.filter(function (t) { return t !== id; });
      fn();
    }, ms);
    timers.push(id);
    return id;
  }
  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  /* =====================================================================
   *  화면 관리
   * ===================================================================== */
  var screens = {};
  $all(".screen").forEach(function (s) { screens[s.getAttribute("data-screen")] = s; });
  var current = null;
  var themeMeta = $('meta[name="theme-color"]');

  function fadeDuration(node) {
    var d = parseFloat(getComputedStyle(node).transitionDuration) || 0;
    return Math.round(d * 1000);
  }

  function show(name, opts) {
    opts = opts || {};
    if (!screens[name] || name === current) return;
    clearTimers();

    var prevName = current;
    var prev = prevName ? screens[prevName] : null;
    var next = screens[name];
    if (prevName) onLeave(prevName);
    current = name;

    if (opts.history === "push") history.pushState({ step: name }, "");
    else if (opts.history === "replace") history.replaceState({ step: name }, "");

    function enter() {
      Object.keys(screens).forEach(function (k) {
        if (screens[k] !== next) screens[k].classList.remove("is-shown", "is-visible");
      });
      document.body.setAttribute("data-screen", name);
      if (themeMeta) themeMeta.setAttribute("content", THEME_COLORS[name] || "#f7f3ea");
      next.classList.add("is-shown");
      window.scrollTo(0, 0);
      void next.offsetWidth; // 리플로우 후 페이드 인
      requestAnimationFrame(function () {
        next.classList.add("is-visible");
      });
      onEnter(name);
    }

    if (prev && prev.classList.contains("is-shown")) {
      prev.classList.remove("is-visible");
      later(enter, fadeDuration(prev));
    } else {
      enter();
    }
  }

  function onEnter(name) {
    if (name === "check") runCheck();
    else if (name === "win") startConfetti();
    else if (name === "reveal") runReveal();
    else if (name === "transition") runTransition();
    else if (name === "finale") runFinale();
    else if (name === "video") enterVideo();
  }

  function onLeave(name) {
    if (name === "win") stopConfetti();
    else if (name === "transition") screens.transition.classList.remove("is-dimming");
    else if (name === "video") leaveVideo();
  }

  /* 뒤로가기 / 앞으로가기 */
  window.addEventListener("popstate", function (e) {
    var step = e.state && e.state.step;
    if (!step || STEPS.indexOf(step) === -1) return;
    if (step === "check") step = "win";          // 확인 연출은 다시 보여주지 않음
    if (step === "transition") step = "shop";
    closeSheet(true);
    show(step);
  });

  /* =====================================================================
   *  공통 문구 채우기
   * ===================================================================== */
  function fillTexts() {
    $all("[data-text]").forEach(function (node) {
      var key = node.getAttribute("data-text");
      if (TEXT[key] != null) node.textContent = TEXT[key];
    });
    $all("[data-finale]").forEach(function (node) {
      var key = node.getAttribute("data-finale");
      if (FINALE[key] != null) node.textContent = FINALE[key];
    });
    $all("[data-round]").forEach(function (node) { node.textContent = roundLabel(); });

    var balls = $("#winBalls");
    (TICKET.numbers || []).slice(0, 6).map(Number)
      .sort(function (a, b) { return a - b; })
      .forEach(function (n) { balls.appendChild(el("li", "", pad2(n))); });
  }

  /* =====================================================================
   *  1. QR 당첨 확인
   * ===================================================================== */
  var ticketRendered = false;
  function renderCheckTicket() {
    if (ticketRendered || !window.LottoTicket) return;
    var siteUrl = CFG.siteUrl || new URL("./", location.href).href;
    $("#checkTicket").innerHTML = window.LottoTicket.render({ url: siteUrl, ticket: TICKET });
    ticketRendered = true;
  }

  function runCheck() {
    var screen = screens.check;
    var status = $("#checkStatus");
    renderCheckTicket();
    screen.classList.remove("is-scanning", "is-won");
    status.textContent = "QR 코드를 확인하고 있습니다…";

    later(function () { screen.classList.add("is-scanning"); }, 300);
    later(function () { status.textContent = "당첨 번호를 대조하고 있습니다…"; }, 1700);
    later(function () {
      screen.classList.add("is-won");
      status.textContent = "당첨 복권입니다";
    }, 3500);
    later(function () { show("win", { history: "replace" }); }, 5200);
  }

  /* =====================================================================
   *  2. 당첨 화면 - 금색 종이 꽃가루 (한 번만, 은은하게)
   * ===================================================================== */
  var confetti = { raf: 0, pieces: [], start: 0 };

  function startConfetti() {
    stopConfetti();
    if (reduceMotion) return;
    var canvas = $("#confetti");
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth;
    var h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var colors = ["#e2c891", "#c9a464", "#9c7a41", "#f4ecdc", "#b8955a"];
    var count = Math.round(Math.min(90, Math.max(40, w / 6)));
    confetti.pieces = [];
    for (var i = 0; i < count; i++) {
      confetti.pieces.push({
        x: Math.random() * w,
        y: -20 - Math.random() * h * 0.9,
        w: 5 + Math.random() * 6,
        h: 2.5 + Math.random() * 4,
        vy: 45 + Math.random() * 55,          // px/s
        sway: 10 + Math.random() * 22,
        swaySpeed: 0.8 + Math.random() * 1.4,
        phase: Math.random() * Math.PI * 2,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 3,
        color: colors[i % colors.length]
      });
    }
    confetti.start = 0;
    var last = 0;

    function frame(ts) {
      if (!confetti.start) { confetti.start = ts; last = ts; }
      var dt = Math.min(0.05, (ts - last) / 1000);
      var elapsed = (ts - confetti.start) / 1000;
      last = ts;
      ctx.clearRect(0, 0, w, h);
      var alive = 0;
      var fadeOut = elapsed > 7 ? Math.max(0, 1 - (elapsed - 7) / 2) : 1;
      confetti.pieces.forEach(function (p) {
        p.y += p.vy * dt;
        p.rot += p.vr * dt;
        if (p.y > h + 20) return;
        alive++;
        var x = p.x + Math.sin(elapsed * p.swaySpeed + p.phase) * p.sway;
        ctx.save();
        ctx.globalAlpha = 0.85 * fadeOut;
        ctx.translate(x, p.y);
        ctx.rotate(p.rot);
        ctx.scale(1, Math.cos(elapsed * p.swaySpeed * 2 + p.phase)); // 종이가 뒤집히는 느낌
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (alive > 0 && fadeOut > 0) confetti.raf = requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    }
    confetti.raf = requestAnimationFrame(frame);
  }

  function stopConfetti() {
    if (confetti.raf) cancelAnimationFrame(confetti.raf);
    confetti.raf = 0;
    var canvas = $("#confetti");
    if (canvas.width) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }

  /* =====================================================================
   *  3. 상품 공개
   * ===================================================================== */
  function runReveal() {
    var box = $("#reveal");
    box.classList.remove("step-1", "step-2", "step-3");
    later(function () { box.classList.add("step-1"); }, 350);
    later(function () { box.classList.add("step-2"); }, 1500);
    later(function () { box.classList.add("step-3"); }, 3400);
  }

  /* =====================================================================
   *  4. 명품관 - 이미지 & 대체 실루엣
   * ===================================================================== */
  var SHAPES = {
    flap:
      '<path class="s" d="M96 168 C100 72 200 72 204 168" stroke-dasharray="7 5"/>' +
      '<rect class="b" x="78" y="166" width="144" height="104" rx="6"/>' +
      '<g class="q" clip-path="url(#CLIP)">{QUILT}</g>' +
      '<path class="l" d="M78 222 H222"/>' +
      '<rect class="l" x="140" y="214" width="20" height="14" rx="2"/>',
    topHandle:
      '<path class="s" d="M112 152 C112 98 188 98 188 152"/>' +
      '<path class="b" d="M74 150 H226 L240 280 Q240 286 234 286 H66 Q60 286 60 280 Z"/>' +
      '<path class="l" d="M74 150 L84 208 Q150 222 216 208 L226 150"/>' +
      '<rect class="l" x="140" y="204" width="20" height="16" rx="2"/>',
    dome:
      '<path class="s" d="M118 134 C118 90 182 90 182 134"/>' +
      '<path class="b" d="M58 285 V250 C58 170 100 130 150 130 C200 130 242 170 242 250 V285 Z"/>' +
      '<path class="l" d="M74 236 C78 170 112 146 150 146 C188 146 222 170 226 236" stroke-dasharray="2 4"/>' +
      '<rect class="l" x="142" y="222" width="16" height="18" rx="2"/>',
    bucket:
      '<path class="s" d="M98 142 C104 58 196 58 202 142"/>' +
      '<path class="b" d="M92 140 H208 L224 278 Q150 296 76 278 Z"/>' +
      '<path class="l" d="M92 156 Q150 172 208 156"/>' +
      '<path class="l" d="M150 166 L140 196 M150 166 L160 196"/>',
    tote:
      '<path class="s" d="M100 152 C100 92 138 92 138 152"/>' +
      '<path class="s" d="M162 152 C162 92 200 92 200 152"/>' +
      '<path class="b" d="M62 150 H238 L228 290 H72 Z"/>' +
      '<path class="l" d="M68 196 H232"/><path class="l" d="M70 206 H230"/>',
    baguette:
      '<path class="s" d="M82 186 C92 112 208 112 218 186"/>' +
      '<rect class="b" x="62" y="184" width="176" height="84" rx="10"/>' +
      '<path class="l" d="M62 232 H238"/>' +
      '<rect class="l" x="138" y="224" width="24" height="14" rx="2"/>'
  };

  var placeholderSeq = 0;
  function placeholderSvg(bag, brand) {
    var id = "ph" + (++placeholderSeq);
    var quilt = "";
    for (var x = -30; x < 260; x += 24) {
      quilt += '<path d="M' + x + ' 166 l104 104"/><path d="M' + (x + 104) + ' 166 l-104 104"/>';
    }
    var shape = (SHAPES[bag.shape] || SHAPES.topHandle)
      .replace("{QUILT}", quilt)
      .replace("CLIP", id + "c");
    return '<svg viewBox="0 0 300 375" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
      "<defs>" +
      '<radialGradient id="' + id + 'g" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#fbf8f2"/><stop offset="1" stop-color="#ece5d7"/></radialGradient>' +
      '<clipPath id="' + id + 'c"><rect x="78" y="166" width="144" height="104" rx="6"/></clipPath>' +
      "</defs>" +
      '<rect width="300" height="375" fill="url(#' + id + 'g)"/>' +
      '<ellipse cx="150" cy="300" rx="100" ry="7" fill="rgba(60,40,10,.07)"/>' +
      '<g fill="none" stroke="#b08d57" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' +
      "<style>.b{fill:rgba(176,141,87,.08)}.q path{stroke-width:1;opacity:.55}.l{stroke-width:1.6}</style>" +
      shape + "</g>" +
      '<text x="150" y="342" text-anchor="middle" font-family="Cormorant Garamond, Times New Roman, serif" font-size="19" font-weight="600" letter-spacing="5" fill="#8a7350">' +
      escapeXml(brand.name) + "</text>" +
      "</svg>";
  }

  var failedImages = {}; // 한 번 실패한 이미지는 다시 요청하지 않음

  function createMedia(bag, brand, className) {
    var box = el("div", className);
    var ph = el("div", "placeholder");
    ph.innerHTML = placeholderSvg(bag, brand);
    box.appendChild(ph);

    if (bag.image && !failedImages[bag.image]) {
      var img = new Image();
      img.alt = brand.name + " " + bag.model;
      img.decoding = "async";
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      img.onload = function () {
        if (img.naturalWidth > 0) {
          img.classList.add("is-loaded");
          ph.style.visibility = "hidden"; // 사진이 뜨면 실루엣은 숨김
        } else {
          img.remove();
        }
      };
      img.onerror = function () { // 실패하면 실루엣이 그대로 보임
        failedImages[bag.image] = true;
        img.remove();
      };
      img.src = bag.image;
      box.appendChild(img);
    }
    return box;
  }

  /* 브랜드 탭 */
  var activeBrand = "all";

  function renderBrandBar() {
    var bar = $("#brandBar");
    var list = [{ id: "all", name: "ALL" }].concat(BRANDS.filter(function (b) {
      return BAGS.some(function (bag) { return bag.brand === b.id; });
    }));
    list.forEach(function (b) {
      var chip = el("button", "chip", b.name);
      chip.type = "button";
      chip.setAttribute("role", "tab");
      chip.setAttribute("aria-selected", b.id === activeBrand ? "true" : "false");
      chip.setAttribute("data-brand", b.id);
      chip.addEventListener("click", function () {
        if (activeBrand === b.id) return;
        activeBrand = b.id;
        $all(".chip", bar).forEach(function (c) {
          c.setAttribute("aria-selected", c.getAttribute("data-brand") === activeBrand ? "true" : "false");
        });
        chip.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", inline: "center", block: "nearest" });
        renderGrid();
        var top = $(".brand-bar").offsetTop;
        if (window.scrollY > top) window.scrollTo(0, top);
      });
      bar.appendChild(chip);
    });
  }

  function renderGrid() {
    var grid = $("#shopGrid");
    grid.innerHTML = "";
    BAGS.filter(function (bag) { return activeBrand === "all" || bag.brand === activeBrand; })
      .forEach(function (bag, i) {
        var brand = brandById(bag.brand);
        var soon = bag.available === false;
        var card = el("article", "card" + (soon ? " card--soon" : ""));
        card.style.animationDelay = Math.min(i * 60, 480) + "ms";

        var media = createMedia(bag, brand, "card__media");
        if (soon) {
          var badge = el("div", "card__soon");
          badge.appendChild(el("strong", "", "COMING SOON"));
          badge.appendChild(el("span", "", "준비 중"));
          media.appendChild(badge);
        }
        card.appendChild(media);

        var body = el("div", "card__body");
        var brandLine = el("p", "card__brand", brand.name);
        if (brand.nameKo) brandLine.appendChild(el("small", "", brand.nameKo));
        body.appendChild(brandLine);
        body.appendChild(el("h3", "card__model", bag.model));
        if (bag.modelEn) body.appendChild(el("p", "card__model-en", bag.modelEn));
        body.appendChild(el("p", "card__desc", bag.desc || ""));

        var btn = el("button", "btn btn--line btn--block card__btn", soon ? "준비 중" : "이 가방 고르기");
        btn.type = "button";
        if (soon) {
          btn.disabled = true;
          btn.setAttribute("aria-disabled", "true");
          card.addEventListener("click", function () {
            showToast((brand.nameKo || brand.name) + "는 현재 준비 중이에요.");
          });
        } else {
          btn.addEventListener("click", function () { openSheet(bag, btn); });
        }
        body.appendChild(btn);
        card.appendChild(body);
        grid.appendChild(card);
      });
  }

  /* =====================================================================
   *  선택 확인 시트
   * ===================================================================== */
  var sheet = $("#sheet");
  var sheetPanel = $(".sheet__panel", sheet);
  var selectedBag = null;
  var lastFocus = null;
  var sheetTimer = 0;

  function openSheet(bag, trigger) {
    if (bag.available === false) return;
    selectedBag = bag;
    lastFocus = trigger || null;
    var brand = brandById(bag.brand);
    var thumb = $("#sheetThumb");
    thumb.innerHTML = "";
    thumb.appendChild(createMedia(bag, brand, "sheet__thumb-inner"));
    thumb.firstChild.style.cssText = "position:absolute;inset:0";
    $("#sheetBrand").textContent = brand.name;
    $("#sheetModel").textContent = bag.model;

    clearTimeout(sheetTimer);
    sheet.hidden = false;
    document.body.classList.add("is-locked");
    void sheet.offsetWidth;
    sheet.classList.add("is-open");
    sheetPanel.focus({ preventScroll: true });
  }

  function closeSheet(immediate) {
    if (sheet.hidden) return;
    sheet.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    clearTimeout(sheetTimer);
    if (immediate) {
      sheet.hidden = true;
    } else {
      sheetTimer = setTimeout(function () { sheet.hidden = true; }, 400);
      if (lastFocus) lastFocus.focus({ preventScroll: true });
    }
  }

  $all("[data-close]", sheet).forEach(function (node) {
    node.addEventListener("click", function () { closeSheet(false); });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !sheet.hidden) closeSheet(false);
  });

  $("#btnDecide").addEventListener("click", function () {
    if (!selectedBag) return;
    try { sessionStorage.setItem("chosenBag", brandById(selectedBag.brand).name + " " + selectedBag.model); } catch (e) { /* 무시 */ }
    if (USE_VIDEO) primeVideo(); // 사용자 터치 순간에 영상 재생 권한 확보 (iOS 대응)
    closeSheet(true);
    show("transition", { history: "push" });
  });

  /* =====================================================================
   *  5. 전환 연출
   * ===================================================================== */
  function runTransition() {
    var screen = screens.transition;
    screen.classList.remove("is-dimming");
    later(function () { screen.classList.add("is-dimming"); }, 2900);
    later(function () { show(USE_VIDEO ? "video" : "finale", { history: "replace" }); }, 3900);
  }

  /* =====================================================================
   *  6-A. 마지막 장면 - 앞을 봐 줘 (영상은 현장 스크린에서 직접 재생)
   * ===================================================================== */
  function runFinale() {
    var box = $(".finale");
    box.classList.remove("show-1", "show-2");
    later(function () { box.classList.add("show-1"); }, 600);
    later(function () { box.classList.add("show-2"); }, 2200);
  }

  /* =====================================================================
   *  6. 영상
   * ===================================================================== */
  var video = $("#video");
  var loadingBox = $("#videoLoading");
  var loadingText = $("#videoLoadingText");
  var btnSlowRetry = $("#btnSlowRetry");
  var btnPlay = $("#btnPlay");
  var errorBox = $("#videoError");
  var ending = $("#ending");
  var vstate = { ready: false, failed: false, started: false, slowTimer: 0 };

  function videoSrc(bust) {
    var src = VIDEO.src || "assets/proposal.mp4";
    if (!bust) return src;
    return src + (src.indexOf("?") > -1 ? "&" : "?") + "retry=" + Date.now();
  }

  function setupVideo(bust) {
    if (vstate.ready && !bust) return;
    vstate.ready = true;
    vstate.failed = false;
    if (VIDEO.poster) video.poster = VIDEO.poster;
    video.preload = "auto";
    video.innerHTML = "";
    var source = document.createElement("source");
    source.src = videoSrc(bust);
    if (VIDEO.type) source.type = VIDEO.type;
    // <source> 의 오류는 video 에서 발생하지 않으므로 여기서 잡음
    source.addEventListener("error", onVideoError);
    video.appendChild(source);
    video.load();
  }

  function primeVideo() {
    setupVideo(false);
    vstate.started = false;
    video.muted = true;
    var p;
    try { p = video.play(); } catch (e) { p = null; }
    if (p && p.then) {
      p.then(function () {
        if (!vstate.started) {
          video.pause();
          try { video.currentTime = 0; } catch (e) { /* 무시 */ }
        }
        video.muted = false;
      }).catch(function () { video.muted = false; });
    } else {
      video.muted = false;
    }
  }

  function showLoading() {
    loadingBox.hidden = false;
    clearTimeout(vstate.slowTimer);
    loadingText.textContent = "영상을 불러오는 중…";
    btnSlowRetry.hidden = true;
    vstate.slowTimer = setTimeout(function () {
      loadingText.textContent = "네트워크가 느린 것 같아요. 조금만 기다려 주세요…";
      btnSlowRetry.hidden = false;
    }, 15000);
  }
  function hideLoading() {
    loadingBox.hidden = true;
    clearTimeout(vstate.slowTimer);
  }
  function showPlayButton() { hideLoading(); btnPlay.hidden = false; }
  function hidePlayButton() { btnPlay.hidden = true; }

  function showError() {
    hideLoading();
    hidePlayButton();
    errorBox.hidden = false;
  }
  function hideError() { errorBox.hidden = true; }

  function onVideoError() {
    vstate.failed = true;
    if (current === "video") showError();
  }

  function startVideo() {
    if (vstate.failed) { showError(); return; }
    vstate.started = true;
    hideError();
    hidePlayButton();
    hideEnding();
    video.muted = false;
    if (video.readyState < 3) showLoading();
    var p;
    try { p = video.play(); } catch (e) { p = null; }
    if (p && p.catch) {
      p.catch(function (err) {
        if (vstate.failed) return;
        // 자동 재생이 막힌 경우 → 직접 누를 수 있는 재생 버튼 표시
        if (!err || err.name !== "AbortError") showPlayButton();
      });
    }
  }

  function enterVideo() {
    setupVideo(false);
    hideEnding();
    if (vstate.failed) { showError(); return; }
    startVideo();
  }

  function leaveVideo() {
    video.pause();
    hideLoading();
    hideEnding();
  }

  function retryVideo() {
    hideError();
    setupVideo(true);
    startVideo();
  }

  /* 영상 끝 → 마무리 문구 */
  function exitFullscreenIfNeeded() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitFullscreenElement && document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (video.webkitDisplayingFullscreen && video.webkitExitFullscreen) video.webkitExitFullscreen();
    } catch (e) { /* 무시 */ }
  }

  function showEnding() {
    if (VIDEO.showEndingMessage === false) return;
    exitFullscreenIfNeeded();
    ending.hidden = false;
    ending.classList.remove("is-visible", "show-1", "show-2");
    void ending.offsetWidth;
    ending.classList.add("is-visible");
    later(function () { ending.classList.add("show-1"); }, 700);
    later(function () { ending.classList.add("show-2"); }, 2900);
  }
  function hideEnding() {
    ending.classList.remove("is-visible", "show-1", "show-2");
    ending.hidden = true;
  }

  video.addEventListener("playing", function () { hideLoading(); hidePlayButton(); hideError(); });
  video.addEventListener("waiting", function () { if (vstate.started && current === "video") showLoading(); });
  video.addEventListener("canplay", function () { if (video.paused) hideLoading(); });
  video.addEventListener("error", onVideoError);
  video.addEventListener("ended", function () { if (current === "video") showEnding(); });
  video.addEventListener("play", function () { hidePlayButton(); hideEnding(); });

  btnPlay.addEventListener("click", startVideo);
  $("#btnRetry").addEventListener("click", retryVideo);
  btnSlowRetry.addEventListener("click", retryVideo);
  $("#btnReplay").addEventListener("click", function () {
    hideEnding();
    try { video.currentTime = 0; } catch (e) { /* 무시 */ }
    startVideo();
  });
  $("#btnFullscreen").addEventListener("click", function () {
    try {
      if (video.requestFullscreen) video.requestFullscreen();
      else if (video.webkitRequestFullscreen) video.webkitRequestFullscreen();
      else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen(); // iOS Safari
    } catch (e) {
      showToast("이 브라우저에서는 영상의 전체 화면 버튼을 이용해 주세요.");
    }
  });

  /* =====================================================================
   *  토스트
   * ===================================================================== */
  var toast = $("#toast");
  var toastTimer = 0;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2400);
  }

  /* =====================================================================
   *  버튼 연결 & 시작
   * ===================================================================== */
  $("#btnClaim").addEventListener("click", function () { show("reveal", { history: "push" }); });
  $("#btnToShop").addEventListener("click", function () { show("shop", { history: "push" }); });

  fillTexts();
  renderBrandBar();
  renderGrid();

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";

  var params = new URLSearchParams(location.search);
  var startStep = params.get("step");
  if (["check", "win", "reveal", "shop", "finale", "video"].indexOf(startStep) === -1) startStep = "check";
  history.replaceState({ step: startStep }, "");
  show(startStep);
})();
