const fs = require('fs');
const path = require('path');

const rootEnvPath = path.join(__dirname, '.env');
if (!fs.existsSync(rootEnvPath)) {
  console.error('❌ Root .env file not found. Please copy .env.cloud-local.example to .env and fill it out first.');
  process.exit(1);
}

const services = [
  'ai-service',
  'api-gateway',
  'auth-service',
  'contest-service',
  'discussion-service',
  'email-service',
  'execution-service',
  'leaderboard-service',
  'problem-service',
  'realtime-service',
  'search-service'
];

let successCount = 0;

for (const service of services) {
  const serviceEnvPath = path.join(__dirname, service, '.env');
  try {
    fs.copyFileSync(rootEnvPath, serviceEnvPath);
    console.log(`✅ Copied .env to ${service}/`);
    successCount++;
  } catch (err) {
    console.error(`❌ Failed to copy .env to ${service}/: ${err.message}`);
  }
}

if (successCount === services.length) {
  console.log('\n🎉 Successfully distributed .env to all services!');
  console.log('You can now run "npm run start:all" to launch the cluster.');
}
