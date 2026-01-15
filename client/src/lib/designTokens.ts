// NextEra Energy Design System - Enterprise Transformation Team 2026 Edition
// All designs MUST use these tokens - no deviations without approval

export const colors = {
  // Brand Colors - Primary Palette
  brand: {
    blue: "#0072CE",      // Primary actions, links, focus states, navigation accents
    teal: "#00A651",      // Positive trends, success states (NextEra Green)
    red: "#D50032",       // Alerts, errors, negative trends
    yellow: "#FFD700",    // Subtle highlights, secondary CTAs (use sparingly)
  },
  
  // Neutral Colors
  neutral: {
    white: "#FFFFFF",     // Backgrounds
    black: "#000000",     // Primary text
    grey100: "#F5F5F5",   // Light backgrounds
    grey300: "#E0E0E0",   // Borders, dividers
    grey500: "#757575",   // Secondary text, placeholders
    grey700: "#424242",   // Icons, subtle elements
  },
  
  // Semantic Colors (mapped from brand)
  semantic: {
    success: "#00A651",   // NextEra Green
    warning: "#FFC107",   // Amber
    error: "#D50032",     // Brand Red
    info: "#0072CE",      // NextEra Blue
  },
  
  // Mobile Prototype ONLY (Art of the Possible section)
  mobile: {
    primary: "#C50B30",   // Red for mobile CTAs
    secondary: "#007FAA", // Blue for mobile secondary
    background: "#F6F6F6", // Grey for mobile backgrounds
  }
};

// Typography
export const typography = {
  fontFamily: "Helvetica Neue, Arial, system-ui, sans-serif",
  h1: { size: "48px", weight: "700", lineHeight: "1.2" },
  h2: { size: "32px", weight: "700", lineHeight: "1.3" },
  h3: { size: "24px", weight: "700", lineHeight: "1.4" },
  body: { size: "16px", weight: "400", lineHeight: "1.5" },
  caption: { size: "12px", weight: "400", lineHeight: "1.4" },
};

// Spacing Tokens
export const spacing = {
  xs: "4px",
  s: "8px",
  m: "16px",
  l: "24px",
  xl: "32px",
  xxl: "48px",
  xxxl: "64px",
};

// Motion Tokens
export const motion = {
  fast: { duration: "150ms", easing: "ease-in-out" },
  medium: { duration: "300ms", easing: "ease-in-out" },
  slow: { duration: "500ms", easing: "ease-in-out" },
};

// Component Styles
export const components = {
  button: {
    borderRadius: "4px",
    minHeight: "48px",
  },
  card: {
    padding: "24px",
    shadow: "0 4px 8px rgba(0,0,0,0.1)",
  },
  navbar: {
    height: "64px",
  },
};

// Division Colors - Using Brand Palette
export const divisionColors = {
  institutionalRetirement: colors.brand.blue,
  assetManagement: colors.brand.teal,
  retail: colors.brand.blue,
  corporate: colors.neutral.grey700,
};
