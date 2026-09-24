var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  S.attitudes.ATTN1 = 2; S.moderators.ATTN2 = 4;
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield';
  S.timings = { welcome:100, screening:200, demo:200 };
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true,"duplicate":true,"row":12}' }; };

  await finish();
  eq('a duplicate is a success', S.submit.status, 'sent');
  eq('and it is confirmed', S.submit.confirmed, true);
  eq('one navigation', NAV.length, 1);
  ok('completed endpoint', NAV[0].indexOf('/payment/completed') > 0);
}
