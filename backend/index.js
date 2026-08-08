require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

const ConnectDB = require('./database/sql/sqlconnection');
const nosqlconnection = require('./database/nosql/nosqlconnection');
const userSchema = require('./database/models/user.schema');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({ origin: '*' }));

nosqlconnection();

        const dbclient = ConnectDB();


// Helper function to log metrics to CSV
function logToCsv(metrics) {
    const csvFilePath = path.join(__dirname, 'performance_report.csv');
    const headers = [
        'operation', 'data_size', 'field_count', 
        'record_count', 'has_join', 'indexed', 'sql_time', 'mongo_time', 'winner'
    ];

    const rowValues = headers.map(header => metrics[header]);
    const csvRow = rowValues.join(',') + '\n';

    if (!fs.existsSync(csvFilePath)) {
        const csvHeaderString = headers.join(',') + '\n';
        fs.writeFileSync(csvFilePath, csvHeaderString, 'utf8');
    }

    fs.appendFileSync(csvFilePath, csvRow, 'utf8');
    console.log(`[CSV Logger] Performance row logged to ${csvFilePath}`);
}


// 1. GET ALL USERS (Fetch from MongoDB primary, fallback to PostgreSQL)
app.get('/api/users', async (req, res) => {
    try {
        const users = await userSchema.find().lean();
        res.status(200).json(users);
    } catch (mongoErr) {
        try {
            const pgRes = await dbclient.query('SELECT id AS "_id", name, email, age, salary FROM users');
            res.status(200).json(pgRes.rows);
        } catch (pgErr) {
            res.status(500).json({ error: "Failed to fetch users from databases." });
        }
    }
});

// 2. CREATE USER (POST /api/users)
app.post('/api/users', async (req, res) => {
    return handleSingleUserOperation(req, res, 'INSERT');
});

// 3. UPDATE USER (PUT /api/users/:id)
app.put('/api/users/:id', async (req, res) => {
    req.params_id = req.params.id;
    return handleSingleUserOperation(req, res, 'UPDATE');
});

// 4. DELETE USER (DELETE /api/users/:id)
app.delete('/api/users/:id', async (req, res) => {
    req.params_id = req.params.id;
    return handleSingleUserOperation(req, res, 'DELETE');
});

// Shared Benchmark & Execution Engine
async function handleSingleUserOperation(req, res, operation) {
    const { name, email, age, salary } = req.body;
    const userId = req.params_id || req.body._id || req.body.id || crypto.randomUUID();

    const record = {
        _id: userId,
        name,
        email,
        age: age ? Number(age) : 0,
        salary: salary ? Number(salary) : 0
    };

    const data_size = Buffer.byteLength(JSON.stringify(record), 'utf8');
    const field_count = Object.keys(record).length;

    let sql_time = 0;
    let mongo_time = 0;

    // --- 1. PostgreSQL Benchmark ---
    const sqlStart = performance.now();
    try {
        if (operation === 'INSERT') {
            const query = `INSERT INTO users (id, name, email, age, salary) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`;
            await dbclient.query(query, [record._id, record.name, record.email, record.age, record.salary]);
        } else if (operation === 'READ') {
            const query = `SELECT * FROM users WHERE id = $1`;
            await dbclient.query(query, [record._id]);
        } else if (operation === 'UPDATE') {
            const query = `UPDATE users SET name = $1, email = $2, age = $3, salary = $4 WHERE id = $5`;
            await dbclient.query(query, [record.name, record.email, record.age, record.salary, record._id]);
        } else if (operation === 'DELETE') {
            const query = `DELETE FROM users WHERE id = $1`;
            await dbclient.query(query, [record._id]);
        }
        sql_time = parseFloat((performance.now() - sqlStart).toFixed(3));
    } catch (error) {
        console.error('PostgreSQL Error:', error.stack);
        sql_time = -1;
    }

    // --- 2. MongoDB Benchmark ---
    const mongoStart = performance.now();
    try {
        if (operation === 'INSERT') {
            await userSchema.create({
                _id: record._id,
                name: record.name,
                email: record.email,
                age: record.age,
                salary: record.salary
            });
        } else if (operation === 'READ') {
            await userSchema.findById(record._id);
        } else if (operation === 'UPDATE') {
            await userSchema.updateOne(
                { _id: record._id },
                { $set: { name: record.name, email: record.email, age: record.age, salary: record.salary } }
            );
        } else if (operation === 'DELETE') {
            await userSchema.deleteOne({ _id: record._id });
        }
        mongo_time = parseFloat((performance.now() - mongoStart).toFixed(3));
    } catch (error) {
        console.error('MongoDB Error:', error);
        mongo_time = -1;
    }

    // --- 3. Evaluate Winner & Metrics ---
    let winner = "Tie";
    if (sql_time !== -1 && mongo_time !== -1) {
        winner = sql_time < mongo_time ? "SQL (PostgreSQL)" : "NoSQL (MongoDB)";
    } else if (sql_time === -1) {
        winner = "MongoDB (SQL Failed)";
    } else if (mongo_time === -1) {
        winner = "PostgreSQL (MongoDB Failed)";
    }

    const performanceReport = {
        operation: `SINGLE_${operation}`,
        data_size,
        field_count,
        record_count: 1,
        has_join: false,
        indexed: true,
        sql_time,
        mongo_time,
        winner
    };

    if (typeof logToCsv === 'function') {
        logToCsv(performanceReport);
    }

    // --- 4. Return Updated User Record + Benchmark Metrics ---
    return res.status(operation === 'INSERT' ? 201 : 200).json({
        success: true,
        user: record,
        metrics: performanceReport
    });
}

