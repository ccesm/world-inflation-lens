"""Phase 3.5 additive, frozen-rule research. Never writes Phase 1–3 artifacts."""
import argparse
import gzip
import json
from collections import Counter, defaultdict
from pathlib import Path

import analysis
import intake
import pipeline
from outcome_common import ROOT, SPEC_SHA, GUARDRAIL, canonical, read, require, save, sha256

EXPANDED_SHA = 'd40e6468ccc27fbc7c0f262acd1954e1eb5e18b28590af184411da71e76f9e8c'
VERSION = 'occupational-coverage-expansion-v1'
LOSSES = ['A_EXPOSURE_UNAVAILABLE', 'B_EXPOSURE_MAPPING_AMBIGUOUS',
          'C_CPS_SOC_MAPPING_UNAVAILABLE', 'D_TEMPORAL_MAPPING_AMBIGUOUS',
          'E_INSUFFICIENT_SAMPLE', 'G_STRICT_ELIGIBLE']


def frozen_spec(root=ROOT):
    raw = (Path(root) / 'expanded-preanalysis-spec.json').read_bytes()
    require(sha256(raw) == EXPANDED_SHA, 'Expanded specification changed after freeze')
    require((Path(root) / 'expanded-preanalysis-spec.sha256').read_text().strip() == EXPANDED_SHA,
            'Expanded specification marker mismatch')
    value = json.loads(raw)
    require(value['strictSpecificationSha256'] == SPEC_SHA, 'Strict specification identity changed')
    return value


def resolve_soc(expression, records):
    """Only exact official hierarchy relations, never prefix/wildcard inference."""
    nodes = {r['socCode']: r for r in records}
    if expression not in nodes:
        return []
    require(all(r['socVersion'] == '2018' for r in records), 'SOC taxonomy mismatch')
    children = defaultdict(list)
    for r in records:
        children[r['parentCode']].append(r['socCode'])
    def descend(code, path):
        require(code not in path, 'SOC hierarchy cycle')
        if nodes[code]['hierarchyLevel'] == 'detailed':
            return [code]
        return [d for c in sorted(children[code]) for d in descend(c, path | {code})]
    return sorted(descend(expression, set()))


def harmonized_cells(cw, records):
    """Close whole temporal components AND shared SOC membership; no duplicated workers."""
    parent = {}
    def find(x):
        parent.setdefault(x, x)
        if parent[x] != x:
            parent[x] = find(parent[x])
        return parent[x]
    def union(a, b):
        a, b = find(a), find(b)
        if a != b:
            parent[max(a, b)] = min(a, b)
    edges, seen = [], set()
    for e in cw['temporalEdges']:
        require(e['sourceVersion'] == 'Census 2010' and e['targetVersion'] == 'Census 2018',
                'Temporal taxonomy mismatch')
        key = (e['sourceCode'], e['targetCode'])
        require(key not in seen, 'Duplicate temporal mapping')
        seen.add(key)
        union(('old', key[0]), ('new', key[1]))
        edges.append(e)
    membership = {}
    for code, r in sorted(cw['currentCodes'].items()):
        find(('new', code))
        membership[code] = resolve_soc(r['socExpression'], records)
        for soc in membership[code]:
            union(('new', code), ('soc', soc))
    components = defaultdict(list)
    for node in sorted(parent):
        components[find(node)].append(node)
    result = []
    for nodes in components.values():
        old = sorted(c for kind, c in nodes if kind == 'old')
        new = sorted(c for kind, c in nodes if kind == 'new')
        soc = sorted(c for kind, c in nodes if kind == 'soc')
        ce = sorted((e for e in edges if e['sourceCode'] in old),
                    key=lambda e: (e['sourceCode'], e['targetCode']))
        missing = [c for c in new if not membership.get(c)]
        closed = bool(old and new and soc) and not missing and all(
            any(e['targetCode'] == c for e in ce) for c in new)
        multiplicity = ('1' if len(old) == 1 else 'many') + '-to-' + ('1' if len(new) == 1 else 'many')
        bridge = cw['stableBridge'].get(old[0], {}) if len(old) == 1 else {}
        strict = (len(new) == len(soc) == 1 and bridge.get('census2018') == new[0]
                  and bridge.get('socCode') == soc[0])
        identity = {'census2010': old, 'census2018': new, 'soc2018': soc}
        cell_id = soc[0] if strict else 'HC-' + sha256(canonical(identity))[:20]
        status = 'EXACT_MATCH' if strict else 'HARMONIZED_CELL' if closed and multiplicity != 'many-to-many' else 'TEMPORAL_MAPPING_AMBIGUOUS'
        result.append({'cellId': cell_id, **identity, 'mappingType': multiplicity,
                       'status': status, 'closed': closed, 'unresolvedCurrentCodes': missing,
                       'sourceVersions': ['Census 2010', 'Census 2018', 'SOC 2018'],
                       'currentSocExpressions': {c: cw['currentCodes'].get(c, {}).get('socExpression') for c in new},
                       'mappingEdges': ce,
                       'rationale': 'Full official aggregation; never individual detailed SOC outcomes' if closed else 'Incomplete/unresolved component; excluded',
                       'continuousExposureScore': None})
    # No current-code or SOC may belong to two cells, including rejected components.
    for key in ['census2010', 'census2018', 'soc2018']:
        values = [v for c in result for v in c[key]]
        require(len(values) == len(set(values)), 'Overlapping harmonized cells')
    return sorted(result, key=lambda c: c['cellId'])


