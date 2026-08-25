/**
 * Google Sheets backend for LM/NCL EV Survey v4.14
 *
 * Writes one row per POST with every instrument field in its own column,
 * plus raw_json as a backup. Screen-outs and completed surveys use the
 * same layout; unanswered items are left blank.
 *
 * SETUP (after replacing this file):
 * 1. Open the Google Sheet → Extensions → Apps Script → paste this file → Save
 * 2. Run setupSheet() once from the editor (approve permissions)
 * 3. Deploy → Manage deployments → Edit → New version → Deploy
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Confirm survey.html CONFIG.SUBMIT_ENDPOINT still matches the /exec URL
 *
 * setupSheet() adds any missing columns to the right, so older rows stay aligned.
 */

const SPREADSHEET_ID = '1ZV-ObmDA8G4-B13xwTpfuHJ9vozj3SIfDMlJTWnocEQ';
const SHEET_NAME = 'responses';
const SHEET_GID = 1954565153; // tab in the spreadsheet URL
const CODEBOOK_NAME = 'codebook';
const JSON_CELL_MAX = 49000;

const ATT_IDS = ['ENV1','ENV2','ENV3','ENV4','ENV5','ESA1','ESA2','ESA5','ESA7','ESA9','ESA10','PC1','PC2','PC3','TECH1','TECH2','TECH3','ATTN1'];
const MOD_IDS = ['RANGE1','RANGE2','RANGE3','ATTN2'];
const DCE_A_TASKS = 8;
const DCE_B_TASKS = 6;
const TIMING_KEYS = [
  'welcome','screening','travelVeh','travelTrip','home','ev','attitudes',
  'dceA2','dceA3_1','dceA3_2','dceA3_3','dceA3_4','dceA3_5','dceA3_6','dceA3_7','dceA3_8','dceA4',
  'dceB2','dceB3_1','dceB3_2','dceB3_3','dceB3_4','dceB3_5','dceB3_6','dceB4',
  'mods','chargers','demo'
];

function dceAHeaders_() {
  const h = ['dceA_example'];
  for (var i = 1; i <= DCE_A_TASKS; i++) {
    var p = 'dceA' + i + '_';
    h.push(p+'choice', p+'block', p+'levels', p+'pp', p+'ep', p+'range', p+'fast',
           p+'avail_lvl', p+'pcost', p+'ecost_lvl', p+'ecost', p+'gov',
           p+'home_charge', p+'sq_carrier');
  }
  h.push('cert_a');
  return h;
}

function dceBHeaders_() {
  const h = ['dceB_example'];
  for (var i = 1; i <= DCE_B_TASKS; i++) {
    var p = 'dceB' + i + '_';
    h.push(p+'choice', p+'block', p+'levels', p+'freq', p+'rel', p+'walk', p+'ivt',
           p+'stop', p+'fare', p+'rt', p+'trac', p+'car', p+'fuel_lvl',
           p+'fuel_carrier', p+'park_lvl', p+'sq_cost');
  }
  h.push('cert_b', 'cons_study');
  return h;
}

