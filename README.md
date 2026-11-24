# SQL vs NoSQL Database Analyzer

A research-oriented **SQL vs NoSQL performance analysis and database selection system** that compares **PostgreSQL** and **MongoDB** using real database operations, performance benchmarking, CSV-based reporting, and a **Machine Learning model** that predicts which database is better suited for a given workload.

The project provides a dashboard-style analytics layer inspired by **Power BI**, allowing database performance to be analyzed through metrics such as execution time, operation type, data size, field count, indexing, and record count.

---

## 📌 Project Overview

Modern applications can choose between relational databases such as **PostgreSQL** and NoSQL databases such as **MongoDB**. However, database selection depends heavily on workload characteristics.

This project investigates:

> **"Which database performs better for a particular workload — SQL (PostgreSQL) or NoSQL (MongoDB)?"**

The system executes equivalent operations on both databases, measures their execution time, records the results, and uses the collected benchmark data for analysis and machine-learning-based database selection.

### Databases Used

* **PostgreSQL** — Relational / SQL database
* **MongoDB** — Document-oriented / NoSQL database

### Operations Benchmarked

* INSERT
* READ
* UPDATE
* DELETE
* Bulk operations

### Metrics Collected

* Operation type
* Data size
* Number of fields
* Record count
* Join requirement
* Index availability
* PostgreSQL execution time
* MongoDB execution time
* Winning database

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────┐
                         │      Frontend       │
                         │ Dashboard / Reports │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │    Node.js API      │
                         │      Express        │
                         └──────────┬──────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  │                                   │
                  ▼                                   ▼
        ┌──────────────────┐                 ┌──────────────────┐
        │    PostgreSQL    │                 │     MongoDB      │
        │    SQL Database  │                 │    NoSQL DB      │
        └────────┬─────────┘                 └────────┬─────────┘
                 │                                    │
                 └────────────────┬───────────────────┘
                                  │
                                  ▼
                         ┌─────────────────────┐
                         │ Performance Metrics │
                         │       CSV           │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
          ┌──────────────────┐            ┌──────────────────┐
          │ Dashboard / BI   │            │ Machine Learning │
          │     Reports      │            │ Database Selector│
          └──────────────────┘            └────────┬─────────┘
                                                   │
                                                   ▼
                                          ┌──────────────────┐
                                          │ Recommended DB   │
                                          │ PostgreSQL /     │
                                          │ MongoDB          │
                                          └──────────────────┘
```

---

# 📊 Dashboard & Performance Reports

The project includes a dashboard designed in a **Power BI-style analytical format** to visualize benchmark results.

## Dashboard Overview

![SQL vs NoSQL Dashboard](screenshots/dashboard-overview.png)

The dashboard provides an overview of:

* Total benchmark operations
* PostgreSQL vs MongoDB performance
* Number of operations won by each database
* Average execution time
* Operation-wise comparison
* Data-size-based performance
* Database recommendation
* Historical benchmark results

---

## ⚡ Performance Comparison

![Database Performance Comparison](screenshots/performance-comparison.png)

The performance report compares the execution time of equivalent operations performed against PostgreSQL and MongoDB.

Example metrics:

| Operation | PostgreSQL | MongoDB | Winner     |
| --------- | ---------: | ------: | ---------- |
| INSERT    |    5.21 ms | 7.84 ms | PostgreSQL |
| READ      |    2.14 ms | 1.76 ms | MongoDB    |
| UPDATE    |    4.31 ms | 5.92 ms | PostgreSQL |
| DELETE    |    3.02 ms | 2.51 ms | MongoDB    |

> **Note:** The values above are examples. Actual results depend on hardware, database configuration, indexes, network latency, dataset size, and workload.

---

# 📈 Analytics Dashboard

![Analytics Dashboard](screenshots/analytics-dashboard.png)

The dashboard can be used to analyze relationships between:

* Data size and execution time
* Number of fields and execution time
* Record count and performance
* CRUD operation type and performance
* Indexed vs non-indexed workloads
* SQL vs NoSQL performance

This makes the project useful not only as a CRUD application but also as a **database performance research and analysis platform**.

---

# 🤖 Machine Learning Database Selector

The project includes a Machine Learning component that learns from benchmark results and predicts which database is likely to perform better for a given workload.

The ML pipeline uses the benchmark data collected from PostgreSQL and MongoDB.

### Example input

```json
{
    "operation": "READ",
    "data_size": 250,
    "field_count": 5,
    "record_count": 1,
    "has_join": false,
    "indexed": true
}
```

The model processes the input and predicts a database recommendation.

### Example response

```json
{
    "status": "success",
    "winner": "NoSQL (MongoDB)"
}
```

---

# 🧠 Machine Learning Pipeline

```text
Benchmark Operations
        │
        ▼
PostgreSQL + MongoDB
        │
        ▼
Performance Measurement
        │
        ▼