def source_assignments(exposures, crosswalk, details, spec, consensus=False):
    direct = defaultdict(set)
    seen = set()
    for e in crosswalk['direct']:
        require(e['sourceVersion'] == 'O*NET-SOC 2019' and e['targetVersion'] == 'SOC 2018',
                'O*NET taxonomy mismatch')
        key = (e['sourceCode'], e['targetCode'])
        require(key not in seen and e['targetCode'] in details, 'Duplicate/unknown O*NET mapping')
        seen.add(key)
        direct[e['targetCode']].add(e['sourceCode'])
    result = {}
    for source in ['academic', 'microsoft']:
        config = spec['exposureInputs'][source]
        ranks = config['nativeQuantiles']['ranks']
        native_key = 'O*NET-SOC Code' if source == 'academic' else 'SOC Code'
        native = {}
        for r in exposures.get(source, {}).get('records', []):
            code = r[native_key]
            require(code not in native and code in ranks, 'Duplicate/unknown native exposure')
            native[code] = {'nativeCode': code, 'value': r[config['measure']],
                            'quintile': ranks[code]['quintile'], 'percentile': ranks[code]['percentile']}
        assignments = {}
        for soc in sorted(details):
            children = sorted(direct[soc]) if source == 'academic' else [soc]
            evidence = [native[c] for c in children if c in native]
            complete = bool(children) and len(evidence) == len(children)
            qs = sorted({r['quintile'] for r in evidence})
            status = 'UNAVAILABLE' if not evidence else 'EXPOSURE_AMBIGUOUS'
            if complete and len(children) == 1:
                status = 'EXACT_SCALAR_ASSIGNMENT'
            elif complete and consensus and len(qs) == 1:
                status = 'CONSENSUS_CHILD_ASSIGNMENT'
            good = status in ['EXACT_SCALAR_ASSIGNMENT', 'CONSENSUS_CHILD_ASSIGNMENT']
            assignments[soc] = {'status': status, 'quintile': qs[0] if good else None,
                                'value': evidence[0]['value'] if status == 'EXACT_SCALAR_ASSIGNMENT' else None,
                                'nativeChildren': children, 'missingNativeChildren': [c for c in children if c not in native],
                                'quintileRange': [min(qs), max(qs)] if qs else None,
                                'evidence': evidence}
        result[source] = assignments
    return result


def cell_assignment(cell, assignments):
    members = cell['soc2018']
    evidence = {c: assignments.get(c, {'status': 'UNAVAILABLE', 'quintile': None}) for c in members}
    qs = sorted({e['quintile'] for e in evidence.values() if e['quintile'] is not None})
    good = bool(members) and all(e['quintile'] is not None for e in evidence.values()) and len(qs) == 1
    return {'status': 'HARMONIZED_CELL' if good and cell['status'] != 'EXACT_MATCH' else
            'CONSENSUS_CHILD_ASSIGNMENT' if good and any(e['status'] == 'CONSENSUS_CHILD_ASSIGNMENT' for e in evidence.values()) else
            'EXACT_MATCH' if good else 'UNAVAILABLE' if not qs else 'EXPOSURE_AMBIGUOUS',
            'quintile': qs[0] if good else None, 'continuousScore': None,
            'usesChildConsensus': any(e['status'] == 'CONSENSUS_CHILD_ASSIGNMENT' for e in evidence.values()),
            'memberEvidence': evidence, 'quintileRange': [min(qs), max(qs)] if qs else None}


def native_maps(cells):
    maps = {'Census 2010': {}, 'Census 2018': {}}
    for c in cells:
        for version, field in [('Census 2010', 'census2010'), ('Census 2018', 'census2018')]:
            for code in c[field]:
                require(code not in maps[version], 'Duplicate native cell assignment')
                maps[version][code] = c['cellId']
    return maps


def annual_statistics(monthly, cells, spec):
    maps = native_maps(cells)
    years = defaultdict(list)
    periods = set()
    for m in monthly:
        require(m['period'] not in periods, 'Duplicate CPS month')
        require(m['taxonomy'] in maps, 'CPS taxonomy mismatch')
        require(m['taxonomy'] == ('Census 2010' if int(m['period'][:4]) < 2020 else 'Census 2018'),
                'CPS period/taxonomy mismatch')
        periods.add(m['period'])
        years[int(m['period'][:4])].append(m)
    stats, availability, denominators = {}, {}, {}
    for year, months in sorted(years.items()):
        ms = sorted(int(m['period'][-2:]) for m in months)
        require(all(1 <= m <= 12 for m in ms), 'Invalid CPS calendar month')
        full = ms == list(range(1, 13))
        availability[year] = {'months': ms, 'fullYear': full}
        denominators[year] = sum(m['totalEmployed']['weightInt'] for m in months)
        grouped, represented = defaultdict(list), defaultdict(set)
        for m in months:
            for code, value in m['occupations'].items():
                cid = maps[m['taxonomy']].get(code)
                if cid:
                    grouped[cid].append(value)
                    represented[cid].add(m['period'])
        stats[year] = {}
        for cid, values in sorted(grouped.items()):
            total = analysis.combine(values)
            estimate = analysis.estimate(total, len(months), spec, full=full)
            eligible = len(represented[cid]) >= spec['minimumSamples']['occupationMonthsRepresented'] and estimate['employment'] is not None
            stats[year][cid] = {'cell': total, 'estimate': estimate, 'eligible': eligible,
                                'monthsRepresented': len(represented[cid])}
    return stats, availability, denominators


