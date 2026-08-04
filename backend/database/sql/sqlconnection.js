const { Pool } = require('pg');

// Create a single global pool instance
const pool = new Pool({
    connectionString: process.env.PG_URI,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});

// Export a function that simply returns the shared pool
module.exports = function ConnectDB() {
    return pool;
};