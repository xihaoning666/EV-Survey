var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true}' }; };

  S.step = 0;
  S.declined = true;
  next();
  await sleep(2200);

  eq('one POST', POSTS.length, 1);
  var b = JSON.parse(POSTS[0].body);
  eq('exit_status declined', b.exit_status, 'declined');
  eq('declined flag set', b.declined, true);
  eq('terminated flag not set', b.terminated, false);
  eq('one navigation', NAV.length, 1);
  ok('refusal is reported to the panel as screened',
     NAV[0].indexOf('/payment/screened?num=1&ppid=PP0000000000000000000000000000000000000') > 0);

  var h = MAIN_HTML();
  ok('no "close this page" for a panel respondent', h.indexOf('close this page') < 0);
  ok('returning notice shown', h.indexOf('Returning you to Pureprofile') >= 0);
}
