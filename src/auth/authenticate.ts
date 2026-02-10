import {
  AuthenticationValidationRequest,
  AuthenticationValidationResponse,
} from '../types';
import { IHttpClient } from '../http';
import { tracer } from '../telemetry';

/**
 * Valida um token de autenticação com o backend IdmAuth
 *
 * Esta função verifica se um token é válido realizando validações contextuais
 * no backend, além da validação técnica do token (assinatura, expiração).
 *
 * @param httpClient - Implementação do cliente HTTP
 * @param idmAuthServiceUrl - URL base do serviço IdmAuth (ex: 'https://idm-auth.example.com')
 * @param request - Dados da requisição de validação
 * @returns Promise com o resultado da validação
 *
 * @example
 * ```typescript
 * const result = await validateAuthentication(
 *   httpClient,
 *   'https://idm-auth.example.com',
 *   {
 *     system: 'my-app',
 *     token: 'jwt.token.here',
 *     applicationRealmPublicUUID: 'realm-uuid-123',
 *   }
 * );
 *
 * if (result.valid) {
 *   console.log('User authenticated:', result.accountId);
 * } else {
 *   console.error('Authentication failed:', result.error);
 * }
 * ```
 */
export async function validateAuthentication(
  httpClient: IHttpClient,
  idmAuthServiceUrl: string,
  request: AuthenticationValidationRequest
): Promise<AuthenticationValidationResponse> {
  return tracer.startActiveSpan(
    'idm-auth-client.validateAuthentication',
    async (span) => {
      span.setAttributes({
        'idm-auth-client.operation': 'validateAuthentication',
        'idm-auth-client.system': request.system,
        'idm-auth-client.realm_id': request.applicationRealmPublicUUID,
      });

      try {
        const result = await httpClient.post<AuthenticationValidationResponse>(
          `${idmAuthServiceUrl}/realm/${request.applicationRealmPublicUUID}/auth/validate`,
          {
            token: request.token,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-IDM-System': request.system,
            },
          }
        );
        span.setAttributes({
          'idm-auth-client.auth.valid': result.valid,
        });
        return result;
      } catch (error) {
        span.recordException(error as Error);
        return { valid: false, error: (error as Error).message };
      } finally {
        span.end();
      }
    }
  );
}
