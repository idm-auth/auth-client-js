# Authentication & Authorization Library - Remote Validation

## Concept

Extract authentication and authorization into a framework-agnostic JavaScript/TypeScript library that calls IDM via HTTP for all validation. The library is a thin HTTP client, while IDM centralizes all business logic.

## Core Principles

### 1. Remote Validation

- All authentication and authorization calls IDM via HTTP
- IDM is single source of truth
- Centralized validation logic
- Consistent behavior across all projects

### 2. Separation of Concerns

- **Library**: HTTP client to call IDM endpoints
- **Project**: Data extraction (headers, params, context)
- **IDM**: Validation logic (JWT, policies, business rules)

### 3. Extensibility

- IDM adds custom validations (account status, tenant validity)
- Projects only provide context data
- All validation logic centralized in IDM

## Authentication Validation

### Why Remote Validation?

Even if a JWT token is **technically valid** (correct signature, not expired), the IDM backend performs **contextual validation**:

**Technical Validation (JWT itself):**

- ✅ Signature is valid
- ✅ Token not expired
- ✅ Format is correct

**Contextual Validation (IDM backend):**

- ✅ Account still exists
- ✅ Account is active (not blocked/deleted)
- ✅ Session not revoked
- ✅ IP address matches (optional)
- ✅ User-Agent matches (optional)
- ✅ Permissions haven't changed

**Example Scenarios:**

```
Token is valid BUT:
- User was blocked 5 minutes ago → DENY
- Session was revoked → DENY
- IP changed from Brazil to Asia → DENY (suspicious)
- Browser changed from Firefox to Chrome → DENY (suspicious)
- Account was deleted → DENY
```

### Library Responsibility

```typescript
/**
 * Calls IDM to validate JWT token
 * @param idmUrl - IDM authentication endpoint URL
 * @param request - Authentication request data
 * @returns Authentication result or throws error
 */
function authenticate(
  idmUrl: string,
  request: AuthenticationRequest
): Promise<AuthenticationResponse>;

interface AuthenticationRequest {
  application: string; // Who is asking (e.g., 'my-app', 'admin-portal')
  token: string; // JWT token to validate
  tenantId: string; // Which tenant context
}

interface AuthenticationResponse {
  valid: boolean;
  payload?: {
    [key: string]: unknown;
  };
  error?: string;
}
```

### How It Works

1. Project provides: application identity, token, tenant context
2. Library makes HTTP call to IDM: `POST {idmUrl}/authenticate`
3. IDM validates JWT (signature, expiration, format)
4. IDM validates business rules (account exists, is active, not blocked)
5. IDM returns: `{ valid: true, payload: {...} }` or `{ valid: false, error: '...' }`
6. Library returns result to project

### Project Responsibility

- Define application identity
- Extract token from request (header, cookie, query string)
- Extract tenant context from request
- Configure IDM endpoint URL
- Handle authentication result (populate context or reject)

### Example Flow

```typescript
// Project code
const application = 'my-app'; // This project's identity
const token = extractTokenFromHeader(ctx.headers.authorization);
const tenantId = ctx.params.tenantId;

// Library call (makes HTTP request to IDM)
const result = await validateAuthentication(
  'https://idm-auth.example.com/api',
  {
    application,
    token,
    tenantId,
  }
);

if (!result.valid) {
  throw new UnauthorizedError(result.error);
}

// Success - populate context
ctx.state.authenticated = true;
ctx.state.tenantId = tenantId;
```

### IDM Self-Usage

When IDM uses its own library:

```typescript
// IDM project code
const application = 'idm-backend'; // IDM identifies itself
const token = extractTokenFromHeader(ctx.headers.authorization);
const tenantId = ctx.params.tenantId;

// Library calls IDM's own authentication endpoint
const result = await validateAuthentication('http://localhost:3000/api', {
  application,
  token,
  tenantId,
});

// IDM validates its own JWT and business rules
// - Verifies JWT signature with tenant secret
// - Checks account exists in database
// - Validates account is active
// - Validates account is not blocked
```

## Authorization

### Library Responsibility

```typescript
/**
 * Calls IDM to check if action is authorized
 * @param idmUrl - IDM authorization endpoint URL
 * @param request - Authorization request data
 * @returns Authorization result
 */
function authorize(
  idmUrl: string,
  request: AuthorizationRequest
): Promise<AuthorizationResponse>;

interface AuthorizationRequest {
  application: string; // Who is asking (e.g., 'my-app', 'admin-portal')
  accountId: string; // Who is the user
  tenantId: string; // Which tenant context
  partition?: string; // Partition (global, gov, mil) - optional, default: 'global'
  region?: string; // Region (americas, europe, asia) - optional
  action: string; // Action format: {system}:{resource}:{operation} (e.g., 'iam:accounts:read')
  resource: string; // GRN format: grn:partition:system:region:tenantId:resource-type/resource-id
}

interface AuthorizationResponse {
  allowed: boolean;
  payload?: {
    [key: string]: unknown;
  };
  error?: string;
}
```

