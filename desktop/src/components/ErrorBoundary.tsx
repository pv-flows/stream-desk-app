import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Erro não capturado capturado pelo boundary:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[400px]">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
            <AlertTriangle className="w-6 h-6 stroke-[2]" />
          </div>
          <h2 className="text-base font-semibold tracking-tight text-neutral-100">
            Ocorreu uma instabilidade nesta tela
          </h2>
          <p className="text-xs text-neutral-400 max-w-md mt-1 mb-5">
            A interface se recuperou para evitar que o aplicativo feche. Clique abaixo para restaurar a visualização.
          </p>
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restaurar visualização
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

