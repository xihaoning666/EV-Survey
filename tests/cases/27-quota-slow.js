var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  __CONFIG.PANEL.QUOTAS['Newcastle'] = 100;
  FETCH_HANDLER = function(url, init){
    if ((init && init.method) !== 'POST') {
      return { status:200, delayMs:5000, body:JSON.stringify({ ok:true, counts:{ complete_by_lga:{ 'Newcastle':100 } } }) };
    }
    return { status:200, body:'{"ok":true}' };
  };

  var screening = __flow().indexOf('screening');
  S.step = screening;
  S.s1 = 'Newcastle'; setSuburb('Mayfield'); S.step = screening;
  S.age = '35-44'; S.gender = 'Female'; S.driver = 'Yes';

  var t0 = Date.now();
  next();
  await sleep(3800);
  var dt = Date.now() - t0;

  eq('a slow stats call does not block the respondent', S.step, screening + 1);
  ok('and it gives up inside ~3.5 s', dt < 4000);
  eq('not flagged quota full', S.quotaFull, false);
}
