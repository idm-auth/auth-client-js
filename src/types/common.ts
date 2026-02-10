export interface BaseResponse {
  payload?: {
    [key: string]: unknown;
  };
  error?: string;
}

/**
 * Global Resource Name (GRN) - Identificador único de recursos no sistema IDM
 *
 * Formato: grn:partition:system:region:tenantId:resource
 *
 * Estrutura (6 partes separadas por ':'):
 *
 * 1. grn         - Prefixo fixo (Global Resource Name)
 * 2. partition   - Partição/Esfera (ex: 'global', 'aws', 'azure') [OPCIONAL]
 * 3. system      - Sistema/Aplicação que gerencia o recurso (ex: 'iam', 'idm-auth-core-api') [OBRIGATÓRIO]
 * 4. region      - Região geográfica (ex: 'us-east-1', 'sa-east-1') [OPCIONAL]
 * 5. tenantId    - ID do tenant PROPRIETÁRIO do recurso (não da aplicação que acessa) [OPCIONAL]
 * 6. resource    - Caminho do recurso (ex: 'accounts/123', 'applications/*') [OBRIGATÓRIO]
 *
 * Exemplos:
 * - grn:global:iam::tenant-123:accounts/acc-456
 *   └─ Conta 'acc-456' no sistema IAM, pertencente ao tenant 'tenant-123'
 *
 * - grn:global:idm-auth-core-api:::applications/app-789
 *   └─ Aplicação 'app-789' sem tenant específico (recurso global)
 *
 * - grn::storage:us-east-1:tenant-abc:files/document.pdf
 *   └─ Arquivo no sistema Storage, região US East, tenant 'tenant-abc'
 *
 * IMPORTANTE: tenantId identifica o DONO do recurso, não quem está acessando.
 * Uma aplicação no tenant-A pode acessar recursos do tenant-B se autorizada.
 */

/**
 * Interface que representa um GRN parseado
 */
export interface IdmAuthGrn {
  /** Caminho do recurso (ex: 'accounts/123', 'applications/*') */
  resource: string;
  /** Sistema que gerencia o recurso (ex: 'iam', 'idm-auth-core-api') */
  system: string;
  /** ID do tenant proprietário do recurso (não da aplicação que acessa) */
  tenantId?: string;
  /** Partição/Esfera (ex: 'global', 'aws', 'azure') */
  partition?: string;
  /** Região geográfica (ex: 'us-east-1', 'sa-east-1') */
  region?: string;
}

/**
 * Interface que representa uma Action parseada
 *
 * Formato: system:resource:operation
 *
 * Exemplos:
 * - idm-auth-core-api:accounts:create
 * - app-crm:customers:read
 * - *:*:* (super admin)
 */
export interface IdmAuthAction {
  /** Sistema/Aplicação (ex: 'idm-auth-core-api', 'app-crm') */
  system: string;
  /** Recurso (ex: 'accounts', 'customers') */
  resource: string;
  /** Operação (ex: 'create', 'read', 'update', 'delete') */
  operation: string;
}
