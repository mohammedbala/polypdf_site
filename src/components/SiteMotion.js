import React, { createContext, useContext, useEffect, useState } from 'react';
import { MotionConfig, useReducedMotion } from 'framer-motion';
const Context = createContext({ motionOff: false, paused: false, toggle: () => {} });
export const useSiteMotion = () => useContext(Context);
export function SiteMotionProvider({ children }) {
  const [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const motionOff = paused || (ready && reduced);
  return <Context.Provider value={{ motionOff, paused, toggle: () => setPaused((value) => !value) }}>
    <MotionConfig reducedMotion={motionOff ? 'always' : 'user'}>
      <div className={motionOff ? 'site-motion-paused' : undefined}>{children}</div>
    </MotionConfig>
  </Context.Provider>;
}
export function SiteMotionButton() {
  const { paused, toggle } = useSiteMotion();
  return <button type="button" className="cookie-settings-button" aria-pressed={paused} onClick={toggle}>{paused ? 'Resume animations' : 'Pause animations'}</button>;
}