function headers_() {
  return [].concat(
    [
      'submitted_at','respondent_id','design_version','reference_month',
      'started_at','completed_at','completed','declined','terminated','consent',
      'src','referrer','channel','device','duration_sec',
      'submit_status','submit_attempts','submit_confirmed',
      'order_att','order_dce','block_a','block_b','att_order','mod_order',
      's1_lga','suburb','suburb_not_listed','suburb_other','suburb_lga','suburb_zone',
      'age','gender','driver',
      'vehicles','fuel','veh_age','weekly_km','fuel_spend','phev_petrol','phev_elec',
      'door_min','ivt_min','trip_km','trip_cost','mode','trip_freq','fare_type',
      'zero_car_fuel','bus_use','long_trip',
      'dwelling','tenure','parking','charger',
      'ev_familiarity','replace','veh_class','new_used','expected_km','expected_unsure'
    ],
    ATT_IDS.map(function (id) { return 'att_' + id; }),
    MOD_IDS.map(function (id) { return 'mod_' + id; }),
    ['ev_int'],
    dceAHeaders_(),
    dceBHeaders_(),
    ['charger_priorities','charger_suburb'],
    ['edu','income','solar','elec_bill','comments'],
    [
      'cv_driver','cv_zero','cv_home_charge','cv_show_car','cv_car_now','cv_sq_label',
      'cv_bus_base','cv_km','cv_weekly_km_helper','cv_on_demand','cv_sq_carrier','cv_car_electric'
    ],
    [
      'q_attn1_pass','q_attn2_pass','q_exampleA_choice','q_exampleA_petrol',
      'q_median_task_sec','q_straightlined_att','q_straightlined_mod'
    ],
    TIMING_KEYS.map(function (k) { return 't_' + k; }),
    TIMING_KEYS.map(function (k) { return 't1_' + k; }),
    ['timings_json','timings_first_json','raw_json','raw_json_2']
  );
}

