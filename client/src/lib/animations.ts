/**
 * SUBTLE ANIMATION UTILITIES
 *
 * Enterprise-appropriate animations that enhance UX without being distracting.
 * All animations are subtle, functional, and respect user preferences.
 */

/**
 * Framer Motion variants for common animations
 */
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
};

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

export const slideInRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
};

export const slideInLeft = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
};

/**
 * Transition presets (subtle timing)
 */
export const transitions = {
  // Very quick for micro-interactions
  quick: { duration: 0.15, ease: 'easeOut' },
  // Standard for most UI elements
  default: { duration: 0.2, ease: 'easeInOut' },
  // Slightly slower for larger elements
  smooth: { duration: 0.3, ease: 'easeInOut' },
  // For spring-based animations (modals, dropdowns)
  spring: { type: 'spring', damping: 25, stiffness: 300 },
};

/**
 * Stagger children animations
 */
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItem = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Hover animations (very subtle)
 */
export const hoverScale = {
  scale: 1.02,
  transition: transitions.quick,
};

export const hoverLift = {
  y: -2,
  transition: transitions.quick,
};

/**
 * Loading animations
 */
export const pulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export const spin = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Notification animations
 */
export const notificationSlideIn = {
  initial: { x: 400, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 400, opacity: 0 },
  transition: transitions.spring,
};

export const notificationFade = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: transitions.smooth,
};

/**
 * CSS animation classes (Tailwind)
 */
export const cssAnimations = {
  // Fade in
  fadeIn: 'animate-in fade-in duration-200',
  // Slide in from bottom
  slideInBottom: 'animate-in slide-in-from-bottom-4 duration-300',
  // Slide in from top
  slideInTop: 'animate-in slide-in-from-top-4 duration-300',
  // Zoom in
  zoomIn: 'animate-in zoom-in-95 duration-200',
  // Subtle spin
  spin: 'animate-spin',
  // Pulse (for loading states)
  pulse: 'animate-pulse',
  // Bounce (for attention, use sparingly)
  bounce: 'animate-bounce',
};

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation config respecting user preferences
 */
export function getAnimation(animation: any) {
  if (prefersReducedMotion()) {
    return {
      ...animation,
      transition: { duration: 0 },
    };
  }
  return animation;
}

/**
 * Utility to apply animation only if motion is not reduced
 */
export function withMotion(animation: any) {
  return prefersReducedMotion()
    ? { initial: animation.animate, animate: animation.animate, exit: animation.animate }
    : animation;
}
