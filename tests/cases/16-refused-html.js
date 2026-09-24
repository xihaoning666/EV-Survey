var CASE_SEARCH = '';
async function CASE_RUN(){
  var S = __S();
  S.attitudes.ATTN1 = 2; S.moderators.ATTN2 = 4;
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield';
  S.timings = { welcome:100, screening:200, demo:200 };
  FETCH_HANDLER = function(){ return { status:200, body:'<!DOCTYPE html><html><title>Sign in - Google Accounts</title>' }; };

  await finish();
  eq('a 200 sign-in page is a refusal, not a success', S.submit.status, 'refused');
  eq('one attempt', POSTS.length, 1);
  ok('no panel wording without a ppid', MAIN_HTML().indexOf('Pureprofile') < 0);
  ok('honest message', MAIN_HTML().indexOf('rejected the submission') >= 0);
}
