/**
 * Google Sheets backend for LM/NCL EV Survey
 *
 * SETUP (one time):
 * 1. Open your Google Sheet → Extensions → Apps Script → paste this file → Save
 * 2. Run testWrite() once from the editor and approve permissions
 * 3. Deploy → Manage deployments → Edit → New version → Deploy
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL into survey.html CONFIG.SUBMIT_ENDPOINT
 *
 * IMPORTANT: SPREADSHEET_ID must match the sheet you want to collect data in.
 */

const SPREADSHEET_ID = '1ZV-ObmDA8G4-B13xwTpfuHJ9vozj3SIfDMlJTWnocEQ';
const SHEET_NAME = 'responses';

function getResponsesSheet_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'submitted_at',
      'respondent_id',
      'src',
      's1_lga',
      'suburb',
      'design_version',
      'reference_month',
      'order_att',
      'order_dce',
      'block_a',
      'block_b',
      'completed',
      'raw_json',
    ]);
  }
  return sheet;
}

function appendResponse_(body, data) {
  getResponsesSheet_().appendRow([
    new Date().toISOString(),
    data.respondentId || '',
    data.src || '',
    data.s1 || '',
    data.suburb || '',
    data.designVersion || '',
    data.referenceMonth || '',
    data.orderAtt || '',
    data.orderDce || '',
    data.blockA != null ? data.blockA + 1 : '',
    data.blockB != null ? data.blockB + 1 : '',
    data.completedAt ? 'yes' : 'no',
    body,
  ]);
}

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents ? e.postData.contents : '';
    if (!body) throw new Error('Empty request body');
    const data = JSON.parse(body);
    appendResponse_(body, data);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  try {
    const sheet = getResponsesSheet_();
    const rows = Math.max(0, sheet.getLastRow() - 1);
    return ContentService.createTextOutput(
      'EV Survey endpoint is live. Sheet "' + SHEET_NAME + '" has ' + rows + ' response(s).'
    );
  } catch (err) {
    return ContentService.createTextOutput('Error: ' + String(err));
  }
}

/** Run once from the Apps Script editor to verify permissions and sheet access. */
function testWrite() {
  const sample = {
    respondentId: 'TEST1234',
    src: 'manual-test',
    s1: 'Lake Macquarie',
    suburb: 'Charlestown',
    designVersion: '4.13',
    referenceMonth: '2026-07',
    orderAtt: 'pre',
    orderDce: 'A-first',
    blockA: 0,
    blockB: 1,
    completedAt: new Date().toISOString(),
  };
  const body = JSON.stringify(sample);
  appendResponse_(body, sample);
  Logger.log('Test row written to "' + SHEET_NAME + '"');
}
