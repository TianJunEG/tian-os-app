import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { resourcesAPI, SERVER_ORIGIN } from '../services/api';
import { GROUP_NAME, RESOURCE_CATEGORIES } from '../config/brand';

const categoryName = (id) =>
  RESOURCE_CATEGORIES.find((c) => c.id === id)?.name || id;

// Tailwind-styled element mappings for rendered Markdown.
const markdownComponents = {
  h1: ({ node, ...props }) => <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-3" {...props} />,
  h2: ({ node, ...props }) => <h3 className="text-xl font-semibold text-gray-900 mt-6 mb-2" {...props} />,
  h3: ({ node, ...props }) => <h4 className="text-lg font-semibold text-gray-900 mt-4 mb-2" {...props} />,
  p: ({ node, ...props }) => <p className="text-gray-700 mb-4 leading-relaxed" {...props} />,
  ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4 text-gray-700 space-y-1" {...props} />,
  ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4 text-gray-700 space-y-1" {...props} />,
  li: ({ node, ...props }) => <li className="leading-relaxed" {...props} />,
  a: ({ node, ...props }) => (
    <a className="text-purple-600 underline hover:text-purple-700" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  strong: ({ node, ...props }) => <strong className="font-semibold text-gray-900" {...props} />,
  blockquote: ({ node, ...props }) => (
    <blockquote className="border-l-4 border-purple-200 pl-4 italic text-gray-600 mb-4" {...props} />
  ),
  code: ({ node, ...props }) => <code className="bg-gray-100 rounded px-1 py-0.5 text-sm" {...props} />
};

export default function ResourceDetailPage() {
  const { slug } = useParams();
  const [resource, setResource] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound

  useEffect(() => {
    let cancelled = false;
    const fetchResource = async () => {
      setStatus('loading');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <header className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/resources" className="text-purple-600 hover:text-purple-700 font-medium">
            ← All resources
          </Link>
          <Link to="/" className="text-xs text-gray-500 hover:text-purple-600">
            {GROUP_NAME}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {status === 'loading' && <p className="text-center text-gray-500">Loading...</p>}

        {status === 'notfound' && (
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Resource not found</h2>
            <Link to="/resources" className="text-purple-600 hover:text-purple-700 font-medium">
              Browse all resources
            </Link>
          </div>
        )}

        {status === 'ready' && resource && (
          <article className="bg-white rounded-xl shadow p-8">
            <span className="text-xs font-semibold uppercase tracking-wide text-purple-700">
              {categoryName(resource.category)}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 mt-2 mb-3">{resource.title}</h1>

            <div className="flex flex-wrap gap-2 text-xs text-gray-500 mb-6">
              {resource.level && <span className="bg-gray-100 px-2 py-1 rounded">{resource.level}</span>}
              {resource.subject && <span className="bg-gray-100 px-2 py-1 rounded">{resource.subject}</span>}
            </div>

            {resource.body && (
              <ReactMarkdown components={markdownComponents}>{resource.body}</ReactMarkdown>
            )}

            {resource.fileUrl && (
              <a
                href={`${SERVER_ORIGIN}${resource.fileUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
              >
                Download
              </a>
            )}

            <div className="mt-10 pt-6 border-t border-gray-100">
              <p className="text-gray-700 mb-3 font-medium">Need a hand with this topic?</p>
              <Link
                to="/register?role=parent"
                className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Find a Tutor
              </Link>
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
