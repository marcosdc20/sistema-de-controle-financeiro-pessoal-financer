/**
 * licenseService.ts
 *
 * Serviço central de licenciamento do VukaPay.
 * Responsável por toda a comunicação com o Google Firestore para:
 *  - Verificar e criar registos de trial
 *  - Validar e ativar chaves de licença
 *  - Fazer ping periódico de status
 *  - Persistir a assinatura localmente no SQLite
 */

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type Database from '@tauri-apps/plugin-sql';
import type {
  FirestoreLicense,
  FirestoreTrial,
  LocalLicenseRecord,
  ActivationResult,
  ActivationErrorCode,
  LicenseStatus,
  PlanType,
} from '@/types/license';


// ─── Constantes ─────────────────────────────────────────────────────────────

const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias em milissegundos
const OFFLINE_GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias offline permitidos
const LOCAL_LICENSE_TABLE = 'license_records';
const HMAC_SECRET = import.meta.env.VITE_LICENSE_HMAC_SECRET as string;

// ─── Funções auxiliares ──────────────────────────────────────────────────────

/**
 * Adiciona um limite de tempo (timeout) a uma Promise.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMsg));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Gera um HMAC-SHA256 usando Web Crypto API nativa.
 * Usado para assinar os dados da licença local (anti-tamper).
 */
