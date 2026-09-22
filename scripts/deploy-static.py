#!/usr/bin/env python3
"""Two-phase static deployment. Nothing remote changes without --stage/--activate.

Build and commit first. Releases are immutable; hardlinked files are never edited.
The same stdlib-only core runs locally in tests and remotely over SSH.
"""
import argparse
import contextlib
import hashlib
import io
import json
import os
from pathlib import Path, PurePosixPath
import re
import shlex
import shutil
import signal
import subprocess
import sys
import tarfile
import time
import urllib.parse
import urllib.request
import urllib.error
from concurrent.futures import ThreadPoolExecutor

DEFAULT_ROOT = "/var/www/polypdf-site"
DEFAULT_HOST = "root@134.209.123.154"
ORIGIN = "https://www.polypdf.com"
MIB = 1024 * 1024


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def digest(path):
    with path.open("rb") as stream:
        return hash_stream(stream)


def hash_stream(stream):
    h = hashlib.sha256()
    for block in iter(lambda: stream.read(MIB), b""):
        h.update(block)
    return h.hexdigest()


def safe_name(name):
    p = PurePosixPath(name)
    require(isinstance(name, str) and name and not p.is_absolute() and ".." not in p.parts
            and "\\" not in name and p.as_posix() == name and name != ".", f"Unsafe file name: {name!r}")
    return name


def inventory(directory):
    require(directory.is_dir(), f"Missing directory: {directory}")
    files = {}
    for path in sorted(directory.rglob("*")):
        require(not path.is_symlink(), f"Symlinks are not allowed inside releases: {path}")
        if path.is_file():
            name = safe_name(path.relative_to(directory).as_posix())
            require(path.stat().st_size > 0, f"Empty asset: {name}")
            files[name] = {"sha256": digest(path), "bytes": path.stat().st_size}
    require(files, "Release contains no files")
    return files


def verify_inventory(directory, expected):
    require(inventory(directory) == expected, f"Release inventory/hash mismatch: {directory}")


def current_target(root):
    current = root / "current"
    require(current.is_symlink(), f"Current must be a symlink: {current}")
    target = current.resolve(strict=True)
    require(target.parent == (root / "releases").resolve(), "Current points outside the release directory")
    return target


def content_plan(previous, files):
    by_digest = {}
    for name, entry in previous.items():
        by_digest.setdefault((entry["sha256"], entry["bytes"]), name)
    reuse = {}
    for name, entry in files.items():
        match = name if previous.get(name) == entry else by_digest.get((entry["sha256"], entry["bytes"]))
        if match is not None:
            reuse[name] = match
    changed = [name for name in files if name not in reuse]
    return reuse, changed


