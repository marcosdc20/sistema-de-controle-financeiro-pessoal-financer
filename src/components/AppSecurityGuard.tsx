import React from 'react';

interface AppSecurityGuardProps {
  children: React.ReactNode;
}

/**
 * AppSecurityGuard — Desativado.
 * A autenticação é feita exclusivamente pela tela de Login Firebase (Login.tsx).
 * Este componente existe apenas para manter a compatibilidade com App.tsx.
 */
export default function AppSecurityGuard({ children }: AppSecurityGuardProps) {
  return <>{children}</>;
}
