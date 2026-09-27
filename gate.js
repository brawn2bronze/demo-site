/* gate.js — simple client-side password gate for admin.html + command-center.html
   WARNING: client-side only. Password is visible in view-source. This is a
   casual deterrent, NOT real security. For real protection, use server auth
   or hosting-level password protection. */
(function () {
  'use strict';
  var ADMIN_PASSWORD = 'webadmin123';
  var AUTH_KEY = 'rf_admin_auth';

  try {
    if (sessionStorage.getItem(AUTH_KEY) === '1') return;
  } catch (e) { /* storage unavailable — fall through to prompt */ }

  var attempt = window.prompt('Owner password:');
  if (attempt === ADMIN_PASSWORD) {
    try { sessionStorage.setItem(AUTH_KEY, '1'); } catch (e) {}
    return;
  }
  window.location.replace('index.html');
})();
