/**
 * EV & Bus Travel Survey — Apps Script collector, v4.15 (Pureprofile field build)
 *
 * One row per POST into the tab named by SHEET_NAME. The indexed columns are what doGet and
 * the quota check read; payload_json is the record of truth and the only thing the analysis
 * export is built from.
 *
 * The pre-4.15 collector lived only inside Apps Script, so the indexed block below is a
 * restatement of it, with the v4.15 columns appended before payload_json.
 *
 * DEPLOYMENT — the /exec URL in survey.html CONFIG.SUBMIT_ENDPOINT must not change:
 *   Apps Script -> paste this file -> Save
 *   create the tab named by SHEET_NAME with HEADERS in row 1 (run setupSheet once)
 *   Deploy -> Manage deployments -> edit the existing deployment -> Version: New -> Deploy
 * A "New deployment" mints a different URL and the survey keeps posting to the old code.
 *
 * ppid is Pureprofile's identifier and exists only to reconcile their invoice. It stays in
 * this tab and is dropped from the analysis export and from anything shared with Council.
 */

const SPREADSHEET_ID = '1ZV-ObmDA8G4-B13xwTpfuHJ9vozj3SIfDMlJTWnocEQ';
const SHEET_NAME = 'responses_v4_15';
const EXPECTED_VERSION = '4.15';
const TIMEZONE = 'Australia/Sydney';
const JSON_CELL_MAX = 49000;

const HEADERS = [
  // --- indexed columns carried forward from the pre-4.15 collector ---
  'received_at_utc',
  'respondent_id',
  'src',
  'referrer',
  'design_version',
  'reference_month',
  'started_at',
  'completed_at',
  'completed',
  'duration_sec',
  'device',
  's1_lga',
  'lga',
  'suburb',
  'suburb_zone',
  'age',
  'gender',
  'driver',
  'vehicles',
  'fuel',
  'home_charging_feasible',
  'order_att',
  'order_dce',
  'block_a',
  'block_b',
  // --- appended in v4.15 ---
  'ppid',
  'panel',
  'exit_status',
  'dq_reason',
  'active_sec',
  'attn1_pass',
  'attn2_pass',
  'received_at_aest',
  // --- record of truth, always last ---
  'payload_json'
];

const COL = (function () {
  const m = {};
  HEADERS.forEach(function (h, i) { m[h] = i; });
  return m;
})();

const EXIT_STATUSES = ['complete', 'disqualified', 'screened', 'declined', 'quotafull'];
const FULL_STATUSES = ['complete', 'disqualified'];

/* ---------- sheet access ---------- */

function getSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    styleHeader_(sheet);
  }
  return sheet;
}

function styleHeader_(sheet) {
  const r = sheet.getRange(1, 1, 1, HEADERS.length);
  r.setFontWeight('bold').setBackground('#0d5c63').setFontColor('#ffffff').setWrap(true);
  sheet.setFrozenRows(1);
}

/** Row 1 must be exactly HEADERS, or nothing is written. A silently reordered or renamed
 *  column would misalign every later row and is not recoverable from the sheet alone. */
function schemaOk_(sheet) {
  if (sheet.getLastColumn() !== HEADERS.length) return false;
  const row = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  for (let i = 0; i < HEADERS.length; i++) {
    if (String(row[i]) !== HEADERS[i]) return false;
  }
  return true;
}

function readIndexed_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, HEADERS.length - 1).getValues();
}

/* ---------- helpers ---------- */

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function str_(v) {
  if (v === null || v === undefined) return '';
  return String(v);
}

function bool_(v) {
  if (v === null || v === undefined || v === '') return '';
  return v ? 'TRUE' : 'FALSE';
}

function num_(v) {
  return (v === null || v === undefined || v === '' || isNaN(+v)) ? '' : +v;
}

function statusOf_(p) {
  const s = str_(p.exit_status).toLowerCase();
  if (EXIT_STATUSES.indexOf(s) >= 0) return s;
  if (p.declined) return 'declined';
  if (p.terminated) return 'screened';
  if (p.quotaFull) return 'quotafull';
  return 'complete';
}

function suburbOut_(p) {
  if (p.suburb === '__other__') return str_(p.suburbOther).trim() || 'Not listed';
  return str_(p.suburb);
}

