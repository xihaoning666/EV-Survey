var CASE_SEARCH = '?ppid=%3Cscript%3Ealert(1)%3C%2Fscript%3E';
async function CASE_RUN(){
  var S = __S();
  eq('ppid sanitised, not rejected', S.ppid, 'scriptalert1script');
  eq('panel stamped from sanitised id', S.panel, 'pureprofile');
  ok('questionnaire still reachable', MAIN_HTML().indexOf('agree to take part') >= 0);
  ok('redirect url is encoded', __panelUrl('complete').indexOf('ppid=scriptalert1script') > 0);
}
