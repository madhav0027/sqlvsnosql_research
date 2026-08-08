import React, { useState } from "react";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

function BenchmarkForm({ onMetricsUpdate, onUserAdded }) {
  const [mode, setMode] = useState("SINGLE"); // "SINGLE" or "BULK"
  const [operation, setOperation] = useState("INSERT");
  const [batchSize, setBatchSize] = useState(10);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    salary: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBenchmarkRun = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "SINGLE") {
        // --- Single User CRUD Benchmark ---
        const userPayload = {
          _id: crypto.randomUUID(),
          name: formData.name || "Test User",
          email: formData.email || `user_${Date.now()}@test.com`,
          age: formData.age ? Number(formData.age) : 25,
          salary: formData.salary ? Number(formData.salary) : 50000,
        };

        let response;
        if (operation === "INSERT") {
          response = await axios.post(`${API_BASE_URL}/users`, userPayload);
        } else if (operation === "UPDATE") {
          response = await axios.put(`${API_BASE_URL}/users/${userPayload._id}`, userPayload);
        } else if (operation === "DELETE") {
          response = await axios.delete(`${API_BASE_URL}/users/${userPayload._id}`);
        } else {
          // READ
          response = await axios.get(`${API_BASE_URL}/users`);
        }

        const metrics = response.data.metrics;
        if (onMetricsUpdate && metrics) {
          onMetricsUpdate({
            sqlTime: metrics.sql_time !== -1 ? metrics.sql_time : null,
            noSqlTime: metrics.mongo_time !== -1 ? metrics.mongo_time : null,
            sqlStatus: metrics.sql_time !== -1 ? "Success" : "Failed",
            noSqlStatus: metrics.mongo_time !== -1 ? "Success" : "Failed",
            payloadSize: metrics.data_size,
            winner: metrics.winner,
            fullMetrics: metrics
          });
        }

        if (onUserAdded && response.data.user) {
          onUserAdded(response.data.user);
        }

      } else {
        // --- Bulk Batch Benchmark ---
        const records = [];
        for (let i = 0; i < batchSize; i++) {
          records.push({
            _id: crypto.randomUUID(),
            name: formData.name ? `${formData.name}_${i + 1}` : `User_${i + 1}`,
            email: `user_${i}_${Date.now()}@test.com`,
            age: formData.age ? Number(formData.age) + (i % 5) : 20 + (i % 30),
            salary: formData.salary ? Number(formData.salary) + i * 100 : 40000 + i * 500,
          });
        }

        const response = await axios.post(`${API_BASE_URL}/benchmark/bulk`, {
          operation,
          records
        });
        
        const metrics = response.data.metrics;

        if (onMetricsUpdate && metrics) {
          onMetricsUpdate({
            sqlTime: metrics.sql_time !== -1 ? metrics.sql_time : null,
            noSqlTime: metrics.mongo_time !== -1 ? metrics.mongo_time : null,
            sqlStatus: metrics.sql_time !== -1 ? "Success" : "Failed",
            noSqlStatus: metrics.mongo_time !== -1 ? "Success" : "Failed",
            payloadSize: metrics.data_size,
            winner: metrics.winner,
            fullMetrics: metrics
          });
        }
      }
    } catch (error) {
      console.error("Benchmark Execution Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="research-card">
      <div className="card-header">
        <h3>Benchmark Operations Config</h3>
        <p>Configure single-user CRUD or bulk stress testing across database backends.</p>
      </div>

      <form onSubmit={handleBenchmarkRun} className="grid-form">
        <div className="field-group">
          <label>Execution Mode</label>
          <select 
            value={mode} 
            onChange={(e) => setMode(e.target.value)} 
            className="readonly-input"
            style={{
              background: 'var(--bg-dark-core)',
              border: '1px solid var(--border-tech)',
              color: 'white',
              padding: '10px',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
          >
            <option value="SINGLE">Single Record CRUD (/api/users)</option>
            <option value="BULK">Bulk Batch Stress Test (/api/benchmark/bulk)</option>
          </select>
        </div>

        <div className="field-group">
          <label>Operation Type</label>
          <select 
            value={operation} 
            onChange={(e) => setOperation(e.target.value)} 
            className="readonly-input"
            style={{
              background: 'var(--bg-dark-core)',
              border: '1px solid var(--border-tech)',
              color: 'white',
              padding: '10px',
              borderRadius: '4px',
              fontFamily: 'inherit'
            }}
          >
            <option value="INSERT">INSERT</option>
            <option value="READ">READ</option>
            <option value="UPDATE">UPDATE</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>

        {mode === "BULK" && (
          <div className="field-group id-span">
            <label>Record Count (Batch Size)</label>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Number(e.target.value))}
              min="1"
              max="1000"
              required
            />
          </div>
        )}

        <div className="field-group">
          <label>Name Template</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. TestUser"
          />
        </div>

        <div className="field-group">
          <label>Email Address</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="e.g. test@example.com"
          />
        </div>

        <div className="field-group">
          <label>Age Variable</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Base Age"
          />
        </div>

        <div className="field-group">
          <label>Salary ($)</label>
          <input
            type="number"
            name="salary"
            value={formData.salary}
            onChange={handleChange}
            placeholder="Base Salary"
          />
        </div>

        <button type="submit" disabled={loading} className="run-btn">
          {loading
            ? `Executing ${mode} ${operation}...`
            : `Run ${mode} ${operation} Benchmark`}
        </button>
      </form>
    </div>
  );
}

export default BenchmarkForm;