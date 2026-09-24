var CASE_SEARCH = '';
function CASE_PRE(){
  localStorage.setItem('lm_ev_survey_v415', JSON.stringify({
    respondentId:'OLD-1', ppid:'', step:5, startedAt:new Date().toISOString(),
    completedAt:null, terminated:false, declined:false, quotaFull:true
  }));
}
async function CASE_RUN(){
  var S = __S();
  eq('a quota-full session is never resumed', CONFIRMS.length, 0);
  eq('fresh state', S.step, 0);
}
