export const HEALTH_ENDPOINTS = {
  auth: '/auth/health',
  problem: '/actuator/health',
  execution: '/api/health',
  ai: '/ai/health',
  search: '/health',
  email: '/health',
} as const;
