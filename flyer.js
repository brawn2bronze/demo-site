/* ============================================================
   flyer.js — Stage 3 Command Center
   Flyer builder + Template Library + PNG/Print + health checks.
   Data: LocalStorage rustic_data_v1 -> data.json -> fallback.
   PNG: html2canvas CDN if online; print CSS covers offline.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'rustic_data_v1'; // must match app.js / admin.js
  var DATA_URL = 'data.json';

  var state = null;
  var toastTimer = null;

  var DEFAULT_FLYER = {
    headline: 'Taco Tuesday',
    sub: '3 street tacos + drink',
    priceLabel: '$9.99',
    dateLabel: 'Tuesdays • 5–8pm',
    theme: 'chalk',
    layout: 'poster',
    image: '',
    imageAlt: '',
    kicker: 'Every Week',
    badge: '',
    finePrint: 'Dine-in & takeout. While it lasts.',
    cta: '',
    showLogo: true,
    showContact: true,
    showPhoto: true,
    font: 'system',
    customColors: false,
    accent: '',
    align: 'center',
    photoShape: 'rounded',
    frame: 'none',
    bgStart: '', bgEnd: '', bgInk: '',
    pattern: 'none', patternOpacity: 18,
    frameStyle: 'none', frameWidth: 6, frameColor: '', frameRadius: 10,
    fontHeadSize: 0, fontHeadColor: '', fontSubSize: 0, fontSubColor: '',
    fontPriceSize: 0, fontPriceColor: '',
    showOnWebsite: false, days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    start: '11:00', end: '21:00'
  };

  /* Canonical per-theme defaults so presets look distinct even with customize OFF */
  var THEME_DEFAULTS = {
    'chalk': { bgStart: '', bgEnd: '', bgInk: '', accent: '#f6b93b' },
    'smoke': { bgStart: '', bgEnd: '', bgInk: '', accent: '#f6b93b' },
    'kraft': { bgStart: '', bgEnd: '', bgInk: '', accent: '#2a1c0d' },
    'cream': { bgStart: '', bgEnd: '', bgInk: '', accent: '#b34a1f' },
    'poster': { bgStart: '', bgEnd: '', bgInk: '', accent: '#1a120b' },
    'bbq-red': { bgStart: '', bgEnd: '', bgInk: '', accent: '#ffd277' },
    'midnight-neon': { bgStart: '', bgEnd: '', bgInk: '', accent: '#a5b4fc' },
    'citrus-punch': { bgStart: '', bgEnd: '', bgInk: '', accent: '#7c2d12' },
    'forest': { bgStart: '', bgEnd: '', bgInk: '', accent: '#86efac' },
    'ocean': { bgStart: '', bgEnd: '', bgInk: '', accent: '#7dd3fc' }
  };

  /* ---------- Load ---------- */
  async function loadData() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        return withFlyerDefaults(parsed);
      }
    } catch (e) { /* ignore */ }
    var res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load data.json (' + res.status + ')');
    return withFlyerDefaults(await res.json());
  }

  function hasCustomColors(f) {
    return !!(f && (f.bgStart || f.bgEnd || f.bgInk || f.accent || f.frameColor || f.fontHeadColor || f.fontSubColor || f.fontPriceColor));
  }
  function cleanLegacyChalkDefaults(f) {
    // Legacy bug: untouched color swatches saved chalk-dark values even for BBQ-red etc.
    // If colors exactly equal the old input defaults and theme isn't chalk, treat as theme (clear).
    var isDefaultDark = (f.bgStart === '#2e2e2e' || f.bgStart === '#2E2E2E') && (f.bgEnd === '#1a1a1a' || f.bgEnd === '#1A1A1A');
    var isDefaultInk = !f.bgInk || f.bgInk === '#faf5ec' || f.bgInk === '#FAF5EC';
    if (f.theme && f.theme !== 'chalk' && isDefaultDark && isDefaultInk && !f.customColors) {
      f.bgStart = ''; f.bgEnd = ''; f.bgInk = '';
      if (f.accent === '#f6b93b' || f.accent === '#F6B93B') f.accent = '';
      if (f.frameColor === '#f6b93b' || f.frameColor === '#F6B93B') f.frameColor = '';
      if (f.fontHeadColor === '#f6b93b' || f.fontHeadColor === '#F6B93B') f.fontHeadColor = '';
      if (f.fontSubColor === '#faf5ec' || f.fontSubColor === '#FAF5EC') f.fontSubColor = '';
      if (f.fontPriceColor === '#f6b93b' || f.fontPriceColor === '#F6B93B') f.fontPriceColor = '';
    }
    // Legacy garbage template (green/blue test colors in data.json) -> clear to theme
    if (f.bgStart === '#80ff00' || f.bgStart === '#80FF00') { f.bgStart = ''; f.bgEnd = ''; }
    return f;
  }
  function withFlyerDefaults(d) {
    d = d || {};
    if (!Array.isArray(d.flyerTemplates)) d.flyerTemplates = [];
    d.flyerTemplates = d.flyerTemplates.map(function (t) {
      var m = Object.assign({}, DEFAULT_FLYER, t);
      if (t.frame && (!t.frameStyle || t.frameStyle === 'none')) m.frameStyle = t.frame;
      m.frame = m.frameStyle;
      if (typeof m.customColors !== 'boolean') m.customColors = hasCustomColors(m);
      if (!m.pattern) m.pattern = 'none';
      if (m.patternOpacity == null) m.patternOpacity = 18;
      cleanLegacyChalkDefaults(m);
      if (!m.customColors) { m.bgStart = m.bgStart; } // keep theme (empty) when customize off
      return m;
    });
    d.flyerLastUsed = Object.assign({}, DEFAULT_FLYER, d.flyerLastUsed || {});
    if (d.flyerLastUsed.frame && (!d.flyerLastUsed.frameStyle || d.flyerLastUsed.frameStyle === 'none')) d.flyerLastUsed.frameStyle = d.flyerLastUsed.frame;
    d.flyerLastUsed.frame = d.flyerLastUsed.frameStyle;
    if (typeof d.flyerLastUsed.customColors !== 'boolean') d.flyerLastUsed.customColors = hasCustomColors(d.flyerLastUsed);
    if (!d.flyerLastUsed.pattern) d.flyerLastUsed.pattern = 'none';
    if (d.flyerLastUsed.patternOpacity == null) d.flyerLastUsed.patternOpacity = 18;
    cleanLegacyChalkDefaults(d.flyerLastUsed);
    if (!Array.isArray(d.specials)) d.specials = [];
    // Coerce checkbox booleans (old templates lack them -> default true)
    ['showLogo', 'showContact', 'showPhoto'].forEach(function (k) {
      if (typeof d.flyerLastUsed[k] !== 'boolean') d.flyerLastUsed[k] = true;
      d.flyerTemplates.forEach(function (t) { if (typeof t[k] !== 'boolean') t[k] = true; });
    });
    return d;
  }

  function syncFlyerToSpecials(f, templateId) {
    if (!state) return;
    state.specials = state.specials || [];
    if (!f.showOnWebsite) {
      // Unchecked: remove any linked entry for this template
      if (templateId) state.specials = state.specials.filter(function (s) { return s.flyerId !== templateId; });
      return;
    }
    var title = (f.headline && f.priceLabel) ? f.headline + ' — ' + f.priceLabel : (f.headline || 'Special');
    var flyerStyle = {
      theme: f.theme || 'chalk', font: f.font || 'system', align: f.align || 'center',
      accent: f.customColors ? (f.accent || '') : '',
      bgStart: f.customColors ? (f.bgStart || '') : '', bgEnd: f.customColors ? (f.bgEnd || '') : '', bgInk: f.customColors ? (f.bgInk || '') : '',
      pattern: f.pattern || 'none', patternOpacity: (f.patternOpacity != null ? f.patternOpacity : 18),
      frameStyle: f.frameStyle || f.frame || 'none', frameWidth: f.frameWidth, frameColor: f.customColors ? (f.frameColor || '') : '', frameRadius: f.frameRadius,
      fontHeadSize: f.fontHeadSize || 0, fontHeadColor: f.customColors ? (f.fontHeadColor || '') : '',
      fontSubSize: f.fontSubSize || 0, fontSubColor: f.customColors ? (f.fontSubColor || '') : '',
      fontPriceSize: f.fontPriceSize || 0, fontPriceColor: f.customColors ? (f.fontPriceColor || '') : '',
      kicker: f.kicker || '', badge: f.badge || '', photoShape: f.photoShape || 'rounded'
    };
    var entry = {
      id: 'sp-' + (templateId || 'live'),
      headline: f.headline, title: title, sub: f.sub, text: f.sub,
      priceLabel: f.priceLabel, price: f.priceLabel,
      description: f.sub || f.dateLabel || '', tag: f.finePrint || '',
      image: f.image, imageAlt: f.imageAlt || f.headline,
      showOnWebsite: true, days: f.days && f.days.length ? f.days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      start: f.start || '11:00', end: f.end || '21:00',
      flyerId: templateId || '', sort: state.specials.length,
      flyerStyle: flyerStyle
    };
    var ix = -1;
    if (templateId) ix = state.specials.findIndex(function (s) { return s.flyerId === templateId; });
    if (ix !== -1) { entry.id = state.specials[ix].id; entry.sort = state.specials[ix].sort; state.specials[ix] = entry; }
    else { entry.sort = state.specials.length; state.specials.push(entry); }
    // Keep legacy single-object in sync
    state.dailySpecial = { title: entry.title, text: entry.sub, price: entry.priceLabel, description: entry.description, tag: entry.tag, image: entry.image, imageAlt: entry.imageAlt };
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* storage blocked — non-fatal */ }
  }

  /* ---------- Paths: same rule as admin (relative, forward slashes) ---------- */
  function normalizePath(raw, silent) {
    var p = String(raw || '').trim().replace(/\\/g, '/');
    if (!p) return '';
    // Allow full hotlinks untouched
    if (/^https?:\/\//i.test(p) || /^data:/i.test(p)) return p;
    var marker = 'web-project/';
    var idx = p.toLowerCase().lastIndexOf(marker);
    if (idx !== -1) p = p.slice(idx + marker.length);
    p = p.replace(/^[a-zA-Z]:\//, '').replace(/^\/+/, '');
    var wasAbsolute = /^[a-zA-Z]:\//.test(String(raw || '').trim()) || /^C:\//i.test(String(raw || ''));
    if (wasAbsolute && !silent) toast('Use relative path like assets/flyers/taco.jpg — absolute paths do not load.');
    return p;
  }

  function collectDays() {
    var out = [];
    document.querySelectorAll('#y-days-row [data-day]').forEach(function (cb) { if (cb.checked) out.push(cb.getAttribute('data-day')); });
    return out;
  }
  function fillDays(days) {
    var set = days && days.length ? days : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    document.querySelectorAll('#y-days-row [data-day]').forEach(function (cb) {
      cb.checked = set.indexOf(cb.getAttribute('data-day')) !== -1;
    });
  }
  /* ---------- Flyer form <-> state ---------- */
  function collectFlyer(silent) {
    var frameStyle = val('y-frame') || 'none';
    var useCustom = checked('y-usecustom', false);
    var c = function (id) { return useCustom ? colorVal(id) : ''; };
    return {
      headline: val('y-headline'),
      sub: val('y-sub'),
      priceLabel: val('y-price'),
      dateLabel: val('y-date'),
      theme: val('y-theme') || 'chalk',
      layout: val('y-layout') || 'poster',
      image: normalizePath(val('y-image'), silent),
      imageAlt: val('y-alt') || val('y-headline'),
      kicker: val('y-kicker'),
      badge: val('y-badge'),
      finePrint: val('y-fine'),
      cta: val('y-cta'),
      showLogo: checked('y-show-logo', true),
      showContact: checked('y-show-contact', true),
      showPhoto: checked('y-show-photo', true),
      font: val('y-font') || 'system',
      customColors: useCustom,
      accent: c('y-accent'),
      align: val('y-align') || 'center',
      photoShape: val('y-photoshape') || 'rounded',
      frame: frameStyle, frameStyle: frameStyle,
      frameWidth: numVal('y-framewidth', 6),
      frameColor: c('y-framecolor'),
      frameRadius: numVal('y-frameradius', 10),
      pattern: val('y-pattern') || 'none',
      patternOpacity: numVal('y-patternopacity', 18),
      bgStart: c('y-bgstart'), bgEnd: c('y-bgend'), bgInk: c('y-bgink'),
      fontHeadSize: numVal('y-headsize', 0), fontHeadColor: c('y-headcolor'),
      fontSubSize: numVal('y-subsize', 0), fontSubColor: c('y-subcolor'),
      fontPriceSize: numVal('y-pricesize', 0), fontPriceColor: c('y-pricecolor'),
      showOnWebsite: checked('y-show-website', false),
      days: collectDays(),
      start: val('y-start') || '11:00', end: val('y-end') || '21:00'
    };
  }

  function fillFlyer(f) {
    f = Object.assign({}, DEFAULT_FLYER, f || {});
    setVal('y-kicker', f.kicker);
    setVal('y-headline', f.headline);
    setVal('y-sub', f.sub);
    setVal('y-price', f.priceLabel);
    setVal('y-date', f.dateLabel);
    setVal('y-badge', f.badge);
    setVal('y-cta', f.cta);
    setVal('y-fine', f.finePrint);
    setVal('y-theme', f.theme);
    setVal('y-layout', f.layout);
    setVal('y-font', f.font);
    setVal('y-align', f.align);
    setVal('y-photoshape', f.photoShape);
    setVal('y-frame', f.frameStyle || f.frame || 'none');
    setVal('y-pattern', f.pattern || 'none');
    setChecked('y-usecustom', !!f.customColors);
    setVal('y-accent', f.accent || '#f6b93b');
    setVal('y-bgstart', f.bgStart || '#2e2e2e');
    setVal('y-bgend', f.bgEnd || '#1a1a1a');
    setVal('y-bgink', f.bgInk || '#faf5ec');
    setVal('y-framecolor', f.frameColor || '#f6b93b');
    setRange('y-framewidth', f.frameWidth != null ? f.frameWidth : 6);
    setRange('y-frameradius', f.frameRadius != null ? f.frameRadius : 10);
    setRange('y-patternopacity', f.patternOpacity != null ? f.patternOpacity : 18);
    setVal('y-headcolor', f.fontHeadColor || '#f6b93b');
    setRange('y-headsize', f.fontHeadSize || 0);
    setVal('y-subcolor', f.fontSubColor || '#faf5ec');
    setRange('y-subsize', f.fontSubSize || 0);
    setVal('y-pricecolor', f.fontPriceColor || '#f6b93b');
    setRange('y-pricesize', f.fontPriceSize || 0);
    setVal('y-image', f.image);
    setVal('y-alt', f.imageAlt);
    setChecked('y-show-logo', f.showLogo !== false);
    setChecked('y-show-contact', f.showContact !== false);
    setChecked('y-show-photo', f.showPhoto !== false);
    setChecked('y-show-website', !!f.showOnWebsite);
    setVal('y-start', f.start || '11:00');
    setVal('y-end', f.end || '21:00');
    fillDays(f.days);
    syncRangeLabels();
  }

  function currentFlyer() {
    var f;
    try { f = collectFlyer(true); } catch (e) { f = Object.assign({}, DEFAULT_FLYER); }
    // Empty form on first run -> seed from last-used so Taco Tuesday is one click away
    if (!f.headline && !f.sub && !f.priceLabel && state && state.flyerLastUsed) {
      return Object.assign({}, state.flyerLastUsed);
    }
    return f;
  }

  /* ---------- Render: flyer canvas ---------- */
  function renderFlyer() {
    var canvas = document.getElementById('flyer-canvas');
    if (!canvas) return;
    var f = currentFlyer();
    var b = (state && state.businessInfo) || {};

    document.body.setAttribute('data-flyer-size', f.layout || 'poster');
    canvas.setAttribute('data-theme', f.theme || 'chalk');
    canvas.setAttribute('data-font', f.font || 'system');
    canvas.setAttribute('data-align', f.align || 'center');
    canvas.setAttribute('data-pattern', f.pattern || 'none');
    var fs = f.frameStyle || f.frame || 'none';
    canvas.setAttribute('data-frame', fs);
    var themeAcc = (THEME_DEFAULTS[f.theme] || {}).accent || '';
    if (f.accent) canvas.style.setProperty('--flyer-accent', f.accent);
    else if (themeAcc) canvas.style.setProperty('--flyer-accent', themeAcc);
    else canvas.style.removeProperty('--flyer-accent');
    // Per-element overrides (empty = theme default)
    var css = canvas.style;
    var setOrDrop = function (k, v, suffix) { if (v) css.setProperty(k, suffix ? (v + suffix) : v); else css.removeProperty(k); };
    setOrDrop('--flyer-bg-start', f.bgStart); setOrDrop('--flyer-bg-end', f.bgEnd); setOrDrop('--flyer-ink', f.bgInk);
    setOrDrop('--flyer-pattern-opacity', (f.patternOpacity != null ? String(f.patternOpacity / 100) : ''));
    setOrDrop('--flyer-frame-width', f.frameWidth != null ? String(f.frameWidth) : '', 'px');
    setOrDrop('--flyer-frame-color', f.frameColor); setOrDrop('--flyer-frame-radius', f.frameRadius != null ? String(f.frameRadius) : '', 'px');
    setOrDrop('--flyer-head-size', f.fontHeadSize ? String(f.fontHeadSize) : '', 'px');
    setOrDrop('--flyer-head-color', f.fontHeadColor); setOrDrop('--flyer-sub-size', f.fontSubSize ? String(f.fontSubSize) : '', 'px');
    setOrDrop('--flyer-sub-color', f.fontSubColor); setOrDrop('--flyer-price-size', f.fontPriceSize ? String(f.fontPriceSize) : '', 'px');
    setOrDrop('--flyer-price-color', f.fontPriceColor);

    var logoHtml = '';
    if (f.showLogo !== false) {
      logoHtml = b.logo
        ? '<img class="flyer-logo" src="' + escAttr(b.logo) + '" alt="' + escAttr(b.logoAlt || b.name || 'Logo') + '" crossorigin="anonymous" />'
        : '<div class="flyer-logo-fallback" aria-hidden="true">♨</div>';
    }
    var topHtml = logoHtml
      ? '<div class="flyer-top">' + logoHtml +
        '<div><strong>' + escHtml(b.name || "Joe's Kitchen") + '</strong>' +
        (b.tagline ? '<small>' + escHtml(b.tagline) + '</small>' : '') + '</div></div>'
      : '';
    var photoHtml = (f.showPhoto !== false && f.image)
      ? '<img class="flyer-photo" data-shape="' + escAttr(f.photoShape || 'rounded') + '" src="' + escAttr(f.image) + '" alt="' + escAttr(f.imageAlt || f.headline || 'Special') + '" crossorigin="anonymous" />'
      : '';

    canvas.innerHTML =
      '<div class="flyer-inner">' +
        topHtml +
        (f.kicker ? '<p class="flyer-kicker">' + escHtml(f.kicker) + '</p>' : '') +
        (f.dateLabel ? '<p class="flyer-kicker" style="opacity:.65">' + escHtml(f.dateLabel) + '</p>' : '') +
        (f.badge ? '<span class="flyer-badge">' + escHtml(f.badge) + '</span>' : '') +
        '<h2 class="flyer-head">' + escHtml(f.headline || 'Your Special') + '</h2>' +
        photoHtml +
        (f.sub ? '<p class="flyer-sub">' + escHtml(f.sub) + '</p>' : '') +
        (f.priceLabel ? '<p class="flyer-price">' + escHtml(f.priceLabel) + '</p>' : '') +
        (f.cta ? '<span class="flyer-cta">' + escHtml(f.cta) + '</span>' : '') +
        (f.showContact !== false ? '<p class="flyer-contact">' + escHtml([b.address, b.phone, b.hoursShort].filter(Boolean).join(' • ')) + '</p>' : '') +
        (f.finePrint ? '<p class="flyer-fine">' + escHtml(f.finePrint) + '</p>' : '') +
      '</div>';

    // Broken images -> hide, never broken-icon (offline/chalkboard safe)
    canvas.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('error', function () { img.style.display = 'none'; }, { once: true });
    });
  }

  /* ---------- Render: live preview (special + next event) ---------- */
  function renderPreview() {
    var host = document.getElementById('cc-preview');
    if (!host || !state) return;
    var b = state.businessInfo || {};
    var specs = (state.specials || []).filter(function (s) { return s.showOnWebsite !== false; });
    var sLine = specs.length
      ? specs.map(function (s) { return escHtml(s.headline || s.title) + ' (' + escHtml((s.days || []).join('/')) + ' ' + escHtml(s.start || '') + '–' + escHtml(s.end || '') + ')'; }).join('<br />')
      : escHtml((state.dailySpecial || {}).title || 'No specials on website');
    var ev = (state.events || [])[0];
    host.innerHTML =
      '<div class="cc-line"><strong>' + escHtml(b.name || '') + '</strong><span>' + escHtml(b.hoursShort || '') + '</span></div>' +
      '<div class="cc-line"><span>★ ' + sLine + '</span><span>' + escHtml(String(specs.length || '')) + '</span></div>' +
      (ev ? '<div class="cc-line"><span>' + escHtml(ev.title || '') + '</span><span>' + escHtml(ev.date || '') + '</span></div>'
          : '<div class="cc-line"><span>No events yet</span><span></span></div>');
  }

  /* ---------- Template Library ---------- */
  function renderTemplates() {
    var host = document.getElementById('template-list');
    if (!host || !state) return;
    var list = state.flyerTemplates || [];
    document.getElementById('template-count').textContent = list.length ? String(list.length) + ' saved' : 'No templates yet';
    if (!list.length) {
      host.innerHTML = '<p class="hint">No templates yet. Design once above, then “Save as template” — next week just Load → update price/date → Print.</p>';
      return;
    }
    host.innerHTML = '';
    list.forEach(function (t) {
      var card = document.createElement('div');
      card.className = 'tpl-card';
      var active = state.flyerLastUsed && state.flyerLastUsed.templateId === t.id ? ' • active' : '';
      var web = t.showOnWebsite ? ' • 🌐 ' + (t.days || []).join('/') + ' ' + (t.start || '') + '–' + (t.end || '') : '';
      card.innerHTML =
        '<div><strong>' + escHtml(t.name || t.headline || 'Untitled') + '</strong>' +
        '<small>' + escHtml([t.headline, t.priceLabel, t.dateLabel].filter(Boolean).join(' • ')) + active + escHtml(web) + '</small></div>' +
        '<div class="tpl-actions"><button type="button" data-tpl-load="' + escAttr(t.id) + '">Load</button>' +
        '<button type="button" data-tpl-del="' + escAttr(t.id) + '">Delete</button></div>';
      host.appendChild(card);
    });
  }

  function saveTemplate() {
    var nameEl = document.getElementById('y-template-name');
    var name = (nameEl && nameEl.value.trim()) || currentFlyer().headline || 'Untitled';
    var f = currentFlyer();
    var id = 'tpl-' + Date.now().toString(36);
    state.flyerTemplates = state.flyerTemplates || [];
    state.flyerTemplates.push(Object.assign({ id: id, name: name }, f));
    state.flyerLastUsed = Object.assign({ templateId: id }, f);
    syncFlyerToSpecials(f, id);
    persist();
    if (nameEl) nameEl.value = '';
    renderTemplates();
    renderPreview();
    toast(f.showOnWebsite ? 'Template saved + pushed to website schedule.' : 'Template saved (flyer-only).');
  }

  function loadTemplate(id) {
    var t = (state.flyerTemplates || []).find(function (x) { return x.id === id; });
    if (!t) return;
    fillFlyer(t);
    state.flyerLastUsed = Object.assign({ templateId: id }, collectFlyer(true));
    syncFlyerToSpecials(collectFlyer(true), id);
    persist();
    renderFlyer();
    renderTemplates();
    renderPreview();
    toast('Loaded “' + (t.name || t.headline) + '” — update price/date, then Print.');
  }

  function deleteTemplate(id) {
    state.flyerTemplates = (state.flyerTemplates || []).filter(function (x) { return x.id !== id; });
    syncFlyerToSpecials({ showOnWebsite: false }, id);
    persist();
    renderTemplates();
    renderPreview();
    toast('Template deleted.');
  }

  /* ---------- Export PNG (online) / Print (always) ---------- */
  async function exportPNG() {
    var f = currentFlyer();
    state.flyerLastUsed = Object.assign({ templateId: (state.flyerLastUsed || {}).templateId || '' }, f);
    syncFlyerToSpecials(f, (state.flyerLastUsed || {}).templateId || '');
    persist();
    renderFlyer();
    renderPreview();

    if (typeof window.html2canvas === 'undefined') {
      toast('PNG needs internet (html2canvas CDN). Use “Print Flyer” — it works offline.');
      return;
    }
    var canvas = document.getElementById('flyer-canvas');
    toast('Rendering PNG…');
    try {
      var shot = await window.html2canvas(canvas, { useCORS: true, backgroundColor: null, scale: 2 });
      var a = document.createElement('a');
      a.download = 'flyer-' + slug(f.headline || 'special') + '.png';
      a.href = shot.toDataURL('image/png');
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { a.remove(); }, 500);
      toast('PNG downloaded. Move it into assets/flyers/ to reuse.');
    } catch (e) {
      console.warn('[flyer] html2canvas failed, retrying without photo:', e);
      // Retry text-only: hotlink photo likely tainted canvas (CORS). Print fallback always works.
      try {
        var noPhoto = canvas.querySelector('.flyer-photo');
        if (noPhoto) noPhoto.style.display = 'none';
        var shot2 = await window.html2canvas(canvas, { useCORS: true, backgroundColor: null, scale: 2 });
        var a2 = document.createElement('a');
        a2.download = 'flyer-' + slug(f.headline || 'special') + '-text.png';
        a2.href = shot2.toDataURL('image/png');
        document.body.appendChild(a2);
        a2.click();
        setTimeout(function () { a2.remove(); }, 500);
        toast('Photo blocked PNG (CORS) — exported text version. Use local assets/flyers/ photo or Print.');
      } catch (e2) {
        toast('PNG failed. Use “Print Flyer” — it works offline.');
      }
      renderFlyer();
    }
  }

  function doPrint() {
    var f = currentFlyer();
    // Reflect normalized path back so C:\ pastes self-correct
    var imgEl = document.getElementById('y-image');
    if (imgEl && imgEl.value.trim() !== f.image) imgEl.value = f.image;
    state.flyerLastUsed = Object.assign({ templateId: (state.flyerLastUsed || {}).templateId || '' }, f);
    syncFlyerToSpecials(f, (state.flyerLastUsed || {}).templateId || '');
    persist();
    renderFlyer();
    renderPreview();
    window.print();
  }

  function exportJson() {
    try {
      var data = JSON.parse(JSON.stringify(state));
      var f = currentFlyer();
      data.flyerLastUsed = Object.assign({ templateId: (data.flyerLastUsed || {}).templateId || '' }, f);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      state = data;
    } catch (e) { /* non-fatal */ }
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('data.json downloaded (includes templates). Replace the site file to publish.');
  }

  function resetAll() {
    if (!confirm('Discard command-center preview edits and reload from data.json?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    location.reload();
  }

  /* ---------- Health checks ---------- */
  async function healthCheck() {
    var host = document.getElementById('health-list');
    if (!host) return;
    var rows = [];
    var push = function (ok, label) { rows.push({ ok: ok, label: label }); };

    // 1) data.json reachable
    try {
      var res = await fetch(DATA_URL, { cache: 'no-store' });
      push(res.ok, 'data.json loads (' + res.status + ')');
    } catch (e) { push(false, 'data.json unreachable — are you on Live Server?'); }

    // 2) LocalStorage dirty?
    var dirty = false;
    try { dirty = !!localStorage.getItem(STORAGE_KEY); } catch (e) { push(false, 'LocalStorage blocked'); }
    if (dirty) push(true, 'Preview edits in LocalStorage (Export to publish)');
    else push(true, 'No unsaved preview edits');

    // 3) Logo resolves?
    var logo = (state && state.businessInfo && state.businessInfo.logo) || '';
    if (!logo) push(true, 'Logo empty → ♨ placeholder (fine)');
    else {
      var ok = await imgOK(logo);
      push(ok, ok ? 'Logo loads: ' + logo : 'Logo MISSING: ' + logo);
    }

    // 4) Flyer photo CORS-safe for PNG?
    var photo = currentFlyer().image || '';
    if (!photo) push(true, 'No flyer photo → PNG + print always work');
    else if (/^https?:\/\//i.test(photo)) push(true, 'Hotlink photo: print OK, PNG may fall back to text (CORS)');
    else {
      var pok = await imgOK(photo);
      push(pok, pok ? 'Local photo loads: ' + photo : 'Photo MISSING: ' + photo);
    }

    // 5) PNG engine?
    push(typeof window.html2canvas !== 'undefined', typeof window.html2canvas !== 'undefined' ? 'PNG engine online (html2canvas)' : 'PNG engine offline → Print fallback ready');

    host.innerHTML = rows.map(function (r) {
      return '<div class="health-row"><span aria-hidden="true">' + (r.ok ? '✅' : '❌') + '</span><span>' + escHtml(r.label) + '</span></div>';
    }).join('');
  }

  function imgOK(src) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve(true); };
      img.onerror = function () { resolve(false); };
      img.src = src;
    });
  }

  function syncRangeLabels() {
    var pairs = [['y-framewidth', 'y-framewidth-val', 'px'], ['y-frameradius', 'y-frameradius-val', 'px'], ['y-patternopacity', 'y-patternopacity-val', '%']];
    pairs.forEach(function (p) {
      var a = document.getElementById(p[0]), b = document.getElementById(p[1]);
      if (a && b) b.textContent = a.value;
    });
    // Font sliders: 0 = Auto (drops CSS var, falls back to theme default)
    [['y-headsize', 'y-headsize-val'], ['y-subsize', 'y-subsize-val'], ['y-pricesize', 'y-pricesize-val']].forEach(function (p) {
      var a = document.getElementById(p[0]), b = document.getElementById(p[1]);
      if (a && b) b.textContent = (String(a.value) === '0') ? 'Auto' : (a.value + 'px');
    });
  }
  /* ---------- Wiring ---------- */
  function initActions() {
    ['y-kicker', 'y-headline', 'y-sub', 'y-price', 'y-date', 'y-badge', 'y-cta', 'y-fine',
     'y-theme', 'y-layout', 'y-font', 'y-align', 'y-photoshape', 'y-frame', 'y-accent',
     'y-bgstart', 'y-bgend', 'y-bgink', 'y-framecolor', 'y-framewidth', 'y-frameradius',
     'y-pattern', 'y-patternopacity', 'y-usecustom',
     'y-headsize', 'y-headcolor', 'y-subsize', 'y-subcolor', 'y-pricesize', 'y-pricecolor',
     'y-image', 'y-alt', 'y-show-logo', 'y-show-photo', 'y-show-contact',
     'y-show-website', 'y-start', 'y-end'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { syncRangeLabels(); renderFlyer(); });
      if (el) el.addEventListener('change', function () { syncRangeLabels(); renderFlyer(); });
    });
    document.querySelectorAll('#y-days-row [data-day]').forEach(function (cb) {
      cb.addEventListener('change', renderFlyer);
    });

    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!(t instanceof HTMLElement)) return;
      if (t.hasAttribute('data-tpl-load')) loadTemplate(t.getAttribute('data-tpl-load'));
      else if (t.hasAttribute('data-tpl-del')) {
        if (confirm('Delete this template?')) deleteTemplate(t.getAttribute('data-tpl-del'));
      }
    });

    var on = function (id, fn) { var el = document.getElementById(id); if (el) el.addEventListener('click', fn); };
    on('btn-save-template', saveTemplate);
    on('btn-export-png', exportPNG);
    on('btn-print-flyer', doPrint);
    on('btn-export-json', exportJson);
    on('btn-reset', resetAll);
    on('btn-health', healthCheck);
    on('btn-reset-theme', function () {
      setChecked('y-usecustom', false);
      setVal('y-pattern', 'none');
      setRange('y-patternopacity', 18);
      renderFlyer(); toast('Custom colors OFF + pattern cleared — theme preset now shows.');
    });
  }

  /* ---------- Helpers ---------- */
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function colorVal(id) {
    var el = document.getElementById(id);
    if (!el) return '';
    var v = String(el.value || '').trim();
    // Treat untouched default swatches as "empty = theme" only when user never changed? Keep explicit: empty string only if data-default and unchanged is handled by reset button. Return value as-is.
    return v;
  }
  function numVal(id, fb) { var el = document.getElementById(id); var n = el ? parseInt(el.value, 10) : NaN; return isNaN(n) ? fb : n; }
  function setRange(id, v) { var el = document.getElementById(id); if (el) el.value = String(v != null ? v : 0); }
  function checked(id, fb) { var el = document.getElementById(id); return el ? !!el.checked : !!fb; }
  function setChecked(id, v) { var el = document.getElementById(id); if (el) el.checked = !!v; }
  function setVal(id, v) {
    var el = document.getElementById(id);
    if (!el) return;
    if (el.tagName === 'SELECT') {
      var ok = Array.prototype.some.call(el.options, function (o) { return o.value === v; });
      el.value = ok ? v : el.options[0].value;
    } else el.value = v || '';
  }
  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escAttr(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function slug(s) {
    return String(s || 'special').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'special';
  }
  function toast(msg) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3200);
  }

  /* ---------- Boot ---------- */
  async function init() {
    initActions();
    try {
      state = await loadData();
    } catch (err) {
      toast('Error: ' + err.message);
      return;
    }
    fillFlyer(state.flyerLastUsed);
    renderPreview();
    renderFlyer();
    renderTemplates();
    healthCheck();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.RusticFlyer = { loadData: loadData, renderFlyer: renderFlyer, exportPNG: exportPNG };
})();
