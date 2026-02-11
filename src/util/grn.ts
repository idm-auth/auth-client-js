import { IdmAuthGrn } from '../types/common';

/**
 * Valida se uma string está no formato GRN correto
 *
 * Verifica:
 * - 6 partes separadas por ':'
 * - Prefixo 'grn'
 * - Campos obrigatórios não vazios: system, resource
 * - Campos opcionais podem estar vazios: partition, region, tenantId
 *
 * @param grn - String a ser validada
 * @returns true se válido, false caso contrário
 *
 * @example
 * ```typescript
 * isValidGrn('grn:global:iam::tenant-123:accounts/*'); // true
 * isValidGrn('grn::iam:::accounts/*'); // true (partition, region, tenantId vazios)
 * isValidGrn('invalid:format'); // false
 * ```
 */
export function isValidGrn(grn: string): boolean {
  const parts = grn.split(':');
  return (
    parts.length === 6 &&
    parts[0] === 'grn' &&
    parts[2] !== '' &&
    parts[5] !== ''
  );
}

/**
 * Converte uma string GRN em objeto IdmAuthGrn
 *
 * Faz o parse da string no formato 'grn:partition:system:region:tenantId:resource'
 * e retorna um objeto tipado. Campos vazios são convertidos para undefined.
 *
 * @param grn - String no formato GRN
 * @returns Objeto IdmAuthGrn parseado
 * @throws Error se o formato for inválido
 *
 * @example
 * ```typescript
 * const grn = parseGrn('grn:global:iam::tenant-123:accounts/acc-456');
 * // Resultado:
 * // {
 * //   partition: 'global',
 * //   system: 'iam',
 * //   region: undefined,
 * //   tenantId: 'tenant-123',
 * //   resource: 'accounts/acc-456'
 * // }
 * ```
 */
export function parseGrn(grn: string): IdmAuthGrn {
  if (!isValidGrn(grn)) {
    throw new Error(
      'Invalid GRN format. Expected: grn:partition:system:region:tenantId:resource'
    );
  }

  const parts = grn.split(':');
  return {
    partition: parts[1] || undefined,
    system: parts[2],
    region: parts[3] || undefined,
    tenantId: parts[4] || undefined,
    resource: parts[5],
  };
}

/**
 * Converte um objeto IdmAuthGrn em string
 *
 * Serializa o objeto no formato 'grn:partition:system:region:tenantId:resource'.
 * Campos undefined são convertidos para string vazia, mantendo a estrutura de 6 partes.
 *
 * @param grn - Objeto IdmAuthGrn
 * @returns String no formato GRN
 *
 * @example
 * ```typescript
 * const grnString = stringifyGrn({
 *   partition: 'global',
 *   system: 'iam',
 *   tenantId: 'tenant-123',
 *   resource: 'accounts/*'
 * });
 * // Resultado: 'grn:global:iam::tenant-123:accounts/*'
 * ```
 */
export function stringifyGrn(grn: IdmAuthGrn): string {
  return `grn:${grn.partition || ''}:${grn.system}:${grn.region || ''}:${grn.tenantId || ''}:${grn.resource}`;
}
