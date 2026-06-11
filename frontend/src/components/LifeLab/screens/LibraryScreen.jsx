import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Icon from '../Icon';

export default function LibraryScreen({ onSelectTemplate, onAssign, onNavigate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const filters = ['All', 'Math', 'Science', 'Applied learning', 'Math journal', 'Group work', 'Holiday', 'Parent-home', 'Remediation'];

  const activityTones = {
    supermarket: 'gold',
    plant: 'leaf',
    shadow: 'sun',
    recipe: 'cream',
    water: 'blue',
    forces: 'plum',
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/lifelab/templates');
      const data = await response.json();
      const list = Array.isArray(data) ? data : [];
      setTemplates(list);
      setFilteredTemplates(list);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching templates:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    applyFilter(filter, searchQuery);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    applyFilter(selectedFilter, query);
  };

  const applyFilter = (filter, query) => {
    let filtered = templates;

    if (filter !== 'All') {
      filtered = filtered.filter((t) => {
        if (t.subject === filter) return true;
        if (t.topic_tags?.includes(filter)) return true;
        if (t.use_case_tags?.includes(filter)) return true;
        return false;
      });
    }

    if (query) {
      filtered = filtered.filter((t) =>
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        t.topic_tags?.some((tag) => tag.toLowerCase().includes(query.toLowerCase()))
      );
    }

    setFilteredTemplates(filtered);
  };

  const getTone = (template) => {
    const titleLower = template.title.toLowerCase();
    if (titleLower.includes('supermarket')) return 'gold';
    if (titleLower.includes('plant')) return 'leaf';
    if (titleLower.includes('shadow')) return 'sun';
    if (titleLower.includes('recipe')) return 'cream';
    if (titleLower.includes('water')) return 'blue';
    if (titleLower.includes('playground')) return 'plum';
    return 'gold';
  };

  return (
    <div className="lifelab-phone">
      <div className="status-bar">
        <span>9:41</span>
        <div className="status-bar-right">
          <Icon name="signal" size={14} />
          <Icon name="wifi" size={14} />
          <span style={{ width: 24, height: 11, border: '1px solid #0B1F3F', borderRadius: 3, position: 'relative', display: 'inline-block' }}>
            <span style={{ position: 'absolute', inset: 1.5, background: '#0B1F3F', borderRadius: 1.5, width: '70%' }} />
          </span>
        </div>
      </div>

      <div className="lifelab-content">
        <div className="ll-header">
          <div className="ll-header-top">
            <div className="ll-header-branding">
              <div className="ll-header-label">Tian OS</div>
              <div className="ll-header-title">LifeLab</div>
            </div>
            <div className="ll-header-icons">
              <button className="ll-nav-btn">
                <Icon name="bell" size={20} />
              </button>
              <div className="ll-nav-avatar">
                {user?.name?.substring(0, 2).toUpperCase() || 'MT'}
              </div>
            </div>
          </div>

          <div className="ll-search-bar">
            <Icon name="search" size={18} color="#6B7A95" />
            <input
              type="text"
              placeholder="Search 124 LifeLab activities…"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="ll-content-scroll" style={{ padding: '0 20px' }}>
          <div className="ll-chips">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`ll-chip ${selectedFilter === filter ? 'active' : 'inactive'}`}
                onClick={() => handleFilterChange(filter)}
              >
                {filter}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="ll-loading">Loading activities...</div>
          ) : filteredTemplates.length === 0 ? (
            <div className="ll-empty-state">
              <div className="ll-empty-state-icon">📭</div>
              <div className="ll-empty-state-text">No activities found</div>
            </div>
          ) : (
            <>
              {/* Featured activity */}
              {filteredTemplates.length > 0 && (
                <div className="ll-card featured" style={{ cursor: 'pointer' }}>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                      Featured Activity
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
                      {filteredTemplates[0].title}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
                      {filteredTemplates[0].subject} • {filteredTemplates[0].duration}
                    </div>
                    <button
                      className="ll-btn ll-btn-primary"
                      style={{ marginTop: 12, background: '#C8A042' }}
                      onClick={() => onAssign(filteredTemplates[0])}
                    >
                      Assign Now
                    </button>
                  </div>
                  <div className="ll-featured-icon" />
                </div>
              )}

              {/* Activity cards */}
              <div style={{ marginTop: 12 }}>
                {filteredTemplates.map((template) => (
                  <div key={template._id} className="ll-card" onClick={() => onSelectTemplate(template)}>
                    <div className="ll-card-header">
                      <div className={`ll-activity-thumb ${getTone(template)}`}>
                        <Icon name={template.icon || 'sparkle'} size={28} />
                      </div>
                      <div className="ll-card-content">
                        <div className="ll-card-title">{template.title}</div>
                        <div className="ll-card-subtitle">
                          {template.subject} • {template.duration}
                        </div>
                        <div className="ll-card-meta">
                          {template.level_tags?.slice(0, 1).map((tag) => (
                            <span key={tag} className="ll-pill navy">{tag}</span>
                          ))}
                          {template.use_case_tags?.slice(0, 1).map((tag) => (
                            <span key={tag} className="ll-pill gold">{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="ll-bottom-nav">
        {[
          { id: 'home',    label: 'Home',    icon: 'home',    action: () => navigate('/dashboard') },
          { id: 'library', label: 'Library', icon: 'compass', action: null },
          { id: 'submit',  label: 'Submit',  icon: 'sparkle', action: () => onNavigate?.('submission') },
          { id: 'inbox',   label: 'Inbox',   icon: 'chat',    action: () => onNavigate?.('review') },
          { id: 'me',      label: 'Me',      icon: 'user',    action: () => {
            const role = user?.role;
            if (role === 'parent') onNavigate?.('parent');
            else if (role === 'tutor') onNavigate?.('tutor');
            else navigate('/dashboard');
          }},
        ].map(({ id, label, icon, action }) => (
          <button
            key={id}
            className={`ll-bottom-nav-item ${id === 'library' ? 'active' : ''}`}
            onClick={action || undefined}
            style={{ background: 'none', border: 'none', cursor: action ? 'pointer' : 'default' }}
          >
            <Icon name={icon} size={22} />
            <span style={{ textTransform: 'capitalize' }}>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
