import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useFinance } from '@/context/FinanceContext';
import { Lock, User, Key, ShieldAlert, LogOut, Loader2, TrendingUp, Mail, HelpCircle, ArrowLeft, Delete, CheckCircle } from 'lucide-react';

interface AppSecurityGuardProps {
  children: React.ReactNode;
}

export default function AppSecurityGuard({ children }: AppSecurityGuardProps) {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, loading: financeLoading } = useFinance();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return sessionStorage.getItem('vukapay_session_unlocked') === 'true';
  });

  // Setup Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('Qual é o nome da sua primeira escola?');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');

  // Lockscreen States
  const [enteredPassword, setEnteredPassword] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  const [isPinMode, setIsPinMode] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recovery States
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryMethod, setRecoveryMethod] = useState<'select' | 'question' | 'email'>('select');
  const [recoveryAnswerInput, setRecoveryAnswerInput] = useState('');
  const [recoveryEmailInput, setRecoveryEmailInput] = useState('');
  const [recoveryCodeInput, setRecoveryCodeInput] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'verify' | 'reset'>('verify');
  const [newPassword, setNewPassword] = useState('');
  const [newConfirmPassword, setNewConfirmPassword] = useState('');
  const [newPin, setNewPin] = useState('');

  // Set default PIN mode if pin_code is configured
  useEffect(() => {
    if (profile) {
      setUsername(profile.full_name || user?.user_metadata?.full_name || '');
      if (profile.pin_code) {
        setIsPinMode(true);
      }
    }
  }, [profile, user]);

  // Inactivity timeout handler
  useEffect(() => {
    if (!isUnlocked) return;

    const timeoutStr = localStorage.getItem('vukapay_auto_lock_timeout') || '5';
    if (timeoutStr === 'disabled') return;

    const timeoutMinutes = parseInt(timeoutStr, 10);
    if (isNaN(timeoutMinutes) || timeoutMinutes <= 0) return;

    const timeoutMs = timeoutMinutes * 60 * 1000;
    let timer: number;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        sessionStorage.removeItem('vukapay_session_unlocked');
        setIsUnlocked(false);
      }, timeoutMs);
    };

    // Events to monitor user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    // Start timer on mount/unlock
    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [isUnlocked]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('O nome de usuário não pode estar vazio.');
      return;
    }

    if (password.length < 4) {
      setError('A senha deve conter pelo menos 4 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (pinCode && !/^\d{4,6}$/.test(pinCode)) {
      setError('O código PIN deve conter entre 4 e 6 algarismos.');
      return;
    }

    if (!securityAnswer.trim()) {
      setError('A resposta de segurança não pode estar vazia.');
      return;
    }

    if (!recoveryEmail.trim()) {
      setError('O e-mail de recuperação não pode estar vazio.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        full_name: username.trim(),
        password: password,
        pin_code: pinCode || undefined,
        security_question: securityQuestion,
        security_answer: securityAnswer.trim().toLowerCase(),
        recovery_email: recoveryEmail.trim()
      });
      sessionStorage.setItem('vukapay_session_unlocked', 'true');
      setIsUnlocked(true);
    } catch (err) {
      console.error(err);
      setError('Ocorreu um erro ao configurar o perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlock = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!profile?.password) return;

    if (enteredPassword === profile.password) {
      sessionStorage.setItem('vukapay_session_unlocked', 'true');
      setIsUnlocked(true);
    } else {
      setError('Senha incorreta. Tente novamente.');
      setEnteredPassword('');
    }
  };

  // Virtual Keypad input handler for PIN
  const handlePinKeyPress = (digit: string) => {
    setError(null);
    if (!profile?.pin_code) return;

    const currentPin = enteredPin + digit;
    const expectedLength = profile.pin_code.length;

    if (currentPin.length <= expectedLength) {
      setEnteredPin(currentPin);
      
      // Auto verify when correct length is reached
      if (currentPin.length === expectedLength) {
        if (currentPin === profile.pin_code) {
          sessionStorage.setItem('vukapay_session_unlocked', 'true');
          setIsUnlocked(true);
        } else {
          setError('PIN incorreto. Tente novamente.');
          setEnteredPin('');
        }
      }
    }
  };

  const handlePinBackspace = () => {
    setEnteredPin(prev => prev.slice(0, -1));
  };

  const handlePinClear = () => {
    setEnteredPin('');
  };

  const handleSendRecoveryEmail = () => {
    setError(null);
    if (!profile?.recovery_email) return;

    if (recoveryEmailInput.toLowerCase().trim() !== profile.recovery_email.toLowerCase().trim()) {
      setError('O e-mail informado não coincide com o e-mail cadastrado.');
      return;
    }

    // Send code notification
    if ('Notification' in window) {
      if (Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
      
      // Fire desktop notification
      new Notification('VukaPay - Recuperação de Senha', {
        body: 'O seu código de verificação temporário é: 123456',
        icon: '/logo.png'
      });
    }
    
    alert('Código de recuperação enviado! Verifique as notificações nativas do Windows.');
    setRecoveryStep('verify');
    setRecoveryMethod('email');
  };

  const handleVerifyAnswer = () => {
    setError(null);
    if (!profile?.security_answer) return;

    if (recoveryAnswerInput.trim().toLowerCase() === profile.security_answer.toLowerCase()) {
      setRecoveryStep('reset');
    } else {
      setError('Resposta de segurança incorreta.');
    }
  };

  const handleVerifyEmailCode = () => {
    setError(null);
    if (recoveryCodeInput.trim() === '123456') {
      setRecoveryStep('reset');
    } else {
      setError('Código de verificação incorreto.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 4) {
      setError('A senha deve ter pelo menos 4 caracteres.');
      return;
    }

    if (newPassword !== newConfirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPin && !/^\d{4,6}$/.test(newPin)) {
      setError('O PIN deve conter entre 4 e 6 algarismos.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateProfile({
        password: newPassword,
        pin_code: newPin || undefined
      });
      alert('Sua senha foi redefinida com sucesso!');
      setIsRecovering(false);
      setRecoveryMethod('select');
      setRecoveryStep('verify');
      setRecoveryAnswerInput('');
      setRecoveryEmailInput('');
      setRecoveryCodeInput('');
      setNewPassword('');
      setNewConfirmPassword('');
      setNewPin('');
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar nova senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Tem certeza de que deseja sair da conta?')) {
      sessionStorage.removeItem('vukapay_session_unlocked');
      await signOut();
      window.location.reload();
    }
  };

  // Skip guard if no user
  if (!user) {
    return <>{children}</>;
  }

  // Loading Screen
  if (financeLoading || !profile) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#030712] text-gray-100 font-sans">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-sm text-gray-400">Verificando credenciais locais...</p>
      </div>
    );
  }

  // Phase 1: First time setup
  if (!profile.password) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] font-sans text-gray-100 p-4 relative overflow-y-auto py-12">
        <div className="absolute top-1/4 -left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />

        <div className="w-full max-w-md bg-gray-950/80 border border-gray-900 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md relative z-10 my-auto">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
          
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/30 mb-3 animate-pulse">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">Configurar Acesso Seguro</h2>
            <p className="text-xs text-gray-400 text-center mt-2 px-4 leading-relaxed">
              Configure o seu perfil e as chaves de segurança local do seu **VukaPay**. Todos os dados ficam encriptados localmente.
            </p>
          </div>

          <form onSubmit={handleSetup} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-400 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Nome de Usuário</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                  placeholder="Nome do Utilizador"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Senha de Acesso</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-3 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                    placeholder="Mín. 4 digitos"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Repetir Senha</label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-11 pr-3 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                    placeholder="Repita a senha"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Código PIN (Opcional - Apenas números)</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="text"
                  maxLength={6}
                  value={pinCode}
                  onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                  placeholder="Ex: 1234 (4 a 6 dígitos)"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Pergunta Secreta de Segurança</label>
              <select
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white mb-2"
              >
                <option value="Qual é o nome da sua primeira escola?">Qual é o nome da sua primeira escola?</option>
                <option value="Qual era o nome do seu animal de estimação de infância?">Qual era o nome do seu animal de estimação?</option>
                <option value="Qual é a cidade onde os seus pais se conheceram?">Qual é a cidade onde os seus pais se conheceram?</option>
                <option value="Qual é o seu prato de comida favorito?">Qual é o seu prato de comida favorito?</option>
              </select>
              <input
                type="text"
                required
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                placeholder="Resposta de Segurança"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">E-mail de Recuperação</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                <input
                  type="email"
                  required
                  value={recoveryEmail}
                  onChange={(e) => setRecoveryEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                  placeholder="seuemail@exemplo.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 mt-6"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Concluir Configuração</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 bg-transparent hover:bg-gray-900/50 text-gray-400 hover:text-white rounded-2xl text-xs font-medium transition-all flex items-center justify-center gap-2 border border-gray-800/40"
            >
              <LogOut className="w-4 h-4" />
              <span>Voltar ao Login Tauri</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Phase 2: Password Recovery Flow
  if (isRecovering) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#030712] font-sans text-gray-100 p-4 relative overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[100px]" />

        <div className="w-full max-w-md bg-gray-950/80 border border-gray-900 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md relative z-10">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
          
          <button 
            onClick={() => {
              if (recoveryStep === 'reset') {
                setRecoveryStep('verify');
              } else if (recoveryMethod !== 'select') {
                setRecoveryMethod('select');
              } else {
                setIsRecovering(false);
              }
            }}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>

          <h2 className="text-xl font-bold text-white mb-2">Recuperar Acesso</h2>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            Escolha uma forma de redefinir as credenciais de segurança salvas localmente neste computador.
          </p>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-400 text-xs mb-4">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {recoveryStep === 'verify' && recoveryMethod === 'select' && (
            <div className="space-y-3">
              <button
                onClick={() => setRecoveryMethod('question')}
                className="w-full p-4 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-2xl flex items-center gap-4 text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Pergunta de Segurança</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Responda à pergunta configurada durante o setup.</p>
                </div>
              </button>

              <button
                onClick={() => setRecoveryMethod('email')}
                className="w-full p-4 bg-gray-900 hover:bg-gray-850 border border-gray-800 rounded-2xl flex items-center gap-4 text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Código por E-mail</h4>
                  <p className="text-[10px] text-gray-500 mt-0.5">Envia um código de validação local por notificação.</p>
                </div>
              </button>
            </div>
          )}

          {recoveryStep === 'verify' && recoveryMethod === 'question' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-950/20 border border-indigo-900/30 rounded-2xl">
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 block mb-1">Sua Pergunta</span>
                <p className="text-xs text-white font-medium">{profile.security_question}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Sua Resposta</label>
                <input
                  type="text"
                  required
                  value={recoveryAnswerInput}
                  onChange={(e) => setRecoveryAnswerInput(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                  placeholder="Escreva a resposta secreta"
                />
              </div>

              <button
                onClick={handleVerifyAnswer}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-bold rounded-2xl text-xs mt-2"
              >
                Validar Resposta
              </button>
            </div>
          )}

          {recoveryStep === 'verify' && recoveryMethod === 'email' && (
            <div className="space-y-4">
              {recoveryEmailInput === '' && (
                <>
                  <div className="p-3 bg-gray-900 border border-gray-800 rounded-2xl text-[11px] text-gray-400">
                    O e-mail de recuperação termina em: **{profile.recovery_email ? profile.recovery_email.replace(/^.{1,4}/, '****') : ''}**
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Digite o e-mail cadastrado</label>
                    <input
                      type="email"
                      required
                      value={recoveryEmailInput}
                      onChange={(e) => setRecoveryEmailInput(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                      placeholder="seuemail@exemplo.com"
                    />
                  </div>
                  <button
                    onClick={handleSendRecoveryEmail}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-bold rounded-2xl text-xs mt-2"
                  >
                    Enviar Código de Teste
                  </button>
                </>
              )}

              {recoveryEmailInput !== '' && (
                <>
                  <div className="p-3 bg-gray-900 border border-gray-800 rounded-2xl text-[11px] text-gray-400 leading-relaxed">
                    Um código local foi enviado. Procure pelo pop-up de notificação na área de trabalho e digite os 6 dígitos abaixo.
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Código de 6 dígitos</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={recoveryCodeInput}
                      onChange={(e) => setRecoveryCodeInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm tracking-widest text-center focus:outline-none focus:border-indigo-500 text-white font-bold"
                      placeholder="123456"
                    />
                  </div>
                  <button
                    onClick={handleVerifyEmailCode}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-bold rounded-2xl text-xs mt-2"
                  >
                    Confirmar Código
                  </button>
                </>
              )}
            </div>
          )}

          {recoveryStep === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Nova Senha de Acesso</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                  placeholder="Mínimo 4 caracteres"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Confirmar Nova Senha</label>
                <input
                  type="password"
                  required
                  value={newConfirmPassword}
                  onChange={(e) => setNewConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                  placeholder="Confirme a nova senha"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Novo Código PIN (Opcional)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 text-white"
                  placeholder="PIN numérico de 4 a 6 dígitos"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all text-white font-bold rounded-2xl text-xs mt-4"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Redefinir e Salvar Credenciais'}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // Phase 3: Lock Screen (Password or PIN numeric keypad)
  if (!isUnlocked) {
    // Determine the initials or show avatar
    const initials = profile.full_name?.substring(0, 2).toUpperCase() || 'VP';
    
    return (
      <div className="min-h-screen w-full flex bg-[#030712] font-sans text-gray-100 selection:bg-indigo-500/30">
        
        {/* Left Side: Dynamic Branding Image Panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden border-r border-gray-900">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2064&auto=format&fit=crop"
              alt="Premium 3D Abstract Financial Concept"
              className="w-full h-full object-cover opacity-40 scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-[#030712] via-[#090d1a]/95 to-transparent" />
          </div>

          {/* Ambient Glows */}
          <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 -right-1/4 w-[400px] h-[400px] bg-purple-600/10 rounded-full blur-[120px]" />

          <div className="relative z-10 w-full p-16 flex flex-col justify-between">
            {/* Header / Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                VukaPay
              </span>
            </div>

            {/* Middle quote/motivation */}
            <div className="max-w-md space-y-4">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-indigo-400 text-xs font-semibold">
                Controle Offline Seguro
              </span>
              <h2 className="text-4xl font-extrabold leading-tight text-white">
                Seus dados financeiros protegidos a cada acesso.
              </h2>
              <p className="text-sm text-gray-400">
                O VukaPay utiliza criptografia local avançada no banco de dados para garantir que apenas você tenha acesso ao seu histórico e saldo.
              </p>
            </div>

            <div className="text-[10px] text-gray-600 uppercase tracking-widest">
              Segurança Local Ativa
            </div>
          </div>
        </div>

        {/* Right Side: Lock Screen Interface */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">
          <div className="lg:hidden absolute inset-0 -z-10 bg-[#030712]">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2064&auto=format&fit=crop"
                alt="Premium 3D Abstract Financial Concept"
                className="w-full h-full object-cover opacity-15 blur-sm"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-[#030712]/95" />
            </div>
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[80px]" />
          </div>

          <div className="w-full max-w-sm bg-gray-950/80 border border-gray-900 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-md relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-[2.5rem]" />
            
            <div className="flex flex-col items-center mb-6">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar do Usuário" 
                  className="w-20 h-20 rounded-3xl object-cover shadow-xl border border-indigo-500/20 mb-3"
                />
              ) : (
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-indigo-500/10 mb-3 scale-105 border border-indigo-400/20">
                  {initials}
                </div>
              )}
              <h2 className="text-xl font-bold text-white mt-1">{profile.full_name}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {isPinMode ? 'Digite o seu código PIN de acesso' : 'Insira a sua senha para desbloquear'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-red-400 text-xs mb-4">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isPinMode ? (
              // PIN CODE Virtual Keypad Unlock (Multicaixa Express style)
              <div className="space-y-6">
                {/* Display dots for digits entered */}
                <div className="flex justify-center gap-3 py-2">
                  {Array.from({ length: profile.pin_code?.length || 4 }).map((_, idx) => (
                    <div 
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-150 border border-gray-700 ${
                        idx < enteredPin.length ? 'bg-indigo-500 scale-110 shadow-lg shadow-indigo-500/30' : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>

                {/* Grid 3x4 layout */}
                <div className="grid grid-cols-3 gap-3.5 max-w-[280px] mx-auto">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => handlePinKeyPress(digit)}
                      className="w-16 h-16 rounded-full bg-gray-900/60 hover:bg-gray-850 active:bg-gray-800 text-lg font-bold text-white flex items-center justify-center transition-all border border-gray-900/40"
                    >
                      {digit}
                    </button>
                  ))}
                  
                  {/* Clear */}
                  <button
                    type="button"
                    onClick={handlePinClear}
                    className="w-16 h-16 rounded-full text-xs font-semibold text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    Limpar
                  </button>
                  
                  {/* 0 */}
                  <button
                    type="button"
                    onClick={() => handlePinKeyPress('0')}
                    className="w-16 h-16 rounded-full bg-gray-900/60 hover:bg-gray-850 active:bg-gray-800 text-lg font-bold text-white flex items-center justify-center transition-all border border-gray-900/40"
                  >
                    0
                  </button>
                  
                  {/* Delete/Backspace */}
                  <button
                    type="button"
                    onClick={handlePinBackspace}
                    className="w-16 h-16 rounded-full text-gray-400 hover:text-white flex items-center justify-center transition-colors"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex justify-between text-xs text-gray-400 px-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPinMode(false);
                      setError(null);
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Usar Senha de Texto
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecovering(true);
                      setError(null);
                    }}
                    className="hover:text-white font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </div>
            ) : (
              // PASSWORD TEXT Form Unlock
              <form onSubmit={handleUnlock} className="space-y-4">
                <div>
                  <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-500" />
                    <input
                      type="password"
                      required
                      autoFocus
                      value={enteredPassword}
                      onChange={(e) => setEnteredPassword(e.target.value)}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-900 border border-gray-800 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 transition-colors text-white"
                      placeholder="Digite sua senha"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Lock className="w-4 h-4" />
                  <span>Desbloquear App</span>
                </button>

                <div className="flex justify-between text-xs text-gray-400 px-1 pt-1">
                  {profile.pin_code ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsPinMode(true);
                        setError(null);
                      }}
                      className="hover:text-white transition-colors font-medium text-indigo-400"
                    >
                      Usar Código PIN
                    </button>
                  ) : (
                    <div />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsRecovering(true);
                      setError(null);
                    }}
                    className="hover:text-white font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </form>
            )}

            <div className="mt-8 pt-4 border-t border-gray-900 flex justify-center">
              <button
                type="button"
                onClick={handleLogout}
                className="py-2 px-4 hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-2xl text-xs font-semibold transition-all flex items-center gap-2 border border-red-950/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Sair da Conta</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Phase 4: Session unlocked - render application
  return <>{children}</>;
}