performance_report.csv
        │
        ▼
Feature Engineering
        │
        ▼
Machine Learning Model
        │
        ▼
Model Training
        │
        ├── database_selector_model.pkl
        ├── label_encoder.pkl
        └── model_columns.pkl
        │
        ▼
Prediction API
        │
        ▼
Database Recommendation
```

---

# 🐍 ML Prediction API

The Machine Learning model is exposed through a Flask API.

### Endpoint

```http
POST /predict
```

### Request

```json
{
    "operation": "INSERT",
    "data_size": 300,
    "field_count": 5,
    "record_count": 1,
    "has_join": false,
    "indexed": true
}
```

### Response

```json
{
    "status": "success",
    "winner": "SQL (PostgreSQL)"
}
```

The Flask service loads the trained model, label encoder, and model columns before processing predictions.

---

# 🔬 Benchmark Methodology

The benchmark engine performs the same operation against both databases.

For each operation:

1. Generate or receive the input record.
2. Execute the operation in PostgreSQL.
3. Measure PostgreSQL execution time.
4. Execute the equivalent operation in MongoDB.
5. Measure MongoDB execution time.
6. Compare execution times.
7. Determine the winner.
8. Store the benchmark result.
9. Append the result to `performance_report.csv`.
10. Use benchmark data for visualization and ML training.

### Winner Calculation

```text
PostgreSQL time < MongoDB time
        ↓
PostgreSQL wins

MongoDB time < PostgreSQL time
        ↓
MongoDB wins
```

If one database fails during execution, the other database is marked as the winner.

---

# 📋 Performance Report Format

Benchmark results are stored in CSV format.

```csv
operation,data_size,field_count,record_count,has_join,indexed,sql_time,mongo_time,winner
INSERT,152,5,1,false,true,5.421,7.213,SQL (PostgreSQL)
READ,152,5,1,false,true,2.142,1.821,NoSQL (MongoDB)
UPDATE,155,5,1,false,true,4.381,5.021,SQL (PostgreSQL)
DELETE,151,5,1,false,true,3.102,2.712,NoSQL (MongoDB)
```

This file can be imported into analytical tools such as Power BI or used directly for Machine Learning.

---

# 🚀 Features

### Database Benchmarking

* PostgreSQL CRUD benchmarking
* MongoDB CRUD benchmarking
* Single-record benchmarking
* Bulk benchmarking
* Execution-time measurement

### Analytics

* CSV performance logging
* Database winner calculation
* Operation-level comparison
* Data-size analysis
* Record-count analysis
* Field-count analysis
* Indexed workload analysis

### Machine Learning

* Benchmark dataset generation
* Feature engineering
* Categorical feature encoding
* Database winner prediction
* Flask prediction API
* Serialized ML model

### Dashboard

* Power BI-style reporting
* KPI cards
* Database comparison charts
* Operation-wise performance
* Winner distribution
* Execution-time analysis
* Interactive performance analysis

---

# 🛠️ Technology Stack

| Component           | Technology                    |
| ------------------- | ----------------------------- |
| Backend             | Node.js                       |
| API Framework       | Express.js                    |
| SQL Database        | PostgreSQL                    |
| NoSQL Database      | MongoDB                       |
| MongoDB ODM         | Mongoose                      |
| ML API              | Python / Flask                |
| ML Model            | Scikit-learn compatible model |
| Data Processing     | Pandas                        |
| Model Serialization | Joblib                        |
| Analytics           | Power BI / Dashboard          |
| Benchmark Storage   | CSV                           |
| API Testing         | Postman                       |
| Frontend            | Dashboard / Web UI            |

---

# 📁 Project Structure

```text
SQL-NoSQL-Database-Analyzer/
│
├── database/
│   ├── models/
│   │   └── user.schema.js
│   │
│   ├── sql/
│   │   └── sqlconnection.js
│   │
│   ├── nosql/
│   │   └── nosqlconnection.js
│   │
│   └── database_selector/
│       ├── database_selector_model.pkl
│       ├── label_encoder.pkl
│       └── model_columns.pkl
│
├── screenshots/
│   ├── dashboard-overview.png
│   ├── performance-comparison.png
│   └── analytics-dashboard.png
│
├── performance_report.csv
├── server.js
├── ml_api.py
├── package.json
├── requirements.txt
└── README.md
```

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone <your-repository-url>
cd SQL-NoSQL-Database-Analyzer
```

## 2. Install Node.js Dependencies

```bash
npm install
```

## 3. Install Python Dependencies

```bash
pip install flask pandas joblib scikit-learn
```

---

# 🔐 Environment Variables

Create a `.env` file in the project root.

```env
PORT=5000

PG_HOST=localhost
PG_PORT=5432
PG_DATABASE=your_database
PG_USER=your_username
PG_PASSWORD=your_password

MONGO_URI=mongodb://localhost:27017/your_database
```

