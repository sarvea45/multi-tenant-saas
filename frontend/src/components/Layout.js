import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path ? '#444' : 'transparent';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <nav style={{ background: '#333', color: '#fff', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>SaaS Platform</div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/dashboard" style={{ color: '#fff', textDecoration: 'none', background: isActive('/dashboard'), padding: '5px 10px', borderRadius: '4px' }}>Dashboard</Link>
          <Link to="/projects" style={{ color: '#fff', textDecoration: 'none', background: isActive('/projects'), padding: '5px 10px', borderRadius: '4px' }}>Projects</Link>
          {(user.role === 'tenant_admin' || user.role === 'super_admin') && (
             <Link to="/users" style={{ color: '#fff', textDecoration: 'none', background: isActive('/users'), padding: '5px 10px', borderRadius: '4px' }}>Users</Link>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>{user.fullName} <small>({user.role})</small></span>
          <button onClick={handleLogout} style={{ background: '#dc3545', border: 'none', color: '#fff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </nav>
      <main style={{ flex: 1, padding: '20px', backgroundColor: '#f4f6f8' }}>{children}</main>
    </div>
  );
};
export default Layout;