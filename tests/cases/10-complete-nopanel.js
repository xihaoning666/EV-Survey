var CASE_SEARCH = '';
function fill(S){
  S.attitudes.ATTN1 = 2; S.moderators.ATTN2 = 4;
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield'; S.vehicles = 1; S.fuel = 'Petrol';
  S.timings = { welcome:100, screening:200, demo:200 };
}
async function CASE_RUN(){
  var S = __S();
  fill(S);
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true,"row":7}' }; };
  await finish();

  var b = JSON.parse(POSTS[0].body);
  eq('exit_status complete', b.exit_status, 'complete');
  eq('empty ppid', b.ppid, '');
  eq('no navigation', NAV.length, 0);

  var h = MAIN_HTML();
  ok('download button still offered', h.indexOf('Download a copy of my answers') >= 0);
  ok('close-this-page text kept', h.indexOf('You can close this page now') >= 0);
  ok('no panel notice', h.indexOf('Pureprofile') < 0);
}
