import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, DownloadSimple } from '@phosphor-icons/react';
import { useSiteMotion } from './SiteMotion';
import { trackEvent } from '../lib/analytics';
import './Conversion.css';

export const workflowDemos = [
  {
    id: 'takeoff',
    label: 'Measure & take off',
    title: 'Turn a drawing into quantities you can check.',
    description: 'Set the drawing scale, measure the plan, and keep quantities beside the sheet they came from.',
    access: 'Try 3 hand-created measurements per document free. Pro removes the limit.',
    alt: 'PolyPDF measuring a sample construction plan and showing quantities in its takeoff worksheet',
    guide: '/pdf-takeoff-software/',
    guideLabel: 'Explore takeoff',
    steps: ['Calibrate the drawing scale.', 'Place measurements on the plan.', 'Review the quantities alongside the drawing.']
  },
  {
    id: 'compare',
    label: 'Compare revisions',
    title: 'See what changed before the next issue goes out.',
    description: 'Overlay two drawing revisions in different colors to inspect the linework that moved, appeared, or disappeared.',
    access: 'Colored PDF overlays require PolyPDF Pro.',
    alt: 'PolyPDF showing two sample construction drawing revisions together as colored PDF overlays',
    guide: '/compare-pdf-drawings/',
    guideLabel: 'Explore drawing comparison',
    steps: ['Open the two drawing revisions.', 'Use Overlay Pages to assign a color to each revision.', 'Inspect the combined linework for changes.']
  },
  {
    id: 'review',
    label: 'Mark up & review',
    title: 'Keep the review where the work is.',
    description: 'Put notes, callouts, and review markups directly on the PDF so the next person can see the issue in context.',
    access: 'Markup and review are included in Free, with no trial timer.',
    alt: 'PolyPDF displaying review markups and notes on a sample construction drawing',
    guide: '/construction-pdf-markup/',
    guideLabel: 'Explore markup tools',
    steps: ['Open the drawing for review.', 'Place a markup beside the issue.', 'Review the markup and its drawing context.']
  }
];

// Keep capture files separate from the React bundle. Videos load only near the viewport; the
// static poster is also the complete fallback when motion is paused or reduced.
export function WorkflowDemoMedia({ demo, source = 'home_workflows', eager = false }) {
  const { motionOff } = useSiteMotion();
  const frame = useRef(null);
  const videoRef = useRef(null);
  const programmaticPause = useRef(false);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [failed, setFailed] = useState(false);
  const played = useRef(false);
  const watched = useRef(false);
  const base = `/images/workflows/${demo.id}`;

  useEffect(() => {
    if (typeof IntersectionObserver !== 'function') return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    }, { threshold: 0.2 });
    if (frame.current) observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (visible && !motionOff) setLoaded(true);
  }, [visible, motionOff]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (visible && !motionOff && !userPaused) {
      const playback = video.play();
      playback?.catch(() => { /* Native controls remain available when autoplay is blocked. */ });
    } else if (!video.paused) {
      programmaticPause.current = true;
      video.pause();
    }
  }, [visible, motionOff, userPaused, loaded]);

  const recordPlay = () => {
    if (played.current) return;
    played.current = trackEvent('workflow_demo_play', { source, feature: demo.id });
  };

  return (
    <div className="workflow-demo-media" ref={frame}>
      {loaded && !failed && (
        <video
          ref={videoRef} hidden={motionOff}
          controls loop muted playsInline preload="metadata"
          poster={`${base}.webp`} width="1280" height="800"
          aria-label={demo.alt}
          onPlay={() => { setUserPaused(false); recordPlay(); }}
          onPause={() => {
            if (programmaticPause.current) programmaticPause.current = false;
            else if (visible && !motionOff) setUserPaused(true);
          }}
          onError={() => setFailed(true)}
          onTimeUpdate={(event) => {
            const video = event.currentTarget;
            if (!watched.current && video.duration > 0 && video.currentTime / video.duration >= 0.75) {
              watched.current = trackEvent('workflow_demo_watched', { source, feature: demo.id });
            }
          }}
        >
          <source src={`${base}.webm`} type="video/webm" />
          <source src={`${base}.mp4`} type="video/mp4" />
          <a href={`${base}.mp4`}>Watch the {demo.label.toLowerCase()} demo</a>
        </video>
      )}
      {(!loaded || motionOff || failed) && (
        <img src={`${base}.webp`} alt={demo.alt} width="1280" height="800" loading={eager ? 'eager' : 'lazy'} fetchpriority={eager ? 'high' : 'auto'} />
      )}
    </div>
  );
}

export default function WorkflowDemos() {
  return (
    <section className="workflow-demos" id="workflows" aria-labelledby="workflow-demos-title" data-workflow-capture-manifest="/images/workflows/manifest.json">
      <div className="container">
        <div className="workflow-demo-heading">
          <span className="section-kicker">From drawing to decision</span>
          <h2 id="workflow-demos-title">See the work. Then try it on your plans.</h2>
          <p>Three short demos, captured in PolyPDF with sample construction drawings.</p>
        </div>
        <div className="workflow-demo-grid">
          {workflowDemos.map((demo, index) => (
            <article className="workflow-demo" key={demo.id} aria-labelledby={`${demo.id}-demo-title`}>
              <div className="workflow-demo-copy">
                <span className="workflow-demo-label">0{index + 1} / {demo.label}</span>
                <h3 id={`${demo.id}-demo-title`}>{demo.title}</h3>
                <p>{demo.description}</p>
                <p className="workflow-demo-access">{demo.access}</p>
                <div className="workflow-demo-links">
                  <Link to={demo.guide} onClick={() => trackEvent('workflow_guide_click', { source: 'home_workflows', feature: demo.id })}>
                    {demo.guideLabel} <ArrowRight aria-hidden="true" />
                  </Link>
                  <a href={`/images/workflows/${demo.id}.gif`} download onClick={() => trackEvent('workflow_gif_download', { source: 'home_workflows', feature: demo.id })}>
                    <DownloadSimple aria-hidden="true" /> Download GIF
                  </a>
                  <a href="/samples/conversion/northline-studio-rev-a.pdf" download onClick={() => trackEvent('sample_download', { source: 'home_workflows', feature: demo.id, target: 'rev_a' })}>
                    Try the sample drawing
                  </a>
                  {demo.id === 'compare' && <a href="/samples/conversion/northline-studio-rev-b.pdf" download onClick={() => trackEvent('sample_download', { source: 'home_workflows', feature: demo.id, target: 'rev_b' })}>
                    Download the revised sheet
                  </a>}
                </div>
              </div>
              <figure className="workflow-demo-figure">
                <WorkflowDemoMedia demo={demo} />
                <figcaption>
                  <span>Actual PolyPDF interface · sample project</span>
                  <a href={`/images/workflows/${demo.id}.mp4`} onClick={() => trackEvent('workflow_demo_open', { source: 'home_workflows', feature: demo.id })}>Watch full size</a>
                </figcaption>
                <details className="workflow-demo-transcript" onToggle={(event) => {
                  if (event.currentTarget.open) trackEvent('workflow_steps_view', { source: 'home_workflows', feature: demo.id });
                }}>
                  <summary>Read the demo steps</summary>
                  <ol>{demo.steps.map((step) => <li key={step}>{step}</li>)}</ol>
                </details>
              </figure>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
