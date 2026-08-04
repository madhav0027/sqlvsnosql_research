import React from 'react';

function ComparisonChart({ data }) {
  if (!data) return (
    <div className="chart-placeholder">
      <p>Awaiting engine routine execution to trace empirical telemetry visualizations.</p>
    </div>
  );

  const maxVal = Math.max(parseFloat(data.sqlTime), parseFloat(data.noSqlTime), 1);
  const sqlPct = (parseFloat(data.sqlTime) / maxVal) * 100;
  const noSqlPct = (parseFloat(data.noSqlTime) / maxVal) * 100;

  return (
    <div className="research-card">
      <div className="card-header">
        <h3>2. Telemetry Latency Trace Vector</h3>
        <p>Comparing raw structural transaction timings (lower values indicate faster execution).</p>
      </div>

      <div className="bar-chart-container">
        <div className="chart-row">
          <div className="engine-label">Relational Engine (SQL)</div>
          <div className="bar-wrapper">
            <div className="bar sql-bar" style={{ width: `${sqlPct}%` }}></div>
            <span className="time-metric">{data.sqlTime} ms</span>
          </div>
        </div>

        <div className="chart-row">
          <div className="engine-label">Document Store (NoSQL)</div>
          <div className="bar-wrapper">
            <div className="bar nosql-bar" style={{ width: `${noSqlPct}%` }}></div>
            <span className="time-metric">{data.noSqlTime} ms</span>
          </div>
        </div>
      </div>

      <div className="metadata-log">
        <h4>Meta Analysis Context</h4>
        <div className="log-grid">
          <div><span>Payload Metadata Weight:</span> <strong>{data.payloadSize} Bytes</strong></div>
          <div><span>SQL Transaction Node:</span> <strong className={data.sqlStatus.toLowerCase()}>{data.sqlStatus}</strong></div>
          <div><span>NoSQL Transaction Node:</span> <strong className={data.noSqlStatus.toLowerCase()}>{data.noSqlStatus}</strong></div>
        </div>
      </div>
    </div>
  );
}

export default ComparisonChart;