async function generateHmac(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(HMAC_SECRET || 'vukapay-fallback-secret-key-32ch');
  const messageData = encoder.encode(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Computa a string canônica de um LocalLicenseRecord para assinar.
 */
function buildSignaturePayload(record: Omit<LocalLicenseRecord, 'signature'>): string {
  return [
    record.license_key,
    record.client_email,
    record.plan_type,
    record.hardware_id,
    record.activated_at,
    record.expires_at ?? 'lifetime',
    record.last_verified_at,
  ].join('|');
}

// ─── Tempo do servidor (anti-manipulação de relógio) ────────────────────────

/**
 * Obtém o timestamp atual do servidor do Google.
 * Usa o endpoint de metadados do Firebase Firestore para garantir
 * que o horário não pode ser manipulado pelo utilizador alterando o relógio do Windows.
 *
 * Fallback: se offline, retorna Date.now() (aceite apenas dentro do período de graça).
 */
export async function getServerTimestamp(): Promise<{ timestamp: number; isOnline: boolean }> {
  try {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as string;
    // Usa a API REST do Firestore para obter um timestamp server-side
    // Este endpoint é público e retorna a data/hora do servidor Google
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/ping/timestamp`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(8000), // 8 segundos de timeout
      }
    );

    if (!response.ok && response.status !== 404) {
      // Qualquer resposta do servidor (mesmo 404) confirma que estamos online
      // e podemos usar Date.now() como fallback (o servidor respondeu)
      return { timestamp: Date.now(), isOnline: true };
    }

    // Usa o header Date da resposta como timestamp do servidor
    const dateHeader = response.headers.get('Date');
    if (dateHeader) {
      return { timestamp: new Date(dateHeader).getTime(), isOnline: true };
    }

    return { timestamp: Date.now(), isOnline: true };
  } catch {
    // Sem conexão
    return { timestamp: Date.now(), isOnline: false };
  }
}

// ─── Gestão do Trial ────────────────────────────────────────────────────────

/**
 * Verifica no Firestore se o Hardware ID já usou o período de trial.
 * Retorna null se o trial não existe (pode criar novo).
 */
export async function checkTrialStatus(hardwareId: string): Promise<FirestoreTrial | null> {
  try {
    const trialRef = doc(db, 'trials', hardwareId);
    const trialSnap = await withTimeout(
      getDoc(trialRef),
      8000,
      'TIMEOUT: Erro ao verificar trial no servidor.'
    );

    if (!trialSnap.exists()) {
      return null;
    }

    return trialSnap.data() as FirestoreTrial;
  } catch (error) {
    console.error('[LicenseService] Erro ao verificar trial:', error);
    throw error;
  }
}

/**
 * Cria um novo registo de trial no Firestore para este Hardware ID.
 * Só deve ser chamado se `checkTrialStatus` retornou null.
 */
export async function createTrialRecord(hardwareId: string, serverTime: number): Promise<FirestoreTrial> {
  const trialData: FirestoreTrial = {
    hardware_id: hardwareId,
    started_at: serverTime,
    expires_at: serverTime + TRIAL_DURATION_MS,
  };

  const trialRef = doc(db, 'trials', hardwareId);
  await withTimeout(
    setDoc(trialRef, trialData),
    8000,
    'TIMEOUT: Erro ao registrar trial no servidor.'
  );

  return trialData;
}

/**
 * Verifica localmente (sem internet) se o trial ainda é válido
 * com base nos dados do localStorage.
 */
export function checkLocalTrialValidity(): {
  hasLocalTrial: boolean;
  isExpired: boolean;
  expiresAt: number | null;
  startedAt: number | null;
} {
  const startedAt = localStorage.getItem('vukapay_trial_started');
  const expiresAt = localStorage.getItem('vukapay_trial_expires');

  if (!startedAt || !expiresAt) {
    return { hasLocalTrial: false, isExpired: false, expiresAt: null, startedAt: null };
  }

  const expiresAtMs = parseInt(expiresAt, 10);
  const startedAtMs = parseInt(startedAt, 10);
  const now = Date.now();

  return {
    hasLocalTrial: true,
    isExpired: now >= expiresAtMs,
    expiresAt: expiresAtMs,
    startedAt: startedAtMs,
  };
}

/**
 * Grava os dados do trial no localStorage para uso offline.
 */
export function saveTrialLocally(trial: FirestoreTrial): void {
  localStorage.setItem('vukapay_trial_started', String(trial.started_at));
  localStorage.setItem('vukapay_trial_expires', String(trial.expires_at));
  localStorage.setItem('vukapay_trial_hw_id', trial.hardware_id);
}

// ─── Validação e Ativação de Licença ────────────────────────────────────────

/**
 * Busca e valida uma chave de licença no Firestore.
 * Não faz nenhuma escrita — apenas leitura.
 */
export async function validateLicense(licenseKey: string): Promise<FirestoreLicense | null> {
  try {
    const licenseRef = doc(db, 'licenses', licenseKey.toUpperCase());
    const licenseSnap = await withTimeout(
      getDoc(licenseRef),
      8000,
      'TIMEOUT: Não foi possível obter resposta do servidor de licenças.'
    );

    if (!licenseSnap.exists()) {
      return null;
    }

    return { id: licenseSnap.id, ...licenseSnap.data() } as FirestoreLicense;
  } catch (error) {
    console.error('[LicenseService] Erro ao validar licença:', error);
    throw error;
  }
}

/**
 * Ativa uma licença vinculando o Hardware ID desta máquina ao documento
 * da coleção `licenses` no Firestore.
 *
 * Regras de negócio:
 *  1. A chave deve existir
 *  2. O status deve ser 'active'
 *  3. O campo hardware_id deve estar em branco (não ativado ainda)
 *  4. Se o hardware_id já estiver preenchido com o ID DESTA máquina, é re-ativação válida
 */
export async function activateLicense(
  licenseKey: string,
  hardwareId: string
): Promise<ActivationResult> {
  const normalizedKey = licenseKey.trim().toUpperCase();

  try {
    // 1. Busca a licença
    const license = await validateLicense(normalizedKey);

    if (!license) {
      return { success: false, errorCode: 'NOT_FOUND', message: 'Chave de licença não encontrada.' };
    }

    // 2. Verifica status
    if (license.status === 'revoked') {
      return { success: false, errorCode: 'REVOKED', message: 'Esta licença foi revogada.' };
    }

    if (license.status === 'expired') {
      return { success: false, errorCode: 'EXPIRED', message: 'Esta licença está expirada.' };
    }

    // 3. Verifica hardware_id
    if (license.hardware_id && license.hardware_id !== hardwareId) {
      return {
        success: false,
        errorCode: 'ALREADY_ACTIVATED',
        message: 'Esta chave já está ativada noutro computador. Contacte o suporte para transferência.',
      };
    }

    // 4. Grava o hardware_id no Firestore (as Firestore Security Rules também validam isto)
    if (!license.hardware_id) {
      const licenseRef = doc(db, 'licenses', normalizedKey);
      await withTimeout(
        updateDoc(licenseRef, {
          hardware_id: hardwareId,
        }),
        8000,
        'TIMEOUT: O servidor não respondeu a tempo para vincular o Hardware ID.'
      );
    }

    // Retorna a licença atualizada
    const updatedLicense: FirestoreLicense = { ...license, hardware_id: hardwareId };
    return { success: true, license: updatedLicense };
  } catch (error: unknown) {
    const errorStr = error instanceof Error ? error.message : '';
    const isTimeout = errorStr.includes('TIMEOUT');
    const isNetwork = errorStr.toLowerCase().includes('network') || errorStr.toLowerCase().includes('failed to fetch');

    const errorCode: ActivationErrorCode = isNetwork ? 'NETWORK_ERROR' : 'UNKNOWN';
    const message = isTimeout
      ? 'A ativação expirou (Timeout). Verifique a sua conexão com a internet e tente novamente.'
      : 'Erro ao ativar a licença. Verifique a sua ligação à internet.';

    return {
      success: false,
      errorCode,
      message,
    };
  }
}

/**
 * Ping silencioso ao Firestore para verificar o status atual da licença.
 * Chamado em background cada vez que o app abre com conexão disponível.
 *
 * Retorna null se offline, o status atual se online.
 */
export async function pingLicenseStatus(licenseKey: string): Promise<{
  status: 'active' | 'expired' | 'revoked' | null;
  isOnline: boolean;
}> {
  try {
    const { isOnline } = await getServerTimestamp();

    if (!isOnline) {
      return { status: null, isOnline: false };
    }

    const license = await validateLicense(licenseKey);

    if (!license) {
      return { status: 'revoked', isOnline: true }; // Chave foi apagada pelo admin
    }

    return { status: license.status, isOnline: true };
  } catch {
    return { status: null, isOnline: false };
  }
}

// ─── Persistência Local (SQLite) ─────────────────────────────────────────────

/**
 * Grava a assinatura criptografada da licença no SQLite local.
 * Cria a tabela se não existir.
 */
export async function saveLicenseLocally(
  db: Database,
  license: FirestoreLicense,
  hardwareId: string
): Promise<void> {
  // Garante que a tabela existe
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${LOCAL_LICENSE_TABLE} (
      id              INTEGER PRIMARY KEY,
      license_key     TEXT NOT NULL,
      client_email    TEXT NOT NULL,
      plan_type       TEXT NOT NULL,
      hardware_id     TEXT NOT NULL,
      activated_at    INTEGER NOT NULL,
      expires_at      INTEGER,
      last_verified_at INTEGER NOT NULL,
      signature       TEXT NOT NULL
    )
  `);

  const now = Date.now();

  const recordWithoutSig: Omit<LocalLicenseRecord, 'signature'> = {
    license_key:      license.id,
    client_email:     license.client_email,
    plan_type:        license.plan_type,
    hardware_id:      hardwareId,
    activated_at:     now,
    expires_at:       license.expires_at,
    last_verified_at: now,
  };

  const signature = await generateHmac(buildSignaturePayload(recordWithoutSig));

  // Remove registos anteriores e insere o novo
  await db.execute(`DELETE FROM ${LOCAL_LICENSE_TABLE}`);
  await db.execute(
    `INSERT INTO ${LOCAL_LICENSE_TABLE}
     (license_key, client_email, plan_type, hardware_id, activated_at, expires_at, last_verified_at, signature)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      recordWithoutSig.license_key,
      recordWithoutSig.client_email,
      recordWithoutSig.plan_type,
      recordWithoutSig.hardware_id,
      recordWithoutSig.activated_at,
      recordWithoutSig.expires_at,
      recordWithoutSig.last_verified_at,
      signature,
    ]
  );
}

/**
 * Atualiza apenas o campo `last_verified_at` e re-assina o registo local.
 * Chamado após cada ping bem-sucedido.
 */
export async function updateLocalVerificationTimestamp(
  db: Database,
  newTimestamp: number
): Promise<void> {
  const records = await db.select<LocalLicenseRecord[]>(
    `SELECT * FROM ${LOCAL_LICENSE_TABLE} LIMIT 1`
  );

  if (records.length === 0) return;

  const record = records[0];
  const updated: Omit<LocalLicenseRecord, 'signature'> = {
    ...record,
    last_verified_at: newTimestamp,
  };

  const newSignature = await generateHmac(buildSignaturePayload(updated));

  await db.execute(
    `UPDATE ${LOCAL_LICENSE_TABLE} SET last_verified_at = $1, signature = $2 WHERE license_key = $3`,
    [newTimestamp, newSignature, record.license_key]
  );

}

/**
 * Lê a licença local do SQLite e verifica a integridade da assinatura.
 *
 * Retorna null se:
 *  - Não existe registo (app nunca ativado)
 *  - A assinatura foi adulterada (anti-tamper)
 *  - O hardware_id não corresponde a esta máquina
 */
export async function readLocalLicense(
  db: Database,
  currentHardwareId: string
): Promise<LocalLicenseRecord | null> {
  try {
    // Garante que a tabela existe antes de fazer SELECT
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ${LOCAL_LICENSE_TABLE} (
        id              INTEGER PRIMARY KEY,
        license_key     TEXT NOT NULL,
        client_email    TEXT NOT NULL,
        plan_type       TEXT NOT NULL,
        hardware_id     TEXT NOT NULL,
        activated_at    INTEGER NOT NULL,
        expires_at      INTEGER,
        last_verified_at INTEGER NOT NULL,
        signature       TEXT NOT NULL
      )
    `);

    const records = await db.select<LocalLicenseRecord[]>(
      `SELECT * FROM ${LOCAL_LICENSE_TABLE} LIMIT 1`
    );

    if (records.length === 0) return null;

    const record = records[0];

    // Verifica que o hardware_id corresponde a esta máquina
    if (record.hardware_id !== currentHardwareId) {
      console.warn('[LicenseService] Hardware ID não corresponde ao registo local.');
      return null;
    }

    // Verifica a integridade da assinatura HMAC
    const payload = buildSignaturePayload(record);
    const expectedSignature = await generateHmac(payload);

    if (record.signature !== expectedSignature) {
      console.warn('[LicenseService] Assinatura da licença local adulterada!');
      return null;
    }

    return record;
  } catch (error) {
    console.error('[LicenseService] Erro ao ler licença local:', error);
    return null;
  }
}

/**
 * Remove a licença local do SQLite (para re-ativação ou reset).
 */
export async function clearLocalLicense(
  db: Database
): Promise<void> {
  await db.execute(`DELETE FROM ${LOCAL_LICENSE_TABLE}`);
}

/**
 * Obtém todas as licenças do Firestore (Painel Admin).
 */
export async function getAllLicenses(): Promise<FirestoreLicense[]> {
  try {
    const licensesCol = collection(db, 'licenses');
    const snapshot = await getDocs(licensesCol);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirestoreLicense));
  } catch (error) {
    console.error('[LicenseService] Erro ao buscar todas as licenças:', error);
    throw error;
  }
}

