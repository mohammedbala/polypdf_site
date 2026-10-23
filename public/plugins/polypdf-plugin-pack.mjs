#!/usr/bin/env node
// polypdf-plugin-pack — build, sign and inspect .polypdf-plugin packages.
//
// This file is the whole toolchain. It has NO dependencies beyond Node 18+ (node:crypto,
// node:fs, node:path, node:zlib), so a third-party author can copy this one file next to their
// plugin folder and ship a package without cloning PolyPDF or installing anything.
//
//   node polypdf-plugin-pack.mjs keygen [--out <dir>]
//   node polypdf-plugin-pack.mjs pack <source-dir> --key <private.pem> [--out <file.polypdf-plugin>]
//   node polypdf-plugin-pack.mjs inspect <file.polypdf-plugin>
//
// WHAT SIGNING MEANS HERE. `pack` signs with a keypair YOU generate and embeds the public half in
// the package. PolyPDF verifies that signature to prove the package has not been altered since you
// built it, shows the key's fingerprint in the install consent screen, and pins it: an update to
// the same plugin id signed by a different key is refused. It does NOT make PolyPDF vouch for your
// plugin — packages included with the app are signed by PolyPDF's own key, and yours is not that.
// Keep the private key safe; losing it means users must uninstall before they can take an update.
//
// The format this writes is specified in PLUGIN-AUTHORING.md §3. If the two ever disagree, the
// app's verifier (apps/desktop/src/main/plugins/plugin-package.ts) is the authority.
import { createHash, generateKeyPairSync, createPublicKey, sign as ed25519Sign } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, join, relative, resolve, sep } from "node:path";
import { deflateRawSync, inflateRawSync } from "node:zlib";

const SIGNER = "self-signed/v1";
const SCHEME = "sha256+ed25519";
const SCHEMA_VERSION = 1;

/** Mirrors MAX_PACKAGE_* in packages/plugin-sdk/src/envelope.ts. */
const MAX_TOTAL_BYTES = 32 * 1024 * 1024;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_FILES = 512;

/** Runtime kinds a third-party package can target. See PLUGIN-AUTHORING.md §4. */
const THIRD_PARTY_RUNTIMES = ["symbol-stamp/v1"];
/** Every runtime the app knows, for a clearer error when someone targets a first-party one. */
const ALL_RUNTIMES = ["aisc-steel-section/v1", "license-seal/v1", "pdf-map/v1", "symbol-stamp/v1"];

const PERMISSIONS = ["document.context.read", "document.annotations.create", "workspace.image-assets.create"];

const RESERVED_ID_PREFIXES = ["com.polypdf.", "com.euclideansoftware."];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

class PackError extends Error {}

function fail(message) {
  throw new PackError(message);
}

function sha256Hex(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

/** The fingerprint PolyPDF prints on the consent screen: sha256(SPKI DER), 16 hex, in fours. */
function fingerprint(spkiDer) {
  const hex = createHash("sha256").update(spkiDer).digest("hex").slice(0, 16);
  return hex.match(/.{1,4}/g).join("-");
}

function humanBytes(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// A minimal ZIP writer/reader.
//
// Only what the format needs: no zip64, no encryption, no directory entries (the verifier refuses
// those anyway). Entries are deflated when that helps and stored when it does not.
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function writeZip(entries) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const entry of entries) {
    const name = Buffer.from(entry.path, "utf8");
    const raw = Buffer.from(entry.bytes);
    const deflated = deflateRawSync(raw, { level: 9 });
    // Store when compression does not pay: a 40-byte SVG comment should not grow by 12 bytes of
    // deflate framing, and STORE is the method the verifier handles with no inflater at all.
    const useDeflate = deflated.length < raw.length;
    const payload = useDeflate ? deflated : raw;
    const method = useDeflate ? 8 : 0;

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0, 12);
    local.writeUInt32LE(crc32(raw), 14);
    local.writeUInt32LE(payload.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);
    parts.push(local, name, payload);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0, 8);
    dir.writeUInt16LE(method, 10);
    dir.writeUInt16LE(0, 12);
    dir.writeUInt16LE(0, 14);
    dir.writeUInt32LE(crc32(raw), 16);
    dir.writeUInt32LE(payload.length, 20);
    dir.writeUInt32LE(raw.length, 24);
    dir.writeUInt16LE(name.length, 28);
    dir.writeUInt32LE(offset, 42);
    central.push(dir, name);
    offset += local.length + name.length + payload.length;
  }
  const centralBytes = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 8);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBytes.length, 12);
  eocd.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, centralBytes, eocd]);
}

