import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const loadData = async () => {
    try {
        const pRes = await axios.get(`${API_URL}/projects`, config); 
        setProject(pRes.data.data.projects.find(p => p.id === projectId));
        const tRes = await axios.get(`${API_URL}/projects/${projectId}/tasks`, config);
        setTasks(tRes.data.data.tasks);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [projectId]);

  const addTask = async (e) => {
    e.preventDefault();
    try {
        await axios.post(`${API_URL}/projects/${projectId}/tasks`, { title: newTaskTitle }, config);
        setNewTaskTitle('');
        loadData();
    } catch (err) { alert('Error adding task'); }
  };

  const updateStatus = async (taskId, status) => {
    try { await axios.patch(`${API_URL}/tasks/${taskId}/status`, { status }, config); loadData(); } catch (e) {}
  };

  if (!project) return <Layout>Loading...</Layout>;

  return (
    <Layout>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h1>{project.name}</h1>
            <p>{project.description}</p>
        </div>
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3>Tasks</h3>
            <form onSubmit={addTask} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="New task..." style={{ flex: 1, padding: '10px' }} />
                <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none' }}>Add</button>
            </form>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {tasks.map(t => (
                    <li key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                        <span>{t.title} ({t.priority})</span>
                        <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)}>
                            <option value="todo">Todo</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Done</option>
                        </select>
                    </li>
                ))}
            </ul>
        </div>
    </Layout>
  );
};
export default ProjectDetails;