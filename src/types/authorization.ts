import { BaseResponse, IdmAuthGrn, IdmAuthAction } from './common';

/**
 * Requisição de autorização para verificar se uma ação é permitida
 *
 * Esta requisição verifica se um usuário/aplicação tem permissão para executar
 * uma ação específica em um recurso identificado por GRN.
 *
 * ARQUITETURA:
 * - applicationRealmPublicUUID: Identifica o REALM no IdmAuth (contexto de policies)
 * - grn.tenantId: Identifica o TENANT dono do recurso (contexto do dado)
 *
 * Estes são conceitos separados e podem ser diferentes:
 * - Uma aplicação no Realm-A pode acessar recursos do Tenant-B (se autorizada)
 * - As policies estão no Realm-A, mas o recurso está no Tenant-B
 */
export interface AuthorizationRequest {
  /**
   * Public UUID do Realm no IdmAuth onde estão as policies e aplicações
   *
   * Este campo identifica qual realm do IdmAuth contém:
   * - As aplicações registradas (App1, App2, App3, etc)
   * - As políticas de autorização (policies)
   * - As permissões e roles
   *
   * IMPORTANTE:
   * - Este é o PUBLIC UUID do realm (não o ID interno)
   * - Identifica o REALM no IdmAuth (contexto de autorização)
   * - Não é o tenant do RECURSO (que está no GRN)
   *
   * Exemplo:
   * - applicationRealmPublicUUID: 'uuid-realm-A' (onde estão as policies)
   * - grn.tenantId: 'tenant-B' (onde está o recurso sendo acessado)
   *
   * Neste caso, uma aplicação do Realm-A está acessando um recurso do Tenant-B.
   */
  applicationRealmPublicUUID: string;

  /**
   * Token de autenticação do usuário/aplicação
   *
   * Pode ser JWT, API Key, OAuth token, ou qualquer token aceito pelo IdmAuth.
   * Este token identifica QUEM está fazendo a requisição.
   */
  idmAuthUserToken: string;

  /**
   * Ação a ser verificada
   *
   * Identifica COMO o recurso está sendo acessado. Pode ser fornecido como:
   * - String: 'idm-auth-core-api:accounts:create'
   * - Objeto: { system: 'idm-auth-core-api', resource: 'accounts', operation: 'create' }
   *
   * Formato: system:resource:operation
   * - system: Sistema/aplicação (ex: 'idm-auth-core-api', 'app-crm')
   * - resource: Recurso (ex: 'accounts', 'customers')
   * - operation: Operação (ex: 'create', 'read', 'update', 'delete')
   *
   * Suporta wildcards: '*:*:*' (todas as ações)
   */
  action: string | IdmAuthAction;

  /**
   * Global Resource Name (GRN) do recurso sendo acessado
   *
   * Identifica O QUE está sendo acessado. Pode ser fornecido como:
   * - String: 'grn:global:iam::tenant-123:accounts/acc-456'
   * - Objeto: { system: 'iam', tenantId: 'tenant-123', resource: 'accounts/acc-456' }
   *
   * O tenantId no GRN identifica o DONO do recurso, não quem está acessando.
   */
  grn: string | IdmAuthGrn;
}

export interface AuthorizationResponse extends BaseResponse {
  allowed: boolean;
}
