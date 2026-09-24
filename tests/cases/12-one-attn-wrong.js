var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  S.attitudes.ATTN1 = 2; S.moderators.ATTN2 = 1;          // only one wrong
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield';
  S.timings = { welcome:100, screening:200, demo:200 };
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true}' }; };

  await finish();
  var b = JSON.parse(POSTS[0].body);
  eq('one failed check is not a disqualification', b.exit_status, 'complete');
  eq('no dq reason', b.quality.dq_reason, '');
  eq('attn2 flag still recorded for analysis', b.quality.attn2_pass, false);
  ok('completed endpoint', NAV[0].indexOf('/payment/completed') > 0);
}
