const { Client } = require('pg');

const connectionString = "postgresql://postgres.wwlkaniyxrmlaammpcoj:P3-6zxvRZnY.%6%@aws-1-eu-west-1.pooler.supabase.com:6543/postgres";

async function test() {
    console.log('Testing connection with provide string...');
    const client = new Client({ connectionString });
    try {
        await client.connect();
        console.log('Connected successfully!');
        const res = await client.query('SELECT now()');
        console.log('Result:', res.rows[0]);
        await client.end();
    } catch (err) {
        console.error('Connection failed:', err.message);
    }
}

test();
