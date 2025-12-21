import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  
  // Login States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [error, setError] = useState('');
  
  // New Project State
  const [newProjectName, setNewProjectName] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      fetchProjects(token);
    }
  }, []);

  const fetchProjects = async (token) => {
    try {
      const res = await axios.get(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(res.data.data.projects);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_URL}/auth/login`, {
        email, password, tenantSubdomain: subdomain
      });
      
      const userData = res.data.data.user;
      const token = res.data.data.token;

      setUser(userData);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      fetchProjects(token);
    } catch (err) {
      setError(err.response?.data?.message || 'Login Failed');
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await axios.post(`${API_URL}/projects`, 
        { name: newProjectName, description: 'Created via Frontend' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewProjectName('');
      fetchProjects(token);
    } catch (err) {
      alert('Error creating project');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setProjects([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  if (user) {
    return (
      <div style={{ padding: '40px', fontFamily: 'Arial', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1>{user.fullName}'s Dashboard</h1>
          <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
        
        <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <p><strong>Tenant ID:</strong> {user.tenantId || 'Super Admin'}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>

        <h3>Your Projects</h3>
        
        <form onSubmit={handleCreateProject} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <input 
            type="text" 
            placeholder="New Project Name" 
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            style={{ padding: '8px', flex: 1 }}
            required
          />
          <button type="submit" style={{ padding: '8px 16px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ Add Project</button>
        </form>

        <div style={{ display: 'grid', gap: '10px' }}>
          {projects.length === 0 ? <p>No projects found.</p> : projects.map(p => (
            <div key={p.id} style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px', background: 'white' }}>
              <h4 style={{ margin: '0 0 5px 0' }}>{p.name}</h4>
              <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Status: {p.status}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      <div style={{ width: '300px', padding: '30px', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>SaaS Login</h2>
        {error && <div style={{ color: 'red', marginBottom: '15px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
        
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Subdomain</label>
            <input type="text" value={subdomain} onChange={e => setSubdomain(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} placeholder="demo" />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} placeholder="admin@demo.com" />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} placeholder="Demo@123" />
          </div>
          <button type="submit" style={{ width: '100%', padding: '10px', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
        </form>
      </div>
    </div>
  );
}

export default App;