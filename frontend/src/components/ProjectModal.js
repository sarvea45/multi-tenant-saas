import React, { useState, useEffect } from 'react';

const ProjectModal = ({ isOpen, onClose, onSave, project = null }) => {
  const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });

  useEffect(() => {
    if (project) setFormData({ name: project.name, description: project.description, status: project.status });
    else setFormData({ name: '', description: '', status: 'active' });
  }, [project, isOpen]);

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', width: '400px' }}>
        <h3>{project ? 'Edit Project' : 'Create New Project'}</h3>
        <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }}>
          <div style={{ marginBottom: '10px' }}>
            <label>Name</label>
            <input required style={{ width: '100%', padding: '8px' }} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Description</label>
            <textarea style={{ width: '100%', padding: '8px' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div style={{ marginBottom: '10px' }}>
            <label>Status</label>
            <select style={{ width: '100%', padding: '8px' }} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
            </select>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '8px 16px' }}>Cancel</button>
            <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none' }}>Save</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ProjectModal;