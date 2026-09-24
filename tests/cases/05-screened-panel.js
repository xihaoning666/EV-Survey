var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true,"row":3}' }; };

  S.step = __flow().indexOf('screening');
  S.s1 = 'Neither';
  next();
  await sleep(2200);

  eq('exactly one POST', POSTS.length, 1);
  var b = JSON.parse(POSTS[0].body);
  eq('exit_status screened', b.exit_status, 'screened');
  eq('ppid on the record', b.ppid, 'PP0000000000000000000000000000000000000');
  eq('terminated flag kept for the old collector', b.terminated, true);
  eq('post uses keepalive', POSTS[0].keepalive, true);
  eq('no stats request', GETS.length, 0);

  eq('exactly one navigation', NAV.length, 1);
  eq('screened endpoint + ppid', NAV[0],
     'https://surveyengine.pureprofile.com/api/v1/universal/payment/screened?num=1&ppid=PP0000000000000000000000000000000000000');

  var h = MAIN_HTML();
  ok('screen-out text unchanged', h.indexOf('open only to Lake Macquarie and Newcastle LGA residents') >= 0);
  ok('returning notice shown', h.indexOf('Returning you to Pureprofile') >= 0);
  ok('manual fallback link shown', h.indexOf('click here') >= 0);
  ok('no Next/Back nav', h.indexOf('onclick="next()"') < 0);
  eq('progress text blank', PROG_TXT(), '');
}
