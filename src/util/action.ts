import { IdmAuthAction } from '../types/common';

/**
 * Valida se uma string está no formato Action correto
 *
 * Verifica:
 * - 3 partes separadas por ':'
 * - Campos obrigatórios não vazios: system, resource, operation
 *
 * @param action - String a ser validada
 * @returns true se válido, false caso contrário
 *
 * @example
 * ```typescript
 * isValidAction('idm-auth-core-api:accounts:create'); // true
 * isValidAction('*:*:*'); // true (wildcards)
 * isValidAction('invalid'); // false
 * ```
 */
export function isValidAction(action: string): boolean {
  const parts = action.split(':');
  return (
    parts.length === 3 && parts[0] !== '' && parts[1] !== '' && parts[2] !== ''
  );
}

/**
 * Converte uma string Action em objeto IdmAuthAction
 *
 * Faz o parse da string no formato 'system:resource:operation'
 * e retorna um objeto tipado.
 *
 * @param action - String no formato Action
 * @returns Objeto IdmAuthAction parseado
 * @throws Error se o formato for inválido
 *
 * @example
 * ```typescript
 * const action = parseAction('idm-auth-core-api:accounts:create');
 * // Resultado:
 * // {
 * //   system: 'idm-auth-core-api',
 * //   resource: 'accounts',
 * //   operation: 'create'
 * // }
 * ```
 */
export function parseAction(action: string): IdmAuthAction {
  if (!isValidAction(action)) {
    throw new Error(
      'Invalid Action format. Expected: system:resource:operation'
    );
  }

  const parts = action.split(':');
  return {
    system: parts[0],
    resource: parts[1],
    operation: parts[2],
  };
}

/**
 * Converte um objeto IdmAuthAction em string
 *
 * Serializa o objeto no formato 'system:resource:operation'.
 *
 * @param action - Objeto IdmAuthAction
 * @returns String no formato Action
 *
 * @example
 * ```typescript
 * const actionString = stringifyAction({
 *   system: 'idm-auth-core-api',
 *   resource: 'accounts',
 *   operation: 'create'
 * });
 * // Resultado: 'idm-auth-core-api:accounts:create'
 * ```
 */
export function stringifyAction(action: IdmAuthAction): string {
  return `${action.system}:${action.resource}:${action.operation}`;
}
