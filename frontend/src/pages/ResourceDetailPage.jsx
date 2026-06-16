import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, ArrowRight, Download, Lock } from 'lucide-react';
import { resourcesAPI, SERVER_ORIGIN } from '../services/api';
import { GROUP_NAME, RESOURCE_CATEGORIES } from '../config/brand';
import Seo from '../components/Seo';
import MarketingHeader from '../components/MarketingHeader';
import SiteFooter from '../components/SiteFooter';
import useScrollReveal from '../hooks/useScrollReveal';
import { trackEvent } from '../lib/analytics';

const categoryName = (id) => RESOURCE_CATEGORIES.find((c) => c.id === id)?.name || id;

// Article body typography — matches the Our Story "light section" design
const md = {
  h1: ({ node, ...props }) => (
    <h2 style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 'clamp(26px, 3vw, 38px)', lineHeight: 1.12, letterSpacing: '-0.015em', color: '#1c2433', margin: '52px 0 16px' }} {...props} />
  ),
  h2: ({ node, ...props }) => (
    <h3 style={{ fontFamily: "'Newsreader', serif", fontWeight: 500, fontSize: 'clamp(21px, 2.2vw, 28px)', lineHeight: 1.2, letterSpacing: '-0.01em', color: '#1c2433', margin: '44px 0 12px' }} {...props} />
  ),
  h3: ({ node, ...props }) => (
    <h4 style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, fontSize: 18, lineHeight: 1.3, color: '#1c2433', margin: '36px 0 10px' }} {...props} />
  ),
  p: ({ node, ...props }) => (
    <p style={{ fontSize: 18, lineHeight: 1.72, color: '#3a4150', margin: '0 0 22px' }} {...props} />
  ),
  ul: ({ node, ...props }) => (
    <ul style={{ paddingLeft: 26, margin: '0 0 22px', color: '#3a4150' }} {...props} />
  ),
  ol: ({ node, ...props }) => (
    <ol style={{ paddingLeft: 26, margin: '0 0 22px', color: '#3a4150' }} {...props} />
  ),
  li: ({ node, ...props }) => (
    <li style={{ fontSize: 18, lineHeight: 1.65, marginBottom: 6 }} {...props} />
  ),
  a: ({ node, ...props }) => (
    <a style={{ color: '#5d86f0', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" {...props} />
  ),
  strong: ({ node, ...props }) => (
    <strong style={{ fontWeight: 600, color: '#1c2433' }} {...props} />
  ),
  blockquote: ({ node, ...props }) => (
    <blockquote style={{
      borderLeft: '2px solid #cf8a44', paddingLeft: 28, margin: '36px 0',
      fontFamily: "'Newsreader', serif", fontStyle: 'italic',
      fontSize: 'clamp(22px, 2.5vw, 32px)', lineHeight: 1.25, letterSpacing: '-0.01em', color: '#1c2433',
    }} {...props} />
  ),
  table: ({ node, ...props }) => (
    <div style={{ overflowX: 'auto', margin: '0 0 24px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 15.5, color: '#3a4150' }} {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th style={{ borderBottom: '2px solid #e1d9ca', padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#1c2433' }} {...props} />
  ),
  td: ({ node, ...props }) => (
    <td style={{ borderBottom: '1px solid #e1d9ca', padding: '10px 14px' }} {...props} />
  ),
  hr: ({ node, ...props }) => (
    <hr style={{ border: 'none', borderTop: '1px solid #e1d9ca', margin: '44px 0' }} {...props} />
  ),
  code: ({ node, ...props }) => (
    <code style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, background: '#f4efe6', borderRadius: 4, padding: '2px 6px' }} {...props} />
  ),
  img: ({ node, src, alt, ...props }) => (
    <figure style={{ margin: '36px 0' }}>
      <img src={src} alt={alt || ''} style={{ width: '100%', borderRadius: 12, display: 'block' }} {...props} />
      {alt && <figcaption style={{ marginTop: 8, fontSize: 14, color: '#8a94a6', textAlign: 'center' }}>{alt}</figcaption>}
    </figure>
  ),
};

function GateForm({ slug, resourceTitle, onUnlock }) {
  const [form, setForm] = useState({ name: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await resourcesAPI.unlock(slug, form);
      trackEvent('Resource Lead', { resource: resourceTitle });
      onUnlock(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not unlock this resource.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      marginTop: 32, padding: 32, borderRadius: 16,
      background: 'white', border: '1px solid #e1d9ca',
      boxShadow: '0 4px 20px rgba(30,42,66,0.07)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Lock size={16} color="#cf8a44" />
        <h2 style={{ margin: 0, fontFamily: "'Hanken Grotesk', sans-serif", fontWeight: 600, fontSize: 18, color: '#1c2433' }}>
          Get free access
        </h2>
      </div>
      <p style={{ margin: '0 0 24px', fontSize: 15, lineHeight: 1.6, color: '#5c6472' }}>
        Enter your email to unlock this resource. We'll only use it to share helpful learning materials — no spam.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fbece9', border: '1px solid #ecc3ba', fontSize: 14, color: '#d8694f' }}>
            {error}
          </div>
        )}
        <div>
          <label htmlFor="gate-name" style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#5c6472', marginBottom: 6 }}>
            Name <span style={{ color: '#aebbd2' }}>(optional)</span>
          </label>
          <input
            id="gate-name"
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            maxLength={100}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 10,
              border: '1px solid #e1d9ca', fontSize: 15, color: '#1c2433',
              background: '#faf6ef', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <div>
          <label htmlFor="gate-email" style={{ display: 'block', fontSize: 13.5, fontWeight: 500, color: '#5c6472', marginBottom: 6 }}>
            Email
          </label>
          <input
            id="gate-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            style={{
              width: '100%', padding: '11px 14px', borderRadius: 10,
              border: '1px solid #e1d9ca', fontSize: 15, color: '#1c2433',
              background: '#faf6ef', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: '13px 24px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: '#cf8a44', color: 'white', fontFamily: "'Hanken Grotesk', sans-serif",
            fontWeight: 700, fontSize: 15.5, transition: 'background .15s',
            opacity: submitting ? 0.7 : 1,
          }}
        >
          {submitting ? 'Unlocking…' : 'Unlock resource'}
        </button>
      </form>
    </div>
  );
}

