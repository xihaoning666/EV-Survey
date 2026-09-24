var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  S.attitudes.ATTN1 = 2; S.moderators.ATTN2 = 4;
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield';
  S.timings = { welcome:100, screening:200, demo:200 };
  FETCH_HANDLER = function(){ return { abort:true }; };

  var t0 = Date.now();
  await finish();
  var dt = Date.now() - t0;

  eq('status failed', S.submit.status, 'failed');
  eq('3 attempts', S.submit.attempts, 3);
  eq('each attempt is a CORS try plus a no-cors fallback', POSTS.length, 6);
  ok('backoff between attempts', dt >= 1500 + 3000);
  eq('no navigation', NAV.length, 0);

  var h = MAIN_HTML();
  ok('return button offered to a panel respondent', h.indexOf('Return to Pureprofile') >= 0);
  ok('download still offered', h.indexOf('Download my answers') >= 0);

  returnToPanel();
  await sleep(1700);
  eq('clicking it redirects', NAV.length, 1);
  ok('to the completed endpoint', NAV[0].indexOf('/payment/completed') > 0);
}
