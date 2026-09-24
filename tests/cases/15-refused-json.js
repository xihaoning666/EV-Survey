var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  S.attitudes.ATTN1 = 2; S.moderators.ATTN2 = 4;
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield';
  S.timings = { welcome:100, screening:200, demo:200 };
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":false,"error":"version mismatch: expected 4.15, got 4.14"}' }; };

  await finish();
  eq('exactly one attempt, no retry', POSTS.length, 1);
  eq('no blind no-cors re-post', POSTS.filter(function(p){ return p.mode==='no-cors'; }).length, 0);
  eq('status refused', S.submit.status, 'refused');
  eq('no navigation', NAV.length, 0);

  var h = MAIN_HTML();
  ok('honest message', h.indexOf('the data collection service rejected the submission') >= 0);
  ok('try again offered', h.indexOf('Try again') >= 0);
  ok('download offered', h.indexOf('Download my answers') >= 0);
  ok('panel respondent told their reward is safe', h.indexOf('Pureprofile reward is credited') >= 0);
}
