export const HEALTH_ENDPOINTS = {
  auth: '/auth/health',
  problem: '/actuator/health',
  execution: '/api/health',
  ai: '/ai/health',
  search: '/health',
  email: '/health',
  leaderboard: '/health',
  discussion: '/health',
  contest: '/health',
  realtime: '/health',
} as const;