### How It Works

1. Project provides: application identity, user, action (format: `system:resource:operation`), resource (GRN format)
2. Library makes HTTP call to IDM: `POST {idmUrl}/authorize`
3. IDM fetches policies from account (via account-roles, account-groups, group-roles)
4. IDM evaluates policies using rule: Deny > Allow > Deny (implicit)
5. IDM returns: `{ allowed: true/false, payload: {...}, error: '...' }`
6. Library returns result to project

### Project Responsibility

- Define application identity
- Extract user context (accountId, tenantId)
- Define action and resource being accessed
- Configure IDM endpoint URL
- Handle authorization result (allow/deny)

### Example Flow

```typescript
// Project code
const application = 'my-app'; // This project's identity
const accountId = ctx.state.user.accountId; // From authentication
const tenantId = ctx.state.tenantId; // From authentication

// Action format: {system}:{resource}:{operation}
const action = 'iam:accounts:update';

// Resource format: GRN (Global Resource Name)
const resource = `grn:global:iam::${tenantId}:accounts/${accountId}`;

// Library call (makes HTTP request to IDM)
const result = await authorize('https://idm-auth.example.com/api', {
  application,
  accountId,
  tenantId,
  action,
  resource,
});

if (!result.allowed) {
  throw new ForbiddenError(result.error || 'Access denied');
}
```

### IDM Self-Usage

When IDM uses its own library:

```typescript
// IDM project code
const application = 'idm-backend'; // IDM identifies itself
const accountId = ctx.state.user.accountId;
const tenantId = ctx.state.tenantId;
const targetAccountId = ctx.params.id;

// Action format: {system}:{resource}:{operation}
const action = 'iam:accounts:delete';

// Resource format: GRN
const resource = `grn:global:iam::${tenantId}:accounts/${targetAccountId}`;

// Library calls IDM's own authorization endpoint
const result = await authorize('http://localhost:3000/api', {
  application,
  accountId,
  tenantId,
  action,
  resource,
});

// IDM evaluates its own policies:
// 1. Fetches policies from account-roles, account-groups, group-roles
// 2. Checks if any policy has effect='Deny' matching action+resource → DENY
// 3. Checks if any policy has effect='Allow' matching action+resource → ALLOW
// 4. No match → DENY (implicit)
if (!result.allowed) {
  throw new ForbiddenError(result.error);
}
```

## Benefits

### For Library

- Framework agnostic (works with Koa, Express, Fastify, Lambda)
- Simple HTTP client (no complex logic)
- Easy to test (mock HTTP responses)
- Single responsibility

### For Projects

- No validation logic to maintain
- Always up-to-date with IDM rules
- Simple integration (just provide context)
- Consistent behavior

### For IDM (Self-Usage)

- IDM uses its own library
- Centralized validation logic
- Single source of truth
- Easy to update rules

## Library API Design

### Authentication Module

```typescript
interface AuthenticationRequest {
  application: string;
  token: string;
  tenantId: string;
}

interface AuthenticationResponse {
  valid: boolean;
  payload?: {
    [key: string]: unknown;
  };
  error?: string;
}

function authenticate(
  idmUrl: string,
  request: AuthenticationRequest
): Promise<AuthenticationResponse>;
```

### Authorization Module

```typescript
interface AuthorizationRequest {
  application: string;
  accountId: string;
  tenantId: string;
  partition?: string; // Optional, default: 'global'
  region?: string; // Optional
  action: string; // Format: {system}:{resource}:{operation}
  resource: string; // Format: grn:partition:system:region:tenantId:resource-type/resource-id
}

interface AuthorizationResponse {
  allowed: boolean;
  payload?: {
    [key: string]: unknown;
  };
  error?: string;
}

function authorize(
  idmUrl: string,
  request: AuthorizationRequest
): Promise<AuthorizationResponse>;
```

## Implementation Strategy

### Phase 1: Create Library

- Implement HTTP client for authentication
- Implement HTTP client for authorization
- TypeScript definitions
- Unit tests with HTTP mocking

### Phase 2: Create IDM Endpoints

- `POST /authenticate` - Validate JWT + business rules
- `POST /authorize` - Evaluate policies
- Return standardized responses

### Phase 3: Adapter Layer

- Keep middleware as thin adapter
- Middleware extracts data from framework
- Calls library functions
- Handles framework-specific responses

