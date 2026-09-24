/* Loads one case file against a fresh copy of the survey. Driven by tests/run.sh; the working
   directory is the build directory that run.sh assembles. */
load('shim.js');
load('case.js');

location.search = (typeof CASE_SEARCH !== 'undefined') ? CASE_SEARCH : '';
if (typeof CASE_PRE === 'function') CASE_PRE();   // seed localStorage before the page boots

load('suburbs-data.js');
load('app.js');

__CONFIG.PANEL.NAVIGATE = function(u){ NAV.push(u); };   // the single navigation point

(async function(){
  try { await CASE_RUN(); }
  catch (e) { FAIL++; print('  FAIL  uncaught: ' + (e && e.stack || e)); }
  print('  ---- ' + PASS + ' passed, ' + FAIL + ' failed');
  if (FAIL) print('HAS_FAILURES');
})();
