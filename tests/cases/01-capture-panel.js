var CASE_SEARCH = '?ppid=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcde';
async function CASE_RUN(){
  var S = __S();
  eq('ppid captured verbatim', S.ppid, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcde');
  eq('panel stamped', S.panel, 'pureprofile');
  eq('src defaults to panel name', S.src, 'pureprofile');
  eq('designVersion', S.designVersion, '4.15');
  eq('quotaFull initialised', S.quotaFull, false);
  ok('welcome screen rendered', MAIN_HTML().indexOf('agree to take part') >= 0);
}
