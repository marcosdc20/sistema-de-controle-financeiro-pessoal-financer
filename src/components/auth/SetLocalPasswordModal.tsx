import React, { useState } from 'react';
import { Lock, Eye, EyeOff, Save, AlertCircle } from 'lucide-react';
import { getDatabase } from '../../database/db';

interface SetLocalPasswordModalProps {
  onSuccess: () => void;
  userEmail?: string;
  isGuest?: boolean;
}

export function SetLocalPasswordModal({ onSuccess, userEmail, isGuest }: SetLocalPasswordModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('A palavra-passe deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As palavras-passe não coincidem.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const db = await getDatabase();
      // Em produção, usaríamos bcrypyt ou sha-256. Aqui vamos fazer um encode base64 simples por enquanto
      // para evitar dependências nativas pesadas, ou um hash simples no frontend
      const passwordHash = btoa(password); // FIXME: Melhorar com crypto.subtle ou bcrypt
      
      const savedUserStr = localStorage.getItem('vukapay_user');
      if (savedUserStr) {
        const user = JSON.parse(savedUserStr);
        await db.execute('UPDATE profiles SET password = ? WHERE id = ?', [passwordHash, user.id]);
        onSuccess();
      } else {
        throw new Error('Utilizador não encontrado no cache local');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao guardar palavra-passe.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="bg-gradient-to-r from-[#00A859] to-[#008f4c] p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Segurança Offline</h2>
          <p className="text-[#00A859] text-sm mt-2 opacity-90 bg-white/20 inline-block px-3 py-1 rounded-full">
            {userEmail || 'Modo Convidado'}
          </p>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm mb-6 flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              {isGuest 
                ? 'Configure uma palavra-passe para aceder aos seus dados em modo offline.' 
                : 'Para garantir o seu acesso mesmo sem internet, configure uma palavra-passe local para o seu cofre VukaPay.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm border border-red-100 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Palavra-passe Local
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A859] focus:border-transparent transition-all outline-none"
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Palavra-passe
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00A859] focus:border-transparent transition-all outline-none"
                placeholder="Repita a palavra-passe"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-[#00A859] to-[#008f4c] text-white py-3 rounded-xl font-medium hover:shadow-lg hover:-translate-y-0.5 transition-all active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mt-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Guardar Palavra-passe</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
