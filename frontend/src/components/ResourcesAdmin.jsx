import React, { useEffect, useState } from 'react';
import { resourcesAPI } from '../services/api';
import { RESOURCE_CATEGORIES } from '../config/brand';

const emptyForm = {
  title: '',
  category: RESOURCE_CATEGORIES[0].id,
  level: '',
  subject: '',
  summary: '',
  body: '',
  published: true
};

const categoryName = (id) => RESOURCE_CATEGORIES.find((c) => c.id === id)?.name || id;

const ResourcesAdmin = () => {
  const [resources, setResources] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadResources = async () => {
    try {
      const res = await resourcesAPI.adminList();
      setResources(res.data.resources);
    } catch (err) {
      console.error('Error loading resources:', err);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setFile(null);
    setEditingId(null);
    setError('');
  };

  const startEdit = (resource) => {
    setEditingId(resource._id);
    setForm({
      title: resource.title || '',
      category: resource.category,
      level: resource.level || '',
      subject: resource.subject || '',
      summary: resource.summary || '',
      body: resource.body || '',
      published: resource.published
    });
    setFile(null);
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const data = new FormData();
      data.append('title', form.title);
      data.append('category', form.category);
      data.append('level', form.level);
      data.append('subject', form.subject);
      data.append('summary', form.summary);
      data.append('body', form.body);
      data.append('published', form.published);
      if (file) data.append('file', file);

      if (editingId) {
        await resourcesAPI.update(editingId, data);
      } else {
        await resourcesAPI.create(data);
      }
      resetForm();
      await loadResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the resource.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await resourcesAPI.remove(id);
      if (editingId === id) resetForm();
      await loadResources();
    } catch (err) {
      alert('Could not delete: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="admin-section">
      <h2>{editingId ? 'Edit Resource' : 'Add Resource'}</h2>

      <form className="resource-form" onSubmit={handleSubmit}>
        {error && <div className="form-error">{error}</div>}

        <div className="full-width">
          <label>Title</label>
          <input type="text" name="title" value={form.title} onChange={handleChange} required maxLength={200} />
        </div>

        <div>
          <label>Category</label>
          <select name="category" value={form.category} onChange={handleChange}>
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Level (optional)</label>
          <input type="text" name="level" value={form.level} onChange={handleChange} placeholder="e.g. Primary 5" maxLength={60} />
        </div>

        <div>
          <label>Subject (optional)</label>
          <input type="text" name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Mathematics" maxLength={60} />
        </div>

        <div>
          <label>Attachment (PDF/image, optional)</label>
          <input type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
        </div>

        <div className="full-width">
          <label>Summary (shown in listings)</label>
          <input type="text" name="summary" value={form.summary} onChange={handleChange} maxLength={400} />
        </div>

        <div className="full-width">
          <label>Body</label>
          <textarea name="body" value={form.body} onChange={handleChange} rows={8} maxLength={20000} />
        </div>

        <div className="form-actions">
          <label className="checkbox-row">
            <input type="checkbox" name="published" checked={form.published} onChange={handleChange} />
            Published
          </label>
          <button type="submit" className="btn-success" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Resource' : 'Create Resource'}
          </button>
          {editingId && (
            <button type="button" className="btn-small" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2>All Resources ({resources.length})</h2>
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Level</th>
              <th>Subject</th>
              <th>File</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((r) => (
              <tr key={r._id}>
                <td>{r.title}</td>
                <td>{categoryName(r.category)}</td>
                <td>{r.level || '—'}</td>
                <td>{r.subject || '—'}</td>
                <td>{r.fileUrl ? '✓' : '—'}</td>
                <td>
                  <span className={`badge ${r.published ? 'badge-success' : 'badge-warning'}`}>
                    {r.published ? 'Published' : 'Draft'}
                  </span>
                </td>
                <td>
                  <button className="btn-small" onClick={() => startEdit(r)}>
                    Edit
                  </button>
                  <button className="btn-danger" onClick={() => handleDelete(r._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resources.length === 0 && <p className="empty-state">No resources yet — add one above.</p>}
    </div>
  );
};

export default ResourcesAdmin;
