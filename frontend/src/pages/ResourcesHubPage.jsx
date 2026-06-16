import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Lock } from 'lucide-react';
import { resourcesAPI } from '../services/api';
import { RESOURCE_CATEGORIES } from '../config/brand';
import Seo from '../components/Seo';
import MarketingHeader from '../components/MarketingHeader';
import SiteFooter from '../components/SiteFooter';
import useScrollReveal from '../hooks/useScrollReveal';

const categoryName = (id) => RESOURCE_CATEGORIES.find((c) => c.id === id)?.name || id;

function ResourceCard({ resource }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Link
      to={`/resources/${resource.slug}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', padding: '24px 26px',
        background: 'white', borderRadius: 14,
        border: `1px solid ${hovered ? '#cf8a44' : '#e1d9ca'}`,
        textDecoration: 'none',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered
          ? '0 8px 26px -16px rgba(30,42,66,0.3), 0 1px 2px rgba(30,42,66,0.06)'
          : '0 2px 8px rgba(30,42,66,0.04)',
        transition: 'border-color .2s, transform .2s, box-shadow .2s',
      }}
    >
      {resource.images?.[0]?.url && (
        <div style={{ margin: '-24px -26px 20px', borderRadius: '14px 14px 0 0', overflow: 'hidden', height: 160 }}>
          <img
            src={resource.images[0].url}
            alt={resource.images[0].alt || resource.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{
          fontFamily: 'ui-monospace, monospace', fontSize: 11,
          letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4f7bf0',
        }}>
          {categoryName(resource.category)}
        </span>
        {resource.gated && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 999,
            background: '#fbf1e1', border: '1px solid #f0dcb8',
            fontSize: 11.5, fontWeight: 500, color: '#a8743a',
          }}>
            <Lock size={10} /> Email
          </span>
        )}
      </div>
      <h3 style={{
        margin: 0, fontFamily: "'Hanken Grotesk', sans-serif",
        fontSize: 17, fontWeight: 600, lineHeight: 1.3, color: '#1c2433',
      }}>
        {resource.title}
      </h3>
      {resource.summary && (
        <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.55, color: '#5c6472', flex: 1 }}>
          {resource.summary}
        </p>
      )}
      <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {resource.level && (
          <span style={{ padding: '3px 10px', borderRadius: 6, background: '#f4efe6', fontSize: 12, color: '#5c6472' }}>
            {resource.level}
          </span>
        )}
        {resource.subject && (
          <span style={{ padding: '3px 10px', borderRadius: 6, background: '#f4efe6', fontSize: 12, color: '#5c6472' }}>
            {resource.subject}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function ResourcesHubPage() {
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  useScrollReveal();

  useEffect(() => {
    let cancelled = false;
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await resourcesAPI.list({
          category: activeCategory || undefined,
          q: search.trim() || undefined,
          limit: 50,
        });
        if (!cancelled) setResources(res.data.resources);
      } catch {
        if (!cancelled) setResources([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    const timer = setTimeout(fetchResources, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [activeCategory, search]);

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe6', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      <Seo
        title="Resources"
        description="Free learning resources from Tian Jun Education Group: MOE syllabus guides, practice papers, and family activities."
        path="/resources"
      />
      <a href="#main" className="skip-link">Skip to content</a>

      {/* ── HERO ────────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', background: 'linear-gradient(180deg, #13223e 0%, #0e1a31 100%)', overflow: 'hidden' }}>
        {/* Subtle periwinkle grid */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(143,177,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(143,177,255,0.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
        {/* Radial glow top-right */}
        <div style={{
          position: 'absolute', top: -120, right: -80, width: 460, height: 460,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(79,123,240,0.22), transparent 65%)',
        }} />

        <div style={{ position: 'relative' }}>
          <MarketingHeader />

          <div style={{ maxWidth: 1180, margin: '0 auto', padding: '56px 40px 96px', textAlign: 'center' }}>
            <div data-reveal style={{
              fontFamily: 'ui-monospace, monospace', fontSize: 12.5,
              letterSpacing: '0.22em', textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 24,
            }}>
              Free resources
            </div>
            <h1 data-reveal data-delay="1" style={{
              fontFamily: "'Newsreader', serif", fontWeight: 400,
              fontSize: 'clamp(36px, 5.5vw, 72px)', lineHeight: 1.04,
              letterSpacing: '-0.022em', color: '#f6f2ea', margin: '0 auto',
              maxWidth: '16ch',
            }}>
              Learning resources for families
            </h1>
            <p data-reveal data-delay="2" style={{
              marginTop: 24, fontSize: 'clamp(16px, 1.5vw, 19px)',
              lineHeight: 1.6, color: '#b7c3d8', maxWidth: '52ch',
              marginLeft: 'auto', marginRight: 'auto',
            }}>
              Guides to the MOE syllabus, practice resources, and activities families can do together — free from Tian Jun Education Group.
            </p>

            {/* Search */}
            <div data-reveal data-delay="3" style={{ marginTop: 40, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
              <label htmlFor="resource-search" className="sr-only">Search resources</label>
              <div style={{ position: 'relative' }}>
                <Search style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  width: 18, height: 18, color: '#8fb1ff', pointerEvents: 'none',
                }} />
                <input
                  id="resource-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resources…"
                  className="mkt-search"
                  style={{
                    width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 13, paddingBottom: 13,
                    background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 12, color: '#f4f0e8', fontSize: 15, boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <main id="main" style={{ maxWidth: 1180, margin: '0 auto', padding: '60px 40px 100px' }}>
        {/* Category pills */}
        <div
          data-reveal
          style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginBottom: 52 }}
          role="group"
          aria-label="Filter resources by category"
        >
          {[{ id: '', name: 'All' }, ...RESOURCE_CATEGORIES].map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                aria-pressed={active}
                style={{
                  padding: '9px 20px', borderRadius: 999, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                  border: active ? 'none' : '1px solid #e1d9ca',
                  background: active ? '#13223e' : 'white',
                  color: active ? '#f4f0e8' : '#5c6472',
                  transition: 'all .18s',
                  fontFamily: "'Hanken Grotesk', sans-serif",
                }}
              >
                {cat.name}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ textAlign: 'center', color: '#8a93a3', paddingTop: 40 }} role="status">
            Loading…
          </p>
        ) : resources.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#8a93a3', paddingTop: 40 }}>
            No resources here yet — check back soon.
          </p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {resources.map((resource) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
