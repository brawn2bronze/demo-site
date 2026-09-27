/* ============================================================
   app.js — storefront data layer + renderers
   Stage 1: reads LocalStorage -> data.json -> hardcoded fallback
   Stage 2+: admin.html will write to LocalStorage + export data.json
   Swap to live backend later: replace DataStore.load() with fetch(API_URL)
   ============================================================ */
(function () {
  'use strict';

  var STORAGE_KEY = 'rustic_data_v1';
  var DATA_URL = 'data.json'; // created in Stage 2

  /* Hardcoded fallback — mirrors data.json so first paint works offline */
  var DEFAULT_DATA = {
    businessInfo: {
      name: "Joe's Kitchen",
      tagline: 'Bar & Grill',
      logo: 'assets/logo/logo.png',
      logoAlt: 'joes kitchen',
      phone: '(555) 123-4567',
      phoneHref: 'tel:+15551234567',
      address: '1420 Route 9, Cedar Hollow, ST 74012',
      directionsUrl: 'https://maps.google.com/?q=1420+Route+9+Cedar+Hollow',
      hoursShort: 'Tue–Sun • 11am–9pm',
      social: { facebook: '', instagram: '', twitter: '', tiktok: '' },
      hours: [
        { days: 'Tue–Thu', time: '11am – 9pm' },
        { days: 'Fri–Sat', time: '11am – 10pm' },
        { days: 'Sun', time: '12pm – 8pm' },
        { days: 'Mon', time: 'Closed' }
      ]
    },
    menuCategories: [
      { id: 'grill', name: 'Off the Grill', items: [
        { name: 'TRIPLE Smash Burger', price: '$15.99', description: 'Three smashed patties, cheddar, pickles, house sauce, toasted bun.', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=65&auto=format&fit=crop' },
        { name: 'Fire-Grilled Skewers', price: '$14.49', description: 'Marinated sirloin + peppers, charred over oak, chimichurri.', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&q=65&auto=format&fit=crop' }
      ] },
      { id: 'smoke', name: 'Smokehouse', items: [
        { name: 'Brisket Plate', price: '$16.99', description: '12-hour oak-smoked brisket, slaw, pickles, Texas toast.', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&q=65&auto=format&fit=crop' },
        { name: 'Half Rack Ribs', price: '$18.99', description: 'Dry-rubbed, slow-smoked, finished with burnt-end glaze.', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=65&auto=format&fit=crop' }
      ] },
      { id: 'sides', name: 'Sides', items: [
        { name: 'Loaded Camp Fries', price: '$7.99', description: 'Cheese sauce, bacon jam, jalapeño, scallion, ranch drizzle.', image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=65&auto=format&fit=crop' },
        { name: 'Skillet Cornbread', price: '$5.49', description: 'Honey butter, cast-iron baked to order.', image: '' }
      ] },
      { id: 'drinks', name: 'Drinks & Pours', items: [
        { name: 'Blackberry Bourbon Smash', price: '$9.00', description: 'House-infused blackberry, bourbon, lemon, soda. Zero-proof avail.', image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&q=65&auto=format&fit=crop' },
        { name: 'Draft + Cans', price: '$5–$7', description: "Rotating local drafts and ice-cold cans. Ask what's pouring.", image: '' }
      ] }
    ],
    dailySpecial: {
      title: 'Smoked Brisket Plate — $16.99',
      text: '12-hour smoked brisket, slaw, pickles & Texas toast',
      price: '$16.99',
      description: '12-hour smoked brisket, slaw, pickles & Texas toast. While it lasts.',
      tag: 'Dine-in & Takeout',
      image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=70&auto=format&fit=crop',
      imageAlt: 'Smoked Brisket Plate'
    },
    specials: [
      { id: 'sp-brisket', headline: 'Smoked Brisket Plate', title: 'Smoked Brisket Plate — $16.99', sub: '12-hour smoked brisket, slaw, pickles & Texas toast', text: '12-hour smoked brisket, slaw, pickles & Texas toast', priceLabel: '$16.99', price: '$16.99', description: '12-hour smoked brisket, slaw, pickles & Texas toast. While it lasts.', tag: 'Dine-in & Takeout', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&q=70&auto=format&fit=crop', imageAlt: 'Smoked Brisket Plate', showOnWebsite: true, days: ['Sat'], start: '11:00', end: '21:00', sort: 0, flyerStyle: null }
    ],
    hero: {
      eyebrow: 'Cedar Hollow • Est. 2012 • Farm to Table',
      headline: 'Great Food,\nAwesome People,\nPerfect Way to Spend the Day!',
      lede: 'Smoked brisket, smash burgers & pie. Family-owned bar & grill off Route 9.',
      cta1Label: 'View Menu',
      cta2Label: 'Hours & Directions',
      openLabel: 'Open today',
      closeLabel: 'Kitchen closes',
      closeTime: '8:30pm',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&q=70&auto=format&fit=crop',
      imageAlt: 'Smoked meats over fire'
    },
    siteMeta: {
      description: "Joe's Kitchen — Farm-to-table bar & grill. Burgers, smoked meats, cold drinks. Open Tue–Sun in Cedar Hollow.",
      ogTitle: "Joe'sKitchen | Bar & Grill",
      ogDescription: "Today's special, full menu, hours & directions.",
      titleSuffix: '— Cedar Hollow'
    },
    nav: { special: 'Special', events: 'Events', menu: 'Menu', gallery: 'Gallery', visit: 'Visit', callToOrder: 'Call to Order', follow: 'Follow' },
    specialUI: { badge: "★ Today's Special", orderLabel: 'Order Ahead', alsoToday: 'Also today' },
    sections: {
      events: { eyebrow: 'Happenings', title: 'Events', cta: 'Ask About Tonight' },
      menu: { eyebrow: 'Our Menu', title: 'Simple. Hearty. Made Fresh.', allLabel: 'All', printLabel: 'Print Menu', note: 'Full menu at the counter — daily pies sell out.' },
      gallery: { eyebrow: 'The Place', title: 'Where Memories Are Made' },
      visit: { title: 'Find Us', directionsLabel: 'Get Directions', callLabel: 'Call / Order', mapStar: '★', mapText: "Route 9 • 2 mi past Miller's Barn<br />Big gravel lot — look for the smoke" },
      footer: { tagline: 'Family-owned since 2012. Good food, honest pours.' }
    },
    bottomNav: { menu: 'Menu', call: 'Call / Order', events: 'Events', location: 'Location', skip: 'Skip to menu' },
    events: [
      { title: "Friday Night Pickin'", date: 'Fridays • 7pm', description: 'Local bluegrass on the patio. No cover.' },
      { title: 'Trivia Tuesday', date: 'Tuesdays • 6:30pm', description: 'Teams of up to 6. Winner eats free.' }
    ],
    gallery: []
  };

  /* ---------- DataStore: single seam for future backend ---------- */
  var DataStore = {
    async load() {
      // 1) Admin preview / saved edits (instant, offline)
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) return JSON.parse(raw);
      } catch (e) { /* storage unavailable — continue */ }

      // 2) Static JSON (Stage 2 file, or real API later via fetch)
      try {
        var res = await fetch(DATA_URL, { cache: 'no-store' });
        if (res.ok) return await res.json();
      } catch (e) { /* file missing / offline — fall through */ }

      // 3) Hardcoded fallback so first paint always works
      return DEFAULT_DATA;
    },
    // Future: async save(data) { await fetch('/api/data', {method:'POST', body: JSON.stringify(data)}) }
  };

  /* ---------- Specials: time-scheduled rotation (hybrid with flyer templates) ---------- */
  var DAY_KEYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  function toMinutes(t) {
    var m = /^(\d{1,2}):(\d{2})/.exec(String(t || ''));
    if (!m) return null;
    return (+m[1]) * 60 + (+m[2]);
  }
  function activeSpecials(data, now) {
    now = now || new Date();
    var list = (data && data.specials) || [];
    // Legacy migration: single dailySpecial -> one always-on entry
    if (!list.length && data && data.dailySpecial) {
      list = [Object.assign({ id: 'legacy', showOnWebsite: true, days: DAY_KEYS.slice(), start: '', end: '', sort: 0 }, data.dailySpecial)];
    }
    var dow = DAY_KEYS[now.getDay()];
    var mins = now.getHours() * 60 + now.getMinutes();
    return list
      .filter(function (s) { return s && s.showOnWebsite !== false && (s.title || s.headline); })
      .filter(function (s) { return !s.days || !s.days.length || s.days.indexOf(dow) !== -1; })
      .filter(function (s) {
        var a = toMinutes(s.start), b = toMinutes(s.end);
        if (a === null || b === null) return true;
        if (b <= a) return mins >= a || mins < b; // overnight window
        return mins >= a && mins < b;
      })
      .sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });
  }
  /* ---------- Specials browser: view any day (default = today) ---------- */
  var BROWSER_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var browserDay = null; // null = today, else a DAY_KEYS entry
  var browserData = null;

  function specialsForDay(data, dayKey, now) {
    now = now || new Date();
    var list = (data && data.specials) || [];
    if (!list.length && data && data.dailySpecial) {
      list = [Object.assign({ id: 'legacy', showOnWebsite: true, days: DAY_KEYS.slice(), start: '', end: '', sort: 0 }, data.dailySpecial)];
    }
    var isToday = !dayKey || dayKey === DAY_KEYS[now.getDay()];
    var target = dayKey || DAY_KEYS[now.getDay()];
    var mins = now.getHours() * 60 + now.getMinutes();
    return list
      .filter(function (s) { return s && s.showOnWebsite !== false && (s.title || s.headline); })
      .filter(function (s) { return !s.days || !s.days.length || s.days.indexOf(target) !== -1; })
      .filter(function (s) {
        if (!isToday) return true; // browsing another day: show full lineup regardless of time
        var a = toMinutes(s.start), b = toMinutes(s.end);
        if (a === null || b === null) return true;
        if (b <= a) return mins >= a || mins < b;
        return mins >= a && mins < b;
      })
      .sort(function (a, b) { return (a.sort || 0) - (b.sort || 0); });
  }

  var FLYER_FONTS = {
    'system': 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    'serif': 'Georgia, "Times New Roman", serif',
    'display': 'Impact, "Arial Black", system-ui, sans-serif',
    'sans-bold': 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    'script': '"Brush Script MT", "Segoe Script", cursive'
  };
  function applyFlyerStyleToCard(s) {
    var card = document.getElementById('daily-special');
    if (!card) return;
    var st = s && s.flyerStyle;
    // Clear previous kicker line
    var oldKick = document.getElementById('special-kicker');
    if (oldKick) oldKick.remove();
    if (!st) {
      card.classList.remove('flyer-styled');
      card.removeAttribute('data-theme');
      card.removeAttribute('data-pattern');
      ['--flyer-accent', '--flyer-bg-start', '--flyer-bg-end', '--flyer-ink', '--flyer-frame-color', '--flyer-head-color', '--flyer-sub-color', '--flyer-price-color', '--flyer-head-size', '--flyer-sub-size', '--flyer-price-size', '--flyer-pattern-opacity'].forEach(function (k) { card.style.removeProperty(k); });
      card.style.removeProperty('border-width');
      card.style.removeProperty('border-radius');
      card.style.removeProperty('border-style');
      card.style.removeProperty('text-align');
      card.style.removeProperty('font-family');
      var t0 = document.getElementById('special-title');
      if (t0) { t0.style.removeProperty('font-size'); t0.style.removeProperty('color'); t0.style.removeProperty('font-family'); }
      var img0 = document.getElementById('special-image');
      if (img0) { img0.style.removeProperty('border-radius'); img0.style.removeProperty('width'); img0.style.removeProperty('height'); img0.style.removeProperty('margin'); }
      return;
    }
    card.classList.add('flyer-styled');
    card.setAttribute('data-theme', st.theme || 'chalk');
    card.setAttribute('data-pattern', st.pattern || 'none');
    var setOrDrop = function (k, v) { if (v) card.style.setProperty(k, v); else card.style.removeProperty(k); };
    setOrDrop('--flyer-accent', st.accent);
    setOrDrop('--flyer-bg-start', st.bgStart);
    setOrDrop('--flyer-bg-end', st.bgEnd);
    setOrDrop('--flyer-ink', st.bgInk);
    setOrDrop('--flyer-frame-color', st.frameColor);
    setOrDrop('--flyer-head-color', st.fontHeadColor);
    setOrDrop('--flyer-sub-color', st.fontSubColor);
    setOrDrop('--flyer-price-color', st.fontPriceColor);
    setOrDrop('--flyer-head-size', st.fontHeadSize ? (st.fontHeadSize + 'px') : '');
    setOrDrop('--flyer-sub-size', st.fontSubSize ? (st.fontSubSize + 'px') : '');
    setOrDrop('--flyer-price-size', st.fontPriceSize ? (st.fontPriceSize + 'px') : '');
    setOrDrop('--flyer-pattern-opacity', (st.patternOpacity != null ? String((st.patternOpacity || 0) / 100) : ''));
    if (st.align) card.style.textAlign = (st.align === 'left' ? 'left' : 'center');
    if (st.font && FLYER_FONTS[st.font]) card.style.fontFamily = FLYER_FONTS[st.font];
    else card.style.removeProperty('font-family');
    // Frame: style + width + radius map to card border
    var fw = (st.frameWidth != null ? st.frameWidth : 0);
    if (st.frameStyle && st.frameStyle !== 'none' && fw > 0) {
      card.style.borderStyle = (st.frameStyle === 'double' || st.frameStyle === 'dashed' || st.frameStyle === 'dotted') ? st.frameStyle : 'solid';
      card.style.borderWidth = fw + 'px';
      card.style.borderRadius = ((st.frameRadius != null ? st.frameRadius : 10)) + 'px';
    } else {
      card.style.removeProperty('border-width');
      card.style.removeProperty('border-style');
    }
    // Kicker line (flyer top label) injected above title
    if (st.kicker) {
      var titleEl = document.getElementById('special-title');
      if (titleEl) {
        var k = document.createElement('div');
        k.id = 'special-kicker';
        k.textContent = st.kicker;
        k.setAttribute('style', 'font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-size:.78rem;opacity:.85;margin-bottom:.3rem;');
        titleEl.parentNode.insertBefore(k, titleEl);
      }
    }
    // Photo shape
    var img = document.getElementById('special-image');
    if (img && st.photoShape) {
      if (st.photoShape === 'circle') { img.style.borderRadius = '50%'; img.style.width = '200px'; img.style.height = '200px'; img.style.margin = '0 auto'; }
      else if (st.photoShape === 'banner') { img.style.borderRadius = '0'; }
      else { img.style.borderRadius = '10px'; }
    }
  }
  function paintSpecial(s) {
    var badge = document.getElementById('special-badge');
    var title = document.getElementById('special-title');
    var desc = document.getElementById('special-desc');
    var tag = document.getElementById('special-tag');
    var img = document.getElementById('special-image');
    var label = (s.headline && s.priceLabel) ? s.headline + ' — ' + s.priceLabel : (s.title || s.headline || '');
    if (title) {
      title.textContent = label;
      // Per-element flyer sizes/colors win over theme when present
      var st = s.flyerStyle || null;
      if (st && st.fontHeadSize) title.style.fontSize = st.fontHeadSize + 'px';
      else if (title) title.style.removeProperty('font-size');
      if (st && st.fontHeadColor) title.style.color = st.fontHeadColor;
      else if (title) title.style.removeProperty('color');
    }
    if (desc) {
      desc.textContent = s.description || s.sub || '';
      var std = s.flyerStyle || null;
      if (std && std.fontSubSize) desc.style.fontSize = std.fontSubSize + 'px';
      else desc.style.removeProperty('font-size');
      if (std && std.fontSubColor) desc.style.color = std.fontSubColor;
      else desc.style.removeProperty('color');
    }
    // Badge prefers flyer sticker, falls back to specialUI badge
    if (badge) {
      var stB = s.flyerStyle || null;
      if (stB && stB.badge) badge.textContent = stB.badge;
      else if (specialBadgeDefault) badge.textContent = specialBadgeDefault;
    }
    if (tag) tag.textContent = s.tag || '';
    if (img) {
      if (s.image) { img.src = s.image; img.style.display = ''; }
      else { img.removeAttribute('src'); img.style.display = 'none'; }
      img.alt = s.imageAlt || s.title || s.headline || 'Today’s special';
    }
    applyFlyerStyleToCard(s);
  }
  function renderDailySpecial(data, now) {
    browserData = data;
    now = now || new Date();
    var section = document.getElementById('special');
    var todayKey = DAY_KEYS[now.getDay()];
    var effDay = browserDay || todayKey;
    var act = specialsForDay(data, effDay, now);
    if (!act.length) {
      // No specials for this day: if browsing, show empty state with context; if today, hide section
      if (browserDay && browserDay !== todayKey) {
        if (section) section.style.display = '';
        paintSpecial({ headline: 'No specials this day', title: 'No specials this day', sub: '', description: 'Nothing scheduled for ' + effDay + '. Try another day.', tag: '', image: '', showOnWebsite: true });
        var w0 = document.getElementById('also-today');
        if (w0) w0.hidden = true;
        renderSpecialsBrowser(now);
        return;
      }
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = '';
    paintSpecial(act[0]);
    var wrap = document.getElementById('also-today');
    var list = document.getElementById('also-today-list');
    var lbl = document.getElementById('also-today-label');
    if (wrap && list) {
      if (act.length > 1) {
        var uiAlso = (data && data.specialUI && data.specialUI.alsoToday) || 'Also today:';
        if (lbl) lbl.textContent = uiAlso;
        list.textContent = act.slice(1).map(function (s) { return s.headline || s.title; }).join(' • ');
        wrap.hidden = false;
      } else wrap.hidden = true;
    }
    renderSpecialsBrowser(now);
  }

  function renderSpecialsBrowser(now) {
    now = now || new Date();
    var bar = document.getElementById('special-browser');
    var days = document.getElementById('sp-days');
    var ctx = document.getElementById('sp-context');
    if (!bar || !days || !browserData) return;
    var all = (browserData.specials || []).filter(function (s) { return s && s.showOnWebsite !== false; });
    if (all.length <= 1 && !browserDay) { bar.hidden = true; if (ctx) ctx.hidden = true; return; }
    bar.hidden = false;
    var todayKey = DAY_KEYS[now.getDay()];
    var effDay = browserDay || todayKey;
    var chips = [{ key: null, label: 'Today' }].concat(BROWSER_DAYS.map(function (d) { return { key: d, label: d }; }));
    days.innerHTML = '';
    chips.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sp-day' + (((c.key || todayKey) === effDay) ? ' is-active' : '');
      b.textContent = c.label;
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', ((c.key || todayKey) === effDay) ? 'true' : 'false');
      b.addEventListener('click', function () {
        browserDay = c.key;
        renderDailySpecial(browserData, new Date());
      });
      days.appendChild(b);
    });
    if (ctx) {
      if (browserDay && browserDay !== todayKey) {
        ctx.hidden = false;
        ctx.innerHTML = '';
        var span = document.createElement('span');
        span.textContent = 'Showing ' + effDay + ' lineup — ';
        var back = document.createElement('button');
        back.type = 'button';
        back.textContent = 'Back to today';
        back.addEventListener('click', function () { browserDay = null; renderDailySpecial(browserData, new Date()); });
        ctx.appendChild(span);
        ctx.appendChild(back);
      } else { ctx.hidden = true; ctx.innerHTML = ''; }
    }
  }

  function initSpecialsArrows() {
    var prev = document.getElementById('sp-prev');
    var next = document.getElementById('sp-next');
    var step = function (dir) {
      var now = new Date();
      var todayKey = DAY_KEYS[now.getDay()];
      var eff = browserDay || todayKey;
      var ix = BROWSER_DAYS.indexOf(eff);
      if (ix === -1) ix = BROWSER_DAYS.indexOf(todayKey);
      ix = (ix + dir + BROWSER_DAYS.length) % BROWSER_DAYS.length;
      var target = BROWSER_DAYS[ix];
      browserDay = (target === todayKey) ? null : target;
      if (browserData) renderDailySpecial(browserData, new Date());
    };
    if (prev) prev.addEventListener('click', function () { step(-1); });
    if (next) next.addEventListener('click', function () { step(1); });
  }

  function renderBusinessInfo(data) {
    var b = (data && data.businessInfo) || DEFAULT_DATA.businessInfo;
    var set = function (id, val) { var el = document.getElementById(id); if (el && val) el.textContent = val; };

    // Name + tagline -> every visible brand spot + tab title (fixes "name change does nothing")
    if (b.name) {
      set('brand-name', b.name);
      set('footer-brand', b.name);
      set('footer-copy-name', b.name);
      var brandLink = document.querySelector('.brand');
      if (brandLink) brandLink.setAttribute('aria-label', b.name + ' home');
    }
    if (b.tagline) set('brand-tagline', b.tagline);
    // Logo: image path from Admin replaces ♨ placeholder; empty keeps fallback
    var logoImg = document.getElementById('brand-logo');
    var logoFallback = document.getElementById('brand-mark-fallback');
    if (logoImg) {
      // Broken file -> restore ♨ instead of broken-icon (C2)
      logoImg.onerror = function () {
        console.warn('[storefront] logo not found:', logoImg.getAttribute('src'));
        logoImg.removeAttribute('src');
        logoImg.setAttribute('hidden', '');
        if (logoFallback) logoFallback.style.display = '';
      };
      if (b.logo) {
        logoImg.src = b.logo;
        logoImg.alt = b.logoAlt || b.name || 'Restaurant logo';
        logoImg.removeAttribute('hidden');
        if (logoFallback) logoFallback.style.display = 'none';
      } else {
        logoImg.removeAttribute('src');
        logoImg.setAttribute('hidden', '');
        if (logoFallback) logoFallback.style.display = '';
      }
    }
    // Print header (text-only + logo)
    var pl = document.getElementById('print-logo');
    if (pl) {
      pl.onerror = function () {
        console.warn('[storefront] print logo not found:', pl.getAttribute('src'));
        pl.removeAttribute('src');
        pl.style.display = 'none';
      };
      if (b.logo) { pl.src = b.logo; pl.alt = b.logoAlt || b.name || 'Logo'; pl.style.display = 'block'; }
      else { pl.removeAttribute('src'); pl.style.display = 'none'; }
    }
    set('print-name', b.name);
    set('print-tagline', b.tagline);
    var pc = document.getElementById('print-contact');
    if (pc) {
      pc.textContent = [b.address, b.phone, b.hoursShort].filter(Boolean).join(' • ');
    }
    if (b.name || b.tagline) {
      var title = b.name || document.title;
      if (b.name && b.tagline) title = b.name + ' | ' + b.tagline;
      document.title = title;
      var og = document.querySelector('meta[property="og:title"]');
      if (og) og.setAttribute('content', title);
    }

    set('today-hours', b.hoursShort);
    set('business-phone', b.phone);
    set('footer-phone', b.phone);
    // All call buttons (topbar, hero, bottom nav) follow phoneHref
    if (b.phoneHref) {
      document.querySelectorAll('a[href^="tel:"]').forEach(function (a) {
        a.setAttribute('href', b.phoneHref);
      });
    }
    var topCall = document.querySelector('.topbar-call');
    if (topCall && b.phone) topCall.textContent = b.phone;
    var dir = document.getElementById('directions-link');
    if (dir && b.directionsUrl) dir.setAttribute('href', b.directionsUrl);
    var addr = document.getElementById('business-address');
    if (addr && b.address) {
      // Preserve phone link inside address block
      var phoneHtml = b.phone
        ? '<br /><a href="' + (b.phoneHref || '#') + '">' + escapeHtml(b.phone) + '</a>'
        : '';
      // Only rewrite if address differs (keeps no-JS fallback intact otherwise)
      addr.innerHTML = escapeHtml(b.address) + phoneHtml;
    }
    // Stage 2: dynamic hours list (keeps static fallback if no data)
    var hoursBox = document.getElementById('business-hours');
    if (hoursBox && b.hours && b.hours.length) {
      hoursBox.innerHTML = b.hours.map(function (h) {
        return '<div><span>' + escapeHtml(h.days) + '</span><span>' + escapeHtml(h.time) + '</span></div>';
      }).join('');
    }
    // Social: only visible if added in admin
    var soc = b.social || {};
    var anySocial = !!(soc.facebook || soc.instagram || soc.twitter || soc.tiktok);
    var link = function (id, url) {
      var el = document.getElementById(id);
      if (!el) return;
      if (url) { el.href = url; el.hidden = false; }
      else { el.hidden = true; el.removeAttribute('href'); }
    };
    link('social-facebook', soc.facebook); link('social-instagram', soc.instagram);
    link('social-twitter', soc.twitter); link('social-tiktok', soc.tiktok);
    var row = document.getElementById('social-row');
    if (row) row.style.display = anySocial ? '' : 'none';
    var follow = document.getElementById('nav-follow');
    if (follow) follow.style.display = anySocial ? '' : 'none';
  }

  /* ---------- Stage 2: dynamic menu from data.json (fallback = static HTML) ---------- */
  function renderMenu(data) {    var grid = document.getElementById('menu-grid');
    var cats = data && data.menuCategories;
    if (!grid || !cats || !cats.length) return; // keep Stage 1 static cards
    grid.innerHTML = cats.map(function (cat) {
      return (cat.items || []).map(function (item) {
        var img = item.image
          ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '" loading="lazy" width="600" height="450" />'
          : '';
        return (
          '<article class="card" data-cat="' + escapeHtml(cat.id) + '">' + img +
          '<div class="card-body"><div class="card-row"><h3>' + escapeHtml(item.name) +
          '</h3><span class="price">' + escapeHtml(item.price) + '</span></div>' +
          '<p>' + escapeHtml(item.description) + '</p></div></article>'
        );
      }).join('');
    }).join('');
  }

  /* ---------- Hero (fully editable) ---------- */
  function renderHero(data) {
    var h = (data && data.hero) || null;
    if (!h) return; // keep static fallback
    var set = function (id, v) { var el = document.getElementById(id); if (el && v) el.textContent = v; };
    set('hero-eyebrow', h.eyebrow);
    set('hero-cta1', h.cta1Label);
    set('hero-cta2', h.cta2Label);
    set('hero-open-label', h.openLabel);
    set('hero-close-label', h.closeLabel);
    set('hero-close-time', h.closeTime);
    set('hero-lede', h.lede);
    var ti = document.getElementById('hero-title');
    if (ti && h.headline) {
      var lines = String(h.headline).split('\n').map(function (l) { return l.trim(); }).filter(Boolean);
      if (lines.length) {
        ti.innerHTML = lines.map(function (l, i) {
          var safe = escapeHtml(l);
          return i === lines.length - 1 ? '<span class="hl">' + safe + '</span>' : safe;
        }).join('<br />');
      }
    }
    var hi = document.getElementById('hero-image');
    if (hi && h.image) hi.src = h.image;
    if (hi && h.imageAlt) hi.alt = h.imageAlt;
  }

  var specialBadgeDefault = '';
  /* ---------- Site text: every label on index.html ---------- */
  function renderSiteText(data) {
    if (!data) return;
    specialBadgeDefault = (data.specialUI && data.specialUI.badge) || '';
    var set = function (id, v) { var el = document.getElementById(id); if (el && typeof v === 'string' && v) el.textContent = v; };
    var n = data.nav || {};
    set('nav-special', n.special); set('nav-events', n.events); set('nav-menu', n.menu);
    set('nav-gallery', n.gallery); set('nav-visit', n.visit);
    set('nav-call', n.callToOrder); set('nav-follow', n.follow);
    var sui = data.specialUI || {};
    set('special-badge', sui.badge); set('special-order', sui.orderLabel);
    var sec = data.sections || {};
    if (sec.events) { set('events-eyebrow', sec.events.eyebrow); set('events-title', sec.events.title); set('events-cta', sec.events.cta); }
    if (sec.menu) {
      set('menu-eyebrow', sec.menu.eyebrow); set('menu-title', sec.menu.title);
      set('chip-all', sec.menu.allLabel); set('btn-print-menu', sec.menu.printLabel);
      set('menu-note', sec.menu.note);
    }
    if (sec.gallery) { set('gallery-eyebrow', sec.gallery.eyebrow); set('gallery-title', sec.gallery.title); }
    if (sec.visit) {
      set('visit-title', sec.visit.title); set('directions-link', sec.visit.directionsLabel);
      set('visit-call', sec.visit.callLabel); set('map-star', sec.visit.mapStar);
      var mt = document.getElementById('map-text');
      if (mt && sec.visit.mapText) mt.innerHTML = sec.visit.mapText;
    }
    if (sec.footer) set('footer-tagline', sec.footer.tagline);
    var f = data.bottomNav || {};
    set('bn-menu', f.menu); set('bn-call', f.call); set('bn-events', f.events); set('bn-location', f.location);
    set('skip-link', f.skip);
    set('foot-menu', n.menu); set('foot-special', n.special); set('foot-events', n.events); set('foot-visit', n.visit);
    renderSiteMeta(data);
  }

  /* ---------- SiteMeta: apply data.json siteMeta fields to <head> ---------- */
  function renderSiteMeta(data) {
    var meta = (data && data.siteMeta) || {};
    var b = (data && data.businessInfo) || {};
    if (meta.description) { var md = document.querySelector('meta[name="description"]'); if (md) md.setAttribute('content', meta.description); }
    if (meta.ogDescription) { var ogd = document.querySelector('meta[property="og:description"]'); if (ogd) ogd.setAttribute('content', meta.ogDescription); }
    if (meta.ogTitle) { var ogt = document.querySelector('meta[property="og:title"]'); if (ogt) ogt.setAttribute('content', meta.ogTitle); }
    // Title wins over renderBusinessInfo: prefer explicit ogTitle, else name + suffix
    var suffix = meta.titleSuffix || '';
    if (meta.ogTitle) {
      document.title = suffix && meta.ogTitle.indexOf(suffix) === -1 ? meta.ogTitle + ' ' + suffix : meta.ogTitle;
    } else if (b.name) {
      var base = b.tagline ? b.name + ' | ' + b.tagline : b.name;
      document.title = suffix ? base + ' ' + suffix : base;
    }
  }

  /* ---------- Events: list/banner with date badges (not cards) ---------- */
  function renderEvents(data) {
    var list = document.getElementById('events-list');
    var section = document.getElementById('events');
    var events = data && data.events;
    if (!list) return;
    if (!events || !events.length) {
      // No events: hide section rather than show empty shell
      if (section) section.style.display = 'none';
      return;
    }
    if (section) section.style.display = '';
    list.innerHTML = events.map(function (ev) {
      if (!ev.title && !ev.description) return '';
      return '<li class="event-row">' +
        (ev.date ? '<span class="event-date">' + escapeHtml(ev.date) + '</span>' : '') +
        '<div class="event-body"><strong>' + escapeHtml(ev.title || 'Event') + '</strong>' +
        (ev.description ? '<p>' + escapeHtml(ev.description) + '</p>' : '') + '</div></li>';
    }).join('');
  }

  /* ---------- Gallery from data.json (fallback = static HTML) ---------- */
  function renderGallery(data) {
    var grid = document.getElementById('gallery-grid');
    var photos = data && data.gallery;
    if (!grid || !photos || !photos.length) return; // keep static fallback
    grid.innerHTML = photos.map(function (ph) {
      if (!ph.src) return '';
      return '<img src="' + escapeHtml(ph.src) + '" alt="' + escapeHtml(ph.alt || 'Restaurant photo') + '" loading="lazy" width="600" height="450" />';
    }).join('');
  }

  /* ---------- Menu filter chips (progressive enhancement) ---------- */
  function initMenuFilters() {
    var chips = document.querySelectorAll('.menu-filters .chip');
    if (!chips.length) return;
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) {
          c.classList.remove('is-active');
          c.setAttribute('aria-selected', 'false');
        });
        chip.classList.add('is-active');
        chip.setAttribute('aria-selected', 'true');
        var f = chip.getAttribute('data-filter');
        // Query live so Stage 2 re-rendered cards still filter
        document.querySelectorAll('#menu-grid .card').forEach(function (card) {
          var show = f === 'all' || card.getAttribute('data-cat') === f;
          card.classList.toggle('is-hidden', !show);
        });
      });
    });
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* ---------- Boot ---------- */
  async function init() {
    var year = document.getElementById('year');
    if (year) year.textContent = String(new Date().getFullYear());

    initMenuFilters();
    initSpecialsArrows();

    var printBtn = document.getElementById('btn-print-menu');
    if (printBtn) printBtn.addEventListener('click', function () { window.print(); });

    var data = await DataStore.load();
    renderSiteText(data);
    renderHero(data);
    renderDailySpecial(data);
    renderBusinessInfo(data);
    renderSiteMeta(data);
    renderMenu(data);
    renderEvents(data);
    renderGallery(data);

    // Expose for Stage 2 admin preview + console debugging
    window.RusticStore = { DataStore: DataStore, renderSiteText: renderSiteText, renderSiteMeta: renderSiteMeta, renderHero: renderHero, renderDailySpecial: renderDailySpecial, activeSpecials: activeSpecials, specialsForDay: specialsForDay, renderBusinessInfo: renderBusinessInfo, renderMenu: renderMenu, renderEvents: renderEvents, renderGallery: renderGallery };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
