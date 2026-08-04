import React, { useState } from "react";
import axios from "axios";

function BenchmarkForm({ onMetricsUpdate }) {
  const [operation, setOperation] = useState("INSERT");
  const [batchSize, setBatchSize] = useState(10); // Number of records to generate for bulk testing
  
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

    // Generate an array of records based on batchSize
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

    try {
      // Call the bulk benchmark route
      const response = await axios.post("http://localhost:5000/api/benchmark/bulk", {
        operation,
        records
      });
      
      const metrics = response.data.metrics;

      if (onMetricsUpdate) {
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

    } catch (error) {
      console.error("Bulk Benchmark Execution Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="research-card">
      <div className="card-header">
        <h3>Bulk Dataset Configuration</h3>
        <p>Select an operation and batch size to stress-test your storage backends.</p>
      </div>

      <form onSubmit={handleBenchmarkRun} className="grid-form">
        <div className="field-group">
          <label>Operation Type</label>
          <select value={operation} onChange={(e) => setOperation(e.target.value)} className="readonly-input">
            <option value="INSERT">INSERT (Bulk)</option>
            <option value="READ">READ (Bulk)</option>
            <option value="UPDATE">UPDATE (Bulk)</option>
            <option value="DELETE">DELETE (Bulk)</option>
          </select>
        </div>

        <div className="field-group">
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

        <div className="field-group">
          <label>Base Name Template</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. TestUser"
          />
        </div>

        <div className="field-group">
          <label>Base Age Variable</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Base Age"
          />
        </div>

        <button type="submit" disabled={loading} className="run-btn">
          {loading
            ? `Executing Bulk ${operation}...`
            : `Run Bulk ${operation} Benchmark`}
        </button>
      </form>
    </div>
  );
}

export default BenchmarkForm;