def balanced_members(cells, assignments, stats, availability):
    complete = [y for y, a in availability.items() if a['fullYear'] and y <= 2025]
    require(complete, 'No complete CPS years')
    return sorted(c['cellId'] for c in cells if c['status'] != 'TEMPORAL_MAPPING_AMBIGUOUS'
                  and assignments[c['cellId']]['quintile'] is not None
                  and all(stats[y].get(c['cellId'], {}).get('eligible', False) for y in complete))


def panel(monthly, cells, members, assignments, stats, availability, denominators, spec):
    lookup = {c['cellId']: c for c in cells}
    rows, coverage = [], []
    for year, a in sorted(availability.items()):
        # Match Phase 3: occupation thresholds select the balanced complete-year
        # panel, not a second partial-year filter on already selected members.
        eligible = [c for c in members if stats[year].get(c, {}).get('monthsRepresented', 0)
                    >= spec['minimumSamples']['occupationMonthsRepresented']]
        included = sum(stats[year][c]['cell']['weightInt'] for c in eligible)
        socs = sorted({s for cid in members for s in lookup[cid]['soc2018']})
        coverage.append({'year': year, 'referenceType': 'ANNUAL_12_MONTH' if a['fullYear'] else 'PARTIAL_YEAR',
                         'analyticalCellCount': len(members), 'mappedDetailedSocCount': len(socs),
                         'mappedDetailedSocCountCoverage': len(socs) / 867,
                         'singleSocMemberCellCount': sum(len(lookup[c]['soc2018']) == 1 for c in members),
                         'employmentWeightedCoverage': included / denominators[year],
                         'includedWeightInt': included, 'denominatorWeightInt': denominators[year],
                         'missingEmploymentShare': 1 - included / denominators[year],
                         'occupationCountBoundary': 'Mapped SOC members, not separately observed detailed SOC outcomes'})
        for q in range(1, 6):
            selected = [c for c in eligible if assignments[c]['quintile'] == q]
            row = {'year': year, 'quintile': q, 'referenceMonths': a['months'], 'memberCellIds': selected,
                   **analysis.estimate(analysis.combine(stats[year][c]['cell'] for c in selected), len(a['months']), spec, group=True, full=a['fullYear'])}
            row['employmentShareOfAllEmployed'] = row['employment'] / (denominators[year] / 10000 / len(a['months'])) if row['employment'] is not None else None
            rows.append(row)
    for q in range(1, 6):
        qr = [r for r in rows if r['quintile'] == q]
        bases = {r['year']: r['employment'] for r in qr}
        for r in qr:
            r['employmentIndices'] = {str(b): 100 * r['employment'] / bases[b] if
                                      r['referenceType'] == 'ANNUAL_12_MONTH' and r['employment'] is not None and bases.get(b) else None
                                      for b in spec['comparisons']['employmentIndexBases']}
    trends = {str(q): analysis.period_comparison([r for r in rows if r['quintile'] == q], spec) for q in range(1, 6)}
    # Match the original available months, and recalculate from sufficient statistics.
    maps = native_maps(cells)
    partial = []
    for year, a in sorted(availability.items()):
        if a['fullYear'] or year < 2023:
            continue
        pairs = []
        for target in [2022, year]:
            ms = [m for m in monthly if int(m['period'][:4]) == target and int(m['period'][-2:]) in a['months']]
            if len(ms) != len(a['months']):
                continue
            groups = {str(q): analysis.estimate(analysis.combine(v for m in ms for code, v in m['occupations'].items()
                       if maps[m['taxonomy']].get(code) in members and
                       assignments[maps[m['taxonomy']][code]]['quintile'] == q), len(ms), spec, group=True, full=False) for q in range(1, 6)}
            pairs.append({'year': target, 'months': a['months'], 'groups': groups})
        if len(pairs) == 2:
            partial.append({'targetYear': year, 'comparisonYear': 2022, 'months': a['months'],
                            'referenceType': 'IDENTICAL_CALENDAR_MONTHS', 'estimates': pairs,
                            'employmentChangesPct': {str(q): analysis.change(pairs[1]['groups'][str(q)]['employment'], pairs[0]['groups'][str(q)]['employment']) for q in range(1, 6)},
                            'annualExtrapolation': False, 'limitations': '2025 missing October / weighting changes; 2026 population controls'})
    return {'memberCellIds': members, 'coverage': coverage, 'outcomes': rows, 'pretrends': trends,
            'matchedPartialYears': partial, 'brief': brief(trends)}


