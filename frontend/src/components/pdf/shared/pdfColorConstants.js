/**
 * Shared PDF Color Constants
 * 
 * Centralized color definitions for all PDF components.
 * Note: @react-pdf/renderer doesn't support CSS variables (var(--token-name)),
 * so we use JavaScript constants that mirror the design tokens from tokens.scss
 * 
 * These hex values should stay in sync with frontend/src/styles/tokens.scss
 */

export const PDF_COLORS = {
  // Brand colors
  brandNavy: '#003087',
  brandNavyDark: '#1a3a5c',
  brandBlue: '#0070d2',
  brandBlueDark: '#014486',
  brandInfo: '#0176d3',
  
  // Text colors
  textPrimary: '#000000',
  textSecondary: '#3e3e3c',
  textMuted: '#706e6b',
  textDark: '#080707',
  textWarning: '#826100',
  textWhite: '#ffffff',
  textGray: '#6a737d',
  textGrayDark: '#5c6b73',
  
  // Background colors
  bgWhite: '#ffffff',
  bgLight: '#f9f9f9',
  bgSubtle: '#f3f2f2',
  bgLightGray: '#f8f9fa',
  bgMedium: '#f2f2f2',
  bgGrayLight: '#f4f4f4',
  bgGrayMedium: '#e9ecef',
  bgInfo: '#d8edff',
  bgInfoLight: '#e8f4f8',
  bgWarning: '#fef7e5',
  bgWarningAlt: '#fff8e6',
  
  // Column colors (matching calculator headers)
  columnNavy: '#002855',
  columnNavy500: '#27723e',
  columnNavyDark: '#032d60',
  columnOrange: '#ed8b00',
  columnOrangeDark: '#dd7a01',
  
  // Border colors
  borderLight: '#dddbda',
  borderSubtle: '#f3f2f2',
  borderWarning: '#dd7a01',
  
  // Status colors
  error: '#ff0000',
  errorDark: '#dc3545',
  success: '#28a745',
};
