import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router';
import WorkflowDemos, { workflowDemos, WorkflowDemoMedia } from './WorkflowDemos';
import PlanComparison from './PlanComparison';
import { useSiteMotion } from './SiteMotion';
import { saveConsent } from '../lib/consent';

jest.mock('./SiteMotion', () => ({ useSiteMotion: jest.fn() }));

let observers;
class TestIntersectionObserver {
  constructor(callback) { this.callback = callback; observers.push(this); }
  observe() {}
  disconnect() {}
  setVisible(value) { this.callback([{ isIntersecting: value }]); }
}

const render = async (component) => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  await act(async () => root.render(<MemoryRouter>{component}</MemoryRouter>));
  return { container, unmount: () => { act(() => root.unmount()); container.remove(); } };
};

beforeEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  observers = [];
  window.IntersectionObserver = TestIntersectionObserver;
  useSiteMotion.mockReturnValue({ motionOff: false });
  window.localStorage.clear();
  window.gtag = jest.fn();
  jest.spyOn(HTMLMediaElement.prototype, 'paused', 'get').mockImplementation(function () { return this.testPaused !== false; });
  jest.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () {
    this.testPaused = false;
    this.dispatchEvent(new Event('play'));
    return Promise.resolve();
  });
  jest.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function () {
    this.testPaused = true;
    this.dispatchEvent(new Event('pause'));
  });
});
afterEach(() => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  delete window.IntersectionObserver;
  delete window.gtag;
  jest.restoreAllMocks();
});

test('lazy loads videos and pauses offscreen without resetting their playback position', async () => {
  const view = await render(<WorkflowDemoMedia demo={workflowDemos[0]} />);
  expect(view.container.querySelector('video')).toBeNull();
  expect(view.container.querySelector('img').getAttribute('src')).toBe('/images/workflows/takeoff.webp');
  await act(async () => observers[0].setVisible(true));
  const video = view.container.querySelector('video');
  expect(video).not.toBeNull();
  expect(Array.from(video.querySelectorAll('source')).map((source) => source.getAttribute('type'))).toEqual(['video/webm', 'video/mp4']);
  expect(video.controls).toBe(true);
  expect(video.muted).toBe(true);
  video.currentTime = 4.2;
  await act(async () => observers[0].setVisible(false));
  expect(view.container.querySelector('video')).toBe(video);
  expect(video.paused).toBe(true);
  await act(async () => observers[0].setVisible(true));
  expect(video.paused).toBe(false);
  expect(video.currentTime).toBe(4.2);
  view.unmount();
});

test('preserves an explicit pause when the demo leaves and re-enters the viewport', async () => {
  const view = await render(<WorkflowDemoMedia demo={workflowDemos[0]} />);
  await act(async () => observers[0].setVisible(true));
  const video = view.container.querySelector('video');
  video.currentTime = 3.5;
  await act(async () => video.pause());
  expect(video.paused).toBe(true);
  await act(async () => observers[0].setVisible(false));
  await act(async () => observers[0].setVisible(true));
  expect(view.container.querySelector('video')).toBe(video);
  expect(video.paused).toBe(true);
  expect(video.currentTime).toBe(3.5);
  await act(async () => video.play());
  expect(video.paused).toBe(false);
  view.unmount();
});

test('honors the site motion preference while preserving an explicit full-size video link', async () => {
  useSiteMotion.mockReturnValue({ motionOff: true });
  const view = await render(<WorkflowDemos />);
  await act(async () => observers.forEach((observer) => observer.setVisible(true)));
  expect(view.container.querySelector('video')).toBeNull();
  expect(view.container.querySelectorAll('img')).toHaveLength(3);
  expect(view.container.querySelectorAll('a[href$=".mp4"]')).toHaveLength(3);
  expect(view.container.querySelectorAll('a[href$=".gif"][download]')).toHaveLength(3);
  expect(view.container.querySelectorAll('a[href$=".pdf"][download]')).toHaveLength(4);
  view.unmount();
});

test('does not consume the play milestone before consent, then records a new play only once', async () => {
  const view = await render(<WorkflowDemoMedia demo={workflowDemos[0]} />);
  await act(async () => observers[0].setVisible(true));
  const video = view.container.querySelector('video');
  await act(async () => video.dispatchEvent(new Event('play')));
  expect(window.gtag).not.toHaveBeenCalled();
  saveConsent({ analytics: true });
  expect(window.gtag).not.toHaveBeenCalled();
  await act(async () => {
    video.dispatchEvent(new Event('play'));
    video.dispatchEvent(new Event('play'));
  });
  expect(window.gtag).toHaveBeenCalledTimes(1);
  expect(window.gtag).toHaveBeenCalledWith('event', 'workflow_demo_play', expect.objectContaining({ source: 'home_workflows', feature: 'takeoff' }));
  view.unmount();
});

test('explains the measurement allowance and every paid workflow boundary in the plan comparison', async () => {
  const view = await render(<PlanComparison />);
  const rows = [...view.container.querySelectorAll('tbody tr')].map((row) => row.textContent);
  expect(rows).toContain('Hand-created measurements3 per documentUnlimited');
  expect(rows).toContain('PDF content editing & colored overlaysPro requiredIncluded');
  expect(rows).toContain('Preset & custom toolsetsBrowse presetsPlace and use tools');
  expect(rows).toContain('Symbol Search & installed pluginsPro requiredIncluded');
  expect(rows).toContain('Revision PackagesView and navigateCreate, update and publish');
  view.unmount();
});
