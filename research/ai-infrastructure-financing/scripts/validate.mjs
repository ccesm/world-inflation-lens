import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const root = fileURLToPath(new URL('../', import.meta.url));
export const collections = ['projects', 'entities', 'financing', 'ownership', 'obligations', 'power', 'sources', 'claims', 'observations', 'relationships', 'accounting-bridges'];
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
export const load = () => Object.fromEntries(['methodology', ...collections].map(name => [name, read(`data/${name}.json`)]));
const definitions = read('schemas/records.schema.json').$defs;

// Executable subset of the committed draft-2020-12 schemas. No coercion or defaults.
// Unknown keywords are errors, so a future schema cannot silently exceed this validator.
export function schemaErrors(value, schema, location = '$') {
  const errors = [], fail = reason => errors.push(`${location}: ${reason}`);
  const keywords = new Set(['$schema', '$id', '$ref', '$defs', 'type', 'enum', 'const', 'properties', 'required', 'additionalProperties', 'items', 'uniqueItems', 'minimum', 'minLength', 'pattern', 'minItems', 'maxItems']);
  for (const key of Object.keys(schema)) if (!keywords.has(key)) fail(`unsupported schema keyword ${key}`);
  if (schema.$ref) {
    const key = schema.$ref.split('/').at(-1);
    if (!definitions[key]) fail('unknown schema reference');
    else errors.push(...schemaErrors(value, definitions[key], location));
    return errors;
  }
  const kind = value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;
  const types = schema.type ? [schema.type].flat() : null;
  if (types && !types.includes(kind) && !(Number.isInteger(value) && types.includes('integer'))) { fail('type mismatch'); return errors; }
  if (schema.enum && !schema.enum.includes(value)) fail('invalid enum');
  if (Object.hasOwn(schema, 'const') && JSON.stringify(value) !== JSON.stringify(schema.const)) fail('frozen contract differs');
  if (kind === 'number' && (!Number.isFinite(value) || (schema.minimum !== undefined && value < schema.minimum))) fail('numeric bounds');
  if (kind === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) fail('empty string');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) fail('pattern mismatch');
  }
  if (kind === 'object') {
    for (const key of schema.required ?? []) if (!Object.hasOwn(value, key)) fail(`missing ${key}`);
    for (const [key, child] of Object.entries(value)) {
      if (!schema.properties?.[key]) { if (schema.additionalProperties === false) fail(`unexpected ${key}`); }
      else errors.push(...schemaErrors(child, schema.properties[key], `${location}.${key}`));
    }
  }
  if (kind === 'array') {
    if ((schema.minItems !== undefined && value.length < schema.minItems) || (schema.maxItems !== undefined && value.length > schema.maxItems)) fail('array bounds');
    if (schema.uniqueItems && new Set(value.map(v => JSON.stringify(v))).size !== value.length) fail('duplicate array item');
    if (schema.items) value.forEach((v, i) => errors.push(...schemaErrors(v, schema.items, `${location}[${i}]`)));
  }
  return errors;
}

export function overlapRisks(bundle) {
  const groups = new Map();
  for (const [kind, rows] of Object.entries(bundle)) {
    if (!Array.isArray(rows)) continue;
    for (const row of rows) if (row.assetIdentity) {
      const entries = groups.get(row.assetIdentity) ?? [];
      entries.push({ id: row.id, kind }); groups.set(row.assetIdentity, entries);
    }
  }
  return [...groups].filter(([, rows]) => rows.some(r => r.kind === 'financing') && rows.some(r => r.kind === 'obligations')).map(([assetIdentity, records]) => ({ assetIdentity, status: 'SAME_ASSET_DIFFERENT_LAYER', decision: 'DO_NOT_ADD', records }));
}