/** Read a package back — used by `inspect`, and by the self-check `pack` runs before it writes. */
function readZip(bytes) {
  const buffer = Buffer.from(bytes);
  let eocd = -1;
  for (let i = buffer.length - 22; i >= 0 && i > buffer.length - 22 - 65536; i -= 1) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) fail("Not a ZIP archive (no end-of-central-directory record).");
  const count = buffer.readUInt16LE(eocd + 10);
  let cursor = buffer.readUInt32LE(eocd + 16);
  const entries = [];
  for (let i = 0; i < count; i += 1) {
    if (buffer.readUInt32LE(cursor) !== 0x02014b50) fail("Corrupt central directory.");
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const path = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const payload = buffer.subarray(dataStart, dataStart + compressedSize);
    const content = method === 0 ? Buffer.from(payload) : inflateRawSync(payload);
    if (content.length !== uncompressedSize) fail(`Entry "${path}" does not match its declared size.`);
    entries.push({ path, bytes: content });
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Source-tree collection + layout rules
//
// These mirror isAllowedPackagePath() and PLUGIN_PACKAGE_LAYOUT.forbidden in the app. Enforcing
// them HERE is the point of this tool: the alternative is finding out at install time, from a
// verifier whose job is to refuse rather than to teach.
// ---------------------------------------------------------------------------

const IGNORED_NAMES = new Set([".DS_Store", "Thumbs.db", "thumbs.db", ".gitkeep"]);

function collectFiles(sourceDir) {
  const files = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir).sort()) {
      if (name.startsWith(".")) continue; // dotfiles never belong in a package
      const full = join(dir, name);
      const stats = statSync(full);
      if (stats.isDirectory()) {
        walk(full);
      } else if (stats.isFile() && !IGNORED_NAMES.has(name)) {
        files.push(full);
      }
    }
  };
  walk(sourceDir);
  return files.map((full) => ({
    // POSIX separators: a ZIP written on Windows with backslashes is refused by the installer's
    // path-safety layer, which is a confusing way to learn about path separators.
    path: relative(sourceDir, full).split(sep).join("/"),
    bytes: readFileSync(full)
  }));
}

function assertAllowedLayout(entries) {
  for (const entry of entries) {
    const path = entry.path;
    if (path === "signature.json") {
      fail("Remove signature.json from your source folder — this tool generates it.");
    }
    if (path === "package.json") {
      fail("package.json is not allowed inside a plugin package. Keep it outside the source folder.");
    }
    if (path === "manifest.json" || path === "form-schema.json") continue;
    if (path.startsWith("data/") || path.startsWith("assets/") || path.startsWith("icons/")) continue;
    fail(
      `"${path}" is outside the package layout. A package may contain manifest.json, ` +
        "form-schema.json, and files under data/, assets/ and icons/ — nothing else."
    );
  }
  if (!entries.some((entry) => entry.path === "manifest.json")) {
    fail("No manifest.json in the source folder.");
  }
}

function assertBudgets(entries) {
  if (entries.length + 1 > MAX_FILES) fail(`A package may contain at most ${MAX_FILES} files.`);
  let total = 0;
  for (const entry of entries) {
    if (entry.bytes.length > MAX_FILE_BYTES) {
      fail(`"${entry.path}" is ${humanBytes(entry.bytes.length)}; the per-file limit is ${humanBytes(MAX_FILE_BYTES)}.`);
    }
    total += entry.bytes.length;
  }
  if (total > MAX_TOTAL_BYTES) {
    fail(`The package is ${humanBytes(total)} uncompressed; the limit is ${humanBytes(MAX_TOTAL_BYTES)}.`);
  }
}

// ---------------------------------------------------------------------------
// Manifest validation
//
// A readable subset of the app's Zod schema. It exists so the common mistakes (a bad semver, an
// unknown permission, a first-party runtime kind) are named in your terminal instead of surfacing
// as "Invalid plugin manifest" in a dialog.
// ---------------------------------------------------------------------------

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const PLUGIN_ID = /^[a-z0-9]+(\.[a-z0-9][a-z0-9-]*)*$/;
const IDENTIFIER = /^[a-zA-Z][a-zA-Z0-9._-]{0,63}$/;

