var CASE_SEARCH = '';
async function CASE_RUN(){
  var S = __S();
  S.attitudes.ATTN1 = 2; S.moderators.ATTN2 = 4;
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield';
  S.timings = { welcome:100, screening:200, demo:200 };
  FETCH_HANDLER = function(){ return { abort:true }; };

  await finish();
  eq('status failed', S.submit.status, 'failed');
  ok('no return button without a ppid', MAIN_HTML().indexOf('Return to Pureprofile') < 0);
  ok('v4.14 wording kept', MAIN_HTML().indexOf('attempt 3 of 3 failed') >= 0);
}