def required_bytes(manifest):
    # Account for allocation blocks, directory entries, and metadata, not just payload.
    changed = (name for name in manifest["files"] if name not in manifest["reuse"])
    payload = sum(((manifest["files"][name]["bytes"] + 4095) // 4096) * 4096 for name in changed)
    dirs = {parent for name in manifest["files"] for parent in PurePosixPath(name).parents}
    return payload + len(dirs) * 4096 + len(json.dumps(manifest).encode()) * 2 + 65536


def validate_manifest(manifest, root):
    sha = manifest["sourceCommit"]
    require(re.fullmatch(r"[0-9a-f]{40}", sha), "A full source commit SHA is required")
    require(manifest["schemaVersion"] == 1, "Unsupported manifest schema")
    require(manifest["candidateWebsite"] == str(root / "releases" / sha), "Candidate path does not match source commit")
    require(Path(manifest["previousWebsite"]).parent == root / "releases", "Invalid previous release")
    require(manifest["minimumFreeBytes"] >= MIB, "At least 1 MiB of free-space cushion is required")
    require(manifest["files"] and "index.html" in manifest["files"], "Manifest is missing index.html")
    for name, entry in manifest["files"].items():
        safe_name(name)
        require(re.fullmatch(r"[0-9a-f]{64}", entry["sha256"]) and entry["bytes"] > 0, f"Invalid manifest entry: {name}")
    for name, source in manifest["reuse"].items():
        require(name in manifest["files"], "Reuse target is not in manifest")
        safe_name(source)


@contextlib.contextmanager
def deployment_lock(root):
    import fcntl
    with (root / ".deploy.lock").open("a") as stream:
        fcntl.flock(stream, fcntl.LOCK_EX | fcntl.LOCK_NB)
        yield


def stage_archive(root, archive_stream, free_bytes=None):
    """Consume one streaming tar: manifest first, then only changed regular files."""
    with tarfile.open(fileobj=archive_stream, mode="r|*") as archive:
        first = archive.next()
        require(first is not None and first.name == "deploy-manifest.json" and first.isfile()
                and first.size < 4 * MIB, "Manifest must be the first archive entry")
        manifest = json.load(archive.extractfile(first))
        validate_manifest(manifest, root)
        previous = current_target(root)
        require(str(previous) == manifest["previousWebsite"], "Current release changed since planning; stage again")
        target = Path(manifest["candidateWebsite"])
        metadata = root / "deployments" / manifest["sourceCommit"]
        require(not target.exists() and not target.is_symlink() and not metadata.exists(), "Candidate already exists; inspect it before retrying")
        available = shutil.disk_usage(root).free if free_bytes is None else free_bytes
        needed = required_bytes(manifest)
        require(available >= needed + manifest["minimumFreeBytes"],
                f"Insufficient disk: {available} free bytes; need {needed} stage bytes + {manifest['minimumFreeBytes']} cushion")
        # Recheck reused bytes before making any candidate directory.
        for name, source in manifest["reuse"].items():
            path = previous / source
            require(path.is_file() and not path.is_symlink() and digest(path) == manifest["files"][name]["sha256"],
                    f"Reuse source changed: {source}")
        target.mkdir(mode=0o755)
        try:
            for name, source in manifest["reuse"].items():
                destination = target / name
                destination.parent.mkdir(parents=True, exist_ok=True)
                os.link(previous / source, destination)
            expected_uploads = set(manifest["files"]) - set(manifest["reuse"])
            seen = set()
            for entry in iter(archive.next, None):
                name = safe_name(entry.name)
                require(entry.isfile() and name in expected_uploads and name not in seen, f"Unexpected upload: {name}")
                require(entry.size == manifest["files"][name]["bytes"], f"Upload size mismatch: {name}")
                destination = target / name
                destination.parent.mkdir(parents=True, exist_ok=True)
                with destination.open("xb") as output, archive.extractfile(entry) as source:
                    shutil.copyfileobj(source, output, MIB)
                os.chmod(destination, 0o444)  # Only NEW bytes; never chmod shared hardlinks.
                require(digest(destination) == manifest["files"][name]["sha256"], f"Upload hash mismatch: {name}")
                seen.add(name)
            require(seen == expected_uploads, "Upload is incomplete")
            verify_inventory(target, manifest["files"])
            require(str(current_target(root)) == manifest["previousWebsite"], "Current release changed during staging")
            require(shutil.disk_usage(root).free >= manifest["minimumFreeBytes"], "Free-space cushion consumed during staging")
            metadata.mkdir(parents=True)
            (metadata / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
            receipt = {"phase": "staged", "sourceCommit": manifest["sourceCommit"], "candidateWebsite": str(target),
                       "previousWebsite": str(previous), "reusedFiles": len(manifest["reuse"]),
                       "uploadedFiles": len(seen), "uploadedBytes": sum(manifest["files"][n]["bytes"] for n in seen)}
            (metadata / "stage-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
            require(shutil.disk_usage(root).free >= manifest["minimumFreeBytes"], "Free-space cushion consumed while writing metadata")
            return receipt
        except BaseException:
            # Only the candidate created by THIS call is eligible for cleanup.
            shutil.rmtree(target)
            if metadata.exists():
                shutil.rmtree(metadata)
            raise


def public_hash(name, sha):
    route = "/" + (name[:-10] if PurePosixPath(name).name == "index.html" else name)
    request = urllib.request.Request(ORIGIN + urllib.parse.quote(route, safe="/") + "?deploy=" + sha,
                                     headers={"Accept-Encoding": "identity", "Cache-Control": "no-cache"})
    try:
        response = urllib.request.urlopen(request, timeout=25)
    except urllib.error.HTTPError as error:
        if name != "404.html" or error.code != 404:
            raise
        response = error
    with response:
        require(response.status == 200 or (name == "404.html" and response.status == 404), f"HTTP {response.status}: {route}")
        return hash_stream(response)


def switch_current(root, target, expected):
    require(str(current_target(root)) == str(expected), "Current release changed; refusing symlink replacement")
    temporary = root / (".current-next-" + str(os.getpid()))
    require(not temporary.exists() and not temporary.is_symlink(), "Temporary symlink already exists")
    try:
        temporary.symlink_to(target)
        os.replace(temporary, root / "current")
    finally:
        if temporary.is_symlink():
            temporary.unlink()


def activate(root, sha, fetch_hash=public_hash):
    metadata = root / "deployments" / sha
    manifest = json.loads((metadata / "manifest.json").read_text())
    validate_manifest(manifest, root)
    require(sha == manifest["sourceCommit"], "Staged source does not match requested commit")
    target, previous = Path(manifest["candidateWebsite"]), Path(manifest["previousWebsite"])
    require(str(current_target(root)) == str(previous), "Current is no longer the staged predecessor; refusing activation")
    verify_inventory(target, manifest["files"])
    require(digest(previous / "index.html") == manifest["previousIndexSha256"], "Previous homepage changed")
    receipt = {"phase": "activating", "sourceCommit": sha, "previousWebsite": str(previous), "candidateWebsite": str(target),
               "published": False, "startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    switch_current(root, target, previous)
    try:
        def check(item):
            name, entry = item
            require(fetch_hash(name, sha) == entry["sha256"], f"Public readback hash mismatch: {name}")
        # Verify every published manifest resource, including every localized page,
        # bootstrap bundle, sample PDF, and workflow media file.
        with ThreadPoolExecutor(max_workers=4) as workers:
            list(workers.map(check, manifest["files"].items()))
        require(current_target(root) == target, "Current changed during public verification")
        receipt.update(phase="published", published=True, verifiedFiles=len(manifest["files"]))
    except BaseException as error:
        receipt.update(phase="failed", error=str(error))
        if current_target(root) == target:
            switch_current(root, previous, target)
            receipt["rolledBack"] = True
            try:
                receipt["rollbackReadbackVerified"] = fetch_hash("index.html", "rollback-" + sha) == manifest["previousIndexSha256"]
            except Exception:
                receipt["rollbackReadbackVerified"] = False
        else:
            receipt["rolledBack"] = False
            receipt["rollbackError"] = "Another operator changed current; their release was not overwritten"
        raise
    finally:
        (metadata / "activation-receipt.json").write_text(json.dumps(receipt, indent=2) + "\n")
    return receipt


def ssh_command(args, operation):
    script = Path(__file__).read_text()
    command = shlex.join(["python3", "-c", script, "--remote", operation, "--root", args.root, "--source-sha", args.source_sha])
    return ["ssh", "-o", "BatchMode=yes", "-o", "IdentitiesOnly=yes", "-i", str(Path(args.identity).expanduser()), args.host, command]


def clean_source(repo, sha):
    require(re.fullmatch(r"[0-9a-f]{40}", sha), "--source-sha must be the full committed source SHA")
    actual = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=repo, text=True).strip()
    require(actual == sha, "Requested source SHA does not match HEAD")
    status = subprocess.check_output(["git", "status", "--porcelain", "--untracked-files=normal"], cwd=repo, text=True)
    require(not status.strip(), "Source must be clean with all source/public assets tracked before deployment")


def run_local(args):
    repo = Path(__file__).resolve().parent.parent
    clean_source(repo, args.source_sha)
    evidence = repo / ".tmp" / "deploy-static" / args.source_sha
    evidence.mkdir(parents=True, exist_ok=True)
    if args.activate:
        receipt = subprocess.check_output(ssh_command(args, "activate"), text=True)
        (evidence / "activation-receipt.json").write_text(receipt)
        print(receipt.strip())
        return
    build = (repo / args.build).resolve()
    # Reuse the site's own completeness gates rather than weakening their media,
    # prerender, and localized-page contracts in deployment code.
    env = {**os.environ, "BUILD_PATH": str(build)}
    for gate in ("scripts/verify-prerender.mjs", "scripts/international/verify.cjs"):
        subprocess.run(["node", gate], cwd=repo, env=env, check=True)
    files = inventory(build)
    assets = json.loads((build / "asset-manifest.json").read_text())
    for asset in assets["files"].values():
        require(urllib.parse.urlsplit(asset).path.lstrip("/") in files, f"Missing bundled asset: {asset}")
    remote = json.loads(subprocess.check_output(ssh_command(args, "inventory"), text=True))
    reuse, changed = content_plan(remote["files"], files)
    manifest = {"schemaVersion": 1, "sourceCommit": args.source_sha, "files": files, "reuse": reuse,
                "previousWebsite": remote["current"], "candidateWebsite": str(Path(args.root) / "releases" / args.source_sha),
                "previousIndexSha256": remote["files"]["index.html"]["sha256"], "minimumFreeBytes": int(args.min_free_mib * MIB)}
    validate_manifest(manifest, Path(args.root))
    required = required_bytes(manifest)
    require(remote["freeBytes"] >= required + manifest["minimumFreeBytes"],
            f"Insufficient server disk: {remote['freeBytes']} free bytes; need {required} stage bytes + {manifest['minimumFreeBytes']} cushion")
    clean_source(repo, args.source_sha)
    payload = (json.dumps(manifest, indent=2) + "\n").encode()
    (evidence / "manifest.json").write_bytes(payload)
    print(json.dumps({"reuseFiles": len(reuse), "uploadFiles": len(changed), "requiredStageBytes": required,
                      "minimumFreeBytes": manifest["minimumFreeBytes"]}), flush=True)
    process = subprocess.Popen(ssh_command(args, "stage"), stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    upload_error = None
    try:
        with tarfile.open(fileobj=process.stdin, mode="w|") as archive:
            info = tarfile.TarInfo("deploy-manifest.json"); info.size = len(payload)
            archive.addfile(info, io.BytesIO(payload))
            for name in changed:
                path = build / name
                require(path.is_file() and not path.is_symlink() and digest(path) == files[name]["sha256"],
                        f"Build changed while uploading: {name}")
                archive.add(path, arcname=name, recursive=False)
    except Exception as error:
        upload_error = error
    finally:
        try:
            process.stdin.close()
        except BrokenPipeError:
            pass
    output, error = process.stdout.read(), process.stderr.read()
    require(process.wait() == 0, error.decode().strip() or "Remote staging failed")
    if upload_error:
        raise upload_error
    (evidence / "stage-receipt.json").write_bytes(output)
    print(output.decode().strip())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument("--stage", action="store_true")
    modes.add_argument("--activate", action="store_true")
    modes.add_argument("--remote", choices=("inventory", "stage", "activate"), help=argparse.SUPPRESS)
    parser.add_argument("--source-sha", required=True)
    parser.add_argument("--build", default="build")
    parser.add_argument("--root", default=DEFAULT_ROOT)
    parser.add_argument("--host", default=DEFAULT_HOST)
    parser.add_argument("--identity", default="~/.ssh/polypdf-deploy")
    parser.add_argument("--min-free-mib", type=float, default=16)
    args = parser.parse_args()
    if not args.remote:
        run_local(args)
        return
    root = Path(args.root)
    require(root.is_absolute() and root.is_dir(), "Invalid server root")
    if args.remote == "inventory":
        target = current_target(root)
        print(json.dumps({"current": str(target), "files": inventory(target), "freeBytes": shutil.disk_usage(root).free}))
    else:
        def interrupted(signum, _frame):
            raise InterruptedError(f"Deployment interrupted by signal {signum}")
        for signum in (signal.SIGTERM, signal.SIGHUP):
            signal.signal(signum, interrupted)
        with deployment_lock(root):
            result = stage_archive(root, sys.stdin.buffer) if args.remote == "stage" else activate(root, args.source_sha)
            print(json.dumps(result))


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Deployment refused/failed: {error}", file=sys.stderr)
        sys.exit(1)