def brief(trends):
    low, high = trends['1'], trends['5']
    pre = (high['pretrend']['annualGrowthPct'] - low['pretrend']['annualGrowthPct']) if high['pretrend'] and low['pretrend'] else None
    hp, lp = high['post2022'], low['post2022']
    post = hp['employmentChangePct'] - lp['employmentChangePct'] if hp and lp and hp['employmentChangePct'] is not None and lp['employmentChangePct'] is not None else None
    return {'q5MinusQ1PretrendGapPpPerYear': pre, 'q5MinusQ1Post2022EmploymentChangeGapPp': post}


def comparison_labels(strict, expanded, coverage, spec, common=None):
    prekey, postkey = 'q5MinusQ1PretrendGapPpPerYear', 'q5MinusQ1Post2022EmploymentChangeGapPp'
    pre, post, sp, ss = expanded[prekey], expanded[postkey], strict[prekey], strict[postkey]
    labels = []
    if None in [pre, post, sp, ss] or coverage < spec['materialityPresentationOnly']['minimumEmploymentCoverageForBroadDescription']:
        labels.append('INSUFFICIENT_EXPANDED_COVERAGE')
    if None not in [pre, post, sp, ss]:
        if abs(post - ss) >= spec['materialityPresentationOnly']['employmentCumulativeGapPp']:
            labels.append('MAGNITUDE_SENSITIVE')
        threshold = spec['pretrend']['strongGapPpPerYear']
        if abs(pre - sp) >= threshold or (abs(pre) >= threshold) != (abs(sp) >= threshold):
            labels.append('PRETREND_SENSITIVE')
        cp = common.get(postkey) if common else None
        if ((post > 0) - (post < 0)) != ((ss > 0) - (ss < 0)) or (cp is not None and abs(post - cp) >= spec['materialityPresentationOnly']['robustnessGapDifferencePp']):
            labels.append('SAMPLE_SENSITIVE')
        if not any(x.endswith('_SENSITIVE') for x in labels):
            labels.append('DIRECTIONALLY_CONSISTENT')
    return labels


def major_group(cell):
    majors = sorted({s[:2] + '-0000' for s in cell['soc2018']})
    return majors[0] if len(majors) == 1 else 'CROSS_MAJOR_OR_UNRESOLVED'


def major_coverage(cells, members, stats2024, monthly, details, denominator):
    """Count coverage and identified-major denominators; never invent unmapped weight."""
    lookup = {c['cellId']: c for c in cells}
    mapping = native_maps(cells)['Census 2018']
    native_weight, included_weight = defaultdict(int), defaultdict(int)
    for m in monthly:
        if m['period'].startswith('2024-'):
            for code, value in m['occupations'].items():
                cell = lookup.get(mapping.get(code))
                native_weight[major_group(cell) if cell else 'CROSS_MAJOR_OR_UNRESOLVED'] += value['weightInt']
    represented = {soc for cid in members for soc in lookup[cid]['soc2018']}
    for cid in members:
        included_weight[major_group(lookup[cid])] += stats2024[cid]['cell']['weightInt']
    groups = sorted({soc[:2] + '-0000' for soc in details})
    return {'groups': {g: {
                'detailedSocUniverseCount': sum(s[:2] + '-0000' == g for s in details),
                'mappedDetailedSocMemberCount': sum(s[:2] + '-0000' == g for s in represented),
                'mappedDetailedSocCountCoverage': sum(s[:2] + '-0000' == g for s in represented) /
                                                  sum(s[:2] + '-0000' == g for s in details),
                'includedEmploymentWeightInt': included_weight[g],
                'includedEmploymentShareOfAllEmployed': included_weight[g] / denominator,
                'identifiedNativeMajorWeightInt': native_weight[g],
                'employmentCoverageWithinIdentifiedNativeMajor': included_weight[g] / native_weight[g] if native_weight[g] else None,
                'employmentCoverageOfEntireMajor': None,
                'denominatorBoundary': 'Conditional on Census codes whose complete SOC membership identifies one major; unresolved codes are not allocated to major groups'
            } for g in groups},
            'unallocatedMajorWeightInt': native_weight['CROSS_MAJOR_OR_UNRESOLVED'],
            'unallocatedMajorEmploymentShare': native_weight['CROSS_MAJOR_OR_UNRESOLVED'] / denominator}


