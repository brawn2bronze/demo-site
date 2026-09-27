// netlify/functions/update-data.js — Modular Git auto-save (master template).
// Relies solely on Netlify Environment Variables. No hardcoded values.
// Env: GITHUB_TOKEN (required), GITHUB_OWNER (required), GITHUB_REPO (required), GITHUB_BRANCH (optional, default "main").
// Uses native Node 18+ fetch. No external npm packages.

'use strict';

var ALLOWED_FILES = ['data.json'];

function json(statusCode, obj) {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    },
    body: JSON.stringify(obj)
  };
}

function isSafeFilePath(filePath) {
  if (typeof filePath !== 'string' || !filePath) return false;
  if (filePath.indexOf('..') !== -1 || filePath.indexOf('\\') !== -1) return false;
  if (filePath.charAt(0) === '/' || filePath.charAt(0) === '.') return false;
  if (ALLOWED_FILES.indexOf(filePath) === -1) return false;
  return true;
}

exports.handler = async function (event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return json(200, { ok: true });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { success: false, error: 'Method not allowed. Use POST.' });
  }

  var TOKEN = process.env.GITHUB_TOKEN;
  var OWNER = process.env.GITHUB_OWNER;
  var REPO = process.env.GITHUB_REPO;
  var BRANCH = process.env.GITHUB_BRANCH || 'main';

  var missing = [];
  if (!TOKEN) missing.push('GITHUB_TOKEN');
  if (!OWNER) missing.push('GITHUB_OWNER');
  if (!REPO) missing.push('GITHUB_REPO');
  if (missing.length) {
    return json(500, { success: false, error: 'Server misconfigured: missing ' + missing.join(', ') });
  }

  var body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { success: false, error: 'Invalid JSON body.' });
  }

  var filePath = body.filePath;
  var content = body.content;
  var message = body.message || 'Update via Admin Panel';

  if (!isSafeFilePath(filePath)) {
    return json(400, {
      success: false,
      error: 'Invalid filePath. Allowed: ' + ALLOWED_FILES.join(', ')
    });
  }

  if (typeof content !== 'string' || !content.length) {
    return json(400, { success: false, error: 'Missing or empty "content" string.' });
  }

  // 1MB guard to avoid GitHub API rejection / abuse
  if (Buffer.byteLength(content, 'utf8') > 1024 * 1024) {
    return json(400, { success: false, error: 'Content too large (max 1MB).' });
  }

  // Validate content is JSON (data.json must stay valid)
  try {
    JSON.parse(content);
  } catch (e) {
    return json(400, { success: false, error: 'Content is not valid JSON: ' + e.message });
  }

  var headers = {
    Authorization: 'token ' + TOKEN,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'User-Agent': 'netlify-function-update-data'
  };

  var base = 'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + filePath;

  // 1) GET current sha
  var sha = null;
  try {
    var getRes = await fetch(base + '?ref=' + encodeURIComponent(BRANCH), { headers: headers });
    if (getRes.status === 404) {
      sha = null; // new file — PUT without sha creates it
    } else if (!getRes.ok) {
      var getText = await getRes.text();
      return json(502, { success: false, error: 'GitHub GET failed (' + getRes.status + '): ' + getText.slice(0, 500) });
    } else {
      var getData = await getRes.json();
      sha = getData.sha || null;
      if (!sha) {
        return json(502, { success: false, error: 'GitHub GET succeeded but returned no sha.' });
      }
    }
  } catch (e) {
    return json(502, { success: false, error: 'GitHub GET error: ' + e.message });
  }

  // 2) PUT updated file
  try {
    var putBody = {
      message: String(message),
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch: BRANCH
    };
    if (sha) putBody.sha = sha;

    var putRes = await fetch(base, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(putBody)
    });
    var putText = await putRes.text();
    if (!putRes.ok) {
      return json(502, { success: false, error: 'GitHub PUT failed (' + putRes.status + '): ' + putText.slice(0, 800) });
    }
    var putData = {};
    try { putData = JSON.parse(putText); } catch (e) { /* non-fatal */ }
    return json(200, {
      success: true,
      path: filePath,
      branch: BRANCH,
      commit: (putData.commit && putData.commit.sha) || null
    });
  } catch (e) {
    return json(500, { success: false, error: 'GitHub PUT error: ' + e.message });
  }
};
