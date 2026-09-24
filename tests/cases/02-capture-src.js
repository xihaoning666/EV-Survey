var CASE_SEARCH = '?src=pp-w1&ppid=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcde';
async function CASE_RUN(){
  var S = __S();
  eq('explicit src wins', S.src, 'pp-w1');
  eq('ppid still captured', S.ppid, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcde');
  eq('panel still stamped', S.panel, 'pureprofile');
}
