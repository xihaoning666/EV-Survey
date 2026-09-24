var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  S.attitudes.ATTN1 = 2; S.moderators.ATTN2 = 4;
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield';
  S.timings = { welcome:100, screening:200, demo:200 };
  __save();
  // CORS blocked, no-cors fallback goes through: the write is unconfirmed but probably landed.
  FETCH_HANDLER = function(url, init){
    return (init && init.mode === 'no-cors') ? { status:200, body:'' } : { abort:true };
  };

  await finish();
  eq('status sent', S.submit.status, 'sent');
  eq('but not confirmed', S.submit.confirmed, false);
  eq('one attempt only', S.submit.attempts, 1);
  eq('saved state cleared anyway for a panel respondent', LS[__LS_KEY], undefined);
  eq('they still get paid', NAV.length, 1);
  ok('completed endpoint', NAV[0].indexOf('/payment/completed') > 0);
}
