// ─── Tipos centrais do sistema de licenciamento VukaPay ─────────────────────

/**
 * Tipos de plano disponíveis.
 * 'free_trial' é gerido pela coleção `trials` no Firestore (não por licença).
 */
export type PlanType = 'monthly' | 'annual' | 'lifetime';

/**
 * Estado de uma licença no Firestore.
 */
export type LicenseStatus = 'active' | 'expired' | 'revoked';

/**
 * Documento da coleção `licenses` no Firestore.
 * O ID do documento é a própria chave de licença (ex: VUKA-XXXX-XXXX-XXXX-XXXX).
 */
export interface FirestoreLicense {
  id: string;                  // Chave de licença (igual ao ID do documento)
  client_email: string;        // E-mail do cliente vinculado
  plan_type: PlanType;         // Tipo de plano
  status: LicenseStatus;       // Estado atual da licença
  hardware_id: string | null;  // Hardware ID vinculado (null antes da ativação)
  created_at: number;          // Timestamp Unix (ms) de criação
  expires_at: number | null;   // Timestamp Unix (ms) de expiração (null = lifetime)
}

/**
 * Documento da coleção `trials` no Firestore.
 * O ID do documento é o hardware_id hasheado em SHA-256.
 */
export interface FirestoreTrial {
  hardware_id: string;  // Hardware ID hasheado
  started_at: number;   // Timestamp Unix (ms) de início do trial
  expires_at: number;   // Timestamp Unix (ms) de expiração (started_at + 7 dias)
}

/**
 * Dados da licença armazenados localmente no SQLite.
 * Serve como cache e assinatura criptográfica para funcionamento offline.
 */
export interface LocalLicenseRecord {
  license_key: string;     // Chave de licença
  client_email: string;    // E-mail do cliente
  plan_type: PlanType;     // Tipo de plano
  hardware_id: string;     // Hardware ID desta máquina
  activated_at: number;    // Timestamp de ativação local
  expires_at: number | null; // Timestamp de expiração (null = lifetime)
  last_verified_at: number;  // Último ping bem-sucedido ao Firestore
  signature: string;       // HMAC-SHA256 de todos os campos acima (anti-tamper)
}

/**
 * Fases possíveis do ciclo de vida da licença no cliente.
 */
export type LicensePhase =
  | 'loading'           // Verificação inicial em andamento
  | 'trial_active'      // Trial de 7 dias ativo
  | 'trial_expired'     // Trial expirado, aguardando chave de ativação
  | 'activating'        // Processo de ativação em andamento
  | 'active'            // Licença paga ativa e válida
  | 'expired'           // Licença paga expirada
  | 'revoked'           // Licença revogada remotamente pelo admin
  | 'offline_warning'   // Mais de 7 dias sem verificar online
  | 'error';            // Erro crítico inesperado

/**
 * Estado completo do sistema de licença no contexto React.
 */
export interface LicenseState {
  phase: LicensePhase;
  hardwareId: string | null;          // Hardware ID desta máquina
  licenseKey: string | null;          // Chave ativa (null se só trial)
  clientEmail: string | null;         // E-mail vinculado
  planType: PlanType | 'free_trial' | null;
  trialDaysRemaining: number | null;  // Dias restantes de trial
  trialExpiresAt: number | null;      // Timestamp de expiração do trial
  licenseExpiresAt: number | null;    // Timestamp de expiração da licença paga
  lastVerifiedAt: number | null;      // Último ping bem-sucedido
  offlineDaysCount: number | null;    // Dias sem verificar online
  errorMessage: string | null;        // Mensagem de erro para exibir ao utilizador
}

/**
 * Resultado de uma tentativa de ativação de licença.
 */
export interface ActivationResult {
  success: boolean;
  errorCode?: ActivationErrorCode;
  message?: string;
  license?: FirestoreLicense;
}

/**
 * Códigos de erro de ativação para tratamento preciso na UI.
 */
export type ActivationErrorCode =
  | 'NOT_FOUND'          // Chave não existe no Firestore
  | 'ALREADY_ACTIVATED'  // Chave já está vinculada a outro Hardware ID
  | 'REVOKED'            // Licença foi revogada
  | 'EXPIRED'            // Licença expirou
  | 'NETWORK_ERROR'      // Sem conectividade
  | 'WRITE_FAILED'       // Erro ao gravar hardware_id no Firestore
  | 'UNKNOWN';           // Erro genérico

/**
 * Parâmetros para criar uma nova licença no painel admin.
 */
export interface CreateLicenseParams {
  client_email: string;
  plan_type: PlanType;
  expires_at: number | null; // null = lifetime
}

/**
 * Filtros para listagem de licenças no painel admin.
 */
export interface LicenseFilters {
  search?: string;           // Busca por e-mail ou chave
  status?: LicenseStatus | 'all';
  plan_type?: PlanType | 'all';
}

/**
 * Estatísticas do painel admin.
 */
export interface LicenseStats {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  trials: number;
  monthly: number;
  annual: number;
  lifetime: number;
}
