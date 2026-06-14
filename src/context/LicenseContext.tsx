/**
 * LicenseContext.tsx
 *
 * Contexto React global para o sistema de licenciamento do VukaPay.
 * Gerencia o ciclo de vida completo da licença:
 *  - Verificação do Hardware ID via Tauri (Rust)
 *  - Trial de 7 dias com timestamp do servidor Google
 *  - Ativação de chave com Firestore
 *  - Verificação periódica (ping) em background
 *  - Persistência HMAC no SQLite local
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import type Database from '@tauri-apps/plugin-sql';
import type { LicenseState, ActivationResult, PlanType } from '@/types/license';

import {
  getServerTimestamp,
  checkTrialStatus,
  createTrialRecord,
  saveTrialLocally,
  checkLocalTrialValidity,
  activateLicense,
  pingLicenseStatus,
  saveLicenseLocally,
  readLocalLicense,
  updateLocalVerificationTimestamp,
  clearLocalLicense,
  OFFLINE_GRACE_PERIOD_MS,
} from '@/services/licenseService';
import { useAuth } from '@/context/AuthContext';

// ─── Tipos do Contexto ───────────────────────────────────────────────────────

interface LicenseContextValue {
  licenseState: LicenseState;
  isLoading: boolean;

  /** Ativa uma chave de licença inserida pelo utilizador */
  activateLicenseKey: (licenseKey: string) => Promise<ActivationResult>;

  /** Força uma re-verificação imediata da licença (ex: após voltar de offline) */
  refreshLicense: () => Promise<void>;

  /** Reseta a licença local (para trocar de chave) */
  clearLicense: () => Promise<void>;
}

// ─── Estado inicial ──────────────────────────────────────────────────────────

const initialState: LicenseState = {
  phase:               'loading',
  hardwareId:          null,
  licenseKey:          null,
  clientEmail:         null,
  planType:            null,
  trialDaysRemaining:  null,
  trialExpiresAt:      null,
  licenseExpiresAt:    null,
  lastVerifiedAt:      null,
  offlineDaysCount:    null,
  errorMessage:        null,
};

// ─── Criação do Contexto ─────────────────────────────────────────────────────

