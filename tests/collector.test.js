/* Apps Script shim + tests for backend/collector.gs. */
var PASS = 0, FAIL = 0;
function ok(n, c, d){ if(c){ PASS++; print('  PASS  ' + n); } else { FAIL++; print('  FAIL  ' + n + (d!==undefined?'  <<< '+d:'')); } }
function eq(n, g, w){ ok(n, g===w, 'got ' + JSON.stringify(g) + ', want ' + JSON.stringify(w)); }

var SHEETS = {};
function FakeSheet(name){
  this.name = name; this.rows = [];
  this.getLastRow = function(){ return this.rows.length; };
  this.getLastColumn = function(){ return this.rows.length ? this.rows[0].length : 0; };
  this.setFrozenRows = function(){};
  this.appendRow = function(r){ this.rows.push(r.slice()); };
  this.getRange = function(r, c, nr, nc){
    var self = this;
    return {
      setValues: function(vals){
        for (var i=0; i<nr; i++){
          while (self.rows.length < r-1+i+1) self.rows.push([]);
          var row = self.rows[r-1+i];
          for (var j=0; j<nc; j++) row[c-1+j] = vals[i][j];
        }
        return this;
      },
      getValues: function(){
        var out = [];
        for (var i=0; i<nr; i++){
          var row = self.rows[r-1+i] || [];
          out.push(row.slice(c-1, c-1+nc));
        }
        return out;
      },
      setFontWeight:function(){return this;}, setBackground:function(){return this;},
      setFontColor:function(){return this;}, setWrap:function(){return this;}
    };
  };
}
var SpreadsheetApp = {
  openById: function(){
    return {
      getSheetByName: function(n){ return SHEETS[n] || null; },
      insertSheet: function(n){ SHEETS[n] = new FakeSheet(n); return SHEETS[n]; }
    };
  }
};
var LockService = { getScriptLock: function(){ return { waitLock:function(){}, releaseLock:function(){} }; } };
var Utilities = { formatDate: function(){ return '2026-09-24 20:10:00'; } };
var ContentService = {
  MimeType: { JSON:'application/json' },
  createTextOutput: function(t){ return { _t:t, setMimeType:function(){ return this; }, getContent:function(){ return this._t; } }; }
};
var Logger = { log: function(){} };

load('collector.gs');

function post(obj){
  var body = JSON.stringify(obj);
  return JSON.parse(doPost({ postData:{ contents: body } })._t);
}
function get(){ return JSON.parse(doGet({ parameter:{ stats:'1' } })._t); }

function fullRecord(over){
  var p = {
    respondentId:'R1', ppid:'PPA', panel:'pureprofile', src:'pureprofile', referrer:'',
    designVersion:'4.15', referenceMonth:'September 2026',
    startedAt:'2026-09-24T09:00:00.000Z', completedAt:'2026-09-24T09:12:00.000Z',
    s1:'Newcastle', suburbLga:'Newcastle', suburb:'Mayfield', suburbZone:2,
    age:'35-44', gender:'Female', driver:'Yes', vehicles:1, fuel:'Petrol',
    orderAtt:'pre', orderDce:'A-first', blockA:0, blockB:2,
    exit_status:'complete',
    computed:{ homeCharge:1 },
    quality:{ attn1_pass:true, attn2_pass:true, active_sec:500, dq_reason:'' },
    meta:{ device:'desktop', durationSec:720 }
  };
  for (var k in (over||{})) p[k] = over[k];
  return p;
}

print('== schema');
setupSheet();
var sh = SHEETS[SHEET_NAME];
eq('tab created', !!sh, true);
eq('header written', sh.rows[0].length, HEADERS.length);
eq('payload_json is last', HEADERS[HEADERS.length-1], 'payload_json');
eq('no duplicate column names', new Set(HEADERS).size, HEADERS.length);
['ppid','panel','exit_status','dq_reason','active_sec','attn1_pass','attn2_pass','received_at_aest']
  .forEach(function(c){ ok('v4.15 column present: ' + c, HEADERS.indexOf(c) >= 0); });

print('== guards');
var r = post(fullRecord({ designVersion:'4.14' }));
eq('old version refused', r.ok, false);
ok('and the word mismatch is in the error', r.error.indexOf('mismatch') >= 0, r.error);
eq('nothing written', sh.getLastRow(), 1);

r = JSON.parse(doPost({ postData:{ contents:'not json' } })._t);
eq('bad json refused', r.ok, false);
ok('reported as bad json', r.error.indexOf('bad json') === 0, r.error);

