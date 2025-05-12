export const API_URL = process.env.NODE_ENV === 'production' 
  ? '/api' // Production API path on Apache
  : '/api'; // Development API URL with proxy

export const API_ENDPOINTS = {
  analyzeImage: '/analyze-image',
} as const;