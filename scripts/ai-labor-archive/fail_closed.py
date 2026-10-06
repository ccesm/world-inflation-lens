#!/usr/bin/env python3
"""Fail-closed checks for partial or damaged hydration of the frozen AI-labor stack.

Each scenario hydrates a brand-new root from the verified archive, damages it in one
specific way, then runs the frozen research validators with Python sockets blocked.
A scenario passes only if the validator exits non-zero. Exit 0 means the damaged
data was silently accepted, so the scenario fails.
"""
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

TOOLS = Path(sys.argv[1])          # PR #10 scripts/ai-labor-archive
ARCHIVE = Path(sys.argv[2])
INDEX = Path(sys.argv[3])
WORK = Path(sys.argv[4])
sys.path.insert(0, str(TOOLS))
import archive as a  # noqa: E402

LABOR = 'research/ai-labor-transition'
P1 = f'{LABOR}/scripts/cli.py'
P2 = f'{LABOR}/occupational/scripts/cli.py'
P3 = f'{LABOR}/outcomes/scripts/cli.py'
MON = f'{LABOR}/monitor/cli.py'
STORE = f'{LABOR}/monitor/history/qualification-store'
MON_OUT = f'{LABOR}/monitor'

assert not WORK.exists(), 'work directory must be new'
WORK.mkdir(parents=True)
guard = WORK / 'guard'
guard.mkdir()
(guard / 'sitecustomize.py').write_text(
    "import socket\n"
    "def deny(*a, **k): raise RuntimeError('Offline qualification blocks network')\n"
    "socket.create_connection = deny\n"
    "socket.socket.connect = deny\n"
    "socket.socket.connect_ex = deny\n")
ENV = dict(os.environ, PYTHONPATH=str(guard), PYTHONDONTWRITEBYTECODE='1')
ENV.pop('GITHUB_STEP_SUMMARY', None)


def tree_digest(root):
    h = hashlib.sha256()
    for p in sorted(root.rglob('*')):
        if p.is_file():
            h.update(str(p.relative_to(root)).encode() + b'\0')
            h.update(hashlib.sha256(p.read_bytes()).digest())
    return h.hexdigest()


def run(root, script, *args):
    proc = subprocess.run([sys.executable, script, *args], cwd=root, env=ENV,
                          capture_output=True, timeout=900)
    text = (proc.stdout + proc.stderr).decode(errors='replace').strip().splitlines()
    return proc.returncode, (text[-1] if text else '')


def mutate_json_number(path):
    """Change the first numeric leaf found by +1, keeping the file valid JSON."""
    raw = path.read_bytes()
    gz = path.suffix == '.gz'
    if gz:
        import gzip
        raw = gzip.decompress(raw)
    data = json.loads(raw)

    def walk(node):
        if isinstance(node, dict):
            for k in sorted(node):
                v = node[k]
                if isinstance(v, (int, float)) and not isinstance(v, bool):
                    node[k] = v + 1
                    return f'{k}: {v} -> {node[k]}'
                r = walk(v)
                if r:
                    return r
        elif isinstance(node, list):
            for i, v in enumerate(node):
                if isinstance(v, (int, float)) and not isinstance(v, bool):
                    node[i] = v + 1
                    return f'[{i}]: {v} -> {node[i]}'
                r = walk(v)
                if r:
                    return r
        return None

    change = walk(data)
    if not change:
        def walk_str(node):
            if isinstance(node, dict):
                for k in sorted(node):
                    v = node[k]
                    if isinstance(v, str) and v:
                        node[k] = v[:-1] + ('0' if v[-1] != '0' else '1')
                        return f'{k}: ...{v[-6:]} -> ...{node[k][-6:]}'
                    r = walk_str(v)
                    if r:
                        return r
            elif isinstance(node, list):
                for v in node:
                    r = walk_str(v)
                    if r:
                        return r
            return None
        change = walk_str(data)
    assert change, f'no mutable leaf in {path}'
    out = json.dumps(data, ensure_ascii=False).encode()
    if gz:
        import gzip
        out = gzip.compress(out, mtime=0)
    path.write_bytes(out)
    return change


