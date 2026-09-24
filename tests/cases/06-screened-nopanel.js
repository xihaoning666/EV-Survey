var CASE_SEARCH = '';
async function CASE_RUN(){
  var S = __S();
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true,"row":3}' }; };

  S.step = __flow().indexOf('screening');
  S.s1 = 'Neither';
  next();
  await sleep(2200);

  eq('still one POST', POSTS.length, 1);
  var b = JSON.parse(POSTS[0].body);
  eq('exit_status recorded', b.exit_status, 'screened');
  eq('empty ppid', b.ppid, '');
  eq('no navigation', NAV.length, 0);

  var h = MAIN_HTML();
  ok('v4.14 text unchanged', h.indexOf('open only to Lake Macquarie and Newcastle LGA residents') >= 0);
  ok('no panel notice', h.indexOf('Pureprofile') < 0);
}
