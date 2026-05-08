import { Component } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

export default class BaseErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 border border-danger/20 bg-danger/5 rounded-2xl text-center space-y-4">
          <AlertCircle className="w-8 h-8 text-danger mx-auto" />
          <div>
            <h3 className="text-sm font-bold text-danger uppercase mb-1">Error en el Componente</h3>
            <p className="text-xs text-text-muted">No se pudo cargar esta seccion del modulo.</p>
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="flex items-center gap-2 mx-auto px-4 py-2 bg-danger text-white text-xs font-bold rounded-lg"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar Seccion
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
