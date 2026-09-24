var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true}' }; };

  S.step = __flow().indexOf('screening');
  S.s1 = 'Newcastle'; setSuburb('Mayfield'); S.step = __flow().indexOf('screening');
  S.age = 'Under 18';
  next();
  await sleep(2200);

  eq('one POST', POSTS.length, 1);
  var b = JSON.parse(POSTS[0].body);
  eq('exit_status screened', b.exit_status, 'screened');
  eq('lga carried for the collector', b.suburbLga, 'Newcastle');
  eq('one navigation', NAV.length, 1);
  ok('screened endpoint', NAV[0].indexOf('/payment/screened?num=1&ppid=PP0000000000000000000000000000000000000') > 0);
}
