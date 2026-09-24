var CASE_SEARCH = '?ppid=PP0000000000000000000000000000000000000';
async function CASE_RUN(){
  var S = __S();
  S.attitudes.ATTN1 = 2; S.moderators.ATTN2 = 4;
  S.s1 = 'Newcastle'; S.suburb = 'Mayfield';
  S.timings = { welcome:10, screening:20, demo:30 };      // 60 s active
  FETCH_HANDLER = function(){ return { status:200, body:'{"ok":true}' }; };

  eq('default threshold', __CONFIG.PANEL.DQ.min_active_sec, 240);
  var p1 = __payload();
  eq('speeder flagged below the threshold', p1.quality.dq_reason, 'speeder');
  eq('speeder is a disqualification for a panel respondent', p1.exit_status, 'disqualified');
  eq('active_sec', p1.quality.active_sec, 60);

  __CONFIG.PANEL.DQ.min_active_sec = 0;                   // rule switched off
  var p2 = __payload();
  eq('no speeder flag when the rule is off', p2.quality.dq_reason, '');
  eq('exit_status back to complete', p2.exit_status, 'complete');

  __CONFIG.PANEL.DQ.min_active_sec = 100000;              // very high
  S.attitudes.ATTN1 = 5; S.moderators.ATTN2 = 1;
  var p3 = __payload();
  eq('both rules can fire together', p3.quality.dq_reason, 'attention_both|speeder');
}
