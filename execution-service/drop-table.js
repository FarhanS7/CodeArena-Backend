const { Client } = require('pg');

async function dropTable() {
  const client = new Client({
    host: 'localhost',
    port: 5434,
    user: 'postgres',
    password: 'postgres',
    database: 'execution_db',
  });

  try {
    await client.connect();
    console.log('Connected to database');
    await client.query('DROP TABLE IF EXISTS submissions CASCADE;');
    console.log('Table submissions dropped successfully');
  } catch (err) {
    console.error('Error dropping table:', err);
  } finally {
    await client.end();
  }
}

dropTable();
