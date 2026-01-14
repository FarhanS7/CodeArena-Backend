export default () => ({
  port: parseInt(process.env.PORT || '3006', 10),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  problemService: {
    url: process.env.PROBLEM_SERVICE_URL || 'http://problemservice:8080',
  },
});
