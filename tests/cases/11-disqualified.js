var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  S.attitudes.ATTN1 = 5; S.moderators.ATTN2 = 1;          // both attention items wrong
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield'; S.vehicles = 1; S.fuel = 'Petrol';
  S.timings = { welcome:100, screening:200, demo:200 };   // 500 s: not a speeder
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true}' }; };

  await finish();
  var b = JSON.parse(POSTS[0].body);
  eq('exit_status disqualified', b.exit_status, 'disqualified');
  eq('dq_reason', b.quality.dq_reason, 'attention_both');
  eq('one navigation', NAV.length, 1);
  ok('disqualified endpoint',
     NAV[0].indexOf('/payment/disqualified?num=1&ppid=PP0000000000000000000000000000000000000') > 0);
  ok('the record is still written', POSTS.length === 1);
}
