var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  __CONFIG.PANEL.QUOTAS['Newcastle'] = 100;
  FETCH_HANDLER = function(url, init){
    if ((init && init.method) !== 'POST') {
      return { status:200, body:JSON.stringify({ ok:true, counts:{ complete_by_lga:{ 'Lake Macquarie':4, 'Newcastle':100 } } }) };
    }
    return { status:200, body:'{"ok":true}' };
  };

  S.step = __flow().indexOf('screening');
  S.s1 = 'Newcastle'; setSuburb('Mayfield'); S.step = __flow().indexOf('screening');
  S.age = '35-44'; S.gender = 'Female'; S.driver = 'Yes';
  next();
  await sleep(2500);

  eq('stats endpoint consulted once', GETS.length, 1);
  ok('with the stats flag', GETS[0].url.indexOf('?stats=1') > 0);
  eq('did not advance into the questionnaire', S.quotaFull, true);
  eq('one POST', POSTS.length, 1);
  eq('exit_status quotafull', JSON.parse(POSTS[0].body).exit_status, 'quotafull');
  eq('one navigation', NAV.length, 1);
  ok('quotafull endpoint', NAV[0].indexOf('/payment/quotafull?num=1&ppid=PP0000000000000000000000000000000000000') > 0);

  var h = MAIN_HTML();
  ok('quota page shown', h.indexOf('enough responses from your area') >= 0);
  ok('returning notice shown', h.indexOf('Returning you to Pureprofile') >= 0);
  ok('no Next/Back nav', h.indexOf('onclick="next()"') < 0);
  eq('progress text blank', PROG_TXT(), '');
}
