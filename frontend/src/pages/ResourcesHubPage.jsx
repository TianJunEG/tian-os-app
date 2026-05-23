import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { resourcesAPI } from '../services/api';
import { GROUP_NAME, RESOURCE_CATEGORIES } from '../config/brand';
import Seo from '../components/Seo';

const categoryName = (id) =>
  RESOURCE_CATEGORIES.find((c) => c.id === id)?.name || id;

export default function ResourcesHubPage() {
  const [activeCategory, setActiveCategory] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchResources = async () => {
      setLoading(true);
      try {
        const res = await resourcesAPI.list({
          category: activeCategory || undefined,
          limit: 50
        });
        if (!cancelled) setResources(res.data.resources);
      } catch (error) {
        console.error('Error fetching resources:', error);
        if (!cancelled) setResources([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchResources();
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <Seo
        title="Resources"
        description="Free learning resources from Tian Jun Education Group: MOE syllabus guides, practice papers, and family activities."
        path="/resources"
      />
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-purple-600">Resources</h1>
            <Link to="/" className="text-xs text-gray-500 hover:text-purple-600">
              {GROUP_NAME}
            </Link>
          </div>
          <Link to="/tutoring" className="text-gray-700 hover:text-purple-600 font-medium">
            Find a Tutor
          </Link>
        </div>
      </header>

      <main id="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Free learning resources</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Guides to the MOE syllabus, our own practice papers, and activities families can do
            together — free from {GROUP_NAME}.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-10" role="group" aria-label="Filter resources by category">
          <button
            type="button"
            aria-pressed={activeCategory === ''}
            onClick={() => setActiveCategory('')}
            className={`px-4 py-2 rounded-full text-sm font-medium ${
              activeCategory === ''
                ? 'bg-purple-600 text-white'
                : 'bg-white text-gray-700 hover:bg-purple-50'
            }`}
          >
            All
          </button>
          {RESOURCE_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              aria-pressed={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium ${
                activeCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-purple-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-center text-gray-500" role="status">Loading resources...</p>
        ) : resources.length === 0 ? (
          <p className="text-center text-gray-500">No resources here yet — check back soon.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <Link
                key={resource._id}
                to={`/resources/${resource.slug}`}
                className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition flex flex-col"
              >
                <span className="text-xs font-semibold uppercase tracking-wide text-purple-700 mb-2">
                  {categoryName(resource.category)}
                </span>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{resource.title}</h3>
                {resource.summary && (
                  <p className="text-gray-600 text-sm flex-1">{resource.summary}</p>
                )}
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                  {resource.level && <span className="bg-gray-100 px-2 py-1 rounded">{resource.level}</span>}
                  {resource.subject && <span className="bg-gray-100 px-2 py-1 rounded">{resource.subject}</span>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
