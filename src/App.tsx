import { useCallback, useMemo, useState } from 'react';
import {
  RadioGroup,
  CheckboxGroup,
  NumericField,
  LikertGrid,
  GridFrequency,
} from './components/QuestionHelpers';
import {
  SUBURBS,
  suburbsForLga,
  lakeMacquarieSuburbs,
  resolveSuburbLga,
  suburbInLga,
} from './data/suburbs';
import {
  ATTITUDE_TEXT,
  Q84_ITEMS,
  Q85_ITEMS,
  Q84_SCALE,
  Q85_SCALE,
} from './data/constants';
import {
  createInitialAnswers,
  type SurveyAnswers,
  type Likert5,
} from './types';
import {
  computeVars,
  generateDCEATasks,
  generateDCEBTasks,
  statusQuoLabelDCEA,
} from './utils/compute';
import { exportSurveyJSON, exportSurveyCSV, downloadFile } from './utils/export';

type StepId =
  | 'welcome'
  | 'screening'
  | 'travel'
  | 'home'
  | 'ev-intent'
  | 'attitudes'
  | 'dce-a-intro'
  | 'dce-a-example'
  | 'dce-a-tasks'
  | 'dce-a-followup'
  | 'dce-b-intro'
  | 'dce-b-example'
  | 'dce-b-tasks'
  | 'dce-b-followup'
  | 'moderators'
  | 'energy'
  | 'chargers'
  | 'demographics'
  | 'close'
  | 'terminated'
  | 'complete';

const STEP_LABELS: Partial<Record<StepId, string>> = {
  welcome: 'Welcome',
  screening: 'Screening',
  travel: 'Travel & vehicles',
  home: 'Home & charging',
  'ev-intent': 'EV intentions',
  attitudes: 'Attitudes',
  'dce-a-intro': 'Vehicle choice',
  'dce-a-example': 'Vehicle example',
  'dce-a-tasks': 'Vehicle choices',
  'dce-a-followup': 'Vehicle follow-up',
  'dce-b-intro': 'Trip choice',
  'dce-b-example': 'Trip example',
  'dce-b-tasks': 'Trip choices',
  'dce-b-followup': 'Trip follow-up',
  moderators: 'More views',
  energy: 'Energy prices',
  chargers: 'Charging priorities',
  demographics: 'About you',
  close: 'Finish',
};

function buildFlow(a: SurveyAnswers): StepId[] {
  const cv = computeVars(a);
  const dceBlockA: StepId[] = [
    'dce-a-intro',
    'dce-a-example',
    'dce-a-tasks',
    'dce-a-followup',
  ];
  const dceBlockB: StepId[] = [
    'dce-b-intro',
    'dce-b-example',
    'dce-b-tasks',
    'dce-b-followup',
  ];
  const dceOrder =
    a.orderDce === 'A-first'
      ? [...dceBlockA, ...dceBlockB]
      : [...dceBlockB, ...dceBlockA];

  const attitudesBlock: StepId[] = ['attitudes'];
  const postDce: StepId[] = ['moderators', 'energy', 'chargers', 'demographics', 'close'];

  const core: StepId[] = ['welcome', 'screening'];
  if (a.s1_lga === 'Neither') return [...core, 'terminated'];
  if (a.s3_age === 'Under 18') return [...core, 'terminated'];

  const afterScreen: StepId[] = ['travel', 'home', 'ev-intent'];

  if (a.orderAtt === 'pre') {
    return [...core, ...afterScreen, ...attitudesBlock, ...dceOrder, ...postDce];
  }
  return [...core, ...afterScreen, ...dceOrder, ...postDce.slice(0, 1), ...attitudesBlock, ...postDce.slice(1)];
}

