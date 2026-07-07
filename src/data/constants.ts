export const VEHICLE_CLASS_BASE: Record<string, number> = {
  'Small car / hatch': 28000,
  'Sedan': 38000,
  'Small–medium SUV': 42000,
  'Large SUV / 4WD': 58000,
  'Ute': 52000,
  'People mover / van': 50000,
};

export const ATTITUDE_TEXT: Record<string, string> = {
  ENV1: 'I am very concerned about climate change.',
  ENV2: 'Exhaust emissions from cars and buses are a serious environmental problem.',
  ENV3: 'I try to reduce my environmental impact in my everyday choices.',
  ENV4: 'Reducing greenhouse-gas emissions should be a high priority for transport in my area.',
  ENV5: 'Air pollution from road traffic harms people\'s health in my community.',
  ESA1: 'Sharp changes in petrol and household energy prices can put real pressure on my household budget.',
  ESA2: 'I feel exposed when fuel prices jump suddenly.',
  ESA5: 'Overseas conflicts can put Australia\'s fuel supply at risk.',
  ESA7: 'I worry that global events could make petrol hard to get, or very expensive, here.',
  ESA9: 'I would like my household to depend less on petrol and oil.',
  ESA10: 'It bothers me that I have no control over the fuel prices I pay.',
  ATTN1: 'To show you are reading carefully, please select "Disagree" for this statement.',
  TECH1: 'I like to be among the first to try new technologies.',
  TECH2: 'I am comfortable using new and unfamiliar technology.',
  TECH3: 'New vehicle technologies generally make driving better.',
  TECH4: 'I enjoy learning about new vehicle technology.',
  PC1: 'I always look for the cheapest option when I shop.',
  PC2: 'I keep a close eye on all my household spending.',
  PC3: 'I am willing to make an extra effort to find lower prices.',
  MK1: 'I like to plan my holidays well in advance.',
  MK2: 'I enjoy trying new recipes at home.',
  RANGE1: 'I would worry about running out of charge on a longer trip.',
  RANGE2: 'I\'m concerned an electric car wouldn\'t have enough range for my needs.',
  RANGE3: 'The driving range of electric cars is still too limited for me.',
  CHARGE1: 'Finding somewhere to charge an electric car would be inconvenient for me.',
  CHARGE2: 'I\'m worried there aren\'t enough public chargers where I travel.',
  CHARGE3: 'Charging an electric car takes too long compared with refuelling.',
  PT1: 'The bus is a realistic option for many of my trips.',
  PT2: 'I would use the bus more if it were more reliable.',
  PT3: 'Buses in my area are too infrequent to be useful.',
  PT4: 'I would feel good about using public transport instead of driving.',
  ATTN2: 'To show you are still reading carefully, please select "Agree" for this statement.',
};

export const LIKERT_LABELS = [
  'Strongly disagree',
  'Disagree',
  'Neither',
  'Agree',
  'Strongly agree',
];

export const Q84_ITEMS = [
  'Petrol prices',
  'Electricity price volatility / electricity bills',
  'Disruptions to fuel supply from overseas events',
  'Being able to charge affordably (if you had an electric car)',
  'Being able to keep your transport costs predictable',
];

export const Q85_ITEMS = [
  'Access to cheaper off-peak charging',
  'Having rooftop solar at home',
  'A public/kerbside charger near where you live',
];

export const Q84_SCALE = ['Not at all', 'A little', 'Somewhat', 'Very', 'Extremely'];
export const Q85_SCALE = ['Yes, much more', 'Somewhat', 'No difference', 'Unsure'];
