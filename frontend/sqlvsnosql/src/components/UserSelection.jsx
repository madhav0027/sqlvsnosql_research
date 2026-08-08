import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../App.css';

const API_URL = 'http://localhost:5000/api/users';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [latestMetrics, setLatestMetrics] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    salary: ''
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL);
      setUsers(Array.isArray(response.data) ? response.data : response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) return;

    try {
      let response;
      if (editingId) {
        response = await axios.put(`${API_URL}/${editingId}`, formData);
        const updatedUser = response.data.user || response.data;
        setUsers(users.map((u) => (u._id === editingId || u.id === editingId ? updatedUser : u)));
      } else {
        response = await axios.post(API_URL, formData);
        const newUser = response.data.user || response.data;
        setUsers([...users, newUser]);
      }

      if (response.data.metrics) {
        setLatestMetrics(response.data.metrics);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const handleEdit = (user) => {
    const id = user._id || user.id;
    setEditingId(id);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      age: user.age !== undefined ? user.age : '',
      salary: user.salary !== undefined ? user.salary : ''
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      setUsers(users.filter((u) => u._id !== id && u.id !== id));

      if (response.data.metrics) {
        setLatestMetrics(response.data.metrics);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', age: '', salary: '' });
    setEditingId(null);
  };

  const maxVal = latestMetrics
    ? Math.max(latestMetrics.sql_time, latestMetrics.mongo_time, 0.1)
    : 1;

  const getWidthPercent = (val) => `${Math.min((val / maxVal) * 100, 100)}%`;

  return (
    <div className="research-wrapper">
      <header className="research-header">
        <div className="badge">User Benchmark Studio</div>
        <br/>
        <h1>Empirical Single-User CRUD Suite</h1>
        <p className="subtitle">
          Direct REST CRUD operations on users with real-time latency benchmarking across PostgreSQL and MongoDB databases.
        </p>
      </header>

      <main className="dashboard-layout-stacked">
        {/* Form Card */}
        <section className="research-card">
          <div className="card-header">
            <h3>{editingId ? 'Edit User Details' : 'Add New User'}</h3>
            <p>{editingId ? `Updating ID: ${editingId}` : 'Submit new user records to execute database performance benchmarks'}</p>
          </div>

          <form onSubmit={handleSubmit} className="grid-form">
            <div className="field-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Jane Doe"
                required
              />
            </div>

            <div className="field-group">
              <label>Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. jane@example.com"
                required
              />
            </div>

            <div className="field-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 28"
              />
            </div>

            <div className="field-group">
              <label>Salary ($)</label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                placeholder="e.g. 75000"
              />
            </div>

            <div className="button-group">
              <button type="submit" className="run-btn primary-btn">
                {editingId ? 'Update & Benchmark' : 'Add User & Benchmark'}
              </button>

              {editingId && (
                <button type="button" className="run-btn cancel-btn" onClick={resetForm}>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </section>

        {/* Metrics Card */}
        {latestMetrics && (
          <section className="research-card">
            <div className="card-header">
              <h3>Latest Operation Metrics</h3>
              <p>
                Operation: <strong>{latestMetrics.operation}</strong> &nbsp;|&nbsp; Winner:{' '}
                <span className="success">{latestMetrics.winner}</span>
              </p>
            </div>

            <div className="bar-chart-container">
              <div className="chart-row">
                <span className="engine-label">PostgreSQL Execution Time</span>
                <div className="bar-wrapper">
                  <div className="bar sql-bar" style={{ width: getWidthPercent(latestMetrics.sql_time) }} />
                  <span className="time-metric">
                    {latestMetrics.sql_time !== -1 ? `${latestMetrics.sql_time} ms` : 'Failed'}
                  </span>
                </div>
              </div>

              <div className="chart-row">
                <span className="engine-label">MongoDB Execution Time</span>
                <div className="bar-wrapper">
                  <div className="bar nosql-bar" style={{ width: getWidthPercent(latestMetrics.mongo_time) }} />
                  <span className="time-metric">
                    {latestMetrics.mongo_time !== -1 ? `${latestMetrics.mongo_time} ms` : 'Failed'}
                  </span>
                </div>
              </div>
            </div>

            <div className="metadata-log">
              <div className="log-grid">
                <div><span className="success">✓ Payload Size:</span> {latestMetrics.data_size} bytes</div>
                <div><span className="success">✓ Field Count:</span> {latestMetrics.field_count} fields</div>
              </div>
            </div>
          </section>
        )}

        {/* Registered Users Section (Modern Grid Format) */}
        <section className="research-card">
          <div className="card-header">
            <h3>Registered Users</h3>
            <p>Total records: {users.length}</p>
          </div>

          {loading ? (
            <div className="chart-placeholder">Loading users from database...</div>
          ) : users.length === 0 ? (
            <div className="chart-placeholder">No users found. Create one above to begin benchmarking.</div>
          ) : (
            <div className="user-grid">
              {users.map((user) => {
                const id = user._id || user.id;
                return (
                  <div key={id} className="user-card-item">
                    <div className="user-info">
                      <strong className="user-name">{user.name}</strong>
                      <span className="user-email">{user.email}</span>
                      
                      <div className="user-meta-tags">
                        {user.age !== undefined && user.age !== '' && (
                          <span className="meta-tag">Age: {user.age}</span>
                        )}
                        {user.salary !== undefined && user.salary !== '' && (
                          <span className="meta-tag">Salary: ${Number(user.salary).toLocaleString()}</span>
                        )}
                      </div>
                    </div>

                    <div className="user-actions">
                      <button className="action-btn edit-btn" onClick={() => handleEdit(user)}>
                        Edit
                      </button>
                      <button className="action-btn delete-btn" onClick={() => handleDelete(id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}