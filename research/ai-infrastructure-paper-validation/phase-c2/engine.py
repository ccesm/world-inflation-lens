"""Frozen twelve-indicator descriptive research. Python stdlib; no network.

Economic periods are not release dates. A current-vintage file cannot support
historical information-set backtests. Never writes to the application tree.
"""
import argparse
import calendar
import csv
import gzip
import hashlib
import io
import json
import math
import subprocess
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter
from datetime import date
from decimal import Decimal, ROUND_HALF_EVEN
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
RESEARCH = ROOT.parent
REPO = ROOT.parents[2]
BASE = 'eb2da0e23ab9840e385a09b3889baa4454fddd74'
VERSION = 'C2.1'
CORE = ('EIA_COMM_SALES', 'EIA_COMM_PRICE', 'HENRY_HUB', 'CENSUS_DC',
        'PNFIC1', 'DFII10', 'NCBDBIQ027S', 'OPHNFB', 'ULCNFB',
        'CPIAUCSL', 'PCEPILFE', 'SPF10')
STATES = ('IL', 'KS', 'KY', 'MI', 'MO', 'NE', 'NM', 'OH', 'OK', 'PA', 'UT', 'VA', 'WI')
OUTPUTS = ('analysis.json', 'observations.csv', 'analysis.md')
NS = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'


def require(condition, message):
    if not condition:
        raise ValueError(message)


def load(path):
    return json.loads(Path(path).read_text())


def encoded(obj):
    return (json.dumps(obj, ensure_ascii=False, sort_keys=True, indent=2,
                       allow_nan=False) + '\n').encode()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def number(value):
    if value is None:
        return None
    require(isinstance(value, (int, float)) and not isinstance(value, bool)
            and math.isfinite(value), 'Invalid numeric observation')
    return value


def rounded(value):
    d = Decimal(value).quantize(Decimal('0.000001'), rounding=ROUND_HALF_EVEN)
    return float(d) if d else 0.0


def percent_change(current, previous):
    if current is None or previous is None:
        return None, 'MISSING_ENDPOINT'
    if previous <= 0:
        return None, 'NONPOSITIVE_BASE'
    return rounded((Decimal(str(current)) / Decimal(str(previous)) - 1) * 100), 'AVAILABLE'


def point_change(current, previous):
    if current is None or previous is None:
        return None, 'MISSING_ENDPOINT'
    return rounded(Decimal(str(current)) - Decimal(str(previous))), 'AVAILABLE'


