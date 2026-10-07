"""Verify reviewed accounting-note anchors against pinned raw bytes; no input writes.

This reproduces archival locators and annual depreciation cells. Narrative accounting
interpretation remains manually reviewed, rather than a general filing-text parser.
"""
import hashlib
import json
import os
from pathlib import Path
import re
from lxml import html
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]

def verify(cache, sources, notes):
    refs = {s['sourceId']: s for s in sources}
    texts = {}
    for note in notes['notes']:
        proof = note['source']
        source = refs[proof['sourceId']]
        if source['sha256'] != proof['sha256'] or source['url'] != proof['url']:
            raise ValueError('NOTE_SOURCE_IDENTITY')
        key = (source['sourceId'], proof.get('page'))
        if key not in texts:
            raw = (Path(cache) / 'objects' / source['sha256'][:2] / source['sha256']).read_bytes()
            if hashlib.sha256(raw).hexdigest() != source['sha256'] or len(raw) != source['byteSize']:
                raise ValueError('NOTE_RAW_IDENTITY')
            if proof.get('page'):
                text = PdfReader(Path(cache) / 'objects' / source['sha256'][:2] / source['sha256']).pages[proof['page'] - 1].extract_text()
            else:
                text = html.fromstring(raw).text_content()
            texts[key] = ' '.join(text.split())
        for anchor in note['anchors']:
            if anchor.casefold() not in texts[key].casefold():
                raise ValueError('NOTE_ANCHOR: ' + note['noteId'] + ': ' + anchor)
    annual = notes['annualObservations']
    if annual:
        proof = annual[0]['source']
        text = texts[(proof['sourceId'], proof['page'])]
        match = re.search(r'Depreciation of property and equipment\s+([\d,]+)\s+([\d,]+)\s+([\d,]+)', text)
        if not match:
            raise ValueError('ANNUAL_DEPRECIATION_ROW')
        values = [int(v.replace(',', '')) for v in match.groups()]
        expected = [(2021, 10273), (2022, 13475), (2023, 11946)]
        if values != [v for _, v in expected] or [(int(a['periodEnd'][:4]), a['value']) for a in annual] != expected:
            raise ValueError('ANNUAL_DEPRECIATION_IDENTITY')
    return {'noteAnchorsVerified': len(notes['notes']), 'annualDepreciationCellsVerified': len(annual)}

if __name__ == '__main__':
    sources = json.loads((ROOT / 'inputs/source-vintage-manifest.json').read_text())['sources']
    notes = json.loads((ROOT / 'inputs/accounting-note-evidence.json').read_text())
    result = verify(os.environ['WIL_AI_CAPEX_CACHE'], sources, notes)
    # Newly qualified manual RPO cell must reproduce the native Cloud amount,
    # independently of the output serializer or the Alphabet-wide total/horizon.
    source = next(s for s in sources if s['sourceId'] == 'goog-2026q2-accounting-notes')
    raw = Path(os.environ['WIL_AI_CAPEX_CACHE']) / 'objects' / source['sha256'][:2] / source['sha256']
    text = ' '.join(PdfReader(raw).pages[14].extract_text().split())
    match = re.search(r'of which \$([\d.]+) billion related to Google Cloud', text)
    if not match:
        raise ValueError('RPO_NATIVE_ROW')
    value = float(match.group(1)) * 1000
    observations = json.loads((ROOT / 'inputs/accepted-observations.json').read_text())['observations']
    rpo = next(o for o in observations if o['sourceId'] == source['sourceId'] and o['metric'] == 'rpo')
    events = json.loads((ROOT / 'inputs/monetization-events.json').read_text())['events']
    event = next(e for e in events if e['company'] == 'GOOG' and e['kind'] == 'BACKLOG')
    if rpo['value'] != value or event['value'] != value or rpo['scope'] != 'Google Cloud' or rpo['periodEnd'] != '2026-06-30':
        raise ValueError('RPO_NATIVE_IDENTITY')
    result['cloudRpoCellVerified'] = 1
    print(json.dumps(result))
