import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useNavigate } from "react-router";
import { ArrowRight, ArrowUp, ArrowDown, Check, DownloadSimple, FilePdf, LockSimple, MagnifyingGlass, UploadSimple, X, Code, CaretLeft, CaretRight } from "@phosphor-icons/react";
import GrowthNav from "./GrowthNav";
import catalog from "../toolkit/catalog.json";
import pageContent from "../toolkit/page-content.json";
import { trackEvent } from "../lib/analytics";
import { buyPath } from "../lib/attribution";
import "./PdfTools.css";
import PdfToolIcon from './PdfToolIcon';
import { ToolkitHeader } from './ToolkitChrome';
import { useToolkitLanguage, localizeView, localizedHref, translateText } from '../toolkit/language';
const groups = ["All tools", ...new Set(catalog.map(t => t.category))];
const defaults = tool => Object.fromEntries(tool.fields.map(f => [f.key, f.default]));
const bytesLabel = n => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;
const toolkitPath = id => `/tools/${id}/`;
let retainedFiles = [];
const previewUrl = file => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error("Could not read preview."));
  reader.readAsDataURL(new Blob([file.bytes], {
    type: file.type
  }));
});
const runtime = () => Promise.all([import("../toolkit/engine.mjs"), import("../toolkit/browser-runtime")]);
function ToolsHeader() {
  const language = useToolkitLanguage();
  return language ? <ToolkitHeader /> : <GrowthNav />;
}
function PrivacyLine() {
  const language = useToolkitLanguage();
  return localizeView(<p className="pdf-privacy">
      <LockSimple size={16} aria-hidden="true" /> Files are processed on this
      device. No upload, account, or subscription.
    </p>, language);
}
export function PdfToolsHub() {
  const language = useToolkitLanguage();
  const [query, setQuery] = useState(""),
    [group, setGroup] = useState("All tools");
  const results = catalog.filter(t => (group === "All tools" || t.category === group) && `${t.name} ${t.summary} ${t.category} ${translateText(t.name, language)} ${translateText(t.summary, language)}`.toLowerCase().includes(query.toLowerCase().trim()));
  return localizeView(<div className="pdf-tools">
      <ToolsHeader />
      <main className="pdf-shell">
        <section className="pdf-hub-hero">
          <div>
            <p className="pdf-eyebrow">POLYPDF / BROWSER TOOLS</p>
            <h1>
              Free online PDF tools.
              <br />
              <span>Made for real work.</span>
            </h1>
            <p className="pdf-lead">
              36 free tools for the files on your desk. Combine a drawing set,
              fill a form, or prepare a review copy—right in your browser.
            </p>
            <PrivacyLine />
            <a className="pdf-primary" href="#all-pdf-tools">
              Find your tool <ArrowRight size={19} />
            </a>
          </div>
          <div className="pdf-hero-sheet" aria-label="Popular PDF workflows">
            <div className="pdf-sheet-heading">
              <FilePdf size={29} />
              <span>FROM FILE TO FINISHED</span>
              <strong>36</strong>
            </div>
            <Link to={toolkitPath("merge-pdf")}>
              <span className="pdf-step-number">01</span>
              <span>
                <strong>Bring it together</strong>
                <small>Merge & organize pages</small>
              </span>
              <ArrowRight />
            </Link>
            <Link to={toolkitPath("fill-pdf-form")}>
              <span className="pdf-step-number">02</span>
              <span>
                <strong>Make it ready</strong>
                <small>Fill, label & prepare</small>
              </span>
              <ArrowRight />
            </Link>
            <Link to={toolkitPath("pdf-to-png")}>
              <span className="pdf-step-number">03</span>
              <span>
                <strong>Send the right format</strong>
                <small>Convert & download</small>
              </span>
              <ArrowRight />
            </Link>
            <div className="pdf-sheet-footer">
              <span className="pdf-status-dot" /> Your files stay yours.
            </div>
          </div>
        </section>
        <section id="all-pdf-tools" className="pdf-directory" aria-labelledby="pdf-directory-title">
          <div className="pdf-directory-heading">
            <div>
              <p className="pdf-eyebrow">THE TOOLBOX</p>
              <h2 id="pdf-directory-title">What needs doing?</h2>
            </div>
            <label className="pdf-search">
              <MagnifyingGlass size={21} />
              <span className="sr-only">Search PDF tools</span>
              <input type="search" placeholder="Search tools…" value={query} onChange={e => setQuery(e.target.value)} />
            </label>
          </div>
          <div className="pdf-filters" aria-label="Tool categories">
            {groups.map(g => <button key={g} aria-pressed={group === g} onClick={() => setGroup(g)}>
                {g}
              </button>)}
          </div>
          <p className="pdf-results-count" role="status">
            {results.length} tools{query ? ` matching “${query}”` : ""}
          </p>
          <div className="pdf-tool-grid">
            {results.map(t => <Link className="pdf-tool-card" to={toolkitPath(t.id)} key={t.id}>
                <div className="pdf-card-top">
                  <PdfToolIcon id={t.id} />
                  <span>{t.category}</span>
                  <ArrowRight size={18} />
                </div>
                <h3>{t.name}</h3>
                <p>{t.summary}</p>
              </Link>)}
          </div>
          {!results.length && <div className="pdf-empty">
              <h3>No tools match that search.</h3>
              <p>Try “merge”, “pages”, “form”, or “text”.</p>
              <button onClick={() => {
            setQuery("");
            setGroup("All tools");
          }}>
                Show all tools
              </button>
            </div>}
        </section>
        <section className="pdf-bottom-grid">
          <div>
            <p className="pdf-eyebrow">BUILT FOR REAL WORK</p>
            <h2>Construction PDFs deserve a little more.</h2>
            <p>
              Prepare the file here. For calibrated measurements, quantity
              takeoff, drawing overlays, and detailed markup, continue in
              PolyPDF for Mac and Windows.
            </p>
            <Link to="/pdf-takeoff-software/">
              Explore the desktop workspace <ArrowRight size={17} />
            </Link>
            <div className="pdf-resource-links">
              <Link to="/tools/pdf-scale-checker/">Scale checker</Link>
              <Link to="/tools/flooring-waste-calculator/">
                Flooring calculator
              </Link>
              <Link to="/tools/construction-takeoff-spreadsheet/">
                Takeoff spreadsheet
              </Link>
            </div>
          </div>
          <div className="pdf-agent-card">
            <Code size={30} />
            <h2>Tools your AI can actually use.</h2>
            <p>
              The same operations have structured inputs, explicit limits, and
              downloadable results. Connect the local MCP server, or use
              supported browser agents.
            </p>
            <Link to="/tools/automation/">
              AI & MCP setup <ArrowRight size={17} />
            </Link>
          </div>
        </section>
        <section className="pdf-answers">
          <h2>Free online PDF tools, with clear limits</h2>
          <details>
            <summary>Are these PDF tools free?</summary>
            <p>
              Yes. All 36 browser tools are free to use without an account.
              There is no daily download counter. Resource limits are 30 MB per
              file, 80 MB combined input, and 500 PDF pages; image rendering is
              limited to 100 pages per operation and 16 megapixels per page.
            </p>
          </details>
          <details>
            <summary>Do my PDFs leave my device?</summary>
            <p>
              The browser tools process files in memory on your device and do
              not upload them to PolyPDF. Clear files or close the tab when you
              finish. Downloads remain wherever you save them. The separate
              hosted PolyPDF connector has its own server-processing and
              retention policy.
            </p>
          </details>
          <details>
            <summary>Can I edit signed or protected PDFs?</summary>
            <p>
              Password-protected PDFs are unsupported. Editing tools reject
              digitally signed PDFs to avoid invalidating signatures. Keep the
              original and work from an authorized unsigned copy.
            </p>
          </details>
          <details>
            <summary>Do these tools replace the desktop app?</summary>
            <p>
              These are focused file-preparation tools. Calibrated measurement,
              quantity takeoff, drawing overlays, advanced editing, OCR, and
              digital signing belong to the desktop workflow.
            </p>
          </details>
        </section>
      </main>
    </div>, language);
}
function OptionField({
  field,
  value,
  onChange
}) {
  const language = useToolkitLanguage();
  const id = `pdf-option-${field.key}`;
  if (field.type === "checkbox") return localizeView(<label className="pdf-check" htmlFor={id}>
        <input id={id} type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} />
        {field.label}
      </label>, language);
  return localizeView(<div className="pdf-field">
      <label htmlFor={id}>{field.label}</label>
      {field.type === "select" ? <select id={id} value={value} onChange={e => onChange(e.target.value)}>
          {field.options.map(v => <option value={v} key={v}>
              {v}
            </option>)}
        </select> : field.type === "textarea" ? <textarea id={id} rows={8} value={value} maxLength={field.maxLength} onChange={e => onChange(e.target.value)} /> : <input id={id} type={field.type} min={field.min} max={field.max} maxLength={field.maxLength} step={field.type === "number" ? "any" : undefined} value={value} onChange={e => onChange(e.target.value)} />}{" "}
      {field.help && <small>{field.help}</small>}
    </div>, language);
}
function PdfPreview({
  file,
  label = "Document preview",
  page,
  setPage
}) {
  const language = useToolkitLanguage();
  const [url, setUrl] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  useEffect(() => {
    let disposed = false,
      objectUrl,
      adapter;
    setUrl("");
    setError("");
    if (!file) return undefined;
    setLoading(true);
    (async () => {
      try {
        if (file.type?.startsWith("image/")) objectUrl = await previewUrl(file);else {
          const [, r] = await runtime();
          adapter = await r.browserAdapter();
          const result = await adapter.render(file.bytes, page, {
            format: "png",
            dpi: 60
          });
          objectUrl = await previewUrl({
            bytes: result.bytes,
            type: "image/png"
          });
        }
        if (!disposed) setUrl(objectUrl);
      } catch (e) {
        if (!disposed) setError(`Preview unavailable: ${e.message}`);
      } finally {
        await adapter?.dispose();
        if (!disposed) setLoading(false);else if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    })();
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file, page]);
  return localizeView(<section className="pdf-preview" aria-label={label}>
      <div className="pdf-preview-bar">
        <strong>{label}</strong>
        {file?.pageCount > 1 && <div>
            <button aria-label="Previous page" disabled={page === 0} onClick={() => setPage(page - 1)}>
              <CaretLeft />
            </button>
            <span>
              {page + 1} / {file.pageCount}
            </span>
            <button aria-label="Next page" disabled={page >= file.pageCount - 1} onClick={() => setPage(page + 1)}>
              <CaretRight />
            </button>
          </div>}
      </div>
      <div className="pdf-preview-paper">
        {loading ? <div className="pdf-preview-skeleton" role="status">
            Preparing preview…
          </div> : error ? <p role="status">{error}</p> : url ? <img src={url} alt={`${label}, page ${page + 1}`} /> : <div className="pdf-preview-empty">
            <FilePdf size={48} />
            <p>Your PDF preview appears here.</p>
            <small>Choose a file or try the sample.</small>
          </div>}
      </div>
    </section>, language);
}
function Workspace({
  tool
}) {
  const language = useToolkitLanguage();
  const navigate = useNavigate();
  const [files, setFiles] = useState(() => retainedFiles.filter(f => tool.types.includes(f.kind)).slice(0, tool.maxFiles));
  const [options, setOptions] = useState(() => defaults(tool)),
    [values, setValues] = useState({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [progress, setProgress] = useState(null),
    [result, setResult] = useState(null),
    [outputUrls, setOutputUrls] = useState([]),
    [page, setPage] = useState(0),
    [drag, setDrag] = useState(false);
  const input = useRef(),
    resultHeading = useRef(),
    generation = useRef(0),
    latest = useRef();
  const first = files[0],
    fields = first?.info?.fields || [];
  useEffect(() => {
    retainedFiles = files;
  }, [files]);
  useEffect(() => {
    setResult(null);
    setPage(0);
  }, [files, options, values]);
  useEffect(() => {
    const urls = result?.outputs.map(f => URL.createObjectURL(new Blob([f.bytes], {
      type: f.type
    }))) || [];
    setOutputUrls(urls);
    return () => urls.forEach(u => URL.revokeObjectURL(u));
  }, [result]);
  useEffect(() => () => {
    generation.current++;
  }, []);
  useEffect(() => {
    if (result) resultHeading.current?.focus();
  }, [result]);
  async function addFiles(list) {
    if (busy) return;
    setError("");
    const token = ++generation.current;
    setBusy(true);
    try {
      const [engine] = await runtime();
      const added = [];
      let total = 0;
      for (const file of Array.from(list)) {
        if (file.size > engine.LIMITS.fileBytes) throw new Error("Each file must be 30 MB or smaller.");
        total += file.size;
        if (total > engine.LIMITS.totalBytes) throw new Error("Keep the combined input below 80 MB.");
        const bytes = new Uint8Array(await file.arrayBuffer()),
          kind = engine.fileKind(bytes);
        if (!tool.types.includes(kind)) throw new Error(`Choose ${tool.types.join(", ")} files for this tool.`);
        const info = kind === "pdf" ? await engine.inspectPdf(bytes) : null;
        added.push({
          id: crypto.randomUUID(),
          name: file.name,
          bytes,
          kind,
          type: kind === "pdf" ? "application/pdf" : kind === "jpg" ? "image/jpeg" : `image/${kind}`,
          pageCount: info?.pageCount,
          info
        });
      }
      const next = tool.maxFiles === 1 ? added.slice(-1) : [...files, ...added];
      if (next.length > tool.maxFiles) throw new Error(`This tool accepts up to ${tool.maxFiles} files. Remove a file first.`);
      if (next.reduce((n, f) => n + f.bytes.length, 0) > engine.LIMITS.totalBytes) throw new Error("Keep combined input below 80 MB.");
      if (token === generation.current) {
        setFiles(next);
        setValues({});
        if (tool.id === "organize-pdf" && next[0]) setOptions(o => ({
          ...o,
          order: Array.from({
            length: next[0].pageCount
          }, (_, i) => i + 1).join(", ")
        }));
      }
    } catch (e) {
      if (token === generation.current) setError(e.message);
    } finally {
      if (token === generation.current) setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  async function run(explicit) {
    if (busy) throw new Error("An operation is already running.");
    const token = ++generation.current;
    setBusy(true);
    setError("");
    setResult(null);
    setProgress({
      stage: "Preparing",
      percent: 0
    });
    let adapter;
    try {
      const [engine, r] = await runtime();
      adapter = await r.browserAdapter();
      const opts = explicit?.options || {
        ...options,
        ...(tool.id === "fill-pdf-form" ? {
          values
        } : {})
      };
      const chosen = explicit?.fileIds ? explicit.fileIds.map(id => {
        const f = files.find(f => f.id === id);
        if (!f) throw new Error("Unknown file handle. Choose the file in this tab first.");
        return f;
      }) : files;
      const data = await engine.runTool(tool, chosen, opts, adapter, p => {
        if (token === generation.current) setProgress(p);
      });
      for (const out of data.outputs) if (out.type === "application/pdf") {
        out.info = await engine.inspectPdf(out.bytes);
        out.pageCount = out.info.pageCount;
      }
      if (token === generation.current) {
        setResult(data);
        setPage(0);
        trackEvent("browser_tool_complete", {
          source: "browser_tools",
          feature: tool.id
        });
      }
      return {
        tool: tool.id,
        summary: data.summary,
        warnings: data.warnings,
        outputs: data.outputs.map((f, i) => ({
          index: i,
          name: f.name,
          type: f.type,
          bytes: f.bytes.length
        })),
        download: "Use the visible Download controls to save results."
      };
    } catch (e) {
      if (token === generation.current) setError(e.message);
      throw e;
    } finally {
      await adapter?.dispose();
      if (token === generation.current) {
        setBusy(false);
        setProgress(null);
      }
    }
  }
  latest.current = {
    run,
    files,
    busy
  };
  useEffect(() => {
    const context = navigator.modelContext;
    if (!context?.registerTool) return undefined;
    const name = `polypdf_${tool.id.replaceAll("-", "_")}`;
    const properties = {
      fileIds: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Handles from polypdf_list_files. Files must first be chosen by the user."
      },
      options: {
        type: "object",
        properties: Object.fromEntries(tool.fields.map(f => [f.key, {
          type: f.type === "number" ? "number" : f.type === "checkbox" ? "boolean" : "string",
          description: [f.label, f.help].filter(Boolean).join(". "),
          default: f.default,
          ...(f.options ? {
            enum: f.options
          } : {}),
          ...(f.min !== undefined ? {
            minimum: f.min,
            maximum: f.max
          } : {}),
          ...(f.maxLength ? {
            maxLength: f.maxLength
          } : {})
        }])),
        additionalProperties: false
      }
    };
    if (tool.id === "fill-pdf-form") properties.options.properties.values = {
      type: "object",
      description: "Exact field names mapped to text, boolean, or listed choice values. Use polypdf_list_files to inspect fields.",
      additionalProperties: {
        anyOf: [{
          type: "string",
          maxLength: 10000
        }, {
          type: "boolean"
        }, {
          type: "array",
          items: {
            type: "string"
          }
        }]
      }
    };
    const registered = [];
    const cleanup = () => registered.forEach(id => context.unregisterTool?.(id));
    try {
      context.registerTool({
        name: "polypdf_list_files",
        description: "List PDF/image handles the user has chosen in this tab. Never reads arbitrary local files.",
        inputSchema: {
          type: "object",
          properties: {}
        },
        execute: async () => JSON.stringify(latest.current.files.map(({
          id,
          name,
          kind,
          pageCount,
          info
        }) => ({
          id,
          name,
          kind,
          pageCount,
          fields: info?.fields
        })))
      });
      registered.push("polypdf_list_files");
      context.registerTool({
        name,
        description: tool.answer + " " + tool.limitation,
        inputSchema: {
          type: "object",
          properties,
          additionalProperties: false
        },
        execute: async args => JSON.stringify(await latest.current.run(args))
      });
      registered.push(name);
    } catch {
      cleanup();
      return undefined;
    }
    return cleanup;
  }, [tool]);
  const preview = result?.outputs.find(f => f.type === "application/pdf" || f.type?.startsWith("image/")) || files.find(f => f.kind === "pdf" || f.type?.startsWith("image/"));
  const downloadAll = async () => {
    try {
      const {
          default: JSZip
        } = await import("jszip"),
        zip = new JSZip();
      result.outputs.forEach(f => zip.file(f.name, f.bytes));
      const blob = await zip.generateAsync({
          type: "blob"
        }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = `polypdf-${tool.id}.zip`;
      a.click();
      trackEvent("browser_tool_download", {
        source: "browser_tools",
        feature: tool.id,
        target: "zip"
      });
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setError("Could not create the ZIP. Download the files individually.");
    }
  };
  const trySample = async () => {
    try {
      setError("");
      const form = tool.category === "Forms";
      const path = form ? "/samples/forms/construction-review-form-en.pdf" : "/samples/construction/02-Architectural-Revision-A.pdf";
      const response = await fetch(path);
      if (!response.ok) throw new Error("Sample unavailable. Choose a file from your device.");
      await addFiles([new File([await response.blob()], form ? "construction-review-form.pdf" : "Willow-Creek-Architectural-A.pdf", {
        type: "application/pdf"
      })]);
    } catch (e) {
      setError(e.message);
    }
  };
  const moveFile = (i, delta) => setFiles(fs => {
    const next = [...fs];
    [next[i], next[i + delta]] = [next[i + delta], next[i]];
    return next;
  });
  const order = tool.id === "organize-pdf" ? (options.order || "").split(",").map(n => n.trim()).filter(Boolean) : [];
  return localizeView(<section className="pdf-workspace" id="workspace" aria-label={`${tool.name} workspace`}>
      <div className="pdf-work-controls">
        <div className="pdf-control-title">
          <span className="pdf-step-number">01</span>
          <h2>{tool.minFiles ? "Choose files" : "Add your text"}</h2>
          {files.length > 0 && <button className="pdf-text-button" disabled={busy} onClick={() => {
          setFiles([]);
          setValues({});
          setError("");
        }}>
              Clear files
            </button>}
        </div>
        {tool.maxFiles > 0 && <>
            <div className={`pdf-dropzone ${drag ? "is-dragging" : ""}`} onDragOver={e => {
          e.preventDefault();
          if (!busy) setDrag(true);
        }} onDragLeave={() => setDrag(false)} onDrop={e => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}>
              <UploadSimple size={30} />
              <button className="pdf-primary" disabled={busy} onClick={() => input.current.click()}>
                {files.length && tool.maxFiles === 1 ? "Replace file" : "Choose files"}
              </button>
              <span>or drop files here</span>
              <small>
                {tool.types.join(" / ").toUpperCase()} · Up to 30 MB per file
              </small>
              <input ref={input} type="file" multiple={tool.maxFiles > 1} accept={tool.types.map(t => t === "jpg" ? ".jpg,.jpeg" : `.${t}`).join(",")} aria-label="Choose source files" className="pdf-file-input" onChange={e => addFiles(e.target.files)} />
            </div>
            {tool.types.length === 1 && tool.types[0] === "pdf" && <button className="pdf-sample" disabled={busy} onClick={trySample}>
                Try a{" "}
                {tool.category === "Forms" ? "fillable form" : "construction drawing"}{" "}
                sample
              </button>}
            <ul className="pdf-file-list">
              {files.map((f, i) => <li key={f.id}>
                  <FilePdf size={23} />
                  <span>
                    <strong translate="no" dir="auto">{f.name}</strong>
                    <small>
                      {bytesLabel(f.bytes.length)}
                      {f.pageCount ? ` · ${f.pageCount} pages` : ""}
                    </small>
                  </span>
                  <div>
                    {files.length > 1 && <>
                        <button disabled={busy || i === 0} aria-label={`Move ${f.name} up`} onClick={() => moveFile(i, -1)}>
                          <ArrowUp />
                        </button>
                        <button disabled={busy || i === files.length - 1} aria-label={`Move ${f.name} down`} onClick={() => moveFile(i, 1)}>
                          <ArrowDown />
                        </button>
                      </>}
                    <button disabled={busy} aria-label={`Remove ${f.name}`} onClick={() => setFiles(fs => fs.filter(x => x.id !== f.id))}>
                      <X />
                    </button>
                  </div>
                </li>)}
            </ul>
          </>}
        <fieldset disabled={busy} className="pdf-settings">
          <legend>
            <span className="pdf-step-number">02</span>{" "}
            {tool.fields.length || tool.id === "fill-pdf-form" ? "Set it up" : "Ready when you are"}
          </legend>
          {tool.fields.map(f => <OptionField key={f.key} field={f} value={options[f.key]} onChange={v => setOptions(o => ({
          ...o,
          [f.key]: v
        }))} />)}
          {order.length > 0 && order.length <= 80 && <div className="pdf-page-order" aria-label="Page order">
              {order.map((p, i) => <div key={`${i}-${p}`}>
                  <span>Page {p}</span>
                  <button type="button" aria-label={`Move page ${p} earlier`} disabled={i === 0} onClick={() => {
              const next = [...order];
              [next[i], next[i - 1]] = [next[i - 1], next[i]];
              setOptions(o => ({
                ...o,
                order: next.join(", ")
              }));
            }}>
                    <ArrowUp />
                  </button>
                  <button type="button" aria-label={`Move page ${p} later`} disabled={i === order.length - 1} onClick={() => {
              const next = [...order];
              [next[i], next[i + 1]] = [next[i + 1], next[i]];
              setOptions(o => ({
                ...o,
                order: next.join(", ")
              }));
            }}>
                    <ArrowDown />
                  </button>
                </div>)}
            </div>}
          {tool.id === "fill-pdf-form" && (!fields.length ? <p>Choose a standard fillable PDF to see its fields.</p> : fields.map(f => {
          const supported = ["PDFTextField", "PDFCheckBox", "PDFDropdown", "PDFRadioGroup", "PDFOptionList"].includes(f.type);
          return <div className="pdf-field" key={f.name}>
                    <label htmlFor={`form-${f.name}`}>
                      <bdi translate="no">{f.name}</bdi>
                      {f.readOnly ? " (read-only)" : ""}
                    </label>
                    {f.type === "PDFCheckBox" ? <input id={`form-${f.name}`} type="checkbox" disabled={f.readOnly} checked={values[f.name] ?? f.value ?? false} onChange={e => setValues(v => ({
              ...v,
              [f.name]: e.target.checked
            }))} /> : f.options.length ? <select id={`form-${f.name}`} disabled={f.readOnly} multiple={f.multiple} value={values[f.name] ?? (f.multiple ? f.value || [] : Array.isArray(f.value) ? f.value[0] : f.value) ?? (f.multiple ? [] : "")} onChange={e => setValues(v => ({
              ...v,
              [f.name]: f.multiple ? Array.from(e.target.selectedOptions, option => option.value) : e.target.value
            }))}>
                        {!f.multiple && <option value="" disabled>
                          Choose an option
                        </option>}
                        {f.options.map(v => <option key={v} value={v} translate="no">{v}</option>)}
                      </select> : f.multiline ? <textarea id={`form-${f.name}`} rows={4} disabled={f.readOnly} maxLength={Math.min(f.maxLength ?? 10000, 10000)} value={values[f.name] ?? f.value ?? ""} onChange={e => setValues(v => ({
              ...v,
              [f.name]: e.target.value
            }))} /> : <input id={`form-${f.name}`} disabled={f.readOnly || !supported} maxLength={Math.min(f.maxLength ?? 10000, 10000)} value={values[f.name] ?? f.value ?? ""} onChange={e => setValues(v => ({
              ...v,
              [f.name]: e.target.value
            }))} />}
                  </div>;
        }))}
        </fieldset>
        <p className="pdf-limit">{tool.limitation}</p>
        {error && <div className="pdf-error" role="alert">
            {error}
          </div>}
        {busy && <div className="pdf-progress" role="status">
            <span>{progress?.stage || "Reading files…"}</span>
            <progress max="100" value={progress?.percent || 5} />
          </div>}
        <button className="pdf-primary pdf-run" disabled={busy || files.length < tool.minFiles} onClick={() => run().catch(() => {})}>
          {busy ? "Working…" : tool.name}
          <ArrowRight size={18} />
        </button>
        <PrivacyLine />
      </div>
      <div className="pdf-work-result">
        {result && <section className="pdf-result" aria-label="Finished result">
            <div>
              <Check size={24} />
              <h2 ref={resultHeading} tabIndex={-1}>
                Your result is ready
              </h2>
            </div>
            <p>
              {result.outputs.length}{" "}
              {result.outputs.length === 1 ? "file" : "files"} ·{" "}
              {bytesLabel(result.summary.outputBytes)}
              {tool.id === "compress-pdf" ? ` · Original ${bytesLabel(result.summary.inputBytes)}` : ""}
            </p>
            {result.warnings.map(w => <p className="pdf-limit" key={w}>
                {w}
              </p>)}
            {result.outputs.length > 1 && <button className="pdf-primary" onClick={downloadAll}>
                Download all as ZIP <DownloadSimple />
              </button>}
            <ul>
              {result.outputs.map((f, i) => <li key={f.name}>
                  <a href={outputUrls[i]} download={f.name} onClick={() => trackEvent("browser_tool_download", {
              source: "browser_tools",
              feature: tool.id
            })}>
                    <DownloadSimple size={18} />
                    <bdi translate="no">{f.name}</bdi>
                    <small>{bytesLabel(f.bytes.length)}</small>
                  </a>
                </li>)}
            </ul>
            {result.outputs.length === 1 && /json|text\/plain/.test(result.outputs[0].type) && <pre className="pdf-text-output" tabIndex={0}>
                  {new TextDecoder().decode(result.outputs[0].bytes).slice(0, 20000)}
                </pre>}
            {result.outputs.length === 1 && result.outputs[0].type === "application/pdf" && <button className="pdf-primary" onClick={() => {
          retainedFiles = [{
            ...result.outputs[0],
            id: crypto.randomUUID(),
            kind: "pdf"
          }];
          navigate(localizedHref("/tools/", language));
        }}>
                  Use this PDF in another tool <ArrowRight size={18} />
                </button>}
            <p className="pdf-result-next">
              Need another step? <Link to="/tools/">Choose another tool</Link>.
              Your source files stay in this tab until cleared.
            </p>
          </section>}
        <PdfPreview file={preview} label={result ? "Result preview" : "Source preview"} page={page} setPage={setPage} />
        {first?.info && tool.id === "inspect-pdf" && <p>
            {first.info.pageCount} pages · First page{" "}
            {first.info.pages[0].width.toFixed(1)} ×{" "}
            {first.info.pages[0].height.toFixed(1)} points
          </p>}
      </div>
    </section>, language);
}
export function PdfToolPage() {
  const language = useToolkitLanguage();
  const {
    toolId
  } = useParams();
  const tool = catalog.find(t => t.id === toolId);
  if (!tool) return localizeView(<PdfToolsHub />, language);
  const content = pageContent[tool.id];
  return localizeView(<div className="pdf-tools">
      <ToolsHeader />
      <main className="pdf-shell">
        <nav className="pdf-breadcrumb" aria-label="Breadcrumb">
          <Link to="/tools/">All PDF tools</Link>
          <span>/</span>
          <span>{tool.name}</span>
        </nav>
        <header className="pdf-tool-heading">
          <div>
            <p className="pdf-eyebrow">
              {tool.category.toUpperCase()} / FREE BROWSER TOOL
            </p>
            <div className="pdf-heading-icon"><PdfToolIcon id={tool.id} size={46} /><h1>{content.heading || `${tool.name} online`}</h1></div>
            <p>{tool.summary}</p>
          </div>
          <span className="pdf-local-badge">
            <LockSimple size={17} /> On your device
          </span>
        </header>
        <Workspace key={tool.id} tool={tool} />
        <section className="pdf-tool-guide">
          <div>
            <h2>How to use {tool.name}</h2>
            <p className="pdf-answer">{tool.answer}</p>
            <ol>
              {tool.steps.map(s => <li key={s}>{s}</li>)}
            </ol>
            <h2>A practical example</h2>
            <p>{content.example}</p>
          </div>
          <div className="pdf-tool-note">
            <h2>Good to know</h2>
            <p>{tool.limitation}</p>
            <p>
              Keep your original. Review the downloaded result before issuing,
              printing, or replacing a project file.
            </p>
          </div>
        </section>
        <section className="pdf-answers">
          <h2>About {tool.name}</h2>
          {content.faqs.map(([question, answer]) => <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>)}
          <details>
            <summary>Is this tool free, and do files get uploaded?</summary>
            <p>
              Yes. This tool runs locally in your browser without an account.
              PolyPDF does not receive your input files. Downloads are saved
              only when you choose to save them.
            </p>
          </details>
          <details>
            <summary>What files and limits does this tool support?</summary>
            <p>
              {tool.minFiles ? `Choose ${tool.minFiles === tool.maxFiles ? tool.minFiles : `${tool.minFiles}–${tool.maxFiles}`} ${tool.types.join("/").toUpperCase()} files. ` : "Enter plain text. "}
              The toolkit supports up to 30 MB per file, 80 MB total input, and
              500 PDF pages. Image rendering is limited to 100 pages per
              operation and 16 megapixels per page. Password-protected files are
              unsupported; editing signed files is blocked.
            </p>
          </details>
          <details>
            <summary>Can an AI assistant use this tool?</summary>
            <p>
              Yes. The downloadable local MCP server exposes the same operation
              and validation rules. Compatible browser agents can use the
              selected files through WebMCP when their browser supports it.{" "}
              <Link to="/tools/automation/">
                Read the setup and privacy details
              </Link>
              .
            </p>
          </details>
        </section>
        <section className="pdf-related">
          <h2>Keep working</h2>
          <div className="pdf-tool-grid">
            {content.related.map(id => {
            const t = catalog.find(x => x.id === id);
            return <Link className="pdf-tool-card" key={id} to={toolkitPath(id)}>
                  <PdfToolIcon id={t.id} /><h3>{t.name}</h3>
                  <p>{t.summary}</p>
                  <ArrowRight />
                </Link>;
          })}
          </div>
        </section>
        <section className="pdf-desktop-cta">
          <div>
            <p className="pdf-eyebrow">WHEN THE FILE IS A DRAWING</p>
            <h2>Measure, take off, and review in PolyPDF.</h2>
            <p>
              Continue with calibrated measurements and construction markup on
              Mac and Windows.
            </p>
          </div>
          <div>
            <Link className="pdf-primary" to="/#download">
              Get PolyPDF
            </Link>
            <Link to={buyPath("browser_tools")}>
              Compare Pro pricing <ArrowRight size={17} />
            </Link>
          </div>
        </section>
      </main>
    </div>, language);
}
export function PdfAutomationPage() {
  const language = useToolkitLanguage();
  return localizeView(<div className="pdf-tools">
      <ToolsHeader />
      <main className="pdf-shell pdf-automation">
        <nav className="pdf-breadcrumb" aria-label="Breadcrumb">
          <Link to="/tools/">All PDF tools</Link>
          <span>/</span>
          <span>AI & MCP</span>
        </nav>
        <p className="pdf-eyebrow">FOR PEOPLE AND THEIR AGENTS</p>
        <h1>
          36 PDF tools.
          <br />
          One predictable interface.
        </h1>
        <p className="pdf-lead">
          Use the same PDF operations in the browser or through a local Model
          Context Protocol (MCP) server. Typed inputs, bounded file access,
          useful errors, and result checksums make automation easier to review.
        </p>
        <a className="pdf-primary" href="/tools/mcp/polypdf-browser-tools-mcp.zip" download>
          Download the MCP toolkit <DownloadSimple />
        </a>
        <section>
          <h2>Connect a local MCP client</h2>
          <ol>
            <li>
              Download and extract the toolkit. Install Node.js 22.13 or newer.
            </li>
            <li>
              In the extracted folder, run <code>npm ci</code>.
            </li>
            <li>
              Create a folder for the PDFs you want the assistant to access.
              Give the server only that folder with <code>--root</code>.
            </li>
            <li>
              Add the configuration below to a client that supports local MCP
              servers. Replace both example paths with your own absolute paths.
            </li>
            <li>
              Ask the assistant to list tools, inspect the PDF, run the chosen
              operation, and check the returned output path and SHA-256
              checksum.
            </li>
          </ol>
          <pre tabIndex={0}>
            {JSON.stringify({
            mcpServers: {
              "polypdf-tools": {
                command: "node",
                args: ["/absolute/path/polypdf-browser-tools-mcp/server.mjs", "--root", "/absolute/path/your-pdf-folder"]
              }
            }
          }, null, 2)}
          </pre>
          <p>
            The server writes results into a dedicated subfolder under the
            allowed folder and does not overwrite source files. Reusing a
            request ID with identical inputs returns the same receipt; changing
            inputs with that ID returns a conflict.
          </p>
        </section>
        <section>
          <h2>Example: prepare a drawing issue</h2>
          <blockquote>
            Inspect the PDFs in my allowed folder. Merge the architectural
            sheets in the order I specify, add the prefix ISSUE- and six-digit
            Bates numbers, then report the output files, page counts, and
            checksums. Keep my original files unchanged.
          </blockquote>
          <p>
            Tool results are data, not instructions. Text inside an uploaded PDF
            should not change the assistant’s permissions or the user’s
            requested task.
          </p>
        </section>
        <section>
          <h2>Browser agents and WebMCP</h2>
          <p>
            On a supported browser, each tool page registers its operation with{" "}
            <code>navigator.modelContext</code>. The user chooses the files
            first; the agent receives temporary file handles, options, and a
            result summary. Downloads remain visible in the workspace. WebMCP
            availability depends on the browser and client; normal file controls
            work independently.
          </p>
          <a href="/tools/tool-manifest.json">
            Read the tool manifest and input schemas
          </a>
        </section>
        <section>
          <h2>How this relates to the PolyPDF OpenAI integration</h2>
          <p>
            The prepared PolyPDF connector uses a richer, shared drawing
            workspace with native PDF processing and separate hosted retention
            rules. These browser tools use a separate local engine. They follow
            the same principles of explicit file selection, structured
            operations, revision-aware requests, and reviewable outputs, without
            requiring that hosted service to be active.
          </p>
          <p>
            The downloadable MCP server runs on your computer. Your MCP client
            can pass file content or tool results to its AI provider under that
            provider’s policy. The browser tool pages themselves do not upload
            PDFs to PolyPDF.
          </p>
        </section>
        <section>
          <h2>Supported operations</h2>
          <div className="pdf-automation-list">
            {catalog.map(t => <Link key={t.id} to={toolkitPath(t.id)}>
                {t.name}
                <code>polypdf_{t.id.replaceAll("-", "_")}</code>
              </Link>)}
          </div>
        </section>
      </main>
    </div>, language);
}