export function validate(bundle) {
  const errors = [], fail = (id, reason) => errors.push(`${id}: ${reason}`);
  errors.push(...schemaErrors(bundle.methodology, read('schemas/methodology.schema.json'), 'methodology'));
  for (const name of collections) errors.push(...schemaErrors(bundle[name], read(`schemas/${name}.schema.json`), name));
  if (errors.length) return { valid: false, errors, overlapWarnings: [] };
  const all = new Map();
  for (const name of collections) for (const row of bundle[name]) {
    if (all.has(row.id)) fail(row.id, 'duplicate stable ID'); else all.set(row.id, row);
  }
  const map = name => new Map(bundle[name].map(r => [r.id, r]));
  const entities = map('entities'), sources = map('sources'), claims = map('claims'), quantities = map('observations');
  const reference = (id, target, owner, nullable = false) => { if (!(nullable && id === null) && !target.has(id)) fail(owner, `unknown reference ${id}`); };
  const referenceFields = ['anchorTenantId', 'legalAssetOwnerId', 'ownerUmbrellaId', 'economicUserId', 'developerId', 'ownerId', 'ownedEntityId', 'issuerId', 'secondaryIssuerId', 'recipientId', 'obligorId', 'beneficiaryId', 'utilityId', 'entityId', 'jvExposureEntityId'];
  const hostPolicy = { 'meta-jv': 'investor.atmeta.com', 'meta-2025k': 'www.sec.gov', 'meta-2026q2': 'www.sec.gov', 'cc-pimco': 'www.cliffordchance.com', 'meta-engineering': 'engineering.fb.com', 'meta-expansion': 'about.fb.com', 'entergy-substation': 'www.entergy.com', 'entergy-approval': 'www.entergy.com', 'entergy-expansion': 'www.entergy.com' };
  for (const s of bundle.sources) {
    let url;
    try { url = new URL(s.url); } catch { fail(s.id, 'invalid source URL'); }
    if (url && (url.protocol !== 'https:' || url.username || url.password)) fail(s.id, 'source URL contains credentials or invalid protocol');
    if (s.evidenceClass.startsWith('PRIMARY') && url?.hostname !== hostPolicy[s.id]) fail(s.id, 'primary publisher/host not qualified');
    if ((s.id.startsWith('brookings') || s.id === 'sp-webinar') && s.evidenceClass !== 'SECONDARY_RESEARCH') fail(s.id, 'secondary research upgraded to primary');
    if (s.rawIdentityStatus === 'HASH_VALIDATED' && !s.rawSha256) fail(s.id, 'raw hash required');
    if (s.rawIdentityStatus === 'NOT_ARCHIVED' && s.rawSha256 !== null) fail(s.id, 'unverified raw hash');
    if (s.publicationDate && s.publicationDate > s.retrievedAt) fail(s.id, 'publication after retrieval');
  }
  for (const c of bundle.claims) reference(c.sourceId, sources, c.id);
  for (const name of collections) for (const row of bundle[name]) {
    for (const key of referenceFields) if (Object.hasOwn(row, key)) reference(row[key], entities, row.id, true);
    for (const key of ['otherTenantIds', 'funderIds']) for (const id of row[key] ?? []) reference(id, entities, row.id);
    for (const key of ['possibleOverlapWith', 'accountingBridgeIds', 'financingIds', 'obligationIds', 'powerIds', 'leaseExposureIds', 'guaranteeExposureIds', 'purchaseCommitmentIds', 'capacityCommitmentIds']) for (const id of row[key] ?? []) reference(id, all, row.id);
    for (const key of ['capacityObservationIds', 'costObservationIds', 'monetizationObservationIds']) for (const id of row[key] ?? []) reference(id, quantities, row.id);
    for (const key of ['amountObservationId', 'percentageObservationId', 'capacityObservationId', 'observationId', 'corporateCapexObservationId']) if (Object.hasOwn(row, key)) reference(row[key], quantities, row.id, true);
    for (const id of Object.values(row.costComponentObservationIds ?? {})) reference(id, quantities, row.id, true);
    if (row.evidence) {
      if (row.evidence.length === 0 && row.qualificationStatus !== 'UNAVAILABLE') fail(row.id, 'missing evidence');
      for (const id of row.evidence) {
        reference(id, claims, row.id);
        const source = sources.get(claims.get(id)?.sourceId);
        if (row.qualificationStatus === 'PRIMARY_SUPPORTED' && !source?.evidenceClass.startsWith('PRIMARY')) fail(row.id, 'secondary evidence represented as primary fact');
      }
    }
    if (row.revision) {
      if ((row.revision === 1) !== (row.previousVersion === null) || (row.revision === 1) !== (row.changeType === 'ORIGINAL')) fail(row.id, 'invalid version chain');
      if (row.previousVersion) {
        const prior = all.get(row.previousVersion);
        if (!prior || prior.revision !== row.revision - 1 || prior.assetIdentity !== row.assetIdentity || prior.id === row.id || (prior.periodEnd && prior.periodEnd >= row.periodEnd)) fail(row.id, 'historical version missing or incompatible');
      }
      for (const key of ['announcedAt', 'effectiveAt', 'reportedAt', 'retrievedAt', 'periodStart', 'periodEnd', 'maturityDate', 'expectedOperationalDate']) {
        if (row[key] !== null && (!/^\d{4}-\d{2}-\d{2}$/.test(row[key]) || !Number.isFinite(Date.parse(row[key])) || new Date(row[key]).toISOString().slice(0, 10) !== row[key])) fail(row.id, `invalid date ${key}`);
      }
      if (row.reportedAt && row.reportedAt > row.retrievedAt) fail(row.id, 'report after retrieval');
    }
  }
  for (const q of bundle.observations) {
    if (q.classification === 'UNAVAILABLE') {
      if (q.value !== null || !q.unavailableReason || q.unit !== 'UNKNOWN') fail(q.id, 'unavailable value fabricated');
    } else if (q.value === null || q.unit === 'UNKNOWN') fail(q.id, 'known value missing');
    if (q.unit.startsWith('USD') ? q.currency !== 'USD' : q.currency !== null) fail(q.id, 'currency/unit mismatch');
    if (['MW', 'GW'].includes(q.unit) !== (q.capacityDefinition !== null)) fail(q.id, 'capacity definition missing or invalid');
    for (const id of q.evidence) {
      const c = claims.get(id), s = sources.get(c?.sourceId);
      if (c?.kind !== 'QUANTITY' || c.object !== q.id || ['value', 'unit', 'classification', 'capacityDefinition'].some(k => c[k] !== q[k])) fail(q.id, 'quantity differs from cited source claim');
      if (s?.evidenceClass.startsWith('SECONDARY') && ['OBSERVED_REPORTED', 'TRANSACTION_VALUE', 'CONTRACTUAL_COMMITMENT'].includes(q.classification)) fail(q.id, 'secondary estimate mislabeled observed');
      if (q.id.startsWith('brookings') && q.classification !== 'MODEL_DERIVED') fail(q.id, 'Brookings scenario upgraded to accounting fact');
    }
  }
  const ownershipGroups = new Map();
  for (const row of bundle.ownership) {
    const q = quantities.get(row.percentageObservationId);
    if (q?.unit !== 'PERCENT' || q.value === null || q.value < 0 || q.value > 100) fail(row.id, 'invalid ownership percentage');
    if (!q?.evidence.some(id => claims.get(id)?.subject === row.ownerId)) fail(row.id, 'ownership percentage attached to wrong owner');
    if (!row.evidence.some(id => { const c = claims.get(id); return c?.subject === row.ownerId && c.object === row.ownedEntityId && ['OWNS', 'PARTIALLY_OWNS'].includes(c.predicate); })) fail(row.id, 'ownership unsupported');
    const rows = ownershipGroups.get(row.ownershipGroup) ?? []; rows.push(row); ownershipGroups.set(row.ownershipGroup, rows);
  }
  for (const [id, rows] of ownershipGroups) {
    const total = rows.reduce((sum, row) => sum + (quantities.get(row.percentageObservationId)?.value ?? 0), 0);
    if (new Set(rows.map(r => r.ownerId)).size !== rows.length || new Set(rows.map(r => r.ownedEntityId)).size !== 1) fail(id, 'duplicated owner or inconsistent ownership group');
    if (total > 100 && !rows.every(r => r.excessExplanation)) fail(id, 'ownership exceeds 100 without explanation');
    if (rows.every(r => r.groupCoverage === 'COMPLETE') && Math.abs(total - 100) > 1e-9) fail(id, 'complete ownership does not total 100');
  }
  for (const row of bundle.relationships) {
    reference(row.fromId, all, row.id); reference(row.toId, all, row.id);
    if (!row.evidence.some(id => { const c = claims.get(id); return c?.subject === row.fromId && c.predicate === row.relationshipType && c.object === row.toId; })) fail(row.id, 'unsupported relationship; co-mention is insufficient');
  }
  for (const field of ['financingIdentity', 'obligationIdentity']) {
    const rows = bundle[field === 'financingIdentity' ? 'financing' : 'obligations'];
    if (new Set(rows.map(r => r[field])).size !== rows.length) fail(field, 'same instrument represented twice');
  }
  for (const row of [...bundle.financing, ...bundle.obligations]) {
    const q = quantities.get(row.amountObservationId);
    if (q && !q.unit.startsWith('USD')) fail(row.id, 'capital/obligation amount is not money');
    if (row.issuerId && entities.get(row.issuerId)?.qualificationStatus === 'SECONDARY_REPORTED' && row.qualificationStatus === 'PRIMARY_SUPPORTED') fail(row.id, 'unverified borrower upgraded to primary');
    if (row.obligationType === 'RESIDUAL_VALUE_GUARANTEE' && (!row.trigger || row.fixedPayment !== false)) fail(row.id, 'conditional RVG treated as fixed payment');
    if (['OPERATING_LEASE', 'FINANCE_LEASE', 'FUTURE_LEASE'].includes(row.obligationType) && (!row.initialTermYears || row.maxTermYears < row.initialTermYears)) fail(row.id, 'lease terms invalid');
    if (row.id === 'campus-lease' && row.recognition !== 'NOT_COMMENCED') fail(row.id, 'future commitment relabeled current debt');
    const classificationPredicate = row.id === 'campus-lease' ? 'LEASE_CLASS' : row.id === 'campus-rvg' ? 'GUARANTEE_CLASS' : null;
    if (classificationPredicate && !row.evidence.some(id => { const c = claims.get(id); return c?.predicate === classificationPredicate && c.object === row.obligationType; })) fail(row.id, 'obligation classification unsupported');
    const amountBasis = { 'campus-lease': 'INITIAL_LEASE_PAYMENT_COMMITMENT', 'campus-rvg': 'DECLINING_RVG_THRESHOLD', 'development-funding': 'TOTAL_PROJECT_ESTIMATED_COST', 'power-service': 'UNAVAILABLE' };
    if (amountBasis[row.id] && row.amountBasis !== amountBasis[row.id]) fail(row.id, 'obligation amount basis changed');
    if (row.termEvidence) for (const [term, claimId] of Object.entries(row.termEvidence)) {
      const value = row[term];
      if (value === null || (term === 'recourse' && value === 'UNKNOWN')) continue;
      const c = claims.get(claimId), s = sources.get(c?.sourceId);
      if (!c || c.subject !== row.id || c.predicate !== term || c.object !== String(value) || !s?.evidenceClass.startsWith('PRIMARY')) fail(row.id, `financing term ${term} lacks primary evidence`);
    }
  }
  const assetGroups = new Map();
  for (const row of bundle.projects) {
    if (assetGroups.has(row.assetIdentity)) fail(row.id, 'same physical asset represented as two investments');
    assetGroups.set(row.assetIdentity, row.id);
    if (row.status === 'OPERATIONAL' && !row.operationalDate) fail(row.id, 'announced capacity treated as operational');
    if (row.legalAssetOwnerId && entities.get(row.legalAssetOwnerId)?.qualificationStatus !== 'PRIMARY_SUPPORTED' && row.qualificationStatus === 'PRIMARY_SUPPORTED') fail(row.id, 'unverified legal title promoted');
  }
  const warnings = overlapRisks(bundle);
  for (const warning of warnings) for (const ref of warning.records) {
    if (['NO_KNOWN_OVERLAP', 'UNRESOLVED'].includes(all.get(ref.id).overlapStatus)) fail(ref.id, 'lease/project-debt same-asset overlap not acknowledged');
  }
  for (const row of bundle['accounting-bridges']) {
    if (row.accountingType === 'ISSUER_REPORTED_MAXIMUM_EXPOSURE' && (row.aggregateOrigin !== 'ISSUER_REPORTED' || row.recognition !== 'ISSUER_DISCLOSED_MAXIMUM_EXPOSURE')) fail(row.id, 'issuer exposure converted to model aggregate');
    if (row.id === 'bridge-rvg' && row.recognition !== 'NO_RVG_LIABILITY_RECORDED') fail(row.id, 'RVG recognition misrepresented');
  }
  if (!bundle.methodology.researchOnly || bundle.methodology.aggregationPolicy !== 'DO_NOT_ADD_LAYERS' || bundle.methodology.monetizationPolicy !== 'NO_PROJECT_ALLOCATION') fail('methodology', 'research boundary changed');
  return { valid: errors.length === 0, errors, overlapWarnings: warnings };
}

export function contentIdentity(bundle) {
  const canonical = value => value === null || typeof value !== 'object' ? value : Array.isArray(value) ? value.map(canonical) : Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return crypto.createHash('sha256').update(JSON.stringify(canonical(bundle))).digest('hex');
}

export function qualificationSummary(bundle) {
  const result = validate(bundle);
  const specFiles = fs.readdirSync(path.join(root, 'schemas')).sort().map(name => `schemas/${name}`).concat('scripts/validate.mjs');
  const specificationHash = crypto.createHash('sha256').update(JSON.stringify(specFiles.map(name => [name, fs.readFileSync(path.join(root, name), 'utf8')]))).digest('hex');
  return { methodologyVersion: bundle.methodology.version, contentHash: contentIdentity(bundle), specificationHash, valid: result.valid, counts: Object.fromEntries(collections.map(key => [key, bundle[key].length])), errors: result.errors, overlapWarnings: result.overlapWarnings, decision: result.valid ? 'READY FOR AI INFRASTRUCTURE FINANCING EXPANSION' : 'AI INFRASTRUCTURE FINANCING FOUNDATION NEEDS REPAIR' };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const summary = qualificationSummary(load());
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.valid) process.exitCode = 1;
}
