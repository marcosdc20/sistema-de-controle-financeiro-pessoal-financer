import React from 'react';
import { Cloud, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function LinkGoogleBanner() {
  const { user, linkGuestToGoogle } = useAuth();

  // Só exibe se for convidado e tiver internet (simulada por navigator.onLine)
  if (!user || user.id !== 'local-user' || !navigator.onLine) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg mb-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 animate-fade-in-up">
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      
      <div className="flex items-center space-x-4 relative z-10">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md shrink-0">
          <Cloud className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg">Proteja os seus dados</h3>
          <p className="text-blue-100 text-sm max-w-md">
            Gostaria de guardar os seus dados na nuvem e ter acesso em qualquer dispositivo? Conecte a sua conta Google.
          </p>
        </div>
      </div>

      <button
        onClick={() => linkGuestToGoogle()}
        className="relative z-10 whitespace-nowrap bg-white text-blue-600 px-6 py-3 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2 shrink-0 shadow-sm"
      >
        <span>Ligar Conta Google</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