/**
 * Obtém todos os registros de trial do Firestore (Painel Admin).
 */
export async function getAllTrials(): Promise<FirestoreTrial[]> {
  try {
    const trialsCol = collection(db, 'trials');
    const snapshot = await getDocs(trialsCol);
    return snapshot.docs.map(doc => ({ hardware_id: doc.id, ...doc.data() } as unknown as FirestoreTrial));
  } catch (error) {
    console.error('[LicenseService] Erro ao buscar todos os trials:', error);
    throw error;
  }
}

/**
 * Cria/gera uma nova licença no Firestore (Painel Admin).
 */
export async function createLicenseRecord(
  clientEmail: string,
  planType: PlanType,
  expiresAt: number | null
): Promise<FirestoreLicense> {
  try {
    const licenseKey = generateLicenseKey();
    const newLicense = {
      client_email: clientEmail,
      plan_type: planType,
      status: 'active' as LicenseStatus,
      hardware_id: null,
      created_at: Date.now(),
      expires_at: expiresAt,
    };

    const licenseRef = doc(db, 'licenses', licenseKey);
    await setDoc(licenseRef, newLicense);

    return { id: licenseKey, ...newLicense };
  } catch (error) {
    console.error('[LicenseService] Erro ao criar licença:', error);
    throw error;
  }
}