function validateManifest(manifest) {
  const problems = [];
  const need = (condition, message) => {
    if (!condition) problems.push(message);
  };

  need(manifest.schemaVersion === SCHEMA_VERSION, `schemaVersion must be ${SCHEMA_VERSION}.`);
  need(typeof manifest.id === "string" && PLUGIN_ID.test(manifest.id) && manifest.id.length >= 3,
    'id must be reverse-DNS, lowercase (e.g. "com.example.north-arrow").');
  if (typeof manifest.id === "string") {
    const reserved = RESERVED_ID_PREFIXES.find((prefix) => manifest.id.startsWith(prefix));
    need(!reserved, `id may not start with "${reserved}" — that namespace is reserved for plugins PolyPDF signs.`);
  }
  need(typeof manifest.name === "string" && manifest.name.length >= 1 && manifest.name.length <= 64,
    "name must be 1–64 characters.");
  need(typeof manifest.version === "string" && SEMVER.test(manifest.version), "version must be semver (e.g. 1.0.0).");
  need(typeof manifest.publisher === "string" && manifest.publisher.length >= 1, "publisher is required.");
  need(typeof manifest.minimumHostVersion === "string" && SEMVER.test(manifest.minimumHostVersion),
    "minimumHostVersion must be semver (e.g. 1.3.1).");

  const kind = manifest.runtime?.kind;
  if (!ALL_RUNTIMES.includes(kind)) {
    problems.push(`runtime.kind must be one of: ${ALL_RUNTIMES.join(", ")}.`);
  } else if (!THIRD_PARTY_RUNTIMES.includes(kind)) {
    problems.push(
      `runtime.kind "${kind}" is a first-party runtime bound to data PolyPDF ships; a package you sign ` +
        `cannot target it. Third-party packages use: ${THIRD_PARTY_RUNTIMES.join(", ")}.`
    );
  }

  need(Array.isArray(manifest.commands) && manifest.commands.length >= 1,
    "commands must list at least one command (otherwise the plugin has no way to be run).");
  for (const [index, command] of (manifest.commands ?? []).entries()) {
    const where = `commands[${index}]`;
    need(typeof command?.id === "string" && IDENTIFIER.test(command.id), `${where}.id must be an identifier.`);
    need(typeof command?.title === "string" && command.title.length >= 1, `${where}.title is required.`);
    need(
      command?.placement === undefined || command.placement === "insert" || command.placement === "click-to-place",
      `${where}.placement must be "insert" or "click-to-place".`
    );
  }

  need(Array.isArray(manifest.permissions), "permissions must be an array (use [] for none).");
  for (const permission of manifest.permissions ?? []) {
    need(PERMISSIONS.includes(permission), `"${permission}" is not a permission. Valid: ${PERMISSIONS.join(", ")}.`);
  }

  for (const [index, field] of (manifest.formSchema?.fields ?? []).entries()) {
    const where = `formSchema.fields[${index}]`;
    need(typeof field?.id === "string" && IDENTIFIER.test(field.id), `${where}.id must be an identifier.`);
    need(
      ["text", "number", "select", "checkbox", "section", "note"].includes(field?.type),
      `${where}.type must be text, number, select, checkbox, section or note.`
    );
    need(typeof field?.label === "string" && field.label.length >= 1, `${where}.label is required.`);
    if (field?.type === "select") {
      need(Array.isArray(field.options) && field.options.length >= 1, `${where} is a select and needs options.`);
    }
  }

  if (problems.length > 0) {
    fail(`manifest.json has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n  - ${problems.join("\n  - ")}`);
  }
}

/**
 * Runtime-specific checks. Today only symbol-stamp/v1 has any, and they are the difference between
 * a package that installs and a package that installs and then fails on every run: the catalogue
 * has to name artwork that is actually in the ZIP, and the artwork has to be inert.
 */
