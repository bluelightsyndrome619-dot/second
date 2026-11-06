/* =========================================================
   MediKataru Landing Page — interactions
   ========================================================= */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* ---------- Header state & sticky CTA ---------- */
  const header = $("#header");
  const sticky = $("#stickyCta");
  const contact = $("#contact");
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 12);
    const contactTop = contact.getBoundingClientRect().top;
    sticky.classList.toggle("is-shown", y > window.innerHeight * 0.8 && contactTop > window.innerHeight);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const nav = $("#nav");
  const toggle = $("#menuToggle");
  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    document.body.style.overflow = open ? "hidden" : "";
  };
  toggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$("a", nav).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Current section highlight ---------- */
  const navLinks = $$('.nav a[href^="#"]:not(.btn)');
  const sectionMap = new Map(navLinks.map((a) => [a.getAttribute("href").slice(1), a]));
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((a) => a.classList.remove("is-current"));
        const link = sectionMap.get(entry.target.id);
        if (link) link.classList.add("is-current");
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sectionMap.forEach((_, id) => { const el = document.getElementById(id); if (el) spy.observe(el); });
  }

  /* ---------- Reveal on scroll ---------- */
  const reveals = $$(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach((el) => io.observe(el));
  }

  /* ---------- Count-up numbers ---------- */
  const counters = $$(".count");
  const runCount = (el) => {
    const from = Number(el.dataset.from || 0);
    const to = Number(el.dataset.to);
    if (reduceMotion) { el.textContent = to; return; }
    const dur = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ("IntersectionObserver" in window) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { runCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => { el.textContent = el.dataset.from || 0; cio.observe(el); });
  }

  /* ---------- Demo: Dual Summary ---------- */
  const SUMMARIES = {
    patient: [
      { q: "💡 何が起きている？", a: "心臓の力が弱くなり、体に余分な水分がたまっている状態です。" },
      { q: "💊 何をする？", a: "体に水がたまりやすくならないよう、お薬（尿を出しやすくする薬）の量を調整します。" },
      { q: "⚠️ 何に注意する？", a: "息苦しさや急な体重増加があれば、次の予約を待たずに早めに受診してください。", warn: true },
    ],
    pro: [
      { q: "Dx / 病状", a: "心不全。EF低下、volume overload所見あり。" },
      { q: "Tx / 治療", a: "利尿薬調整。" },
      { q: "Course / 経過", a: "外来通院中。本日、病状と利尿薬調整の方針を説明。" },
      { q: "Plan", a: "体重増加・呼吸苦出現時は早期受診を指示。" },
    ],
  };

  const panel = $("#demoPanel");
  const segmented = $(".segmented");
  const segBtns = $$(".segmented__btn");
  let typingToken = 0;

  const typeText = (el, text, token) => new Promise((resolve) => {
    if (reduceMotion) { el.textContent = text; resolve(); return; }
    const caret = document.createElement("span");
    caret.className = "caret";
    let i = 0;
    const step = () => {
      if (token !== typingToken) { resolve(); return; }
      el.textContent = text.slice(0, i);
      el.appendChild(caret);
      i += 1;
      if (i <= text.length) setTimeout(step, 22);
      else { caret.remove(); resolve(); }
    };
    step();
  });

  const renderSummary = async (mode) => {
    const token = ++typingToken;
    panel.innerHTML = "";
    const items = SUMMARIES[mode].map((item) => {
      const wrap = document.createElement("div");
      wrap.className = "sum-item" + (mode === "pro" ? " sum-item--pro" : "") + (item.warn ? " sum-item--warn" : "");
      const q = document.createElement("p");
      q.className = "sum-item__q";
      q.textContent = item.q;
      const a = document.createElement("p");
      a.className = "sum-item__a";
      wrap.append(q, a);
      panel.appendChild(wrap);
      return { a, text: item.a };
    });
    for (const { a, text } of items) {
      if (token !== typingToken) return;
      await typeText(a, text, token);
    }
  };

  const setMode = (mode) => {
    segmented.dataset.mode = mode;
    segBtns.forEach((b) => {
      const active = b.dataset.mode === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", String(active));
      if (active) panel.setAttribute("aria-labelledby", b.id);
    });
    renderSummary(mode);
  };
  segBtns.forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
  segmented.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = segmented.dataset.mode === "pro" ? "patient" : "pro";
    setMode(next);
    $(`.segmented__btn[data-mode="${next}"]`).focus();
  });

  // start demo typing when it scrolls into view
  segmented.dataset.mode = "patient";
  if ("IntersectionObserver" in window) {
    const dio = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) { renderSummary("patient"); dio.disconnect(); }
    }, { threshold: 0.35 });
    dio.observe($("#demo"));
  } else {
    renderSummary("patient");
  }

  /* ---------- Story tabs (auto-advance) ---------- */
  const tabs = $$(".story__tab");
  const scenes = $$(".scene");
  const bar = $(".story__progress i");
  const SCENE_MS = 9000;
  let current = 0;
  let timer = null;
  let autoplay = !reduceMotion;

  const showScene = (idx) => {
    current = idx;
    tabs.forEach((t, i) => {
      t.classList.toggle("is-active", i === idx);
      t.setAttribute("aria-selected", String(i === idx));
    });
    scenes.forEach((s, i) => {
      const on = i === idx;
      s.classList.toggle("is-active", on);
      s.hidden = !on;
    });
    restartTimer();
  };
  const restartTimer = () => {
    clearTimeout(timer);
    bar.classList.remove("is-running");
    void bar.offsetWidth; // restart CSS animation
    if (!autoplay) { bar.style.width = `${((current + 1) / tabs.length) * 100}%`; return; }
    bar.style.width = "";
    bar.style.setProperty("--dur", `${SCENE_MS}ms`);
    bar.classList.add("is-running");
    timer = setTimeout(() => showScene((current + 1) % tabs.length), SCENE_MS);
  };
  tabs.forEach((t, i) => t.addEventListener("click", () => {
    autoplay = false; // user took control
    showScene(i);
  }));

  const storyEl = $(".story");
  if ("IntersectionObserver" in window) {
    const sio = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) restartTimer();
        else { clearTimeout(timer); bar.classList.remove("is-running"); }
      });
    }, { threshold: 0.4 });
    sio.observe(storyEl);
  }
  storyEl.addEventListener("mouseenter", () => { if (autoplay) { clearTimeout(timer); bar.style.animationPlayState = "paused"; } });
  storyEl.addEventListener("mouseleave", () => { if (autoplay) { bar.style.animationPlayState = ""; restartTimer(); } });

  /* ---------- Contact form (client-side only) ---------- */
  const form = $("#contactForm");
  const status = $("#formStatus");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let firstInvalid = null;
    $$("[required]", form).forEach((field) => {
      const val = field.value.trim();
      const bad = !val || (field.type === "email" && !emailRe.test(val));
      field.classList.toggle("is-invalid", bad);
      field.setAttribute("aria-invalid", String(bad));
      if (bad && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      status.textContent = "未入力または形式が正しくない項目があります。";
      status.className = "form__status is-error";
      firstInvalid.focus();
      return;
    }
    // NOTE: 送信先（API / フォームサービス）は未接続です。接続時はここで fetch() を実行してください。
    status.textContent = "お問い合わせありがとうございます。担当者よりご連絡いたします。";
    status.className = "form__status is-ok";
    form.reset();
  });
  $$("input, select, textarea", form).forEach((field) =>
    field.addEventListener("input", () => { field.classList.remove("is-invalid"); field.removeAttribute("aria-invalid"); })
  );

  /* ---------- Year ---------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
