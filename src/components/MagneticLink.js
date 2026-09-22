import React, { forwardRef, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring
} from 'framer-motion';
import { useSiteMotion } from './SiteMotion';

const SPRING = { type: 'spring', stiffness: 180, damping: 18, mass: 0.24 };

// A small pointer-only pull for primary actions. Motion values keep cursor tracking outside
// React's render cycle, and reduced-motion visitors receive an ordinary, still link.
const MagneticLink = forwardRef(({
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}, ref) => {
  const reduceMotion = useReducedMotion();
  const { motionOff } = useSiteMotion();
  const motionDisabled = motionOff || reduceMotion;
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, SPRING);
  const springY = useSpring(pointerY, SPRING);

  useEffect(() => {
    if (!motionDisabled) return;
    pointerX.set(0);
    pointerY.set(0);
    // Stop the in-flight spring as well as its target, so resuming cannot reveal
    // a stale offset or continue an animation that was running before pause.
    springX.jump(0);
    springY.jump(0);
  }, [motionDisabled, pointerX, pointerY, springX, springY]);

  const reset = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const handlePointerMove = (event) => {
    onPointerMove?.(event);
    if (motionDisabled || event.pointerType === 'touch') return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set((event.clientX - bounds.left - bounds.width / 2) * 0.12);
    pointerY.set((event.clientY - bounds.top - bounds.height / 2) * 0.12);
  };

  const handlePointerLeave = (event) => {
    onPointerLeave?.(event);
    reset();
  };

  return (
    <motion.a
      ref={ref}
      style={{ x: motionDisabled ? 0 : springX, y: motionDisabled ? 0 : springY }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      {children}
    </motion.a>
  );
});

MagneticLink.displayName = 'MagneticLink';

export default MagneticLink;
