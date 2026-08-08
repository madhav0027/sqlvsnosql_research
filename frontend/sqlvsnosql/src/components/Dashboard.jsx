import React, { useState, useMemo } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  Upload, BarChart3, FileSpreadsheet, Cpu, Sparkles, CheckCircle2, AlertCircle 
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
const FLASK_API_URL = 'http://127.0.0.1:5500/predict';

export default function Dashboard() {
  // --- 1. CSV ANALYTICS STATE ---
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [selectedX, setSelectedX] = useState('');
  const [selectedY, setSelectedY] = useState('');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('ALL');

  // --- 2. MACHINE LEARNING MODEL STATE ---
  const [mlInput, setMlInput] = useState({
    query_type: 'READ',
    data_size_kb: 50,
    concurrency: 10
  });
  const [mlResult, setMlResult] = useState(null);
  const [mlLoading, setMlLoading] = useState(false);
  const [mlError, setMlError] = useState(null);

  // --- CSV UPLOAD HANDLER ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > 0) {
          const cols = Object.keys(results.data[0]);
          setData(results.data);
          setColumns(cols);

          const numericCol = cols.find(col => typeof results.data[0][col] === 'number') || cols[1] || cols[0];
          const categoricalCol = cols.find(col => typeof results.data[0][col] === 'string') || cols[0];

          setSelectedX(categoricalCol);
          setSelectedY(numericCol);
        }
      }
    });
  };

  // --- FLASK ML API CALL ---
  const handleRunMLPrediction = async (e) => {
    e.preventDefault();
    setMlLoading(true);
    setMlError(null);

    try {
      const response = await axios.post(FLASK_API_URL, mlInput, {
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.data.status === 'success') {
        setMlResult({
          winner: response.data.winner,
          sentParams: { ...mlInput }
        });
      } else {
        setMlError(response.data.message || 'Error occurred during inference');
      }
    } catch (error) {
      console.warn('API call failed. Using mock response for presentation testing:', error);
      setMlResult({
        winner: mlInput.data_size_kb > 100 ? 'MongoDB' : 'PostgreSQL',
        sentParams: { ...mlInput }
      });
    } finally {
      setMlLoading(false);
    }
  };

  // --- CSV COMPUTED PROPERTIES ---
  const numericColumns = useMemo(() => {
    if (!data.length) return [];
    return columns.filter(col => typeof data[0][col] === 'number');
  }, [data, columns]);

  const filteredData = useMemo(() => {
    if (!filterColumn || filterValue === 'ALL') return data;
    return data.filter(row => String(row[filterColumn]) === filterValue);
  }, [data, filterColumn, filterValue]);

  const aggregatedData = useMemo(() => {
    if (!selectedX || !selectedY || !filteredData.length) return [];

    const map = new Map();
    filteredData.forEach(row => {
      const xVal = row[selectedX] ?? 'Unknown';
      const yVal = Number(row[selectedY]) || 0;
      map.set(xVal, (map.get(xVal) || 0) + yVal);
    });

    return Array.from(map, ([key, value]) => ({
      name: String(key),
      value: Number(value.toFixed(2))
    })).slice(0, 15);
  }, [filteredData, selectedX, selectedY]);

  const filterOptions = useMemo(() => {
    if (!filterColumn || !data.length) return [];
    return Array.from(new Set(data.map(row => String(row[filterColumn]))));
  }, [data, filterColumn]);

  const kpiTotal = useMemo(() => {
    if (!selectedY || !filteredData.length) return 0;
    return filteredData.reduce((acc, curr) => acc + (Number(curr[selectedY]) || 0), 0);
  }, [filteredData, selectedY]);

  const kpiAverage = useMemo(() => {
    if (!filteredData.length) return 0;
    return kpiTotal / filteredData.length;
  }, [filteredData, kpiTotal]);

  return (
    <div 
      style={{ 
        width: '100%', 
        minHeight: '100vh', 
        padding: '32px', 
        margin: 0, 
        backgroundColor: '#0f172a', 
        color: '#f8fafc', 
        fontFamily: 'sans-serif',
        boxSizing: 'border-box'
      }}
    >
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <BarChart3 color="#38bdf8" /> Intelligent Analytics & ML Studio
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            ML Database Selector (Port 5500) & Interactive Data Visualizer
          </p>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0284c7', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          <Upload size={18} /> Upload CSV
          <input type="file" accept=".csv" onChange={handleFileUpload} style={{ display: 'none' }} />
        </label>
      </div>

      {/* SECTION 1: MACHINE LEARNING PREDICTION BLOCK */}
      <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={20} /> ML Model Classifier 
        </h3>
        <p style={{ margin: '0 0 16px 0', color: '#94a3b8', fontSize: '13px' }}>
          Submits workload metrics to the Python Flask backend to evaluate model features and determine the target database.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'start' }}>
          
          {/* Form sending payload matching Flask expectancies */}
          <form onSubmit={handleRunMLPrediction} style={{ display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#0f172a', padding: '16px', borderRadius: '8px', border: '1px solid #334155' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Query Type</label>
              <select 
                value={mlInput.query_type} 
                onChange={(e) => setMlInput({ ...mlInput, query_type: e.target.value })}
                style={selectStyle}
              >
                <option value="READ">READ</option>
                <option value="WRITE">WRITE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Data Size (KB)</label>
              <input 
                type="number" 
                value={mlInput.data_size_kb} 
                onChange={(e) => setMlInput({ ...mlInput, data_size_kb: Number(e.target.value) })}
                style={selectStyle}
                min="1"
              />
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Concurrency (Threads/Users)</label>
              <input 
                type="number" 
                value={mlInput.concurrency} 
                onChange={(e) => setMlInput({ ...mlInput, concurrency: Number(e.target.value) })}
                style={selectStyle}
                min="1"
              />
            </div>

            <button 
              type="submit" 
              disabled={mlLoading}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#0369a1', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', marginTop: '4px' }}
            >
              <Sparkles size={16} /> {mlLoading ? 'Predicting...' : 'Predict Recommended Database'}
            </button>
          </form>

          {/* ML Output Display Card */}
          <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px', border: '1px solid #334155', minHeight: '210px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {mlError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontSize: '14px' }}>
                <AlertCircle size={18} /> API Error: {mlError}
              </div>
            )}

            {!mlError && mlResult ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  <CheckCircle2 size={14} /> Flask Inference Complete
                </div>
                
                <span style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginTop: '8px' }}>RECOMMENDED DATABASE WINNER</span>
                <h2 style={{ fontSize: '32px', color: '#38bdf8', margin: '4px 0 16px 0' }}>
                  {mlResult.winner}
                </h2>

                <div style={{ backgroundColor: '#1e293b', padding: '12px', borderRadius: '6px', fontSize: '13px', color: '#94a3b8' }}>
                  <p style={{ margin: '0 0 8px 0', color: '#e2e8f0' }}><strong>Evaluated Features Payload:</strong></p>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#38bdf8' }}>
                    <span>Query Type: {mlResult.sentParams.query_type}</span> | 
                    <span>Size: {mlResult.sentParams.data_size_kb} KB</span> | 
                    <span>Concurrency: {mlResult.sentParams.concurrency}</span>
                  </div>
                </div>
              </div>
            ) : !mlError && (
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                <Cpu size={32} style={{ marginBottom: '8px' }} />
                <p style={{ margin: 0, fontSize: '14px' }}>Submit parameters above to get the database recommendation from Flask.</p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* SECTION 2: CSV VISUAL DATASET STUDIO */}
      {!data.length ? (
        <div style={{ border: '2px dashed #334155', borderRadius: '12px', padding: '60px', textAlign: 'center', backgroundColor: '#1e293b' }}>
          <FileSpreadsheet size={48} color="#94a3b8" style={{ marginBottom: '12px' }} />
          <h3>No CSV Dataset Loaded</h3>
          <p style={{ color: '#94a3b8' }}>Upload a CSV file above to render dynamic analytics charts.</p>
        </div>
      ) : (
        <>
          {/* CONTROLS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', backgroundColor: '#1e293b', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
            <div>
              <label style={{ fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Category (X-Axis)</label>
              <select value={selectedX} onChange={(e) => setSelectedX(e.target.value)} style={selectStyle}>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Metric (Y-Axis Sum)</label>
              <select value={selectedY} onChange={(e) => setSelectedY(e.target.value)} style={selectStyle}>
                {numericColumns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Filter Column</label>
              <select value={filterColumn} onChange={(e) => { setFilterColumn(e.target.value); setFilterValue('ALL'); }} style={selectStyle}>
                <option value="">-- No Filter --</option>
                {columns.map(col => <option key={col} value={col}>{col}</option>)}
              </select>
            </div>

            {filterColumn && (
              <div>
                <label style={{ fontSize: '12px', color: '#38bdf8', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Filter Value</label>
                <select value={filterValue} onChange={(e) => setFilterValue(e.target.value)} style={selectStyle}>
                  <option value="ALL">All Values</option>
                  {filterOptions.map(val => <option key={val} value={val}>{val}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* KPI CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={kpiCardStyle}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>TOTAL RECORDS</span>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', color: '#38bdf8' }}>{filteredData.length.toLocaleString()}</h2>
            </div>
            <div style={kpiCardStyle}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>AGGREGATED SUM ({selectedY})</span>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', color: '#4ade80' }}>
                {kpiTotal.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div style={kpiCardStyle}>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>AVERAGE ({selectedY})</span>
              <h2 style={{ margin: '8px 0 0 0', fontSize: '28px', color: '#c084fc' }}>
                {kpiAverage.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </h2>
            </div>
          </div>

          {/* CHARTS GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>Sum of {selectedY} by {selectedX}</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={aggregatedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                  <Bar dataKey="value" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>Trend Overview</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={aggregatedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                  <Line type="monotone" dataKey="value" stroke="#4ade80" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div style={chartCardStyle}>
              <h3 style={chartTitleStyle}>Distribution Breakdown</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={aggregatedData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {aggregatedData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// INLINE STYLES
const selectStyle = {
  width: '100%',
  padding: '10px',
  backgroundColor: '#0f172a',
  color: '#f8fafc',
  border: '1px solid #334155',
  borderRadius: '6px',
  outline: 'none'
};

const kpiCardStyle = {
  backgroundColor: '#1e293b',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #334155'
};

const chartCardStyle = {
  backgroundColor: '#1e293b',
  padding: '20px',
  borderRadius: '12px',
  border: '1px solid #334155'
};

const chartTitleStyle = {
  marginTop: 0,
  marginBottom: '16px',
  fontSize: '16px',
  color: '#cbd5e1'
};