export default () => ({
  port: parseInt(process.env.PORT || '3006', 10),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
  },
  problemService: {
    url: process.env.PROBLEM_SERVICE_URL || 'http://problemservice:8080',
  },
});
