const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.PG_URI,
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = function ConnectDB() {
    return pool;
};