function buildRow_(p, body, status) {
  const now = new Date();
  const q = p.quality || {};
  const computed = p.computed || {};
  const meta = p.meta || {};
  const isFull = FULL_STATUSES.indexOf(status) >= 0;
  const row = new Array(HEADERS.length).fill('');

  row[COL.received_at_utc] = now.toISOString();
  row[COL.respondent_id] = str_(p.respondentId);
  row[COL.src] = str_(p.src);
  row[COL.referrer] = str_(p.referrer);
  row[COL.design_version] = str_(p.designVersion);
  row[COL.reference_month] = str_(p.referenceMonth);
  row[COL.started_at] = str_(p.startedAt);
  row[COL.completed_at] = str_(p.completedAt);
  row[COL.completed] = p.completedAt ? 'yes' : 'no';
  row[COL.duration_sec] = num_(meta.durationSec);
  row[COL.device] = str_(meta.device);
  row[COL.s1_lga] = str_(p.s1);
  row[COL.lga] = str_(p.suburbLga || p.s1);
  row[COL.suburb] = suburbOut_(p);
  row[COL.suburb_zone] = num_(p.suburbZone);
  row[COL.age] = str_(p.age);
  row[COL.gender] = str_(p.gender);
  row[COL.driver] = str_(p.driver);
  row[COL.vehicles] = num_(p.vehicles);
  row[COL.fuel] = str_(p.fuel);
  row[COL.home_charging_feasible] = isFull ? num_(computed.homeCharge) : '';
  row[COL.order_att] = str_(p.orderAtt);
  row[COL.order_dce] = str_(p.orderDce);
  row[COL.block_a] = (p.blockA === null || p.blockA === undefined || p.blockA === '') ? '' : (+p.blockA + 1);
  row[COL.block_b] = (p.blockB === null || p.blockB === undefined || p.blockB === '') ? '' : (+p.blockB + 1);

  row[COL.ppid] = str_(p.ppid);
  row[COL.panel] = str_(p.panel);
  row[COL.exit_status] = status;
  row[COL.dq_reason] = isFull ? str_(q.dq_reason) : '';
  row[COL.active_sec] = isFull ? num_(q.active_sec) : '';
  row[COL.attn1_pass] = isFull ? bool_(q.attn1_pass) : '';
  row[COL.attn2_pass] = isFull ? bool_(q.attn2_pass) : '';
  row[COL.received_at_aest] = Utilities.formatDate(now, TIMEZONE, 'yyyy-MM-dd HH:mm:ss');

  row[COL.payload_json] = body.length > JSON_CELL_MAX ? body.slice(0, JSON_CELL_MAX) : body;
  return row;
}

/** A full record is a duplicate of any earlier full record from the same respondent or the
 *  same panellist; this absorbs a write that landed on a CORS-failed request and again on the
 *  no-cors re-post. An early exit only duplicates the identical early exit, so a screen-out
 *  row never blocks the full record that may follow. */
function findDuplicate_(rows, p, status) {
  const rid = str_(p.respondentId);
  const ppid = str_(p.ppid);
  const isFull = FULL_STATUSES.indexOf(status) >= 0;
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const rowStatus = str_(r[COL.exit_status]);
    if (isFull) {
      if (FULL_STATUSES.indexOf(rowStatus) < 0) continue;
      if ((rid && str_(r[COL.respondent_id]) === rid) || (ppid && str_(r[COL.ppid]) === ppid)) return i + 2;
    } else {
      if (rowStatus !== status) continue;
      if (rid && str_(r[COL.respondent_id]) === rid) return i + 2;
    }
  }
  return 0;
}

/* ---------- endpoints ---------- */

function doPost(e) {
  let p;
  try {
    const body = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    if (!body) return jsonOut_({ ok: false, error: 'bad json: empty body' });
    p = JSON.parse(body);
    const status = statusOf_(p);

    const version = str_(p.designVersion);
    if (version !== EXPECTED_VERSION) {
      return jsonOut_({ ok: false, error: 'version mismatch: expected ' + EXPECTED_VERSION + ', got ' + (version || '(none)') });
    }

    const sheet = getSheet_();
    if (!schemaOk_(sheet)) {
      return jsonOut_({ ok: false, error: 'schema mismatch: row 1 of "' + SHEET_NAME + '" is not the expected header' });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const dup = findDuplicate_(readIndexed_(sheet), p, status);
      if (dup) return jsonOut_({ ok: true, duplicate: true, row: dup });
      sheet.appendRow(buildRow_(p, body, status));
      return jsonOut_({ ok: true, row: sheet.getLastRow() });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    if (!p) return jsonOut_({ ok: false, error: 'bad json: ' + String(err) });
    return jsonOut_({ ok: false, error: String(err) });
  }
}

/** Counts are built from the indexed columns, never from payload_json.
 *  home_charging_infeasible is the n_inf the pre-registered fallback ladder is monitored on. */
function doGet(e) {
  try {
    const sheet = getSheet_();
    const rows = readIndexed_(sheet);
    const counts = {
      complete: 0, disqualified: 0, screened: 0, declined: 0, quotafull: 0,
      complete_by_lga: { 'Lake Macquarie': 0, 'Newcastle': 0 },
      panel_complete: 0, nonpanel_complete: 0,
      home_charging_infeasible: 0,
      last_received_at_aest: ''
    };
    rows.forEach(function (r) {
      const status = str_(r[COL.exit_status]);
      if (counts.hasOwnProperty(status)) counts[status]++;
      const aest = str_(r[COL.received_at_aest]);
      if (aest > counts.last_received_at_aest) counts.last_received_at_aest = aest;
      if (status !== 'complete') return;
      const lga = str_(r[COL.lga]);
      if (counts.complete_by_lga.hasOwnProperty(lga)) counts.complete_by_lga[lga]++;
      if (str_(r[COL.ppid])) counts.panel_complete++; else counts.nonpanel_complete++;
      if (num_(r[COL.home_charging_feasible]) === 0) counts.home_charging_infeasible++;
    });
    return jsonOut_({ ok: true, version: EXPECTED_VERSION, sheet: SHEET_NAME, rows: rows.length, counts: counts });
  } catch (err) {
    return jsonOut_({ ok: false, error: String(err) });
  }
}

/* ---------- one-off maintenance, run from the editor ---------- */

/** Creates the tab with HEADERS in row 1, or reports what is wrong with an existing one. */
function setupSheet() {
  const sheet = getSheet_();
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    styleHeader_(sheet);
  }
  Logger.log(schemaOk_(sheet)
    ? 'Ready: "' + SHEET_NAME + '" has ' + HEADERS.length + ' columns and ' + Math.max(0, sheet.getLastRow() - 1) + ' row(s).'
    : 'Header mismatch in "' + SHEET_NAME + '". Expected: ' + HEADERS.join(', '));
}