const LicenseContext = createContext<LicenseContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export function LicenseProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [licenseState, setLicenseState] = useState<LicenseState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const sqliteDbRef = useRef<Database | null>(null);

  const hardwareIdRef = useRef<string | null>(null);

  /**
   * Obtém o Hardware ID desta máquina via comando Rust.
   * Faz cache no ref para não invocar múltiplas vezes.
   */
  const getHardwareId = useCallback(async (): Promise<string> => {
    if (hardwareIdRef.current) return hardwareIdRef.current;

    const isTauri = typeof window !== 'undefined' && (window as any).__TAURI_INTERNALS__ !== undefined;

    if (isTauri) {
      try {
        const { invoke } = await import('@tauri-apps/api/core');
        const hwId = await invoke<string>('get_hardware_id');
        hardwareIdRef.current = hwId;
        return hwId;
      } catch (error) {
        console.error('[LicenseContext] Falha ao obter Hardware ID via Tauri:', error);
      }
    }

    // Fallback: usa um identificador baseado em dados do browser (menos confiável)
    const fallbackId = await generateBrowserFallbackId();
    hardwareIdRef.current = fallbackId;
    return fallbackId;
  }, []);

  /**
   * Fallback para obter o Hardware ID quando Tauri não está disponível (desenvolvimento web).
   */
  async function generateBrowserFallbackId(): Promise<string> {
    const storedId = localStorage.getItem('vukapay_dev_hw_id');
    if (storedId) return storedId;

    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const id = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem('vukapay_dev_hw_id', id);
    return id;
  }

  /**
   * Obtém a instância do banco de dados SQLite.
   */
  const getSqliteDb = useCallback(async () => {
    if (sqliteDbRef.current) return sqliteDbRef.current;

    try {
      const { default: Database } = await import('@tauri-apps/plugin-sql');
      const database = await Database.load('sqlite:vukapay.db');
      sqliteDbRef.current = database;
      return database;
    } catch (error) {
      console.error('[LicenseContext] SQLite não disponível:', error);
      return null;
    }
  }, []);

  /**
   * Calcula a fase de trial baseada no timestamp de expiração.
   */
  function computeTrialState(expiresAt: number, serverTime: number): Partial<LicenseState> {
    const msRemaining = expiresAt - serverTime;
    const daysRemaining = Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

    if (msRemaining <= 0) {
      return {
        phase:              'trial_expired',
        trialDaysRemaining: 0,
        trialExpiresAt:     expiresAt,
        planType:           'free_trial',
      };
    }

    return {
      phase:              'trial_active',
      trialDaysRemaining: daysRemaining,
      trialExpiresAt:     expiresAt,
      planType:           'free_trial',
    };
  }

  /**
   * Fluxo de boot principal — executado uma vez quando o app inicia.
   *
   * Ordem de verificação:
   * 1. Obtém Hardware ID
   * 2. Verifica se existe licença local válida no SQLite
   *    a. Se sim → ping no Firestore para atualizar status
   *    b. Se não → verifica trial no Firestore
   *       - Se trial existe e válido → modo trial ativo
   *       - Se trial expirado → tela de bloqueio
   *       - Se trial não existe → cria trial (primeiro boot)
   */
  const runBootSequence = useCallback(async () => {
    setIsLoading(true);
    setLicenseState({ ...initialState, phase: 'loading' });

    try {
      const hwId = await getHardwareId();
      const { timestamp: serverTime, isOnline } = await getServerTimestamp();
      const db = await getSqliteDb();

      // ── Fase Anti-Burla de Relógio ─────────────────────────────────────────
      const lastUsageStr = localStorage.getItem('vukapay_last_usage_time');
      const now = Date.now();
      if (lastUsageStr) {
        const lastUsage = parseInt(lastUsageStr, 10);
        if (now < lastUsage - 3600000) {
          setLicenseState({
            ...initialState,
            phase:        'error',
            hardwareId:   hwId,
            errorMessage: 'Alteração de hora detetada! Por favor, ajuste a data e hora do seu computador para o horário correto.',
          });
          setIsLoading(false);
          return;
        }
      }
      localStorage.setItem('vukapay_last_usage_time', String(now));

      // Se não há utilizador logado, estamos no ecrã de login.
      if (!user) {
        setLicenseState({
          ...initialState,
          phase: 'active', // Permite renderizar a tela de login
          hardwareId: hwId,
        });
        setIsLoading(false);
        return;
      }

      const isGuest = user.isLocal || (user.email && user.email.endsWith('@vukapay.local'));
      const currentUserEmail = user.email ? user.email.trim().toLowerCase() : '';

      // ── Caso A: Utilizador é Convidado (Guest) ─────────────────────────────
      if (isGuest) {
        const localTrial = checkLocalTrialValidity();

        if (localTrial.hasLocalTrial) {
          if (!isOnline) {
            const trialPartialState = computeTrialState(localTrial.expiresAt!, serverTime);
            setLicenseState({ ...initialState, phase: trialPartialState.phase || 'trial_expired', hardwareId: hwId, ...trialPartialState });
            setIsLoading(false);
            return;
          }

          const firestoreTrial = await checkTrialStatus(hwId).catch(() => null);
          if (firestoreTrial) {
            const trialPartialState = computeTrialState(firestoreTrial.expires_at, serverTime);
            setLicenseState({ ...initialState, phase: trialPartialState.phase || 'trial_expired', hardwareId: hwId, ...trialPartialState });
            setIsLoading(false);
            return;
          }
        }

        if (isOnline) {
          const firestoreTrial = await checkTrialStatus(hwId).catch(() => null);
          if (firestoreTrial) {
            saveTrialLocally(firestoreTrial);
            const trialPartialState = computeTrialState(firestoreTrial.expires_at, serverTime);
            setLicenseState({ ...initialState, phase: trialPartialState.phase || 'trial_expired', hardwareId: hwId, ...trialPartialState });
            setIsLoading(false);
            return;
          }

          const newTrial = await createTrialRecord(hwId, serverTime);
          saveTrialLocally(newTrial);
          setLicenseState({
            ...initialState,
            phase:              'trial_active',
            hardwareId:         hwId,
            planType:           'free_trial',
            trialDaysRemaining: 7,
            trialExpiresAt:     newTrial.expires_at,
          });
          setIsLoading(false);
          return;
        }

        // Offline sem trial
        if (localTrial.hasLocalTrial) {
          const trialPartialState = computeTrialState(localTrial.expiresAt!, serverTime);
          setLicenseState({ ...initialState, phase: trialPartialState.phase || 'trial_expired', hardwareId: hwId, ...trialPartialState });
        } else {
          setLicenseState({
            ...initialState,
            phase:        'trial_expired',
            hardwareId:   hwId,
            planType:     'free_trial',
            errorMessage: 'Conexão necessária para iniciar o período de teste.',
          });
        }
        setIsLoading(false);
        return;
      }

      // ── Caso B: Utilizador Registado (E-mail / Google) ──────────────────────
      
      // Passo 1: Ler do SQLite local primeiro (mais rápido e tolerante a falhas)
      let localLicense = null;
      if (db) {
        localLicense = await readLocalLicense(db, hwId);
      }

      let licenseDataToUse = null;
      let licenseKeyToUse = null;

      if (localLicense && localLicense.client_email.trim().toLowerCase() === currentUserEmail) {
        // Encontrado localmente! Vamos tentar validar online de forma direta pelo ID (Key)
        licenseKeyToUse = localLicense.license_key;
        
        if (isOnline) {
          try {
            const { validateLicense } = await import('@/services/licenseService');
            const onlineLicense = await validateLicense(licenseKeyToUse);
            if (onlineLicense) {
              licenseDataToUse = onlineLicense;
              
              // Sincronizar qualquer mudança online para o offline
              if (db && onlineLicense.status === 'active') {
                await saveLicenseLocally(db, { ...onlineLicense, hardware_id: hwId }, hwId);
              }
            }
          } catch (err) {
            console.warn('[License Context] Erro ao validar chave online, mantendo dados locais.', err);
          }
        }
        
        // Se a validação online falhou, usamos os dados locais
        if (!licenseDataToUse) {
           licenseDataToUse = {
             status: 'active', // Assumido ativo se não pudemos verificar e estava offline
             client_email: localLicense.client_email,
             plan_type: localLicense.plan_type,
             hardware_id: hwId,
             expires_at: localLicense.expires_at,
             last_verified_at: localLicense.last_verified_at
           };
        }
      } else if (isOnline && currentUserEmail) {
        // Passo 2: Se não há licença local, tenta buscar no Firestore por email
        try {
          const { collection, query, where, getDocs, doc, updateDoc } = await import('firebase/firestore');
          const { db: firestoreDb } = await import('@/lib/firebase');
          
          const licensesCol = collection(firestoreDb, 'licenses');
          const q = query(licensesCol, where('client_email', '==', currentUserEmail));
          const snap = await getDocs(q);
          
          if (!snap.empty) {
            const licenseDoc = snap.docs[0];
            licenseDataToUse = licenseDoc.data();
            licenseKeyToUse = licenseDoc.id;
            
            // Vincular HWID automaticamente se estiver null (restaurando em novo PC após reset)
            if (licenseDataToUse.hardware_id === null) {
              await updateDoc(doc(firestoreDb, 'licenses', licenseDoc.id), { hardware_id: hwId });
              licenseDataToUse.hardware_id = hwId;
            }
            
            // Grava localmente o cache
            if (db) {
              await saveLicenseLocally(db, { id: licenseDoc.id, ...licenseDataToUse, hardware_id: hwId } as any, hwId);
            }
          }
        } catch (err) {
          console.warn('[License Context] Falha ao fazer query por email:', err);
        }
      }

      // Passo 3: Avaliar os dados obtidos (Online ou Offline)
      if (licenseDataToUse && licenseKeyToUse) {
         // Validar status
         if (licenseDataToUse.status === 'revoked') {
           if (db) await clearLocalLicense(db);
           setLicenseState({
             ...initialState,
             phase:        'revoked',
             hardwareId:   hwId,
             clientEmail:  currentUserEmail,
             errorMessage: 'A sua licença foi revogada pelo administrador.',
           });
           setIsLoading(false);
           return;
         }

         if (licenseDataToUse.status === 'expired' || (licenseDataToUse.expires_at && licenseDataToUse.expires_at < serverTime)) {
           setLicenseState({
             ...initialState,
             phase:        'expired',
             hardwareId:   hwId,
             licenseKey:   licenseKeyToUse,
             clientEmail:  currentUserEmail,
             planType:     licenseDataToUse.plan_type,
             licenseExpiresAt: licenseDataToUse.expires_at,
             errorMessage: 'A sua licença expirou. Renove para continuar.',
           });
           setIsLoading(false);
           return;
         }

         // Validar hardware_id (se está ativado noutro PC)
         if (licenseDataToUse.hardware_id !== null && licenseDataToUse.hardware_id !== hwId) {
           setLicenseState({
             ...initialState,
             phase:        'error',
             hardwareId:   hwId,
             clientEmail:  currentUserEmail,
             errorMessage: 'Esta chave de licença já está ativada noutro computador. Contacte o suporte para redefinição.',
           });
           setIsLoading(false);
           return;
         }
         
         // Validar tempo offline limite
         if (!isOnline && licenseDataToUse.last_verified_at) {
            const daysSinceVerify = (serverTime - licenseDataToUse.last_verified_at) / (24 * 60 * 60 * 1000);
            if (daysSinceVerify > 7) {
              setLicenseState({
                ...initialState,
                phase:           'offline_warning',
                hardwareId:      hwId,
                licenseKey:      licenseKeyToUse,
                clientEmail:     currentUserEmail,
                planType:        licenseDataToUse.plan_type,
                offlineDaysCount: Math.floor(daysSinceVerify),
                lastVerifiedAt:  licenseDataToUse.last_verified_at,
              });
              setIsLoading(false);
              return;
            }
         }

         // Licença Válida!
         setLicenseState({
           ...initialState,
           phase:            'active',
           hardwareId:       hwId,
           licenseKey:       licenseKeyToUse,
           clientEmail:      currentUserEmail,
           planType:         licenseDataToUse.plan_type,
           licenseExpiresAt: licenseDataToUse.expires_at,
           lastVerifiedAt:   serverTime,
         });
         setIsLoading(false);
         return;
      }

      // 3. Fallback: Sem licença paga, verificar se o trial local ainda está ativo para este e-mail
      const localTrial = checkLocalTrialValidity();
      if (localTrial.hasLocalTrial) {
        const trialPartialState = computeTrialState(localTrial.expiresAt!, serverTime);
        setLicenseState({
          ...initialState,
          phase:        trialPartialState.phase || 'trial_expired',
          hardwareId:   hwId,
          clientEmail:  currentUserEmail,
          ...trialPartialState,
        });
      } else {
        // Se estiver online, cria o trial para este dispositivo
        if (isOnline) {
          const firestoreTrial = await checkTrialStatus(hwId).catch(() => null);
          if (firestoreTrial) {
            saveTrialLocally(firestoreTrial);
            const trialPartialState = computeTrialState(firestoreTrial.expires_at, serverTime);
            setLicenseState({
              ...initialState,
              phase:        trialPartialState.phase || 'trial_expired',
              hardwareId:   hwId,
              clientEmail:  currentUserEmail,
              ...trialPartialState,
            });
          } else {
            const newTrial = await createTrialRecord(hwId, serverTime);
            saveTrialLocally(newTrial);
            setLicenseState({
              ...initialState,
              phase:              'trial_active',
              hardwareId:         hwId,
              clientEmail:        currentUserEmail,
              planType:           'free_trial',
              trialDaysRemaining: 7,
              trialExpiresAt:     newTrial.expires_at,
            });
          }
        } else {
          // Totalmente offline e sem licença/trial
          setLicenseState({
            ...initialState,
            phase:        'trial_expired',
            hardwareId:   hwId,
            clientEmail:  currentUserEmail,
            planType:     'free_trial',
            errorMessage: 'Conexão à internet necessária para validar a sua conta.',
          });
        }
      }

    } catch (error) {
      console.error('[LicenseContext] Erro no boot sequence:', error);
      setLicenseState({
        ...initialState,
        phase:        'error',
        errorMessage: 'Erro ao verificar licença. Tente reiniciar o aplicativo.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getHardwareId, getSqliteDb, user]);

  // Executa o boot sequence na montagem e sempre que o utilizador muda
  useEffect(() => {
    runBootSequence();
  }, [runBootSequence]);

  /**
   * Ativa uma chave de licença inserida pelo utilizador.
   */
  const activateLicenseKey = useCallback(
    async (licenseKey: string): Promise<ActivationResult> => {
      const hwId = hardwareIdRef.current || (await getHardwareId());
      const previousState = licenseState;

      setLicenseState((prev) => ({ ...prev, phase: 'activating', errorMessage: null }));

      const userEmail = user?.email || '';
      const result = await activateLicense(licenseKey, hwId, userEmail);

      if (!result.success || !result.license) {
        setLicenseState({
          ...previousState,
          errorMessage: result.message || 'Falha na ativação.',
        });
        return result;
      }

      // Persiste no SQLite local
      try {
        const db = await getSqliteDb();
        if (db) {
          await saveLicenseLocally(db, result.license, hwId);
        }
      } catch (dbError) {
        console.error('[LicenseContext] Falha ao persistir licença localmente no SQLite:', dbError);
      }

      // Limpa dados do trial no localStorage
      try {
        localStorage.removeItem('vukapay_trial_started');
        localStorage.removeItem('vukapay_trial_expires');
        localStorage.removeItem('vukapay_trial_hw_id');
      } catch (lsError) {
        console.error('[LicenseContext] Falha ao limpar cache de trial:', lsError);
      }

      setLicenseState({
        ...initialState,
        phase:           'active',
        hardwareId:      hwId,
        licenseKey:      result.license.id,
        clientEmail:     result.license.client_email,
        planType:        result.license.plan_type as PlanType,
        licenseExpiresAt: result.license.expires_at,
        lastVerifiedAt:  Date.now(),
      });

      return result;
    },
    [getHardwareId, getSqliteDb, licenseState, user]
  );

  /**
   * Re-executa o boot sequence completo (usado quando volta do offline).
   */
  const refreshLicense = useCallback(async () => {
    await runBootSequence();
  }, [runBootSequence]);

  /**
   * Limpa a licença local para trocar de chave.
   */
  const clearLicense = useCallback(async () => {
    const db = await getSqliteDb();
    if (db) {
      await clearLocalLicense(db);
    }
    setLicenseState({
      ...initialState,
      phase:      'trial_expired',
      hardwareId: hardwareIdRef.current,
    });
  }, [getSqliteDb]);

  return (
    <LicenseContext.Provider
      value={{ licenseState, isLoading, activateLicenseKey, refreshLicense, clearLicense }}
    >
      {children}
    </LicenseContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useLicense(): LicenseContextValue {
  const ctx = useContext(LicenseContext);
  if (!ctx) {
    throw new Error('useLicense deve ser usado dentro de <LicenseProvider>');
  }
  return ctx;
}
