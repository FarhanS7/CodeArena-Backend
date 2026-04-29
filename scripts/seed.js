const axios = require('axios');
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GATEWAY_URL = process.env.GATEWAY_URL || 'http://localhost:20000';
const AUTH_DB_URL = process.env.AUTH_DB_URL || 'postgresql://postgres:postgres@localhost:5432/auth_db';

const api = axios.create({
  baseURL: GATEWAY_URL,
  withCredentials: true,
});

async function setAdminRole(email) {
  const client = new Client({ connectionString: AUTH_DB_URL });
  await client.connect();
  try {
    await client.query("UPDATE \"user\" SET role = 'ADMIN' WHERE email = $1", [email]);
    console.log(`✅ User ${email} promoted to ADMIN.`);
  } catch (error) {
    console.error(`❌ Failed to promote ${email} to ADMIN:`, error);
  } finally {
    await client.end();
  }
}

async function seed() {
  console.log('🌱 Starting Database Seeding...');

  try {
    // 1. Create Admin User
    const adminData = {
      email: 'admin@codearena.com',
      username: 'CodeArenaAdmin',
      password: 'Password123!',
    };

    console.log('Creating Admin User...');
    try {
      await api.post('/auth/signup', adminData);
    } catch (e) {
      if (e.response?.status === 409) {
        console.log('Admin already exists.');
      } else {
        throw e;
      }
    }

    // Set role in DB
    await setAdminRole(adminData.email);

    // Login to get token
    const loginRes = await api.post('/auth/login', {
      email: adminData.email,
      password: adminData.password,
    });
    
    const cookies = loginRes.headers['set-cookie'];
    if (cookies) {
      api.defaults.headers.Cookie = cookies.join('; ');
    }

    console.log('✅ Logged in as Admin.');

    // 2. Create Problems
    console.log('Creating Sample Problems...');
    const problems = [
      {
        title: 'Two Sum',
        difficulty: 'EASY',
        description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
        exampleInput: 'nums = [2,7,11,15], target = 9',
        exampleOutput: '[0,1]',
        published: true,
        tags: ['Array', 'Hash Table'],
        testCases: [
          { input: '4\n2 7 11 15\n9', expectedOutput: '0 1' },
          { input: '3\n3 2 4\n6', expectedOutput: '1 2' },
          { input: '2\n3 3\n6', expectedOutput: '0 1' }
        ]
      },
      {
        title: 'Valid Parentheses',
        difficulty: 'EASY',
        description: 'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.',
        exampleInput: 's = "()"',
        exampleOutput: 'true',
        published: true,
        tags: ['String', 'Stack'],
        testCases: [
          { input: '()', expectedOutput: 'true' },
          { input: '()[]{}', expectedOutput: 'true' },
          { input: '(]', expectedOutput: 'false' }
        ]
      }
    ];

    for (const problem of problems) {
      try {
        await api.post('/problems', problem);
        console.log(`✅ Created problem: ${problem.title}`);
      } catch (e) {
        console.log(`⚠️ Problem ${problem.title} might already exist or failed: ${e.response?.data?.message || e.message}`);
      }
    }

    // 3. Create Sample Contest
    console.log('Creating Sample Contest...');
    const now = new Date();
    const startTime = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    const registrationStartTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Yesterday
    const registrationEndTime = new Date(startTime.getTime() - 60 * 60 * 1000); // 1 hour before start

    // We need problem IDs for the contest. Assuming they are 1 and 2 if just created.
    const contestData = {
      title: 'Code Arena Inaugural Cup',
      description: 'Welcome to the first official Code Arena contest! Prove your algorithms knowledge and climb the leaderboard.',
      registrationStartTime: registrationStartTime.toISOString(),
      registrationEndTime: registrationEndTime.toISOString(),
      startTime: startTime.toISOString(),
      durationInMinutes: 120,
      isPublic: true,
      isRated: true,
      maxParticipants: 100,
      problems: [
        { problemId: 1, points: 100, orderIndex: 0, label: 'A' },
        { problemId: 2, points: 200, orderIndex: 1, label: 'B' }
      ]
    };

    try {
      await api.post('/contests', contestData);
      console.log(`✅ Created contest: ${contestData.title}`);
    } catch (e) {
      console.log(`⚠️ Contest creation failed: ${e.response?.data?.message || e.message}`);
    }

    console.log('🎉 Seeding Complete!');

  } catch (error) {
    console.error('❌ Seeding Failed:', error.response?.data || error.message);
  }
}

seed();
