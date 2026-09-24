var CASE_SEARCH = '';
async function CASE_RUN(){
  var S = __S();
  __CONFIG.PANEL.QUOTAS['Newcastle'] = 1;
  FETCH_HANDLER = function(url, init){
    if ((init && init.method) !== 'POST') {
      return { status:200, body:JSON.stringify({ ok:true, counts:{ complete_by_lga:{ 'Newcastle':9999 } } }) };
    }
    return { status:200, body:'{"ok":true}' };
  };

  var screening = __flow().indexOf('screening');
  S.step = screening;
  S.s1 = 'Newcastle'; setSuburb('Mayfield'); S.step = screening;
  S.age = '35-44'; S.gender = 'Female'; S.driver = 'Yes';
  next();
  await sleep(300);

  eq('a community respondent is never quota-screened', S.step, screening + 1);
  eq('and the stats endpoint is not called', GETS.length, 0);
  eq('not flagged quota full', S.quotaFull, false);
}
