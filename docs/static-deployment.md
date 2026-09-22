# Static website deployment

`scripts/deploy-static.py` separates **staging** from **activation**. It uses the
existing SSH deployment identity and does not change nginx, the license API,
downloads, credentials, or older releases. It requires Python 3 on both hosts and
the existing local Node dependencies for the site's build-verification gates.

Finish the website build and validation, commit all source and public assets, and
ensure `git status --short` is empty. The deploy helper refuses dirty or untracked
source. The build must represent that committed source; the helper binds the
exact output bytes to its SHA256 manifest and source commit, but does not rebuild
the project itself.

```sh
python3 test/deploy-static.test.py
python3 scripts/deploy-static.py --stage --source-sha FULL_40_CHARACTER_COMMIT_SHA
```

Staging reruns the prerender/media-evidence and international-completeness gates,
checks all bundled assets, and hashes the full local output. A read-only inventory
of the current server release determines which content can be reused. Identical
bytes are hardlinked even when their filenames or timestamps changed. Only new
bytes are streamed over SSH; no second tar archive is stored on the server.

The candidate release is `/var/www/polypdf-site/releases/<source-sha>`. The helper
checks new-byte allocation, directories and manifest overhead **plus a 16 MiB
free-space cushion** before staging. `--min-free-mib N` can change the cushion but
cannot remove it (minimum 1 MiB). A disk shortage fails before creating a candidate.
Staging verifies the complete inventory and all hashes, and leaves `current`
untouched. Reused hardlinks are never chmodded, timestamped, or edited.

Review the stage receipt under `.tmp/deploy-static/<source-sha>/`, then explicitly
activate the same frozen commit:

```sh
python3 scripts/deploy-static.py --activate --source-sha FULL_40_CHARACTER_COMMIT_SHA
```

Activation requires `current` still to point to the predecessor recorded during
staging, and rechecks every staged file. It replaces the symlink atomically, then
fetches **every manifest resource** from `https://www.polypdf.com`, including all
localized pages, JavaScript/CSS, samples, and videos. Response bytes must match the
manifest hashes. Requests use an identity encoding and a commit cache-buster.
The 404 page may return its expected 404 status; its bytes must still match.

If any public readback fails, the helper atomically restores the previous symlink
and checks the previous homepage hash. It will not overwrite a different release
another operator has put in `current`. A server-side lock prevents concurrent
uses of this helper. Remote receipts live at
`/var/www/polypdf-site/deployments/<source-sha>/`; successful receipts are also saved
locally. On a failed activation, inspect the remote `activation-receipt.json` for
`rolledBack` and `rollbackReadbackVerified` rather than inferring rollback from
the local command's exit code alone.

An ordinary failed upload removes only its own newly created candidate. A hard
process/server crash can leave a partial candidate. Existing candidates are never
overwritten or deleted automatically on retry: inspect the exact candidate and
receipt before deciding how to recover it. Never modify files inside old releases;
their inodes may be shared with the current release.

Defaults can be overridden with `--host`, `--identity`, `--root`, and `--build`.
Keep the intended production defaults unless operating an explicitly separate
environment. This helper does not delete old releases to make room.

## Local verification

The fixture tests never connect to SSH or HTTP. They check renamed-content
hardlink reuse despite changed timestamps, disk refusal, truncated/corrupted and
symlink uploads, stale predecessor guards, complete public hash verification,
rollback/readback on failure, staged tampering, unsafe paths, and refusal to
overwrite an existing candidate.

During development on 2026-09-22, a read-only server inventory found 401 current
files, 35,518,296 logical bytes, and **0 free bytes**. The current target was
`e73d23543a7c31228c842eb3db618befdd51c550`. No staging or activation was run while
creating this helper. Read fresh server state before deployment; this observation
is historical evidence, not a standing assumption about available capacity.

Before the conversion refresh deployment, the root operator verified a complete
local backup of that regenerable `node_modules` directory (51,743 regular files,
83,332,074 compressed bytes; SHA256
`b0b3233eb75cedd55260f6a10027be174e54713c45a17d881df593ef4f0f21d4`),
confirmed no running process used the website checkout, then removed only those
build dependencies. Free space recovered to 524,787,712 bytes. The source checkout,
current release, API, downloads, and rollback releases were preserved. The backup
and receipt are in the conversion worktree's ignored `.tmp/conversion/` folder.
Build dependencies can be restored from that archive or by `npm ci` when needed;
static publishing itself does not need them on the server.
