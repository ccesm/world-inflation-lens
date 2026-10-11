"""Offline D0 architecture contract audit; does not generate production assets."""
import hashlib
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
C2 = ROOT.parent / 'phase-c2'
BASE = '362929adfae20b31d8044e5c9a10ae020f0c9eaf'
EXPECTED = ['EIA_COMM_SALES', 'EIA_COMM_PRICE', 'HENRY_HUB', 'CENSUS_DC', 'PNFIC1',
            'DFII10', 'NCBDBIQ027S', 'OPHNFB', 'ULCNFB', 'CPIAUCSL', 'PCEPILFE', 'SPF10']
REQUIRED = ['PHASE_D0_INTEGRATION_ARCHITECTURE_REPORT.md', 'production-compatibility-matrix.json',
            'c2-data-contract-mapping.json', 'AI_MACRO_MONITOR_PAGE_SPEC.md', 'integration-strategy.md',
            'international-extension-design.md', 'integration-risk-register.json', 'PHASE_D1_IMPLEMENTATION_PLAN.md']


def load(path):
    return json.loads(path.read_text())


def require(value, message):
    if not value:
        raise ValueError(message)


def digest(data):
    return hashlib.sha256(data).hexdigest()


def validate_mapping(mapping, model):
    require(mapping['baseSHA'] == BASE, 'Wrong research base')
    require(mapping['sourceSchema'] == model['schemaVersion'], 'Schema mismatch')
    require(mapping['sourceAsOf'] == model['sourceAsOf'], 'Snapshot mismatch')
    require([i['indicatorId'] for i in mapping['indicators']] == EXPECTED, 'Exact indicator set/order')
    require([i for section in mapping['sections'] for i in section['indicatorIds']] == EXPECTED,
            'Sections must cover exact indicators once')
    for entry in mapping['indicators']:
        group = [s for s in model['series'] if s['indicatorId'] == entry['indicatorId']]
        require(entry['sectionId'] == next(s['id'] for s in mapping['sections']
                if entry['indicatorId'] in s['indicatorIds']), 'Wrong section')
        require(entry['seriesIds'] == [s['seriesId'] for s in group], 'Series mapping mismatch')
        require(entry['geographies'] == [s['geography'] for s in group], 'Geography mismatch')
        for field in ('frequency', 'unit', 'seasonalAdjustment', 'nominalOrReal', 'measureType',
                      'definition', 'sourceId', 'sourceHash', 'originalProvider', 'officialURL',
                      'calculationUnit', 'nativeChangeBasis'):
            require(all(s[field] == entry[field] for s in group), 'Definition/source mismatch: ' + field)
        require(entry['records'] == sum(s['rawRowCount'] for s in group), 'Record count')
        require(entry['missingValues'] == sum(s['missingRowCount'] for s in group), 'Missing count')
        require(entry['lastRecordPeriods'] == sorted({s['lastRecord']['period'] for s in group}), 'Clock mismatch')
        require(entry['labels']['en'] and entry['labels']['zh'], 'Missing bilingual label')
        require(entry['rightsStatus'] == 'D1_SOURCE_SPECIFIC_REVIEW_REQUIRED', 'Unqualified rights claim')
    require(all(v is False for v in mapping['boundaries'].values()), 'Scientific boundary changed')
    contract = mapping['publicContract']
    require(contract['missingValue'] is None, 'Missing is not null')
    require('lastRecord' in contract['seriesFields'] and 'lastNonmissing' in contract['seriesFields'], 'Latest semantics')
    require('clocks' in contract['seriesFields'] and 'sourceHash' in contract['seriesFields'], 'Lost provenance')
    require(set(contract['historyFields']) == set(model['series'][0]['observations'][0]), 'History fields lost')
    require(contract['pathIsProposedOnly'] is True, 'D0 implemented public projection')
    for field in ('inheritedGapRegister', 'inputIdentity', 'adapterFailures'):
        require(field in contract['excludedRootFields'], 'Internal root exposure')


