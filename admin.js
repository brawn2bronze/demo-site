/* ============================================================
   admin.js — Stage 2 data binding
   Loads data.json (LocalStorage fallback) -> forms.
   Preview -> LocalStorage (index.html reads it live).
   Save & Export -> downloads updated data.json.
   Swap to backend later: POST collected data to API instead of download.
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'rustic_data_v1'; // must match app.js
  var DATA_URL = 'data.json';

  var state = null;
  var toastTimer = null;

  /* ---------- Load ---------- */
  async function loadData() {
    // 1) LocalStorage = latest admin edits
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* ignore */ }
    // 2) Static data.json
    var res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load data.json (' + res.status + ')');
    return await res.json();
  }

  /* ---------- Fill: Business Info + social ---------- */
  function fillInfo(b) {
    b = b || {};
    setVal('f-name', b.name);
    setVal('f-tagline', b.tagline);
    setVal('f-logo', b.logo);
    setVal('f-logoAlt', b.logoAlt);
    setVal('f-address', b.address);
    setVal('f-phone', b.phone);
    setVal('f-phoneHref', b.phoneHref);
    setVal('f-directions', b.directionsUrl);
    setVal('f-hoursShort', b.hoursShort);
    setVal('f-hours', (b.hours || []).map(function (h) {
      return h.days + ' | ' + h.time;
    }).join('\n'));
    var soc = b.social || {};
    setVal('f-facebook', soc.facebook);
    setVal('f-instagram', soc.instagram);
    setVal('f-twitter', soc.twitter);
    setVal('f-tiktok', soc.tiktok);
    updateLogoPreview();
    updateAdminTitle(b.name);
  }

  var HERO_DEFAULTS = {
    eyebrow: 'Cedar Hollow • Est. 2012 • Farm to Table',
    headline: 'Real Smoke.\nCold Drinks.\nNo Fuss.',
    lede: 'Smoked brisket, smash burgers & pie. Family-owned bar & grill off Route 9.',
    cta1Label: 'View Menu',
    cta2Label: 'Hours & Directions',
    openLabel: 'Open today',
    closeLabel: 'Kitchen closes',
    closeTime: '8:30pm',
    image: '',
    imageAlt: ''
  };

  function fillHero(h) {
    h = Object.assign({}, HERO_DEFAULTS, h || {});
    setVal('h-eyebrow', h.eyebrow);
    setVal('h-headline', h.headline);
    setVal('h-lede', h.lede);
    setVal('h-cta1', h.cta1Label);
    setVal('h-cta2', h.cta2Label);
    setVal('h-image', h.image);
    setVal('h-imageAlt', h.imageAlt);
    setVal('h-openLabel', h.openLabel);
    setVal('h-closeLabel', h.closeLabel);
    setVal('h-closeTime', h.closeTime);
  }

  var TEXT_DEFAULTS = {
    nav: { special: 'Special', events: 'Events', menu: 'Menu', gallery: 'Gallery', visit: 'Visit', callToOrder: 'Call to Order', follow: 'Follow' },
    specialUI: { badge: "★ Today's Special", orderLabel: 'Order Ahead', alsoToday: 'Also today:' },
    sections: {
      events: { eyebrow: 'Happenings', title: 'Nightly Fun at the Fork', cta: 'Ask About Tonight' },
      menu: { eyebrow: 'Our Menu', title: 'Simple. Hearty. Made Fresh.', allLabel: 'All', printLabel: 'Print Menu', note: 'Full menu at the counter — daily pies sell out.' },
      gallery: { eyebrow: 'The Joint', title: 'Warm Wood, Loud Laughs' },
      visit: { title: 'Find Us', directionsLabel: 'Get Directions', callLabel: 'Call / Order', mapStar: '★', mapText: "Route 9 • 2 mi past Miller's Barn<br />Big gravel lot — look for the smoke" },
      footer: { tagline: 'Family-owned since 2012. Good food, honest pours.' }
    },
    bottomNav: { menu: 'Menu', call: 'Call / Order', events: 'Events', location: 'Location', skip: 'Skip to menu' },
    siteMeta: { description: '', ogTitle: '', ogDescription: '' }
  };

  function fillSiteText(d) {
    d = d || {};
    var n = Object.assign({}, TEXT_DEFAULTS.nav, d.nav || {});
    setVal('t-nav-special', n.special); setVal('t-nav-events', n.events);
    setVal('t-nav-menu', n.menu); setVal('t-nav-gallery', n.gallery);
    setVal('t-nav-visit', n.visit); setVal('t-nav-call', n.callToOrder);
    setVal('t-nav-follow', n.follow);
    var su = Object.assign({}, TEXT_DEFAULTS.specialUI, d.specialUI || {});
    setVal('t-special-badge', su.badge); setVal('t-special-order', su.orderLabel); setVal('t-special-also', su.alsoToday);
    var sec = d.sections || {};
    var ev = Object.assign({}, TEXT_DEFAULTS.sections.events, sec.events || {});
    setVal('t-ev-eyebrow', ev.eyebrow); setVal('t-ev-title', ev.title); setVal('t-ev-cta', ev.cta);
    var me = Object.assign({}, TEXT_DEFAULTS.sections.menu, sec.menu || {});
    setVal('t-menu-eyebrow', me.eyebrow); setVal('t-menu-title', me.title);
    setVal('t-menu-all', me.allLabel); setVal('t-menu-print', me.printLabel); setVal('t-menu-note', me.note);
    var ga = Object.assign({}, TEXT_DEFAULTS.sections.gallery, sec.gallery || {});
    setVal('t-gal-eyebrow', ga.eyebrow); setVal('t-gal-title', ga.title);
    var vi = Object.assign({}, TEXT_DEFAULTS.sections.visit, sec.visit || {});
    setVal('t-visit-title', vi.title); setVal('t-visit-dir', vi.directionsLabel);
    setVal('t-visit-call', vi.callLabel); setVal('t-map-star', vi.mapStar); setVal('t-map-text', vi.mapText);
    var fo = Object.assign({}, TEXT_DEFAULTS.sections.footer, sec.footer || {});
    setVal('t-foot-tag', fo.tagline);
    var bn = Object.assign({}, TEXT_DEFAULTS.bottomNav, d.bottomNav || {});
    setVal('t-bn-menu', bn.menu); setVal('t-bn-call', bn.call);
    setVal('t-bn-events', bn.events); setVal('t-bn-location', bn.location); setVal('t-skip', bn.skip);
    var mt = Object.assign({}, TEXT_DEFAULTS.siteMeta, d.siteMeta || {});
    setVal('t-meta-desc', mt.description); setVal('t-og-title', mt.ogTitle); setVal('t-og-desc', mt.ogDescription);
  }

  function updateLogoPreview() {
    var img = document.getElementById('logo-preview');
    if (!img) return;
    var raw = document.getElementById('f-logo').value;
    var url = normalizeLogoPath(raw);
    // Reflect normalization back so C:\ pastes self-correct, no code edits needed
    if (url !== String(raw || '').trim() && document.getElementById('f-logo').value !== url) {
      document.getElementById('f-logo').value = url;
    }
    if (url) { img.src = url; img.style.display = 'block'; }
    else { img.removeAttribute('src'); img.style.display = 'none'; }
  }

  /* Normalize pasted paths: backslashes -> forward, strip absolute prefix to web-project/ */
  function normalizeLogoPath(raw, silent) {
    var p = String(raw || '').trim().replace(/\\/g, '/');
    if (!p) return '';
    var marker = 'web-project/';
    var idx = p.toLowerCase().lastIndexOf(marker);
    if (idx !== -1) p = p.slice(idx + marker.length);
    // Strip drive letter (C:/...) or leading slashes that would break Live Server root
    p = p.replace(/^[a-zA-Z]:\//, '').replace(/^\/+/, '');
    // Warn once per bad paste so user learns relative-path rule (skipped during live preview)
    var wasAbsolute = /^[a-zA-Z]:\//.test(String(raw || '').trim()) || /^\/Users\//.test(p) || /^C:\//i.test(String(raw || ''));
    if (wasAbsolute && !silent) {
      toast('Use relative path like assets/logo/logo.png — absolute paths do not load on the site.');
    }
    return p;
  }

  /* Admin tab title follows restaurant name everywhere (B) */
  function updateAdminTitle(name) {
    var n = String(name || '').trim();
    document.title = n ? "Admin \u2014 " + n : 'Admin \u2014 Site Admin';
  }

  /* ---------- Editor: Specials (scheduled rotation, hybrid with flyer templates) ---------- */
  var DAY_OPTS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function renderSpecialsEditor(list) {
    var host = document.getElementById('specials-editor');
    if (!host) return;
    host.innerHTML = '';
    (list || []).forEach(function (sp, i) {
      var days = sp.days && sp.days.length ? sp.days : DAY_OPTS.slice();
      var div = document.createElement('div');
      div.className = 'item-row';
      div.innerHTML =
        '<div class="row-head"><strong>Special ' + (i + 1) + '</strong>' +
        '<span><label style="display:inline-flex;align-items:center;gap:.4rem;margin:0"><input type="checkbox" data-sp="showOnWebsite" data-i="' + i + '"' + (sp.showOnWebsite !== false ? ' checked' : '') + ' /> Website</label> ' +
        '<button class="btn-danger" data-del-special="' + i + '" type="button">Remove</button></span></div>' +
        '<div class="grid2">' +
          '<label>Headline <input data-sp="headline" data-i="' + i + '" type="text" value="' + escAttr(sp.headline || sp.title || '') + '" /></label>' +
          '<label>Price <input data-sp="priceLabel" data-i="' + i + '" type="text" value="' + escAttr(sp.priceLabel || sp.price || '') + '" /></label>' +
        '</div>' +
        '<label>Sub line <input data-sp="sub" data-i="' + i + '" type="text" value="' + escAttr(sp.sub || sp.text || '') + '" /></label>' +
        '<label>Description <input data-sp="description" data-i="' + i + '" type="text" value="' + escAttr(sp.description) + '" /></label>' +
        '<div class="grid2">' +
          '<label>Tag <input data-sp="tag" data-i="' + i + '" type="text" value="' + escAttr(sp.tag) + '" /></label>' +
          '<label>Image <input data-sp="image" data-i="' + i + '" type="text" value="' + escAttr(sp.image) + '" /></label>' +
        '</div>' +
        '<div class="grid2">' +
          '<label>Start (HH:MM) <input data-sp="start" data-i="' + i + '" type="time" value="' + escAttr(sp.start || '11:00') + '" /></label>' +
          '<label>End (HH:MM) <input data-sp="end" data-i="' + i + '" type="time" value="' + escAttr(sp.end || '21:00') + '" /></label>' +
        '</div>' +
        '<div style="display:flex;gap:.4rem;flex-wrap:wrap;margin:.4rem 0">' +
          DAY_OPTS.map(function (d) {
            return '<label style="display:inline-flex;align-items:center;gap:.3rem;margin:0;font-weight:600"><input type="checkbox" data-sp-day="' + d + '" data-i="' + i + '"' + (days.indexOf(d) !== -1 ? ' checked' : '') + ' />' + d + '</label>';
          }).join('') +
        '</div>' +
        (sp.flyerId ? '<p class="hint" style="margin:.2rem 0 0">Linked flyer template: ' + escHtml(sp.flyerId) + '</p>' : '') +
        (sp.flyerStyle ? '<p class="hint" style="margin:.2rem 0 0">Flyer-styled (' + escHtml(sp.flyerStyle.theme || 'chalk') + (sp.flyerStyle.pattern && sp.flyerStyle.pattern !== 'none' ? ' + ' + escHtml(sp.flyerStyle.pattern) : '') + ') — storefront card uses this design. Edit design in Command Center.</p>' : '');
      host.appendChild(div);
    });
  }

  /* ---------- Editor: Menu ---------- */
  function renderMenuEditor(cats) {
    var host = document.getElementById('menu-editor');
    host.innerHTML = '';
    (cats || []).forEach(function (cat, ci) {
      var fs = document.createElement('fieldset');
      var itemsHtml = (cat.items || []).map(function (it, ii) {
        return (
          '<div class="item-row" data-cat="' + ci + '" data-item="' + ii + '">' +
            '<div class="row-head"><strong>Item ' + (ii + 1) + '</strong>' +
            '<button class="btn-danger" data-del-item="' + ci + ':' + ii + '" type="button">Remove</button></div>' +
            '<div class="grid2">' +
              '<label>Name <input data-mi="name" type="text" value="' + escAttr(it.name) + '" /></label>' +
              '<label>Price <input data-mi="price" type="text" value="' + escAttr(it.price) + '" /></label>' +
            '</div>' +
            '<label>Description <input data-mi="description" type="text" value="' + escAttr(it.description) + '" /></label>' +
            '<label>Image path or URL (optional) <input data-mi="image" type="text" placeholder="assets/menu/dish.jpg or https://..." value="' + escAttr(it.image) + '" /></label>' +
          '</div>'
        );
      }).join('');

      fs.innerHTML =
        '<legend>Category ' + (ci + 1) + '</legend>' +
        '<div class="grid2">' +
          '<label>Display name <input data-mc="name" data-cat="' + ci + '" type="text" value="' + escAttr(cat.name) + '" /></label>' +
          '<label>ID (filter key) <input data-mc="id" data-cat="' + ci + '" type="text" value="' + escAttr(cat.id) + '" /></label>' +
        '</div>' +
        itemsHtml +
        '<div style="display:flex;gap:.6rem;flex-wrap:wrap">' +
          '<button class="btn-add" data-add-item="' + ci + '" type="button" style="flex:1">+ Add Item</button>' +
          '<button class="btn-danger" data-del-cat="' + ci + '" type="button">Delete Category</button>' +
        '</div>';
      host.appendChild(fs);
    });
  }

  /* ---------- Editor: Events ---------- */
  function renderEventsEditor(events) {
    var host = document.getElementById('events-editor');
    host.innerHTML = '';
    (events || []).forEach(function (ev, i) {
      var div = document.createElement('div');
      div.className = 'item-row';
      div.innerHTML =
        '<div class="row-head"><strong>Event ' + (i + 1) + '</strong>' +
        '<button class="btn-danger" data-del-event="' + i + '" type="button">Remove</button></div>' +
        '<div class="grid2">' +
          '<label>Title <input data-ev="title" data-i="' + i + '" type="text" value="' + escAttr(ev.title) + '" /></label>' +
          '<label>Date / Time <input data-ev="date" data-i="' + i + '" type="text" value="' + escAttr(ev.date) + '" /></label>' +
        '</div>' +
        '<label>Description <input data-ev="description" data-i="' + i + '" type="text" value="' + escAttr(ev.description) + '" /></label>';
      host.appendChild(div);
    });
  }

  /* ---------- Editor: Gallery (assets/gallery, assets/storefront) ---------- */
  function renderGalleryEditor(photos) {
    var host = document.getElementById('gallery-editor');
    if (!host) return;
    host.innerHTML = '';
    (photos || []).forEach(function (ph, i) {
      var div = document.createElement('div');
      div.className = 'item-row';
      div.innerHTML =
        '<div class="row-head"><strong>Photo ' + (i + 1) + '</strong>' +
        '<button class="btn-danger" data-del-photo="' + i + '" type="button">Remove</button></div>' +
        '<label>Image path or URL <input data-ph="src" data-i="' + i + '" type="text" placeholder="assets/gallery/dining-room.jpg or https://..." value="' + escAttr(ph.src) + '" /></label>' +
        '<label>Alt text <input data-ph="alt" data-i="' + i + '" type="text" value="' + escAttr(ph.alt) + '" /></label>';
      host.appendChild(div);
    });
  }

  /* ---------- Print Preview: text-only + logo (live from form) ---------- */
  function renderPrintPreview() {
    var host = document.getElementById('print-preview');
    if (!host) return;
    var data;
    try { data = collect(true); } catch (e) { return; }
    var b = data.businessInfo || {};
    updateAdminTitle(b.name);
    var logoHtml = b.logo
      ? '<img class="print-logo" src="' + escAttr(b.logo) + '" alt="' + escAttr(b.logoAlt || b.name || 'Logo') + '" />'
      : '';
    var html = '<div class="ps-head">' + logoHtml +
      '<h2>' + escHtml(b.name || '') + '</h2>' +
      '<p class="muted">' + escHtml(b.tagline || '') + '<br />' +
      escHtml(b.address || '') + ' • ' + escHtml(b.phone || '') + ' • ' + escHtml(b.hoursShort || '') + '</p></div>' +
      '<div class="ps-cols">';
    (data.menuCategories || []).forEach(function (cat) {
      html += '<h3>' + escHtml(cat.name) + '</h3>';
      (cat.items || []).forEach(function (it) {
        html += '<div class="pi"><span>' + escHtml(it.name) +
          (it.description ? '<small>' + escHtml(it.description) + '</small>' : '') +
          '</span><span>' + escHtml(it.price) + '</span></div>';
      });
    });
    html += '</div><div class="ps-foot">' + escHtml([b.address, b.phone, b.hoursShort].filter(Boolean).join(' • ')) + '</div>';
    host.innerHTML = html;
  }

  function escHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function collectSpecialsFromDOM(fallback) {
    var out = [];
    document.querySelectorAll('#specials-editor .item-row').forEach(function (row, idx) {
      var get = function (k) { var el = row.querySelector('[data-sp="' + k + '"]'); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; };
      var days = [];
      row.querySelectorAll('[data-sp-day]').forEach(function (cb) { if (cb.checked) days.push(cb.getAttribute('data-sp-day')); });
      var head = get('headline');
      var prev = (fallback && fallback[idx]) || {};
      out.push({
        id: prev.id || ('sp-' + Date.now().toString(36) + '-' + idx),
        headline: head,
        title: head + (get('priceLabel') ? ' — ' + get('priceLabel') : ''),
        sub: get('sub'), text: get('sub'),
        priceLabel: get('priceLabel'), price: get('priceLabel'),
        description: get('description'), tag: get('tag'),
        image: get('image'), imageAlt: head,
        showOnWebsite: !!get('showOnWebsite'),
        days: days.length ? days : DAY_OPTS.slice(),
        start: get('start') || '11:00', end: get('end') || '21:00',
        flyerId: prev.flyerId || '', sort: idx,
        flyerStyle: prev.flyerStyle || null
      });
    });
    return out;
  }

  /* ---------- Collect (DOM -> data) ---------- */
  function collect(silent) {
    var data = JSON.parse(JSON.stringify(state || {}));

    data.businessInfo = {
      name: val('f-name'), tagline: val('f-tagline'),
      logo: normalizeLogoPath(val('f-logo')), logoAlt: val('f-logoAlt') || val('f-name'),
      address: val('f-address'),
      phone: val('f-phone'), phoneHref: val('f-phoneHref'),
      directionsUrl: val('f-directions'), hoursShort: val('f-hoursShort'),
      social: {
        facebook: val('f-facebook'), instagram: val('f-instagram'),
        twitter: val('f-twitter'), tiktok: val('f-tiktok')
      },
      hours: val('f-hours').split('\n').map(function (l) { return l.trim(); }).filter(Boolean).map(function (l) {
        var parts = l.split('|');
        return { days: (parts[0] || '').trim(), time: (parts[1] || '').trim() };
      })
    };

    // Menu: read live inputs so add/remove never loses edits
    var cats = [];
    document.querySelectorAll('#menu-editor fieldset').forEach(function (fs) {
      var name = fs.querySelector('[data-mc="name"]').value.trim();
      var id = fs.querySelector('[data-mc="id"]').value.trim().toLowerCase().replace(/\s+/g, '-') || 'cat';
      var items = [];
      fs.querySelectorAll('.item-row').forEach(function (row) {
        items.push({
          name: row.querySelector('[data-mi="name"]').value.trim(),
          price: row.querySelector('[data-mi="price"]').value.trim(),
          description: row.querySelector('[data-mi="description"]').value.trim(),
          image: row.querySelector('[data-mi="image"]').value.trim()
        });
      });
      cats.push({ id: id, name: name, items: items });
    });
    data.menuCategories = cats;

    data.specials = collectSpecialsFromDOM(state.specials);
    // Legacy single-object kept in sync with first website-visible special
    var first = data.specials.filter(function (s) { return s.showOnWebsite; })[0] || data.specials[0];
    if (first) {
      data.dailySpecial = {
        title: first.title, text: first.sub, price: first.priceLabel,
        description: first.description, tag: first.tag,
        image: first.image, imageAlt: first.imageAlt || first.title
      };
    }

    var events = [];
    document.querySelectorAll('#events-editor .item-row').forEach(function (row) {
      events.push({
        title: row.querySelector('[data-ev="title"]').value.trim(),
        date: row.querySelector('[data-ev="date"]').value.trim(),
        description: row.querySelector('[data-ev="description"]').value.trim()
      });
    });
    data.events = events;

    var gallery = [];
    document.querySelectorAll('#gallery-editor .item-row').forEach(function (row) {
      var src = row.querySelector('[data-ph="src"]').value.trim();
      var alt = row.querySelector('[data-ph="alt"]').value.trim();
      if (src || alt) gallery.push({ src: src, alt: alt });
    });
    data.gallery = gallery;

    data.hero = {
      eyebrow: val('h-eyebrow') || HERO_DEFAULTS.eyebrow,
      headline: document.getElementById('h-headline').value.replace(/\r/g, '') || HERO_DEFAULTS.headline,
      lede: document.getElementById('h-lede').value.trim() || HERO_DEFAULTS.lede,
      cta1Label: val('h-cta1') || HERO_DEFAULTS.cta1Label,
      cta2Label: val('h-cta2') || HERO_DEFAULTS.cta2Label,
      openLabel: val('h-openLabel') || HERO_DEFAULTS.openLabel,
      closeLabel: val('h-closeLabel') || HERO_DEFAULTS.closeLabel,
      closeTime: val('h-closeTime') || HERO_DEFAULTS.closeTime,
      image: val('h-image'), imageAlt: val('h-imageAlt')
    };

    data.nav = {
      special: val('t-nav-special') || 'Special', events: val('t-nav-events') || 'Events',
      menu: val('t-nav-menu') || 'Menu', gallery: val('t-nav-gallery') || 'Gallery',
      visit: val('t-nav-visit') || 'Visit', callToOrder: val('t-nav-call') || 'Call to Order',
      follow: val('t-nav-follow') || 'Follow'
    };
    data.specialUI = {
      badge: val('t-special-badge') || "★ Today's Special",
      orderLabel: val('t-special-order') || 'Order Ahead',
      alsoToday: val('t-special-also') || 'Also today:'
    };
    data.sections = {
      events: { eyebrow: val('t-ev-eyebrow') || TEXT_DEFAULTS.sections.events.eyebrow, title: val('t-ev-title') || TEXT_DEFAULTS.sections.events.title, cta: val('t-ev-cta') || TEXT_DEFAULTS.sections.events.cta },
      menu: { eyebrow: val('t-menu-eyebrow') || TEXT_DEFAULTS.sections.menu.eyebrow, title: val('t-menu-title') || TEXT_DEFAULTS.sections.menu.title, allLabel: val('t-menu-all') || TEXT_DEFAULTS.sections.menu.allLabel, printLabel: val('t-menu-print') || TEXT_DEFAULTS.sections.menu.printLabel, note: val('t-menu-note') || TEXT_DEFAULTS.sections.menu.note },
      gallery: { eyebrow: val('t-gal-eyebrow') || TEXT_DEFAULTS.sections.gallery.eyebrow, title: val('t-gal-title') || TEXT_DEFAULTS.sections.gallery.title },
      visit: { title: val('t-visit-title'), directionsLabel: val('t-visit-dir'), callLabel: val('t-visit-call'), mapStar: val('t-map-star'), mapText: val('t-map-text') },
      footer: { tagline: val('t-foot-tag') }
    };
    data.bottomNav = {
      menu: val('t-bn-menu'), call: val('t-bn-call'),
      events: val('t-bn-events'), location: val('t-bn-location'), skip: val('t-skip')
    };
    data.siteMeta = {
      description: val('t-meta-desc'), ogTitle: val('t-og-title'), ogDescription: val('t-og-desc'),
      titleSuffix: (state.siteMeta || {}).titleSuffix || '— Cedar Hollow'
    };

    return data;
  }

  /* ---------- Actions ---------- */
  function preview() {
    var data = collect();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      state = data;
      toast('Saved to preview. Open the storefront to see it live.');
    } catch (e) {
      toast('Preview failed: storage blocked.');
    }
  }

  function exportJson(preCollected) {
    var data = preCollected || collect();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); state = data; } catch (e) { /* non-fatal */ }
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    toast('data.json downloaded. Replace the site file to publish.');
  }

  /* ---------- Git Auto-Save via Netlify Function ---------- */
  async function publishViaGit(btn) {
    var data;
    try {
      data = collect();
    } catch (e) {
      toast('Publish failed: could not collect form data.', 'error');
      return;
    }
    var jsonString = JSON.stringify(data, null, 2);
    try { localStorage.setItem(STORAGE_KEY, jsonString); state = data; } catch (e) { /* non-fatal */ }

    var origText = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = 'Publishing...'; }

    try {
      var res = await fetch('/.netlify/functions/update-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: 'data.json', content: jsonString, message: 'Update via Admin Panel' })
      });
      var text = await res.text();
      var payload = {};
      try { payload = JSON.parse(text); } catch (e) { /* keep raw */ }
      if (!res.ok || payload.success !== true) {
        throw new Error((payload && payload.error) || ('Publish failed (' + res.status + ')'));
      }
      // SUCCESS ONLY: green toast, re-enable in finally. No download.
      toast('✅ Published! Site updating in background (~15s)', 'success');
    } catch (err) {
      // FAILURE ONLY: red toast, then local fallback so no work is lost.
      toast('Publish failed: ' + (err && err.message ? err.message : err), 'error');
      try { exportJson(data); } catch (e) { /* ignore */ }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = origText; }
    }
  }

  function resetAll() {
    if (!confirm('Discard preview edits and reload from data.json?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* ignore */ }
    location.reload();
  }

  /* ---------- Tabs ---------- */
  function initTabs() {
    var btns = document.querySelectorAll('.tab-btn');
    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        btns.forEach(function (b) { b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false'); });
        document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('is-active'); });
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        document.getElementById('tab-' + btn.getAttribute('data-tab')).classList.add('is-active');
      });
    });
  }

  /* ---------- Delegated add/remove (state-first so inputs persist) ---------- */
  function initEditorActions() {
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (!(t instanceof HTMLElement)) return;

      // Sync DOM edits into state first, then mutate + re-render
      var syncFirst = t.hasAttribute('data-add-item') || t.hasAttribute('data-del-item') ||
        t.hasAttribute('data-del-cat') || t.id === 'btn-add-cat' ||
        t.hasAttribute('data-del-event') || t.id === 'btn-add-event' ||
        t.hasAttribute('data-del-photo') || t.id === 'btn-add-photo' ||
        t.hasAttribute('data-del-special') || t.id === 'btn-add-special';
      if (syncFirst) state = collect();

      if (t.hasAttribute('data-add-item')) {
        state.menuCategories[+t.getAttribute('data-add-item')].items.push({ name: '', price: '', description: '', image: '' });
        renderMenuEditor(state.menuCategories);
      } else if (t.hasAttribute('data-del-item')) {
        var parts = t.getAttribute('data-del-item').split(':');
        state.menuCategories[+parts[0]].items.splice(+parts[1], 1);
        renderMenuEditor(state.menuCategories);
      } else if (t.hasAttribute('data-del-cat')) {
        state.menuCategories.splice(+t.getAttribute('data-del-cat'), 1);
        renderMenuEditor(state.menuCategories);
      } else if (t.id === 'btn-add-cat') {
        state.menuCategories.push({ id: 'new-cat', name: 'New Category', items: [] });
        renderMenuEditor(state.menuCategories);
      } else if (t.hasAttribute('data-del-event')) {
        state.events.splice(+t.getAttribute('data-del-event'), 1);
        renderEventsEditor(state.events);
      } else if (t.id === 'btn-add-event') {
        state.events.push({ title: '', date: '', description: '' });
        renderEventsEditor(state.events);
      } else if (t.hasAttribute('data-del-photo')) {
        state.gallery.splice(+t.getAttribute('data-del-photo'), 1);
        renderGalleryEditor(state.gallery);
      } else if (t.id === 'btn-add-photo') {
        state.gallery = state.gallery || [];
        state.gallery.push({ src: '', alt: '' });
        renderGalleryEditor(state.gallery);
      } else if (t.hasAttribute('data-del-special')) {
        state.specials.splice(+t.getAttribute('data-del-special'), 1);
        renderSpecialsEditor(state.specials);
      } else if (t.id === 'btn-add-special') {
        state.specials = state.specials || [];
        state.specials.push({ id: 'sp-' + Date.now().toString(36), headline: 'New Special', sub: '', priceLabel: '', description: '', tag: '', image: '', imageAlt: '', showOnWebsite: true, days: DAY_OPTS.slice(), start: '11:00', end: '21:00', flyerId: '', sort: state.specials.length });
        renderSpecialsEditor(state.specials);
      }
      if (syncFirst) renderPrintPreview();
    });
    document.getElementById('f-logo').addEventListener('input', function () { updateLogoPreview(); renderPrintPreview(); });
    document.getElementById('f-name').addEventListener('input', function () { updateAdminTitle(this.value); });
    // Broken logo file -> hide preview instead of broken-icon (C2)
    var logoPrev = document.getElementById('logo-preview');
    if (logoPrev) {
      logoPrev.addEventListener('error', function () {
        logoPrev.removeAttribute('src');
        logoPrev.style.display = 'none';
        console.warn('[admin] logo not found:', document.getElementById('f-logo').value);
      });
    }
    // Live print preview as any field changes
    document.querySelector('.admin-wrap').addEventListener('input', function () { renderPrintPreview(); });
    document.getElementById('btn-preview').addEventListener('click', preview);
    document.getElementById('btn-export').addEventListener('click', function () { publishViaGit(this); });
    document.getElementById('btn-reset').addEventListener('click', resetAll);
    var doPrint = function () { state = collect(); renderPrintPreview(); window.print(); };
    var bp = document.getElementById('btn-print-preview');
    if (bp) bp.addEventListener('click', doPrint);
    var ba = document.getElementById('btn-print-admin');
    if (ba) ba.addEventListener('click', doPrint);
  }

  /* ---------- Helpers ---------- */
  function val(id) { return document.getElementById(id).value.trim(); }
  function setVal(id, v) { document.getElementById(id).value = v || ''; }
  function escAttr(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function toast(msg, type) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    // type: 'info' (default accent) | 'success' (green) | 'error' (red)
    if (type === 'success') {
      el.style.background = '#1a7f37';
      el.style.color = '#fff';
    } else if (type === 'error') {
      el.style.background = '#b42318';
      el.style.color = '#fff';
    } else {
      el.style.background = '';
      el.style.color = '';
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, type === 'success' ? 5000 : 3200);
  }

  /* ---------- Boot ---------- */
  async function init() {
    initTabs();
    initEditorActions();
    try {
      state = await loadData();
    } catch (err) {
      toast('Error: ' + err.message);
      return;
    }
    state.gallery = state.gallery || [];
    // Stage 3: never drop templates when exporting from stale LocalStorage
    if (!Array.isArray(state.flyerTemplates)) state.flyerTemplates = [];
    if (!state.flyerLastUsed) state.flyerLastUsed = {};
    // Migrate legacy single special -> scheduled list
    if (!Array.isArray(state.specials)) {
      if (state.dailySpecial && (state.dailySpecial.title || state.dailySpecial.text)) {
        var ds = state.dailySpecial;
        state.specials = [{
          id: 'sp-legacy', headline: ds.text || ds.title || 'Special',
          title: ds.title, sub: ds.text || '', text: ds.text || '',
          priceLabel: ds.price || '', price: ds.price || '',
          description: ds.description || '', tag: ds.tag || '',
          image: ds.image || '', imageAlt: ds.imageAlt || ds.title || '',
          showOnWebsite: true, days: DAY_OPTS.slice(), start: '11:00', end: '21:00', flyerId: '', sort: 0
        }];
      } else state.specials = [];
    }
    fillInfo(state.businessInfo);
    fillHero(state.hero);
    renderMenuEditor(state.menuCategories);
    renderSpecialsEditor(state.specials);
    renderEventsEditor(state.events);
    renderGalleryEditor(state.gallery);
    fillSiteText(state);
    renderPrintPreview();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