def waterfall(details, cw, strict_exp, all_assignments, strict_members, expanded_members, cells, stats, monthly, spec):
    """SOC counts and native survey-weight decomposition are NOT interchangeable."""
    exact_current = {s for r in cw['currentCodes'].values() for s in r['targets']}
    stable = set(analysis.mappings(cw)['Census 2018'].values())
    cell_by_soc = {s: c for c in cells for s in c['soc2018']}
    maps = native_maps(cells)
    weights = defaultdict(int)
    for m in monthly:
        if m['period'].startswith('2024-'):
            for code, v in m['occupations'].items():
                weights[code] += v['weightInt']
    denom = sum(weights.values())
    result = {}
    for source in ['academic', 'microsoft']:
        records = []
        for soc in sorted(details):
            e = all_assignments[source][soc]
            reason = LOSSES[0] if not e['evidence'] else LOSSES[1] if soc not in strict_exp[source] else LOSSES[2] if soc not in exact_current else LOSSES[3] if soc not in stable else LOSSES[4] if soc not in strict_members[source] else LOSSES[5]
            cell = cell_by_soc.get(soc)
            metric = stats[2024].get(cell['cellId'], {}).get('estimate') if cell else None
            recovered = bool(cell and cell['cellId'] in expanded_members[source] and soc not in strict_members[source])
            # Weight is identifiable at individual detailed-SOC level only in a one-member cell.
            weight = sum(weights[c] for c in cell['census2018']) if cell and len(cell['soc2018']) == 1 else None
            records.append({'socCode': soc, 'majorSocGroup': soc[:2] + '-0000', 'primaryLossReason': reason,
                            'potentialExpandedEligible': recovered,
                            'F_metricOnlySuppression': bool(reason == 'G_STRICT_ELIGIBLE' and metric and metric['employment'] is not None and (metric['usualPrimaryJobHours'] is None or metric['nominalWeeklyEarningsMedian'] is None)),
                            'identified2024WeightInt': weight, 'identified2024EmploymentShare': weight / denom if weight is not None else None,
                            'weightIdentification': 'EXACT_CELL' if weight is not None else 'NOT_IDENTIFIED_AT_DETAILED_SOC',
                            'cellId': cell['cellId'] if cell else None})
        reason_by_soc = {r['socCode']: r['primaryLossReason'] for r in records}
        cell_lookup = {c['cellId']: c for c in cells}
        buckets = defaultdict(int)
        for code, weight in sorted(weights.items()):
            cid = maps['Census 2018'].get(code)
            members = cell_lookup[cid]['soc2018'] if cid else []
            reasons = {reason_by_soc[s] for s in members}
            category = next(iter(reasons)) if len(reasons) == 1 else 'UNALLOCATED_MIXED_OR_UNRESOLVED_SOC_REASON'
            buckets[category] += weight
        require(sum(buckets.values()) == denom, 'Waterfall weight double counting')
        counts = Counter(r['primaryLossReason'] for r in records)
        result[source] = {'detailedSocUniverse': len(details), 'records': records,
                          'exclusiveCounts': {k: counts[k] for k in LOSSES},
                          'H_potentialExpandedCount': sum(r['potentialExpandedEligible'] for r in records),
                          'F_metricOnlySuppressionCount': sum(r['F_metricOnlySuppression'] for r in records),
                          'majorSocGroups': {g: dict(Counter(r['primaryLossReason'] for r in records if r['majorSocGroup'] == g)) for g in sorted({r['majorSocGroup'] for r in records})},
                          'nativeCensusWeightPartition': {k: {'weightInt': v, 'employmentShare': v / denom} for k, v in sorted(buckets.items())},
                          'denominatorWeightInt': denom,
                          'boundary': '867 SOC counts are exclusive. H recovery/F metric suppression annotate, never add counts. Exact per-SOC weights are not identifiable in multi-SOC Census cells; no invented allocation.'}
    return result


