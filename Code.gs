/** Personal Space Sheet backend. GitHub Pages serves the interface.
 * Deploy this version to the existing owner-only web app to enable the authenticated relay.
 * Legacy keyed API remains available through its existing deployment.
 */

const SECRET = PropertiesService.getScriptProperties().getProperty('SECRET');
const SHEET_NAME = 'Log';
const HEADERS = ['Timestamp', 'Schema', 'Code', 'Details'];
const MAX_ROWS_RETURNED = 2000;
const DEDUPE_WINDOW = 60;

// Feed-ready API marker. Bump when the keyed contract gains actions or fields.
// Contract is additive-only: old clients keep working.
const API_VERSION = '2026-10-05';
const API_ACTIONS = ['list', 'add', 'status', 'ping'];
const TZ = 'America/New_York'; // JD's timezone; the dashboard derives state in ET.
const GRACE_MS = 30 * 60 * 1000; // matches the dashboard: 30 min past due stays "upcoming"

// Routine catalog. Mirrors index.html ITEMS so server-side status matches the
// dashboard exactly. id 1-7, days: 0=Sun..6=Sat, dueWd: deadline weekday for
// weekend-cycle items (cycle starts Saturday 00:00 ET).
const ROUTINE_ITEMS = [
  { id: 1, name: 'Water bottle',     days: [1,2,3,4,5], dueH: 23, dueM: 0 },
  { id: 2, name: 'Drink / snack',    days: [1,2,3,4,5], dueH: 23, dueM: 0 },
  { id: 3, name: 'Car charging',     days: [1,2,3,4,5], dueH: 23, dueM: 0 },
  { id: 4, name: 'Laundry started',  days: [0,6],       dueH: 12, dueM: 0, dueWd: 0 },
  { id: 5, name: 'Washed & dried',   days: [0,6],       dueH: null },
  { id: 6, name: 'Folded & put away',days: [0,6],       dueH: 21, dueM: 0, dueWd: 0 },
  { id: 7, name: 'Verse + takeaway', days: [0,1,2,3,4,5,6], dueH: 23, dueM: 0 }
];

function setup() {
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SECRET')) props.setProperty('SECRET', Utilities.getUuid() + Utilities.getUuid());
  getSheet_();
}

function doGet(e) {
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  const p = (e && e.parameter) || {};
  if (p.connect === '1') return connectionPage_();
  if (p.bridge === '1') return sheetBridge_();
  if (!p.action && !p.key) return dashboardPage_();
  try {
    if (!validDashboardKey_(p.key)) return out_({ ok: false, error: 'unauthorized' });
    const sh = getSheet_();
    if (p.action === 'add') return out_(addRow_(sh, p));
    if (p.action === 'list') return out_(listRows_(sh, p.since));
    if (p.action === 'status') return out_(statusFor_(sh, p));
    return out_({ ok: true, ping: true, api: API_VERSION, actions: API_ACTIONS });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  }
}

