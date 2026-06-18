import React from 'react';

// Catches render errors and failed lazy-chunk loads (common right after a
// deploy, when an open tab requests a hashed chunk that no longer exists) and
// offers a reload, which fetches the fresh index.html and chunks.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Chunk load failures happen when a new deploy invalidates cached JS URLs.
    // Auto-reload fetches fresh index.html + new chunks without user interaction.
    const isChunkError = (
      /Failed to fetch dynamically imported module/i.test(error?.message || '')
      || /Loading chunk \d+ failed/i.test(error?.message || '')
      || error?.name === 'ChunkLoadError'
    );
    if (isChunkError && typeof window !== 'undefined') {
      window.location.reload();
      return { hasError: false };
    }
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center max-w-sm">
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-600 mb-6">
            The page failed to load. This can happen after an update — reloading usually fixes it.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald text-white rounded-lg hover:bg-emerald-deep font-medium"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
