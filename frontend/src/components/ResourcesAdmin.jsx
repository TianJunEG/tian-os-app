import React, { useEffect, useState } from 'react';
import { resourcesAPI } from '../services/api';
import { RESOURCE_CATEGORIES } from '../config/brand';
import { Badge } from './ui/index.jsx';

const emptyForm = {
  title: '',
  category: RESOURCE_CATEGORIES[0].id,
  level: '',
  subject: '',
  summary: '',
  body: '',
  published: true,
  gated: false
};

const categoryName = (id) => RESOURCE_CATEGORIES.find((c) => c.id === id)?.name || id;

const ResourcesAdmin = () => {
  const [resources, setResources] = useState([]);
  const [leads, setLeads] = useState([]);
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

  const loadLeads = async () => {
    try {
      const res = await resourcesAPI.getLeads();
      setLeads(res.data.leads);
    } catch (err) {
      console.error('Error loading leads:', err);
    }
  };

  useEffect(() => {
    loadResources();
    loadLeads();
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
      published: resource.published,
      gated: resource.gated || false
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
      data.append('gated', form.gated);
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
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-ink-700">{editingId ? 'Edit Resource' : 'Add Resource'}</h2>

      <form className="ds-resource-form" onSubmit={handleSubmit}>
        {error && <div className="sm:col-span-2 text-sm text-error-500 bg-error-100 border border-error-500/20 p-3 rounded-lg">{error}</div>}

        <div className="full-width">
          <label htmlFor="res-title">Title</label>
          <input id="res-title" type="text" name="title" value={form.title} onChange={handleChange} required maxLength={200} />
        </div>

        <div>
          <label htmlFor="res-category">Category</label>
          <select id="res-category" name="category" value={form.category} onChange={handleChange}>
            {RESOURCE_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="res-level">Level (optional)</label>
          <input id="res-level" type="text" name="level" value={form.level} onChange={handleChange} placeholder="e.g. Primary 5" maxLength={60} />
        </div>

        <div>
          <label htmlFor="res-subject">Subject (optional)</label>
          <input id="res-subject" type="text" name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Mathematics" maxLength={60} />
        </div>

        <div>
          <label htmlFor="res-file">Attachment (PDF/image, optional)</label>
          <input id="res-file" type="file" accept="application/pdf,image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
        </div>

        <div className="full-width">
          <label htmlFor="res-summary">Summary (shown in listings)</label>
          <input id="res-summary" type="text" name="summary" value={form.summary} onChange={handleChange} maxLength={400} />
        </div>

        <div className="full-width">
          <label htmlFor="res-body">Body (Markdown supported)</label>
          <textarea
            id="res-body"
            name="body"
            value={form.body}
            onChange={handleChange}
            rows={8}
            maxLength={20000}
            placeholder="Use Markdown: # Heading, **bold**, - lists, [links](https://...)"
          />
        </div>

        <div className="form-actions">
          <label className="checkbox-row">
            <input type="checkbox" name="published" checked={form.published} onChange={handleChange} />
            Published
          </label>
          <label className="checkbox-row">
            <input type="checkbox" name="gated" checked={form.gated} onChange={handleChange} />
            Require email to access
          </label>
          <button type="submit" className="px-4 py-2 text-sm font-semibold rounded-lg bg-success-500 text-white transition hover:bg-success-700 disabled:opacity-50" disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Resource' : 'Create Resource'}
          </button>
          {editingId && (
            <button type="button" className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-line-soft bg-surface-white text-ink-700 transition hover:bg-emerald-tint" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h2 className="text-xl font-bold text-ink-700">All Resources ({resources.length})</h2>
      <div className="overflow-x-auto">
        <table className="ds-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Level</th>
              <th>Subject</th>
              <th>File</th>
              <th>Access</th>
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
                <td>{r.gated ? 'Email-gated' : 'Open'}</td>
                <td>
                  {r.published ? <Badge tone="success">Published</Badge> : <Badge tone="gold">Draft</Badge>}
                </td>
                <td>
                  <button className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-line-soft bg-surface-white text-ink-700 transition hover:bg-emerald-tint" onClick={() => startEdit(r)}>
                    Edit
                  </button>
                  <button className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-error-500 text-white transition hover:bg-error-700" onClick={() => handleDelete(r._id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {resources.length === 0 && <p className="text-center py-10 text-ink-300">No resources yet — add one above.</p>}

      <h2 className="text-xl font-bold text-ink-700">Captured Leads ({leads.length})</h2>
      <div className="overflow-x-auto">
        <table className="ds-table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Name</th>
              <th>Resource</th>
              <th>Captured</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead._id}>
                <td>{lead.email}</td>
                <td>{lead.name || '—'}</td>
                <td>{lead.resourceTitle || '—'}</td>
                <td>{new Date(lead.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {leads.length === 0 && (
        <p className="text-center py-10 text-ink-300">No leads yet — mark a resource "Require email to access" to start capturing.</p>
      )}
    </div>
  );
};

export default ResourcesAdmin;
