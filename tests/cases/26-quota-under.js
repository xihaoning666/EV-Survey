var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  __CONFIG.PANEL.QUOTAS['Newcastle'] = 100;
  FETCH_HANDLER = function(url, init){
    if ((init && init.method) !== 'POST') {
      return { status:200, body:JSON.stringify({ ok:true, counts:{ complete_by_lga:{ 'Newcastle':99 } } }) };
    }
    return { status:200, body:'{"ok":true}' };
  };

  var screening = __flow().indexOf('screening');
  S.step = screening;
  S.s1 = 'Newcastle'; setSuburb('Mayfield'); S.step = screening;
  S.age = '35-44'; S.gender = 'Female'; S.driver = 'Yes';
  next();
  await sleep(1000);

  eq('under the cap, the respondent proceeds', S.step, screening + 1);
  eq('not flagged quota full', S.quotaFull, false);
  eq('no exit POST', POSTS.length, 0);
  eq('no navigation', NAV.length, 0);
  eq('the check runs once', GETS.length, 1);
}
