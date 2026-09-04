import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowUpRight,
  ArrowsOutSimple,
  CaretLeft,
  CaretRight,
  Circle,
  Cursor,
  Desktop,
  DownloadSimple,
  Hand,
  Highlighter,
  LockKey,
  Minus,
  NumberCircleOne,
  Plus,
  Polygon,
  Rectangle,
  Ruler,
  Trash,
  UploadSimple,
  X
} from '@phosphor-icons/react';
import parrotIcon from '../assets/polypdf_icon.png';
import {
  SAMPLE_CALIBRATION,
  TRY_PDF_UNITS,
  annotationLabel,
  appendHistory,
  calibrationFromReference,
  clamp,
  distanceBetween,
  downloadBytes,
  exportAnnotatedPdf,
  formatCalibration,
  moveAnnotation,
  pdfPoint,
  redoHistory,
  undoHistory,
  viewportPoint
} from '../lib/tryPolyPdf';
import './TryPolyPDF.css';

const SAMPLE_URL = `${process.env.PUBLIC_URL || ''}/try/PolyPDF-Quick-Start.pdf`;
const MAX_PDF_BYTES = 75 * 1024 * 1024;
const MARKUP_COLOR = '#cc2418';
const MEASUREMENT_COLOR = '#176b71';
const FREE_MEASUREMENT_LIMIT = 3;

const TOOLS = [
  { id: 'select', label: 'Select', icon: Cursor, kind: 'navigation' },
  { id: 'hand', label: 'Pan', icon: Hand, kind: 'navigation' },
  { id: 'calibrate', label: 'Calibrate', icon: ArrowsOutSimple, kind: 'measure' },
  { id: 'distance', label: 'Distance', icon: Ruler, kind: 'measure' },
  { id: 'area', label: 'Area', icon: Polygon, kind: 'measure' },
  { id: 'count', label: 'Count', icon: NumberCircleOne, kind: 'measure' },
  { id: 'rectangle', label: 'Rectangle', icon: Rectangle, kind: 'markup' },
  { id: 'ellipse', label: 'Ellipse', icon: Circle, kind: 'markup' },
  { id: 'arrow', label: 'Arrow', icon: ArrowUpRight, kind: 'markup' },
  { id: 'highlight', label: 'Highlight', icon: Highlighter, kind: 'markup' }
];

const TOOL_HINTS = {
  select: 'Select a markup to move or delete it.',
  hand: 'Drag the sheet to pan when you are zoomed in.',
  calibrate: 'Drag across a known dimension, then enter its real length.',
  distance: 'Drag between two points to measure a distance.',
  area: 'Click each corner, then press Enter or choose Finish area.',
  count: 'Click each item to add a numbered count.',
  rectangle: 'Drag to draw a rectangle.',
  ellipse: 'Drag to draw an ellipse.',
  arrow: 'Drag from the tail to the arrowhead.',
  highlight: 'Drag across the part of the drawing to highlight.'
};

const initialHistory = () => ({ past: [], present: [], future: [] });

const isTypingTarget = (target) => target instanceof HTMLElement
  && Boolean(target.closest('input, select, textarea, [contenteditable="true"]'));

const fileIsPdf = (file) => file?.type === 'application/pdf' || /\.pdf$/i.test(file?.name || '');

const countNumberFor = (annotations, annotation) => annotations
  .filter((candidate) => candidate.page === annotation.page && candidate.type === 'count')
  .findIndex((candidate) => candidate.id === annotation.id) + 1;

