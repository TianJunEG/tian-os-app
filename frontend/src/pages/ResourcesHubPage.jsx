import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight, Lock } from 'lucide-react';
import { resourcesAPI } from '../services/api';
import { GROUP_NAME, RESOURCE_CATEGORIES } from '../config/brand';
import Seo from '../components/Seo';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

const categoryName = (id) => RESOURCE_CATEGORIES.find((c) => c.id === id)?.name || id;

export default function ResourcesHubPage() {
  const [activeCategory, setActiveCategory] = useState('');
  const [search, setSearch] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

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
      } catch (error) {
        console.error('Error fetching resources:', error);
        if (!cancelled) setResources([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    // Debounce so typing doesn't fire a request per keystroke.
    const timer = setTimeout(fetchResources, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activeCategory, search]);

  const pill = (active) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      active
        ? 'bg-indigo-600 text-white shadow-sm'
        : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200 hover:text-indigo-700'
    }`;

  return (
    <div className="min-h-screen bg-white">
      <Seo
        title="Resources"
        description="Free learning resources from Tian Jun Education Group: MOE syllabus guides, practice papers, and family activities."
        path="/resources"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <SiteHeader />

      <main id="main">
        <section className="bg-gradient-to-b from-indigo-50 via-white to-white">
          <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
            <span className="eyebrow">Free resources</span>
            <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Learning resources for families
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">
              Guides to the MOE syllabus, our own practice papers, and activities families can do
              together — free from {GROUP_NAME}.
            </p>

            <div className="mx-auto mt-8 max-w-md">
              <label htmlFor="resource-search" className="sr-only">Search resources</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  id="resource-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search resources..."
                  className="field pl-11"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap justify-center gap-2" role="group" aria-label="Filter resources by category">
            <button type="button" aria-pressed={activeCategory === ''} onClick={() => setActiveCategory('')} className={pill(activeCategory === '')}>
              All
            </button>
            {RESOURCE_CATEGORIES.map((cat) => (
              <button key={cat.id} type="button" aria-pressed={activeCategory === cat.id} onClick={() => setActiveCategory(cat.id)} className={pill(activeCategory === cat.id)}>
                {cat.name}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="text-center text-slate-500" role="status">Loading resources...</p>
          ) : resources.length === 0 ? (
            <p className="text-center text-slate-500">No resources here yet — check back soon.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {resources.map((resource) => (
                <Link
                  key={resource._id}
                  to={`/resources/${resource.slug}`}
                  className="card group flex flex-col p-6 transition hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                      {categoryName(resource.category)}
                    </span>
                    {resource.gated && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                        <Lock className="h-3 w-3" /> Email
                      </span>
                    )}
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold text-slate-900">{resource.title}</h3>
                  {resource.summary && <p className="mt-2 flex-1 text-sm text-slate-600">{resource.summary}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    {resource.level && <span className="rounded bg-slate-100 px-2 py-1">{resource.level}</span>}
                    {resource.subject && <span className="rounded bg-slate-100 px-2 py-1">{resource.subject}</span>}
                    <span className="ml-auto inline-flex items-center gap-1 font-semibold text-indigo-600 opacity-0 transition group-hover:opacity-100">
                      Read <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