function validateSymbolStampPackage(entries) {
  const byPath = new Map(entries.map((entry) => [entry.path, entry.bytes]));
  const catalogBytes = byPath.get("data/symbols.json");
  if (!catalogBytes) fail("A symbol-stamp/v1 package must contain data/symbols.json.");
  let catalog;
  try {
    catalog = JSON.parse(catalogBytes.toString("utf8"));
  } catch (error) {
    fail(`data/symbols.json is not valid JSON: ${error.message}`);
  }
  if (catalog.schemaVersion !== 1) fail('data/symbols.json must declare "schemaVersion": 1.');
  if (!Array.isArray(catalog.symbols) || catalog.symbols.length === 0) {
    fail("data/symbols.json must list at least one symbol.");
  }
  const seen = new Set();
  for (const [index, symbol] of catalog.symbols.entries()) {
    const where = `data/symbols.json symbol ${index + 1}`;
    if (typeof symbol?.id !== "string" || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(symbol.id)) {
      fail(`${where} needs an id of lowercase letters, digits and hyphens.`);
    }
    if (seen.has(symbol.id)) fail(`${where} repeats the id "${symbol.id}".`);
    seen.add(symbol.id);
    if (typeof symbol.label !== "string" || symbol.label.trim() === "") fail(`${where} ("${symbol.id}") needs a label.`);
    if (typeof symbol.file !== "string" || !symbol.file.startsWith("assets/") || !symbol.file.endsWith(".svg")) {
      fail(`${where} ("${symbol.id}") needs a file under assets/ ending in .svg.`);
    }
    const artwork = byPath.get(symbol.file);
    if (!artwork) fail(`${where} ("${symbol.id}") names ${symbol.file}, which is not in the package.`);
    for (const key of ["widthInches", "heightInches"]) {
      const value = symbol[key];
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0.1 || value > 24) {
        fail(`${where} ("${symbol.id}") needs ${key} between 0.1 and 24.`);
      }
    }
    if (symbol.labelPlacement !== undefined && !["below", "center"].includes(symbol.labelPlacement)) {
      fail(`${where} ("${symbol.id}") has an unknown labelPlacement — use "below" or "center".`);
    }
    const issue = inertSvgIssue(artwork.toString("utf8"), symbol.file);
    if (issue) fail(issue);
  }
  return catalog.symbols.length;
}

