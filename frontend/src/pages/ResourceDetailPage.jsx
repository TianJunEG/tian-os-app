import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, ArrowRight, Download, Lock } from 'lucide-react';
import { resourcesAPI, SERVER_ORIGIN } from '../services/api';
import { GROUP_NAME, RESOURCE_CATEGORIES } from '../config/brand';
import Seo from '../components/Seo';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';
import { trackEvent } from '../lib/analytics';

const categoryName = (id) => RESOURCE_CATEGORIES.find((c) => c.id === id)?.name || id;

// Tailwind-styled element mappings for rendered Markdown.
const markdownComponents = {
  h1: ({ node, ...props }) => <h2 className="mt-8 mb-3 font-display text-2xl font-bold text-slate-900" {...props} />,
  h2: ({ node, ...props }) => <h3 className="mt-8 mb-2 font-display text-xl font-semibold text-slate-900" {...props} />,
  h3: ({ node, ...props }) => <h4 className="mt-6 mb-2 font-display text-lg font-semibold text-slate-900" {...props} />,
  p: ({ node, ...props }) => <p className="mb-4 leading-relaxed text-slate-700" {...props} />,
  ul: ({ node, ...props }) => <ul className="mb-4 list-disc space-y-1 pl-6 text-slate-700" {...props} />,
  ol: ({ node, ...props }) => <ol className="mb-4 list-decimal space-y-1 pl-6 text-slate-700" {...props} />,
  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
  a: ({ node, ...props }) => (
    <a className="text-indigo-600 underline hover:text-indigo-700" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  strong: ({ node, ...props }) => <strong className="font-semibold text-slate-900" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote className="mb-4 border-l-4 border-indigo-200 pl-4 italic text-slate-600" {...props} />
  ),
  code: ({ node, ...props }) => <code className="rounded bg-slate-100 px-1 py-0.5 text-sm" {...props} />,
  table: ({ node, ...props }) => (
    <div className="mb-4 overflow-x-auto">
      <table className="min-w-full border border-slate-200 text-sm" {...props} />
    </div>
  ),
  th: ({ node, ...props }) => (
    <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold" {...props} />
  ),
  td: ({ node, ...props }) => <td className="border border-slate-200 px-3 py-2" {...props} />,
  del: ({ node, ...props }) => <del className="text-slate-500" {...props} />,
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
    <div className="mt-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-6">
      <div className="flex items-center gap-2 text-indigo-700">
        <Lock className="h-4 w-4" />
        <h2 className="font-display text-lg font-semibold text-slate-900">Get free access</h2>
      </div>
      <p className="mt-1 mb-4 text-sm text-slate-600">
        Enter your email and we'll unlock this resource. We'll only use it to share helpful learning
        materials — no spam.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        <div>
          <label htmlFor="gate-name" className="field-label">
            Name <span className="text-slate-400">(optional)</span>
          </label>
          <input id="gate-name" type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} maxLength={100} className="field" />
        </div>
        <div>
          <label htmlFor="gate-email" className="field-label">Email</label>
          <input id="gate-email" type="email" required value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} className="field" />
        </div>
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? 'Unlocking...' : 'Unlock resource'}
        </button>
      </form>
    </div>
  );
}

export default function ResourceDetailPage() {
  const { slug } = useParams();
  const [resource, setResource] = useState(null);
  const [unlocked, setUnlocked] = useState(null); // { body, fileUrl } once email is captured
  const [status, setStatus] = useState('loading'); // loading | ready | notfound

  useEffect(() => {
    let cancelled = false;
    const fetchResource = async () => {
      setStatus('loading');
      setUnlocked(null);
      try {
        const res = await resourcesAPI.getBySlug(slug);
        if (!cancelled) {
          setResource(res.data.resource);
          setStatus('ready');
        }
      } catch (error) {
        if (!cancelled) setStatus('notfound');
      }
    };
    fetchResource();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const body = unlocked?.body ?? resource?.body;
  const fileUrl = unlocked?.fileUrl ?? resource?.fileUrl;

  return (
    <div className="min-h-screen bg-white">
      {resource && (
        <Seo
          title={resource.title}
          description={resource.summary || `A ${categoryName(resource.category)} resource from ${GROUP_NAME}.`}
          path={`/resources/${resource.slug}`}
        />
      )}
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />

      <main id="main" className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <Link to="/resources" className="inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700">
          <ArrowLeft className="h-4 w-4" /> All resources
        </Link>

        {status === 'loading' && <p className="mt-10 text-center text-slate-500" role="status">Loading...</p>}

        {status === 'notfound' && (
          <div className="mt-16 text-center">
            <h1 className="font-display text-2xl font-bold text-slate-900">Resource not found</h1>
            <Link to="/resources" className="mt-4 inline-block font-medium text-indigo-600 hover:text-indigo-700">
              Browse all resources
            </Link>
          </div>
        )}

        {status === 'ready' && resource && (
          <article className="mt-6">
            <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
              {categoryName(resource.category)}
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {resource.title}
            </h1>
            <div className="mt-4 mb-8 flex flex-wrap gap-2 text-xs text-slate-500">
              {resource.level && <span className="rounded bg-slate-100 px-2 py-1">{resource.level}</span>}
              {resource.subject && <span className="rounded bg-slate-100 px-2 py-1">{resource.subject}</span>}
            </div>

            {resource.gated && !unlocked ? (
              <>
                {resource.summary && <p className="mb-4 text-lg leading-relaxed text-slate-700">{resource.summary}</p>}
                <GateForm slug={resource.slug} resourceTitle={resource.title} onUnlock={(data) => setUnlocked(data)} />
              </>
            ) : (
              <>
                {body && (
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {body}
                  </ReactMarkdown>
                )}
                {fileUrl && (
                  <a
                    href={`${SERVER_ORIGIN}${fileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackEvent('Resource Download', { resource: resource.title })}
                    className="btn-primary mt-2"
                  >
                    <Download className="h-4 w-4" /> Download
                  </a>
                )}
              </>
            )}

            <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="font-display font-semibold text-slate-900">Need a hand with this topic?</p>
                <p className="mt-1 text-sm text-slate-600">Get matched with a vetted tutor who can help.</p>
              </div>
              <Link
                to="/register?role=parent"
                onClick={() => trackEvent('Find a Tutor', { source: 'resource' })}
                className="btn-primary mt-4 sm:mt-0"
              >
                Find a tutor <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
