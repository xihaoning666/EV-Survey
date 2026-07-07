/** Suburb data — City of Newcastle & City of Lake Macquarie (Wikipedia). */
(function (global) {
  const LM = 'Lake Macquarie';
  const NC = 'Newcastle';
  const ZONE1 = new Set(['Charlestown','Warners Bay','Mount Hutton','Belmont','Gateshead','Dudley','Whitebridge','Redhead','Windale','Tingira Heights','Eleebana','Croudace Bay','Valentine','Belmont North','Belmont South']);
  const ZONE3 = new Set(['Morisset','Cooranbong','Wyee','Morisset Park','Balcolyn','Dora Creek','Eraring','Martinsville','Mandalong','Myuna Bay','Wyee Point']);
  const ONDEMAND = new Set(['Charlestown','Warners Bay','Mount Hutton','Belmont','Gateshead','Dudley','Redhead','Windale','Tingira Heights','Eleebana','Croudace Bay','Valentine','Belmont North','Belmont South']);
  const NC_ONLY = ['Adamstown Heights','Bar Beach','Beresfield','Birmingham Gardens','Black Hill','Broadmeadow','Callaghan (University)','Carrington','Cooks Hill','Fletcher','Georgetown','Hamilton','Hamilton East','Hamilton North','Hamilton South','Hexham','The Hill','Islington','Jesmond','The Junction','Kooragang','Lambton','Lenaghan','Maryland','Maryville','Mayfield','Mayfield East','Mayfield North','Mayfield West','Merewether','Merewether Heights','Minmi','Newcastle','Newcastle East','Newcastle West','North Lambton','Sandgate','Shortland','Stockton','Tarro','Tighes Hill','Warabrook','Waratah','Waratah West','Wickham'];
  const SHARED = ['Adamstown','Elermore Vale','Kotara','Kotara Heights','New Lambton','New Lambton Heights','Rankin Park','Wallsend'];
  const LM_ONLY = ['Arcadia Vale','Argenton','Awaba','Balcolyn','Balmoral','Barnsley','Belmont','Belmont North','Belmont South','Bennetts Green','Blackalls Park','Blacksmiths','Bolton Point','Bonnells Bay','Boolaroo','Booragul','Brightwaters','Buttaba','Cameron Park','Cams Wharf','Cardiff','Cardiff Heights','Cardiff North','Cardiff South','Cardiff West','Carey Bay','Catherine Hill Bay','Caves Beach','Charlestown','Charlestown East','Charlestown South','Coal Point','Cooranbong','Croudace Bay','Dora Creek','Dudley','Edgeworth','Edgeworth Heights','Eleebana','Eraring','Fassifern','Fennell Bay','Fishing Point','Floraville','Freemans Waterhole','Garden Suburb','Gateshead','Gateshead West','Glendale','Glendale East','Highfields','Hillsborough (South)','Holmesville','Jewells','Kahibah','Kilaben Bay','Killingworth','Kotara South','Lakelands','Little Pelican','Macquarie Hills','Mandalong','Marks Point','Marmong Point','Martinsville','Middle Camp','Mirrabooka','Morisset','Morisset Park','Mount Hutton','Murrays Beach','Myuna Bay','Newcastle Heights','Nords Wharf','Pelican','Pinny Beach','Rathmines','Redhead','Ryhope','Seahampton','Silverwater','Speers Point','Sunshine','Swansea','Swansea Heads','Teralba','Tingira Heights','Toronto','Valentine','Wakefield','Wangi Wangi','Warners Bay','West Wallsend','Whitebridge','Windale','Windermere Park','Woodrising','Wyee','Wyee Point','Yarrawonga Park'];

  function lmZone(n) { if (ZONE1.has(n)) return 1; if (ZONE3.has(n)) return 3; return 2; }
  function build() {
    const out = [], seen = new Set();
    NC_ONLY.forEach(function (n) { out.push({ name: n, lgas: [NC], zone: null, onDemand: false }); seen.add(n); });
    SHARED.forEach(function (n) { out.push({ name: n, lgas: [NC, LM], zone: lmZone(n), onDemand: ONDEMAND.has(n) }); seen.add(n); });
    LM_ONLY.forEach(function (n) { if (!seen.has(n)) { out.push({ name: n, lgas: [LM], zone: lmZone(n), onDemand: ONDEMAND.has(n) }); seen.add(n); } });
    return out.sort(function (a, b) { return a.name.localeCompare(b.name); });
  }
  const SUBURBS = build();
  global.SurveySuburbs = {
    SUBURBS: SUBURBS,
    suburbsForLga: function (lga) {
      if (!lga) return [];
      if (lga === 'Neither') { var s = new Set(); return SUBURBS.filter(function (x) { if (s.has(x.name)) return false; s.add(x.name); return true; }); }
      return SUBURBS.filter(function (x) { return x.lgas.indexOf(lga) >= 0; });
    },
    lakeMacquarieSuburbs: function () { return SUBURBS.filter(function (x) { return x.lgas.indexOf(LM) >= 0; }); },
    resolveLga: function (entry, sel) {
      if (!entry) return null;
      if (sel && sel !== 'Neither' && entry.lgas.indexOf(sel) >= 0) return sel;
      return entry.lgas[0] || null;
    },
    inLga: function (entry, lga) { return entry && entry.lgas.indexOf(lga) >= 0; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
