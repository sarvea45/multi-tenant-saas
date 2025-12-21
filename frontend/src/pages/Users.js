import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ email: '', fullName: '', password: '', role: 'user' });
  const user = JSON.parse(localStorage.getItem('user'));
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');
  const config = { headers: { Authorization: `Bearer ${token}` } };

  const loadUsers = async () => {
    try {
        const res = await axios.get(`${API_URL}/tenants/${user.tenantId}/users`, config);
        setUsers(res.data.data.users);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
        await axios.post(`${API_URL}/tenants/${user.tenantId}/users`, formData, config);
        setFormData({ email: '', fullName: '', password: '', role: 'user' });
        loadUsers();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("Delete?")) return;
    try { await axios.delete(`${API_URL}/users/${id}`, config); loadUsers(); } catch (e) {}
  };

  return (
    <Layout>
      <h1>Team Members</h1>
      <form onSubmit={handleAddUser} style={{ background: 'white', padding: '20px', marginBottom: '20px', display: 'grid', gap: '10px' }}>
          <input placeholder="Name" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} style={{ padding: '8px' }}/>
          <input placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '8px' }}/>
          <input placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '8px' }}/>
          <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ padding: '8px' }}>
            <option value="user">User</option>
            <option value="tenant_admin">Admin</option>
          </select>
          <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none' }}>Add User</button>
      </form>
      <div style={{ background: 'white', padding: '20px' }}>
        {users.map(u => (
            <div key={u.id} style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between' }}>
                <span>{u.full_name} ({u.role})</span>
                {u.id !== user.id && <button onClick={() => handleDelete(u.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>Delete</button>}
            </div>
        ))}
      </div>
    </Layout>
  );
};
export default Users;