function codebookRows_() {
  const rows = [['column','meaning']];
  const note = {
    submitted_at: 'Server timestamp when the row was written (ISO UTC)',
    respondent_id: '8-character respondent code shown on the thank-you page',
    design_version: 'Instrument version stamped by survey.html (4.14)',
    reference_month: 'Dollar-year lock (2026-07)',
    started_at: 'Client timestamp when the session began',
    completed_at: 'Client timestamp at Submit; blank for screen-outs',
    completed: 'yes if they reached Submit with a completedAt time',
    declined: 'TRUE if they chose not to take part on Welcome',
    terminated: 'TRUE if screened out (not LGA, or under 18)',
    consent: 'TRUE if they agreed to take part',
    src: 'Recruitment tag from ?src= in the survey URL',
    referrer: 'document.referrer (truncated)',
    channel: 'Q: how they heard of the survey (only if src was empty)',
    device: 'mobile or desktop',
    duration_sec: 'Seconds from start to submit',
    submit_status: 'Client submit state (sent / failed / …)',
    order_att: 'pre = attitudes before DCEs; post = after both DCEs',
    order_dce: 'A-first or B-first',
    block_a: 'DCE-A Ngene block, 1–4',
    block_b: 'DCE-B Ngene block, 1–4',
    att_order: 'Attitude item order shown (includes ATTN1)',
    mod_order: 'Range-anxiety item order shown (includes ATTN2)',
    s1_lga: 'Lake Macquarie / Newcastle / Neither',
    suburb: 'Residential suburb (typed name if not listed)',
    suburb_not_listed: 'TRUE if they chose “My suburb is not listed”',
    suburb_other: 'Free-text suburb when not listed',
    suburb_lga: 'Resolved LGA of the chosen suburb',
    suburb_zone: 'Lake Macquarie fare/zone flag from suburbs-data.js',
    age: 'Age group (Under 18 screens out)',
    gender: 'Gender',
    driver: 'Whether they currently drive',
    vehicles: 'Household vehicles (0–3; 3 = 3 or more)',
    fuel: 'Main vehicle fuel/energy',
    veh_age: 'Age of that vehicle',
    weekly_km: 'Typical weekly kilometres',
    fuel_spend: 'Typical weekly fuel or charging spend ($)',
    phev_petrol: 'PHEV weekly petrol spend ($)',
    phev_elec: 'PHEV weekly charging spend ($)',
    door_min: 'Door-to-door minutes, one way',
    ivt_min: 'In-motion minutes, one way',
    trip_km: 'Trip distance km, one way',
    trip_cost: 'Out-of-pocket return cost if not driving themselves ($)',
    mode: 'Usual mode for that trip',
    trip_freq: 'How often they make that trip',
    fare_type: 'Bus fare type they would pay',
    zero_car_fuel: 'Fuel of the car they drive if household has 0 vehicles',
    bus_use: 'Bus / On Demand use in a typical month',
    long_trip: 'Household 200 km+ car trips',
    dwelling: 'Home type',
    tenure: 'Own / rent / other',
    parking: 'Overnight parking',
    charger: 'Whether an EV charger could be used or installed there',
    ev_familiarity: 'Experience with fully electric vehicles',
    replace: 'Likelihood of getting/replacing a vehicle in 3 years',
    veh_class: 'Vehicle type they would look for',
    new_used: 'New / used / either',
    expected_km: 'Expected weekly km if they got a car (zero-car households)',
    expected_unsure: 'TRUE if they ticked Unsure on expected km',
    ev_int: '0–10 likelihood next vehicle is fully electric',
    dceA_example: 'Worked-example choice: petrol / ev / sq',
    cert_a: '0–10 certainty after DCE-A',
    dceB_example: 'Worked-example choice: sq / bus',
    cert_b: '0–10 certainty after DCE-B',
    cons_study: 'How much they thought answers could influence real decisions',
    charger_priorities: 'Up to 3 public-charger locations, joined with |',
    charger_suburb: 'Named suburb/centre for more chargers (optional)',
    edu: 'Highest qualification (optional)',
    income: 'Gross household income (optional)',
    solar: 'Rooftop solar (optional)',
    elec_bill: 'Electricity bill per quarter (optional)',
    comments: 'Open comment (optional)',
    cv_driver: '1 if they drive, 0 if not',
    cv_zero: 'TRUE if household vehicles = 0',
    cv_home_charge: '1 if home charging is treated as feasible in DCE-A',
    cv_show_car: 'TRUE if DCE-B shows a car cost for the status quo',
    cv_car_now: 'TRUE if usual trip is car-like (drive / passenger / taxi)',
    cv_sq_label: 'Status-quo column label in DCE-B',
    cv_bus_base: 'Derived bus in-vehicle time base (minutes)',
    cv_km: 'Trip km used in DCE-B (defaults to 10 if missing)',
    cv_weekly_km_helper: 'Weekly km used in the DCE-A running-cost hint',
    cv_on_demand: 'TRUE if On Demand was offered as a mode',
    cv_sq_carrier: 'petrol or electricity on the DCE-A keep-current running cost',
    cv_car_electric: 'TRUE if DCE-B car cost uses electricity rates',
    q_attn1_pass: 'TRUE if ATTN1 = Disagree (2)',
    q_attn2_pass: 'TRUE if ATTN2 = Agree (4)',
    q_exampleA_choice: 'DCE-A example choice',
    q_exampleA_petrol: 'TRUE if the DCE-A example chose petrol',
    q_median_task_sec: 'Median first-view seconds on DCE tasks',
    q_straightlined_att: 'TRUE if all attitude items (excl. ATTN1) are the same',
    q_straightlined_mod: 'TRUE if all range items are the same',
    timings_json: 'All page times in seconds (JSON)',
    timings_first_json: 'First-view page times in seconds (JSON)',
    raw_json: 'Full payload JSON (first 49k characters)',
    raw_json_2: 'Overflow of raw_json if the payload is very large'
  };
  ATT_IDS.forEach(function (id) {
    note['att_' + id] = 'Likert 1–5 for ' + id + ' (1=Strongly disagree … 5=Strongly agree)';
  });
  MOD_IDS.forEach(function (id) {
    note['mod_' + id] = 'Likert 1–5 for ' + id + ' (1=Strongly disagree … 5=Strongly agree)';
  });
  for (var a = 1; a <= DCE_A_TASKS; a++) {
    note['dceA'+a+'_choice'] = 'DCE-A task '+a+' choice: petrol / ev / sq';
    note['dceA'+a+'_block'] = 'DCE-A task '+a+' block number shown';
    note['dceA'+a+'_levels'] = 'DCE-A task '+a+' Ngene level indices';
    note['dceA'+a+'_pp'] = 'Petrol purchase price shown ($)';
    note['dceA'+a+'_ep'] = 'EV purchase price shown ($)';
    note['dceA'+a+'_range'] = 'EV range shown (km)';
    note['dceA'+a+'_fast'] = 'DC fast-charge minutes shown';
    note['dceA'+a+'_avail_lvl'] = 'Public charger availability level index';
    note['dceA'+a+'_pcost'] = 'Petrol $/100 km shown';
    note['dceA'+a+'_ecost_lvl'] = 'Electricity cost band index';
    note['dceA'+a+'_ecost'] = 'EV $/100 km shown (home or public band)';
    note['dceA'+a+'_gov'] = 'Government support shown on the EV';
    note['dceA'+a+'_home_charge'] = '1 if home charging was assumed for this task';
    note['dceA'+a+'_sq_carrier'] = 'Keep-current running-cost carrier';
  }
  for (var b = 1; b <= DCE_B_TASKS; b++) {
    note['dceB'+b+'_choice'] = 'DCE-B task '+b+' choice: sq / bus';
    note['dceB'+b+'_block'] = 'DCE-B task '+b+' block number shown';
    note['dceB'+b+'_levels'] = 'DCE-B task '+b+' Ngene level indices';
    note['dceB'+b+'_freq'] = 'Bus frequency shown';
    note['dceB'+b+'_rel'] = 'On-time reliability shown';
    note['dceB'+b+'_walk'] = 'Walk/wait minutes shown';
    note['dceB'+b+'_ivt'] = 'Bus in-vehicle minutes shown';
    note['dceB'+b+'_stop'] = 'Stop quality shown';
    note['dceB'+b+'_fare'] = 'Return fare shown ($)';
    note['dceB'+b+'_rt'] = 'Real-time information shown';
    note['dceB'+b+'_trac'] = 'Diesel bus or Electric bus';
    note['dceB'+b+'_car'] = 'Status-quo fuel+parking cost if driving ($)';
    note['dceB'+b+'_fuel_lvl'] = 'Car fuel-cost level index';
    note['dceB'+b+'_fuel_carrier'] = 'petrol or electricity for the car cost';
    note['dceB'+b+'_park_lvl'] = 'Parking cost level index';
    note['dceB'+b+'_sq_cost'] = 'Status-quo cost used in the table ($)';
  }
  TIMING_KEYS.forEach(function (k) {
    note['t_' + k] = 'Seconds spent on ' + k + ' (summed if they went Back)';
    note['t1_' + k] = 'Seconds on first view of ' + k;
  });
  headers_().forEach(function (h) {
    rows.push([h, note[h] || '']);
  });
  return rows;
}