def build(root=ROOT):
    root = Path(root)
    expanded_spec = frozen_spec(root)
    # Fail before any expanded calculation if original accepted artifacts change.
    strict_validation = pipeline.validate(root)
    spec, manifest = pipeline.configuration(root)
    exposures, required, _, health, identities = pipeline.normalized_exposures(root, spec)
    monthly = pipeline.selected_monthly(root, manifest)
    records = required['occupations.json']['records']
    details = {r['socCode'] for r in records if r['hierarchyLevel'] == 'detailed'}
    strict_groups = read(root / 'exposure-group-outcomes.json')['data']
    strict_trends = read(root / 'pretrend-analysis.json')['data']['sourceSpecificResults']
    strict_common = read(root / 'cross-source-robustness.json')['data']
    cr = next(r for r in manifest['files'] if r['kind'] == 'concordance')
    raw = gzip.decompress((root / 'sources/raw' / (cr['sha256'] + '.gz')).read_bytes())
    require(sha256(raw) == cr['sha256'], 'Official concordance changed')
    cw = intake.concordance(raw, details)
    strict_exp = analysis.exposure_maps(exposures, required['occupation-crosswalk.json'], details, spec)
    cells = harmonized_cells(cw, records)
    stats, availability, denominators = annual_statistics(monthly, cells, spec)
    strict_members = {k: strict_groups['sample'][k]['balancedPrimarySocCodes'] for k in ['academic', 'microsoft']}
    for source, members in strict_members.items():
        require(len(members) == expanded_spec['strictPopulationSizes'][source], 'Strict sample count changed')
        require(all(any(c['cellId'] == soc and c['status'] == 'EXACT_MATCH' for c in cells) for soc in members), 'Expanded cells overlap strict population')
    assignments, panels, source_maps = {}, {}, {}
    for sensitivity, consensus in [('B', False), ('C', True)]:
        source_maps[sensitivity] = source_assignments(exposures, required['occupation-crosswalk.json'], details, spec, consensus)
        assignments[sensitivity] = {k: {c['cellId']: cell_assignment(c, source_maps[sensitivity][k]) for c in cells} for k in ['academic', 'microsoft']}
        panels[sensitivity] = {}
        for source in ['academic', 'microsoft']:
            ca = assignments[sensitivity][source]
            members = balanced_members(cells, ca, stats, availability)
            require(set(strict_members[source]) <= set(members), 'Strict members lost during expansion')
            panels[sensitivity][source] = panel(monthly, cells, members, ca, stats, availability, denominators, spec)
        common = sorted(set(panels[sensitivity]['academic']['memberCellIds']) & set(panels[sensitivity]['microsoft']['memberCellIds']))
        panels[sensitivity]['common'] = {source: panel(monthly, cells, common, assignments[sensitivity][source], stats, availability, denominators, spec) for source in ['academic', 'microsoft']}
    # Rebuild A from original cell statistics to guard pooling/partial-year arithmetic.
    for source in ['academic', 'microsoft']:
        strict_panel = panel(monthly, cells, strict_members[source], assignments['B'][source], stats, availability, denominators, spec)
        for actual, original in zip(strict_panel['outcomes'], strict_groups['sourceSpecificResults'][source]):
            require({k: v for k, v in actual.items() if k != 'memberCellIds'} ==
                    {k: v for k, v in original.items() if k != 'memberSocCodes'},
                    'Strict arithmetic changed: ' + source + ' ' + str(actual['year']) + ' Q' + str(actual['quintile']))
        require(strict_panel['matchedPartialYears'] and len(strict_panel['outcomes']) == len(strict_groups['sourceSpecificResults'][source]), 'Strict periods changed')
        partial_keys = ['targetYear', 'comparisonYear', 'months', 'referenceType', 'estimates', 'employmentChangesPct']
        require([{k: p[k] for k in partial_keys} for p in strict_panel['matchedPartialYears']] ==
                [{k: p[k] for k in partial_keys} for p in strict_groups['matchedPartialYears'][source]],
                'Strict matched-month arithmetic changed')
        require(strict_panel['brief'] == brief(strict_trends[source]), 'Strict pretrend changed')
    coverage, comparisons, attribution, composition = {}, {}, {}, {}
    lookup = {c['cellId']: c for c in cells}
    for source in ['academic', 'microsoft']:
        strict_cov = next(c for c in strict_groups['coverage'][source] if c['year'] == 2024)
        coverage[source] = {'A_strict': strict_cov}
        comparisons[source] = {'A_strict': {'brief': brief(strict_trends[source]), 'outcomes': strict_groups['sourceSpecificResults'][source], 'matchedPartialYears': strict_groups['matchedPartialYears'][source]}}
        for sensitivity in ['B', 'C']:
            p = panels[sensitivity][source]
            cov = next(c for c in p['coverage'] if c['year'] == 2024)
            coverage[source][sensitivity] = cov
            comparisons[source][sensitivity] = {'brief': p['brief'], 'labels': comparison_labels(brief(strict_trends[source]), p['brief'], cov['employmentWeightedCoverage'], spec, panels[sensitivity]['common'][source]['brief']), 'outcomes': p['outcomes'], 'matchedPartialYears': p['matchedPartialYears']}
        added = sorted(set(panels['C'][source]['memberCellIds']) - set(strict_members[source]))
        gain = defaultdict(int)
        composition[source] = []
        for cid in added:
            c, assignment = lookup[cid], assignments['C'][source][cid]
            category = 'ONET_CHILD_CONSENSUS' if assignment['usesChildConsensus'] else 'TEMPORAL_' + c['mappingType'].upper().replace('-', '_') if c['status'] != 'EXACT_MATCH' else 'SAMPLE_THRESHOLD_RECOVERY'
            w = stats[2024][cid]['cell']['weightInt']
            gain[category] += w
            pre = analysis.log_trend([(y, stats[y][cid]['estimate']['employment']) for y in spec['pretrend']['years']])
            all_q = assignment['quintile']
            endpoint = [r for r in panels['C'][source]['outcomes'] if r['quintile'] == all_q and r['year'] in [2015, 2019]]
            contribution = {str(y): stats[y][cid]['estimate']['employment'] / next(r['employment'] for r in endpoint if r['year'] == y) for y in [2015, 2019]}
            composition[source].append({'cellId': cid, 'socMembers': c['soc2018'], 'majorSocGroup': major_group(c),
                                        'mappingType': c['mappingType'], 'cellStatus': c['status'], 'quintile': all_q,
                                        'gainCategory': category, 'employmentWeightedShare2024': w / denominators[2024],
                                        'pretrend': pre, 'pretrendGroupShareEndpoints': contribution,
                                        'pretrendContributionMeaning': 'Share of native-quintile employment at pretrend endpoints; not an additive log-OLS coefficient',
                                        'estimate2024': stats[2024][cid]['estimate'],
                                        'industryAcrossEra': 'NOT_COMPARABLE'})
        strict_weight = sum(stats[2024][cid]['cell']['weightInt'] for cid in strict_members[source])
        require(sum(gain.values()) == coverage[source]['C']['includedWeightInt'] - strict_weight, 'Coverage gain accounting failed')
        attribution[source] = {k: {'weightInt': v, 'coverageGainPercentagePoints': 100 * v / denominators[2024]} for k, v in sorted(gain.items())}
        for sensitivity in ['B', 'C']:
            by_major = defaultdict(int)
            for cid in panels[sensitivity][source]['memberCellIds']:
                by_major[major_group(lookup[cid])] += stats[2024][cid]['cell']['weightInt']
            coverage[source][sensitivity]['majorSocEmploymentSharesOfAllEmployed'] = {k: v / denominators[2024] for k, v in sorted(by_major.items())}
            coverage[source][sensitivity]['majorSocCoverageDiagnostics'] = major_coverage(
                cells, panels[sensitivity][source]['memberCellIds'], stats[2024], monthly, details, denominators[2024])
        strict_major = defaultdict(int)
        for cid in strict_members[source]:
            strict_major[major_group(lookup[cid])] += stats[2024][cid]['cell']['weightInt']
        coverage[source]['A_strict_majorSocEmploymentSharesOfAllEmployed'] = {k: v / denominators[2024] for k, v in sorted(strict_major.items())}
        coverage[source]['A_strict_majorSocCoverageDiagnostics'] = major_coverage(
            cells, strict_members[source], stats[2024], monthly, details, denominators[2024])
    coverage['common'] = {'A_strict': {'cellCount': strict_common['commonSampleSize'], 'results': strict_common['commonSampleResults']},
                          **{v: next(c for c in panels[v]['common']['academic']['coverage'] if c['year'] == 2024) for v in ['B', 'C']}}
    coverage['common']['A_strict']['majorSocCoverageDiagnostics'] = major_coverage(
        cells, strict_common['commonSocCodes'], stats[2024], monthly, details, denominators[2024])
    for sensitivity in ['B', 'C']:
        coverage['common'][sensitivity]['majorSocCoverageDiagnostics'] = major_coverage(
            cells, panels[sensitivity]['common']['academic']['memberCellIds'], stats[2024], monthly, details, denominators[2024])
    labels = [v for source in comparisons.values() for v in source['C']['labels']]
    decision = ('EXPANDED SAMPLE IS MATERIAL BUT RESULT-SENSITIVE' if any(x.endswith('_SENSITIVE') for x in labels) else
                'EXPANSION DOES NOT YET RESOLVE COVERAGE LIMITATION' if 'INSUFFICIENT_EXPANDED_COVERAGE' in labels else
                'EXPANDED SAMPLE ADDS ROBUST DESCRIPTIVE COVERAGE')
    binding = {'strictSpecificationSha256': SPEC_SHA, 'expandedSpecificationSha256': EXPANDED_SHA,
               'strictArtifactMapSha256': strict_validation['artifactMapSha256'], 'phase2Inputs': identities,
               'officialCensusConcordanceSha256': cr['sha256'],
               'monthlySnapshotSha256': sha256(canonical(read(root / 'accepted/monthly-manifest.json'))),
               'existingSourceManifestSha256': sha256(canonical(manifest))}
    cell_health = {}
    complete_years = [y for y, a in availability.items() if a['fullYear'] and y <= 2025]
    for source in strict_members:
        cell_health[source] = {}
        for cell in cells:
            cid = cell['cellId']
            assignment = assignments['C'][source][cid]
            missing = [y for y in complete_years if cid not in stats[y]]
            insufficient = [y for y in complete_years if cid in stats[y] and not stats[y][cid]['eligible']]
            status = (cell['status'] if cell['status'] == 'TEMPORAL_MAPPING_AMBIGUOUS' else
                      assignment['status'] if assignment['quintile'] is None else
                      'UNAVAILABLE' if missing else 'INSUFFICIENT_SAMPLE' if insufficient else assignment['status'])
            cell_health[source][cid] = {'status': status, 'eligible': cid in panels['C'][source]['memberCellIds'],
                                        'missingOutcomeYears': missing, 'insufficientSampleYears': insufficient}
    bodies = {
        'coverage-waterfall.json': waterfall(details, cw, strict_exp, source_maps['C'], strict_members,
                                           {k: panels['C'][k]['memberCellIds'] for k in strict_members}, cells, stats, monthly, spec),
        'expanded-crosswalk.json': {'currentCodes': cw['currentCodes'], 'temporalEdges': cw['temporalEdges'], 'source': cr, 'resolutionPolicy': expanded_spec['cellConstruction']},
        'harmonized-occupation-cells.json': {'cells': cells, 'componentCounts': dict(Counter(c['mappingType'] for c in cells)), 'temporalEligibilityCounts': dict(Counter(c['status'] for c in cells))},
        'expanded-exposure-assignments.json': {
            'sourceSocAssignments': source_maps['C'],
            'sensitivityBRule': 'Exact scalar assignments only; consensus-child records excluded',
            'cellAssignments': {v: {k: {cid: {**{key: val for key, val in a.items() if key != 'memberEvidence'},
                                                      'memberSocRefs': sorted(a['memberEvidence'])}
                                       for cid, a in source.items()} for k, source in sources.items()}
                                for v, sources in assignments.items()}},
        'strict-vs-expanded-coverage.json': coverage,
        'strict-vs-expanded-outcomes.json': {'sourceSpecificResults': comparisons,
            'commonExpanded': {v: {k: {key: val for key, val in p.items() if key != 'pretrends'}
                                  for k, p in panels[v]['common'].items()} for v in ['B', 'C']},
            'commonStrict': strict_common['commonSampleResults'], 'newComposition': composition, 'uncertainty': spec['uncertainty']},
        'expanded-pretrends.json': {'strict': strict_trends, 'expanded': {v: {k: panels[v][k]['pretrends'] for k in strict_members} for v in ['B', 'C']}, 'commonExpanded': {v: {k: panels[v]['common'][k]['pretrends'] for k in strict_members} for v in ['B', 'C']}, 'method': spec['pretrend']},
        'coverage-gain-attribution.json': attribution,
        'expanded-sample-health.json': {'status': 'PARTIAL', 'providers': health, 'strictIntact': True,
                                       'sourceCellEligibility': cell_health,
                                       'noDesignBasedUncertainty': True, 'ambiguousCells': [c['cellId'] for c in cells if c['status'] == 'TEMPORAL_MAPPING_AMBIGUOUS'],
                                       'sourceFailuresDoNotInventAssignments': True, 'earnings': 'NOT_COMPARABLE_FOR_CLEAN_WAGE_EFFECT',
                                       'proxyAgeIsNotSeniority': True},
        'qualification.json': {'strictValidation': strict_validation, 'strictSizes': {k: len(v) for k, v in strict_members.items()},
                               'strictCommonSize': strict_common['commonSampleSize'], 'decision': decision,
                               'mappingCounts': {source: {kind: {'includedCells': sum(lookup[c]['mappingType'] == kind for c in panels['C'][source]['memberCellIds']),
                                                              'excludedCells': sum(c['mappingType'] == kind and c['cellId'] not in panels['C'][source]['memberCellIds'] for c in cells)} for kind in ['1-to-1', 'many-to-1', '1-to-many', 'many-to-many']} for source in strict_members},
                               'childConsensusCounts': dict(Counter(source_maps['C']['academic'][soc]['status'] for soc in details)),
                               'noCausalClaim': True, 'newRawSources': 0, 'storage': 'Generated outputs excluded from Git; manifest only',
                               'monitorActivation': False, 'publicIntegration': False}
    }
    # Full industry code distributions are useful for the added-cell composition
    # audit, but not copied into every annual row and every repeated pretrend
    # baseline. Exposure evidence is referenced by SOC, not duplicated per cell.
    def compact(value, path=()):
        if isinstance(value, dict):
            return {k: compact(v, path + (k,)) for k, v in value.items()
                    if k != 'nativeIndustryShares' or 'newComposition' in path}
        if isinstance(value, list):
            return [compact(v, path) for v in value]
        return value
    return {name: {'contractVersion': VERSION, 'scope': 'RESEARCH_ONLY', 'causalityStatus': 'DESCRIPTIVE_ONLY',
                   'causality': 'NOT_ESTABLISHED', 'interpretationGuardrail': GUARDRAIL, 'binding': binding, 'data': compact(data)}
            for name, data in sorted(bodies.items())}