export default function ResourceDetailPage() {
  const { slug } = useParams();
  const [resource, setResource] = useState(null);
  const [unlocked, setUnlocked] = useState(null);
  const [status, setStatus] = useState('loading');
  useScrollReveal();

  useEffect(() => {
    let cancelled = false;
    const fetchResource = async () => {
      setStatus('loading');
      setUnlocked(null);
      try {
        const res = await resourcesAPI.getBySlug(slug);
        if (!cancelled) { setResource(res.data.resource); setStatus('ready'); }
      } catch {
        if (!cancelled) setStatus('notfound');
      }
    };
    fetchResource();
    return () => { cancelled = true; };
  }, [slug]);

  const body = unlocked?.body ?? resource?.body;
  const fileUrl = unlocked?.fileUrl ?? resource?.fileUrl;

  return (
    <div style={{ minHeight: '100vh', background: '#f4efe6', fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      {resource && (
        <Seo
          title={resource.title}
          description={resource.summary || `A ${categoryName(resource.category)} resource from ${GROUP_NAME}.`}
          path={`/resources/${resource.slug}`}
        />
      )}
      <a href="#main" className="skip-link">Skip to content</a>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{ position: 'relative', background: 'linear-gradient(180deg, #13223e 0%, #0e1a31 100%)', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(143,177,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(143,177,255,0.05) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
        <div style={{
          position: 'absolute', top: -80, right: -60, width: 380, height: 380,
          borderRadius: '50%', pointerEvents: 'none',
          background: 'radial-gradient(circle, rgba(79,123,240,0.18), transparent 65%)',
        }} />

        <div style={{ position: 'relative' }}>
          <MarketingHeader />

          <div style={{ maxWidth: 820, margin: '0 auto', padding: '40px 40px 80px' }}>
            <Link
              to="/resources"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#aebbd2', fontSize: 14, textDecoration: 'none', marginBottom: 32 }}
            >
              <ArrowLeft size={15} /> All resources
            </Link>

            {status === 'ready' && resource && (
              <>
                <div data-reveal style={{
                  fontFamily: 'ui-monospace, monospace', fontSize: 12, letterSpacing: '0.2em',
                  textTransform: 'uppercase', color: '#8fb1ff', marginBottom: 14,
                }}>
                  {categoryName(resource.category)}
                </div>
                <h1 data-reveal data-delay="1" style={{
                  fontFamily: "'Newsreader', serif", fontWeight: 400,
                  fontSize: 'clamp(28px, 4vw, 52px)', lineHeight: 1.08, letterSpacing: '-0.02em',
                  color: '#f6f2ea', margin: '0 0 24px',
                }}>
                  {resource.title}
                </h1>
                <div data-reveal data-delay="2" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {resource.level && (
                    <span style={{
                      padding: '4px 12px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                      fontSize: 13, color: '#aebbd2',
                    }}>
                      {resource.level}
                    </span>
                  )}
                  {resource.subject && (
                    <span style={{
                      padding: '4px 12px', borderRadius: 6,
                      background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)',
                      fontSize: 13, color: '#aebbd2',
                    }}>
                      {resource.subject}
                    </span>
                  )}
                </div>
              </>
            )}

            {status === 'loading' && (
              <p style={{ color: '#aebbd2', fontSize: 15 }} role="status">Loading…</p>
            )}
            {status === 'notfound' && (
              <h1 style={{ fontFamily: "'Newsreader', serif", fontWeight: 400, fontSize: 36, color: '#f6f2ea' }}>
                Resource not found
              </h1>
            )}
          </div>
        </div>
      </section>

      {/* ── ARTICLE BODY ────────────────────────────────────────────────── */}
      <main id="main" style={{ maxWidth: 820, margin: '0 auto', padding: '56px 40px 100px' }}>
        {status === 'notfound' && (
          <Link to="/resources" style={{ color: '#5d86f0', fontSize: 15 }}>
            Browse all resources
          </Link>
        )}

        {status === 'ready' && resource && (
          <article data-reveal>
            {/* Hero image (first generated image, if any) */}
            {resource.images?.length > 0 && (
              <figure style={{ margin: '0 0 48px' }}>
                <img
                  src={resource.images[0].url}
                  alt={resource.images[0].alt || resource.title}
                  style={{ width: '100%', borderRadius: 16, display: 'block', maxHeight: 460, objectFit: 'cover' }}
                />
              </figure>
            )}

            {resource.gated && !unlocked ? (
              <>
                {resource.summary && (
                  <p style={{ fontSize: 18, lineHeight: 1.72, color: '#3a4150', marginBottom: 8 }}>
                    {resource.summary}
                  </p>
                )}
                <GateForm slug={resource.slug} resourceTitle={resource.title} onUnlock={(data) => setUnlocked(data)} />
              </>
            ) : (
              <>
                {body && (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={md}>
                    {body}
                  </ReactMarkdown>
                )}
                {fileUrl && (
                  <a
                    href={`${SERVER_ORIGIN}${fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('Resource Download', { resource: resource.title })}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 8,
                      marginTop: 16, padding: '12px 22px', borderRadius: 12,
                      background: '#13223e', color: '#f4f0e8', textDecoration: 'none',
                      fontWeight: 600, fontSize: 15,
                    }}
                  >
                    <Download size={16} /> Download
                  </a>
                )}
              </>
            )}

            {/* CTA block */}
            <div style={{
              marginTop: 64, padding: '32px 36px', borderRadius: 16,
              background: 'white', border: '1px solid #e1d9ca',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20,
            }}>
              <div>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 17, color: '#1c2433' }}>
                  Need a hand with this topic?
                </p>
                <p style={{ margin: '4px 0 0', fontSize: 14.5, color: '#5c6472' }}>
                  Get matched with a vetted tutor who can help.
                </p>
              </div>
              <Link
                to="/register?role=parent"
                onClick={() => trackEvent('Find a Tutor', { source: 'resource' })}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '12px 22px', borderRadius: 12,
                  background: '#13223e', color: '#f4f0e8', textDecoration: 'none',
                  fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap',
                }}
              >
                Find a tutor <ArrowRight size={15} />
              </Link>
            </div>
          </article>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