SCENARIOS = [
    # (name, hydrate phase, damage, [(validator, args)])
    ('partial-hydration-phase1-only', 'phase1', None,
     [(P2, ['validate']), (P3, ['validate']), (MON, ['validate', '--store', STORE, '--output', MON_OUT])]),
    ('partial-hydration-phase2-only', 'phase2', None,
     [(P3, ['validate']), (MON, ['validate', '--store', STORE, '--output', MON_OUT])]),
    ('partial-hydration-phase3-only', 'phase3', None,
     [(MON, ['validate', '--store', STORE, '--output', MON_OUT])]),
    # Code (A/B) present, every C/D data file of one phase absent: the slim-branch shape.
    ('code-present-phase2-data-absent', 'monitor', ('drop-phase', 'phase2'),
     [(P2, ['validate']), (P3, ['validate'])]),
    ('code-present-phase3-data-absent', 'monitor', ('drop-phase', 'phase3'),
     [(P3, ['validate']), (MON, ['dry-run', '--store', 'FRESH_STORE', '--output', 'FRESH_OUT'])]),
    ('code-present-monitor-data-absent', 'monitor', ('drop-phase', 'monitor'),
     [(MON, ['validate', '--store', STORE, '--output', MON_OUT])]),
    ('missing-D-phase2-superseded-onet-vintage', 'monitor',
     ('delete', f'{LABOR}/occupational/accepted/vintages/onet/c5bfcfe784d72a2253ebc49dd9068641cf2fc978609135ce190b89007c6ecf95.json.gz'),
     [(P2, ['validate'])]),
    ('missing-D-phase1-raw-source', 'monitor',
     ('delete', f'{LABOR}/sources/raw/e058a098af64427b0cf0c1455435023aeb9a84142a55175d322687e61a3da3ce.gz'),
     [(P1, ['validate'])]),
    # After a failed rebuild, downstream analysis must not consume the degraded state.
    ('missing-D-phase1-raw-source-rebuild', 'monitor',
     ('delete', f'{LABOR}/sources/raw/e058a098af64427b0cf0c1455435023aeb9a84142a55175d322687e61a3da3ce.gz'),
     [(P1, ['normalize']), (P3, ['validate']), (MON, ['dry-run', '--store', 'FRESH_STORE', '--output', 'FRESH_OUT'])]),
    ('missing-D-phase1-cps-vintage', 'monitor',
     ('delete', f'{LABOR}/normalized/vintages/cps/95a367bfc48648c83ea7aa89a9e453cd43ce0a9fa72ad98024865fae16302689.json'),
     [(P1, ['validate'])]),
    ('missing-D-phase2-current-onet-vintage', 'monitor',
     ('delete', f'{LABOR}/occupational/accepted/vintages/onet/28a0f4b5f2748502d3a331de6cb788c703b45a26f6f3099174f2060236d467c5.json.gz'),
     [(P2, ['validate'])]),
    ('missing-D-phase2-onet-raw-source-rebuild', 'monitor',
     ('delete', f'{LABOR}/occupational/sources/raw/6883548adf5fde64cf6f801b35d15519c9225f2732c3cab0e281c652d16b23a9.gz'),
     [(P2, ['normalize'])]),
    ('missing-D-phase3-occupation-annual', 'monitor',
     ('delete', f'{LABOR}/outcomes/cps-occupation-annual.json.gz'),
     [(P3, ['validate'])]),
    ('missing-D-phase3-occupation-annual-rebuild', 'monitor',
     ('delete', f'{LABOR}/outcomes/cps-occupation-annual.json.gz'),
     [(P3, ['normalize'])]),
    ('missing-D-monitor-evaluation', 'monitor',
     ('delete', f'{STORE}/evaluations/9c65350db439ee246408614201380bef40971f79a4ea2968084b861ab8c4b747.json'),
     [(MON, ['validate', '--store', STORE, '--output', MON_OUT])]),
    ('missing-C-phase1-provider-alias', 'monitor',
     ('delete', f'{LABOR}/normalized/providers/cps.json'),
     [(P1, ['validate'])]),
    ('missing-C-phase3-monthly-alias', 'monitor',
     ('delete', f'{LABOR}/outcomes/accepted/monthly/2015-01.json.gz'),
     [(P3, ['validate'])]),
    ('altered-D-phase1-cps-vintage', 'monitor',
     ('mutate', f'{LABOR}/normalized/vintages/cps/95a367bfc48648c83ea7aa89a9e453cd43ce0a9fa72ad98024865fae16302689.json'),
     [(P1, ['validate'])]),
    ('altered-D-phase3-group-outcomes', 'monitor',
     ('mutate', f'{LABOR}/outcomes/exposure-group-outcomes.json'),
     [(P3, ['validate'])]),
    ('altered-D-monitor-store-inputs', 'monitor',
     ('mutate', f'{STORE}/inputs.json'),
     [(MON, ['validate', '--store', STORE, '--output', MON_OUT])]),
    ('altered-C-phase3-monthly-alias', 'monitor',
     ('mutate', f'{LABOR}/outcomes/accepted/monthly/2015-01.json.gz'),
     [(P3, ['validate'])]),
]

