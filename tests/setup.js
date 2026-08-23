/**
 * Test setup — configures Jest for the test suite.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'sqlite://:memory:';

const db = require('../src/db/connection');
const knexConfig = require('../src/db/knexfile');

jest.setTimeout(15000);

beforeAll(async () => {
  try {
    await db.migrate.latest(knexConfig);
  } catch (err) {
    console.error('Migration error in test setup:', err);
  }
});

afterAll(async () => {
  try {
    await db.destroy();
  } catch (err) {
    // ignore
  }
});
