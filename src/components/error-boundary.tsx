'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import * as Sentry from "@sentry/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

const { logger } = Sentry;

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  context?: Record<string, any>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

export interface ErrorBoundaryFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  eventId: string | null;
  resetError: () => void;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    return Sentry.startSpan(
      { op: "error.boundary", name: "Error Boundary Catch" },
      (span: any) => {
        span.setAttribute("error.name", error.name);
        span.setAttribute("error.message", error.message);
        span.setAttribute("error.stack_length", error.stack?.length || 0);
        span.setAttribute("component.stack", errorInfo.componentStack);

        // Capture the error with Sentry
        Sentry.withScope((scope) => {
          // Add context information
          if (this.props.context) {
            Object.entries(this.props.context).forEach(([key, value]) => {
              scope.setContext(key, value);
            });
          }

          // Add component stack trace
          scope.setContext("react_error_boundary", {
            componentStack: errorInfo.componentStack,
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
          });

          // Capture the exception
          const eventId = Sentry.captureException(error);
          
          // Log with structured logging
          logger.error("React Error Boundary caught an error", {
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
            componentStack: errorInfo.componentStack,
            eventId,
            context: this.props.context,
          });

          this.setState({
            errorInfo,
            eventId,
          });

          // Call custom error handler if provided
          if (this.props.onError) {
            this.props.onError(error, errorInfo);
          }
        });
      }
    );
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return (
          <FallbackComponent
            error={this.state.error}
            errorInfo={this.state.errorInfo!}
            eventId={this.state.eventId}
            resetError={this.resetError}
          />
        );
      }

      // Default fallback UI
      return <DefaultErrorFallback 
        error={this.state.error}
        errorInfo={this.state.errorInfo!}
        eventId={this.state.eventId}
        resetError={this.resetError}
      />;
    }

    return this.props.children;
  }
}

// Default error fallback component
function DefaultErrorFallback({ 
  error, 
  errorInfo, 
  eventId, 
  resetError 
}: ErrorBoundaryFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl border-destructive">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Something went wrong</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                An unexpected error occurred. This issue has been automatically reported.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {eventId && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium">Error ID</p>
              <code className="text-xs bg-background px-2 py-1 rounded mt-1 block">
                {eventId}
              </code>
              <p className="text-xs text-muted-foreground mt-1">
                Please provide this ID when reporting the issue.
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center gap-2"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </Button>
          </div>

          {showDetails && (
            <div className="space-y-3">
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm font-medium mb-2">Error Details</p>
                <code className="text-xs bg-background p-2 rounded block whitespace-pre-wrap">
                  {error.name}: {error.message}
                </code>
              </div>

              {error.stack && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">Stack Trace</p>
                  <code className="text-xs bg-background p-2 rounded block whitespace-pre-wrap max-h-40 overflow-auto">
                    {error.stack}
                  </code>
                </div>
              )}

              {errorInfo?.componentStack && (
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium mb-2">Component Stack</p>
                  <code className="text-xs bg-background p-2 rounded block whitespace-pre-wrap max-h-40 overflow-auto">
                    {errorInfo.componentStack}
                  </code>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Specialized error boundary for media components
export function MediaErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      context={{ component: 'MediaErrorBoundary', feature: 'media' }}
      onError={(error, errorInfo) => {
        logger.warn("Media component error", {
          error: error.message,
          componentStack: errorInfo.componentStack,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryOptions?: {
    fallback?: React.ComponentType<ErrorBoundaryFallbackProps>;
    context?: Record<string, any>;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
  }
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryOptions}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ErrorBoundary;