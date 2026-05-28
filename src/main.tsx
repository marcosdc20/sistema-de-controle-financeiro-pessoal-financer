import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { FinanceProvider } from '@/context/FinanceContext';
import { AuthProvider } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initDatabase } from '@/database/db';
import App from './App.tsx';
import './index.css';

initDatabase()
  .then(() => {
    createRoot(document.getElementById('root')!).render(
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <FinanceProvider>
              <App />
            </FinanceProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    );
  })
  .catch((err) => {
    console.error('Falha ao inicializar o banco de dados local SQLite:', err);
    // Renderiza uma mensagem de erro amigável se falhar
    createRoot(document.getElementById('root')!).render(
      <div style={{ padding: '20px', fontFamily: 'sans-serif', color: '#EF4444' }}>
        <h2>Erro Crítico</h2>
        <p>Não foi possível inicializar o banco de dados local da aplicação.</p>
        <pre>{String(err)}</pre>
      </div>
    );
  });
