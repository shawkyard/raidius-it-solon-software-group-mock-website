/* Solen Software Group — shared site behaviour
   Nav, live office clocks, scroll reveal, counters, filters, forms, map. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sticky nav shadow ---------- */
  var nav = document.querySelector('.nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- mobile nav ---------- */
  var mnav = document.getElementById('mnav');
  var openBtn = document.getElementById('navToggle');
  var closeBtn = document.getElementById('mnavClose');
  function closeM() { if (mnav) { mnav.classList.remove('open'); document.body.style.overflow = ''; } }
  if (openBtn && mnav) {
    openBtn.addEventListener('click', function () {
      mnav.classList.add('open'); document.body.style.overflow = 'hidden';
    });
  }
  if (closeBtn) closeBtn.addEventListener('click', closeM);
  if (mnav) mnav.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeM); });

  /* ---------- mega menu ---------- */
  var megaTrigger = document.getElementById('megaTrigger');
  var mega = document.getElementById('mega');
  if (megaTrigger && mega) {
    var megaOpen = false, hideTimer = null;
    function showMega() { clearTimeout(hideTimer); mega.classList.add('open'); megaTrigger.setAttribute('aria-expanded', 'true'); megaOpen = true; }
    function hideMega() { mega.classList.remove('open'); megaTrigger.setAttribute('aria-expanded', 'false'); megaOpen = false; }
    function hideSoon() { hideTimer = setTimeout(hideMega, 160); }
    megaTrigger.addEventListener('mouseenter', showMega);
    megaTrigger.addEventListener('mouseleave', hideSoon);
    megaTrigger.addEventListener('click', function (e) { e.preventDefault(); megaOpen ? hideMega() : showMega(); });
    megaTrigger.addEventListener('focus', showMega);
    mega.addEventListener('mouseenter', function () { clearTimeout(hideTimer); });
    mega.addEventListener('mouseleave', hideSoon);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { hideMega(); closeM(); } });
    // vertical hover switching
    var verts = mega.querySelectorAll('.mega-vert');
    var panels = mega.querySelectorAll('[data-vert-panel]');
    verts.forEach(function (v) {
      v.addEventListener('mouseenter', function () { activate(v.dataset.vert); });
      v.addEventListener('focus', function () { activate(v.dataset.vert); });
      v.addEventListener('click', function () { activate(v.dataset.vert); });
    });
    function activate(key) {
      verts.forEach(function (v) { v.classList.toggle('on', v.dataset.vert === key); });
      panels.forEach(function (p) { p.style.display = p.dataset.vertPanel === key ? 'grid' : 'none'; });
    }
  }

  /* ---------- live office clocks ---------- */
  function renderClocks() {
    document.querySelectorAll('[data-tz]').forEach(function (el) {
      var tz = el.dataset.tz;
      try {
        el.textContent = new Intl.DateTimeFormat('en-GB', {
          timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false
        }).format(new Date());
      } catch (e) { el.textContent = '--:--'; }
    });
  }
  renderClocks();
  setInterval(renderClocks, 30000);

  /* ---------- scroll reveal ---------- */
  var risers = document.querySelectorAll('.rise');
  if (risers.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      risers.forEach(function (r) { r.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          var sibs = Array.prototype.slice.call(en.target.parentElement.querySelectorAll('.rise'));
          var idx = Math.max(0, sibs.indexOf(en.target));
          setTimeout(function () { en.target.classList.add('in'); }, Math.min(idx, 6) * 60);
          io.unobserve(en.target);
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      risers.forEach(function (r) { io.observe(r); });
    }
  }

  /* ---------- animated counters ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    var animate = function (el) {
      var target = parseFloat(el.dataset.count);
      var suffix = el.dataset.suffix || '';
      var prefix = el.dataset.prefix || '';
      if (reduced) { el.textContent = prefix + target + suffix; return; }
      var start = performance.now(), dur = 1100;
      function tick(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(tick);
        else el.textContent = prefix + target + suffix;
      }
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) {
      counters.forEach(animate);
    } else {
      var cio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { animate(en.target); cio.unobserve(en.target); }
        });
      }, { threshold: 0.4 });
      counters.forEach(function (c) { cio.observe(c); });
    }
  }

  /* ---------- 99-square grid fill ---------- */
  var g99 = document.getElementById('grid99');
  if (g99) {
    var squares = g99.querySelectorAll('.sq');
    var fill = function () {
      if (reduced) { squares.forEach(function (s) { s.classList.add('fill'); }); return; }
      squares.forEach(function (s, i) { setTimeout(function () { s.classList.add('fill'); }, i * 13); });
    };
    if (!('IntersectionObserver' in window)) fill();
    else {
      var gio = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { fill(); gio.disconnect(); }
      }, { threshold: 0.25 });
      gio.observe(g99);
    }
  }

  /* ---------- portfolio filter + view toggle ---------- */
  var filterBar = document.getElementById('filters');
  if (filterBar) {
    var cards = document.querySelectorAll('[data-vertical]');
    var countEl = document.getElementById('shownCount');
    filterBar.addEventListener('click', function (e) {
      var b = e.target.closest('.filt'); if (!b) return;
      filterBar.querySelectorAll('.filt').forEach(function (f) { f.classList.remove('on'); });
      b.classList.add('on');
      var v = b.dataset.filter, shown = 0;
      cards.forEach(function (c) {
        var match = (v === 'all' || c.dataset.vertical === v);
        c.style.display = match ? '' : 'none';
        if (match) shown++;
      });
      if (countEl) countEl.textContent = shown;
    });
  }

  var vt = document.getElementById('viewToggle');
  if (vt) {
    vt.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      vt.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); });
      b.classList.add('on');
      var mode = b.dataset.view;
      var gridV = document.getElementById('gridView');
      var tableV = document.getElementById('tableView');
      if (gridV) gridV.style.display = mode === 'grid' ? '' : 'none';
      if (tableV) tableV.style.display = mode === 'table' ? '' : 'none';
    });
  }

  /* ---------- sortable table ---------- */
  document.querySelectorAll('table[data-sortable]').forEach(function (tbl) {
    var dir = {};
    tbl.querySelectorAll('th.sortable').forEach(function (th, i) {
      th.addEventListener('click', function () {
        var body = tbl.tBodies[0];
        var rows = Array.prototype.slice.call(body.rows);
        dir[i] = !dir[i];
        rows.sort(function (a, b) {
          var x = (a.cells[i].dataset.sort || a.cells[i].textContent).trim();
          var y = (b.cells[i].dataset.sort || b.cells[i].textContent).trim();
          var nx = parseFloat(x), ny = parseFloat(y);
          var r = (!isNaN(nx) && !isNaN(ny)) ? nx - ny : x.localeCompare(y);
          return dir[i] ? r : -r;
        });
        rows.forEach(function (r) { body.appendChild(r); });
        tbl.querySelectorAll('th .ind').forEach(function (s) { s.textContent = ''; });
        var ind = th.querySelector('.ind'); if (ind) ind.textContent = dir[i] ? '↑' : '↓';
      });
    });
  });

  /* ---------- map tooltips ---------- */
  var map = document.getElementById('map');
  if (map) {
    var tip = document.getElementById('mapTip');
    map.querySelectorAll('.mdot').forEach(function (d) {
      d.addEventListener('mouseenter', function (e) {
        if (!tip) return;
        tip.textContent = d.dataset.label;
        tip.classList.add('on');
        var r = map.getBoundingClientRect(), dr = d.getBoundingClientRect();
        tip.style.left = (dr.left - r.left + dr.width / 2 - tip.offsetWidth / 2) + 'px';
        tip.style.top = (dr.top - r.top - tip.offsetHeight - 9) + 'px';
      });
      d.addEventListener('mouseleave', function () { if (tip) tip.classList.remove('on'); });
    });
  }

  /* ---------- forms ---------- */
  document.querySelectorAll('form[data-validated]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      form.querySelectorAll('[required]').forEach(function (f) {
        var bad = !f.value.trim() || (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.value));
        f.classList.toggle('err', bad);
        var m = f.parentElement.querySelector('.errmsg');
        if (m) m.classList.toggle('show', bad);
        if (bad && ok) { f.focus(); ok = false; }
        if (bad) ok = false;
      });
      if (!ok) return;

      var btn = form.querySelector('button[type=submit]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      // No endpoint configured in this build: persist locally so the flow is
      // demonstrable end to end. See INTEGRATIONS.md.
      var payload = {};
      new FormData(form).forEach(function (v, k) { payload[k] = v; });
      payload._submittedAt = new Date().toISOString();
      payload._form = form.dataset.validated;
      try {
        var store = JSON.parse(localStorage.getItem('solen_submissions') || '[]');
        store.push(payload);
        localStorage.setItem('solen_submissions', JSON.stringify(store));
      } catch (err) { /* storage unavailable — still show confirmation */ }

      setTimeout(function () {
        form.style.display = 'none';
        var ok2 = form.parentElement.querySelector('.form-ok');
        if (ok2) { ok2.classList.add('show'); ok2.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' }); }
        if (btn) { btn.disabled = false; btn.textContent = label; }
      }, 550);
    });
  });

  /* ---------- current year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
