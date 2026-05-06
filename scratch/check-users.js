const { Client } = require('pg');
require('dotenv').config({ path: 'auth-service/.env' });

async function checkUsers() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query('SELECT id, email, username FROM "user" LIMIT 10');
    console.log('Current Users:', res.rows);
  } catch (err) {
    console.error('Error checking users:', err);
  } finally {
    await client.end();
  }
}

checkUsers();