function cell_(v) {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (Object.prototype.toString.call(v) === '[object Date]') return v.toISOString();
  if (Array.isArray(v)) return v.join(' | ');
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

function pick_(obj, key) {
  if (!obj || typeof obj !== 'object') return '';
  if (obj[key] != null && obj[key] !== '') return obj[key];
  var n = Number(key);
  if (!isNaN(n) && obj[n] != null && obj[n] !== '') return obj[n];
  return '';
}

function suburbOut_(data) {
  if (data.suburb === '__other__') {
    var typed = String(data.suburbOther || '').trim();
    return typed || 'Not listed';
  }
  return data.suburb || '';
}

function jsonParts_(s) {
  s = s || '';
  if (s.length <= JSON_CELL_MAX) return [s, ''];
  return [s.slice(0, JSON_CELL_MAX), s.slice(JSON_CELL_MAX, JSON_CELL_MAX * 2)];
}

function rowMap_(data, body) {
  var meta = data.meta || {};
  var cv = data.computed || {};
  var q = data.quality || {};
  var sub = data.submit || {};
  var att = data.attitudes || {};
  var mod = data.moderators || {};
  var shownA = data.dceAShown || {};
  var shownB = data.dceBShown || {};
  var chA = data.dceA || {};
  var chB = data.dceB || {};
  var timings = data.timings || {};
  var first = data.timingsFirst || {};
  var parts = jsonParts_(body);
  var map = {
    submitted_at: new Date().toISOString(),
    respondent_id: data.respondentId || '',
    design_version: data.designVersion || '',
    reference_month: data.referenceMonth || '',
    started_at: data.startedAt || '',
    completed_at: data.completedAt || '',
    completed: data.completedAt ? 'yes' : 'no',
    declined: cell_(!!data.declined),
    terminated: cell_(!!data.terminated),
    consent: data.consent === true ? 'TRUE' : (data.consent === false ? 'FALSE' : ''),
    src: data.src || '',
    referrer: data.referrer || '',
    channel: data.channel || '',
    device: meta.device || '',
    duration_sec: meta.durationSec != null ? meta.durationSec : '',
    submit_status: sub.status || '',
    submit_attempts: sub.attempts != null ? sub.attempts : '',
    submit_confirmed: sub.confirmed == null ? '' : cell_(!!sub.confirmed),
    order_att: data.orderAtt || '',
    order_dce: data.orderDce || '',
    block_a: data.blockA != null && data.blockA !== '' ? Number(data.blockA) + 1 : '',
    block_b: data.blockB != null && data.blockB !== '' ? Number(data.blockB) + 1 : '',
    att_order: cell_(data.attOrder || []),
    mod_order: cell_(data.modOrder || []),
    s1_lga: data.s1 || '',
    suburb: suburbOut_(data),
    suburb_not_listed: cell_(!!data.suburbNotListed || data.suburb === '__other__'),
    suburb_other: data.suburbOther || '',
    suburb_lga: data.suburbLga || '',
    suburb_zone: data.suburbZone == null ? '' : data.suburbZone,
    age: data.age || '',
    gender: data.gender || '',
    driver: data.driver || '',
    vehicles: data.vehicles == null ? '' : data.vehicles,
    fuel: data.fuel || '',
    veh_age: data.vehAge || '',
    weekly_km: data.weeklyKm || '',
    fuel_spend: data.fuelSpend || '',
    phev_petrol: data.phevPetrol || '',
    phev_elec: data.phevElec || '',
    door_min: data.door || '',
    ivt_min: data.ivt || '',
    trip_km: data.tripKm || '',
    trip_cost: data.tripCost || '',
    mode: data.mode || '',
    trip_freq: data.tripFreq || '',
    fare_type: data.fareType || '',
    zero_car_fuel: data.zeroCarFuel || '',
    bus_use: data.busUse || '',
    long_trip: data.longTrip || '',
    dwelling: data.dwelling || '',
    tenure: data.tenure || '',
    parking: data.parking || '',
    charger: data.charger || '',
    ev_familiarity: data.evFamiliarity || '',
    replace: data.replace || '',
    veh_class: data.vehClass || '',
    new_used: data.newUsed || '',
    expected_km: data.expectedKm || '',
    expected_unsure: cell_(!!data.expectedUnsure),
    ev_int: data.evInt == null ? '' : data.evInt,
    dceA_example: data.dceAEx || '',
    cert_a: data.certA == null ? '' : data.certA,
    dceB_example: data.dceBEx || '',
    cert_b: data.certB == null ? '' : data.certB,
    cons_study: data.consStudy || '',
    charger_priorities: cell_(data.q8b1 || []),
    charger_suburb: data.q8b2 || '',
    edu: data.edu || '',
    income: data.income || '',
    solar: data.solar || '',
    elec_bill: data.elecBill || '',
    comments: data.comments || '',
    cv_driver: cv.driver == null ? '' : cv.driver,
    cv_zero: cv.zero == null ? '' : cell_(!!cv.zero),
    cv_home_charge: cv.homeCharge == null ? '' : cv.homeCharge,
    cv_show_car: cv.showCar == null ? '' : cell_(!!cv.showCar),
    cv_car_now: cv.carNow == null ? '' : cell_(!!cv.carNow),
    cv_sq_label: cv.sqLabel || '',
    cv_bus_base: cv.busBase == null ? '' : cv.busBase,
    cv_km: cv.km == null ? '' : cv.km,
    cv_weekly_km_helper: cv.weeklyKmHelper == null ? '' : cv.weeklyKmHelper,
    cv_on_demand: cv.onDemand == null ? '' : cell_(!!cv.onDemand),
    cv_sq_carrier: cv.sqCarrier || '',
    cv_car_electric: cv.carElectric == null ? '' : cell_(!!cv.carElectric),
    q_attn1_pass: q.attn1_pass == null ? '' : cell_(!!q.attn1_pass),
    q_attn2_pass: q.attn2_pass == null ? '' : cell_(!!q.attn2_pass),
    q_exampleA_choice: q.exampleA_choice || '',
    q_exampleA_petrol: q.exampleA_petrol_choice == null ? '' : cell_(!!q.exampleA_petrol_choice),
    q_median_task_sec: q.median_task_sec == null ? '' : q.median_task_sec,
    q_straightlined_att: q.straightlined_att == null ? '' : cell_(!!q.straightlined_att),
    q_straightlined_mod: q.straightlined_mod == null ? '' : cell_(!!q.straightlined_mod),
    timings_json: cell_(timings),
    timings_first_json: cell_(first),
    raw_json: parts[0],
    raw_json_2: parts[1]
  };
  ATT_IDS.forEach(function (id) {
    map['att_' + id] = att[id] == null ? '' : att[id];
  });
  MOD_IDS.forEach(function (id) {
    map['mod_' + id] = mod[id] == null ? '' : mod[id];
  });
  for (var i = 1; i <= DCE_A_TASKS; i++) {
    var a = pick_(shownA, i) || {};
    map['dceA'+i+'_choice'] = pick_(chA, i);
    map['dceA'+i+'_block'] = a.block == null ? '' : a.block;
    map['dceA'+i+'_levels'] = cell_(a.levels || []);
    map['dceA'+i+'_pp'] = a.pp == null ? '' : a.pp;
    map['dceA'+i+'_ep'] = a.ep == null ? '' : a.ep;
    map['dceA'+i+'_range'] = a.range == null ? '' : a.range;
    map['dceA'+i+'_fast'] = a.fast == null ? '' : a.fast;
    map['dceA'+i+'_avail_lvl'] = a.availLvl == null ? '' : a.availLvl;
    map['dceA'+i+'_pcost'] = a.pcost == null ? '' : a.pcost;
    map['dceA'+i+'_ecost_lvl'] = a.ecostLvl == null ? '' : a.ecostLvl;
    map['dceA'+i+'_ecost'] = a.ecost == null ? '' : a.ecost;
    map['dceA'+i+'_gov'] = a.gov || '';
    map['dceA'+i+'_home_charge'] = a.homeCharge == null ? '' : cell_(!!a.homeCharge);
    map['dceA'+i+'_sq_carrier'] = a.sqCarrier || '';
  }
  for (var j = 1; j <= DCE_B_TASKS; j++) {
    var b = pick_(shownB, j) || {};
    map['dceB'+j+'_choice'] = pick_(chB, j);
    map['dceB'+j+'_block'] = b.block == null ? '' : b.block;
    map['dceB'+j+'_levels'] = cell_(b.levels || []);
    map['dceB'+j+'_freq'] = b.freq || '';
    map['dceB'+j+'_rel'] = b.rel || '';
    map['dceB'+j+'_walk'] = b.walk == null ? '' : b.walk;
    map['dceB'+j+'_ivt'] = b.ivt == null ? '' : b.ivt;
    map['dceB'+j+'_stop'] = b.stop || '';
    map['dceB'+j+'_fare'] = b.fare == null ? '' : b.fare;
    map['dceB'+j+'_rt'] = b.rt || '';
    map['dceB'+j+'_trac'] = b.trac || '';
    map['dceB'+j+'_car'] = b.car == null ? '' : b.car;
    map['dceB'+j+'_fuel_lvl'] = b.fuelLvl == null ? '' : b.fuelLvl;
    map['dceB'+j+'_fuel_carrier'] = b.fuelCarrier || '';
    map['dceB'+j+'_park_lvl'] = b.parkLvl == null ? '' : b.parkLvl;
    map['dceB'+j+'_sq_cost'] = b.sqCost == null ? '' : b.sqCost;
  }
  TIMING_KEYS.forEach(function (k) {
    map['t_' + k] = timings[k] == null ? '' : timings[k];
    map['t1_' + k] = first[k] == null ? '' : first[k];
  });
  return map;
}

function getSpreadsheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getResponsesSheet_() {
  const ss = getSpreadsheet_();
  var sheet = null;
  ss.getSheets().forEach(function (s) {
    if (s.getSheetId() === SHEET_GID) sheet = s;
  });
  if (!sheet) sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  ensureHeaders_(sheet);
  return sheet;
}

function ensureHeaders_(sheet) {
  const want = headers_();
  const lastCol = Math.max(sheet.getLastColumn(), 1);
  const lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    sheet.getRange(1, 1, 1, want.length).setValues([want]);
    styleHeader_(sheet, want.length);
    return;
  }
  const have = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function (h) { return String(h); });
  const missing = [];
  want.forEach(function (h) {
    if (have.indexOf(h) < 0) missing.push(h);
  });
  if (missing.length) {
    sheet.getRange(1, have.length + 1, 1, missing.length).setValues([missing]);
    styleHeader_(sheet, have.length + missing.length);
  }
}

