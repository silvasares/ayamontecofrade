import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends (React as any).Component {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0A0A0A] text-white">
          <h1 className="text-2xl font-bold mb-2">Algo ha ido mal</h1>
          <p className="text-sm text-gray-400 mb-6 max-w-md">
            Se ha producido un error inesperado. Puedes intentar recargar la aplicación.
          </p>
          {this.state.error && (
            <pre className="text-xs text-red-400 mb-6 max-w-full overflow-auto bg-black/40 p-3 rounded-xl">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-[#4B0082] text-white text-sm font-bold"
            >
              Reintentar
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-bold"
            >
              Recargar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;