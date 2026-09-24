var CASE_SEARCH = '';
async function CASE_RUN(){
  var S = __S();
  eq('no ppid', S.ppid, '');
  eq('no panel', S.panel, '');
  eq('no src', S.src, '');
  eq('no redirect url', __panelUrl('complete'), '');

  var f = __flow();
  S.step = f.indexOf('demo');
  render();
  ok('untagged arrival is asked how they heard', MAIN_HTML().indexOf('How did you first hear about this survey?') >= 0);

  S.src = 'lmcc-news';
  render();
  ok('tagged arrival is not asked', MAIN_HTML().indexOf('How did you first hear about this survey?') < 0);
}