export default function App() {
  const [answers, setAnswers] = useState<SurveyAnswers>(() => createInitialAnswers());
  const [declined, setDeclined] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [dceTaskIdx, setDceTaskIdx] = useState(0);
  const [error, setError] = useState('');

  const cv = useMemo(() => computeVars(answers), [answers]);
  const flow = useMemo(() => buildFlow(answers), [answers]);
  const currentStep = flow[stepIndex] ?? 'complete';
  const progress = flow.length > 1 ? ((stepIndex + 1) / flow.length) * 100 : 100;

  const dceATasks = useMemo(() => generateDCEATasks(answers, cv), [answers, cv]);
  const dceBTasks = useMemo(() => generateDCEBTasks(answers, cv), [answers, cv]);

  const suburbEntry = SUBURBS.find((s) => s.name === answers.s2_suburb);
  const zone1 = suburbEntry?.zone === 1;
  const filteredSuburbs =
    answers.s1_lga === 'Neither' ? SUBURBS : suburbsForLga(answers.s1_lga);

  const patch = useCallback((p: Partial<SurveyAnswers>) => {
    setAnswers((prev) => ({ ...prev, ...p }));
  }, []);

  const goNext = () => {
    setError('');
    setStepIndex((i) => Math.min(i + 1, flow.length - 1));
    setDceTaskIdx(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    setError('');
    setStepIndex((i) => Math.max(i - 1, 0));
    setDceTaskIdx(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validate = (): boolean => {
    switch (currentStep) {
      case 'welcome':
        if (declined) return true;
        if (!answers.consent) {
          setError('Please select "I agree" to continue.');
          return false;
        }
        return true;
      case 'screening':
        if (answers.s1_lga === 'Neither') {
          setStepIndex(flow.length);
          return true;
        }
        if (!answers.s1_lga) {
          setError('Please answer where you live.');
          return false;
        }
        if (!answers.s2_suburb) {
          setError('Please select your suburb.');
          return false;
        }
        if (answers.s1_lga !== 'Neither' && answers.s2_lga && answers.s1_lga !== answers.s2_lga) {
          setError('Please select a suburb in your chosen LGA.');
          return false;
        }
        if (!answers.s3_age || answers.s3_age === 'Under 18') {
          setError('You must be 18 or older to participate.');
          return false;
        }
        if (!answers.s4_gender || !answers.s5_driver) {
          setError('Please answer all screening questions.');
          return false;
        }
        return true;
      case 'travel':
        if (answers.q21_vehicles == null) {
          setError('Please answer all required questions.');
          return false;
        }
        if (!cv.skipVehicleQuestions) {
          if (!answers.q22_fuel || !answers.q23_age) {
            setError('Please answer vehicle questions.');
            return false;
          }
          if (answers.q24_weeklyKm == null || answers.q25_fuelSpend == null) {
            setError('Please enter weekly km and fuel/charging spend.');
            return false;
          }
        }
        if (
          answers.q26_doorTime == null ||
          answers.q26a_ivt == null ||
          answers.q26b_tripKm == null ||
          answers.q26c_tripCost == null ||
          !answers.q26d_mode ||
          !answers.q26e_freq ||
          !answers.q26f_fareType
        ) {
          setError('Please complete all trip questions.');
          return false;
        }
        if (answers.q26a_ivt! > answers.q26_doorTime!) {
          setError('In-vehicle time cannot exceed door-to-door time.');
          return false;
        }
        if (cv.driver === 0 && answers.q26d_mode === 'Drive myself') {
          setError('Non-drivers cannot select "Drive myself".');
          return false;
        }
        return true;
      case 'home':
        if (!answers.q31_dwelling || !answers.q32_tenure || !answers.q33_parking || !answers.q34_charger) {
          setError('Please answer all home and parking questions.');
          return false;
        }
        return true;
      case 'ev-intent':
        if (!answers.q41_evExp || !answers.q42_replace || !answers.q43_vehClass || !answers.q43b_newUsed || !answers.q44_awareness) {
          setError('Please answer all EV intention questions.');
          return false;
        }
        if (cv.zeroCar && !answers.q45_unsure && answers.q45_expectedKm == null) {
          setError('Please enter expected weekly km or select Unsure.');
          return false;
        }
        return true;
      case 'attitudes': {
        const missing = answers.attitudeItemOrder.some((id) => answers.attitudes[id] == null);
        if (missing) {
          setError('Please answer all attitude statements.');
          return false;
        }
        return true;
      }
      case 'dce-a-example':
        if (!answers.dceAExample) {
          setError('Please make a choice in the example.');
          return false;
        }
        return true;
      case 'dce-a-tasks': {
        const task = dceATasks[dceTaskIdx];
        if (!answers.dceAChoices[task.taskId]) {
          setError('Please select an option.');
          return false;
        }
        if (dceTaskIdx < dceATasks.length - 1) {
          setDceTaskIdx((i) => i + 1);
          return false;
        }
        return true;
      }
      case 'dce-a-followup':
        if (answers.certA == null || !answers.consA) {
          setError('Please answer both follow-up questions.');
          return false;
        }
        return true;
      case 'dce-b-example':
        if (!answers.dceBExample) {
          setError('Please make a choice in the example.');
          return false;
        }
        return true;
      case 'dce-b-tasks': {
        const task = dceBTasks[dceTaskIdx];
        if (!answers.dceBChoices[task.taskId]) {
          setError('Please select an option.');
          return false;
        }
        if (dceTaskIdx < dceBTasks.length - 1) {
          setDceTaskIdx((i) => i + 1);
          return false;
        }
        return true;
      }
      case 'dce-b-followup':
        if (answers.certB == null) {
          setError('Please rate your certainty.');
          return false;
        }
        return true;
      case 'moderators': {
        const missing = answers.moderatorItemOrder.some((id) => answers.moderators[id] == null);
        if (missing) {
          setError('Please answer all statements.');
          return false;
        }
        return true;
      }
      case 'energy':
        if (!answers.q82_elecInterest || answers.q83_bipolar == null) {
          setError('Please answer all energy questions.');
          return false;
        }
        if (Q84_ITEMS.some((item) => !answers.q84_worry[item])) {
          setError('Please complete the worry grid.');
          return false;
        }
        if (Q85_ITEMS.some((item) => !answers.q85_interest[item])) {
          setError('Please complete the interest grid.');
          return false;
        }
        return true;
      case 'chargers':
        if (answers.q8b1_locations.length === 0) {
          setError('Please select at least one charger location (up to 3).');
          return false;
        }
        if (!answers.q8b2_suburb) {
          setError('Please name a suburb or centre.');
          return false;
        }
        return true;
      case 'demographics':
        if (
          answers.q91_adults == null ||
          !answers.q92_work ||
          !answers.q93_education ||
          !answers.q94_income ||
          !answers.q95_solar ||
          !answers.q96_battery
        ) {
          setError('Please answer all demographic questions.');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep === 'welcome' && declined) {
      setStepIndex(flow.length);
      return;
    }
    if (!validate()) return;
    if (currentStep === 'close') {
      const final = { ...answers, completedAt: new Date().toISOString() };
      setAnswers(final);
      setStepIndex(flow.length);
      return;
    }
    goNext();
  };

  const modeOptions = useMemo(() => {
    const base = [
      'Drive myself',
      'Passenger in someone else\'s car',
      'Bus',
      ...(suburbEntry?.onDemand && suburbEntry && suburbInLga(suburbEntry, 'Lake Macquarie') ? ['Lake Macquarie On Demand'] : []),
      'Walk or cycle',
      'Taxi / rideshare',
      'Other',
    ];
    if (cv.driver === 0) return base.filter((m) => m !== 'Drive myself');
    return base;
  }, [suburbEntry, cv.driver]);

  const renderStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <>
            <span className="part-label">Part 0 — Welcome</span>
            <h2>Welcome</h2>
            <p className="intro">
              Thank you for taking part in this study run by the University of Newcastle.
              We are asking Lake Macquarie and Newcastle residents about everyday travel, cars, and buses,
              and about how recent changes in petrol and energy prices affect your choices.
            </p>
            <p className="intro">The survey takes about 18–20 minutes. There are no right or wrong answers — we want your honest views.</p>
            <div className="consequentiality">
              Your answers will be used by Lake Macquarie City Council. The results of this survey will be provided to the Council to help inform real decisions about where to prioritise electric-vehicle chargers across Lake Macquarie and how to improve local bus services. Because your answers can genuinely influence these decisions, please answer every question as carefully as if your choices were real.
            </div>
            <p className="intro">
              Your participation is voluntary and you can stop at any time. Your answers are anonymous.
              This study has been approved by the University of Newcastle Human Research Ethics Committee.
            </p>
            <RadioGroup
              label="Consent"
              options={['I have read the above and I agree to take part.', 'I do not wish to take part.']}
              value={answers.consent ? 'I have read the above and I agree to take part.' : declined ? 'I do not wish to take part.' : ''}
              onChange={(v) => {
                if (v.startsWith('I have')) {
                  setDeclined(false);
                  patch({ consent: true });
                } else {
                  setDeclined(true);
                  patch({ consent: false });
                }
              }}
              name="consent"
            />
          </>
        );

      case 'screening':
        return (
          <>
            <span className="part-label">Part 1 — Screening</span>
            <RadioGroup
              label="S1. Do you currently live in the Lake Macquarie or Newcastle local government area (LGA)?"
              options={['Yes — Lake Macquarie', 'Yes — Newcastle', 'No, neither']}
              value={
                answers.s1_lga === 'Lake Macquarie'
                  ? 'Yes — Lake Macquarie'
                  : answers.s1_lga === 'Newcastle'
                    ? 'Yes — Newcastle'
                    : answers.s1_lga === 'Neither'
                      ? 'No, neither'
                      : ''
              }
              onChange={(v) => {
                const lga =
                  v === 'Yes — Lake Macquarie'
                    ? 'Lake Macquarie'
                    : v === 'Yes — City of Newcastle' || v === 'Yes — Newcastle'
                      ? 'Newcastle'
                      : 'Neither';
                patch({
                  s1_lga: lga,
                  s2_suburb: '',
                  s2_lga: null,
                  s2_zone: null,
                  q26d_mode: lga === 'Newcastle' && answers.q26d_mode === 'Lake Macquarie On Demand' ? '' : answers.q26d_mode,
                });
              }}
              name="s1"
            />
            <div className="field">
              <label className="field-label" htmlFor="suburb">S2. What is your residential suburb?</label>
              <select
                id="suburb"
                value={answers.s2_suburb}
                disabled={!answers.s1_lga}
                onChange={(e) => {
                  const name = e.target.value;
                  const entry = SUBURBS.find((s) => s.name === name);
                  patch({
                    s2_suburb: name,
                    s2_lga: entry ? resolveSuburbLga(entry, answers.s1_lga) : null,
                    s2_zone: entry?.zone ?? null,
                  });
                }}
              >
                <option value="">— Select suburb —</option>
                {filteredSuburbs.map((s) => (
                  <option key={s.name} value={s.name}>{s.name}</option>
                ))}
              </select>
            </div>
            <RadioGroup
              label="S3. Which age group are you in?"
              options={['18–24', '25–34', '35–44', '45–54', '55–64', '65–74', '75+']}
              value={answers.s3_age}
              onChange={(v) => patch({ s3_age: v })}
              name="s3"
            />
            <RadioGroup
              label="S4. Are you …?"
              options={['Female', 'Male', 'Non-binary / other', 'Prefer not to say']}
              value={answers.s4_gender}
              onChange={(v) => patch({ s4_gender: v })}
              name="s4"
            />
            <RadioGroup
              label="S5. Do you currently drive?"
              options={[
                'Yes — I hold a licence and drive regularly',
                'Occasionally',
                'No — I don\'t drive',
              ]}
              value={answers.s5_driver}
              onChange={(v) => patch({ s5_driver: v })}
              name="s5"
            />
          </>
        );

      case 'travel':
        return (
          <>
            <span className="part-label">Part 2 — Travel &amp; vehicles</span>
            <p className="intro">These answers personalise your later choice questions, so accuracy matters.</p>
            <RadioGroup
              label="Q2.1 How many cars / vehicles does your household own or lease?"
              options={['0', '1', '2', '3 or more']}
              value={
                answers.q21_vehicles == null
                  ? ''
                  : answers.q21_vehicles >= 3
                    ? '3 or more'
                    : String(answers.q21_vehicles)
              }
              onChange={(v) => patch({ q21_vehicles: v === '3 or more' ? 3 : Number(v) })}
              name="q21"
            />
            {!cv.skipVehicleQuestions && (
              <>
                <RadioGroup
                  label={`Q2.2 ${cv.driver ? 'Thinking of the vehicle you personally drive most often' : 'Thinking of your household\'s main vehicle — the one used most often that you know best'} — what fuel does it use?`}
                  options={['Petrol', 'Diesel', 'Hybrid (petrol + electric)', 'Plug-in hybrid', 'Fully electric', 'Other']}
                  value={answers.q22_fuel}
                  onChange={(v) => patch({ q22_fuel: v })}
                  name="q22"
                />
                <RadioGroup
                  label="Q2.3 About how old is that vehicle?"
                  options={['<2 yrs', '2–5 yrs', '6–10 yrs', '>10 yrs']}
                  value={answers.q23_age}
                  onChange={(v) => patch({ q23_age: v })}
                  name="q23"
                />
                <NumericField
                  label="Q2.4 About how many kilometres is that vehicle driven in a typical week?"
                  hint="If unsure, give your best estimate (0–1500 km)"
                  value={answers.q24_weeklyKm}
                  onChange={(v) => patch({ q24_weeklyKm: v })}
                  suffix="km per week"
                  min={0}
                  max={1500}
                />
                {answers.q22_fuel === 'Plug-in hybrid' ? (
                  <>
                    <NumericField label="Q2.5 Petrol spend per week" value={answers.q25_phevPetrol} onChange={(v) => patch({ q25_phevPetrol: v })} suffix="$ per week" min={0} />
                    <NumericField label="Q2.5 Home-charging/electricity spend per week" value={answers.q25_phevElec} onChange={(v) => patch({ q25_phevElec: v })} suffix="$ per week" min={0} />
                  </>
                ) : (
                  <NumericField
                    label={`Q2.5 About how much do you spend on ${answers.q22_fuel === 'Fully electric' ? 'charging (home + public)' : 'petrol/diesel'} in a typical week?`}
                    value={answers.q25_fuelSpend}
                    onChange={(v) => patch({ q25_fuelSpend: v })}
                    suffix="$ per week"
                    min={0}
                  />
                )}
              </>
            )}
            <NumericField label="Q2.6 Door-to-door time to nearest major centre" value={answers.q26_doorTime} onChange={(v) => patch({ q26_doorTime: v })} suffix="minutes" min={1} max={180} />
            <NumericField label="Q2.6a In-vehicle or on-bus minutes (0 if walk/cycle whole way)" value={answers.q26a_ivt} onChange={(v) => patch({ q26a_ivt: v })} suffix="minutes" min={0} max={180} />
            <NumericField label="Q2.6b Trip distance, one way" value={answers.q26b_tripKm} onChange={(v) => patch({ q26b_tripKm: v })} suffix="km" min={0.5} max={100} />
            <NumericField label="Q2.6c Return trip out-of-pocket cost" hint="Enter $0 if no direct cost" value={answers.q26c_tripCost} onChange={(v) => patch({ q26c_tripCost: v })} suffix="$ for the return trip" min={0} />
            <RadioGroup label="Q2.6d How do you usually make this trip?" options={modeOptions} value={answers.q26d_mode} onChange={(v) => patch({ q26d_mode: v })} name="q26d" />
            <RadioGroup
              label="Q2.6e How often do you usually make this trip?"
              options={['4+ times per week', '1–3 times per week', '1–3 times per month', 'Less than monthly', 'Rarely / only when needed']}
              value={answers.q26e_freq}
              onChange={(v) => patch({ q26e_freq: v })}
              name="q26e"
            />
            <RadioGroup
              label="Q2.6f When you travel by bus or other public transport, do you usually pay:"
              options={['An adult fare', 'A concession or senior/pensioner fare', 'I travel free or near-free (e.g., Gold Opal)', 'I don\'t use public transport']}
              value={answers.q26f_fareType}
              onChange={(v) => patch({ q26f_fareType: v })}
              name="q26f"
            />
            <GridFrequency
              label="Q2.7 In a typical month, how often do you use each of the following?"
              rows={[
                'Car as driver',
                'Car as passenger',
                'Bus (fixed route)',
                ...(zone1 ? ['Lake Macquarie On Demand'] : []),
                'Walk / cycle for transport',
              ]}
              columns={['Never', 'Rarely', 'Weekly', 'Most days']}
              values={{
                'Car as driver': answers.q27_carDriver,
                'Car as passenger': answers.q27_carPassenger,
                'Bus (fixed route)': answers.q27_bus,
                ...(zone1 ? { 'Lake Macquarie On Demand': answers.q27_onDemand } : {}),
                'Walk / cycle for transport': answers.q27_walk,
              }}
              onChange={(row, col) => {
                const map: Record<string, Partial<SurveyAnswers>> = {
                  'Car as driver': { q27_carDriver: col },
                  'Car as passenger': { q27_carPassenger: col },
                  'Bus (fixed route)': { q27_bus: col },
                  'Lake Macquarie On Demand': { q27_onDemand: col },
                  'Walk / cycle for transport': { q27_walk: col },
                };
                patch(map[row] ?? {});
              }}
            />
            <CheckboxGroup
              label="Q2.8 What stops you using the bus more often? (select all that apply)"
              options={['Too infrequent', 'Unreliable / late', 'Takes too long', 'Stops too far away', 'Doesn\'t go where I need', 'Fares', 'I prefer driving', 'Nothing — I already use it', 'Other']}
              values={answers.q28_barriers}
              onChange={(v) => patch({ q28_barriers: v })}
            />
          </>
        );

      case 'home':
        return (
          <>
            <span className="part-label">Part 3 — Home &amp; charging</span>
            <RadioGroup label="Q3.1 Which best describes your home?" options={['Detached house', 'Townhouse / villa', 'Apartment / unit', 'Other']} value={answers.q31_dwelling} onChange={(v) => patch({ q31_dwelling: v })} name="q31" />
            <RadioGroup label="Q3.2 Do you own or rent your home?" options={['Own (with or without mortgage)', 'Rent', 'Other']} value={answers.q32_tenure} onChange={(v) => patch({ q32_tenure: v })} name="q32" />
            <RadioGroup
              label={cv.zeroCar ? 'Q3.3 If your household acquired a car, where would it most likely be parked overnight?' : 'Q3.3 Where do you usually park your main vehicle overnight?'}
              options={['Garage or carport at home', 'Driveway / off-street at home', 'On the street near home', 'Shared/communal parking', 'No regular spot']}
              value={answers.q33_parking}
              onChange={(v) => patch({ q33_parking: v })}
              name="q33"
            />
            <RadioGroup
              label="Q3.4 Could an electric-car charger realistically be used or installed at that overnight parking location?"
              options={['Yes — a power point is already there', 'Yes — one could be installed and I\'m allowed to', 'Maybe, but I\'d need landlord/strata permission', 'No / not allowed / not feasible', 'Unsure']}
              value={answers.q34_charger}
              onChange={(v) => patch({ q34_charger: v })}
              name="q34"
            />
          </>
        );

      case 'ev-intent':
        return (
          <>
            <span className="part-label">Part 4 — EV intentions</span>
            <RadioGroup label="Q4.1 Have you ever driven or ridden in a fully electric vehicle?" options={['Yes, driven', 'Yes, ridden as passenger', 'No']} value={answers.q41_evExp} onChange={(v) => patch({ q41_evExp: v })} name="q41" />
            <RadioGroup label="Q4.2 How likely is your household to acquire, buy, lease or replace a vehicle in the next 3 years?" options={['Already planning to', 'Quite likely', 'Possibly', 'Unlikely', 'Definitely not']} value={answers.q42_replace} onChange={(v) => patch({ q42_replace: v })} name="q42" />
            <RadioGroup label="Q4.3 If your household acquired or replaced a vehicle, what type would you most likely be looking for?" options={['Small car / hatch', 'Sedan', 'Small–medium SUV', 'Large SUV / 4WD', 'Ute', 'People mover / van']} value={answers.q43_vehClass} onChange={(v) => patch({ q43_vehClass: v })} name="q43" />
            <RadioGroup label="Q4.3b Would you most likely consider:" options={['New vehicle only', 'Used vehicle only', 'Either new or used', 'Unsure']} value={answers.q43b_newUsed} onChange={(v) => patch({ q43b_newUsed: v })} name="q43b" />
            <RadioGroup label="Q4.4 Before today, how aware were you of government support for EVs?" options={['Very aware', 'Somewhat', 'Heard of it', 'Not at all']} value={answers.q44_awareness} onChange={(v) => patch({ q44_awareness: v })} name="q44" />
            {cv.zeroCar && (
              <>
                <NumericField label="Q4.5 If your household acquired a car, expected weekly km" value={answers.q45_expectedKm} onChange={(v) => patch({ q45_expectedKm: v, q45_unsure: false })} suffix="km per week" min={0} max={1500} />
                <label className="option" style={{ maxWidth: 280 }}>
                  <input type="checkbox" checked={answers.q45_unsure} onChange={(e) => patch({ q45_unsure: e.target.checked, q45_expectedKm: e.target.checked ? null : answers.q45_expectedKm })} />
                  <span>Unsure</span>
                </label>
              </>
            )}
          </>
        );

      case 'attitudes':
        return (
          <>
            <span className="part-label">Part 5 — Attitudes</span>
            <LikertGrid
              items={answers.attitudeItemOrder.map((id) => ({ id, text: ATTITUDE_TEXT[id] }))}
              values={answers.attitudes}
              onChange={(id, v) => patch({ attitudes: { ...answers.attitudes, [id]: v } })}
            />
          </>
        );

      case 'dce-a-intro':
        return (
          <>
            <span className="part-label">Part 6 — Choice Experiment A</span>
            <h2>Your next vehicle</h2>
            <p className="intro">
              We&apos;d now like you to imagine your household is choosing its next vehicle within the next 3 years.
              In studies like this, people often say they would pay more for new or &quot;green&quot; technology than they really would.
              Please choose as if you were really spending your household&apos;s money.
            </p>
            <p className="intro">
              You&apos;ll see 8 choices. Each time, pick the option you would most likely choose.
              The petrol and electric cars are the same size/class as: <strong>{answers.q43_vehClass || 'your stated preference'}</strong>.
            </p>
            <p className="policy-note">Government support levels shown are possible policy scenarios, not necessarily current programs.</p>
          </>
        );

      case 'dce-a-example': {
        const sq = statusQuoLabelDCEA(cv.zeroCar);
        return (
          <>
            <span className="part-label">Example — DCE-A</span>
            <p className="intro">This is an example — your real choices follow.</p>
            <DCEATable
              sqLabel={sq}
              petrol={{ price: 42000, range: 'Ample', refuel: '~5 min', access: 'Service stations everywhere', cost100: 15, support: 'None' }}
              ev={{ price: 50000, range: '450 km', refuel: '30 min (fast charge ~300 km)', access: 'Charge at home overnight', cost100: 6, support: 'One-off $3,000 purchase rebate' }}
              selected={answers.dceAExample}
              onSelect={(v) => patch({ dceAExample: v })}
            />
            {cv.weeklyKmForHelper && (
              <p className="helper-line">
                At {cv.weeklyKmForHelper} km/week, that&apos;s about ${Math.round(cv.weeklyKmForHelper * 15 / 100)} vs ${Math.round(cv.weeklyKmForHelper * 6 / 100)} per week to run.
              </p>
            )}
          </>
        );
      }

      case 'dce-a-tasks': {
        const task = dceATasks[dceTaskIdx];
        const sq = statusQuoLabelDCEA(cv.zeroCar);
        return (
          <>
            <span className="part-label">Choice {task.taskId} of {dceATasks.length}</span>
            <DCEATable
              sqLabel={sq}
              petrol={{ price: task.petrolPrice, range: 'Ample', refuel: '~5 min', access: 'Service stations everywhere', cost100: task.petrolCost100, support: 'None' }}
              ev={{ price: task.evPrice, range: `${task.evRange} km`, refuel: `${task.fastChargeMin} min (fast charge ~300 km)`, access: task.chargingAccess, cost100: task.evCost100, support: task.govSupport }}
              selected={answers.dceAChoices[task.taskId] ?? null}
              onSelect={(v) => patch({ dceAChoices: { ...answers.dceAChoices, [task.taskId]: v as 'petrol' | 'ev' | 'statusquo' } })}
            />
          </>
        );
      }

      case 'dce-a-followup':
        return (
          <>
            <span className="part-label">Follow-up — DCE-A</span>
            <NumericField label="CERT-A. How sure are you that you would actually make the choices you just made? (0 = not at all sure … 10 = completely sure)" value={answers.certA} onChange={(v) => patch({ certA: v })} min={0} max={10} />
            <RadioGroup label="CONS-A. When answering, how much did you believe your answers could influence real decisions by the Council?" options={['Not at all', 'A little', 'Somewhat', 'A lot']} value={answers.consA} onChange={(v) => patch({ consA: v })} name="consA" />
          </>
        );

      case 'dce-b-intro':
        return (
          <>
            <span className="part-label">Part 7 — Choice Experiment B</span>
            <h2>Your trip — current way vs the bus</h2>
            <p className="intro">
              Now think about a typical trip to your nearest centre. Each time, choose between travelling the way you do now and the bus service described.
              You&apos;ll see 6 choices. Travel times are one way; costs are for the whole return trip.
            </p>
            <p className="policy-note">Buses are described as either diesel or electric. Electric buses have no tailpipe exhaust at street level and are usually quieter.</p>
          </>
        );

      case 'dce-b-example':
        return (
          <>
            <span className="part-label">Example — DCE-B</span>
            <p className="intro">This is an example — your real choices follow.</p>
            <DCEBTable
              statusQuoLabel={cv.showCarCostInDCEB ? 'Drive (as you do now)' : cv.dceBStatusQuoLabel}
              doorTime={answers.q26_doorTime ?? 20}
              showCarCost={cv.showCarCostInDCEB}
              fixedCost={answers.q26c_tripCost ?? 9}
              bus={{ frequency: 'A bus every 15 min', reliability: '85% of buses on time', ivt: 35, walk: 8, fare: 7, stop: 'Covered shelter', realtime: true, type: 'Electric bus', carCost: 9 }}
              selected={answers.dceBExample}
              onSelect={(v) => patch({ dceBExample: v })}
            />
          </>
        );

      case 'dce-b-tasks': {
        const task = dceBTasks[dceTaskIdx];
        return (
          <>
            <span className="part-label">Choice {task.taskId} of {dceBTasks.length}</span>
            <DCEBTable
              statusQuoLabel={cv.dceBStatusQuoLabel}
              doorTime={answers.q26_doorTime ?? 20}
              showCarCost={cv.showCarCostInDCEB}
              fixedCost={answers.q26c_tripCost ?? 0}
              bus={task}
              selected={answers.dceBChoices[task.taskId] ?? null}
              onSelect={(v) => patch({ dceBChoices: { ...answers.dceBChoices, [task.taskId]: v as 'statusquo' | 'bus' } })}
            />
          </>
        );
      }

      case 'dce-b-followup':
        return (
          <>
            <span className="part-label">Follow-up — DCE-B</span>
            <NumericField label="CERT-B. How sure are you that you would actually choose this way in real life? (0–10)" value={answers.certB} onChange={(v) => patch({ certB: v })} min={0} max={10} />
          </>
        );

      case 'moderators':
        return (
          <>
            <span className="part-label">Part 7B — More views</span>
            <LikertGrid
              items={answers.moderatorItemOrder.map((id) => ({ id, text: ATTITUDE_TEXT[id] }))}
              values={answers.moderators}
              onChange={(id, v) => patch({ moderators: { ...answers.moderators, [id]: v } })}
            />
          </>
        );

      case 'energy':
        return (
          <>
            <span className="part-label">Part 8 — Energy prices</span>
            <CheckboxGroup
              label="Q8.1 Thinking about recent petrol-price changes, have you done any of the following?"
              options={['Drive less / combine trips', 'Considered a more fuel-efficient vehicle', 'Considered an electric car', 'Shifted some trips to bus / walk / cycle', 'No change', 'Other']}
              values={answers.q81_actions}
              onChange={(v) => patch({ q81_actions: v })}
            />
            <RadioGroup
              label="Q8.2 Have recent electricity prices changed your interest in owning or leasing an electric car?"
              options={['Much more interested', 'Somewhat more', 'No difference', 'Somewhat less', 'Much less', 'Unsure']}
              value={answers.q82_elecInterest}
              onChange={(v) => patch({ q82_elecInterest: v })}
              name="q82"
            />
            <div className="field">
              <span className="field-label">Q8.3 When you think about electric cars, which matters more to you?</span>
              <div className="likert-scale">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" className={`likert-btn ${answers.q83_bipolar === n ? 'selected' : ''}`} onClick={() => patch({ q83_bipolar: n })}>
                    {n === 1 ? 'Environment' : n === 3 ? 'Both equally' : n === 5 ? 'Saving money' : n}
                  </button>
                ))}
              </div>
            </div>
            <GridFrequency label="Q8.4 How worried are you about each of the following?" rows={Q84_ITEMS} columns={Q84_SCALE} values={answers.q84_worry} onChange={(row, col) => patch({ q84_worry: { ...answers.q84_worry, [row]: col } })} />
            <GridFrequency label="Q8.5 Would any of the following make you more interested in an electric car?" rows={Q85_ITEMS} columns={Q85_SCALE} values={answers.q85_interest} onChange={(row, col) => patch({ q85_interest: { ...answers.q85_interest, [row]: col } })} />
          </>
        );

      case 'chargers':
        return (
          <>
            <span className="part-label">Part 8B — Charging priorities</span>
            <CheckboxGroup
              label="Q8B.1 Where would public EV chargers be most useful? (up to 3)"
              options={['Near my home street', 'Town centres', 'Shopping centres', 'Beaches / lakefront', 'Sports & recreation facilities', 'Libraries / community facilities', 'Train stations or park-and-ride', 'Workplaces', 'Tourist areas', 'Other']}
              values={answers.q8b1_locations}
              onChange={(v) => patch({ q8b1_locations: v })}
              max={3}
            />
            <div className="field">
              <label className="field-label" htmlFor="q8b2">Q8B.2 One suburb or centre where more public chargers would help</label>
              <select id="q8b2" value={answers.q8b2_suburb} onChange={(e) => patch({ q8b2_suburb: e.target.value })}>
                <option value="">— Select suburb —</option>
                {lakeMacquarieSuburbs().map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </>
        );

      case 'demographics':
        return (
          <>
            <span className="part-label">Part 9 — About you</span>
            <NumericField label="Q9.1 Household adults" value={answers.q91_adults} onChange={(v) => patch({ q91_adults: v })} min={1} max={10} />
            <NumericField label="Q9.1 Children (under 18)" value={answers.q91_children} onChange={(v) => patch({ q91_children: v })} min={0} max={10} />
            <RadioGroup label="Q9.2 Work situation" options={['Full-time', 'Part-time/casual', 'Self-employed', 'Retired', 'Studying', 'Home duties', 'Not currently working']} value={answers.q92_work} onChange={(v) => patch({ q92_work: v })} name="q92" />
            <RadioGroup label="Q9.3 Highest education" options={['School', 'Trade/TAFE/diploma', 'Bachelor', 'Postgraduate']} value={answers.q93_education} onChange={(v) => patch({ q93_education: v })} name="q93" />
            <RadioGroup label="Q9.4 Approximate gross household income (before tax)" options={['<$650/wk (<$33,800/yr)', '$650–$1,000/wk', '$1,000–$1,750/wk', '$1,750–$3,000/wk', '$3,000–$4,500/wk', '>$4,500/wk', 'Prefer not to say']} value={answers.q94_income} onChange={(v) => patch({ q94_income: v })} name="q94" />
            <RadioGroup label="Q9.5 Rooftop solar at home?" options={['Yes', 'No', 'Unsure']} value={answers.q95_solar} onChange={(v) => patch({ q95_solar: v })} name="q95" />
            <RadioGroup label="Q9.6 Home battery?" options={['Yes', 'No', 'Unsure']} value={answers.q96_battery} onChange={(v) => patch({ q96_battery: v })} name="q96" />
          </>
        );

      case 'close':
        return (
          <>
            <span className="part-label">Part 10 — Close</span>
            <h2>Thank you</h2>
            <p className="intro">Your answers will help shape Lake Macquarie&apos;s transport and charging decisions.</p>
            <div className="field">
              <label className="field-label" htmlFor="comments">Q10.1 Anything else you&apos;d like the Council to know? (optional)</label>
              <textarea id="comments" rows={4} value={answers.q101_comments} onChange={(e) => patch({ q101_comments: e.target.value })} />
            </div>
          </>
        );

      case 'terminated':
        return (
          <div className="terminate-card">
            <h2>Thank you for your interest</h2>
            <p>This survey is only open to Lake Macquarie or Newcastle LGA residents aged 18 and over.</p>
          </div>
        );

      case 'complete':
        if (declined) {
          return (
            <div className="terminate-card">
              <h2>Thank you</h2>
              <p>You have chosen not to participate. No data has been recorded.</p>
            </div>
          );
        }
        return (
          <div className="complete-card">
            <h2>Survey complete</h2>
            <p>Thank you for participating. Download your response data below for pilot review or SurveyEngine reference.</p>
            <p className="meta-badge">ORDER_ATT: {answers.orderAtt} · ORDER_DCE: {answers.orderDce}</p>
            <div className="export-btns">
              <button type="button" className="btn btn-primary" onClick={() => downloadFile(exportSurveyJSON(answers), `LM_EV_Survey_${Date.now()}.json`, 'application/json')}>
                Download JSON
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => downloadFile(exportSurveyCSV(answers), `LM_EV_Survey_${Date.now()}.csv`, 'text/csv')}>
                Download CSV
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isTerminal = currentStep === 'terminated' || currentStep === 'complete';
  const showNav = !isTerminal;

  return (
    <div className="survey-shell">
      <header className="survey-header">
        <div className="logo-row">
          <img src="/assets/uon-logo.png" alt="University of Newcastle" />
          <img src="/assets/lmcc-logo.jpeg" alt="Lake Macquarie City Council" />
        </div>
        <h1>Lake Macquarie EV &amp; E-Bus Survey</h1>
        <p>University of Newcastle · v4.10 web prototype</p>
      </header>

      {!isTerminal && (
        <div className="progress-bar" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      <main className="card">
        {renderStep()}
        {error && <p className="error-msg" role="alert">{error}</p>}
        {showNav && (
          <div className="nav-row">
            <button type="button" className="btn btn-secondary" onClick={goBack} disabled={stepIndex === 0}>
              Back
            </button>
            <span className="meta-badge">{STEP_LABELS[currentStep] ?? currentStep}</span>
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              {currentStep === 'close' ? 'Submit' : 'Continue'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

interface DCEATableProps {
  sqLabel: string;
  petrol: { price: number; range: string; refuel: string; access: string; cost100: number; support: string };
  ev: { price: number; range: string; refuel: string; access: string; cost100: number; support: string };
  selected: string | null;
  onSelect: (v: string) => void;
}

function DCEATable({ sqLabel, petrol, ev, selected, onSelect }: DCEATableProps) {
  const rows = [
    ['Purchase price', `$${petrol.price.toLocaleString()}`, `$${ev.price.toLocaleString()}`, '—'],
    ['Driving range (full)', petrol.range, ev.range, '—'],
    ['Refuel / recharge time', petrol.refuel, ev.refuel, '—'],
    ['Where you refuel / charge', petrol.access, ev.access, '—'],
    ['Cost to drive 100 km', `$${petrol.cost100}`, `$${ev.cost100}`, '—'],
    ['Government support', petrol.support, ev.support, '—'],
  ];
  return (
    <table className="dce-table">
      <thead>
        <tr>
          <th>Attribute</th>
          <th className="col-head">Petrol car</th>
          <th className="col-head">Electric car (EV)</th>
          <th className="col-head">{sqLabel}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([attr, p, e, s]) => (
          <tr key={attr}><td>{attr}</td><td>{p}</td><td>{e}</td><td>{s}</td></tr>
        ))}
        <tr className="dce-choice-row">
          <td><strong>Your choice</strong></td>
          {(['petrol', 'ev', 'statusquo'] as const).map((v) => (
            <td key={v}>
              <input type="radio" name="dce-a" checked={selected === v} onChange={() => onSelect(v)} aria-label={v} />
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  );
}

interface DCEBTableProps {
  statusQuoLabel: string;
  doorTime: number;
  showCarCost: boolean;
  fixedCost: number;
  bus: {
    frequency: string;
    reliability: string;
    busIvtMin?: number;
    ivt?: number;
    walkMin: number;
    stopQuality?: string;
    stop?: string;
    busFareReturn: number;
    fare?: number;
    carCostReturn?: number;
    realtimeInfo?: boolean;
    realtime?: boolean;
    busType: string;
    type?: string;
    carCost?: number;
  };
  selected: string | null;
  onSelect: (v: string) => void;
}

function DCEBTable({ statusQuoLabel, doorTime, showCarCost, fixedCost, bus, selected, onSelect }: DCEBTableProps) {
  const ivt = bus.busIvtMin ?? bus.ivt ?? 35;
  const fare = bus.busFareReturn ?? bus.fare ?? 7;
  const stop = bus.stopQuality ?? bus.stop ?? 'Covered shelter';
  const rt = bus.realtimeInfo ?? bus.realtime ?? true;
  const btype = bus.busType ?? bus.type ?? 'Electric bus';
  const carCost = showCarCost ? (bus.carCostReturn ?? bus.carCost ?? 9) : fixedCost;

  const rows: [string, string, string][] = [
    ['Service frequency', '—', bus.frequency],
    ['On-time reliability', '—', bus.reliability],
    ['Usual trip time, door to door, one way', `${doorTime} min`, '—'],
    ['Bus in-vehicle time, one way', '—', `${ivt} min`],
    ['Walk to the stop', '—', `${bus.walkMin} min`],
    ['Stop quality', '—', stop],
    ['Cost of the return trip', `$${carCost}${showCarCost ? ' (fuel + parking)' : ''}`, `$${fare.toFixed(2)} fare (return)`],
    ['Real-time arrival info', '—', rt ? 'Yes' : 'No'],
    ['Vehicle type', '—', btype],
  ];

  return (
    <table className="dce-table">
      <thead>
        <tr>
          <th>Attribute</th>
          <th className="col-head">{statusQuoLabel}</th>
          <th className="col-head">Take the bus</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(([a, sq, b]) => (
          <tr key={a}><td>{a}</td><td>{sq}</td><td>{b}</td></tr>
        ))}
        <tr className="dce-choice-row">
          <td><strong>Your choice</strong></td>
          {(['statusquo', 'bus'] as const).map((v) => (
            <td key={v}>
              <input type="radio" name="dce-b" checked={selected === v} onChange={() => onSelect(v)} />
            </td>
          ))}
          <td />
        </tr>
      </tbody>
    </table>
  );
}
