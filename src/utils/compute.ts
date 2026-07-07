import type { SurveyAnswers, ComputedVars, DCEAChoice, DCEBChoice } from '../types';
import { VEHICLE_CLASS_BASE } from '../data/constants';

export function computeVars(a: SurveyAnswers): ComputedVars {
  const driver: 0 | 1 = a.s5_driver.includes('No') ? 0 : a.s5_driver ? 1 : 0;
  const zeroCar = a.q21_vehicles === 0;
  const skipVehicleQuestions = zeroCar;

  const parkingOk = [
    'Garage or carport at home',
    'Driveway / off-street at home',
    'Allocated space in shared/communal parking',
  ].includes(a.q33_parking);
  const chargerOk = ['Yes — a power point is already there', 'Yes — one could be installed and I\'m allowed to'].includes(a.q34_charger);
  const homeChargeFeasible: 0 | 1 = parkingOk && chargerOk ? 1 : 0;

  let refCostPer100Km: number | null = null;
  if (a.q24_weeklyKm && a.q24_weeklyKm > 0 && a.q25_fuelSpend != null) {
    refCostPer100Km = Math.round((100 * a.q25_fuelSpend / a.q24_weeklyKm) * 100) / 100;
  }

  const door = a.q26_doorTime ?? 0;
  const ivt = a.q26a_ivt ?? door;
  const tripKm = a.q26b_tripKm ?? 10;
  const mode = a.q26d_mode;

  let busIvtBase: number | null = null;
  if (mode === 'Walk or cycle') {
    busIvtBase = Math.max(10, 3 * tripKm);
  } else if (ivt > 0) {
    busIvtBase = ivt;
  } else if (door > 0) {
    busIvtBase = door;
  }

  const showCarCostInDCEB = mode === 'Drive myself' && driver === 1;
  let dceBStatusQuoLabel = 'Travel as you do now (your current way)';
  if (mode === 'Drive myself') dceBStatusQuoLabel = 'Drive (as you do now)';
  else if (mode === 'Bus' || mode === 'Lake Macquarie On Demand') dceBStatusQuoLabel = 'Your current bus / On Demand service';

  let weeklyKmForHelper: number | null = null;
  if (zeroCar) {
    if (!a.q45_unsure && a.q45_expectedKm != null) weeklyKmForHelper = a.q45_expectedKm;
  } else if (a.q24_weeklyKm) {
    weeklyKmForHelper = a.q24_weeklyKm;
  }

  return {
    driver,
    homeChargeFeasible,
    refCostPer100Km,
    busIvtBase,
    weeklyKmForHelper,
    showCarCostInDCEB,
    dceBStatusQuoLabel,
    zeroCar,
    skipVehicleQuestions,
  };
}

export function getChargingAccessLabel(feasible: 0 | 1, level: number): string {
  const levels = [
    'Nearest public charger more than 2 km away',
    'Some public chargers within about 2 km',
    'Many public and kerbside chargers within about 500 m',
  ];
  const pub = levels[level] ?? levels[1];
  if (feasible) return `You can charge at home overnight; ${pub.toLowerCase()}`;
  return pub;
}

export function getEvCost100(feasible: 0 | 1, costLevel: number): number {
  const home = [3, 6, 10];
  const pub = [8, 12, 18];
  const table = feasible ? home : pub;
  return table[costLevel % 3] ?? table[1];
}

export function generateDCEATasks(a: SurveyAnswers, cv: ComputedVars): DCEAChoice[] {
  const base = VEHICLE_CLASS_BASE[a.q43_vehClass] ?? 42000;
  const petrolMults = [0.9, 1.0, 1.15];
  const evPremiums = [-3000, 3000, 10000, 18000];
  const petrolCosts = [12, 15, 18];
  const ranges = [300, 450, 600];
  const chargeTimes = [15, 30, 60];
  const supports = [
    'None',
    'One-off $3,000 purchase rebate',
    'One-off $2,000 household energy-bill credit (first year only)',
    'Priority + discounted parking at selected local centres (first year)',
  ];

  const seeds = [0, 1, 2, 0, 1, 2, 1, 0];
  return seeds.map((s, i) => {
    const pm = petrolMults[s % 3];
    const petrolPrice = Math.round(base * pm / 500) * 500;
    const evPrem = evPremiums[(s + i) % 4];
    const evPrice = Math.round((petrolPrice + evPrem) / 500) * 500;
    const accessLevel = (s + i) % 3;
    const costLevel = (i + 1) % 3;
    return {
      taskId: i + 1,
      petrolPrice,
      evPrice,
      evRange: ranges[(s + i) % 3],
      fastChargeMin: chargeTimes[(i + s) % 3],
      chargingAccess: getChargingAccessLabel(cv.homeChargeFeasible, accessLevel),
      petrolCost100: petrolCosts[(s + i) % 3],
      evCost100: getEvCost100(cv.homeChargeFeasible, costLevel),
      govSupport: supports[(i + s) % 4],
    };
  });
}

export function getBusFareReturn(tripKm: number, fareType: string, level: number): number {
  const adultBands = [
    { max: 3, fares: [4.6, 6.6, 8.0] },
    { max: 8, fares: [6.2, 9.0, 10.8] },
    { max: 999, fares: [8.0, 11.6, 13.8] },
  ];
  const band = adultBands.find((b) => tripKm <= b.max) ?? adultBands[2];
  let fare = band.fares[level] ?? band.fares[1];
  if (fareType.includes('concession') || fareType.includes('free')) {
    fare = Math.round(fare * 0.5 * 10) / 10;
  }
  return fare;
}

export function generateDCEBTasks(a: SurveyAnswers, cv: ComputedVars): DCEBChoice[] {
  const tripKm = a.q26b_tripKm ?? 10;
  const base = cv.busIvtBase ?? 30;
  const freqs = ['A bus every 10 min', 'A bus every 15 min', 'A bus every 30 min'];
  const rels = ['70%', '85%', '95%'];
  const walks = [5, 10, 15];
  const stops = ['Basic stop', 'Covered shelter', 'Covered shelter + lighting + seating'];
  const multipliers = cv.showCarCostInDCEB ? [1.3, 1.6, 2.0] : [0.85, 1.0, 1.15];
  const fuelRates = [0.12, 0.15, 0.18];
  const parking = [0, 3, 5];

  return [0, 1, 2, 0, 1, 2].map((s, i) => {
    const mult = multipliers[s % 3];
    let ivt = Math.round(base * mult);
    ivt = Math.max(10, Math.min(90, ivt));
    const carCost = cv.showCarCostInDCEB
      ? Math.round((2 * tripKm * fuelRates[s % 3] + parking[i % 3]) * 10) / 10
      : undefined;
    return {
      taskId: i + 1,
      frequency: freqs[(s + i) % 3],
      reliability: `${rels[(i + s) % 3]} of buses on time`,
      busIvtMin: ivt,
      walkMin: walks[(i + s) % 3],
      stopQuality: stops[i % 3],
      busFareReturn: getBusFareReturn(tripKm, a.q26f_fareType, s % 3),
      carCostReturn: carCost,
      realtimeInfo: i % 2 === 0,
      busType: i % 2 === 0 ? 'Electric bus' : 'Diesel bus',
    };
  });
}

export function statusQuoLabelDCEA(zeroCar: boolean): string {
  return zeroCar
    ? 'Continue without owning or leasing a car'
    : 'Keep current vehicle';
}
