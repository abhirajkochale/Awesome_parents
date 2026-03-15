import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

interface ErrorBoundaryProps {
    children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="text-center max-w-md space-y-6">
                        <div className="inline-flex p-4 bg-red-100 rounded-full">
                            <AlertCircle className="h-12 w-12 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
                        <p className="text-muted-foreground">
                            An unexpected error occurred. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <details className="text-left bg-muted/50 rounded-lg p-4">
                                <summary className="text-sm font-medium cursor-pointer text-muted-foreground">
                                    Error details
                                </summary>
                                <pre className="mt-2 text-xs text-red-600 overflow-auto whitespace-pre-wrap">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <Button
                            onClick={() => window.location.reload()}
                            className="shadow-md"
                        >
                            Refresh Page
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
