import { parseGrn, stringifyGrn, isValidGrn } from './grn';

describe('parseGrn', () => {
  it('should parse complete GRN', () => {
    const result = parseGrn(
      'grn:global:idm-auth-core-api:us-east-1:tenant-123:applications/app-1'
    );

    expect(result).toEqual({
      partition: 'global',
      system: 'idm-auth-core-api',
      region: 'us-east-1',
      tenantId: 'tenant-123',
      resource: 'applications/app-1',
    });
  });

  it('should parse GRN with empty region', () => {
    const result = parseGrn(
      'grn:global:idm-auth-core-api::tenant-123:applications/app-1'
    );

    expect(result).toEqual({
      partition: 'global',
      system: 'idm-auth-core-api',
      region: undefined,
      tenantId: 'tenant-123',
      resource: 'applications/app-1',
    });
  });

  it('should parse GRN with empty tenantId', () => {
    const result = parseGrn(
      'grn:global:idm-auth-core-api:::applications/app-1'
    );

    expect(result).toEqual({
      partition: 'global',
      system: 'idm-auth-core-api',
      region: undefined,
      tenantId: undefined,
      resource: 'applications/app-1',
    });
  });

  it('should throw error for invalid format', () => {
    expect(() => parseGrn('invalid:grn')).toThrow('Invalid GRN format');
  });

  it('should throw error for missing grn prefix', () => {
    expect(() => parseGrn('arn:global:system::tenant:resource')).toThrow(
      'Invalid GRN format'
    );
  });
});

describe('stringifyGrn', () => {
  it('should stringify complete GRN', () => {
    const result = stringifyGrn({
      partition: 'global',
      system: 'idm-auth-core-api',
      region: 'us-east-1',
      tenantId: 'tenant-123',
      resource: 'applications/app-1',
    });

    expect(result).toBe(
      'grn:global:idm-auth-core-api:us-east-1:tenant-123:applications/app-1'
    );
  });

  it('should stringify GRN with empty region', () => {
    const result = stringifyGrn({
      system: 'idm-auth-core-api',
      tenantId: 'tenant-123',
      resource: 'applications/app-1',
    });

    expect(result).toBe(
      'grn::idm-auth-core-api::tenant-123:applications/app-1'
    );
  });

  it('should stringify GRN with partition but no region', () => {
    const result = stringifyGrn({
      partition: 'global',
      system: 'iam',
      tenantId: 'tenant-123',
      resource: 'accounts/*',
    });

    expect(result).toBe('grn:global:iam::tenant-123:accounts/*');
  });

  it('should stringify GRN with no tenantId', () => {
    const result = stringifyGrn({
      partition: 'global',
      system: 'iam',
      resource: 'accounts/*',
    });

    expect(result).toBe('grn:global:iam:::accounts/*');
  });
});

describe('isValidGrn', () => {
  it('should return true for valid GRN', () => {
    expect(
      isValidGrn(
        'grn:global:idm-auth-core-api:us-east-1:tenant-123:applications/app-1'
      )
    ).toBe(true);
  });

  it('should return true for valid GRN with empty partition', () => {
    expect(
      isValidGrn('grn::idm-auth-core-api::tenant-123:applications/app-1')
    ).toBe(true);
  });

  it('should return true for valid GRN with empty tenantId', () => {
    expect(
      isValidGrn('grn:global:idm-auth-core-api:::applications/app-1')
    ).toBe(true);
  });

  it('should return false for invalid prefix', () => {
    expect(isValidGrn('arn:global:system::tenant:resource')).toBe(false);
  });

  it('should return false for wrong number of parts', () => {
    expect(isValidGrn('grn:global:system:tenant:resource')).toBe(false);
  });

  it('should return false for missing system', () => {
    expect(isValidGrn('grn:global:::tenant:resource')).toBe(false);
  });

  it('should return false for missing resource', () => {
    expect(isValidGrn('grn:global:system::tenant:')).toBe(false);
  });
});
