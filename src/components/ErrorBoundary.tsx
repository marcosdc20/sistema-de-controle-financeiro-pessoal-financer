import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    retryCount: number;
}

// These are transient React DOM reconciliation errors that can be resolved
// by resetting the component tree — no need to show a crash screen.
const TRANSIENT_DOM_ERRORS = [
    'removeChild',
    'insertBefore',
    'appendChild',
    'replaceChild',
    'The node before which',
    'is not a child',
    'is not a descendant',
];

function isTransientDomError(message: string): boolean {
    return TRANSIENT_DOM_ERRORS.some(phrase =>
        message.toLowerCase().includes(phrase.toLowerCase())
    );
}

export class ErrorBoundary extends Component<Props, State> {
    private resetTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, retryCount: 0 };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error('ErrorBoundary caught:', error, info);

        // Auto-recover from transient DOM errors without showing the crash UI
        if (isTransientDomError(error.message)) {
            console.warn('Transient DOM reconciliation error detected — auto-recovering...');
            this.resetTimer = setTimeout(() => {
                this.setState(prev => ({
                    hasError: false,
                    error: null,
                    retryCount: prev.retryCount + 1,
                }));
            }, 50);
        }
    }

    componentWillUnmount() {
        if (this.resetTimer) clearTimeout(this.resetTimer);
    }

    render() {
        if (this.state.hasError && this.state.error && !isTransientDomError(this.state.error.message)) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
                    <div className="max-w-lg w-full bg-white rounded-3xl shadow-lg p-8 border border-red-100">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center text-2xl">
                                ⚠️
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Erro na Aplicação</h2>
                                <p className="text-sm text-gray-500">Algo correu mal. Tente recarregar a página.</p>
                            </div>
                        </div>
                        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
                            <p className="text-sm text-red-700 font-mono break-words">
                                {this.state.error?.message || 'Erro desconhecido'}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => this.setState({ hasError: false, error: null })}
                                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                            >
                                ↩ Tentar Novamente
                            </button>
                            <button
                                onClick={() => window.location.reload()}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
                            >
                                🔄 Recarregar Página
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}