const pointsToPath = (points, closed = false) => {
  if (points.length === 0) return '';
  const commands = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`);
  return `${commands.join(' ')}${closed ? ' Z' : ''}`;
};

const midpoint = (points) => {
  if (points.length === 0) return { x: 0, y: 0 };
  return points.reduce((sum, point) => ({
    x: sum.x + point.x / points.length,
    y: sum.y + point.y / points.length
  }), { x: 0, y: 0 });
};

const AnnotationMark = ({ annotation, annotations, calibration, selected, transform, onSelect }) => {
  const points = annotation.points.map((point) => viewportPoint(point, transform));
  const color = annotation.color || MARKUP_COLOR;
  const selectionClass = selected ? ' is-selected' : '';
  const common = {
    className: `try-mark try-mark-${annotation.type}${selectionClass}`,
    stroke: color,
    fill: 'none',
    vectorEffect: 'non-scaling-stroke'
  };
  const label = annotationLabel(
    annotation,
    calibration,
    annotation.type === 'count' ? countNumberFor(annotations, annotation) : undefined
  );
  const labelPoint = midpoint(points);
  let visible;
  let hit;

  if (['distance', 'arrow', 'highlight'].includes(annotation.type)) {
    visible = (
      <line
        {...common}
        x1={points[0].x}
        y1={points[0].y}
        x2={points[1].x}
        y2={points[1].y}
        markerEnd={annotation.type === 'arrow' ? 'url(#try-arrowhead)' : undefined}
      />
    );
    hit = <line className="try-mark-hit" x1={points[0].x} y1={points[0].y} x2={points[1].x} y2={points[1].y} />;
  } else if (annotation.type === 'area') {
    const path = pointsToPath(points, true);
    visible = <path {...common} d={path} />;
    hit = <path className="try-mark-hit" d={path} />;
  } else if (annotation.type === 'rectangle' || annotation.type === 'ellipse') {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const width = Math.max(1, Math.max(...xs) - x);
    const height = Math.max(1, Math.max(...ys) - y);
    visible = annotation.type === 'rectangle'
      ? <rect {...common} x={x} y={y} width={width} height={height} />
      : <ellipse {...common} cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2} />;
    hit = annotation.type === 'rectangle'
      ? <rect className="try-mark-hit" x={x} y={y} width={width} height={height} />
      : <ellipse className="try-mark-hit" cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2} />;
  } else if (annotation.type === 'count') {
    visible = (
      <g className={selectionClass}>
        <circle className="try-count-dot" cx={points[0].x} cy={points[0].y} r="12" fill="#fffdf8" stroke={color} />
        <text className="try-count-number" x={points[0].x} y={points[0].y}>{label}</text>
      </g>
    );
    hit = <circle className="try-mark-hit try-count-hit" cx={points[0].x} cy={points[0].y} r="16" />;
  }

  return (
    <g
      className="try-annotation"
      role="button"
      tabIndex="0"
      aria-label={`${annotation.type} markup${label ? `, ${label}` : ''}`}
      onPointerDown={(event) => onSelect(annotation, event)}
    >
      {visible}
      {hit}
      {label && annotation.type !== 'count' && (
        <text className="try-measure-label" x={labelPoint.x} y={labelPoint.y - 8}>{label}</text>
      )}
    </g>
  );
};

const DraftMark = ({ draft, areaDraft, tool, transform }) => {
  const activePoints = draft?.points || areaDraft;
  if (!activePoints || activePoints.length === 0) return null;
  const points = activePoints.map((point) => viewportPoint(point, transform));
  if (tool === 'count') return null;
  if (tool === 'area') {
    return (
      <g aria-hidden="true">
        <path className="try-draft" d={pointsToPath(points)} />
        {points.map((point, index) => <circle key={`${point.x}-${point.y}-${index}`} className="try-draft-point" cx={point.x} cy={point.y} r="4" />)}
      </g>
    );
  }
  if (tool === 'rectangle' || tool === 'ellipse') {
    const xs = points.map((point) => point.x);
    const ys = points.map((point) => point.y);
    const x = Math.min(...xs);
    const y = Math.min(...ys);
    const width = Math.max(1, Math.max(...xs) - x);
    const height = Math.max(1, Math.max(...ys) - y);
    return tool === 'rectangle'
      ? <rect className="try-draft" x={x} y={y} width={width} height={height} />
      : <ellipse className="try-draft" cx={x + width / 2} cy={y + height / 2} rx={width / 2} ry={height / 2} />;
  }
  return (
    <line
      className={`try-draft${tool === 'highlight' ? ' is-highlight' : ''}`}
      x1={points[0].x}
      y1={points[0].y}
      x2={points.at(-1).x}
      y2={points.at(-1).y}
      markerEnd={tool === 'arrow' ? 'url(#try-arrowhead)' : undefined}
    />
  );
};

const ToolbarButton = ({ tool, selected, onClick }) => {
  const Icon = tool.icon;
  return (
    <button
      type="button"
      className={`try-tool-button${selected ? ' is-active' : ''}`}
      aria-label={tool.label}
      aria-pressed={selected}
      title={tool.label}
      onClick={onClick}
    >
      <Icon aria-hidden="true" weight={selected ? 'fill' : 'regular'} />
      <span>{tool.label}</span>
    </button>
  );
};

const TryPolyPDF = () => {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const viewportRef = useRef(null);
  const pdfDocumentRef = useRef(null);
  const originalBytesRef = useRef(null);
  const activeRenderRef = useRef(null);
  const sampleStartedRef = useRef(false);
  const annotationIdRef = useRef(0);

  const [documentVersion, setDocumentVersion] = useState(0);
  const [documentName, setDocumentName] = useState('PolyPDF Quick Start.pdf');
  const [pageCount, setPageCount] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageView, setPageView] = useState(null);
  const [surfaceSize, setSurfaceSize] = useState({ width: 1000, height: 720 });
  const [zoom, setZoom] = useState(100);
  const [tool, setTool] = useState('select');
  const [history, setHistory] = useState(initialHistory);
  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [areaDraft, setAreaDraft] = useState([]);
  const [moveDraft, setMoveDraft] = useState(null);
  const [panState, setPanState] = useState(null);
  const [calibration, setCalibration] = useState(SAMPLE_CALIBRATION);
  const [pendingCalibration, setPendingCalibration] = useState(null);
  const [status, setStatus] = useState('Opening the sample drawing…');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dropActive, setDropActive] = useState(false);

  const annotations = history.present;
  const pageAnnotations = useMemo(
    () => annotations.filter((annotation) => annotation.page === pageNumber),
    [annotations, pageNumber]
  );
  const renderedAnnotations = useMemo(() => pageAnnotations.map((annotation) => (
    moveDraft?.annotation.id === annotation.id ? moveDraft.annotation : annotation
  )), [moveDraft, pageAnnotations]);
  const measurementAnnotations = annotations.filter((annotation) => ['distance', 'area', 'count'].includes(annotation.type));
  const measurementLimitReached = measurementAnnotations.length >= FREE_MEASUREMENT_LIMIT;

  const track = useCallback((name, properties = {}) => {
    if (window.plausible) window.plausible(name, { props: properties });
    if (window.gtag) window.gtag('event', name, properties);
  }, []);

  const setNextAnnotations = useCallback((updater) => {
    setHistory((current) => {
      const next = typeof updater === 'function' ? updater(current.present) : updater;
      if (next === current.present) return current;
      return appendHistory(current, next);
    });
  }, []);

  const openPdfBytes = useCallback(async ({ bytes, name, isSample = false }) => {
    setLoading(true);
    setStatus(isSample ? 'Opening the sample drawing…' : 'Opening your PDF locally…');
    setSelectedId(null);
    setDraft(null);
    setAreaDraft([]);
    setPendingCalibration(null);
    try {
      const pdfjs = await import('pdfjs-dist/webpack.mjs');
      if (pdfDocumentRef.current) {
        await pdfDocumentRef.current.destroy();
        pdfDocumentRef.current = null;
      }
      originalBytesRef.current = null;
      setPageView(null);
      const sourceBytes = new Uint8Array(bytes).slice();
      const loadingTask = pdfjs.getDocument({ data: sourceBytes.slice(), isEvalSupported: false });
      const opened = await loadingTask.promise;
      pdfDocumentRef.current = opened;
      originalBytesRef.current = sourceBytes.slice();
      setDocumentName(name || 'Untitled.pdf');
      setPageCount(opened.numPages);
      setPageNumber(1);
      setZoom(100);
      setPageView(null);
      setHistory(initialHistory());
      setCalibration(isSample ? SAMPLE_CALIBRATION : null);
      setDocumentVersion((value) => value + 1);
      setStatus(isSample ? 'Sample drawing ready · Scale is already set' : 'PDF ready · Set the scale before measuring');
      track('try_pdf_opened', { source: isSample ? 'sample' : 'local', pages: opened.numPages > 10 ? '11_plus' : String(opened.numPages) });
    } catch (error) {
      const message = error?.name === 'PasswordException'
        ? 'Password-protected PDFs need the desktop app for now.'
        : 'This PDF could not be opened in the browser. The desktop app supports a wider range of files.';
      setStatus(message);
    } finally {
      setLoading(false);
    }
  }, [track]);

  const openSample = useCallback(async () => {
    setLoading(true);
    setStatus('Opening the sample drawing…');
    try {
      const response = await fetch(SAMPLE_URL);
      if (!response.ok) throw new Error(`Sample returned ${response.status}`);
      await openPdfBytes({ bytes: await response.arrayBuffer(), name: 'PolyPDF Quick Start.pdf', isSample: true });
    } catch {
      setLoading(false);
      setStatus('The sample drawing is unavailable. Choose a PDF from your computer to begin.');
    }
  }, [openPdfBytes]);

  useEffect(() => {
    if (sampleStartedRef.current) return;
    sampleStartedRef.current = true;
    void openSample();
    return () => {
      activeRenderRef.current?.cancel();
    };
  }, [openSample]);

  useEffect(() => () => {
    void pdfDocumentRef.current?.destroy();
  }, []);

  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    const measure = () => setSurfaceSize({ width: element.clientWidth, height: element.clientHeight });
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const document_ = pdfDocumentRef.current;
    const canvas = canvasRef.current;
    if (!document_ || !canvas) return undefined;
    let cancelled = false;
    setLoading(true);
    const render = async () => {
      try {
        activeRenderRef.current?.cancel();
        const page = await document_.getPage(pageNumber);
        const natural = page.getViewport({ scale: 1 });
        const availableWidth = Math.max(240, surfaceSize.width - 72);
        const availableHeight = Math.max(240, surfaceSize.height - 72);
        const fitScale = clamp(Math.min(availableWidth / natural.width, availableHeight / natural.height), 0.12, 1.6);
        const renderScale = clamp(fitScale * zoom / 100, 0.08, 4);
        const viewport = page.getViewport({ scale: renderScale });
        const outputScale = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(viewport.width * outputScale);
        canvas.height = Math.ceil(viewport.height * outputScale);
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw new Error('Canvas is unavailable');
        const renderTask = page.render({
          canvasContext: context,
          viewport,
          transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0]
        });
        activeRenderRef.current = renderTask;
        if (!cancelled) {
          setPageView({
            width: viewport.width,
            height: viewport.height,
            transform: Array.from(viewport.transform)
          });
        }
        await renderTask.promise;
        if (!cancelled) setLoading(false);
      } catch (error) {
        if (error?.name !== 'RenderingCancelledException' && !cancelled) {
          setLoading(false);
          setStatus('This page could not be drawn in the browser.');
        }
      }
    };
    void render();
    return () => {
      cancelled = true;
      activeRenderRef.current?.cancel();
    };
  }, [documentVersion, pageNumber, surfaceSize.height, surfaceSize.width, zoom]);

  const chooseFile = useCallback(async (file) => {
    if (!file) return;
    if (!fileIsPdf(file)) {
      setStatus('Choose a PDF file to continue.');
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setStatus('For the browser preview, choose a PDF smaller than 75 MB. Larger plans work in the desktop app.');
      return;
    }
    await openPdfBytes({ bytes: await file.arrayBuffer(), name: file.name });
  }, [openPdfBytes]);

  const localPointForEvent = useCallback((event) => {
    if (!pageView || !overlayRef.current) return null;
    const bounds = overlayRef.current.getBoundingClientRect();
    const local = {
      x: (event.clientX - bounds.left) * (pageView.width / bounds.width),
      y: (event.clientY - bounds.top) * (pageView.height / bounds.height)
    };
    return pdfPoint(local, pageView.transform);
  }, [pageView]);

  const selectTool = useCallback((nextTool) => {
    setTool(nextTool);
    setDraft(null);
    setAreaDraft([]);
    setMoveDraft(null);
    if (nextTool !== 'select') setSelectedId(null);
  }, []);

  const finishArea = useCallback(() => {
    if (areaDraft.length < 3) {
      setStatus('An area needs at least three corners.');
      return;
    }
    if (measurementLimitReached) {
      setStatus('The browser preview includes 3 measurements per document. Open the free desktop app to keep working.');
      return;
    }
    const annotation = {
      id: `web-mark-${annotationIdRef.current += 1}`,
      type: 'area',
      page: pageNumber,
      points: areaDraft,
      color: MEASUREMENT_COLOR
    };
    setNextAnnotations((current) => [...current, annotation]);
    setAreaDraft([]);
    setSelectedId(annotation.id);
    setStatus(`${annotationLabel(annotation, calibration)} area added`);
  }, [areaDraft, calibration, measurementLimitReached, pageNumber, setNextAnnotations]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setNextAnnotations((current) => current.filter((annotation) => annotation.id !== selectedId));
    setSelectedId(null);
    setStatus('Markup removed');
  }, [selectedId, setNextAnnotations]);

  const undo = useCallback(() => {
    setHistory((current) => undoHistory(current));
    setSelectedId(null);
    setStatus('Undid the last change');
  }, []);

  const redo = useCallback(() => {
    setHistory((current) => redoHistory(current));
    setSelectedId(null);
    setStatus('Redid the change');
  }, []);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (isTypingTarget(event.target)) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedId) {
          event.preventDefault();
          deleteSelected();
        }
      } else if (event.key === 'Escape') {
        setDraft(null);
        setAreaDraft([]);
        setMoveDraft(null);
        setSelectedId(null);
      } else if (event.key === 'Enter' && tool === 'area' && areaDraft.length >= 3) {
        event.preventDefault();
        finishArea();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [areaDraft.length, deleteSelected, finishArea, redo, selectedId, tool, undo]);

  const onOverlayPointerDown = useCallback((event) => {
    if (!pageView || tool === 'hand') return;
    const point = localPointForEvent(event);
    if (!point) return;
    if (tool === 'select') {
      setSelectedId(null);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    if (tool === 'count') {
      if (measurementLimitReached) {
        setStatus('The browser preview includes 3 measurements per document. Open the free desktop app to keep working.');
        return;
      }
      const annotation = {
        id: `web-mark-${annotationIdRef.current += 1}`,
        type: 'count',
        page: pageNumber,
        points: [point],
        color: MEASUREMENT_COLOR
      };
      setNextAnnotations((current) => [...current, annotation]);
      setSelectedId(annotation.id);
      setStatus('Count added');
      return;
    }
    if (tool === 'area') {
      setAreaDraft((current) => [...current, point]);
      setStatus(areaDraft.length < 2 ? 'Keep clicking corners · Press Enter to finish' : 'Press Enter or choose Finish area');
      return;
    }
    setDraft({ tool, points: [point, point] });
  }, [areaDraft.length, localPointForEvent, measurementLimitReached, pageNumber, pageView, setNextAnnotations, tool]);

  const onOverlayPointerMove = useCallback((event) => {
    const point = localPointForEvent(event);
    if (!point) return;
    if (moveDraft) {
      const delta = { x: point.x - moveDraft.origin.x, y: point.y - moveDraft.origin.y };
      setMoveDraft((current) => current ? { ...current, annotation: moveAnnotation(current.original, delta) } : null);
      return;
    }
    if (draft) setDraft((current) => current ? { ...current, points: [current.points[0], point] } : null);
  }, [draft, localPointForEvent, moveDraft]);

  const onOverlayPointerUp = useCallback((event) => {
    if (moveDraft) {
      const moved = moveDraft.annotation;
      setNextAnnotations((current) => current.map((annotation) => annotation.id === moved.id ? moved : annotation));
      setMoveDraft(null);
      setStatus('Markup moved');
      return;
    }
    if (!draft) return;
    const finalPoint = localPointForEvent(event) || draft.points[1];
    const points = [draft.points[0], finalPoint];
    setDraft(null);
    if (distanceBetween(points[0], points[1]) < 2) return;
    if (draft.tool === 'calibrate') {
      setPendingCalibration({ points, distance: '20', unit: calibration?.unit || 'ft' });
      return;
    }
    if (draft.tool === 'distance' && measurementLimitReached) {
      setStatus('The browser preview includes 3 measurements per document. Open the free desktop app to keep working.');
      return;
    }
    const annotation = {
      id: `web-mark-${annotationIdRef.current += 1}`,
      type: draft.tool,
      page: pageNumber,
      points,
      color: ['distance'].includes(draft.tool) ? MEASUREMENT_COLOR : MARKUP_COLOR
    };
    setNextAnnotations((current) => [...current, annotation]);
    setSelectedId(annotation.id);
    setStatus(annotation.type === 'distance' ? `${annotationLabel(annotation, calibration)} distance added` : `${TOOLS.find((entry) => entry.id === annotation.type)?.label || 'Markup'} added`);
  }, [calibration, draft, localPointForEvent, measurementLimitReached, moveDraft, pageNumber, setNextAnnotations]);

  const onAnnotationPointerDown = useCallback((annotation, event) => {
    if (tool !== 'select') return;
    event.preventDefault();
    event.stopPropagation();
    const origin = localPointForEvent(event);
    if (!origin) return;
    overlayRef.current?.setPointerCapture(event.pointerId);
    setSelectedId(annotation.id);
    setMoveDraft({ original: annotation, annotation, origin });
  }, [localPointForEvent, tool]);

  const onViewportPointerDown = useCallback((event) => {
    if (tool !== 'hand' || !viewportRef.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPanState({
      x: event.clientX,
      y: event.clientY,
      left: viewportRef.current.scrollLeft,
      top: viewportRef.current.scrollTop
    });
  }, [tool]);

  const onViewportPointerMove = useCallback((event) => {
    if (!panState || !viewportRef.current) return;
    viewportRef.current.scrollLeft = panState.left - (event.clientX - panState.x);
    viewportRef.current.scrollTop = panState.top - (event.clientY - panState.y);
  }, [panState]);

  const confirmCalibration = useCallback((event) => {
    event.preventDefault();
    if (!pendingCalibration) return;
    const next = calibrationFromReference({
      first: pendingCalibration.points[0],
      second: pendingCalibration.points[1],
      distance: pendingCalibration.distance,
      unit: pendingCalibration.unit
    });
    if (!next) {
      setStatus('Enter a distance greater than zero.');
      return;
    }
    setCalibration(next);
    setPendingCalibration(null);
    setTool('distance');
    setStatus(`Scale set · ${formatCalibration(next)}`);
    track('try_pdf_calibrated', { unit: next.unit });
  }, [pendingCalibration, track]);

  const exportPdf = useCallback(async () => {
    if (!originalBytesRef.current || exporting) return;
    setExporting(true);
    setStatus('Preparing your marked-up PDF…');
    try {
      const output = await exportAnnotatedPdf({
        bytes: originalBytesRef.current,
        annotations,
        calibration,
        filename: documentName
      });
      downloadBytes(output.bytes, output.filename);
      setStatus(`Downloaded ${output.filename}`);
      track('try_pdf_exported', { annotation_count: annotations.length > 10 ? '11_plus' : String(annotations.length) });
    } catch {
      setStatus('The browser could not create this download. Use the desktop app to save this PDF.');
    } finally {
      setExporting(false);
    }
  }, [annotations, calibration, documentName, exporting, track]);

  const openFilePicker = () => fileInputRef.current?.click();
  const currentTool = TOOLS.find((entry) => entry.id === tool) || TOOLS[0];
  const CurrentToolIcon = currentTool.icon;

  return (
    <div
      className={`try-app${dropActive ? ' is-drop-active' : ''}`}
      onDragEnter={(event) => { event.preventDefault(); setDropActive(true); }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setDropActive(false); }}
      onDrop={(event) => {
        event.preventDefault();
        setDropActive(false);
        void chooseFile(event.dataTransfer.files?.[0]);
      }}
    >
      <input
        ref={fileInputRef}
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => {
          void chooseFile(event.target.files?.[0]);
          event.target.value = '';
        }}
      />

      <header className="try-titlebar">
        <div className="try-brand-cluster">
          <Link to="/" className="try-brand" aria-label="Back to PolyPDF home">
            <img src={parrotIcon} alt="" width="32" height="32" />
            <span>PolyPDF</span>
          </Link>
          <span className="try-edition">Try Now</span>
          <h1 className="sr-only">Try PolyPDF in your browser</h1>
        </div>
        <div className="try-document-name" title={documentName}>{documentName}</div>
        <div className="try-title-actions">
          <span className="try-local-badge"><LockKey aria-hidden="true" /> Local to this browser</span>
          <button type="button" className="try-top-button" onClick={openFilePicker}>
            <UploadSimple aria-hidden="true" /> Open PDF
          </button>
          <button type="button" className="try-export-button" disabled={!originalBytesRef.current || exporting} onClick={exportPdf}>
            <DownloadSimple aria-hidden="true" /> {exporting ? 'Preparing…' : 'Download PDF'}
          </button>
        </div>
      </header>

      <div className="try-workspace">
        <aside className="try-toolbar" aria-label="PDF tools">
          {TOOLS.map((entry, index) => (
            <React.Fragment key={entry.id}>
              {index > 0 && TOOLS[index - 1].kind !== entry.kind && <span className="try-tool-divider" aria-hidden="true" />}
              <ToolbarButton tool={entry} selected={tool === entry.id} onClick={() => selectTool(entry.id)} />
            </React.Fragment>
          ))}
        </aside>

        <main
          ref={viewportRef}
          className={`try-viewport tool-${tool}`}
          aria-label="PDF drawing workspace"
          onPointerDown={onViewportPointerDown}
          onPointerMove={onViewportPointerMove}
          onPointerUp={() => setPanState(null)}
          onPointerCancel={() => setPanState(null)}
        >
          <div className="try-canvas-stage" style={pageView ? { width: pageView.width, height: pageView.height } : undefined}>
            <canvas ref={canvasRef} className="try-pdf-canvas" aria-label={`Page ${pageNumber} of ${pageCount}`} />
            {pageView && (
              <svg
                ref={overlayRef}
                className={`try-overlay tool-${tool}`}
                width={pageView.width}
                height={pageView.height}
                viewBox={`0 0 ${pageView.width} ${pageView.height}`}
                onPointerDown={onOverlayPointerDown}
                onPointerMove={onOverlayPointerMove}
                onPointerUp={onOverlayPointerUp}
                onPointerCancel={() => { setDraft(null); setMoveDraft(null); }}
              >
                <defs>
                  <marker id="try-arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                    <path d="M 0 0 L 8 4 L 0 8 z" fill={MARKUP_COLOR} />
                  </marker>
                </defs>
                {renderedAnnotations.map((annotation) => (
                  <AnnotationMark
                    key={annotation.id}
                    annotation={annotation}
                    annotations={annotations}
                    calibration={calibration}
                    selected={selectedId === annotation.id}
                    transform={pageView.transform}
                    onSelect={onAnnotationPointerDown}
                  />
                ))}
                <DraftMark draft={draft} areaDraft={areaDraft} tool={tool} transform={pageView.transform} />
              </svg>
            )}
            {loading && (
              <div className="try-loading" role="status">
                <span className="try-loading-ring" aria-hidden="true" />
                <span>Drawing page…</span>
              </div>
            )}
          </div>

          {!pdfDocumentRef.current && !loading && (
            <div className="try-empty">
              <UploadSimple aria-hidden="true" />
              <h2>Open a PDF drawing</h2>
              <p>Your file stays on this device. Nothing is uploaded.</p>
              <button type="button" className="try-export-button" onClick={openFilePicker}>Choose PDF</button>
              <button type="button" className="try-text-button" onClick={() => void openSample()}>Open sample drawing</button>
            </div>
          )}
        </main>

        <aside className="try-inspector" aria-label="Measurements and browser preview details">
          <section className="try-panel-section try-scale-card">
            <div>
              <span className="try-panel-kicker">Page scale</span>
              <strong>{calibration ? 'Calibrated' : 'Not set'}</strong>
            </div>
            <p>{formatCalibration(calibration)}</p>
            <button type="button" className="try-outline-button" onClick={() => selectTool('calibrate')}>
              <ArrowsOutSimple aria-hidden="true" /> {calibration ? 'Recalibrate' : 'Set scale'}
            </button>
          </section>

          <section className="try-panel-section try-records-section">
            <div className="try-panel-heading">
              <div>
                <span className="try-panel-kicker">Records</span>
                <h2>Measurements</h2>
              </div>
              <span className="try-record-count">{measurementAnnotations.length} / {FREE_MEASUREMENT_LIMIT}</span>
            </div>
            {measurementAnnotations.length === 0 ? (
              <div className="try-records-empty">
                <Ruler aria-hidden="true" />
                <p>Choose Distance, Area, or Count and mark the drawing.</p>
              </div>
            ) : (
              <ol className="try-record-list">
                {measurementAnnotations.map((annotation) => {
                  const countIndex = annotation.type === 'count' ? countNumberFor(annotations, annotation) : undefined;
                  return (
                    <li key={annotation.id} className={selectedId === annotation.id ? 'is-selected' : ''}>
                      <button type="button" onClick={() => { setPageNumber(annotation.page); setSelectedId(annotation.id); setTool('select'); }}>
                        <span className={`try-record-icon is-${annotation.type}`}>{annotation.type.slice(0, 1).toUpperCase()}</span>
                        <span>
                          <strong>{annotation.type === 'count' ? `Count ${countIndex}` : annotationLabel(annotation, calibration)}</strong>
                          <small>{annotation.type} · page {annotation.page}</small>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>

          <section className="try-panel-section try-desktop-card">
            <Desktop aria-hidden="true" />
            <div>
              <span className="try-panel-kicker">Need the full workflow?</span>
              <h2>Continue in PolyPDF Desktop</h2>
              <p>Use OCR, Symbol Search, editable PDF markups, forms, signing, plugins, comparison, and collaboration.</p>
              <a href="/#download" className="try-desktop-link">Download free <ArrowUpRight aria-hidden="true" /></a>
            </div>
          </section>
        </aside>
      </div>

      <footer className="try-statusbar">
        <div className="try-tool-hint">
          <CurrentToolIcon aria-hidden="true" />
          <span>{TOOL_HINTS[tool]}</span>
          {tool === 'area' && areaDraft.length >= 3 && (
            <button type="button" onClick={finishArea}>Finish area</button>
          )}
        </div>
        <div className="try-status-message" role="status" aria-live="polite">{status}</div>
        <div className="try-page-controls" aria-label="Page and zoom controls">
          <button type="button" aria-label="Previous page" disabled={pageNumber <= 1} onClick={() => setPageNumber((value) => Math.max(1, value - 1))}><CaretLeft /></button>
          <span>Page {pageNumber} / {pageCount}</span>
          <button type="button" aria-label="Next page" disabled={pageNumber >= pageCount} onClick={() => setPageNumber((value) => Math.min(pageCount, value + 1))}><CaretRight /></button>
          <span className="try-status-divider" aria-hidden="true" />
          <button type="button" aria-label="Zoom out" onClick={() => setZoom((value) => clamp(value - 10, 40, 240))}><Minus /></button>
          <span>{zoom}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => setZoom((value) => clamp(value + 10, 40, 240))}><Plus /></button>
        </div>
      </footer>

      <div className="try-history-controls" aria-label="Edit history">
        <button type="button" aria-label="Undo" title="Undo" disabled={history.past.length === 0} onClick={undo}><ArrowCounterClockwise /></button>
        <button type="button" aria-label="Redo" title="Redo" disabled={history.future.length === 0} onClick={redo}><ArrowClockwise /></button>
        <button type="button" aria-label="Delete selected markup" title="Delete" disabled={!selectedId} onClick={deleteSelected}><Trash /></button>
      </div>

      {pendingCalibration && (
        <div className="try-modal-backdrop" role="presentation" onPointerDown={(event) => { if (event.target === event.currentTarget) setPendingCalibration(null); }}>
          <form className="try-modal" role="dialog" aria-modal="true" aria-labelledby="try-calibration-title" onSubmit={confirmCalibration}>
            <button type="button" className="try-modal-close" aria-label="Close" onClick={() => setPendingCalibration(null)}><X /></button>
            <span className="try-panel-kicker">Page scale</span>
            <h2 id="try-calibration-title">What distance did you mark?</h2>
            <p>Enter the real length of the line you dragged across the drawing.</p>
            <div className="try-calibration-fields">
              <label>
                <span>Known distance</span>
                <input
                  autoFocus
                  type="number"
                  min="0.001"
                  step="any"
                  required
                  value={pendingCalibration.distance}
                  onChange={(event) => setPendingCalibration((current) => ({ ...current, distance: event.target.value }))}
                />
              </label>
              <label>
                <span>Unit</span>
                <select value={pendingCalibration.unit} onChange={(event) => setPendingCalibration((current) => ({ ...current, unit: event.target.value }))}>
                  {TRY_PDF_UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                </select>
              </label>
            </div>
            <div className="try-modal-actions">
              <button type="button" className="try-text-button" onClick={() => setPendingCalibration(null)}>Cancel</button>
              <button type="submit" className="try-export-button">Set scale</button>
            </div>
          </form>
        </div>
      )}

      {dropActive && (
        <div className="try-drop-overlay" aria-hidden="true">
          <UploadSimple weight="duotone" />
          <strong>Drop your PDF to open it</strong>
          <span>It stays on this device.</span>
        </div>
      )}
    </div>
  );
};

export default TryPolyPDF;
