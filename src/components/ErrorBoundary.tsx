import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from './ui/Button'

interface Props {
  children: ReactNode
  fallbackTitle?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro não tratado:', error, errorInfo)
    this.setState({ errorInfo })
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800">
          <div className="max-w-xl w-full bg-white rounded-2xl border border-red-200 p-8 shadow-sm text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              {this.props.fallbackTitle || 'Ops! Algo deu errado ao carregar esta tela'}
            </h2>
            <p className="text-sm text-slate-600">
              Ocorreu uma falha inesperada na renderização. Detalhes do erro:
            </p>
            <div className="p-3 bg-red-50 text-red-800 rounded-xl text-left text-xs font-mono overflow-auto max-h-48 border border-red-100">
              <p className="font-bold">{this.state.error?.name}: {this.state.error?.message}</p>
              {this.state.error?.stack && (
                <pre className="mt-2 text-[11px] text-red-700 whitespace-pre-wrap">
                  {this.state.error.stack}
                </pre>
              )}
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = '/pacientes')}
              >
                Voltar para Pacientes
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                onClick={() => window.location.reload()}
              >
                Recarregar Página
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
