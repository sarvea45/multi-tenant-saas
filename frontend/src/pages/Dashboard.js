import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const Dashboard = () => {
  const [stats, setStats] = useState({ totalProjects: 0, totalTasks: 0 });
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      try {
        const meRes = await axios.get(`${API_URL}/auth/me`, config);
        const projectsRes = await axios.get(`${API_URL}/projects?limit=5`, config);
        
        setRecentProjects(projectsRes.data.data.projects);
        setStats({
            totalProjects: meRes.data.data.tenant.stats?.totalProjects || 0,
            totalTasks: meRes.data.data.tenant.stats?.totalTasks || 0
        });
      } catch (e) { console.error(e); }
    };
    fetchData();
  }, []);

  return (
    <Layout>
      <h1>Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>Total Projects</h3><p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalProjects}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
            <h3>Total Tasks</h3><p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.totalTasks}</p>
        </div>
      </div>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
        <h2>Recent Projects</h2>
        {recentProjects.map(p => (
            <div key={p.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <span>{p.name} ({p.status})</span>
                <Link to={`/projects/${p.id}`}>View</Link>
            </div>
        ))}
      </div>
    </Layout>
  );
};
export default Dashboard;