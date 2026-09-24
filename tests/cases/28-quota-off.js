var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  eq('quotas ship switched off', __CONFIG.PANEL.QUOTAS['Newcastle'], 0);
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true}' }; };

  var screening = __flow().indexOf('screening');
  S.step = screening;
  S.s1 = 'Newcastle'; setSuburb('Mayfield'); S.step = screening;
  S.age = '35-44'; S.gender = 'Female'; S.driver = 'Yes';
  next();
  await sleep(300);

  eq('the respondent proceeds', S.step, screening + 1);
  eq('the stats endpoint is never called', GETS.length, 0);
}
