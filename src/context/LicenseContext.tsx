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
import { invoke } from '@tauri-apps/api/core';
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

    try {
      const hwId = await invoke<string>('get_hardware_id');
      hardwareIdRef.current = hwId;
      return hwId;
    } catch (error) {
      console.error('[LicenseContext] Falha ao obter Hardware ID:', error);
      // Fallback: usa um identificador baseado em dados do browser (menos confiável)
      const fallbackId = await generateBrowserFallbackId();
      hardwareIdRef.current = fallbackId;
      return fallbackId;
    }
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

      // ── Fase 1: Verifica licença paga no SQLite local ────────────────────
      if (db) {
        const localLicense = await readLocalLicense(db, hwId);

        if (localLicense) {
          // Existe licença local válida e não adulterada

          // Verifica expiração local primeiro
          if (localLicense.expires_at && localLicense.expires_at < serverTime) {
            setLicenseState({
              ...initialState,
              phase:          'expired',
              hardwareId:     hwId,
              licenseKey:     localLicense.license_key,
              clientEmail:    localLicense.client_email,
              planType:       localLicense.plan_type,
              licenseExpiresAt: localLicense.expires_at,
              errorMessage:   'A sua licença expirou. Renove para continuar.',
            });
            setIsLoading(false);
            return;
          }

          // Verifica se ficou muito tempo sem internet
          const daysSinceVerify = (serverTime - localLicense.last_verified_at) / (24 * 60 * 60 * 1000);

          if (!isOnline && daysSinceVerify > 7) {
            setLicenseState({
              ...initialState,
              phase:           'offline_warning',
              hardwareId:      hwId,
              licenseKey:      localLicense.license_key,
              clientEmail:     localLicense.client_email,
              planType:        localLicense.plan_type,
              offlineDaysCount: Math.floor(daysSinceVerify),
              lastVerifiedAt:  localLicense.last_verified_at,
            });
            setIsLoading(false);
            return;
          }

          // Faz ping no Firestore se online
          if (isOnline) {
            const { status } = await pingLicenseStatus(localLicense.license_key);

            if (status === 'revoked') {
              await clearLocalLicense(db);
              setLicenseState({
                ...initialState,
                phase:        'revoked',
                hardwareId:   hwId,
                errorMessage: 'A sua licença foi revogada. Contacte o suporte.',
              });
              setIsLoading(false);
              return;
            }

            if (status === 'expired') {
              setLicenseState({
                ...initialState,
                phase:           'expired',
                hardwareId:      hwId,
                licenseKey:      localLicense.license_key,
                clientEmail:     localLicense.client_email,
                planType:        localLicense.plan_type,
                licenseExpiresAt: localLicense.expires_at,
                errorMessage:    'A sua licença expirou. Renove para continuar.',
              });
              setIsLoading(false);
              return;
            }

            // Status 'active' → atualiza timestamp de verificação
            if (status === 'active') {
              await updateLocalVerificationTimestamp(db, serverTime);
            }
          }

          // Licença válida — liberta o app
          setLicenseState({
            ...initialState,
            phase:           'active',
            hardwareId:      hwId,
            licenseKey:      localLicense.license_key,
            clientEmail:     localLicense.client_email,
            planType:        localLicense.plan_type,
            licenseExpiresAt: localLicense.expires_at,
            lastVerifiedAt:  serverTime,
          });
          setIsLoading(false);
          return;
        }
      }

      // ── Fase 2: Sem licença local — verifica Trial ───────────────────────

      // Primeiro verifica o cache local do trial (para offline)
      const localTrial = checkLocalTrialValidity();

      if (localTrial.hasLocalTrial) {
        if (!isOnline) {
          // Usa dados locais offline
          const trialPartialState = computeTrialState(
            localTrial.expiresAt!,
            serverTime
          );
          setLicenseState({ ...initialState, hardwareId: hwId, ...trialPartialState });
          setIsLoading(false);
          return;
        }

        // Online: verifica no Firestore para obter timestamp oficial
        const firestoreTrial = await checkTrialStatus(hwId).catch(() => null);

        if (firestoreTrial) {
          const trialPartialState = computeTrialState(firestoreTrial.expires_at, serverTime);
          setLicenseState({ ...initialState, hardwareId: hwId, ...trialPartialState });
          setIsLoading(false);
          return;
        }
      }

      // Sem trial local — verifica no Firestore (primeiro boot ou novo device)
      if (isOnline) {
        const firestoreTrial = await checkTrialStatus(hwId).catch(() => null);

        if (firestoreTrial) {
          // Trial já existe no Firestore (outro boot anterior online)
          saveTrialLocally(firestoreTrial);
          const trialPartialState = computeTrialState(firestoreTrial.expires_at, serverTime);
          setLicenseState({ ...initialState, hardwareId: hwId, ...trialPartialState });
          setIsLoading(false);
          return;
        }

        // Primeiro boot verdadeiro — cria trial
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

      // Offline e sem dados locais de trial ou licença
      // Verifica se há dados no localStorage (pode estar em modo degraded)
      if (localTrial.hasLocalTrial) {
        const trialPartialState = computeTrialState(localTrial.expiresAt!, serverTime);
        setLicenseState({ ...initialState, hardwareId: hwId, ...trialPartialState });
      } else {
        // Primeiro boot totalmente offline — trial_expired para não deixar passar
        setLicenseState({
          ...initialState,
          phase:        'trial_expired',
          hardwareId:   hwId,
          planType:     'free_trial',
          errorMessage: 'Conexão necessária para iniciar o período de teste.',
        });
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
  }, [getHardwareId, getSqliteDb]);

  // Executa o boot sequence na montagem do componente
  useEffect(() => {
    runBootSequence();
  }, [runBootSequence]);

  /**
   * Ativa uma chave de licença inserida pelo utilizador.
   */
  const activateLicenseKey = useCallback(
    async (licenseKey: string): Promise<ActivationResult> => {
      const hwId = hardwareIdRef.current || (await getHardwareId());

      // Guarda o estado anterior para poder restaurar em caso de falha
      const previousState = licenseState;

      setLicenseState((prev) => ({ ...prev, phase: 'activating', errorMessage: null }));

      const result = await activateLicense(licenseKey, hwId);

      if (!result.success || !result.license) {
        // Restaura o estado anterior em vez de forçar trial_expired
        setLicenseState({
          ...previousState,
          errorMessage: result.message || 'Falha na ativação.',
        });
        return result;
      }

      // Persiste no SQLite local
      const db = await getSqliteDb();
      if (db) {
        await saveLicenseLocally(db, result.license, hwId);
      }

      // Limpa dados do trial no localStorage
      localStorage.removeItem('vukapay_trial_started');
      localStorage.removeItem('vukapay_trial_expires');
      localStorage.removeItem('vukapay_trial_hw_id');

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
    [getHardwareId, getSqliteDb, licenseState]
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