function addRow_(sh, p) {
  const t = String(p.t || '');
  const code = String(p.code || '');
  const schema = parseInt(p.schema, 10);

  if (!/^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/.test(t)) return { ok: false, error: 'bad timestamp' };
  if (!/^\d{1,40}$/.test(code)) return { ok: false, error: 'bad code' };
  if (!schema || schema < 1 || schema > 40) return { ok: false, error: 'bad schema' };

  let details = {};
  try { details = JSON.parse(p.notes || '{}'); } catch (_) { return {ok:false,error:'bad details'}; }
  if (!details || !Array.isArray(details.na || []) || JSON.stringify(details).length > 4000) return {ok:false,error:'bad details'};
  details = {na:(details.na || []).filter(function(id){return typeof id === 'string' && /^[a-z]+$/.test(id);}).slice(0,40)};
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const last = sh.getLastRow();
    if (last > 1) {
      const from = Math.max(2, last - DEDUPE_WINDOW + 1);
      const recent = sh.getRange(from, 1, last - from + 1, 1).getValues().map(function (r) { return toIso_(r[0]); });
      if (recent.indexOf(t) !== -1) return { ok: true, duplicate: true };
    }
    sh.appendRow([t, schema, code, JSON.stringify(details)]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function listRows_(sh, since) {
  const last = sh.getLastRow();
  if (last < 2) return { ok: true, rows: [] };
  const from = Math.max(2, last - MAX_ROWS_RETURNED + 1);
  const values = sh.getRange(from, 1, last - from + 1, 4).getValues();
  let rows = values
    .filter(function (r) { return r[0] !== '' && r[2] !== ''; })
    .map(function (r) { let details = {}; try { details = JSON.parse(r[3] || '{}'); } catch (_) {} return [toIso_(r[0]), Number(r[1]) || 0, String(r[2]), details]; });
  // Optional ISO-UTC lower bound keeps responses small for status checks.
  // toIso_ always emits the same UTC format, so lexicographic compare works.
  if (since && /^\d{4}-\d{2}-\d{2}T/.test(String(since))) {
    const s = String(since);
    rows = rows.filter(function (r) { return r[0] >= s; });
  }
  return { ok: true, rows: rows };
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.getRangeList(['A:A', 'C:C']).setNumberFormat('@');
    sh.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidth(1, 220);
    sh.setColumnWidth(3, 260);
  }
  if (sh.getRange(1, 4).getValue() !== 'Details') sh.getRange(1, 4).setValue('Details').setFontWeight('bold');
  return sh;
}

function toIso_(v) {
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Setup-free interface: create an additional Web app deployment with access
 * "Only myself", execute as Me. Open that deployment URL on each device.
 * Keep the existing keyed deployment for existing GitHub Pages connections.
 */
function requireDashboardOwner_() {
  const active = Session.getActiveUser().getEmail();
  const owner = Session.getEffectiveUser().getEmail();
  if (!active || !owner || active.toLowerCase() !== owner.toLowerCase())
    throw new Error('Sign in as the Sheet owner to use this dashboard.');
}
function dashboardPage_() {
  try {
    requireDashboardOwner_();
    const source = UrlFetchApp.fetch('https://julietdeltaone.github.io/personal-space/', {muteHttpExceptions:true});
    if (source.getResponseCode() !== 200) throw new Error('Dashboard could not load.');
    return HtmlService.createHtmlOutput(source.getContentText()).setTitle('Personal space')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  } catch (err) {
    console.error(String(err));
    return HtmlService.createHtmlOutput('<p>Open your private dashboard deployment and sign in as the Sheet owner.</p>');
  }
}
function dashboardApi(p) {
  requireDashboardOwner_();
  const sh = getSheet_();
  if (p.action === 'list') return listRows_(sh, p.since);
  if (p.action === 'status') return statusFor_(sh, p);
  if (p.action === 'add') return addRow_(sh,p);
  return {ok:false,error:'Unknown action'};
}

/* ---------- feed-ready status ---------- */
/* Derived per-item state for one ET date, as of asOfMs. Mirrors the dashboard's
   itemStatus() exactly so any web app gets the same answers without re-running
   the state machine. Optional params: date=YYYY-MM-DD (ET, default today),
   asOf=ISO-UTC (default now). Note: only synced rows count; unsynced taps
   queued in the dashboard are not visible until the next sync. */
function pad2_(n) { return (n < 10 ? '0' : '') + n; }

function etParts_(ms) {
  const d = new Date(ms);
  const u = Number(Utilities.formatDate(d, TZ, 'u')); // 1=Mon..7=Sun
  return {
    y: Number(Utilities.formatDate(d, TZ, 'yyyy')),
    mo: Number(Utilities.formatDate(d, TZ, 'MM')),
    d: Number(Utilities.formatDate(d, TZ, 'dd')),
    wd: u === 7 ? 0 : u
  };
}

/* UTC ms of an ET wall-clock time. Refines via formatDate so DST is exact. */
function etMs_(y, mo, d, h, mi) {
  const want = Date.UTC(y, mo - 1, d, h || 0, mi || 0); // wall string read as UTC
  let guess = want - 4 * 36e5; // ET is UTC-4/5; one pass converges either way
  for (let i = 0; i < 3; i++) {
    const shown = Utilities.formatDate(new Date(guess), TZ, "yyyy-MM-dd'T'HH:mm");
    const offset = guess - Date.parse(shown + ':00Z');
    guess = want + offset;
  }
  return guess;
}

function nextDay_(y, mo, d) {
  const dt = new Date(Date.UTC(y, mo - 1, d) + 864e5);
  return { y: dt.getUTCFullYear(), mo: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

function deadlineFor_(item, y, mo, d, wd) {
  if (item.dueH == null) return null;
  let ty = y, tm = mo, td = d;
  if (item.dueWd != null) {
    const add = (item.dueWd - wd + 7) % 7;
    const dt = new Date(Date.UTC(y, mo - 1, d) + add * 864e5);
    ty = dt.getUTCFullYear(); tm = dt.getUTCMonth() + 1; td = dt.getUTCDate();
  }
  return etMs_(ty, tm, td, item.dueH, item.dueM);
}

function cycleStartFor_(item, y, mo, d, wd) {
  let ty = y, tm = mo, td = d;
  if (item.dueWd != null) { // weekend cycle starts Saturday 00:00 ET
    const back = (wd - 6 + 7) % 7;
    const dt = new Date(Date.UTC(y, mo - 1, d) - back * 864e5);
    ty = dt.getUTCFullYear(); tm = dt.getUTCMonth() + 1; td = dt.getUTCDate();
  }
  return etMs_(ty, tm, td, 0, 0);
}

function isDone_(details) {
  return details && Array.isArray(details.na) && details.na.indexOf('done') !== -1;
}

function statusFor_(sh, p) {
  const nowMs = Date.now();
  let asOf = nowMs;
  if (p.asOf && /^\d{4}-\d{2}-\d{2}T/.test(String(p.asOf))) {
    const t = Date.parse(p.asOf);
    if (!isNaN(t) && t <= nowMs) asOf = t;
  }
  let y, mo, d, wd;
  const ep = etParts_(asOf);
  y = ep.y; mo = ep.mo; d = ep.d; wd = ep.wd;
  if (p.date && /^\d{4}-\d{2}-\d{2}$/.test(String(p.date))) {
    const dp = String(p.date).split('-');
    y = +dp[0]; mo = +dp[1]; d = +dp[2];
    wd = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
  }
  const dateStr = y + '-' + pad2_(mo) + '-' + pad2_(d);
  // A week of history covers weekend cycles; listRows_ stays small via since.
  const since = new Date(etMs_(y, mo, d, 0, 0) - 7 * 864e5).toISOString();
  const rows = (listRows_(sh, since).rows) || [];
  const items = ROUTINE_ITEMS.map(function (item) {
    const scheduled = item.days.indexOf(wd) !== -1;
    const due = deadlineFor_(item, y, mo, d, wd);
    let state = 'off', lastEvent = null;
    if (scheduled) {
      const start = cycleStartFor_(item, y, mo, d, wd);
      const nd = nextDay_(y, mo, d);
      const end = Math.min(etMs_(nd.y, nd.mo, nd.d, 0, 0), asOf);
      let latest = null;
      for (let k = rows.length - 1; k >= 0; k--) {
        const r = rows[k];
        if (Number(r[1]) !== 40) continue;
        const id = parseInt(String(r[2]).replace(/\D/g, ''), 10);
        if (id !== item.id) continue;
        const ms = Date.parse(r[0]);
        if (isNaN(ms) || ms < start || ms >= end) continue;
        latest = { ms: ms, done: isDone_(r[3]) };
        break;
      }
      if (latest) lastEvent = new Date(latest.ms).toISOString();
      if (latest && latest.done) {
        state = due == null ? 'done' : (latest.ms <= due ? 'ontime' : 'late');
      } else if (due == null || asOf <= due + GRACE_MS) {
        state = 'upcoming';
      } else {
        state = 'missed';
      }
    }
    return {
      id: item.id,
      name: item.name,
      scheduled: scheduled,
      due: due == null ? null : new Date(due).toISOString(),
      state: state,
      lastEvent: lastEvent
    };
  });
  return {
    ok: true, api: API_VERSION, date: dateStr,
    asOf: new Date(asOf).toISOString(), items: items
  };
}


/** Authenticated relay for the GitHub-hosted interface. Never publishes a Sheet secret. */
function sheetBridge_() {
  requireDashboardOwner_();
  return HtmlService.createHtmlOutput(`<!doctype html><title>Sheet connection</title>
<p>Google Sheet connection active. Return to your GitHub dashboard.</p>
<script>
const origin = 'https://julietdeltaone.github.io';
window.addEventListener('message', function(event) {
  if (event.origin !== origin || event.source !== window.top) return;
  const request = event.data;
  if (!request || request.type !== 'personal-space-request' || typeof request.id !== 'string') return;
  if (!request.params || !['list','add'].includes(request.params.action)) return;
  google.script.run.withSuccessHandler(function(result) {
    window.top.postMessage({type:'personal-space-response',id:request.id,result:result}, origin);
  }).withFailureHandler(function(error) {
    window.top.postMessage({type:'personal-space-response',id:request.id,error:String(error.message || error)}, origin);
  }).dashboardApi(request.params);
});
window.top.postMessage({type:'personal-space-ready'}, origin);
</script>`).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function validDashboardKey_(key) {
  if (!key) return false;
  if (SECRET && key === SECRET) return true;
  if (!/^[a-f0-9]{64}$/.test(String(key))) return false;
  const expires = Number(PropertiesService.getScriptProperties().getProperty('DASHBOARD_SESSION_' + key));
  return expires > Date.now();
}
function createDashboardSession() {
  requireDashboardOwner_();
  const props = PropertiesService.getScriptProperties();
  const now = Date.now();
  const saved = props.getProperties();
  Object.keys(saved).forEach(function(key) {
    if (key.indexOf('DASHBOARD_SESSION_') === 0 && Number(saved[key]) <= now) props.deleteProperty(key);
  });
  const token = (Utilities.getUuid() + Utilities.getUuid()).replace(/-/g,'');
  const expires = now + 7*86400000;
  props.setProperty('DASHBOARD_SESSION_' + token, String(expires));
  return {token:token,expires:expires};
}
function connectionPage_() {
  requireDashboardOwner_();
  return HtmlService.createHtmlOutput(`<!doctype html><meta name="referrer" content="no-referrer"><title>Connect your dashboard</title>
<style>body{font:18px system-ui;max-width:520px;margin:12vh auto;padding:24px}button,a{font:inherit;padding:14px 20px;border-radius:10px;display:inline-block}a{background:#176b48;color:white;text-decoration:none}p{line-height:1.5}</style>
<h1>Connect your dashboard</h1><p>Enable seven days of private Google Sheet sync on this device. Your dashboard stays on GitHub.</p>
<button id="connect">Connect Sheet</button><p id="status" role="status"></p><a id="return" target="_top" style="display:none" rel="noreferrer">Open dashboard</a>
<script>document.getElementById('connect').onclick=function(){this.disabled=true;document.getElementById('status').textContent='Connecting…';google.script.run.withSuccessHandler(function(session){const link=document.getElementById('return');link.href='https://julietdeltaone.github.io/personal-space/#session='+encodeURIComponent(session.token)+'&expires='+session.expires;link.style.display='inline-block';document.getElementById('status').textContent='Connected. Open your dashboard to finish.';}).withFailureHandler(function(){document.getElementById('connect').disabled=false;document.getElementById('status').textContent='Connection failed. Sign in as the Sheet owner and retry.';}).createDashboardSession();};</script>`).setTitle('Connect dashboard').addMetaTag('viewport','width=device-width, initial-scale=1');
}
