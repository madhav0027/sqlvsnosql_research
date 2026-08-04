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

        logToCsv(performanceReport);
        allReports.push(performanceReport);
    }

    console.log(`[CSV Logger] Logged ${allReports.length} individual operation rows to performance_report.csv`);

    res.status(200).json({
        success: true,
        message: `Processed and logged ${allReports.length} individual ${operation} rows.`,
        metrics: allReports[allReports.length - 1] // Returns the last processed report for UI reference
    });
});

app.listen(PORT, () => {
    console.log(`Server is running at ${PORT}`);
});