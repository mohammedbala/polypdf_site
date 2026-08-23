import React, { forwardRef } from 'react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform
} from 'framer-motion';

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
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, SPRING);
  const springY = useSpring(pointerY, SPRING);
  const x = useTransform(springX, (value) => (reduceMotion ? 0 : value));
  const y = useTransform(springY, (value) => (reduceMotion ? 0 : value));

  const reset = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const handlePointerMove = (event) => {
    onPointerMove?.(event);
    if (reduceMotion || event.pointerType === 'touch') return;
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
      style={{ x, y }}
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
