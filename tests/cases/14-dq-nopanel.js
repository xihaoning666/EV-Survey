var CASE_SEARCH = '';
async function CASE_RUN(){
  var S = __S();
  S.attitudes.ATTN1 = 5; S.moderators.ATTN2 = 1;
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield';
  S.timings = { welcome:100, screening:200, demo:200 };
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true}' }; };

  await finish();
  var b = JSON.parse(POSTS[0].body);
  eq('a non-panel respondent is never disqualified', b.exit_status, 'complete');
  eq('but the reason is still recorded', b.quality.dq_reason, 'attention_both');
  eq('no navigation', NAV.length, 0);
  ok('thank-you page unchanged', MAIN_HTML().indexOf('Download a copy of my answers') >= 0);
}
