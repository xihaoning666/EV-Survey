var CASE_SEARCH = '';
async function CASE_RUN(){
  var S = __S();
  var profiles = [
    { name:'zero-car bus user',   set:function(){ S.vehicles=0; S.zeroCarFuel=''; S.mode='Bus'; S.driver='No'; } },
    { name:'petrol driver',       set:function(){ S.vehicles=1; S.fuel='Petrol'; S.mode='Drive myself'; S.driver='Yes'; } },
    { name:'BEV driver',          set:function(){ S.vehicles=2; S.fuel='Fully electric'; S.mode='Drive myself'; S.driver='Yes'; } },
    { name:'PHEV, no home park',  set:function(){ S.vehicles=1; S.fuel='Plug-in hybrid'; S.mode='Taxi / rideshare'; S.driver='Yes'; S.homePark='No'; } }
  ];
  var blank = 0, screens = 0;
  ['A-first','B-first'].forEach(function(order){
    ['pre','post'].forEach(function(att){
      profiles.forEach(function(p){
        S.orderDce = order; S.orderAtt = att;
        S.s1 = 'Lake Macquarie'; setSuburb('Charlestown');
        S.age='35-44'; S.gender='Female'; S.door='25'; S.ivt='20'; S.tripKm='12';
        S.terminated=false; S.declined=false; S.quotaFull=false;
        p.set();
        var f = __flow();
        for (var i=0; i<f.length; i++){
          S.step = i;
          var n = (f[i]==='dceA3'||f[i]==='dceB3') ? 8 : 1;
          for (var t=0; t<n; t++){
            S.dceIdx = t;
            render();
            screens++;
            if (MAIN_HTML().length < 120) blank++;
          }
        }
        S.dceIdx = 0;
      });
    });
  });
  ok('every screen renders without throwing (' + screens + ' renders)', screens > 0);
  eq('no blank screen', blank, 0);

  S.orderDce='A-first'; S.orderAtt='pre'; S.vehicles=1; S.fuel='Petrol';
  eq('still 28 pages', nScreens(), 28);

  S.step = 3;
  render();
  ok('progress text restored on a normal screen', PROG_TXT().indexOf('of 28') > 0);
}
