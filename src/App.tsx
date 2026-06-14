/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Transactions from '@/pages/Transactions';
import Accounts from '@/pages/Accounts';
import Budgets from '@/pages/Budgets';
import Subscriptions from '@/pages/Subscriptions';
import Goals from '@/pages/Goals';
import Savings from '@/pages/Savings';
import Investments from '@/pages/Investments';
import Loans from '@/pages/Loans';
import AIAssistant from '@/pages/AIAssistant';
import Education from '@/pages/Education';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import ProjectsTasks from '@/pages/ProjectsTasks';
import Community from '@/pages/Community';
import Login from '@/pages/Login';
import Contacts from '@/pages/Contacts';
import Candonga from '@/pages/Candonga';
import MesadaFamiliar from '@/pages/MesadaFamiliar';
import Marketplace from '@/pages/Marketplace';
import VukaStore from '@/pages/VukaStore';
import VukaCoinWallet from '@/pages/VukaCoinWallet';
import BuyVukaCoins from '@/pages/BuyVukaCoins';
import { useAuth } from '@/context/AuthContext';
import AppSecurityGuard from '@/components/AppSecurityGuard';



function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppSecurityGuard>
      <Layout>{children}</Layout>
    </AppSecurityGuard>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAuthenticated = !!user;

  return (
    <Routes>
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} />

      <Route path="/" element={isAuthenticated ? <ProtectedLayout><Dashboard /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/transactions" element={isAuthenticated ? <ProtectedLayout><Transactions /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/accounts" element={isAuthenticated ? <ProtectedLayout><Accounts /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/budgets" element={isAuthenticated ? <ProtectedLayout><Budgets /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/subscriptions" element={isAuthenticated ? <ProtectedLayout><Subscriptions /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/savings" element={isAuthenticated ? <ProtectedLayout><Savings /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/goals" element={isAuthenticated ? <ProtectedLayout><Goals /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/investments" element={isAuthenticated ? <ProtectedLayout><Investments /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/loans" element={isAuthenticated ? <ProtectedLayout><Loans /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/projects" element={isAuthenticated ? <ProtectedLayout><ProjectsTasks /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/ai-assistant" element={isAuthenticated ? <ProtectedLayout><AIAssistant /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/education" element={isAuthenticated ? <ProtectedLayout><Education /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/reports" element={isAuthenticated ? <ProtectedLayout><Reports /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={isAuthenticated ? <ProtectedLayout><Settings /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/community" element={isAuthenticated ? <ProtectedLayout><Community /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/contacts" element={isAuthenticated ? <ProtectedLayout><Contacts /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/candonga" element={isAuthenticated ? <ProtectedLayout><Candonga /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/mesada-familiar" element={isAuthenticated ? <ProtectedLayout><MesadaFamiliar /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/marketplace" element={isAuthenticated ? <ProtectedLayout><Marketplace /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/vuka-store" element={isAuthenticated ? <ProtectedLayout><VukaStore /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/vukacoins" element={isAuthenticated ? <ProtectedLayout><VukaCoinWallet /></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="/buy-vukacoins" element={isAuthenticated ? <ProtectedLayout><BuyVukaCoins /></ProtectedLayout> : <Navigate to="/login" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