Use your actual database configuration rather than committing credentials to Git.

---

# 🗄️ PostgreSQL Setup

Create the required database and users table.

```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255),
    age INTEGER,
    salary NUMERIC
);
```

---

# 🍃 MongoDB Setup

Create a MongoDB database and configure the MongoDB connection string in `.env`.

The Mongoose user model contains:

```text
_id
name
email
age
salary
```

---

# ▶️ Running the Backend

Start the Node.js server:

```bash
node server.js
```

The API will run on:

```text
http://localhost:5000
```

---

# ▶️ Running the ML API

Start the Flask prediction service:

```bash
python ml_api.py
```

The ML API will run on:

```text
http://localhost:5500
```

---

# 🔌 API Endpoints

## Get Users

```http
GET /api/users
```

Retrieves users from MongoDB with PostgreSQL fallback.

---

## Create User

```http
POST /api/users
```

Example:

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "age": 25,
    "salary": 50000
}
```

The request is benchmarked against both databases.

---

## Update User

```http
PUT /api/users/:id
```

---

## Delete User

```http
DELETE /api/users/:id
```

---

## Bulk Benchmark

```http
POST /api/benchmark/bulk
```

Example:

```json
{
    "operation": "INSERT",
    "records": [
        {
            "_id": "1",
            "name": "User 1",
            "email": "user1@example.com",
            "age": 25,
            "salary": 50000
        },
        {
            "_id": "2",
            "name": "User 2",
            "email": "user2@example.com",
            "age": 30,
            "salary": 60000
        }
    ]
}
```

The API executes and records each operation against PostgreSQL and MongoDB.

---

# 📊 Research Questions

This project can be used to investigate several database-performance questions:

### 1. Which database performs better for CRUD operations?

PostgreSQL and MongoDB are benchmarked using equivalent operations.

### 2. Does data size affect database performance?

Execution time can be compared against increasing record sizes.

### 3. How does indexing affect performance?

Indexed workloads can be compared with workloads without indexes.

### 4. Does operation type influence the optimal database?

INSERT, READ, UPDATE, and DELETE workloads may produce different winners.

### 5. Can Machine Learning predict the appropriate database?

Historical benchmark results are used to train a model that predicts the likely better-performing database for a new workload.

---

# 📈 Example Research Analysis

The collected data can be visualized using charts such as:

```text
Average Execution Time
│
│       █████████
│       █████████        ██████
│ █████ █████████ █████  ██████
│ █████ █████████ █████  ██████
└────────────────────────────────
       PostgreSQL       MongoDB
```

Recommended dashboard visuals include:

* **KPI:** Total Operations
* **KPI:** PostgreSQL Wins
* **KPI:** MongoDB Wins
* **KPI:** Average SQL Time
* **KPI:** Average MongoDB Time
* **Bar Chart:** SQL vs NoSQL execution time
* **Donut Chart:** Database winner distribution
* **Line Chart:** Performance vs data size
* **Scatter Plot:** Field count vs execution time
* **Table:** Detailed benchmark records
* **Card:** ML Database Recommendation

---

# ⚠️ Benchmark Considerations

The benchmark results should not be interpreted as universal proof that one database is always faster.

Performance depends on factors including:

* Hardware
* CPU and RAM
* Storage type
* Database configuration
* Network latency
* Dataset size
* Indexing
* Query complexity
* Concurrent users
* Connection pooling
* Database caching
* PostgreSQL/MongoDB versions

Therefore, the project should be viewed as a **workload-specific database analysis and research system**.

---

# 🔮 Future Improvements

Potential future extensions include:

* [ ] Larger benchmark datasets
* [ ] Multi-user/concurrent benchmarking
* [ ] Query complexity as an ML feature
* [ ] JOIN vs aggregation comparison
* [ ] Index vs non-index experiments
* [ ] Automated ML model retraining
* [ ] Random Forest / XGBoost model comparison
* [ ] Confidence score for predictions
* [ ] Real-time dashboard
* [ ] Historical benchmark filtering
* [ ] Docker deployment
* [ ] Cloud database benchmarking
* [ ] Automated experiment generation
* [ ] Statistical significance testing
* [ ] Latency percentile analysis (P50/P95/P99)

---

# 🎓 Research Contribution

The main objective of this project is to combine **database benchmarking, data analytics, and machine learning** into a single experimental framework.

Instead of selecting a database purely based on general assumptions such as:

> "SQL is better for structured data."

or

> "NoSQL is better for large-scale applications."

the system attempts to make a **data-driven database selection** based on measurable workload characteristics.

The resulting architecture provides:

```text
Workload
   ↓
Database Experiments
   ↓
Performance Measurements
   ↓
Analytical Dashboard
   ↓
Training Dataset
   ↓
Machine Learning
   ↓
Database Recommendation
```

---

author 
this project made by madhav pathak 

# 📜 License

This project is intended for academic, research, and educational purposes.
