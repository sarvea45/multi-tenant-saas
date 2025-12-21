import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '', tenantSubdomain: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const res = await axios.post(`${API_URL}/auth/login`, formData);
      localStorage.setItem('token', res.data.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', fontFamily: 'Arial' }}>
      <h2>Login</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '15px' }}>
        <input placeholder="Subdomain (e.g. demo)" name="tenantSubdomain" required onChange={e => setFormData({...formData, tenantSubdomain: e.target.value})} style={{ padding: '10px' }} />
        <input placeholder="Email" type="email" name="email" required onChange={e => setFormData({...formData, email: e.target.value})} style={{ padding: '10px' }} />
        <input placeholder="Password" type="password" name="password" required onChange={e => setFormData({...formData, password: e.target.value})} style={{ padding: '10px' }} />
        <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none' }}>Login</button>
      </form>
      <p style={{ textAlign: 'center' }}><Link to="/register">Register New Tenant</Link></p>
    </div>
  );
};
export default Login;