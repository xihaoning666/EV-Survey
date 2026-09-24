var CASE_SEARCH = '?ppid=PPX000000000000000000000000000000000000';
function CASE_PRE(){
  localStorage.setItem('lm_ev_survey_v415', JSON.stringify({
    respondentId:'OLD-1', ppid:'PPX000000000000000000000000000000000000', panel:'pureprofile',
    step:5, s1:'Newcastle', suburb:'Mayfield', startedAt:new Date().toISOString(),
    completedAt:null, terminated:false, declined:false, quotaFull:false
  }));
}
async function CASE_RUN(){
  var S = __S();
  eq('the same panellist is offered their session', CONFIRMS.length, 1);
  ok('with the v4.14 wording', CONFIRMS[0].indexOf('Continue where you left off?') >= 0);
  eq('and resumes', S.step, 5);
  eq('keeping the original respondent id', S.respondentId, 'OLD-1');
}