/** Mirrors assertInertSvg() in the app's symbol-stamp generator. */
function inertSvgIssue(source, path) {
  if (source.length > 256 * 1024) return `${path} is larger than the 256 KB artwork limit.`;
  const scanned = source.replace(/<!--[\s\S]*?-->/g, "");
  if (!/<\s*svg[\s>]/i.test(scanned)) return `${path} does not contain an <svg> element.`;
  const checks = [
    [/<\s*script[\s>]/i, "a <script> element"],
    [/<\s*foreignObject[\s>]/i, "a <foreignObject> element"],
    [/<\s*(iframe|embed|object|audio|video)[\s>]/i, "an embedded-content element"],
    [/<\s*(set|animate|animateTransform|animateMotion)[\s>]/i, "an animation element"],
    [/<!ENTITY/i, "an entity declaration"],
    [/\son[a-z]+\s*=/i, "an event-handler attribute"],
    [/javascript\s*:/i, "a javascript: URL"],
    [/(?:xlink:)?href\s*=\s*["'](?!#)/i, "an external reference (href)"],
    [/\burl\s*\(\s*["']?(?!#)/i, "an external reference (url())"],
    [/<\s*(image|use)[\s>][^>]*\bsrc\s*=/i, "an external image reference"]
  ];
  for (const [pattern, what] of checks) {
    if (pattern.test(scanned)) {
      return `${path} contains ${what}. PolyPDF refuses artwork that is more than a drawing — remove it and try again.`;
    }
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

function commandKeygen(args) {
  const outDir = resolve(valueFor(args, "--out") ?? ".");
  mkdirSync(outDir, { recursive: true });
  const privatePath = join(outDir, "polypdf-plugin-key.pem");
  const publicPath = join(outDir, "polypdf-plugin-key.pub");
  if (existsSync(privatePath)) {
    fail(`${privatePath} already exists. Refusing to overwrite a signing key — move it aside first.`);
  }
  const { publicKey, privateKey } = generateKeyPairSync("ed25519");
  const spki = publicKey.export({ type: "spki", format: "der" });
  writeFileSync(privatePath, privateKey.export({ type: "pkcs8", format: "pem" }), { mode: 0o600 });
  writeFileSync(publicPath, `${spki.toString("base64")}\n`);
  console.log(`Wrote ${privatePath}`);
  console.log(`Wrote ${publicPath}`);
  console.log(`Fingerprint: ${fingerprint(spki)}`);
  console.log("");
  console.log("Keep the .pem private and backed up. Users' installs are pinned to this key: if you");
  console.log("lose it, they must uninstall your plugin before they can install a new build.");
}

function commandPack(args) {
  const sourceDir = resolve(args._[0] ?? fail("usage: pack <source-dir> --key <private.pem> [--out <file>]"));
  if (!existsSync(join(sourceDir, "manifest.json"))) {
    fail(`${sourceDir} does not look like a plugin source folder (no manifest.json).`);
  }
  const keyPath = resolve(valueFor(args, "--key") ?? fail("pack needs --key <private.pem> (run `keygen` first)."));
  const privateKeyPem = readFileSync(keyPath, "utf8");

  const entries = collectFiles(sourceDir);
  assertAllowedLayout(entries);
  assertBudgets(entries);

  const manifestEntry = entries.find((entry) => entry.path === "manifest.json");
  let manifest;
  try {
    manifest = JSON.parse(manifestEntry.bytes.toString("utf8"));
  } catch (error) {
    fail(`manifest.json is not valid JSON: ${error.message}`);
  }
  validateManifest(manifest);

  let symbolCount;
  if (manifest.runtime.kind === "symbol-stamp/v1") {
    symbolCount = validateSymbolStampPackage(entries);
  }

  // The signature covers a canonical list of every member and its hash, NOT the ZIP bytes — ZIP
  // output is not reproducible across tools, and a signature over it would break for no reason.
  const files = entries.map((entry) => ({
    path: entry.path,
    sha256: sha256Hex(entry.bytes),
    size: entry.bytes.length
  }));
  const records = [...files]
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0))
    // Byte-exact, and the easiest thing in the whole format to get wrong: the separator is a
    // NUL (U+0000), not a space, the list is sorted by path first, and every record ends in a
    // newline. Written as an escape rather than a literal NUL so this file stays plain text.
    // Authoritative source: canonicalPackageRecords() in packages/plugin-sdk/src/envelope.ts.
    .map((file) => `${file.path}\u0000${file.sha256}\u0000${file.size}\n`)
    .join("");
  const digest = createHash("sha256").update(records, "utf8").digest();
  const signature = ed25519Sign(null, digest, privateKeyPem).toString("base64");
  const spki = createPublicKey(privateKeyPem).export({ type: "spki", format: "der" });

  const envelope = {
    version: 1,
    signer: SIGNER,
    scheme: SCHEME,
    files,
    signature,
    publicKey: spki.toString("base64")
  };
  const zipEntries = [...entries, { path: "signature.json", bytes: Buffer.from(JSON.stringify(envelope, null, 2), "utf8") }];
  const packageBytes = writeZip(zipEntries);

  // Self-check: read the archive back and re-hash every member. A packer that emits something it
  // cannot read is the one failure mode an author has no way to diagnose.
  const readBack = readZip(packageBytes);
  for (const file of files) {
    const found = readBack.find((entry) => entry.path === file.path);
    if (!found) fail(`Internal error: "${file.path}" did not survive packing.`);
    if (sha256Hex(found.bytes) !== file.sha256) fail(`Internal error: "${file.path}" changed during packing.`);
  }

  const outPath = resolve(valueFor(args, "--out") ?? join(process.cwd(), `${manifest.id}.polypdf-plugin`));
  writeFileSync(outPath, packageBytes);

  console.log(`${manifest.name} ${manifest.version} (${manifest.id})`);
  console.log(`  runtime      ${manifest.runtime.kind}${symbolCount === undefined ? "" : ` — ${symbolCount} symbols`}`);
  console.log(`  permissions  ${manifest.permissions.length === 0 ? "(none)" : manifest.permissions.join(", ")}`);
  console.log(`  members      ${zipEntries.length}`);
  console.log(`  signed by    ${fingerprint(spki)}`);
  console.log(`  package      ${outPath} (${humanBytes(packageBytes.length)})`);
  console.log(`  sha256       ${sha256Hex(packageBytes)}`);
  console.log("");
  console.log("Install it with PolyPDF ▸ Plugins… ▸ Install from File.");
}

function commandInspect(args) {
  const path = resolve(args._[0] ?? fail("usage: inspect <file.polypdf-plugin>"));
  const bytes = readFileSync(path);
  const entries = readZip(bytes);
  const byPath = new Map(entries.map((entry) => [entry.path, entry.bytes]));
  const manifestBytes = byPath.get("manifest.json") ?? fail("No manifest.json in the package.");
  const signatureBytes = byPath.get("signature.json") ?? fail("No signature.json in the package.");
  const manifest = JSON.parse(manifestBytes.toString("utf8"));
  const envelope = JSON.parse(signatureBytes.toString("utf8"));

  console.log(`${manifest.name} ${manifest.version} (${manifest.id})`);
  console.log(`  publisher    ${manifest.publisher}`);
  console.log(`  runtime      ${manifest.runtime?.kind}`);
  console.log(`  permissions  ${(manifest.permissions ?? []).join(", ") || "(none)"}`);
  console.log(`  commands     ${(manifest.commands ?? []).map((command) => command.id).join(", ") || "(none)"}`);
  console.log(`  signer       ${envelope.signer}`);
  console.log(`  package      ${humanBytes(bytes.length)}`);
  console.log(`  sha256       ${sha256Hex(bytes)}`);

  let keyOk = "n/a";
  if (envelope.signer === SIGNER && typeof envelope.publicKey === "string") {
    console.log(`  author key   ${fingerprint(Buffer.from(envelope.publicKey, "base64"))}`);
    keyOk = "embedded";
  }

  // Re-verify the member hashes the way the installer does. This is what turns `inspect` from a
  // pretty-printer into a check you can run on a package someone sent you.
  let mismatches = 0;
  for (const entry of entries) {
    if (entry.path === "signature.json") continue;
    const declared = (envelope.files ?? []).find((file) => file.path === entry.path);
    if (!declared) {
      console.log(`  ! "${entry.path}" is not covered by the signature envelope`);
      mismatches += 1;
      continue;
    }
    if (declared.sha256 !== sha256Hex(entry.bytes) || declared.size !== entry.bytes.length) {
      console.log(`  ! "${entry.path}" does not match its declared hash or size`);
      mismatches += 1;
    }
  }
  const covered = (envelope.files ?? []).length;
  if (covered !== entries.length - 1) {
    console.log(`  ! the envelope covers ${covered} members but the package holds ${entries.length - 1}`);
    mismatches += 1;
  }
  console.log(`  members      ${entries.length} (${mismatches === 0 ? "all hashes match" : `${mismatches} PROBLEM(S)`}, key ${keyOk})`);
  if (mismatches > 0) process.exitCode = 1;
}

// ---------------------------------------------------------------------------
// Argument plumbing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token.startsWith("--")) {
      args[token] = argv[index + 1]?.startsWith("--") ? true : argv[++index];
    } else {
      args._.push(token);
    }
  }
  return args;
}

function valueFor(args, flag) {
  const value = args[flag];
  return typeof value === "string" ? value : undefined;
}

const USAGE = `polypdf-plugin-pack — build and sign .polypdf-plugin packages

  node polypdf-plugin-pack.mjs keygen [--out <dir>]
      Generate an Ed25519 signing keypair. Do this once, then keep the .pem safe.

  node polypdf-plugin-pack.mjs pack <source-dir> --key <private.pem> [--out <file>]
      Validate the source folder, then write a signed package.

  node polypdf-plugin-pack.mjs inspect <file.polypdf-plugin>
      Print what a package contains and re-check every member hash.

Full guide: docs/plugins/PLUGIN-AUTHORING.md`;

function main() {
  const [command, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  try {
    switch (command) {
      case "keygen":
        commandKeygen(args);
        break;
      case "pack":
        commandPack(args);
        break;
      case "inspect":
        commandInspect(args);
        break;
      case "--help":
      case "-h":
      case undefined:
        console.log(USAGE);
        break;
      default:
        console.error(`Unknown command "${command}".\n`);
        console.error(USAGE);
        process.exitCode = 2;
    }
  } catch (error) {
    if (error instanceof PackError) {
      console.error(`error: ${error.message}`);
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

main();
