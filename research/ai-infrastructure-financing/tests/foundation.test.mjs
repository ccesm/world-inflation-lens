import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { root, load, validate, schemaErrors, contentIdentity, qualificationSummary } from '../scripts/validate.mjs';

const fresh = () => structuredClone(load());
const invalid = (mutation, expected) => {
  const b = fresh(); mutation(b);
  const result = validate(b);
  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), expected);
};
test('qualified source-backed foundation validates; exact counts and non-additive warnings', () => {
  const result = qualificationSummary(fresh());
  assert.equal(result.valid, true, result.errors.join('\n'));
  assert.equal(result.counts.projects, 1);
  assert.equal(result.counts.entities, 8);
  assert.equal(result.counts.financing, 3);
  assert.equal(result.counts.obligations, 4);
  assert.equal(result.counts.power, 4);
  assert.equal(result.overlapWarnings[0].decision, 'DO_NOT_ADD');
});
const cases = [
  ['duplicate project IDs', b => b.projects.push(structuredClone(b.projects[0])), /duplicate stable ID/],
  ['duplicate financing IDs', b => b.financing.push(structuredClone(b.financing[0])), /duplicate stable ID/],
  ['same security represented twice under different record IDs', b => { const r = structuredClone(b.financing[0]); r.id = 'duplicate-offering'; b.financing.push(r); }, /same instrument represented twice/],
  ['same obligation represented twice', b => { const r = structuredClone(b.obligations[0]); r.id = 'duplicate-lease'; b.obligations.push(r); }, /same instrument represented twice/],
  ['unknown entity', b => b.ownership[0].ownerId = 'unidentified', /unknown reference/],
  ['missing source', b => b.claims[0].sourceId = 'missing', /unknown reference/],
  ['missing evidence', b => b.projects[0].evidence = [], /missing evidence/],
  ['percentage above 100', b => b.observations.find(r => r.id === 'meta-equity-percent').value = 101, /invalid ownership percentage/],
  ['negative percentage', b => b.observations.find(r => r.id === 'meta-equity-percent').value = -1, /invalid ownership percentage/],
  ['ownership above 100 with each member below 100', b => { b.observations.find(r => r.id === 'meta-equity-percent').value = 30; }, /ownership exceeds 100/],
  ['duplicate owner', b => b.ownership[1].ownerId = 'meta', /duplicated owner/],
  ['percentages cannot be swapped between owners', b => { [b.ownership[0].percentageObservationId, b.ownership[1].percentageObservationId] = [b.ownership[1].percentageObservationId, b.ownership[0].percentageObservationId]; }, /attached to wrong owner/],
  ['complete ownership cannot total 90', b => b.observations.find(r => r.id === 'meta-equity-percent').value = 10, /complete ownership/],
  ['currency mismatch', b => b.observations[0].currency = 'EUR', /currency\/unit mismatch/],
  ['capacity definition missing', b => b.observations.find(r => r.id === 'planned-campus').capacityDefinition = null, /capacity definition/],
  ['unsupported unknown capacity label', b => b.observations.find(r => r.id === 'planned-campus').capacityDefinition = 'IT_ASSUMED', /invalid enum/],
  ['unsupported relationship via a source co-mention', b => b.relationships[0].relationshipType = 'LENDS_TO', /unsupported relationship/],
  ['unsupported entity edge', b => b.relationships[0].fromId = 'pimco-funds', /unsupported relationship/],
  ['secondary estimate falsely observed', b => b.observations.find(r => r.id === 'financed-campus').classification = 'OBSERVED_REPORTED', /secondary estimate mislabeled observed/],
  ['Brookings scenario is not accounting', b => b.observations.find(r => r.id === 'brookings-investment').classification = 'OBSERVED_REPORTED', /Brookings scenario upgraded/],
  ['secondary publisher falsely primary', b => b.sources.find(r => r.id === 'brookings-paper').evidenceClass = 'PRIMARY_ACCOUNTING', /secondary research upgraded/],
  ['secondary entity falsely primary', b => b.entities.find(r => r.id === 'laidley').qualificationStatus = 'PRIMARY_SUPPORTED', /secondary evidence represented as primary/],
  ['unverified title holder cannot become fact', b => b.projects[0].legalAssetOwnerId = 'laidley', /unverified legal title/],
  ['unverified borrower cannot become primary', b => b.financing[0].issuerId = 'beignet-investor', /unverified borrower/],
  ['rate cannot be filled from a secondary report', b => b.financing[0].interestRate = 6.58, /financing term interestRate lacks primary evidence/],
  ['nonrecourse cannot be inferred from nonconsolidation', b => b.financing[0].recourse = 'NON_RECOURSE', /financing term recourse lacks primary evidence/],
  ['missing raw hash cannot be validated', b => b.sources[0].rawIdentityStatus = 'HASH_VALIDATED', /raw hash required/],
  ['unknown source host cannot be primary', b => b.sources.find(r => r.id === 'meta-jv').url = 'https://example.com/press', /host not qualified/],
  ['same asset is not a second investment', b => { const r = structuredClone(b.projects[0]); r.id = 'second-project'; b.projects.push(r); }, /same physical asset/],
  ['lease plus debt overlap cannot be erased', b => b.financing[0].overlapStatus = 'NO_KNOWN_OVERLAP', /overlap not acknowledged/],
  ['future lease is not current debt', b => b.obligations[0].recognition = 'RECOGNIZED', /future commitment relabeled/],
  ['lease term scope invalid', b => b.obligations[0].maxTermYears = 3, /lease terms invalid/],
  ['RVG is conditional rather than fixed payment', b => b.obligations[1].fixedPayment = true, /conditional RVG/],
  ['RVG must retain trigger', b => b.obligations[1].trigger = null, /conditional RVG/],
  ['RVG is not a parent debt guarantee', b => b.obligations[1].obligationType = 'PARENT_GUARANTEE', /classification unsupported/],
  ['operating lease cannot be silently relabeled finance lease', b => b.obligations[0].obligationType = 'FINANCE_LEASE', /classification unsupported/],
  ['development estimate is not a Meta-only funding amount', b => b.obligations[2].amountBasis = 'INITIAL_LEASE_PAYMENT_COMMITMENT', /amount basis changed/],
  ['unavailable must stay null', b => b.observations.find(r => r.id === 'project-ai-revenue').value = 0, /unavailable value fabricated/],
  ['unavailable must retain reason', b => b.observations.find(r => r.id === 'project-ai-revenue').unavailableReason = null, /unavailable value fabricated/],
  ['planned is not operational', b => b.projects[0].status = 'OPERATIONAL', /announced capacity/],
  ['missing earlier version', b => b['accounting-bridges'][1].previousVersion = 'lost-history', /historical version missing/],
  ['unsupported new aggregate origin', b => b['accounting-bridges'][2].aggregateOrigin = null, /issuer exposure converted/],
  ['no project revenue allocation', b => b.methodology.monetizationPolicy = 'ALLOCATE_CLOUD_REVENUE', /frozen contract differs|research boundary changed/],
  ['no cross-layer summation', b => b.methodology.aggregationPolicy = 'SUM_FINANCING_AND_ASSETS', /frozen contract differs|research boundary changed/],
  ['no invented ROI field', b => b.projects[0].aiRoi = 0.5, /unexpected aiRoi/],
  ['no hidden leverage score', b => b.projects[0].hiddenLeverageScore = 80, /unexpected hiddenLeverageScore/],
  ['no synthetic total investment', b => b.projects[0].totalAiInvestment = 90, /unexpected totalAiInvestment/],
  ['dates preserve economic and retrieval distinction', b => b.projects[0].reportedAt = '2026-10-08', /report after retrieval/],
  ['invalid date fails closed without exception', b => b.projects[0].reportedAt = '2025-20-10', /invalid date/],
  ['monitoring methodology cannot be silently extended', b => b.methodology.investmentScore = 10, /unexpected investmentScore/],
];
for (const [name, mutation, expected] of cases) test(name, () => invalid(mutation, expected));