### Phase 4: Publish & Integrate

- Publish library to npm
- Update IDM to use library
- Update other projects to use library

## Usage Examples

### Koa Middleware (Adapter)

```typescript
import { validateAuthentication } from '@idm-auth/core';

export const authenticationMiddleware = () => {
  return async (ctx: Context, next: Next) => {
    const token = extractTokenFromHeader(ctx.headers.authorization);
    const tenantId = ctx.params.tenantId;

    // Library calls IDM to validate
    const result = await validateAuthentication(process.env.IDM_URL, {
      application: 'my-app',
      token,
      tenantId,
    });

    if (!result.valid) {
      throw new UnauthorizedError(result.error);
    }

    ctx.state.authenticated = true;
    ctx.state.tenantId = tenantId;
    await next();
  };
};
```

### Express Middleware (Adapter)

```typescript
import { validateAuthentication } from '@idm-auth/core';

export const authenticationMiddleware = () => {
  return async (req, res, next) => {
    const token = extractTokenFromHeader(req.headers.authorization);
    const tenantId = req.params.tenantId;

    // Library calls IDM to validate
    const result = await validateAuthentication(process.env.IDM_URL, {
      application: 'my-app',
      token,
      tenantId,
    });

    if (!result.valid) {
      return res.status(401).json({ error: result.error });
    }

    req.authenticated = true;
    req.tenantId = tenantId;
    next();
  };
};
```

### AWS Lambda (Direct Usage)

```typescript
import { authenticate, authorize } from '@idm-auth/core';

export const handler = async (event) => {
  const token = event.headers.Authorization.replace('Bearer ', '');
  const tenantId = event.pathParameters.tenantId;

  // Library calls IDM to authenticate
  const authResult = await validateAuthentication(process.env.IDM_URL, {
    application: 'my-lambda-function',
    token,
    tenantId,
  });

  if (!authResult.valid) {
    return { statusCode: 401, body: authResult.error };
  }

  // Library calls IDM to authorize
  const authzResult = await authorize(process.env.IDM_URL, {
    application: 'my-lambda-function',
    accountId: authResult.payload.accountId,
    tenantId,
    action: 'accounts:read',
    resource: event.resource,
  });

  if (!authzResult.allowed) {
    return { statusCode: 403, body: authzResult.error || 'Forbidden' };
  }

  // Process request
};
```

## Testing Strategy

### Library Tests (HTTP Mocking)

```typescript
describe('validateAuthentication', () => {
  it('should return valid response for valid token', async () => {
    // Mock HTTP response from IDM
    mockHttpPost('/authenticate', {
      valid: true,
      payload: { accountId: '123', email: 'test@example.com' },
    });

    const result = await validateAuthentication(
      'https://idm-auth.example.com/api',
      {
        application: 'test-app',
        token: 'valid.jwt.token',
        tenantId: 'tenant-123',
      }
    );

    expect(result.valid).toBe(true);
    expect(result.valid).toBe(true);
  });

  it('should return error for expired token', async () => {
    // Mock HTTP response from IDM
    mockHttpPost('/authenticate', {
      valid: false,
      error: 'Token expired',
    });

    const result = await validateAuthentication(
      'https://idm-auth.example.com/api',
      {
        application: 'test-app',
        token: 'expired.jwt.token',
        tenantId: 'tenant-123',
      }
    );

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Token expired');
  });
});
```

### Project Tests (Integration)

```typescript
describe('POST /accounts', () => {
  it('should create account with valid JWT', async () => {
    const token = await generateTestToken();

    const response = await request(app)
      .post('/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'test@example.com' })
      .expect(201);
  });
});
```

## Key Similarities: Both Remote Processing

### Authentication (Remote Processing)

- Library calls IDM via HTTP
- IDM validates JWT (signature, expiration)
- IDM validates business rules (account exists, is active)
- Single source of truth for authentication
- Project only provides context (application, token, tenant)

### Authorization (Remote Processing)

- Library calls IDM via HTTP
- IDM evaluates all policies centrally
- Single source of truth for permissions
- Project only provides context (application, user, action, resource)

## Conclusion

This architecture provides:

- **Centralized Validation**: IDM is single source of truth for authentication and authorization
- **Consistency**: All projects use same validation logic via IDM
- **Flexibility**: Each project defines its identity and context
- **Reusability**: Same library across all projects
- **Testability**: HTTP client with predictable calls
- **Maintainability**: Changes in IDM affect all projects immediately
- **Self-Usage**: IDM uses its own library and endpoints

The IDM project uses its own library, calling its own `/authenticate` and `/authorize` endpoints. Other projects use the same library, calling IDM for all validation.
