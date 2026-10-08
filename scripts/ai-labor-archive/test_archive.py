import copy
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
import archive as a

class ArchiveContractTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve(); self.bundle = self.root/'bundle.tar'; self.index = self.root/'lock.json'
        self.files = [dict(path=f'research/ai-labor-transition/tests/fixtures/file-{i}.txt',size=3,
                           sha256=a.sha(b'abc'),gitBlob='0'*40,category='B',phase='phase1') for i in range(507)]
        self.manifest = dict(schema='ai-labor-frozen-archive-v1',stackCommit=a.STACK,files=self.files,
                             pathBytes=1521,objectBytes=3,objectCount=1,
                             dependencies={'phase1':['phase1'],'phase2':['phase1','phase2'],
                                           'phase3':['phase1','phase2','phase3'],'monitor':['phase1','phase2','phase3','monitor']})
        self.write()

    def write(self, members=None):
        body = a.canonical(self.manifest)
        with tarfile.open(self.bundle,'w',format=tarfile.USTAR_FORMAT) as t:
            for name,data,kind in members or [('manifest.json',body,tarfile.REGTYPE),('objects/'+a.sha(b'abc'),b'abc',tarfile.REGTYPE)]:
                m=tarfile.TarInfo(name);m.size=len(data);m.type=kind;t.addfile(m,io.BytesIO(data))
        self.index.write_bytes(a.canonical(dict(schema='ai-labor-archive-lock-v1',stackCommit=a.STACK,
            manifest=self.manifest,archive=dict(size=self.bundle.stat().st_size,sha256=a.sha(self.bundle.read_bytes()),manifestSha256=a.sha(body)))))

    def rejected(self):
        with self.assertRaises((ValueError,tarfile.TarError)):
            a.hydrate(self.bundle,self.index,self.root/'rejected')
        self.assertFalse((self.root/'rejected').exists())

    def test_all_aliases_recovered_and_repeat_identity(self):
        a.hydrate(self.bundle,self.index,self.root/'one')
        a.hydrate(self.bundle,self.index,self.root/'two')
        self.assertEqual(len(list((self.root/'one').rglob('*.txt'))),507)
        self.assertTrue(all((self.root/'one'/f['path']).read_bytes()==(self.root/'two'/f['path']).read_bytes()==b'abc' for f in self.files))

    def test_bundle_tamper(self):
        b=bytearray(self.bundle.read_bytes());b[1024]^=1;self.bundle.write_bytes(b);self.rejected()

    def test_missing_archive(self):
        self.bundle.unlink()
        with self.assertRaises(ValueError):a.read_archive(self.bundle,self.index)

    def test_missing_object_even_with_resealed_outer_hash(self):
        self.write([('manifest.json',a.canonical(self.manifest),tarfile.REGTYPE)]);self.rejected()

    def test_wrong_object_even_with_resealed_outer_hash(self):
        self.write([('manifest.json',a.canonical(self.manifest),tarfile.REGTYPE),('objects/'+a.sha(b'abc'),b'bad',tarfile.REGTYPE)]);self.rejected()

    def test_path_traversal_absolute_backslash_and_noncanonical(self):
        for path in ('research/ai-labor-transition/../../escape','/absolute','research/ai-labor-transition/./bad','research/ai-labor-transition//bad','research/ai-labor-transition/\\bad'):
            with self.subTest(path=path):
                self.files[0]['path']=path;self.write();self.rejected()

    def test_symlink_and_hardlink_members(self):
        for kind in (tarfile.SYMTYPE,tarfile.LNKTYPE):
            self.write([('manifest.json',a.canonical(self.manifest),tarfile.REGTYPE),('objects/'+a.sha(b'abc'),b'',kind)]);self.rejected()

    def test_duplicate_object_and_unexpected_member(self):
        for name in ('objects/'+a.sha(b'abc'),'../escape'):
            self.write([('manifest.json',a.canonical(self.manifest),tarfile.REGTYPE),('objects/'+a.sha(b'abc'),b'abc',tarfile.REGTYPE),(name,b'abc',tarfile.REGTYPE)]);self.rejected()

    def test_duplicate_alias(self):
        self.files[0]['path']=self.files[1]['path'];self.write();self.rejected()

    def test_manifest_tamper(self):
        lock=json.loads(self.index.read_bytes());lock['manifest']['files'][0]['size']=4;self.index.write_bytes(a.canonical(lock));self.rejected()

    def test_size_and_file_count_bounds(self):
        self.files[0]['size']=a.MAX_OBJECT+1;self.write();self.rejected()
        self.files.pop();self.write();self.rejected()

    def test_existing_target_not_overwritten(self):
        target=self.root/'existing';target.mkdir();(target/'keep').write_text('keep')
        with self.assertRaises(ValueError):a.hydrate(self.bundle,self.index,target)
        self.assertEqual((target/'keep').read_text(),'keep')

    def test_symlink_target_and_parent(self):
        (self.root/'link').symlink_to(self.root,target_is_directory=True)
        with self.assertRaises(ValueError):a.hydrate(self.bundle,self.index,self.root/'link'/'new')
        self.assertFalse((self.root/'new').exists())

    def test_selected_phase_and_invalid_dependency(self):
        self.files[-1]['phase']='monitor';self.write()
        self.assertEqual(a.hydrate(self.bundle,self.index,self.root/'p1','phase1')['files'],506)
        self.manifest['dependencies']['phase1']=['monitor'];self.write();self.rejected()

if __name__=='__main__':unittest.main()
