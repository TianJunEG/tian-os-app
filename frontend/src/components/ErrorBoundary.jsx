import React from 'react';

// Catches render errors and failed lazy-chunk loads (common right after a
// deploy, when an open tab requests a hashed chunk that no longer exists) and
// offers a reload, which fetches the fresh index.html and chunks.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
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
            className="px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-navy-700 font-medium"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
