var CASE_SEARCH = '';
function CASE_PRE(){
  localStorage.setItem('lm_ev_survey_v415', JSON.stringify({
    respondentId:'OLD-1', ppid:'PPX000000000000000000000000000000000000',
    step:5, startedAt:new Date().toISOString(),
    completedAt:null, terminated:false, declined:false, quotaFull:false
  }));
}
async function CASE_RUN(){
  var S = __S();
  eq('a panel session is not offered to a bare link', CONFIRMS.length, 0);
  eq('fresh state', S.step, 0);
  eq('and the save is discarded', LS['lm_ev_survey_v415'], undefined);
}
