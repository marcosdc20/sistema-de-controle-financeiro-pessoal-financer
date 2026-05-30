import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { FinanceProvider } from '@/context/FinanceContext';
import { AuthProvider } from '@/context/AuthContext';
import { LicenseProvider } from '@/context/LicenseContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import LicenseGuard from '@/components/LicenseGuard';
import { initDatabase } from '@/database/db';
import App from './App.tsx';
import './index.css';

initDatabase()
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <ErrorBoundary>
        <BrowserRouter>
          {/*
           * LicenseProvider envolve tudo — é a camada mais externa de controlo.
           * LicenseGuard intercepta o app e exibe a tela de bloqueio/ativação
           * ANTES do AuthProvider processar a sessão do utilizador.
           * Ordem: LicenseGuard → AuthProvider → FinanceProvider → App
           */}
          <LicenseProvider>
            <LicenseGuard>
              <AuthProvider>
                <FinanceProvider>
                  <App />
                </FinanceProvider>
              </AuthProvider>
            </LicenseGuard>
          </LicenseProvider>
        </BrowserRouter>
      </ErrorBoundary>
    );
  })
  .catch((err) => {
    console.error('Falha ao inicializar o banco de dados local SQLite:', err);
    createRoot(document.getElementById('root')!).render(
      <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#EF4444' }}>
        <h2>Erro Crítico</h2>
        <p>Não foi possível inicializar o banco de dados local da aplicação.</p>
        <pre>{String(err)}</pre>
      </div>
    );
  });

