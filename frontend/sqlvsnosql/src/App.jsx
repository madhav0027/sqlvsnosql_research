import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';

import UserSelection from './components/UserSelection';
import BenchmarkForm from './components/BenchmarkForm';
import ComparisonChart from './components/ComparisonChart';
import Dashboard from './components/Dashboard';
import './App.css';

const INITIAL_USERS = [
  {
    id: 'USR-001',
    name: 'Dr. Evelyn Vance',
    role: 'Lead Architect',
    metrics: { recordCount: 100000, readLatencySQL: 12.4, writeLatencySQL: 45.2, readLatencyNoSQL: 4.2, writeLatencyNoSQL: 18.1 }
  },
  {
    id: 'USR-002',
    name: 'Marcus Chen',
    role: 'Systems Engineer',
    metrics: { recordCount: 500000, readLatencySQL: 48.1, writeLatencySQL: 120.5, readLatencyNoSQL: 11.3, writeLatencyNoSQL: 42.0 }
  }
];

function UserSelectionView({ users, onCreateUser, onDeleteUser }) {
  const navigate = useNavigate();

  const handleSelectUser = (id) => {
    navigate(`/benchmark/${id}`);
  };

  return (
    <main className="dashboard-layout-stacked">
      <UserSelection
        users={users}
        activeUserId={null}
        onSelectUser={handleSelectUser}
        onCreateUser={(newUser) => {
          onCreateUser(newUser);
          navigate(`/benchmark/${newUser.id}`);
        }}
        onDeleteUser={onDeleteUser}
      />
    </main>
  );
}

function BenchmarkView({ users, onUpdateMetrics }) {
  const { userId } = useParams();
  const activeUser = users.find((u) => u.id === userId) || null;

  if (!activeUser) {
    return (
      <div className="chart-placeholder">
        <p>User profile not found or removed.</p>
        <Link to="/" className="run-btn primary-btn" style={{ display: 'inline-block', marginTop: '16px', textDecoration: 'none' }}>
          Back to User Selection
        </Link>
      </div>
    );
  }

  return (
    <main className="dashboard-layout-stacked">
      <section className="research-card">
        <BenchmarkForm
          key={activeUser.id}
          activeUser={activeUser}
          onSaveMetrics={(metrics) => onUpdateMetrics(activeUser.id, metrics)}
        />
      </section>

      <section className="research-card">
        <ComparisonChart activeUser={activeUser} />
      </section>
    </main>
  );
}

export default function App() {
  const [users, setUsers] = useState(INITIAL_USERS);

  const handleCreateUser = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
  };

  const handleUpdateMetrics = (userId, updatedMetrics) => {
    setUsers((prev) =>
      prev.map((user) => (user.id === userId ? { ...user, metrics: updatedMetrics } : user))
    );
  };

  const handleDeleteUser = (userId) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  return (
    <BrowserRouter>
      <div className="research-wrapper">
        <header className="research-header">
          <div className="header-top-row">
            <div className="badge">Research Lab</div>
            <nav className="nav-links">
              <Link to="/" className="nav-link">
                User Selection
              </Link>
            </nav>
          </div>
          <h1>Empirical Evaluation Suite: SQL vs. NoSQL</h1>
          <p className="subtitle">
            An isolated instrumentation framework benchmarking latency behaviors during transactional index injections across multi-user evaluation profiles.
          </p>
        </header>

        <Routes>
          <Route
            path="/"
            element={
              <UserSelectionView
                users={users}
                onCreateUser={handleCreateUser}
                onDeleteUser={handleDeleteUser}
              />
            }
          />
          <Route
            path="/benchmark/:userId"
            element={
              <BenchmarkView
                users={users}
                onUpdateMetrics={handleUpdateMetrics}
              />
            }
          /><Route
            path="/dashboard"
            element={
              <Dashboard/>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}