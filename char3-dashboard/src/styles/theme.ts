// Centralized theme/styling system for consistent design across the app
// Linear-inspired color palette with Char3 orange accent

export const colors = {
  // Background colors
  background: {
    main: '#0d0d0d',           // Main app background (darkest)
    elevated: '#141414',       // Boards, panels, containers
    card: 'rgba(255, 255, 255, 0.06)',  // Card backgrounds (translucent)
    cardHover: 'rgba(255, 255, 255, 0.08)',  // Card hover state
    header: '#141414',         // Header backgrounds
    input: 'rgba(255, 255, 255, 0.04)',  // Input fields
    inputFocus: 'rgba(255, 255, 255, 0.06)',  // Input focus state
  },

  // Border colors
  border: {
    subtle: 'rgba(255, 255, 255, 0.06)',  // Very subtle borders
    default: 'rgba(255, 255, 255, 0.08)', // Default borders
    hover: 'rgba(255, 255, 255, 0.12)',   // Hover state borders
    focus: 'rgba(255, 107, 53, 0.5)',     // Focus state (orange tint)
  },

  // Text colors
  text: {
    primary: 'rgba(255, 255, 255, 0.95)',   // Main text
    secondary: 'rgba(255, 255, 255, 0.7)',  // Secondary text
    tertiary: 'rgba(255, 255, 255, 0.5)',   // Tertiary text (labels, counts)
    disabled: 'rgba(255, 255, 255, 0.4)',   // Disabled text
    title: '#e0e0e0',      // Section titles (matches client deliverables)
  },

  // Accent colors
  accent: {
    orange: '#ff6b35',         // Char3 orange (primary)
    primary: '#ff6b35',        // Char3 orange
    primaryHover: '#e55a2b',   // Orange hover
    primaryLight: 'rgba(255, 107, 53, 0.1)',   // Orange tint
    primaryGlow: 'rgba(255, 107, 53, 0.2)',    // Orange glow
  },

  // Status colors
  status: {
    success: '#4caf50',
    successHover: '#45a049',
    error: '#ff4444',
    warning: '#ff9800',
    info: '#2196f3',
  },

  // Label colors (Trello)
  labels: {
    orange: '#ff6b35',
    red: '#eb5a46',
    green: '#61bd4f',
    blue: '#0079bf',
    yellow: '#f2d600',
    purple: '#8b6db8',  // Need More Info
    pink: '#ff78cb',
    sky: '#00c2e0',
    lime: '#51e898',
    black: '#344563',
  }
};

export const typography = {
  fontWeights: {
    normal: 400,
    medium: 500,
    semibold: 600,
  },
  letterSpacing: {
    tight: '-0.02em',
    normal: '-0.01em',
  },
};

export const transitions = {
  default: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
  fast: 'all 0.1s cubic-bezier(0.4, 0, 0.2, 1)',
};

export const shadows = {
  card: '0 1px 3px rgba(0,0,0,0.4)',
  cardHover: '0 2px 8px rgba(255, 107, 53, 0.2)',
  elevated: '0 4px 20px rgba(255, 107, 53, 0.15)',
};

