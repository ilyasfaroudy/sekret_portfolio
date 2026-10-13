/* =========================================================
   SEKRET® — script.js
   Один RAF-ticker на всё, общий pointer/scroll state,
   IntersectionObserver для reveal. Без зависимостей.
   ========================================================= */
(() => {
  'use strict';

  const D = document;
  const html = D.documentElement;
  const body = D.body;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const STATIC = /[?&]static\b/.test(location.search);
  const isMobile = () => innerWidth <= 760;
  const PROJECTS = window.SEKRET_PROJECTS || [];
  const CROPS = window.SEKRET_CROPS || {};

  if (STATIC) html.classList.add('is-static');

  const $ = (s, r = D) => r.querySelector(s);
  const $$ = (s, r = D) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const pad = n => String(n).padStart(2, '0');

  /* ---------- Shared state + single ticker ---------- */
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0, active: false };
  const view = { w: innerWidth, h: innerHeight, y: scrollY, lastY: scrollY, dirty: true };
  const ticks = new Set();
  const resizeSubs = new Set();

  addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse') return;
    pointer.x = e.clientX; pointer.y = e.clientY;
    pointer.nx = e.clientX / view.w * 2 - 1;
    pointer.ny = e.clientY / view.h * 2 - 1;
    pointer.active = true;
  }, { passive: true });
  addEventListener('scroll', () => { view.dirty = true; }, { passive: true });
  let resizeRaf = 0;
  addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      view.w = innerWidth; view.h = innerHeight; view.dirty = true;
      resizeSubs.forEach(fn => fn());
    });
  }, { passive: true });

  function frame(t) {
    const scrolled = view.dirty;
    if (scrolled) { view.lastY = view.y; view.y = scrollY; }
    ticks.forEach(fn => fn(t, scrolled));
    view.dirty = false;
    requestAnimationFrame(frame);
  }

  /* ---------- Helpers ---------- */
  const cropHTML = (key, alt = '', eager = false) => {
    const c = CROPS[key];
    if (!c) return '';
    return `<span class="crop" style="--sw:${c.sw};--sh:${c.sh};--x:${c.x};--y:${c.y};--w:${c.w};--h:${c.h}"><img src="${c.src}" alt="${alt}"${eager ? '' : ' loading="lazy"'} decoding="async"></span>`;
  };
  const ndaHTML = (p, ar = '4 / 5') =>
    `<span class="nda-frame nda-frame--accent" style="--ar:${ar}"><small><span>${p.no}</span><span>${p.tag}</span></small><strong>NDA</strong><small><span>Визуалы — по запросу</span></small></span>`;

  // переключение кадров: старый уходит clip вверх, новый приходит снизу
  function swapFrames(frames, next, prev) {
    if (next === prev) return;
    frames.forEach((f, i) => { if (i !== prev && i !== next) f.classList.remove('is-leaving', 'is-active'); });
    if (prev > -1 && frames[prev]) {
      frames[prev].classList.remove('is-active');
      frames[prev].classList.add('is-leaving');
    }
    const f = frames[next];
    if (!f) return;
    f.style.transition = 'none';
    f.classList.remove('is-leaving', 'is-active');
    void f.offsetWidth;
    f.style.transition = '';
    f.classList.add('is-active');
  }

  /* ---------- Data-driven rendering ---------- */
  function renderCounts() {
    const n = pad(PROJECTS.length);
    $$('#projectCount, #ixCount').forEach(el => { el.textContent = n; });
  }

  function renderIndex() {
    const list = $('#ixList');
    if (!list) return;
    list.innerHTML = PROJECTS.map((p, i) => `
      <li><a class="ix-row grid-12" href="${p.file}" data-i="${i}" data-cursor="view">
        <span class="ix-thumb ${p.preview ? 'fit' : 'ix-thumb--nda'}" aria-hidden="true">${p.preview ? cropHTML(p.preview) : 'NDA'}</span>
        <span class="ix-no">${p.no}</span>
        <span class="ix-title">${p.short}</span>
        <span class="ix-sub">${p.tag} — ${p.year}${p.status === 'nda' ? ' — NDA' : ''}</span>
        <span class="ix-cat">${p.tag}</span>
        <span class="ix-year">${p.year}</span>
        <span class="ix-status${p.status === 'nda' ? ' ix-status--nda' : ''}">${p.status === 'nda' ? 'NDA' : 'Case'}</span>
        <span class="ix-arrow" aria-hidden="true">↗</span>
      </a></li>`).join('');

    const pv = $('#ixPreview');
    if (pv && FINE) {
      // превью грузятся сразу (preload), чтобы hover был мгновенным
      pv.innerHTML = PROJECTS.map((p, i) => p.preview
        ? `<span class="frame" data-i="${i}">${cropHTML(p.preview, '', true)}<span class="pv-label">${p.no} — ${p.tag}</span></span>`
        : `<span class="frame frame--nda" data-i="${i}"><small>${p.no} — ${p.tag}</small><strong>NDA</strong><small>Визуалы — по запросу</small></span>`
      ).join('');
    }
  }

  function renderCase() {
    const id = body.dataset.project;
    if (!id) return;
    const i = PROJECTS.findIndex(p => p.id === id);
    if (i < 0) return;
    const p = PROJECTS[i];
    const total = pad(PROJECTS.length);

    const head = $('[data-case-head]');
    if (head) {
      head.innerHTML = `
        <div class="ch-top"><a href="index.html#index">← Index</a><span>Case ${p.no} / ${total}</span><span>${p.tag}</span></div>
        <p class="ch-no" data-reveal="text"><span class="lm"><span class="li">${p.no}</span></span></p>
        <h1 class="ch-title" data-reveal="text"><span class="lm"><span class="li">${p.title}</span></span></h1>
        <dl class="ch-meta">
          <div><dt>Client</dt><dd>${p.client}</dd></div>
          <div><dt>Role</dt><dd>${p.role}</dd></div>
          ${p.tools.length ? `<div><dt>Tools</dt><dd>${p.tools.join(', ')}</dd></div>` : ''}
          ${p.year && p.year !== '—' ? `<div><dt>Year</dt><dd>${p.year}</dd></div>` : ''}
        </dl>
        <p class="ch-lead" data-reveal="fade">${p.statement}</p>`;
    }

    const next = $('[data-case-next]');
    if (next) {
      const n = PROJECTS[(i + 1) % PROJECTS.length];
      next.innerHTML = `
        <a href="${n.file}" data-cursor="view">
          <div class="site-shell">
            <div class="nx-top grid-12"><span>Next project</span><span>${n.no} / ${total}</span></div>
            <div class="nx-body grid-12">
              <div class="nx-media">${n.cover ? cropHTML(n.cover) : ndaHTML(n, '16 / 10')}</div>
              <div class="nx-text">
                <p class="nx-cat">Следующий кейс — ${n.no}</p>
                <h2 class="nx-title"><span>${n.short}</span><b>↗</b></h2>
                <p class="nx-cat">${n.category} — ${n.year}</p>
              </div>
            </div>
          </div>
        </a>`;
    }
  }

  /* ---------- Curtain: loader + page transitions ---------- */
  function initCurtain() {
    const cu = $('#curtain');
    const ready = () => {
      if (html.classList.contains('is-ready')) return;
      html.classList.add('is-ready');
      dispatchEvent(new Event('sekret:ready'));
    };
    if (!cu) { ready(); return; }
    const label = $('#cuLabel'), title = $('#cuTitle'), count = $('#cuCount');

    let incoming = null, visited = false;
    try {
      incoming = JSON.parse(sessionStorage.getItem('sekret:curtain') || 'null');
      sessionStorage.removeItem('sekret:curtain');
      visited = sessionStorage.getItem('sekret:visited') === '1';
      sessionStorage.setItem('sekret:visited', '1');
    } catch (_) { /* storage недоступен — просто показываем страницу */ }

    const fill = d => {
      label.textContent = d.label; title.textContent = d.title; count.textContent = d.count || '';
      cu.classList.toggle('curtain--accent', !!d.accent);
    };
    const lift = (delay = 0) => setTimeout(() => {
      cu.classList.add('is-lift');
      ready();
      setTimeout(() => { cu.classList.add('is-gone'); cu.classList.remove('is-lift'); }, 820);
    }, delay);

    if (RM || STATIC) {
      cu.classList.add('is-gone'); ready();
    } else if (incoming) {
      fill(incoming); lift(160);
    } else if (!visited && body.classList.contains('page-home')) {
      // первый вход: счётчик загрузки привязан к картинкам hero + шрифтам
      const imgs = $$('.hero img');
      let done = 0, fontsOk = false, shown = 0;
      const t0 = performance.now();
      imgs.forEach(im => {
        if (im.complete) done++;
        else ['load', 'error'].forEach(ev => im.addEventListener(ev, () => done++, { once: true }));
      });
      (D.fonts ? D.fonts.ready : Promise.resolve()).then(() => { fontsOk = true; });
      const step = () => {
        const el = performance.now() - t0;
        const target = (imgs.length ? done / imgs.length : 1) * 80 + (fontsOk ? 20 : 0);
        shown = lerp(shown, Math.min(target, el / 8), 0.18);
        count.textContent = String(Math.round(shown)).padStart(3, '0');
        if (shown > 99 || el > 2400) { count.textContent = '100'; lift(140); }
        else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    } else {
      cu.classList.add('is-gone'); ready();
    }

    addEventListener('pageshow', e => {
      if (e.persisted) { cu.classList.remove('is-cover', 'is-below'); cu.classList.add('is-gone'); ready(); }
    });

    // уход со страницы
    D.addEventListener('click', e => {
      const a = e.target.closest('a[href]');
      if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (a.target === '_blank' || a.hasAttribute('download')) return;
      const href = a.getAttribute('href');
      if (!href || href === '#' || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      const url = new URL(a.href, location.href);
      if (url.protocol !== location.protocol || url.host !== location.host) return;

      const samePage = url.pathname === location.pathname || (url.pathname.endsWith('/index.html') && /\/$/.test(location.pathname));
      if (samePage) {
        if (!url.hash) return;
        const target = D.getElementById(url.hash.slice(1));
        if (!target) return;
        e.preventDefault();
        closeMenu();
        const top = url.hash === '#top' ? 0 : target.getBoundingClientRect().top + scrollY;
        scrollTo({ top, behavior: RM ? 'auto' : 'smooth' });
        history.replaceState(null, '', url.hash);
        return;
      }
      if (RM) return;

      e.preventDefault();
      const file = url.pathname.split('/').pop() || 'index.html';
      const p = PROJECTS.find(x => x.file === file);
      const data = p
        ? { label: `Project ${p.no} / ${pad(PROJECTS.length)}`, title: p.short, count: p.tag, accent: true }
        : { label: 'SEKRET®', title: 'Index', count: 'Graphic systems', accent: false };
      try { sessionStorage.setItem('sekret:curtain', JSON.stringify(data)); } catch (_) {}
      fill(data);
      cu.classList.remove('is-gone', 'is-lift', 'is-cover');
      cu.classList.add('is-below');
      void cu.offsetWidth;
      cu.classList.add('is-cover');
      setTimeout(() => { location.href = url.href; }, 580);
    });
  }

  /* ---------- Header: theme under header, hide on scroll, section label, progress ---------- */
  function initHeader() {
    const hdr = $('#hdr');
    if (!hdr) return;
    const sections = $$('[data-theme]').filter(el => !hdr.contains(el));
    const label = $('#hdrSection');
    const progress = $('#progress');
    const navLinks = $$('.hdr-nav a');
    let curLabel = label ? label.textContent : '';
    let docH = html.scrollHeight;
    resizeSubs.add(() => { docH = html.scrollHeight; });
    addEventListener('load', () => { docH = html.scrollHeight; });

    ticks.add((t, scrolled) => {
      if (!scrolled) return;
      const y = view.y, dy = y - view.lastY;
      if (!html.classList.contains('menu-open')) {
        if (dy > 6 && y > view.h * 0.5) hdr.classList.add('is-hidden');
        else if (dy < -6 || y < 60) hdr.classList.remove('is-hidden');
      }
      let theme = 'light', lab = '', id = '';
      const probe = 30, mid = view.h * 0.42;
      for (const s of sections) {
        const r = s.getBoundingClientRect();
        if (r.top <= probe && r.bottom > probe) theme = s.dataset.theme;
        if (r.top <= mid && r.bottom > mid && s.dataset.label) { lab = s.dataset.label; id = s.id; }
      }
      if (hdr.dataset.on !== theme) hdr.dataset.on = theme;
      if (label && lab && lab !== curLabel) {
        curLabel = lab;
        label.classList.add('is-swap');
        label.textContent = lab;
        void label.offsetWidth;
        label.classList.remove('is-swap');
      }
      navLinks.forEach(a => a.classList.toggle('is-current', !!id && a.hash === '#' + id));
      if (progress) progress.style.transform = `scaleX(${clamp(y / Math.max(1, docH - view.h), 0, 1).toFixed(4)})`;
    });

    const clock = $('#clock');
    if (clock) {
      const f = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Moscow' });
      const u = () => { clock.textContent = f.format(new Date()); };
      u(); setInterval(u, 20000);
    }
  }

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menuBtn');
  const menu = $('#menu');
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.hidden = true;
    html.classList.remove('menu-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    menuBtn.textContent = 'Menu';
  }
  function initMenu() {
    if (!menuBtn || !menu) return;
    menuBtn.addEventListener('click', () => {
      const open = menu.hidden;
      menu.hidden = !open;
      html.classList.toggle('menu-open', open);
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.textContent = open ? 'Close' : 'Menu';
    });
    addEventListener('keydown', e => { if (e.key === 'Escape') closeMenu(); });
    resizeSubs.add(() => { if (!isMobile()) closeMenu(); });
  }

  /* ---------- Reveal system ---------- */
  function initReveal() {
    const els = $$('[data-reveal]');
    els.forEach(el => {
      if (el.dataset.reveal === 'text') $$('.li', el).forEach((li, i) => li.style.setProperty('--i', i));
    });
    // лёгкий стаггер для соседних fade-элементов
    $$('.approach, .case-story, .about-body').forEach(group => {
      $$(':scope > [data-reveal="fade"]', group).forEach((el, i) => el.style.setProperty('--d', i * 90));
    });
    if (RM || STATIC || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-in'));
      return;
    }
    // media скрыт собственным clip-path, а Chrome учитывает его в IntersectionObserver —
    // поэтому для media наблюдаем родителя, а класс ставим самому элементу
    const map = new Map();
    els.forEach(el => {
      const watch = el.dataset.reveal === 'media' ? el.parentElement : el;
      if (!map.has(watch)) map.set(watch, []);
      map.get(watch).push(el);
    });
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        map.get(en.target).forEach(el => el.classList.add('is-in'));
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    map.forEach((_, watch) => io.observe(watch));
  }

  /* ---------- Hero: intro indices + scroll exit ---------- */
  const FLAT_MQ = matchMedia('(max-width: 760px), (max-width: 1100px) and (orientation: portrait)');
  function initHero() {
    const hero = $('.hero');
    if (!hero) return;
    const stage = $('#heroStage');
    const veil = $('.hero-veil', hero);
    const title = $('#heroTitle');
    const wheel = $('#wheel');
    $$('.hero-cols i', hero).forEach((el, i) => el.style.setProperty('--i', i));
    $$('.hero-top > *', hero).forEach((el, i) => el.style.setProperty('--n', i));
    const caseEl = $('.hero-case', hero);
    if (caseEl) caseEl.style.setProperty('--n', 3);
    $$('.hero-foot > *', hero).forEach((el, i) => el.style.setProperty('--n', i + 4));

    let covered = false;
    const reset = () => { [stage, title, wheel].forEach(el => el && (el.style.transform = '')); if (veil) veil.style.opacity = '0'; };
    resizeSubs.add(() => { if (FLAT_MQ.matches) reset(); });

    ticks.add((t, scrolled) => {
      if (!scrolled) return;
      if (FLAT_MQ.matches) { hero.classList.remove('is-covered'); return; }
      const p = clamp(view.y / view.h, 0, 1);
      if ((p >= 1) !== covered) { covered = p >= 1; hero.classList.toggle('is-covered', covered); }
      if (RM || STATIC) return;
      stage.style.transform = `translate3d(0, ${(-p * 7).toFixed(3)}vh, 0) scale(${(1 - p * 0.06).toFixed(4)})`;
      veil.style.opacity = (p * 0.8).toFixed(3);
      if (title) title.style.transform = `translate3d(0, ${(-p * 14).toFixed(3)}vh, 0)`;
      if (wheel) wheel.style.transform = `translate3d(${(p * 7).toFixed(3)}vw, 0, 0) scale(${(1 - p * 0.14).toFixed(4)})`;
    });
  }

  /* ---------- Rotary Case Index: CSS 3D барабан ---------- */
  function initWheel() {
    const wheel = $('#wheel');
    const drum = $('#wheelDrum');
    const stageEl = $('#wheelStage');
    if (!wheel || !drum || !PROJECTS.length) return;
    const N = PROJECTS.length;
    const STEP = 24;                     // градусов между карточками
    const RAD = STEP * Math.PI / 180;

    drum.innerHTML = PROJECTS.map((p, i) => `
      <a class="wc${p.wheel ? '' : ' wc--nda'}" href="${p.file}" data-i="${i}" tabindex="-1" aria-label="${p.no} — ${p.title}">
        ${p.wheel
          ? `<span class="wc-media fit">${cropHTML(p.wheel, '', true)}</span>`
          : `<span class="wc-nda"><small>${p.tag}</small><strong>NDA</strong><small>Визуалы — по запросу</small></span>`}
        <span class="wc-no">${p.no}</span><span class="wc-shade"></span>
      </a>`).join('');
    const cards = $$('.wc', drum);
    drum.addEventListener('dragstart', e => e.preventDefault());
    const shades = cards.map(c => $('.wc-shade', c));
    const btns = $$('.wu-btn', wheel);
    const total = $('#hcTotal');
    if (total) total.textContent = pad(N);

    const swaps = {};
    $$('.hc-swap', $('#heroCase') || D).forEach(el => { swaps[el.dataset.swap] = el; });
    const link = $('#hcLink');
    const prog = $('#hcProgress');
    const prefetched = new Set();

    const isFlat = () => FLAT_MQ.matches || RM;
    let flat = isFlat();
    let pos = 0, target = 0;            // intro: барабан докатывается до первого кейса (см. старт)
    let active = -1, R = 0, dirty = true, lastT = 0, textTimer = 0;
    let px = 0, py = 0;

    const measure = () => {
      const h = cards[0].offsetWidth / 1.5;
      R = (h + 18) / (2 * Math.sin(RAD / 2));
      dirty = true;
    };

    function swapText(el, text) {
      if (!el) return;
      const old = $('.sw:not(.is-out)', el);
      if (old && old.textContent === text) return;
      const next = D.createElement('span');
      next.className = 'sw is-enter';
      next.textContent = text;
      el.appendChild(next);
      $$('.sw.is-out', el).forEach(x => x.remove());
      if (old) {
        old.classList.add('is-out');
        setTimeout(() => old.remove(), 750);
      }
      void next.offsetWidth;
      next.classList.remove('is-enter');
    }

    function setActive(i, instant) {
      if (i === active) return;
      active = i;
      const p = PROJECTS[i];
      const meta = `${p.tag}${p.year && p.year !== '—' ? ' — ' + p.year : ''}`;
      if (instant) {
        [['no', p.no], ['title', p.title], ['cat', meta], ['text', p.statement]].forEach(([k, v]) => {
          if (swaps[k]) swaps[k].innerHTML = `<span class="sw">${v}</span>`;
        });
      } else {
        // текст меняется, когда барабан почти остановился на кейсе — без каши при быстром вращении
        clearTimeout(textTimer);
        textTimer = setTimeout(() => {
          const q = PROJECTS[active];
          const m = `${q.tag}${q.year && q.year !== '—' ? ' — ' + q.year : ''}`;
          swapText(swaps.no, q.no);
          swapText(swaps.title, q.title);
          swapText(swaps.cat, m);
          swapText(swaps.text, q.statement);
        }, 160);
      }
      if (link) link.href = p.file;
      if (prog) prog.parentElement.style.setProperty('--p', ((i + 1) / N).toFixed(3));
      cards.forEach((c, k) => {
        const on = k === i;
        c.classList.toggle('is-active', on);
        if (on) { c.setAttribute('aria-current', 'true'); c.dataset.cursor = 'open'; }
        else { c.removeAttribute('aria-current'); delete c.dataset.cursor; }
      });
      // аккуратный prefetch страницы активного кейса
      const saveData = navigator.connection && navigator.connection.saveData;
      if (!prefetched.has(p.file) && !saveData) {
        prefetched.add(p.file);
        const l = D.createElement('link');
        l.rel = 'prefetch'; l.href = p.file;
        D.head.appendChild(l);
      }
    }

    const wrap = i => ((i % N) + N) % N;
    const go = i => {
      if (flat) {
        i = clamp(i, 0, N - 1);
        const c = cards[i];
        drum.scrollTo({ left: c.offsetLeft - (drum.clientWidth - c.offsetWidth) / 2, behavior: RM ? 'auto' : 'smooth' });
      } else {
        // кратчайший путь по кругу
        let d = wrap(i) - wrap(Math.round(target));
        if (d > N / 2) d -= N;
        if (d < -N / 2) d += N;
        target = Math.round(target) + d;
      }
    };

    function applyMode() {
      flat = isFlat();
      wheel.classList.toggle('wheel--flat', flat);
      if (flat) {
        cards.forEach((c, k) => { c.style.transform = ''; c.style.opacity = ''; c.style.zIndex = ''; c.style.visibility = ''; shades[k].style.opacity = ''; });
        drum.style.transform = '';
        pos = target = Math.max(0, active);
      } else {
        measure();
        pos = target = Math.max(0, active);
      }
      dirty = true;
    }

    // --- рендер 3D ---
    ticks.add(t => {
      if (flat) return;
      const dt = lastT ? Math.min(64, t - lastT) : 16.7;
      lastT = t;
      // damping: тяжёлое, без рывков
      const k = 1 - Math.pow(1 - 0.085, dt / 16.7);
      const moving = Math.abs(target - pos) > 0.0005;
      if (moving) pos += (target - pos) * k;
      else if (pos !== target) pos = target;

      // очень слабый параллакс за курсором (±4px / ±3px)
      if (FINE && !RM && pointer.active) {
        const nx = lerp(px, pointer.nx * 4, 0.06), ny = lerp(py, pointer.ny * 3, 0.06);
        if (Math.abs(nx - px) > 0.01 || Math.abs(ny - py) > 0.01) {
          px = nx; py = ny;
          drum.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0)`;
        }
      }
      if (!moving && !dirty) return;
      dirty = false;

      for (let i = 0; i < N; i++) {
        let d = wrap(i - pos);
        if (d > N / 2) d -= N;
        const ad = Math.abs(d);
        const c = cards[i];
        if (ad > 3.4) { if (c.style.visibility !== 'hidden') c.style.visibility = 'hidden'; continue; }
        c.style.visibility = '';
        c.style.transform = `translateZ(${(-R).toFixed(1)}px) rotateX(${(-d * STEP).toFixed(3)}deg) translateZ(${R.toFixed(1)}px)`;
        c.style.opacity = clamp(1.25 - ad * 0.42, 0, 1).toFixed(3);
        c.style.zIndex = String(100 - Math.round(ad * 10));
        shades[i].style.opacity = Math.min(0.62, ad * 0.3).toFixed(3);
      }
      const near = wrap(Math.round(pos));
      setActive(near, false);
    });

    // --- flat: активный кейс по положению скролла ленты ---
    let flatRaf = 0;
    drum.addEventListener('scroll', () => {
      if (!flat) return;
      cancelAnimationFrame(flatRaf);
      flatRaf = requestAnimationFrame(() => {
        const mid = drum.scrollLeft + drum.clientWidth / 2;
        let best = 0, bd = Infinity;
        cards.forEach((c, k) => { const dd = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (dd < bd) { bd = dd; best = k; } });
        setActive(best, false);
      });
    }, { passive: true });

    // --- drag (вертикальный) ---
    let dragging = false, sy = 0, sPos = 0, lastY = 0, lastTT = 0, vel = 0, moved = 0, suppressClick = false;
    wheel.addEventListener('pointerdown', e => {
      if (flat || e.button !== 0 || e.target.closest('.wu-btn')) return;
      dragging = true; moved = 0; vel = 0; suppressClick = false;
      sy = lastY = e.clientY; sPos = pos; lastTT = performance.now();
    });
    addEventListener('pointermove', e => {
      if (!dragging) return;
      const dy = e.clientY - sy;
      moved = Math.max(moved, Math.abs(dy));
      if (moved > 5 && !wheel.hasPointerCapture(e.pointerId)) { try { wheel.setPointerCapture(e.pointerId); } catch (_) {} wheel.classList.add('is-dragging'); }
      const h = cards[0].offsetWidth / 1.5;
      target = sPos - dy / (h * 1.05);
      const now = performance.now();
      vel = lerp(vel, (e.clientY - lastY) / Math.max(1, now - lastTT), 0.4);
      lastY = e.clientY; lastTT = now;
    }, { passive: true });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      wheel.classList.remove('is-dragging');
      if (moved > 5) {
        suppressClick = true;
        const h = cards[0].offsetWidth / 1.5;
        target = Math.round(target - vel * 160 / h);
      }
    };
    addEventListener('pointerup', endDrag);
    addEventListener('pointercancel', endDrag);

    // --- клики: соседняя карточка — повернуть, активная — открыть кейс ---
    drum.addEventListener('click', e => {
      const c = e.target.closest('.wc');
      if (!c) return;
      if (suppressClick) { e.preventDefault(); suppressClick = false; return; }
      const i = Number(c.dataset.i);
      if (i !== active) { e.preventDefault(); go(i); }
    });
    const cur = () => flat ? active : Math.round(target);
    btns.forEach(b => b.addEventListener('click', () => go(cur() + Number(b.dataset.step))));

    // --- колесо: вращает барабан, на первом/последнем кейсе отпускает страницу ---
    let acc = 0, lastStep = 0;
    wheel.addEventListener('wheel', e => {
      if (flat) return;
      const dyw = e.deltaY * (e.deltaMode === 1 ? 32 : 1);
      if (Math.abs(dyw) < Math.abs(e.deltaX)) return;
      const dir = Math.sign(dyw);
      const cur = wrap(Math.round(target));
      if (!dir || (dir < 0 && cur === 0) || (dir > 0 && cur === N - 1) || view.y > view.h * 0.25) { acc = 0; return; }
      e.preventDefault();
      acc += dyw;
      const now = performance.now();
      if (Math.abs(acc) >= 80 && now - lastStep > 260) {
        target = Math.round(target) + dir;
        acc = 0; lastStep = now;
      }
    }, { passive: false });

    // --- клавиатура ---
    wheel.addEventListener('keydown', e => {
      if (['ArrowDown', 'ArrowRight'].includes(e.key)) { e.preventDefault(); go(cur() + 1); }
      else if (['ArrowUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); go(cur() - 1); }
      else if (e.key === 'Enter' && e.target === wheel) { cards[active].click(); }
    });

    // старт
    setActive(0, true);
    applyMode();
    if (!flat && !STATIC) { pos = target = -1.6; dirty = true; }
    const roll = () => { if (!flat) target = 0; };
    if (html.classList.contains('is-ready')) roll();
    else addEventListener('sekret:ready', roll, { once: true });
    resizeSubs.add(() => { if (isFlat() !== flat) applyMode(); else if (!flat) measure(); });
  }

  /* ---------- Contact: Times-слово слегка реагирует на близость курсора ---------- */
  function initContactProximity() {
    const word = $('.ctl--2 .lm--serif');
    const sec = $('#contact');
    if (!word || !sec || !FINE || RM) return;
    let x = 0, y = 0;
    ticks.add(() => {
      const r = sec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > view.h) return;
      const wr = word.getBoundingClientRect();
      const cx = wr.left + wr.width / 2, cy = wr.top + wr.height / 2;
      const dx = pointer.x - cx, dy = pointer.y - cy;
      const f = clamp(1 - Math.hypot(dx, dy) / 700, 0, 1);
      const tx = clamp(dx / 60, -6, 6) * f, ty = clamp(dy / 80, -3, 3) * f;
      const nx = lerp(x, tx, 0.08), ny = lerp(y, ty, 0.08);
      if (Math.abs(nx - x) < 0.01 && Math.abs(ny - y) < 0.01) return;
      x = nx; y = ny;
      word.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
    });
  }

  /* ---------- Custom cursor ---------- */
  function initCursor() {
    if (!FINE) return;
    html.classList.add('has-cursor');
    const c = D.createElement('div');
    c.className = 'cursor is-out';
    c.innerHTML = '<span class="cursor-cross"></span>';
    const l = D.createElement('div');
    l.className = 'cursor-label is-out';
    l.innerHTML = '<span class="cl-in"></span>';
    body.append(c, l);
    const lin = $('.cl-in', l);
    const LABELS = { view: 'View ↗', drag: 'Drag ↔', dragv: 'Drag ↕', write: 'Write ↗', open: 'Open ↗' };
    let x = pointer.x, y = pointer.y, lx = x, ly = y;

    ticks.add(() => {
      if (!pointer.active) return;
      x = RM ? pointer.x : lerp(x, pointer.x, 0.55);
      y = RM ? pointer.y : lerp(y, pointer.y, 0.55);
      lx = RM ? pointer.x : lerp(lx, pointer.x, 0.22);
      ly = RM ? pointer.y : lerp(ly, pointer.y, 0.22);
      c.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      l.style.transform = `translate3d(${lx.toFixed(1)}px, ${ly.toFixed(1)}px, 0)`;
    });

    D.addEventListener('pointerover', e => {
      if (e.pointerType !== 'mouse') return;
      c.classList.remove('is-out'); l.classList.remove('is-out');
      const el = e.target.closest('[data-cursor]');
      const link = e.target.closest('a, button, [tabindex]');
      if (el) {
        lin.textContent = LABELS[el.dataset.cursor] || el.dataset.cursor;
        l.classList.add('is-on');
        l.classList.toggle('on-accent', !!el.closest('[data-theme="accent"]'));
        c.classList.add('is-label');
      } else {
        l.classList.remove('is-on');
        c.classList.remove('is-label');
      }
      c.classList.toggle('is-link', !!link && !el);
    });
    html.addEventListener('mouseleave', () => { c.classList.add('is-out'); l.classList.add('is-out'); });
  }

  /* ---------- Project Index: floating preview ---------- */
  function initIndexPreview() {
    const list = $('#ixList');
    const pv = $('#ixPreview');
    if (!list || !pv || !FINE) return;
    const frames = $$('.frame', pv);
    let cur = -1, on = false, x = pointer.x, y = pointer.y, h = 0;

    list.addEventListener('pointerover', e => {
      const row = e.target.closest('.ix-row');
      if (!row || e.pointerType !== 'mouse') return;
      const i = Number(row.dataset.i);
      $$('.ix-row', list).forEach(r => r.classList.toggle('is-hover', r === row));
      list.classList.add('is-hovering');
      if (!on) { x = pointer.x + 56; y = pointer.y - 28; }
      on = true;
      pv.classList.add('is-on');
      if (i !== cur) { swapFrames(frames, i, cur); cur = i; h = frames[i].offsetHeight; }
    });
    list.addEventListener('pointerleave', () => {
      on = false;
      pv.classList.remove('is-on');
      list.classList.remove('is-hovering');
      $$('.ix-row', list).forEach(r => r.classList.remove('is-hover'));
    });
    // клавиатура: фокус строки — подсветка без превью
    list.addEventListener('focusin', e => {
      const row = e.target.closest('.ix-row');
      if (!row) return;
      $$('.ix-row', list).forEach(r => r.classList.toggle('is-hover', r === row));
      list.classList.add('is-hovering');
    });
    list.addEventListener('focusout', () => {
      if (on) return;
      list.classList.remove('is-hovering');
      $$('.ix-row', list).forEach(r => r.classList.remove('is-hover'));
    });

    const w = () => pv.offsetWidth;
    ticks.add(() => {
      if (!on && !pv.classList.contains('is-on')) return;
      // превью — справа от курсора и над ним, чтобы не закрывать активную строку
      let tx = pointer.x + 56;
      let ty = pointer.y - 28;
      if (ty - h < 72) ty = pointer.y + 40 + h;
      tx = Math.min(tx, view.w - w() - 24);
      x = lerp(x, tx, 0.14);
      y = lerp(y, ty, 0.14);
      pv.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }

  /* ---------- Expertise ---------- */
  function initExpertise() {
    const list = $('#xpList');
    if (!list) return;
    const rows = $$('.xp-row', list);
    const frames = $$('#xpPreview .frame');
    const word = $('#xpWord');
    const cap = $('#xpCaption');
    let cur = rows.findIndex(r => r.classList.contains('is-active'));
    if (cur < 0) cur = 0;

    // превью внутри аккордеона для mobile
    rows.forEach((r, i) => {
      const f = frames[i];
      const src = f && (f.classList.contains('crop') ? f : $('.crop', f));
      if (!src) return;
      const t = D.createElement('div');
      t.className = 'xp-thumb';
      const clone = src.cloneNode(true);
      clone.className = 'crop';
      $('img', clone).loading = 'lazy';
      t.appendChild(clone);
      $('.xp-detail-in', r).appendChild(t);
    });

    const syncAria = () => rows.forEach(r => $('.xp-head', r).setAttribute('aria-expanded', String(isMobile() ? r.classList.contains('is-open') : true)));
    syncAria();
    resizeSubs.add(syncAria);

    const activate = i => {
      if (i === cur) return;
      rows[cur].classList.remove('is-active');
      rows[i].classList.add('is-active');
      swapFrames(frames, i, cur);
      if (word) {
        word.classList.add('is-swap');
        word.textContent = rows[i].dataset.word;
        void word.offsetWidth;
        word.classList.remove('is-swap');
      }
      if (cap) cap.textContent = rows[i].dataset.caption;
      cur = i;
    };

    rows.forEach((r, i) => {
      const btn = $('.xp-head', r);
      r.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && !isMobile()) activate(i); });
      btn.addEventListener('focus', () => { if (!isMobile()) activate(i); });
      btn.addEventListener('click', () => {
        if (!isMobile()) { activate(i); return; }
        const open = !r.classList.contains('is-open');
        r.classList.toggle('is-open', open);
        btn.setAttribute('aria-expanded', String(open));
      });
    });
  }

  /* ---------- Visual Lab: drag, inertia, wheel без ловушки ---------- */
  function initLab() {
    const track = $('#labTrack');
    if (!track) return;
    const items = $$('.lab-item', track);
    const now = $('#labNow'), total = $('#labTotal'), bar = $('#labProgress');
    if (total) total.textContent = pad(items.length);

    const max = () => track.scrollWidth - track.clientWidth;
    let target = 0, current = 0, animating = false;
    let dragging = false, sx = 0, sl = 0, lastX = 0, lastT = 0, vel = 0, moved = 0;
    let uiDirty = true;

    const ui = () => {
      const m = max();
      const p = m > 0 ? track.scrollLeft / m : 0;
      if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
      if (now) now.textContent = pad(Math.round(p * (items.length - 1)) + 1);
    };
    track.addEventListener('scroll', () => {
      uiDirty = true;
      // нативный скролл (трекпад, свайп, клавиатура) отменяет нашу анимацию
      if (animating && Math.abs(track.scrollLeft - current) > 3) animating = false;
    }, { passive: true });

    track.addEventListener('pointerdown', e => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      dragging = true; moved = 0; animating = false;
      sx = lastX = e.clientX; sl = track.scrollLeft; lastT = performance.now(); vel = 0;
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      moved = Math.max(moved, Math.abs(dx));
      if (moved > 4) track.classList.add('is-dragging');
      track.scrollLeft = sl - dx;
      const t = performance.now();
      vel = lerp(vel, (e.clientX - lastX) / Math.max(1, t - lastT) * 16, 0.5);
      lastX = e.clientX; lastT = t;
    });
    const end = () => {
      if (!dragging) return;
      dragging = false;
      track.classList.remove('is-dragging');
      current = track.scrollLeft;
      target = clamp(current - vel * 16, 0, max());
      animating = !RM && Math.abs(target - current) > 1;
    };
    track.addEventListener('pointerup', end);
    track.addEventListener('pointercancel', end);
    track.addEventListener('lostpointercapture', end);

    // Вертикальное колесо двигает ленту, только пока лента целиком в кадре
    // и есть куда двигаться. На краях — страница скроллится дальше.
    track.addEventListener('wheel', e => {
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return; // горизонтальный жест трекпада — нативно
      const r = track.getBoundingClientRect();
      if (r.top < -10 || r.bottom > view.h + 10) return;
      const m = max();
      const base = animating ? target : track.scrollLeft;
      const d = e.deltaY * (e.deltaMode === 1 ? 32 : 1);
      if ((d > 0 && base >= m - 1) || (d < 0 && base <= 1)) return;
      e.preventDefault();
      if (!animating) current = track.scrollLeft;
      target = clamp(base + d * 1.1, 0, m);
      animating = !RM;
      if (RM) track.scrollLeft = target;
    }, { passive: false });

    ticks.add(() => {
      if (animating) {
        current = lerp(current, target, 0.12);
        if (Math.abs(target - current) < 0.5) { current = target; animating = false; }
        track.scrollLeft = current;
      }
      if (uiDirty) { ui(); uiDirty = false; }
    });
    resizeSubs.add(() => { uiDirty = true; });
  }

  /* ---------- Contact: copy email ---------- */
  function initCopy() {
    $$('[data-copy]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const text = btn.dataset.copy;
        try { await navigator.clipboard.writeText(text); }
        catch (_) {
          const ta = D.createElement('textarea');
          ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
          body.appendChild(ta); ta.select();
          try { D.execCommand('copy'); } catch (__) {}
          ta.remove();
        }
        btn.textContent = 'Copied ✓';
        btn.classList.add('is-copied');
        clearTimeout(btn._t);
        btn._t = setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('is-copied'); }, 1600);
      });
    });
  }

  /* ---------- Debug grid: Shift + G (или ?grid) ---------- */
  function initGridDebug() {
    let el = null;
    const toggle = force => {
      if (!el) {
        el = D.createElement('div');
        el.className = 'grid-debug';
        el.innerHTML = `<div class="site-shell grid-12">${'<i></i>'.repeat(12)}</div>`;
        body.appendChild(el);
      }
      el.classList.toggle('is-on', force);
    };
    if (/[?&]grid\b/.test(location.search)) toggle(true);
    addEventListener('keydown', e => {
      if (e.shiftKey && e.code === 'KeyG' && !e.target.closest('input, textarea')) toggle();
    });
  }

  /* ---------- Boot ---------- */
  renderCounts();
  renderIndex();
  renderCase();
  initCurtain();
  initHeader();
  initMenu();
  initReveal();
  initHero();
  initWheel();
  initContactProximity();
  initCursor();
  initIndexPreview();
  initExpertise();
  initLab();
  initCopy();
  initGridDebug();
  requestAnimationFrame(frame);
})();
