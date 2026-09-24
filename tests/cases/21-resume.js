var CASE_SEARCH = '?ppid=PPX000000000000000000000000000000000000';
function CASE_PRE(){
  localStorage.setItem('lm_ev_survey_v415', JSON.stringify({
    respondentId:'OLD-1', ppid:'PPY000000000000000000000000000000000000', panel:'pureprofile',
    step:5, s1:'Newcastle', suburb:'Mayfield', startedAt:new Date().toISOString(),
    completedAt:null, terminated:false, declined:false, quotaFull:false
  }));
}
async function CASE_RUN(){
  var S = __S();
  eq('a different panellist is never offered the previous session', CONFIRMS.length, 0);
  eq('fresh state', S.step, 0);
  eq('fresh respondent id', S.respondentId === 'OLD-1', false);
  eq('this arrival\'s ppid', S.ppid, 'PPX000000000000000000000000000000000000');
  eq('the stale save is discarded', LS['lm_ev_survey_v415'], undefined);
}
