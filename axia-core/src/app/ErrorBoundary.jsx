import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[Axia ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-text gap-6">
          <div className="p-4 rounded-full bg-danger/10">
            <AlertTriangle className="w-12 h-12 text-danger" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-semibold">Se produjo un error inesperado</h2>
            <p className="text-text-muted text-sm max-w-md">
              El sistema ha detectado una excepcion. Por favor, recargue la pagina.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Recargar
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
