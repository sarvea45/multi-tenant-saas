import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import ProjectModal from '../components/ProjectModal';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } });
      setProjects(res.data.data.projects);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async (formData) => {
    try {
      await axios.post(`${API_URL}/projects`, formData, { headers: { Authorization: `Bearer ${token}` } });
      setIsModalOpen(false);
      fetchProjects();
    } catch (error) { alert(error.response?.data?.message || 'Error creating project'); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Are you sure?")) return;
    try {
        await axios.delete(`${API_URL}/projects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchProjects();
    } catch (err) { alert('Error deleting project'); }
  };

  return (
    <Layout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Projects</h1>
        <button onClick={() => setIsModalOpen(true)} style={{ background: '#007bff', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>+ New Project</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {projects.map(proj => (
            <div key={proj.id} style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h3>{proj.name}</h3>
                <p style={{ color: '#666' }}>{proj.description}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                    <Link to={`/projects/${proj.id}`} style={{ color: '#007bff' }}>View Tasks</Link>
                    <button onClick={() => handleDelete(proj.id)} style={{ color: '#dc3545', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                </div>
            </div>
        ))}
      </div>
      <ProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleCreate} />
    </Layout>
  );
};
export default Projects;