LOCK = json.loads(INDEX.read_text())['manifest']['files']
BY_PATH = {f['path']: f for f in LOCK}


def lock_check(root):
    """Re-hash a hydrated root against the reviewed lock (the recommended pre-analysis gate)."""
    bad = []
    for f in LOCK:
        p = root / f['path']
        if not p.is_file():
            bad.append(('missing', f['path']))
        elif hashlib.sha256(p.read_bytes()).hexdigest() != f['sha256']:
            bad.append(('changed', f['path']))
    return bad


logs = WORK / 'logs'
logs.mkdir()
results = []
for name, sel, damage, checks in SCENARIOS:
    root = WORK / name
    a.hydrate(ARCHIVE, INDEX, root, sel)
    note = ''
    damaged = None
    if damage:
        kind, rel = damage
        if kind == 'drop-phase':
            dropped = [f['path'] for f in LOCK if f['phase'] == rel and f['category'] in ('C', 'D')]
            for p in dropped:
                (root / p).unlink()
            note = f'deleted {len(dropped)} {rel} C/D files; A/B code kept'
            damaged = f'all {rel} C/D data'
        else:
            target = root / rel
            assert target.is_file(), f'{rel} missing before damage'
            damaged = rel.replace(LABOR + '/', '')
            if kind == 'delete':
                target.unlink()
                note = 'deleted'
            else:
                note = mutate_json_number(target)
    lock_problems = lock_check(root) if sel == 'monitor' else None
    for i, (script, args) in enumerate(checks):
        args = [str(WORK / f'{name}-store-{i}') if x == 'FRESH_STORE' else
                str(WORK / f'{name}-out-{i}') if x == 'FRESH_OUT' else x for x in args]
        before = tree_digest(root / LABOR)
        proc = subprocess.run([sys.executable, script, *args], cwd=root, env=ENV,
                              capture_output=True, timeout=900)
        log = proc.stdout + proc.stderr
        (logs / f'{name}-{i}.txt').write_bytes(log)
        lines = log.decode(errors='replace').strip().splitlines()
        after = tree_digest(root / LABOR)
        regenerated_identical = None
        if damage and damage[0] == 'delete' and (root / damage[1]).is_file():
            regenerated_identical = (hashlib.sha256((root / damage[1]).read_bytes()).hexdigest()
                                     == BY_PATH[damage[1]]['sha256'])
        row = dict(scenario=name, hydrated=sel, damage=damaged, change=note,
                   command=' '.join([script.replace(LABOR + '/', ''), args[0]]),
                   exitCode=proc.returncode, failedClosed=proc.returncode != 0,
                   treeUnchanged=before == after, deletedFileRegeneratedIdentical=regenerated_identical,
                   lockCheckDetects=(len(lock_problems) > 0) if lock_problems is not None else None,
                   logSha256=hashlib.sha256(log).hexdigest(), lastLine=(lines[-1] if lines else '')[:240])
        results.append(row)
        print(json.dumps(row, ensure_ascii=False), flush=True)

summary = dict(total=len(results), failedClosed=sum(r['failedClosed'] for r in results),
               exitZero=[r['scenario'] + ' ' + r['command'] for r in results if not r['failedClosed']],
               treeChangedOnFailure=[r['scenario'] + ' ' + r['command'] for r in results
                                     if r['failedClosed'] and not r['treeUnchanged']],
               lockCheckMissedDamage=[r['scenario'] for r in results
                                      if r['damage'] and r['lockCheckDetects'] is False])
(WORK / 'failtests.json').write_text(json.dumps(dict(results=results, summary=summary), indent=2, ensure_ascii=False) + '\n')
print(json.dumps(summary, indent=2, ensure_ascii=False))