/**
 * Atualiza o status de uma licença no Firestore (Painel Admin).
 */
export async function updateLicenseStatusInFirestore(
  licenseKey: string,
  status: LicenseStatus
): Promise<void> {
  try {
    const licenseRef = doc(db, 'licenses', licenseKey.toUpperCase());
    await updateDoc(licenseRef, { status });
  } catch (error) {
    console.error('[LicenseService] Erro ao atualizar status da licença:', error);
    throw error;
  }
}

/**
 * Reseta o hardware_id de uma licença no Firestore (Painel Admin).
 */
export async function resetLicenseHardwareInFirestore(
  licenseKey: string
): Promise<void> {
  try {
    const licenseRef = doc(db, 'licenses', licenseKey.toUpperCase());
    await updateDoc(licenseRef, { hardware_id: null });
  } catch (error) {
    console.error('[LicenseService] Erro ao resetar hardware da licença:', error);
    throw error;
  }
}

/**
 * Apaga permanentemente uma licença no Firestore (Painel Admin).
 */
export async function deleteLicenseInFirestore(
  licenseKey: string
): Promise<void> {
  try {
    const licenseRef = doc(db, 'licenses', licenseKey.toUpperCase());
    await deleteDoc(licenseRef);
  } catch (error) {
    console.error('[LicenseService] Erro ao deletar licença:', error);
    throw error;
  }
}

/**
 * Apaga permanentemente um registro de trial no Firestore (Painel Admin).
 */
export async function deleteTrialInFirestore(
  hardwareId: string
): Promise<void> {
  try {
    const trialRef = doc(db, 'trials', hardwareId);
    await deleteDoc(trialRef);
  } catch (error) {
    console.error('[LicenseService] Erro ao deletar trial:', error);
    throw error;
  }
}

/**
 * Auxiliar: gera uma chave de licença no formato VUKA-XXXX-XXXX-XXXX-XXXX
 */
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `VUKA-${segment()}-${segment()}-${segment()}-${segment()}`;
}

export { TRIAL_DURATION_MS, OFFLINE_GRACE_PERIOD_MS };

