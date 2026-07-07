export type Zone = 1 | 2 | 3;
export type LGA = 'Lake Macquarie' | 'Newcastle';

export interface SuburbEntry {
  name: string;
  lgas: LGA[];
  zone: Zone | null;
  onDemand: boolean;
}

export type Likert5 = 1 | 2 | 3 | 4 | 5;

export interface DCEAChoice {
  taskId: number;
  petrolPrice: number;
  evPrice: number;
  evRange: number;
  fastChargeMin: number;
  chargingAccess: string;
  petrolCost100: number;
  evCost100: number;
  govSupport: string;
}

export interface DCEBChoice {
  taskId: number;
  frequency: string;
  reliability: string;
  busIvtMin: number;
  walkMin: number;
  stopQuality: string;
  busFareReturn: number;
  carCostReturn?: number;
  realtimeInfo: boolean;
  busType: string;
}

export interface SurveyAnswers {
  // Meta
  designVersion: string;
  referenceMonth: string;
  startedAt: string;
  completedAt?: string;
  orderAtt: 'pre' | 'post';
  orderDce: 'A-first' | 'B-first';
  attitudeItemOrder: string[];
  moderatorItemOrder: string[];

  // Part 0
  consent: boolean;

  // Part 1
  s1_lga: 'Lake Macquarie' | 'Newcastle' | 'Neither' | '';
  s2_suburb: string;
  s2_lga: LGA | null;
  s2_zone: Zone | null;
  s3_age: string;
  s4_gender: string;
  s5_driver: string;

  // Part 2
  q21_vehicles: number | null;
  q22_fuel: string;
  q23_age: string;
  q24_weeklyKm: number | null;
  q25_fuelSpend: number | null;
  q25_phevPetrol: number | null;
  q25_phevElec: number | null;
  q26_doorTime: number | null;
  q26a_ivt: number | null;
  q26b_tripKm: number | null;
  q26c_tripCost: number | null;
  q26d_mode: string;
  q26d2_zeroCarFuel: string;
  q26e_freq: string;
  q26f_fareType: string;
  q26g_fareElig: string;
  q27_carDriver: string;
  q27_carPassenger: string;
  q27_bus: string;
  q27_onDemand: string;
  q27_walk: string;
  q28_barriers: string[];
  q29_longTrip: string;

  // Part 3
  q31_dwelling: string;
  q32_tenure: string;
  q33_parking: string;
  q34_charger: string;

  // Part 4
  q41_evExp: string;
  q46_evFamiliarity: string;
  q42_replace: string;
  q43_vehClass: string;
  q43b_newUsed: string;
  q44_awareness: string;
  q45_expectedKm: number | null;
  q45_unsure: boolean;

  // Part 5 attitudes (keyed by item id)
  attitudes: Record<string, Likert5 | null>;

  // DCE-A
  dceAExample: string | null;
  dceAChoices: Record<number, 'petrol' | 'ev' | 'statusquo'>;
  certA: number | null;
  consA: string;

  // DCE-B
  dceBExample: string | null;
  dceBChoices: Record<number, 'statusquo' | 'bus'>;
  certB: number | null;
  anaB: string[];
  consStudy: string;
  evInt: number | null;

  // Part 7B
  moderators: Record<string, Likert5 | null>;

  // Part 8
  q81_actions: string[];
  q82_elecInterest: string;
  q83_bipolar: number | null;
  q84_worry: Record<string, string>;
  q85_interest: Record<string, string>;

  // Part 8B
  q8b1_locations: string[];
  q8b2_suburb: string;

  // Part 9
  q91_adults: number | null;
  q91_children: number | null;
  q92_work: string;
  q93_education: string;
  q94_income: string;
  q95_solar: string;
  q96_battery: string;
  q97_elecBill: string;

  // Part 10
  q101_comments: string;
}

export interface ComputedVars {
  driver: 0 | 1;
  homeChargeFeasible: 0 | 1;
  refCostPer100Km: number | null;
  busIvtBase: number | null;
  weeklyKmForHelper: number | null;
  showCarCostInDCEB: boolean;
  dceBStatusQuoLabel: string;
  zeroCar: boolean;
  skipVehicleQuestions: boolean;
}

