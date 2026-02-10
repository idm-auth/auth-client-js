import {
  AuthorizationRequest,
  AuthorizationResponse,
  IdmAuthGrn,
  IdmAuthAction,
} from '../types';
import { IHttpClient } from '../http';
import { tracer } from '../telemetry';
import { parseGrn, stringifyGrn, parseAction, stringifyAction } from '../util';

/**
 * Payload interno enviado ao backend para avaliação de autorização
 */
interface AuthorizationRequestPayload {
  /** Token de autenticação do usuário */
  userToken: string;
  /** Ação a ser verificada em formato string */
  action: string;
  /** GRN do recurso em formato string */
  grn: string;
}

/**
 * Verifica se uma ação é autorizada para um recurso específico
 *
 * Esta função avalia se o usuário/aplicação tem permissão para executar
 * uma ação específica em um recurso identificado por GRN, baseado nas policies
 * configuradas no realm.
 *
 * O GRN e a Action podem ser fornecidos como string ou objeto. Se fornecidos como
 * string, serão parseados automaticamente.
 *
 * @param httpClient - Implementação do cliente HTTP
 * @param idmAuthServiceUrl - URL base do serviço IdmAuth (ex: 'https://idm-auth.example.com')
 * @param request - Dados da requisição de autorização
 * @returns Promise com o resultado da autorização
 *
 * @example
 * ```typescript
 * // Com GRN e Action como string
 * const result = await authorize(
 *   httpClient,
 *   'https://idm-auth.example.com',
 *   {
 *     applicationRealmPublicUUID: 'realm-uuid-123',
 *     idmAuthUserToken: 'jwt.token.here',
 *     action: 'idm-auth-core-api:accounts:create',
 *     grn: 'grn:global:idm-auth-core-api::tenant-123:accounts/acc-456',
 *   }
 * );
 *
 * // Com GRN e Action como objeto
 * const result = await authorize(
 *   httpClient,
 *   'https://idm-auth.example.com',
 *   {
 *     applicationRealmPublicUUID: 'realm-uuid-123',
 *     idmAuthUserToken: 'jwt.token.here',
 *     action: {
 *       system: 'idm-auth-core-api',
 *       resource: 'accounts',
 *       operation: 'create'
 *     },
 *     grn: {
 *       system: 'idm-auth-core-api',
 *       tenantId: 'tenant-123',
 *       resource: 'accounts/acc-456',
 *     },
 *   }
 * );
 *
 * if (result.allowed) {
 *   console.log('Access granted');
 * } else {
 *   console.error('Access denied:', result.error);
 * }
 * ```
 */
export async function authorize(
  httpClient: IHttpClient,
  idmAuthServiceUrl: string,
  request: AuthorizationRequest
): Promise<AuthorizationResponse> {
  const grn: IdmAuthGrn =
    typeof request.grn === 'string' ? parseGrn(request.grn) : request.grn;
  const action: IdmAuthAction =
    typeof request.action === 'string'
      ? parseAction(request.action)
      : request.action;

  return tracer.startActiveSpan('idm-auth-client.authorize', async (span) => {
    const attributes: Record<string, string> = {
      'idm-auth-client.operation': 'authorize',
      'idm-auth-client.action.system': action.system,
      'idm-auth-client.action.resource': action.resource,
      'idm-auth-client.action.operation': action.operation,
      'idm-auth-client.grn.system': grn.system,
      'idm-auth-client.grn.resource': grn.resource,
    };

    if (grn.tenantId) {
      attributes['idm-auth-client.grn.tenant_id'] = grn.tenantId;
    }

    span.setAttributes(attributes);

    try {
      const payload: AuthorizationRequestPayload = {
        userToken: request.idmAuthUserToken,
        action: stringifyAction(action),
        grn: stringifyGrn(grn),
      };

      const result = await httpClient.post<AuthorizationResponse>(
        `${idmAuthServiceUrl}/realm/${request.applicationRealmPublicUUID}/authz/evaluate`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      span.setAttributes({
        'idm-auth-client.authz.allowed': result.allowed,
      });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}
