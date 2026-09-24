var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
function fill(S){
  S.consent = true;
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield'; S.suburbLga = 'Newcastle';
  S.age = '35-44'; S.gender = 'Female'; S.driver = 'Yes';
  S.vehicles = 1; S.fuel = 'Petrol'; S.vehAge = '5-9 years'; S.weeklyKm = '200'; S.fuelSpend = '60';
  S.mode = 'Drive myself'; S.door = '25'; S.ivt = '20'; S.tripKm = '12';
  S.attitudes.ATTN1 = 2; S.moderators.ATTN2 = 4;
  S.timings = { welcome:20, screening:45, travelVeh:60, travelTrip:80, home:40, ev:70,
                attitudes:95, dceA3_0:30, dceB3_0:25, demo:35 };   // 500 s active
}
async function CASE_RUN(){
  var S = __S();
  fill(S);
  __save();
  ok('state is saved before finishing', !!LS[__LS_KEY]);

  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true,"row":7}', delayMs:800 }; };

  var t0 = Date.now();
  var p = finish();
  await sleep(400);
  eq('no navigation while the POST is in flight', NAV.length, 0);
  ok('sending screen shown', MAIN_HTML().indexOf('Sending your answers') >= 0);
  await p;
  var dt = Date.now() - t0;

  eq('one POST', POSTS.length, 1);
  eq('POST is a real CORS request, not no-cors', POSTS[0].mode, 'cors');
  var b = JSON.parse(POSTS[0].body);
  eq('exit_status complete', b.exit_status, 'complete');
  eq('ppid on the record', b.ppid, 'PP0000000000000000000000000000000000000');
  eq('version stamp', b.designVersion, '4.15');
  eq('active_sec summed from timings', b.quality.active_sec, 500);
  eq('no dq reason', b.quality.dq_reason, '');
  eq('attention checks pass', b.quality.attn1_pass && b.quality.attn2_pass, true);

  eq('one navigation', NAV.length, 1);
  ok('completed endpoint + ppid',
     NAV[0] === 'https://surveyengine.pureprofile.com/api/v1/universal/payment/completed?num=1&ppid=PP0000000000000000000000000000000000000');
  ok('redirect happens only after the response', dt >= 800 + 1500);

  eq('saved state cleared', LS[__LS_KEY], undefined);
  var h = MAIN_HTML();
  ok('no download button for a panel respondent', h.indexOf('Download a copy of my answers') < 0);
  ok('returning notice shown', h.indexOf('Returning you to Pureprofile') >= 0);
  ok('reference still shown', h.indexOf(S.respondentId) >= 0);
}
