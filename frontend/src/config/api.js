// API Configuration
// Use environment variable for API URL in production, fall back to empty string for local dev (proxied by Vite)
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';
