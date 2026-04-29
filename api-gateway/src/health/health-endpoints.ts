export const HEALTH_ENDPOINTS = {
  auth: '/auth/health',
  problem: '/actuator/health',
  execution: '/api/health',
  ai: '/ai/health',
} as const;
