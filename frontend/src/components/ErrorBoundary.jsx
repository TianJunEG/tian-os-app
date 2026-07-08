import React from 'react';
import { isChunkLoadError, reloadOnceForChunkError } from '../utils/chunkError';

// Catches render errors and failed lazy-chunk loads (common right after a
// deploy, when an open tab requests a hashed chunk that no longer exists) and
// offers a reload, which fetches the fresh index.html and chunks.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // A failed lazy chunk = a new deploy invalidated the cached JS URLs. Reload
    // once (guarded against a loop) to fetch the fresh index + chunks silently;
    // if it already reloaded and is still failing, fall through to the manual UI.
    if (isChunkLoadError(error) && reloadOnceForChunkError()) {
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