def output_manifest(bodies):
    return {'contractVersion': VERSION, 'expandedSpecificationSha256': EXPANDED_SHA,
            'artifacts': {name: {'sha256': sha256(canonical(data)), 'bytes': len(canonical(data)),
                                 'storageClass': 'C_REPRODUCIBLE_GENERATED'} for name, data in sorted(bodies.items())},
            'historicalEvidence': 'D: existing Phase 1–3 accepted archive; no duplicated raw inputs',
            'volatileMetadataExcluded': True, 'researchOnly': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['build', 'validate'])
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    output = args.output or args.root / 'expanded-generated'
    repository = args.root.resolve().parent.parent.parent
    require(not output.resolve().is_relative_to(repository) or
            output.resolve().is_relative_to((args.root / 'expanded-generated').resolve()),
            'In-repository outputs must remain in the ignored expanded-generated research directory')
    bodies = build(args.root)
    manifest = output_manifest(bodies)
    if args.command == 'build':
        for name, value in bodies.items():
            save(output / name, value)
        save(output / 'manifest.json', manifest)
    else:
        require(read(output / 'manifest.json') == manifest, 'Expanded manifest reconstruction mismatch')
        for name, value in bodies.items():
            require(read(output / name) == value, 'Expanded deterministic reconstruction mismatch: ' + name)
    print(json.dumps({'command': args.command, 'artifactCount': len(bodies), 'artifactBytes': sum(v['bytes'] for v in manifest['artifacts'].values()),
                      'manifestSha256': sha256(canonical(manifest)), 'decision': bodies['qualification.json']['data']['decision']}, indent=2))


if __name__ == '__main__':
    main()
