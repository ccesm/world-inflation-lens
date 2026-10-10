"""Independent raw-to-extract controls. No downloads or new observations.

Optional existing external EIA workbook cache is read-only. The committed audit
receipt makes its presence/result explicit; normal frozen builds need no cache.
"""
import argparse
import gzip
import importlib.util
import html
import json
import sys
from pathlib import Path
import engine as e


def audit(cache=None):
    spec = importlib.util.spec_from_file_location('inherited_c1m', e.RESEARCH / 'phase-c1m/artifacts.py')
    old = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(old)
    manifest = e.load(e.ROOT / 'input-manifest.json')
    e.verify_inputs(manifest)
    sources = {s['sourceId']: s for s in manifest['sources']}
    source_counts = {}
    for i in manifest['indicators']:
        s = sources[i['sourceId']]
        if not s.get('fixture'):
            continue
        new_rows = e.native_records(i, s)
        old_rows = old.records(s)
        fields = lambda r: (r['period'], r['value'], r['locator'])
        e.require([fields(r) for r in new_rows] == [fields(r) for r in old_rows],
                  'Independent parser disagreement: ' + i['indicatorId'])
        source_counts[s['sourceId']] = len(new_rows)
    # Independently parse the retained Henry Hub HTML using its row markup.
    import re
    raw = gzip.decompress((e.RESEARCH / 'phase-c1a/inputs/raw-controls/henryhub.gz').read_bytes())
    e.require(e.digest(raw) == sources['EIA_GAS']['sha256'], 'Gas raw identity')
    cells = []
    for body in re.findall(r'<tr\b[^>]*>(.*?)</tr>', raw.decode(), re.I | re.S):
        row = [html.unescape(re.sub(r'<[^>]+>', '', c)).strip()
               for c in re.findall(r'<t[dh]\b[^>]*>(.*?)</t[dh]>', body, re.I | re.S)]
        if len(row) == 13 and row[0] in map(str, range(2015, 2026)):
            for month, value in enumerate(row[1:], 1):
                cells.append((f'{row[0]}-{month:02}-01', None if value in ('', 'NA', '-', '--', 'W') else float(value)))
    original = e.load(e.RESEARCH / 'phase-c1a/inputs/henryhub-monthly.json')
    e.require(sorted(cells) == [(r['period'] + '-01', r['value']) for r in original], 'Gas parse disagreement')
    source_counts['EIA_GAS'] = len(cells)
    electricity = dict(status='NOT_TESTED_EXTERNAL_CACHE_ABSENT', rawHash=sources['EIA_STATE']['sha256'], cellsChecked=0)
    if cache is not None:
        sha = sources['EIA_STATE']['sha256']
        data = (Path(cache) / 'objects' / sha[:2] / sha).read_bytes()
        e.require(e.digest(data) == sha and len(data) == sources['EIA_STATE']['byteSize'], 'EIA raw identity')
        sheet = e.worksheet(data, 'Monthly-States')
        e.require(sheet[3]['J'] == 'Megawatthours' and sheet[3]['L'] == 'Cents/kWh', 'EIA units')
        rows = e.load(e.RESEARCH / 'phase-c1a/inputs/state-monthly.json')
        rows = [r for r in rows if r['sector'] == 'COMMERCIAL']
        for r in rows:
            row = int(re.search(r'I(\d+):', r['locator'])[1])
            native = sheet[row]
            year, month = map(int, r['period'].split('-'))
            e.require([native[x] for x in ('A', 'B', 'C', 'D', 'J', 'L')]
                      == [year, month, r['state'], r['dataStatus'], r['salesMWh'], r['priceCentsPerKWh']],
                      'State native-cell mismatch')
        electricity.update(status='PASS_EXISTING_RAW_HASH_AND_NATIVE_CELLS', cellsChecked=len(rows)*2)
        source_counts['EIA_STATE'] = len(rows)*2
    return dict(schemaVersion=e.VERSION, baseSHA=e.BASE, sourceAsOf=manifest['sourceAsOf'],
                fixtureParserComparison='PASS_INDEPENDENT_C2_VS_INHERITED_C1M',
                comparedNumericCellsBySource=source_counts, electricityControl=electricity,
                noNetwork=True, noNewSources=True, noEconomicPromotion=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--existing-eia-cache', type=Path)
    args = parser.parse_args()
    print(json.dumps(audit(args.existing_eia_cache), indent=2, sort_keys=True))