test('independent lease/guarantee/commitment schemas validate their subsets', () => {
  const b = fresh();
  for (const [name, type] of [['leases', 'OPERATING_LEASE'], ['guarantees', 'RESIDUAL_VALUE_GUARANTEE'], ['commitments', 'CONSTRUCTION_FUNDING']]) {
    const schema = JSON.parse(fs.readFileSync(path.join(root, 'schemas', `${name}.schema.json`), 'utf8'));
    const records = b.obligations.filter(r => r.obligationType === type);
    assert.deepEqual(schemaErrors(records, schema), []);
    assert.ok(schemaErrors(b.obligations, schema).length > 0);
  }
});
test('versioned equity and issuer exposure retain original and later periods, no residual inference', () => {
  const b = fresh(); const q = new Map(b.observations.map(r => [r.id, r]));
  assert.equal(q.get('equity-2025').value, 1.83); assert.equal(q.get('equity-2026').value, 2.92);
  assert.equal(q.get('max-exposure-2025').value, 45.95); assert.equal(q.get('max-exposure-2026').value, 46.03);
  assert.equal(q.get('funding-meta').value, null);
  assert.equal(b['accounting-bridges'][1].previousVersion, 'bridge-equity-2025');
});
test('Hyperion graph separates primary umbrella ownership from secondary legal chain', () => {
  const b = fresh();
  assert.equal(b.projects[0].legalAssetOwnerId, null);
  assert.equal(b.relationships.find(r => r.id === 'rel-secondary-laidley-owner').qualificationStatus, 'SECONDARY_REPORTED');
  assert.equal(b.financing[0].issuerId, null); assert.equal(b.financing[0].secondaryIssuerId, 'beignet-investor');
  assert.equal(b.financing[0].recourse, 'UNKNOWN');
});
test('planned expanded campus and financier scope retain incompatible definitions; no unit conversion', () => {
  const q = new Map(fresh().observations.map(r => [r.id, r]));
  assert.equal(q.get('planned-campus').value, 5); assert.equal(q.get('planned-campus').classification, 'MANAGEMENT_GUIDANCE');
  assert.equal(q.get('financed-campus').capacityDefinition, 'UNKNOWN');
  assert.equal(q.get('gas-generation').operator, 'GT');
});
test('schema fails on unimplemented keyword instead of claiming full arbitrary JSON Schema support', () => {
  assert.match(schemaErrors({}, { oneOf: [] }).join(''), /unsupported schema keyword/);
});
test('repeat-process deterministic report and identity independent of cwd', () => {
  const command = path.join(root, 'scripts/validate.mjs');
  const first = execFileSync(process.execPath, [command], { cwd: '/tmp' });
  const second = execFileSync(process.execPath, [command], { cwd: root });
  assert.deepEqual(first, second);
  assert.equal(JSON.parse(first).contentHash, contentIdentity(fresh()));
});
test('validator has no network, publication, workflow, or write capability', () => {
  const source = fs.readFileSync(path.join(root, 'scripts/validate.mjs'), 'utf8');
  assert.doesNotMatch(source, /writeFile|fetch\(|https\.request|nodemailer|process\.env|execFile/);
});
test('all production and prior research paths are byte unchanged from qualified base', () => {
  const repo = path.resolve(root, '../..');
  const names = execFileSync('git', ['diff', '--name-only', fresh().methodology.baseSha, '--', 'src', 'public', 'data', 'scripts', '.github', 'package.json', 'package-lock.json', 'research/signal-engine', 'research/ai-capex-monetization'], { cwd: repo, encoding: 'utf8' });
  assert.equal(names.trim(), '');
});