def scope():
    lock = load(ROOT / 'baseline-lock.json')
    require(lock['baseSHA'] == BASE, 'Scope baseline mismatch')
    for path, expected in lock['files'].items():
        require((REPO / path).is_file() and digest((REPO / path).read_bytes()) == expected,
                'Inherited/production mutation: ' + path)
    changed = subprocess.check_output(['git', 'diff', '--name-only', BASE], cwd=REPO, text=True).splitlines()
    new = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], cwd=REPO, text=True).splitlines()
    require(all(p.startswith('research/ai-infrastructure-paper-validation/phase-d0/') for p in changed + new),
            'Out-of-scope change')
    return len(lock['files'])


def audit():
    for name in REQUIRED:
        require((ROOT / name).is_file(), 'Missing required deliverable: ' + name)
    for path in ROOT.glob('*.json'):
        load(path)
    model = load(C2 / 'outputs/analysis.json')
    mapping = load(ROOT / 'c2-data-contract-mapping.json')
    validate_mapping(mapping, model)
    identity = load(C2 / 'outputs/identity.json')
    require(mapping['identity'] == identity, 'Identity mismatch')
    for name, info in identity['files'].items():
        content = (C2 / 'outputs' / name).read_bytes()
        require(digest(content) == info['sha256'] and len(content) == info['byteSize'], 'Output hash mismatch')
    require(len(model['series']) == 36 and sum(s['rawRowCount'] for s in model['series']) == 12949, 'Coverage')
    require(sum(s['missingRowCount'] for s in model['series']) == 360, 'Null preservation')
    inspection = load(ROOT / 'production-inspection.json')
    lock = load(ROOT / 'baseline-lock.json')['files']
    production = inspection['productionFiles']
    require(len(production) == 372 and len(lock) == 571, 'Inspected tree coverage')
    differences = sorted(p for p in production if p in lock and production[p] != lock[p])
    require(differences == sorted(inspection['changedSharedPaths']), 'Comparison identity')
    require(len(differences) == 15 and all(p.startswith('data/') for p in differences), 'Production/code conflict')
    require(not inspection['productionOnlyPaths'] and len(inspection['researchOnlyPaths']) == 199, 'Tree comparison')
    require(inspection['researchOnlyPaths'] == sorted(set(lock) - set(production)), 'Research path inventory')
    require(inspection['routeProposed'] not in (REPO / 'src/utils/routing.js').read_text(), 'Proposed route already exists')
    matrix = load(ROOT / 'production-compatibility-matrix.json')
    require(matrix['productionSHA'] == inspection['productionSHA'], 'Production reference mismatch')
    require(matrix['primaryIntegration'] == 'STATIC_APPROVED_ARTIFACT' and matrix['newDependencies'] == 0, 'Architecture drift')
    require(len({r['id'] for r in matrix['rows']}) == len(matrix['rows']), 'Duplicate capability ID')
    for row in matrix['rows']:
        path = row['path']
        require((REPO / path).is_file(), 'Invented integration file: ' + path)
        require(row['anchor'] in (REPO / path).read_text(), 'Invented code anchor: ' + path)
        if not path.startswith('research/'):
            require(lock[path] == production[path], 'Production interface differs from audited code')
    risks = load(ROOT / 'integration-risk-register.json')['risks']
    require(len({r['riskId'] for r in risks}) == len(risks), 'Duplicate risk')
    require(all(r['severity'] in ('HIGH', 'MEDIUM', 'LOW') and r['mitigation'] for r in risks), 'Risk completeness')
    return dict(baseSHA=BASE, productionSHA=inspection['productionSHA'], lockedFiles=scope(),
                indicators=12, series=36, records=12949, nullValues=360, productionModified=False)


if __name__ == '__main__':
    print(json.dumps(audit(), sort_keys=True))
