/**
 * Personal Space Dashboard backend
 *
 * Setup:
 * 1. Create a Google Sheet, then Extensions > Apps Script. Paste this file over Code.gs.
 * 2. Change SECRET below to a long random string.
 * 3. Run setup() once from the editor and approve the permissions.
 * 4. Deploy > New deployment > Web app.
 *      Execute as: Me
 *      Who has access: Anyone
 * 5. Copy the Web app URL (ends in /exec). Paste it and your SECRET into the dashboard's Connect panel.
 *
 * After you edit this file later, use Deploy > Manage deployments > Edit > New version.
 */

const SECRET = 'change-this-to-a-long-random-string';
const SHEET_NAME = 'Log';
const HEADERS = ['Timestamp', 'Schema', 'Code'];
const MAX_ROWS_RETURNED = 2000;
const DEDUPE_WINDOW = 60;

function setup() {
  getSheet_();
}

function doGet(e) {
  const p = (e && e.parameter) || {};
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

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const last = sh.getLastRow();
    if (last > 1) {
      const from = Math.max(2, last - DEDUPE_WINDOW + 1);
      const recent = sh.getRange(from, 1, last - from + 1, 1).getValues().map(function (r) { return toIso_(r[0]); });
      if (recent.indexOf(t) !== -1) return { ok: true, duplicate: true };
    }
    sh.appendRow([t, schema, code]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function listRows_(sh) {
  const last = sh.getLastRow();
  if (last < 2) return { ok: true, rows: [] };
  const from = Math.max(2, last - MAX_ROWS_RETURNED + 1);
  const values = sh.getRange(from, 1, last - from + 1, 3).getValues();
  const rows = values
    .filter(function (r) { return r[0] !== '' && r[2] !== ''; })
    .map(function (r) { return [toIso_(r[0]), Number(r[1]) || 0, String(r[2])]; });
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
  return sh;
}

function toIso_(v) {
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
