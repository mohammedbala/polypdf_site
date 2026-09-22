#!/usr/bin/env python3
"""Local fixtures only: never connects to SSH or a public URL."""
import importlib.util
import io
import json
import os
from pathlib import Path
import subprocess
import tarfile
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("deploy_static", Path(__file__).parents[1] / "scripts/deploy-static.py")
deploy = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(deploy)
SHA = "1" * 40


class DeploymentFixture(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve() / "server"
        self.previous = self.root / "releases" / ("0" * 40)
        self.previous.mkdir(parents=True)
        (self.root / "current").symlink_to(self.previous)
        self.build = Path(self.temp.name) / "build"
        self.build.mkdir()
        for name, content in {"index.html": b"Old homepage", "old-name.js": b"UNCHANGED SCRIPT", "changed.css": b"old css"}.items():
            (self.previous / name).write_bytes(content)
        for name, content in {"index.html": b"New homepage", "new-name.js": b"UNCHANGED SCRIPT", "changed.css": b"new css", "sample.pdf": b"%PDF-fixture"}.items():
            (self.build / name).write_bytes(content)
        os.utime(self.previous / "old-name.js", (1000000000, 1000000000))
        os.utime(self.build / "new-name.js", (1700000000, 1700000000))
        self.files = deploy.inventory(self.build)
        self.reuse, self.changed = deploy.content_plan(deploy.inventory(self.previous), self.files)
        self.target = self.root / "releases" / SHA
        self.manifest = {"schemaVersion": 1, "sourceCommit": SHA, "files": self.files, "reuse": self.reuse,
                         "previousWebsite": str(self.previous), "candidateWebsite": str(self.target),
                         "previousIndexSha256": deploy.digest(self.previous / "index.html"), "minimumFreeBytes": deploy.MIB}

    def archive(self, omit=None, corrupt=None, symlink=None):
        stream = io.BytesIO()
        with tarfile.open(fileobj=stream, mode="w") as archive:
            payload = json.dumps(self.manifest).encode()
            item = tarfile.TarInfo("deploy-manifest.json"); item.size = len(payload)
            archive.addfile(item, io.BytesIO(payload))
            for name in self.changed:
                if name == omit:
                    continue
                payload = (self.build / name).read_bytes()
                if name == corrupt:
                    payload = b"X" * len(payload)
                item = tarfile.TarInfo(name); item.size = len(payload)
                if name == symlink:
                    item.type = tarfile.SYMTYPE; item.linkname = "/etc/passwd"
                archive.addfile(item, io.BytesIO(payload))
        stream.seek(0)
        return stream

    def stage(self):
        return deploy.stage_archive(self.root, self.archive())

    def test_reuses_content_despite_renamed_file_and_changed_timestamp(self):
        old_mode = (self.previous / "old-name.js").stat().st_mode
        receipt = self.stage()
        self.assertEqual(self.reuse, {"new-name.js": "old-name.js"})
        self.assertEqual(receipt["uploadedFiles"], 3)
        self.assertEqual((self.target / "new-name.js").stat().st_ino, (self.previous / "old-name.js").stat().st_ino)
        self.assertEqual((self.previous / "old-name.js").stat().st_mode, old_mode)
        self.assertEqual(deploy.current_target(self.root), self.previous)
        deploy.verify_inventory(self.target, self.files)

    def test_disk_refusal_happens_before_candidate_creation(self):
        with self.assertRaisesRegex(RuntimeError, "Insufficient disk"):
            deploy.stage_archive(self.root, self.archive(), free_bytes=0)
        self.assertFalse(self.target.exists())
        self.assertFalse((self.root / "deployments").exists())

    def test_incomplete_or_corrupt_uploads_are_removed_and_do_not_touch_current(self):
        for kwargs in ({"omit": "sample.pdf"}, {"corrupt": "changed.css"}, {"symlink": "sample.pdf"}):
            with self.subTest(kwargs=kwargs), self.assertRaises(RuntimeError):
                deploy.stage_archive(self.root, self.archive(**kwargs))
            self.assertFalse(self.target.exists())
            self.assertEqual(deploy.current_target(self.root), self.previous)
            self.assertEqual((self.previous / "changed.css").read_bytes(), b"old css")

    def test_stale_predecessor_is_rejected_before_staging(self):
        other = self.root / "releases" / ("2" * 40)
        other.mkdir()
        deploy.switch_current(self.root, other, self.previous)
        with self.assertRaisesRegex(RuntimeError, "Current release changed"):
            self.stage()
        self.assertFalse(self.target.exists())

    def test_successful_activation_verifies_every_resource_and_is_atomic(self):
        self.stage()
        seen = set()
        def fetch(name, sha):
            self.assertEqual(sha, SHA)
            self.assertEqual(deploy.current_target(self.root), self.target)
            seen.add(name)
            return deploy.digest(deploy.current_target(self.root) / name)
        receipt = deploy.activate(self.root, SHA, fetch_hash=fetch)
        self.assertTrue(receipt["published"])
        self.assertEqual(seen, set(self.files))
        self.assertEqual(deploy.current_target(self.root), self.target)

    def test_public_mismatch_rolls_back_and_verifies_previous_homepage(self):
        self.stage()
        def fetch(name, sha):
            if name == "changed.css":
                return "bad digest"
            return deploy.digest(deploy.current_target(self.root) / name)
        with self.assertRaisesRegex(RuntimeError, "Public readback hash mismatch"):
            deploy.activate(self.root, SHA, fetch_hash=fetch)
        self.assertEqual(deploy.current_target(self.root), self.previous)
        receipt = json.loads((self.root / "deployments" / SHA / "activation-receipt.json").read_text())
        self.assertTrue(receipt["rolledBack"])
        self.assertTrue(receipt["rollbackReadbackVerified"])
        self.assertFalse(receipt["published"])

    def test_tampered_staged_file_cannot_be_activated(self):
        self.stage()
        path = self.target / "sample.pdf"
        path.chmod(0o644); path.write_bytes(b"tampered")
        with self.assertRaisesRegex(RuntimeError, "inventory/hash mismatch"):
            deploy.activate(self.root, SHA, fetch_hash=lambda *_: self.fail("Must not fetch"))
        self.assertEqual(deploy.current_target(self.root), self.previous)

    def test_failed_readback_never_overwrites_another_operators_new_current(self):
        self.stage()
        other = self.root / "releases" / ("2" * 40)
        other.mkdir()
        (other / "index.html").write_bytes(b"Other operator release")
        def fetch(name, sha):
            if name == "index.html":
                deploy.switch_current(self.root, other, self.target)
                raise RuntimeError("readback interrupted")
            return self.files[name]["sha256"]
        with self.assertRaisesRegex(RuntimeError, "readback interrupted"):
            deploy.activate(self.root, SHA, fetch_hash=fetch)
        self.assertEqual(deploy.current_target(self.root), other)
        receipt = json.loads((self.root / "deployments" / SHA / "activation-receipt.json").read_text())
        self.assertFalse(receipt["rolledBack"])

    def test_source_gate_requires_exact_committed_clean_and_tracked_source(self):
        repo = Path(self.temp.name) / "source"
        repo.mkdir()
        def git(*args):
            return subprocess.check_output(["git", *args], cwd=repo, text=True).strip()
        git("init", "-q")
        (repo / "source.txt").write_text("committed source")
        git("add", "source.txt")
        git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.test", "commit", "-qm", "fixture")
        sha = git("rev-parse", "HEAD")
        deploy.clean_source(repo, sha)
        with self.assertRaisesRegex(RuntimeError, "does not match HEAD"):
            deploy.clean_source(repo, SHA)
        (repo / "untracked.txt").write_text("missing source asset")
        with self.assertRaisesRegex(RuntimeError, "clean.*tracked"):
            deploy.clean_source(repo, sha)
        (repo / "untracked.txt").unlink()
        (repo / "source.txt").write_text("uncommitted change")
        with self.assertRaisesRegex(RuntimeError, "clean.*tracked"):
            deploy.clean_source(repo, sha)

    def test_paths_and_existing_candidates_are_not_overwritten(self):
        for name in ("../outside", "/absolute", "folder/../outside", "folder\\outside"):
            with self.assertRaises(RuntimeError):
                deploy.safe_name(name)
        self.stage()
        with self.assertRaisesRegex(RuntimeError, "already exists"):
            self.stage()
        self.assertEqual(deploy.current_target(self.root), self.previous)


if __name__ == "__main__":
    unittest.main()
