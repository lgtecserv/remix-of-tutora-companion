import { Component, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React ErrorBoundary that catches runtime errors in children
 * and shows a friendly fallback UI instead of crashing the entire page.
 */
export class RouteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[RouteErrorBoundary] Caught error:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <div className="rounded-2xl border border-border bg-card p-10 max-w-md shadow-lg space-y-4">
            <h2 className="text-xl font-bold text-foreground">
              {this.props.fallbackTitle || "Algo correu mal"}
            </h2>
            <p className="text-sm text-muted-foreground">
              Ocorreu um erro ao carregar esta página. Tente recarregar ou voltar ao início.
            </p>
            {this.state.error && (
              <details className="text-left text-xs text-muted-foreground bg-muted rounded-lg p-3">
                <summary className="cursor-pointer font-medium">Detalhes técnicos</summary>
                <pre className="mt-2 whitespace-pre-wrap break-words">{this.state.error.message}</pre>
              </details>
            )}
            <div className="flex gap-3 justify-center pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Recarregar
              </button>
              <Link
                to="/app"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                Voltar ao início
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
