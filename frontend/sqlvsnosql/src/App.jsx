import React, { useState } from 'react';
import BenchmarkForm from './components/BenchmarkForm';
import ComparisonChart from './components/ComparisonChart';
import './App.css';

function App() {
  const [metrics, setMetrics] = useState(null);

  return (
    <div className="research-wrapper">
      <header className="research-header">
        <div className="badge">Research Lab </div>
        <h1>Empirical Evaluation Suite: SQL vs. NoSQL</h1>
        <center>
          <br/>
        <p className="subtitle">
          An isolated instrumentation framework benchmarking latency behaviors during transactional index injections. 
        </p>
        </center>
      </header>

      <main className="dashboard-layout">
        <section className="column">
          <BenchmarkForm onMetricsUpdate={setMetrics} />
        </section>
        
        <section className="column">
          <ComparisonChart data={metrics} />
        </section>
      </main>
    </div>
  );
}

export default App;
