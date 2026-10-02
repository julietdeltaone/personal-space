/**
 * Personal Space Dashboard backend
 *
 * Setup:
 * 1. Create a Google Sheet, then Extensions > Apps Script. Paste this file over Code.gs.
 * 2. setup() creates a private SECRET in Project Settings > Script properties.
 * 3. Run setup() once from the editor and approve the permissions.
 * 4. Deploy > New deployment > Web app.
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Copy the Web app URL (ends in /exec). Paste it and your SECRET into the dashboard's Connect panel.
 *
 * After you edit this file later, use Deploy > Manage deployments > Edit > New version.
 */

const SECRET = PropertiesService.getScriptProperties().getProperty('SECRET');
const SHEET_NAME = 'Log';
const HEADERS = ['Timestamp', 'Schema', 'Code', 'Details'];
const MAX_ROWS_RETURNED = 2000;
const DEDUPE_WINDOW = 60;

function setup() {
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('SECRET')) props.setProperty('SECRET', Utilities.getUuid() + Utilities.getUuid());
  getSheet_();
}

function doGet(e) {
  ScriptApp.requireAllScopes(ScriptApp.AuthMode.FULL);
  const p = (e && e.parameter) || {};
  if (!p.action && !p.key) return dashboardPage_();
  try {
    if (p.key !== SECRET) return out_({ ok: false, error: 'unauthorized' });
    const sh = getSheet_();
    if (p.action === 'add') return out_(addRow_(sh, p));
    if (p.action === 'list') return out_(listRows_(sh));
    return out_({ ok: true, ping: true });
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

function listRows_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return { ok: true, rows: [] };
  const from = Math.max(2, last - MAX_ROWS_RETURNED + 1);
  const values = sh.getRange(from, 1, last - from + 1, 4).getValues();
  const rows = values
    .filter(function (r) { return r[0] !== '' && r[2] !== ''; })
    .map(function (r) { let details = {}; try { details = JSON.parse(r[3] || '{}'); } catch (_) {} return [toIso_(r[0]), Number(r[1]) || 0, String(r[2]), details]; });
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
  if (p.action === 'list') return listRows_(sh);
  if (p.action === 'add') return addRow_(sh,p);
  return {ok:false,error:'Unknown action'};
}