function styleHeader_(sheet, nCols) {
  const range = sheet.getRange(1, 1, 1, nCols);
  range.setFontWeight('bold');
  range.setWrap(true);
  range.setBackground('#0d5c63');
  range.setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
}

function writeCodebook_() {
  const ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(CODEBOOK_NAME);
  if (!sheet) sheet = ss.insertSheet(CODEBOOK_NAME);
  sheet.clear();
  const rows = codebookRows_();
  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#0d5c63').setFontColor('#ffffff');
  sheet.setFrozenRows(1);
  sheet.autoResizeColumn(1);
  sheet.setColumnWidth(2, 560);
}

function appendResponse_(body, data) {
  const sheet = getResponsesSheet_();
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const map = rowMap_(data, body);
  const row = headers.map(function (h) {
    return map.hasOwnProperty(h) ? map[h] : '';
  });
  sheet.appendRow(row);
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
      'EV Survey endpoint is live. Sheet "' + sheet.getName() + '" has ' + rows +
      ' response(s) and ' + sheet.getLastColumn() + ' columns.'
    );
  } catch (err) {
    return ContentService.createTextOutput('Error: ' + String(err));
  }
}

/** Run once after pasting this file: expands columns and writes the codebook. */
function setupSheet() {
  getResponsesSheet_();
  writeCodebook_();
  Logger.log('Sheet columns: ' + headers_().length);
}

/** Run from the Apps Script editor to verify permissions and a sample row. */
function testWrite() {
  const sample = {
    respondentId: 'TEST1234',
    src: 'manual-test',
    s1: 'Lake Macquarie',
    suburb: 'Charlestown',
    age: '35–44',
    gender: 'Female',
    driver: 'Yes — I hold a licence and drive regularly',
    vehicles: 1,
    fuel: 'Petrol',
    designVersion: '4.14',
    referenceMonth: '2026-07',
    orderAtt: 'pre',
    orderDce: 'A-first',
    blockA: 0,
    blockB: 1,
    completedAt: new Date().toISOString(),
    consent: true,
    attitudes: { ENV1: 4, ATTN1: 2 },
    moderators: { RANGE1: 3, ATTN2: 4 },
    dceA: { 1: 'ev' },
    dceB: { 1: 'bus' },
    q8b1: ['Town or shopping centres'],
    meta: { device: 'desktop', durationSec: 12 },
    quality: { attn1_pass: true, attn2_pass: true },
    computed: { driver: 1, zero: false, homeCharge: 1, onDemand: false }
  };
  const body = JSON.stringify(sample);
  appendResponse_(body, sample);
  Logger.log('Test row written');
}
