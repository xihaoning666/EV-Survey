/**
 * Google Sheets backend for LM/NCL EV Survey
 *
 * SETUP (one time):
 * 1. Create a new Google Sheet (e.g. "EV Survey Responses")
 * 2. Extensions → Apps Script → paste this file → Save
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL (ends with /exec)
 * 5. In survey.html set CONFIG.SUBMIT_ENDPOINT to that URL
 * 6. Redeploy survey.html to GitHub Pages
 *
 * Each submission appends one row to the "responses" sheet and stores
 * the full JSON in the "raw_json" column for analysis.
 */

const SHEET_NAME = 'responses';

function doPost(e) {
  try {
    const body = e && e.postData && e.postData.contents ? e.postData.contents : '';
    const data = JSON.parse(body);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
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
    sheet.appendRow([
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
  return ContentService.createTextOutput('EV Survey endpoint is live.');
}