def shift_months(period, delta):
    d = date.fromisoformat(period)
    m = d.year * 12 + d.month - 1 + delta
    return date(m // 12, m % 12 + 1, d.day).isoformat()


def period_end(period, frequency):
    d = date.fromisoformat(period)
    if frequency == 'DAILY':
        return period
    require(d.day == 1, 'Non-native period label')
    month = d.month if frequency == 'MONTHLY' else d.month + 2
    if frequency != 'MONTHLY':
        require(d.month in (1, 4, 7, 10), 'Non-native quarter')
    return date(d.year, month, calendar.monthrange(d.year, month)[1]).isoformat()


def worksheet(data, name):
    """Independent XLSX cell reader (does not use the inherited parser)."""
    with zipfile.ZipFile(io.BytesIO(data)) as z:
        strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            for si in ET.fromstring(z.read('xl/sharedStrings.xml')):
                strings.append(''.join(t.text or '' for t in si.iter(NS + 't')))
        rels = {r.attrib['Id']: r.attrib['Target']
                for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheets = ET.fromstring(z.read('xl/workbook.xml')).find(NS + 'sheets')
        selected = [s for s in sheets if s.attrib['name'] == name]
        require(len(selected) == 1, 'Missing or ambiguous worksheet')
        target = rels[selected[0].attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
        target = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        require('..' not in Path(target).parts, 'Invalid XLSX relationship')
        rows = {}
        for _, cell in ET.iterparse(io.BytesIO(z.read(target)), events=('end',)):
            if cell.tag != NS + 'c':
                continue
            ref = cell.attrib['r']
            row = int(''.join(c for c in ref if c.isdigit()))
            col = ''.join(c for c in ref if c.isalpha())
            kind = cell.attrib.get('t', 'n')
            value = cell.find(NS + 'v')
            if kind == 'inlineStr':
                v = ''.join(t.text or '' for t in cell.iter(NS + 't'))
            elif value is None:
                v = None
            elif kind == 's':
                v = strings[int(value.text)]
            elif kind in ('str', 'e', 'b'):
                v = value.text
            else:
                v = float(value.text)
                if v.is_integer():
                    v = int(v)
            rows.setdefault(row, {})[col] = v
            cell.clear()
        return rows


def read_raw(source):
    path = source.get('fixture')
    require(path and path.startswith('fixtures/') and '..' not in Path(path).parts,
            'Missing or invalid raw fixture')
    data = gzip.decompress((RESEARCH / 'phase-c1m' / path).read_bytes())
    require(digest(data) == source['sha256'] and len(data) == source['byteSize'],
            'Raw hash mismatch')
    return data


def native_records(indicator, source):
    sid = source['sourceId']
    if sid == 'EIA_STATE':
        field = indicator['nativeField']
        return [dict(period=r['period'] + '-01', value=number(r[field]),
                     geography=r['state'], revisionFlag=r['dataStatus'],
                     locator=r['locator'])
                for r in load(RESEARCH / 'phase-c1a/inputs/state-monthly.json')
                if r['sector'] == 'COMMERCIAL']
    if sid == 'EIA_GAS':
        return [dict(period=r['period'] + '-01', value=number(r['value']),
                     geography='HENRY_HUB', revisionFlag='NOT_DISCLOSED_PER_OBSERVATION',
                     locator=r['locator'])
                for r in load(RESEARCH / 'phase-c1a/inputs/henryhub-monthly.json')]
    data = read_raw(source)
    rows = []
    if source['format'] == 'CSV':
        reader = csv.reader(io.StringIO(data.decode('utf-8-sig')))
        require(next(reader) == ['observation_date', sid], 'CSV series identity mismatch')
        for line, fields in enumerate(reader, 2):
            require(len(fields) == 2, 'CSV column mismatch')
            value = None if fields[1] in ('', '.') else number(float(fields[1]))
            rows.append(dict(period=fields[0], value=value, locator=f'CSV line {line}',
                             revisionFlag='NOT_DISCLOSED_PER_OBSERVATION', geography='US'))
    elif sid == 'CENSUS_DC':
        sheet = worksheet(data, 'Private SA')
        require(sheet[4].get('J') == 'Data center', 'Construction definition changed')
        require('seasonally adjusted annual' in str(sheet[1]).lower()
                and 'millions of dollars' in str(sheet[2]).lower(), 'Construction unit changed')
        months = dict(zip(('Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'), range(1, 13)))
        import re
        for row, cells in sheet.items():
            m = re.fullmatch(r'([A-Z][a-z]{2})-(\d{2})([pr]?)', str(cells.get('A', '')))
            if not m:
                continue
            year = int(m[2]) + (2000 if int(m[2]) < 50 else 1900)
            if year < 2014:
                continue
            rows.append(dict(period=f'{year}-{months[m[1]]:02}-01', value=number(cells.get('J')),
                             revisionFlag=m[3] or 'NO_NATIVE_FLAG', geography='US',
                             locator=f'Private SA!J{row}'))
    elif sid == 'SPF10':
        sheet = worksheet(data, 'INFLATION')
        require(sheet[1].get('E') == 'INFCPI10YR', 'Survey definition changed')
        for row, cells in sheet.items():
            if not isinstance(cells.get('A'), int):
                continue
            require(cells['B'] in (1, 2, 3, 4), 'Survey quarter changed')
            value = cells.get('E')
            value = number(value) if isinstance(value, (float, int)) else None
            rows.append(dict(period=f"{cells['A']}-{1+3*(cells['B']-1):02}-01", value=value,
                             locator=f'INFLATION!E{row}', geography='US',
                             revisionFlag='NOT_DISCLOSED_PER_OBSERVATION'))
    else:
        raise ValueError('Unsupported source format')
    return sorted(rows, key=lambda r: r['period'])


def verify_inputs(manifest):
    require(manifest['baseSHA'] == BASE, 'Wrong baseline')
    require(tuple(i['indicatorId'] for i in manifest['indicators']) == CORE, 'Twelve-indicator scope changed')
    for path, expected in manifest['files'].items():
        require('..' not in Path(path).parts and path.startswith(('phase-c1m/', 'phase-c1a/')),
                'Invalid input path')
        require(digest((RESEARCH / path).read_bytes()) == expected, 'Input version changed: ' + path)
    inherited = {i['indicatorId']: i for i in load(RESEARCH / 'phase-c1m/macro-indicator-register.json')['indicators']}
    sources = {s['sourceId']: s for s in load(RESEARCH / 'phase-c1m/official-source-qualification.json')['sources']}
    require(len({s['sourceId'] for s in manifest['sources']}) == 11, 'Source scope changed')
    for i in manifest['indicators']:
        require(i == inherited[i['indicatorId']], 'Definition or metadata changed')
    for s in manifest['sources']:
        require(s == sources[s['sourceId']], 'Source metadata changed')
        u = urlsplit(s['officialURL'])
        require(u.scheme == 'https' and not u.username and not u.password
                and u.hostname in ('fred.stlouisfed.org', 'www.eia.gov', 'www.census.gov', 'www.philadelphiafed.org'),
                'Unauthenticated producer URL')
        require(s['status'] == 'VERIFIED' and s['originalProvider'] != 'FRED', 'Unqualified producer')


def calculate(records, indicator):
    """Exact calendar comparisons; no implicit resampling or interpolation."""
    records = sorted(records, key=lambda r: r['period'])
    require(bool(records), 'Empty numeric history')
    require(len({r['period'] for r in records}) == len(records), 'Duplicate economic period')
    by_period = {r['period']: r for r in records}
    frequency = indicator['frequency']
    sid = indicator['indicatorId']
    points = sid in ('DFII10', 'SPF10')
    previous_observed = None
    out = []
    for r in records:
        number(r['value'])
        end = period_end(r['period'], frequency)
        if frequency == 'DAILY':
            yoy_period = None  # No same-day annual yield percentage or business-day substitution.
            base_period = previous_observed
        else:
            yoy_period = shift_months(r['period'], -12)
            base_period = shift_months(r['period'], -1 if frequency == 'MONTHLY' else -3)
        change = point_change if points else percent_change
        def against(key):
            if key is None or key not in by_period:
                return None, 'COMPARISON_PERIOD_ABSENT'
            return change(r['value'], by_period[key]['value'])
        native, native_status = against(base_period)
        yoy, yoy_status = against(yoy_period) if yoy_period else (None, 'NOT_DEFINED_FOR_DAILY_YIELD')
        delta_days = (date.fromisoformat(r['period']) - date.fromisoformat(base_period)).days if base_period else None
        out.append(dict(r, periodEnd=end, nativeChange=native, nativeChangeStatus=native_status,
                        nativeBasePeriod=base_period, nativeIntervalDays=delta_days,
                        yearChange=yoy, yearChangeStatus=yoy_status, yearBasePeriod=yoy_period))
        if r['value'] is not None:
            previous_observed = r['period']
    return out


def source_clock(source):
    sid = source['sourceId']
    if sid in ('EIA_STATE', 'EIA_GAS'):
        old_id = {'EIA_STATE': 'eia861m-state', 'EIA_GAS': 'henryhub'}[sid]
        recs = load(RESEARCH / 'phase-c1a/retrieval-receipts.json')['sources']
        receipt = next(r for r in recs if r['sourceId'] == old_id)
    else:
        receipt = next(r for r in load(RESEARCH / 'phase-c1m/retrieval-receipts.json') if r['sourceId'] == sid)
    require(receipt['sha256'] == source['sha256'], 'Receipt hash mismatch')
    # Unknown per-observation first publication times remain null, never estimated.
    return dict(retrievedAt=receipt['retrievedAt'], metadataQualifiedAsOf='2026-10-09',
                firstPublicationDates=None, firstReleaseVintageAvailable=False)


def build(as_of='2026-10-09'):
    manifest = load(ROOT / 'input-manifest.json')
    require(as_of == manifest['allowedAsOf'], 'Frozen vintage: retrospective or new as-of not qualified')
    verify_inputs(manifest)
    sources = {s['sourceId']: s for s in manifest['sources']}
    series, errors = [], []
    for indicator in manifest['indicators']:
        sid = indicator['indicatorId']
        source = sources[indicator['sourceId']]
        try:
            indicator_series = []
            records = native_records(indicator, source)
            require(all(r['period'] <= as_of for r in records), 'Future observation label')
            groups = sorted({r['geography'] for r in records})
            require(groups == list(STATES) if source['sourceId'] == 'EIA_STATE' else len(groups) == 1,
                    'Unexpected geographic scope')
            for geography in groups:
                rows = calculate([r for r in records if r['geography'] == geography], indicator)
                require(all(r['periodEnd'] <= as_of for r in rows), 'Incomplete economic period')
                valid = [r for r in rows if r['value'] is not None]
                require(bool(valid), 'No nonmissing numeric history')
                current = rows[-1]
                common = [r for r in rows if r['period'] >= manifest['commonWindowStart']]
                latest_available = indicator['latestAvailableObservationDate']
                indicator_series.append(dict(seriesId=f'{sid}:{geography}', indicatorId=sid, geography=geography,
                    name=indicator['name'], channel=indicator['channel'], frequency=indicator['frequency'],
                    unit=indicator['unit'], seasonalAdjustment=indicator['seasonalAdjustment'],
                    nominalOrReal=indicator['nominalOrReal'], measureType=indicator['measureType'],
                    definition=indicator['definition'], attribution=indicator['attribution'],
                    sourceId=source['sourceId'], sourceHash=source['sha256'], officialURL=source['officialURL'],
                    originalProvider=source['originalProvider'], clocks=source_clock(source),
                    revisionPolicy=indicator['revisionPolicy'], publicationSchedule=indicator['publicationSchedule'],
                    limitations=indicator['limitations'], confounders=indicator['confounders'],
                    evidence=dict(nativeObservations='E1', descriptiveChanges='E2_ARITHMETIC_ONLY',
                                  statisticalAssociation='NOT_ESTIMATED', causalIdentification='NONE',
                                  aiSpecificValue=None),
                    calculationUnit='PERCENTAGE_POINTS' if sid in ('DFII10', 'SPF10') else 'PERCENT_CHANGE',
                    nativeChangeBasis='PREVIOUS_NONMISSING_PUBLISHED_DAY_WITH_EXPLICIT_INTERVAL' if sid == 'DFII10' else 'EXACT_PREVIOUS_NATIVE_PERIOD',
                    sourceStatus='VERIFIED_FROZEN_INPUT', liveAccessStatus='NOT_TESTED_IN_C2',
                    freshnessStatus='CAPTURE_BEHIND_KNOWN_AVAILABLE' if latest_available > current['period'] else 'MATCHES_C1M_KNOWN_AVAILABLE_NOT_LIVE_CHECKED',
                    latestAvailableAtSourceReview=latest_available, lastRecord=current,
                    lastNonmissing=valid[-1], rawRowCount=len(rows), missingRowCount=len(rows)-len(valid),
                    commonWindow=dict(start=manifest['commonWindowStart'], actualStart=common[0]['period'] if common else None,
                                      end=common[-1]['period'] if common else None, rows=len(common),
                                      missing=sum(r['value'] is None for r in common)),
                    revisionFlags=dict(sorted(Counter(r['revisionFlag'] for r in rows).items())),
                    observations=rows))
            series.extend(indicator_series)
        except (ValueError, OSError, KeyError, StopIteration, zipfile.BadZipFile) as exc:
            errors.append(dict(indicatorId=sid, status='REVIEW_REQUIRED', reason=str(exc),
                               lastValidAction='PRESERVE_FROZEN_PREVIOUS_ARTIFACT; DO_NOT_REPLACE'))
    rules = dict(schemaVersion=VERSION, scope=list(CORE), commonWindowStart='2015-01-01',
                 asOf=as_of, rounding='DECIMAL_HALF_EVEN_6_PLACES; native values unchanged',
                 interpolation=False, annualization=False, crossSeriesAggregation=False,
                 associationEstimation=False, aiAttribution=False, forecasts=False,
                 stockChangeIsIssuance=False, realTimeBacktest=False)
    # Implementation and controlled input bytes, never filesystem paths or wall clock.
    identity = dict(inputManifestHash=digest((ROOT / 'input-manifest.json').read_bytes()),
                    implementationHash=digest(Path(__file__).read_bytes()), rules=rules)
    return dict(schemaVersion=VERSION, baseSHA=BASE, sourceAsOf=as_of,
                vintageBasis=manifest['vintageBasis'], inputIdentity=identity,
                inputIdentityHash=digest(encoded(identity)), status='COMPLETE' if not errors else 'PARTIAL',
                series=series, adapterFailures=errors,
                inheritedGapRegister='../phase-c1m/gap-preservation.json',
                statisticalCorrelations='NOT_ESTIMATED',
                economicHypotheses='E0; inherited conditional mechanisms, no tested AI effect')


CSV_FIELDS = ('seriesId', 'indicatorId', 'geography', 'frequency', 'unit', 'seasonalAdjustment',
              'nominalOrReal', 'period', 'periodEnd', 'value', 'revisionFlag', 'nativeChange',
              'nativeChangeStatus', 'nativeBasePeriod', 'nativeIntervalDays', 'yearChange',
              'yearChangeStatus', 'yearBasePeriod', 'calculationUnit', 'sourceId', 'sourceHash', 'locator')


def render_csv(model):
    stream = io.StringIO(newline='')
    writer = csv.DictWriter(stream, fieldnames=CSV_FIELDS, lineterminator='\n')
    writer.writeheader()
    for s in model['series']:
        for r in s['observations']:
            row = {k: (r[k] if k in r else s[k]) for k in CSV_FIELDS}
            writer.writerow({k: 'null' if v is None else v for k, v in row.items()})
    return stream.getvalue().encode()


def fmt(value):
    return 'UNAVAILABLE' if value is None else str(value)


def render_markdown(model):
    lines = ['# Phase C2 — frozen descriptive results', '',
             f"Source review as of **{model['sourceAsOf']}**. Current captured vintage; no first-release backtest.", '',
             '## Observed facts (E1) and within-series arithmetic (E2)', '',
             'All rows below use native units. Changes are descriptive arithmetic, not statistical association or AI causality. No series is pooled with another.', '',
             '| Indicator / geography | Last record | Level | Native unit | YoY change | Change unit | Native change | Revision flag | Freshness |',
             '|---|---|---:|---|---:|---|---:|---|---|']
    for s in model['series']:
        r = s['lastRecord']
        lines.append(f"| {s['seriesId']} | {r['period']} | {fmt(r['value'])} | {s['unit']} | {fmt(r['yearChange'])} | {s['calculationUnit']} | {fmt(r['nativeChange'])} | {r['revisionFlag']} | {s['freshnessStatus']} |")
    lines += ['', '## Independent indicator definitions and limitations', '']
    for sid in CORE:
        group = [s for s in model['series'] if s['indicatorId'] == sid]
        if not group:
            lines += [f'### {sid}', '', 'REVIEW_REQUIRED — adapter failed; previous artifact retained.', '']
            continue
        s = group[0]
        lines += [f"### {sid} — {s['name']}", '', s['definition'], '',
                  f"Adjustment: {s['seasonalAdjustment']}; classification: {s['nominalOrReal']}. Source: [{s['originalProvider']}]({s['officialURL']}).", '',
                  s['limitations'], '', 'Competing explanations: ' + '; '.join(s['confounders']) + '.', '',
                  f"Native histories retained: {sum(x['rawRowCount'] for x in group)} rows, {sum(x['missingRowCount'] for x in group)} missing cells. Proposed 2015+ context retained separately; earlier missing cells are not erased.", '']
    lines += ['## Statistical correlations', '',
              '**NOT ESTIMATED.** No pooling, lag search, common-frequency interpolation or correlation coefficient was fitted. E2 here means reproducible within-series arithmetic only; it is not an empirical transmission result.', '',
              '## Economic hypotheses (E0)', '',
              'Energy bottlenecks may raise input costs; supply expansion and efficiency may offset them. Capital demand may tighten financing conditions; internal cash, global saving and policy may offset it. Productivity may reduce unit costs; wages, margins and demand affect pass-through. Monetary policy and broader shocks may dominate aggregate inflation. None of these mechanisms is established by this snapshot.', '',
              '## Missingness, clocks and non-additivity', '',
              'CPI October 2025 stays null. Daily yield gaps and early debt/survey gaps stay null. A missing endpoint produces an unavailable comparison; no filling. CSV uses literal `null`, never zero or an empty numeric cell.', '',
              'Yield changes and survey expectation changes use percentage points. Monthly/quarterly level changes use exact-calendar percentage changes, without annualization. The daily yield change uses the previous nonmissing published day and records its calendar interval; it is not a constant one-day return.', '',
              'The 13-state commercial sample is not US electricity demand or AI consumption. Realized prices are not tariffs. Construction SAAR is a pace, not yearly spending or all-in AI CapEx. Corporate securities are a stock, not issuance or all debt. CPI/core PCE are distinct price baskets; SPF is a survey expectation.', '',
              'Known publication schedules are qualitative; unknown first publication dates remain null. As-of is restricted to this qualified frozen review date; earlier retrospective or later live snapshots require new qualified vintage inputs.', '',
              f"Input identity: `{model['inputIdentityHash']}`. Status: **{model['status']}**. No production files, schedules, email, APIs, forecast or AI ROI.", '']
    return '\n'.join(lines).encode()


def products(model):
    # Compact deterministic JSON; observations carry locators, series carry source identity/clocks.
    js = (json.dumps(model, ensure_ascii=False, sort_keys=True, separators=(',', ':'), allow_nan=False) + '\n').encode()
    return dict(zip(OUTPUTS, (js, render_csv(model), render_markdown(model))))


def identity(outputs, model):
    files = {k: dict(sha256=digest(v), byteSize=len(v)) for k, v in outputs.items()}
    return dict(schemaVersion=VERSION, inputIdentityHash=model['inputIdentityHash'], files=files,
                outputSetHash=digest(encoded(files)), indicatorCount=len(CORE),
                seriesCount=len(model['series']), observationCount=sum(s['rawRowCount'] for s in model['series']))


def scope():
    lock = load(ROOT / 'baseline-lock.json')
    require(lock['baseSHA'] == BASE, 'Wrong scope baseline')
    for path, expected in lock['files'].items():
        p = REPO / path
        require(p.is_file() and digest(p.read_bytes()) == expected, 'Inherited or production mutation: ' + path)
    tracked = subprocess.check_output(['git', 'diff', '--name-only', BASE], cwd=REPO, text=True).splitlines()
    new = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard'], cwd=REPO, text=True).splitlines()
    prefix = 'research/ai-infrastructure-paper-validation/phase-c2/'
    require(all(p.startswith(prefix) for p in tracked + new), 'Out of scope modification')
    return dict(lockedFiles=len(lock['files']), productionModified=False, inheritedModified=False)


def write_products(outputs, model, destination):
    require(model['status'] == 'COMPLETE', 'Partial build must not replace last-valid outputs')
    require(destination.resolve() == (ROOT / 'outputs').resolve(), 'Research-only output path required')
    destination.mkdir(exist_ok=True)
    for name, data in outputs.items():
        (destination / name).write_bytes(data)
    (destination / 'identity.json').write_bytes(encoded(identity(outputs, model)))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--as-of', required=True)
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--identity', action='store_true')
    args = parser.parse_args()
    scope()
    model = build(args.as_of)
    outputs = products(model)
    if args.write:
        write_products(outputs, model, ROOT / 'outputs')
    elif not args.identity:
        for name, data in outputs.items():
            require((ROOT / 'outputs' / name).read_bytes() == data, 'Output reproduction mismatch: ' + name)
        require(load(ROOT / 'outputs/identity.json') == identity(outputs, model), 'Output identity mismatch')
    print(json.dumps(identity(outputs, model), sort_keys=True))


if __name__ == '__main__':
    main()
