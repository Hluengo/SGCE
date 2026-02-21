
import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  chunkError: boolean;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Detect dynamic-import / chunk-load failures */
function isChunkLoadError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const msg = error.message;
    return (
      msg.includes('dynamically imported module') ||
      msg.includes('Failed to fetch') ||
      msg.includes('Loading chunk') ||
      msg.includes('Loading CSS chunk')
    );
  }
  return false;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, chunkError: false };

  static getDerivedStateFromError(error: unknown) {
    return { hasError: true, chunkError: isChunkLoadError(error) };
  }

  componentDidCatch(error: unknown) {
    console.error('UI ErrorBoundary:', error);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.state.chunkError) {
        return (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-sm">
            <p className="text-slate-500 font-semibold">
              No se pudo cargar el módulo. Puede deberse a una actualización reciente.
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Recargar página
            </button>
          </div>
        );
      }
      return this.props.fallback || (
        <div className="flex items-center justify-center h-full text-slate-500 text-sm font-semibold">
          Ocurrió un error al cargar esta sección. Intenta recargar la página.
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