export function createInitialAnswers(): SurveyAnswers {
  const orderAtt: 'pre' | 'post' = Math.random() < 0.5 ? 'pre' : 'post';
  const orderDce: 'A-first' | 'B-first' = Math.random() < 0.5 ? 'A-first' : 'B-first';

  const attitudeIds = [
    'ENV1', 'ENV2', 'ENV3', 'ENV4', 'ENV5',
    'ESA1', 'ESA2', 'ESA5', 'ESA7', 'ESA9', 'ESA10',
    'ATTN1',
    'TECH1', 'TECH2', 'TECH3', 'TECH4',
    'PC1', 'PC2', 'PC3', 'MK1', 'MK2',
  ];
  const shuffled = [...attitudeIds];
  // Keep ATTN1 near middle
  const attnIdx = shuffled.indexOf('ATTN1');
  shuffled.splice(attnIdx, 1);
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const mid = Math.floor(shuffled.length / 2);
  shuffled.splice(mid, 0, 'ATTN1');

  const modIds = [
    'RANGE1', 'RANGE2', 'RANGE3',
    'CHARGE1', 'CHARGE2', 'CHARGE3',
    'PT1', 'PT2', 'PT3', 'PT4',
    'ATTN2',
  ];
  const modShuffled = [...modIds];
  const attn2Idx = modShuffled.indexOf('ATTN2');
  modShuffled.splice(attn2Idx, 1);
  for (let i = modShuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [modShuffled[i], modShuffled[j]] = [modShuffled[j], modShuffled[i]];
  }
  modShuffled.splice(Math.floor(modShuffled.length / 2), 0, 'ATTN2');

  const attitudes: Record<string, Likert5 | null> = {};
  attitudeIds.forEach((id) => { attitudes[id] = null; });
  const moderators: Record<string, Likert5 | null> = {};
  modIds.forEach((id) => { moderators[id] = null; });

  return {
    designVersion: '4.10',
    referenceMonth: '2026-07',
    startedAt: new Date().toISOString(),
    orderAtt,
    orderDce,
    attitudeItemOrder: shuffled,
    moderatorItemOrder: modShuffled,
    consent: false,
    s1_lga: '',
    s2_suburb: '',
    s2_lga: null,
    s2_zone: null,
    s3_age: '',
    s4_gender: '',
    s5_driver: '',
    q21_vehicles: null,
    q22_fuel: '',
    q23_age: '',
    q24_weeklyKm: null,
    q25_fuelSpend: null,
    q25_phevPetrol: null,
    q25_phevElec: null,
    q26_doorTime: null,
    q26a_ivt: null,
    q26b_tripKm: null,
    q26c_tripCost: null,
    q26d_mode: '',
    q26d2_zeroCarFuel: '',
    q26e_freq: '',
    q26f_fareType: '',
    q26g_fareElig: '',
    q27_carDriver: '',
    q27_carPassenger: '',
    q27_bus: '',
    q27_onDemand: '',
    q27_walk: '',
    q28_barriers: [],
    q29_longTrip: '',
    q31_dwelling: '',
    q32_tenure: '',
    q33_parking: '',
    q34_charger: '',
    q41_evExp: '',
    q46_evFamiliarity: '',
    q42_replace: '',
    q43_vehClass: '',
    q43b_newUsed: '',
    q44_awareness: '',
    q45_expectedKm: null,
    q45_unsure: false,
    attitudes,
    dceAExample: null,
    dceAChoices: {},
    certA: null,
    consA: '',
    dceBExample: null,
    dceBChoices: {},
    certB: null,
    anaB: [],
    consStudy: '',
    evInt: null,
    moderators,
    q81_actions: [],
    q82_elecInterest: '',
    q83_bipolar: null,
    q84_worry: {},
    q85_interest: {},
    q8b1_locations: [],
    q8b2_suburb: '',
    q91_adults: null,
    q91_children: null,
    q92_work: '',
    q93_education: '',
    q94_income: '',
    q95_solar: '',
    q96_battery: '',
    q97_elecBill: '',
    q101_comments: '',
  };
}
