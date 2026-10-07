import { createHash } from 'node:crypto';

export const version = 'ai-capex-foundation-v0.1';
export const companies = ['MSFT', 'GOOG', 'AMZN', 'META'];
export const classifications = ['OBSERVED', 'CALCULATED_FROM_DISCLOSED_VALUES', 'MANAGEMENT_ATTRIBUTION', 'MODEL_DERIVED', 'UNAVAILABLE'];
export const attribution = ['DIRECT_AI_CAPEX_DISCLOSED', 'AI_INFRASTRUCTURE_MAJORITY_DISCLOSED', 'MIXED_AI_CLOUD_INFRASTRUCTURE', 'CORE_BUSINESS_PLUS_AI', 'UNATTRIBUTABLE'];
// IDs retain native scope; cash, additions, principal and commitments never alias.
export const metrics = {
  revenue: ['financials', 'GAAP'], costRevenue: ['financials', 'GAAP'], operatingIncome: ['financials', 'GAAP'],
  segmentRevenue: ['cloud', 'GAAP'], segmentOperatingIncome: ['cloud', 'GAAP'],
  cfo: ['cashFlow', 'GAAP'], cashPpeGross: ['capex', 'GAAP'], ppeProceedsIncentives: ['capex', 'GAAP'],
  cashPpeNet: ['capex', 'GAAP'], financeLeasePrincipal: ['cashFlow', 'GAAP'],
  financeLeaseAdditions: ['capex', 'GAAP'], operatingLeaseCash: ['cashFlow', 'GAAP'],
  nativeCapex: ['capex', 'COMPANY_DEFINED'], fcfReported: ['cashFlow', 'NON_GAAP'],
  depreciationPpe: ['depreciation', 'GAAP'], depreciationAmortizationOther: ['depreciation', 'GAAP'],
  ppeDepreciationAmortization: ['depreciation', 'GAAP'],
  cloudGrossMargin: ['cloud', 'COMPANY_DEFINED'], cloudGrowth: ['cloud', 'COMPANY_DEFINED'],
  rpo: ['backlogCapacity', 'COMPANY_DEFINED'], aiRevenueRunRate: ['monetization', 'COMPANY_DEFINED'],
  paidAiSeats: ['monetization', 'COMPANY_DEFINED'], adImpressionsGrowth: ['monetization', 'COMPANY_DEFINED'],
  adPriceGrowth: ['monetization', 'COMPANY_DEFINED'], aiRevenueRecognized: ['monetization', 'GAAP'],
  shortLivedShare: ['capexComposition', 'COMPANY_DEFINED'], capexGuidance: ['guidance', 'COMPANY_DEFINED'],
  investmentGain: ['investmentContext', 'GAAP'],
};
const money = new Set(Object.keys(metrics).filter(k => !['cloudGrossMargin', 'cloudGrowth', 'paidAiSeats', 'adImpressionsGrowth', 'adPriceGrowth', 'shortLivedShare'].includes(k)));
const fail = msg => { throw new Error(msg); };
export function date(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) fail('DATE');
  const parsed = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(+parsed) || parsed.toISOString().slice(0, 10) !== value) fail('DATE');
  return value;
}
export function fiscalQuarter(company, end) {
  date(end);
  if (!companies.includes(company)) fail('COMPANY');
  const year = Number(end.slice(0, 4)); const month = Number(end.slice(5, 7));
  if (![3, 6, 9, 12].includes(month) || end !== new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10)) fail('QUARTER_END');
  return company === 'MSFT' ? `FY${year + (month > 6 ? 1 : 0)}Q${({3:3,6:4,9:1,12:2})[month]}` : `FY${year}Q${month / 3}`;
}
export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])]));
  return value;
}
export const bytes = value => `${JSON.stringify(canonical(value), null, 2)}\n`;
export const hash = value => createHash('sha256').update(typeof value === 'string' ? value : bytes(value)).digest('hex');
const sourceHosts = { MSFT: ['www.microsoft.com', 'www.sec.gov'], GOOG: ['abc.xyz', 'www.sec.gov'], AMZN: ['ir.aboutamazon.com', 'www.sec.gov'], META: ['investor.atmeta.com', 'www.sec.gov'] };
export function validate(bundle) {
  if (bundle.schemaVersion !== version || !Array.isArray(bundle.sources) || !Array.isArray(bundle.observations)) fail('SCHEMA');
  const sources = new Map();
  for (const s of bundle.sources) {
    if (!s.sourceId || sources.has(s.sourceId) || !companies.includes(s.company)) fail('SOURCE_ID');
    date(s.sourceDate); date(s.retrievedOn);
    if (s.sourceDate > s.retrievedOn) fail('SOURCE_CHRONOLOGY');
    const url = new URL(s.url);
    if (url.protocol !== 'https:' || !sourceHosts[s.company].includes(url.hostname) || !s.publisher || !s.title || !s.locator) fail('PROVENANCE');
    if (s.verificationMethod !== 'MANUAL_OFFICIAL_PAGE_REVIEW' || s.rawSha256 !== null) fail('REVIEW_IDENTITY');
    sources.set(s.sourceId, s);
  }
  const seen = new Set();
  for (const o of bundle.observations) {
    const s = sources.get(o.sourceId); const spec = metrics[o.metric];
    if (!s || s.company !== o.company || !o.observationId || seen.has(o.observationId)) fail('OBSERVATION_ID');
    seen.add(o.observationId);
    if (!spec || o.domain !== spec[0] || o.accountingBasis !== spec[1]) fail('METRIC_SCOPE');
    if (!classifications.includes(o.evidenceClass) || !['Q', 'YTD', 'FY', 'TTM', 'POINT', 'RUN_RATE', 'GUIDANCE'].includes(o.periodType)) fail('CLASSIFICATION');
    const frequency = {Q:'QUARTERLY',YTD:'YEAR_TO_DATE',FY:'ANNUAL',TTM:'TRAILING_TWELVE_MONTHS',POINT:'POINT_IN_TIME',RUN_RATE:'ANNUALIZED_RATE',GUIDANCE:'GUIDANCE'};
    if (o.frequency !== frequency[o.periodType]) fail('FREQUENCY');
    date(o.periodStart); date(o.periodEnd);
    if (o.periodStart > o.periodEnd || o.fiscalQuarter !== fiscalQuarter(o.company, o.periodEnd) || o.calendarQuarter !== `${o.periodEnd.slice(0,4)}Q${Number(o.periodEnd.slice(5,7))/3}`) fail('PERIOD');
    if (o.periodType !== 'GUIDANCE' && o.periodEnd > s.sourceDate) fail('FUTURE_OBSERVATION');
    const end = new Date(`${o.periodEnd}T00:00:00Z`);
    if (o.periodType === 'FY' && Number(o.periodEnd.slice(5,7)) !== (o.company === 'MSFT' ? 6 : 12)) fail('FISCAL_YEAR_END');
    const months = {Q:3,YTD:Number(o.periodEnd.slice(5,7)),FY:12,TTM:12}[o.periodType];
    if (months) {
      const startMonth = o.periodType === 'YTD' && o.company === 'MSFT' ? ({3:9,6:12,9:3,12:6})[Number(o.periodEnd.slice(5,7))] : months;
      const expected = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1 - startMonth, 1)).toISOString().slice(0,10);
      if (o.periodStart !== expected) fail('PERIOD_HORIZON');
    } else if (['POINT', 'RUN_RATE'].includes(o.periodType) && o.periodStart !== o.periodEnd) fail('POINT_PERIOD');
    if (!o.definition || !o.locator || !o.scope || !o.nativeLabel || !o.revisionStatus || !Array.isArray(o.limitations)) fail('PROVENANCE');
    if (o.evidenceClass === 'UNAVAILABLE') { if (o.value !== null || !o.unavailableReason) fail('MISSING'); }
    else if (!Number.isFinite(o.value) || !['EXACT', 'ROUNDED', 'LOWER_BOUND', 'APPROXIMATE', 'RANGE_LOWER_BOUND'].includes(o.precision)) fail('VALUE');
    if (money.has(o.metric) && o.unit !== 'USD_MILLIONS') fail('UNIT');
    if (!money.has(o.metric) && o.unit !== (o.metric === 'paidAiSeats' ? 'MILLION_SEATS' : 'PERCENT')) fail('UNIT');
    if (o.metric === 'aiRevenueRunRate' && (o.periodType !== 'RUN_RATE' || o.evidenceClass !== 'MANAGEMENT_ATTRIBUTION')) fail('RUN_RATE_NOT_REVENUE');
    if (o.metric === 'rpo' && o.periodType !== 'POINT') fail('BACKLOG_NOT_REVENUE');
    if (o.metric === 'capexGuidance' && (o.periodType !== 'GUIDANCE' || o.evidenceClass !== 'MANAGEMENT_ATTRIBUTION')) fail('GUIDANCE_NOT_OBSERVED');
    if (o.metric === 'shortLivedShare' && o.evidenceClass !== 'MANAGEMENT_ATTRIBUTION') fail('COMPOSITION_NOT_AI_ALLOCATION');
    const key = [o.company, o.metric, o.scope, o.periodType, o.periodStart, o.periodEnd, o.sourceId].join('|');
    if (seen.has(key)) fail('DUPLICATE_FILING'); seen.add(key);
  }
  for (const o of bundle.observations.filter(o => o.evidenceClass === 'CALCULATED_FROM_DISCLOSED_VALUES')) {
    const definitions = { 'AMZN:cashPpeNet': ['cashPpeGross', 'ppeProceedsIncentives', (a,b) => a-b], 'META:nativeCapex': ['cashPpeGross', 'financeLeasePrincipal', (a,b) => a+b] };
    const definition = definitions[`${o.company}:${o.metric}`];
    if (!definition || !o.calculation || !Array.isArray(o.calculation.inputs) || o.calculation.inputs.length !== 2 || !o.calculation.formula) fail('DERIVED_LINEAGE');
    const inputs = o.calculation.inputs.map(id => bundle.observations.find(row => row.observationId === id));
    if (inputs.some((row,i) => !row || row.metric !== definition[i] || row.company !== o.company || row.scope !== o.scope || row.sourceId !== o.sourceId || row.periodStart !== o.periodStart || row.periodEnd !== o.periodEnd || row.periodType !== o.periodType || row.precision !== 'EXACT' || row.value === null) || definition[2](inputs[0].value, inputs[1].value) !== o.value) fail('DERIVED_LINEAGE');
  }
  return true;
}
// No automatic vintage winner: different filings retain separate source identities.
export function normalize(bundle) {
  validate(bundle);
  const { sources, observations, ...header } = structuredClone(bundle);
  const result = {...header, sources: sources.sort((a,b) => a.sourceId.localeCompare(b.sourceId)), observations: observations.sort((a,b) => a.observationId.localeCompare(b.observationId))};
  return { content: result, contentHash: hash(result) };
}
export function derive(bundle, company, end, sourceId) {
  validate(bundle);
  const rows = bundle.observations.filter(o => o.company === company && o.periodEnd === end && o.periodType === 'Q' && o.scope === 'CONSOLIDATED' && o.sourceId === sourceId);
  const get = metric => { const found = rows.filter(o => o.metric === metric); if (found.length > 1) fail('AMBIGUOUS_VINTAGE'); return found[0]; };
  const out = [];
  const calc = (metric, operands, fn, unit, formula) => {
    const inputs = operands.map(get);
    const available = inputs.every(o => o && o.value !== null && o.precision === 'EXACT');
    const value = available ? fn(...inputs.map(o => o.value)) : null;
    out.push({company, metric, periodEnd:end, periodType:'Q', unit, value: Number.isFinite(value) ? value : null, evidenceClass:Number.isFinite(value) ? 'CALCULATED_FROM_DISCLOSED_VALUES' : 'UNAVAILABLE', inputs:inputs.filter(Boolean).map(o => o.observationId), formula, limitations:['Company-wide or segment economics are not attributable AI returns.']});
  };
  const cash = company === 'AMZN' ? 'cashPpeNet' : 'cashPpeGross';
  calc('cashPpeToRevenue', [cash,'revenue'], (c,r) => r > 0 ? 100*c/r : null, 'PERCENT', `100 * ${cash} / revenue`);
  calc('cashPpeToCfo', [cash,'cfo'], (c,f) => f > 0 ? 100*c/f : null, 'PERCENT', `100 * ${cash} / cfo`);
  if (company === 'META') calc('cashFcfIncludingLeasePrincipal', ['cfo',cash,'financeLeasePrincipal'], (f,c,l) => f-c-l, 'USD_MILLIONS', `cfo - ${cash} - financeLeasePrincipal`);
  else calc('cashFcf', ['cfo',cash], (f,c) => f-c, 'USD_MILLIONS', `cfo - ${cash}`);
  calc('operatingMargin', ['operatingIncome','revenue'], (i,r) => r > 0 ? 100*i/r : null, 'PERCENT', '100 * operatingIncome / revenue');
  calc('grossMargin', ['revenue','costRevenue'], (r,c) => r > 0 ? 100*(r-c)/r : null, 'PERCENT', '100 * (revenue - costRevenue) / revenue');
  return out;
}
