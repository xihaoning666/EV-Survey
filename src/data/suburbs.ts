import type { SuburbEntry, LGA, Zone } from './types';

const LM: LGA = 'Lake Macquarie';
const NC: LGA = 'Newcastle';

const ZONE1 = new Set([
  'Charlestown', 'Warners Bay', 'Mount Hutton', 'Belmont', 'Gateshead', 'Dudley',
  'Whitebridge', 'Redhead', 'Windale', 'Tingira Heights', 'Eleebana', 'Croudace Bay',
  'Valentine', 'Belmont North', 'Belmont South',
]);
const ZONE3 = new Set([
  'Morisset', 'Cooranbong', 'Wyee', 'Morisset Park', 'Balcolyn', 'Dora Creek',
  'Eraring', 'Martinsville', 'Mandalong', 'Myuna Bay', 'Wyee Point',
]);
const ONDEMAND = new Set([
  'Charlestown', 'Warners Bay', 'Mount Hutton', 'Belmont', 'Gateshead', 'Dudley',
  'Redhead', 'Windale', 'Tingira Heights', 'Eleebana', 'Croudace Bay', 'Valentine',
  'Belmont North', 'Belmont South',
]);

/** City of Newcastle — Wikipedia list (residential suburbs; excludes former/locality names). */
const NEWCASTLE_SUBURBS = [
  'Adamstown Heights', 'Bar Beach', 'Beresfield', 'Birmingham Gardens', 'Black Hill',
  'Broadmeadow', 'Callaghan (University)', 'Carrington', 'Cooks Hill', 'Fletcher',
  'Georgetown', 'Hamilton', 'Hamilton East', 'Hamilton North', 'Hamilton South',
  'Hexham', 'The Hill', 'Islington', 'Jesmond', 'The Junction', 'Kooragang', 'Lambton',
  'Lenaghan', 'Maryland', 'Maryville', 'Mayfield', 'Mayfield East', 'Mayfield North',
  'Mayfield West', 'Merewether', 'Merewether Heights', 'Minmi', 'Newcastle',
  'Newcastle East', 'Newcastle West', 'North Lambton', 'Sandgate', 'Shortland',
  'Stockton', 'Tarro', 'Tighes Hill', 'Warabrook', 'Waratah', 'Waratah West', 'Wickham',
];

/** Shared between City of Newcastle and City of Lake Macquarie (Wikipedia footnotes). */
const SHARED_SUBURBS = [
  'Adamstown', 'Elermore Vale', 'Kotara', 'Kotara Heights', 'New Lambton',
  'New Lambton Heights', 'Rankin Park', 'Wallsend',
];

/** City of Lake Macquarie — Wikipedia list (excludes former/locality names & Central Coast shared). */
const LAKE_MACQUARIE_SUBURBS = [
  'Arcadia Vale', 'Argenton', 'Awaba', 'Balcolyn', 'Balmoral', 'Barnsley', 'Belmont',
  'Belmont North', 'Belmont South', 'Bennetts Green', 'Blackalls Park', 'Blacksmiths',
  'Bolton Point', 'Bonnells Bay', 'Boolaroo', 'Booragul', 'Brightwaters', 'Buttaba',
  'Cameron Park', 'Cams Wharf', 'Cardiff', 'Cardiff Heights', 'Cardiff North',
  'Cardiff South', 'Cardiff West', 'Carey Bay', 'Catherine Hill Bay', 'Caves Beach',
  'Charlestown', 'Charlestown East', 'Charlestown South', 'Coal Point', 'Cooranbong',
  'Croudace Bay', 'Dora Creek', 'Dudley', 'Edgeworth', 'Edgeworth Heights', 'Eleebana',
  'Eraring', 'Fassifern', 'Fennell Bay', 'Fishing Point', 'Floraville',
  'Freemans Waterhole', 'Garden Suburb', 'Gateshead', 'Gateshead West', 'Glendale',
  'Glendale East', 'Highfields', 'Hillsborough (South)', 'Holmesville', 'Jewells',
  'Kahibah', 'Kilaben Bay', 'Killingworth', 'Kotara South', 'Lakelands', 'Little Pelican',
  'Macquarie Hills', 'Mandalong', 'Marks Point', 'Marmong Point', 'Martinsville',
  'Middle Camp', 'Mirrabooka', 'Morisset', 'Morisset Park', 'Mount Hutton',
  'Murrays Beach', 'Myuna Bay', 'Newcastle Heights', 'Nords Wharf', 'Pelican',
  'Pinny Beach', 'Rathmines', 'Redhead', 'Ryhope', 'Seahampton', 'Silverwater',
  'Speers Point', 'Sunshine', 'Swansea', 'Swansea Heads', 'Teralba', 'Tingira Heights',
  'Toronto', 'Valentine', 'Wakefield', 'Wangi Wangi', 'Warners Bay', 'West Wallsend',
  'Whitebridge', 'Windale', 'Windermere Park', 'Woodrising', 'Wyee', 'Wyee Point',
  'Yarrawonga Park',
];

function lmZone(name: string): Zone {
  if (ZONE1.has(name)) return 1;
  if (ZONE3.has(name)) return 3;
  return 2;
}

function buildSuburbs(): SuburbEntry[] {
  const entries: SuburbEntry[] = [];
  const seen = new Set<string>();

  for (const name of NEWCASTLE_SUBURBS) {
    entries.push({ name, lgas: [NC], zone: null, onDemand: false });
    seen.add(name);
  }
  for (const name of SHARED_SUBURBS) {
    entries.push({
      name,
      lgas: [NC, LM],
      zone: lmZone(name),
      onDemand: ONDEMAND.has(name),
    });
    seen.add(name);
  }
  for (const name of LAKE_MACQUARIE_SUBURBS) {
    if (seen.has(name)) continue;
    entries.push({
      name,
      lgas: [LM],
      zone: lmZone(name),
      onDemand: ONDEMAND.has(name),
    });
    seen.add(name);
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name));
}

export const SUBURBS: SuburbEntry[] = buildSuburbs();

export function suburbInLga(entry: SuburbEntry, lga: LGA): boolean {
  return entry.lgas.includes(lga);
}

export function resolveSuburbLga(entry: SuburbEntry, selectedLga: LGA | 'Neither' | ''): LGA | null {
  if (!entry) return null;
  if (selectedLga && selectedLga !== 'Neither' && entry.lgas.includes(selectedLga)) return selectedLga;
  return entry.lgas[0] ?? null;
}

export function suburbsForLga(lga: LGA | 'Neither' | ''): SuburbEntry[] {
  if (!lga) return [];
  if (lga === 'Neither') {
    const seen = new Set<string>();
    return SUBURBS.filter((s) => {
      if (seen.has(s.name)) return false;
      seen.add(s.name);
      return true;
    });
  }
  return SUBURBS.filter((s) => suburbInLga(s, lga));
}

export function lakeMacquarieSuburbs(): SuburbEntry[] {
  return SUBURBS.filter((s) => suburbInLga(s, LM));
}