sh.rows[0][3] = 'renamed';
r = post(fullRecord());
eq('a changed header refuses every write', r.ok, false);
ok('reported as a schema mismatch', r.error.indexOf('schema mismatch') === 0, r.error);
sh.rows[0][3] = HEADERS[3];

print('== a complete record');
r = post(fullRecord());
eq('accepted', r.ok, true);
eq('row 2', r.row, 2);
var row = sh.rows[1];
eq('respondent_id', row[COL.respondent_id], 'R1');
eq('ppid', row[COL.ppid], 'PPA');
eq('panel', row[COL.panel], 'pureprofile');
eq('exit_status', row[COL.exit_status], 'complete');
eq('lga from suburbLga', row[COL.lga], 'Newcastle');
eq('home_charging_feasible', row[COL.home_charging_feasible], 1);
eq('active_sec', row[COL.active_sec], 500);
eq('attn1_pass', row[COL.attn1_pass], 'TRUE');
eq('dq_reason blank', row[COL.dq_reason], '');
eq('blocks are 1-based in the sheet', row[COL.block_a] + '/' + row[COL.block_b], '1/3');
eq('completed', row[COL.completed], 'yes');
eq('aest stamp', row[COL.received_at_aest], '2026-09-24 20:10:00');
ok('payload_json holds the record', JSON.parse(row[COL.payload_json]).respondentId === 'R1');

print('== dedup');
r = post(fullRecord());
eq('same respondent is a duplicate', r.duplicate, true);
eq('and nothing new is written', sh.getLastRow(), 2);
r = post(fullRecord({ respondentId:'R2' }));
eq('same ppid is also a duplicate', r.duplicate, true);
r = post(fullRecord({ respondentId:'R2', ppid:'PPB' }));
eq('a different panellist is accepted', r.ok && !r.duplicate, true);

print('== early exits');
r = post({ respondentId:'R3', ppid:'PPC', panel:'pureprofile', designVersion:'4.15',
           s1:'Neither', exit_status:'screened', terminated:true });
eq('screen-out accepted', r.ok, true);
eq('quality columns left blank', sh.rows[sh.rows.length-1][COL.active_sec], '');
eq('completed flag', sh.rows[sh.rows.length-1][COL.completed], 'no');
r = post({ respondentId:'R3', ppid:'PPC', designVersion:'4.15', s1:'Neither', exit_status:'screened' });
eq('the same screen-out is a duplicate', r.duplicate, true);
r = post(fullRecord({ respondentId:'R3', ppid:'PPC' }));
eq('but a later full record from the same person still lands', r.ok && !r.duplicate, true);

r = post({ respondentId:'R4', designVersion:'4.15', declined:true });
eq('a consent refusal without exit_status is inferred', sh.rows[sh.rows.length-1][COL.exit_status], 'declined');
r = post({ respondentId:'R5', designVersion:'4.15', terminated:true });
eq('a terminate without exit_status is inferred', sh.rows[sh.rows.length-1][COL.exit_status], 'screened');

print('== stats');
post(fullRecord({ respondentId:'R6', ppid:'', panel:'', src:'lmcc-news',
                  s1:'Lake Macquarie', suburbLga:'Lake Macquarie', computed:{ homeCharge:0 } }));
post(fullRecord({ respondentId:'R7', ppid:'PPD', exit_status:'disqualified',
                  quality:{ attn1_pass:false, attn2_pass:false, active_sec:40, dq_reason:'attention_both' } }));
post({ respondentId:'R8', ppid:'PPE', designVersion:'4.15', exit_status:'quotafull', quotaFull:true,
       s1:'Newcastle', suburbLga:'Newcastle' });
var st = get();
eq('stats ok', st.ok, true);
eq('version', st.version, '4.15');
eq('completes', st.counts.complete, 4);
eq('disqualified', st.counts.disqualified, 1);
eq('screened', st.counts.screened, 2);
eq('declined', st.counts.declined, 1);
eq('quotafull', st.counts.quotafull, 1);
eq('Newcastle completes', st.counts.complete_by_lga['Newcastle'], 3);
eq('Lake Macquarie completes', st.counts.complete_by_lga['Lake Macquarie'], 1);
eq('panel completes', st.counts.panel_complete, 3);
eq('non-panel completes', st.counts.nonpanel_complete, 1);
eq('home charging infeasible', st.counts.home_charging_infeasible, 1);
eq('last received', st.counts.last_received_at_aest, '2026-09-24 20:10:00');
ok('a disqualified record is not counted as a complete', st.counts.complete === 4);

print('');
print('  ---- ' + PASS + ' passed, ' + FAIL + ' failed');
if (FAIL) print('HAS_FAILURES');
