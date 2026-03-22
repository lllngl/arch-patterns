import { Component, type ErrorInfo, type ReactNode } from "react";
import { AppError } from "./AppError";

interface Props {
  children: ReactNode;
  fallback: (error: AppError, reset: () => void) => ReactNode;
  onError?: (error: AppError, info: ErrorInfo) => void;
}

interface State {
  error: AppError | null;
}

/**
 * Граница ошибок React: ловит необработанные исключения в поддереве.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: unknown): State {
    const appError =
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Неизвестная ошибка",
            "REACT_BOUNDARY",
            "global",
            error
          );
    return { error: appError };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    const appError =
      error instanceof AppError
        ? error
        : new AppError(
            error instanceof Error ? error.message : "Неизвестная ошибка",
            "REACT_BOUNDARY",
            "global",
            error
          );
    this.props.onError?.(appError, info);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error) {
      return this.props.fallback(error, this.reset);
    }
    return this.props.children;
  }
}