// RESTORED BULK BENCHMARK ROUTE (/api/benchmark/bulk)
app.post('/api/benchmark/bulk', async (req, res) => {
    const { operation, records } = req.body; 

    if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({ error: "Invalid or empty records payload for bulk operation." });
    }

    let allReports = [];

    for (const rec of records) {
        const data_size = Buffer.byteLength(JSON.stringify(rec), 'utf8');
        const field_count = Object.keys(rec).length;
        const record_count = 1; 
        const has_join = false;
        const indexed = true;

        let sql_time = 0;
        let mongo_time = 0;

        // --- 1. PostgreSQL Bulk Operation Benchmark ---
        const sqlStart = performance.now();
        try {
            if (operation === 'INSERT') {
                const query = `INSERT INTO users (id, name, email, age, salary) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`;
                await dbclient.query(query, [rec._id, rec.name, rec.email, rec.age, rec.salary]);
            } else if (operation === 'READ') {
                const query = `SELECT * FROM users WHERE id = $1`;
                await dbclient.query(query, [rec._id]);
            } else if (operation === 'UPDATE') {
                const query = `UPDATE users SET name = $1, email = $2, age = $3, salary = $4 WHERE id = $5`;
                await dbclient.query(query, [rec.name, rec.email, rec.age, rec.salary, rec._id]);
            } else if (operation === 'DELETE') {
                const query = `DELETE FROM users WHERE id = $1`;
                await dbclient.query(query, [rec._id]);
            }
            sql_time = parseFloat((performance.now() - sqlStart).toFixed(3));
        } catch (error) {
            console.error('PostgreSQL Error:', error.stack);
            sql_time = -1;
        } 
      
        // --- 2. MongoDB Bulk Operation Benchmark ---
        const mongoStart = performance.now();
        try {
            if (operation === 'INSERT') {
                await userSchema.create({
                    _id: rec._id,
                    name: rec.name,
                    email: rec.email,
                    age: rec.age,
                    salary: rec.salary
                });
            } else if (operation === 'READ') {
                await userSchema.findById(rec._id);
            } else if (operation === 'UPDATE') {
                await userSchema.updateOne(
                    { _id: rec._id },
                    { $set: { name: rec.name, email: rec.email, age: rec.age, salary: rec.salary } }
                );
            } else if (operation === 'DELETE') {
                await userSchema.deleteOne({ _id: rec._id });
            }
            mongo_time = parseFloat((performance.now() - mongoStart).toFixed(3));
        } catch (error) {
            console.error('MongoDB Error:', error);
            mongo_time = -1;
        }

        // --- 3. Evaluate Winner & Metrics ---
        let winner = "Tie";
        if (sql_time !== -1 && mongo_time !== -1) {
            winner = sql_time < mongo_time ? "SQL (PostgreSQL)" : "NoSQL (MongoDB)";
        } else if (sql_time === -1) {
            winner = "MongoDB (SQL Failed)";
        } else if (mongo_time === -1) {
            winner = "PostgreSQL (MongoDB Failed)";
        }

        const performanceReport = {
            operation: `${operation}`,
            data_size,
            field_count,
            record_count,
            has_join,
            indexed,
            sql_time,
            mongo_time,
            winner
        };

        if (typeof logToCsv === 'function') {
            logToCsv(performanceReport);
        }

        allReports.push(performanceReport);
    }

    console.log(`[CSV Logger] Logged ${allReports.length} individual operation rows to performance_report.csv`);

    res.status(200).json({
        success: true,
        message: `Processed and logged ${allReports.length} individual ${operation} rows.`,
        metrics: allReports[allReports.length - 1] // Returns the latest metrics report for the UI
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});