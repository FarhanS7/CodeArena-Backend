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

// Mapping of service names to their prefix in the root .env
const serviceMappings = {
  'auth-service': 'AUTH',
  'execution-service': 'EXECUTION',
  'leaderboard-service': 'LEADERBOARD',
  'discussion-service': 'DISCUSSION',
  'contest-service': 'CONTEST'
};

const rootEnvContent = fs.readFileSync(rootEnvPath, 'utf8');
const rootEnvLines = rootEnvContent.split('\n');

let successCount = 0;

for (const service of services) {
  const serviceEnvPath = path.join(__dirname, service, '.env');
  
  // Start with root content BUT remove any global PORT that might cause collisions
  let filteredRootEnv = rootEnvLines.filter(l => !l.startsWith('PORT=')).join('\n');
  let serviceEnvContent = filteredRootEnv + '\n\n# --- AUTO-MAPPED DB CREDENTIALS ---\n';

  // If it's the gateway, specifically set its port to the GATEWAY_PORT
  if (service === 'api-gateway') {
    const gatewayPortLine = rootEnvLines.find(l => l.startsWith('GATEWAY_PORT='));
    if (gatewayPortLine) {
        const port = gatewayPortLine.split('=')[1];
        serviceEnvContent += `PORT=${port.trim()}\n`;
    }
  }

  const prefix = serviceMappings[service];
  if (prefix) {
    // Map prefixed variables to generic ones for this service
    rootEnvLines.forEach(line => {
      if (line.startsWith(`${prefix}_DB_`) || line.startsWith(`${prefix}_PORT`)) {
        const [key, value] = line.split('=');
        // If it's a port, genericKey should be PORT, otherwise remove the prefix
        const genericKey = (key.endsWith('_PORT') && !key.includes('_DB_')) ? 'PORT' : key.replace(`${prefix}_`, ''); 
        
        // Special case for PASSWORD/PASS mismatch in some services
        if (genericKey === 'DB_PASSWORD') {
            serviceEnvContent += `DB_PASSWORD=${value}\n`;
            serviceEnvContent += `DB_PASS=${value}\n`; // Support both
        } else if (genericKey === 'DB_USER') {
            serviceEnvContent += `DB_USER=${value}\n`;
            serviceEnvContent += `DB_USERNAME=${value}\n`; // Support both
        } else if (genericKey === 'PORT') {
            serviceEnvContent += `PORT=${value}\n`;
        } else {
            serviceEnvContent += `${genericKey}=${value}\n`;
        }
      }
    });
  }

  try {
    fs.writeFileSync(serviceEnvPath, serviceEnvContent);
    console.log(`✅ Configured and copied .env to ${service}/`);
    successCount++;
  } catch (err) {
    console.error(`❌ Failed to configure .env for ${service}/: ${err.message}`);
  }
}

if (successCount === services.length) {
  console.log('\n🎉 Successfully distributed and mapped .env to all services!');
  console.log('You can now run "npm run start:all" to launch the cluster.');
}
