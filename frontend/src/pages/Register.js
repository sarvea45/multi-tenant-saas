import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ tenantName: '', subdomain: '', adminEmail: '', adminFullName: '', adminPassword: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      await axios.post(`${API_URL}/auth/register-tenant`, formData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) { alert(err.response?.data?.message || 'Registration failed'); }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial' }}>
      <h2>Register Organization</h2>
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
        <input placeholder="Organization Name" required onChange={e => setFormData({...formData, tenantName: e.target.value})} style={{ padding: '10px' }} />
        <input placeholder="Subdomain" required onChange={e => setFormData({...formData, subdomain: e.target.value})} style={{ padding: '10px' }} />
        <input placeholder="Admin Name" required onChange={e => setFormData({...formData, adminFullName: e.target.value})} style={{ padding: '10px' }} />
        <input placeholder="Admin Email" type="email" required onChange={e => setFormData({...formData, adminEmail: e.target.value})} style={{ padding: '10px' }} />
        <input placeholder="Password (Min 8 chars)" type="password" required onChange={e => setFormData({...formData, adminPassword: e.target.value})} style={{ padding: '10px' }} />
        <button type="submit" style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none' }}>Register</button>
      </form>
      <p style={{ textAlign: 'center' }}><Link to="/login">Back to Login</Link></p>
    </div>
  );
};
export default Register;