'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Page-level Error Boundary
 * Catches errors within a specific page/route
 */
export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Page Error Boundary caught:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-16">
          <Card className="border-destructive">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="mb-4 size-12 text-destructive" />
              <h3 className="mb-2 text-lg font-semibold">Error en esta página</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                {this.props.fallbackMessage ||
                  'Ha ocurrido un error al cargar esta página. Por favor, intenta de nuevo.'}
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-4 w-full max-w-2xl rounded-md bg-muted p-4 text-left">
                  <p className="text-sm font-medium text-destructive">
                    {this.state.error.message}
                  </p>
                </div>
              )}
              <Button onClick={this.handleReset} className="gap-2">
                <RefreshCw className="size-4" />
                Reintentar
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
