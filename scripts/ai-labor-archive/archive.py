#!/usr/bin/env python3
"""Bounded, offline frozen-stack archive. Never refreshes or executes recovered code."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import tarfile
import tempfile

STACK = '09fcc21aad29c36697f4775048ad87694a1a8b61'
MAX_FILES = 507
MAX_BYTES = 160_000_000
MAX_OBJECT = 20_000_000
HEX = re.compile(r'^[0-9a-f]{64}$')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return (json.dumps(value, sort_keys=True, separators=(',', ':'), ensure_ascii=False) + '\n').encode()


def safe(path):
    require(isinstance(path, str) and '\\' not in path and '\x00' not in path, 'Unsafe path')
    parts = PurePosixPath(path).parts
    require(parts and not path.startswith('/') and all(p not in ('..', '.') for p in parts)
            and '/'.join(parts) == path, 'Unsafe path')
    require(path.startswith(('research/ai-labor-transition/', 'docs/AI_', '.github/workflows/ai-labor-')), 'Outside research allowlist')
    return path


def phase(path):
    if '/monitor/' in path or 'CONTINUOUS_MONITOR' in path or path.startswith('.github/'):
        return 'monitor'
    if '/outcomes/' in path or 'OUTCOMES_BY_EXPOSURE' in path:
        return 'phase3'
    if '/occupational/' in path or 'OCCUPATIONAL_EXPOSURE' in path or any(s in path for s in ('normalized/occupation', 'normalized/exposure', 'normalized/ai-applicability', 'normalized/ai-usage')):
        return 'phase2'
    return 'phase1'


def git(repo, *args):
    return subprocess.check_output(['git', '-C', str(repo), *args])


def pack(repo, inventory, archive, index):
    require(not archive.exists() and not index.exists(), 'Refuse overwrite')
    inv_bytes = inventory.read_bytes()
    inv = json.loads(inv_bytes)
    require(inv['reviewedStackHead'] == STACK and len(inv['files']) == MAX_FILES, 'Wrong frozen inventory')
    files, objects = [], {}
    for row in sorted(inv['files'], key=lambda r: r['path']):
        path = safe(row['path'])
        content = git(repo, 'show', STACK + ':' + path)
        blob = git(repo, 'rev-parse', STACK + ':' + path).decode().strip()
        require(len(content) == row['bytes'] and blob == row['gitBlob'], 'Inventory disagrees with Git')
        digest = sha(content)
        require(len(content) <= MAX_OBJECT, 'Oversize object')
        objects.setdefault(digest, content)
        files.append(dict(path=path, size=len(content), sha256=digest, gitBlob=blob,
                          category=row['category'], phase=phase(path)))
    require(sum(f['size'] for f in files) <= MAX_BYTES, 'Oversize stack')
    # Exact bytes of every provenance index, license snapshot, receipt, spec and benchmark
    # are bound by the complete file map; hash names in original files retain their meaning.
    manifest = dict(schema='ai-labor-frozen-archive-v1', stackCommit=STACK,
                    inventorySha256=sha(inv_bytes), files=files,
                    objectCount=len(objects), pathBytes=sum(f['size'] for f in files),
                    objectBytes=sum(map(len, objects.values())),
                    dependencies={'phase1':['phase1'], 'phase2':['phase1','phase2'],
                                  'phase3':['phase1','phase2','phase3'],
                                  'monitor':['phase1','phase2','phase3','monitor']})
    manifest_bytes = canonical(manifest)
    archive.parent.mkdir(parents=True, exist_ok=True)
    with tarfile.open(archive, 'w', format=tarfile.USTAR_FORMAT) as tar:
        for name, content in [('manifest.json', manifest_bytes)] + [('objects/' + h, objects[h]) for h in sorted(objects)]:
            info = tarfile.TarInfo(name)
            info.size, info.mode, info.mtime = len(content), 0o644, 0
            info.uid = info.gid = 0
            info.uname = info.gname = ''
            tar.addfile(info, io.BytesIO(content))
    lock = dict(schema='ai-labor-archive-lock-v1', stackCommit=STACK,
                archive=dict(sha256=sha(archive.read_bytes()), size=archive.stat().st_size,
                             format='ustar', manifestSha256=sha(manifest_bytes)),
                manifest=manifest, durableStorage=dict(status='NOT_REMOTE_QUALIFIED', locations=[]))
    index.parent.mkdir(parents=True, exist_ok=True)
    index.write_bytes(canonical(lock))
    return lock


def read_archive(archive, index):
    require(not archive.is_symlink() and archive.is_file(), 'Missing archive or symlink')
    require(not index.is_symlink() and index.stat().st_size < 1_000_000, 'Invalid index')
    lock = json.loads(index.read_bytes())
    require(lock['schema'] == 'ai-labor-archive-lock-v1' and lock['stackCommit'] == STACK, 'Wrong contract')
    require(archive.stat().st_size == lock['archive']['size'] <= MAX_BYTES + 2_000_000, 'Archive size mismatch')
    require(sha(archive.read_bytes()) == lock['archive']['sha256'], 'Archive hash mismatch')
    manifest = lock['manifest']
    require(manifest['schema'] == 'ai-labor-frozen-archive-v1' and manifest['stackCommit'] == STACK, 'Wrong manifest')
    require(sha(canonical(manifest)) == lock['archive']['manifestSha256'], 'Manifest pin mismatch')
    require(manifest['dependencies'] == {'phase1':['phase1'], 'phase2':['phase1','phase2'], 'phase3':['phase1','phase2','phase3'], 'monitor':['phase1','phase2','phase3','monitor']}, 'Invalid phase dependency closure')
    files = manifest['files']
    require(len(files) == MAX_FILES and sum(f['size'] for f in files) <= MAX_BYTES, 'File bound mismatch')
    names, wanted = set(), {}
    for f in files:
        require(safe(f['path']) not in names, 'Duplicate alias')
        names.add(f['path'])
        require(HEX.fullmatch(f['sha256']) and type(f['size']) is int and 0 <= f['size'] <= MAX_OBJECT, 'Invalid object identity')
        require(f['category'] in ('A','B','C','D') and f['phase'] in manifest['dependencies'], 'Invalid classification')
        require(f['sha256'] not in wanted or wanted[f['sha256']] == f['size'], 'Alias size conflict')
        wanted[f['sha256']] = f['size']
    require(len(wanted) == manifest['objectCount'] and sum(wanted.values()) == manifest['objectBytes']
            and sum(f['size'] for f in files) == manifest['pathBytes'], 'Totals disagree')
    payloads, seen = {}, set()
    with tarfile.open(archive, 'r:') as tar:
        for member in tar:
            require(member.name not in seen and member.isfile() and not member.pax_headers, 'Duplicate/nonregular archive member')
            seen.add(member.name)
            require(len(seen) <= len(wanted) + 1, 'Too many members')
            if member.name == 'manifest.json':
                require(member.size == len(canonical(manifest)), 'Manifest size mismatch')
                require(tar.extractfile(member).read() == canonical(manifest), 'Embedded manifest mismatch')
            else:
                require(member.name.startswith('objects/'), 'Unexpected archive path')
                h = member.name[len('objects/'):]
                require(h in wanted and member.name == 'objects/' + h and member.size == wanted[h], 'Unexpected/missing object identity')
                data = tar.extractfile(member).read()
                require(sha(data) == h, 'Object hash mismatch')
                payloads[h] = data
    require(seen == {'manifest.json'} | {'objects/' + h for h in wanted}, 'Missing archive objects')
    return manifest, payloads


def hydrate(archive, index, target, selection='monitor'):
    # Caller must trust the reviewed Git lock: an archive-supplied index is not a trust anchor.
    manifest, payloads = read_archive(archive, index)
    require(not target.exists() and not target.is_symlink(), 'Target must be new')
    require(target.parent.resolve() == target.parent.absolute(), 'Target parent contains symlink')
    require(selection in manifest['dependencies'], 'Unknown phase')
    phases = manifest['dependencies'][selection]
    require(phases == ['phase1','phase2','phase3','monitor'][:len(phases)], 'Invalid phase dependency closure')
    target.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix='.hydrate-', dir=target.parent))
    try:
        count = 0
        for f in manifest['files']:
            if f['phase'] not in phases:
                continue
            p = stage / f['path']
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(payloads[f['sha256']])
            require(p.stat().st_size == f['size'] and sha(p.read_bytes()) == f['sha256'], 'Hydrated identity mismatch')
            count += 1
        # Exclusive target creation; never overwrite a concurrently appearing target.
        target.mkdir()
        try:
            for child in stage.iterdir():
                os.rename(child, target / child.name)
        except Exception:
            shutil.rmtree(target)
            raise
    finally:
        shutil.rmtree(stage)
    return dict(files=count, stackCommit=STACK, selection=selection)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('action', choices=['pack','hydrate','verify'])
    p.add_argument('--archive', required=True, type=Path)
    p.add_argument('--index', required=True, type=Path)
    p.add_argument('--repo', type=Path, default=Path('.'))
    p.add_argument('--inventory', type=Path, default=Path('docs/ai-labor-repository-footprint-2026-10-06.json'))
    p.add_argument('--target', type=Path)
    p.add_argument('--phase', choices=['phase1','phase2','phase3','monitor'], default='monitor')
    a = p.parse_args()
    if a.action == 'pack':
        r = pack(a.repo,a.inventory,a.archive,a.index); print(json.dumps(r['archive']))
    elif a.action == 'verify':
        m,_ = read_archive(a.archive,a.index);print(json.dumps({k:m[k] for k in ('stackCommit','objectCount','pathBytes','objectBytes')}))
    else:
        require(a.target is not None, '--target required'); print(json.dumps(hydrate(a.archive,a.index,a.target,a.phase)))

if __name__ == '__main__':
    main()
