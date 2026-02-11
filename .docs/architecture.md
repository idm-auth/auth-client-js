# IDM Client Library Architecture

## Purpose

The `@idm-auth/client` library provides a **backend-agnostic** HTTP client for authentication and authorization services. It is designed to work with any IDM backend that implements the expected API contract.

## Core Principle: Backend Agnosticism

The library **does not know** and **should not care** about:

- Which backend it's talking to
- How the backend implements validation
- Whether it's the IDM backend or another service
- Whether it's in the same process or remote

The library **only knows**:

- How to make HTTP requests
- What data to send
- What response to expect

## Architecture

### Interface-Based Design

```typescript
// User provides HTTP client implementation
export interface IHttpClient {
  post<T>(url: string, data: unknown, options?: HttpOptions): Promise<T>;
  get<T>(url: string, options?: HttpOptions): Promise<T>;
}

export interface HttpOptions {
  headers?: Record<string, string>;
}
```

### Separation of Concerns

```
┌─────────────────────────────────────────────────────────┐
│                  User's Application                     │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  User's HTTP Client Implementation                │ │
│  │  - AxiosHttpClient                                │ │
│  │  - FetchHttpClient                                │ │
│  │  - UndiciHttpClient                               │ │
│  │  - Custom implementation                          │ │
│  │                                                   │ │
│  │  User controls:                                   │ │
│  │  - Timeout                                        │ │
│  │  - Retry logic                                    │ │
│  │  - Custom headers                                 │ │
│  │  - Interceptors                                   │ │
│  │  - Error handling                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                          ↓                              │
│  ┌───────────────────────────────────────────────────┐ │
│  │  @idm-auth/client Library                        │ │
│  │                                                   │ │
│  │  Library controls:                                │ │
│  │  - API endpoints                                  │ │
│  │  - Request structure                              │ │
│  │  - Required headers                               │ │
│  │  - Response parsing                               │ │
│  │  - Telemetry                                      │ │
│  │  - Business logic                                 │ │
│  └───────────────────────────────────────────────────┘ │
│                          ↓ HTTP                         │
└──────────────────────────┼──────────────────────────────┘
                           ↓
                  ┌────────────────┐
                  │  Any IDM API   │
                  │  (Backend)     │
                  └────────────────┘
```

## Key Functions

### validateAuthentication()

Validates JWT tokens with the IDM backend.

```typescript
export async function authenticate(
  httpClient: IHttpClient,
  idmUrl: string,
  request: AuthenticationRequest
): Promise<AuthenticationResponse>;
```

**What the library does:**

- Constructs correct API endpoint: `${idmUrl}/api/realm/${tenantId}/auth/validate`
- Builds request payload: `{ token }`
- Sets required headers: `Content-Type`, `X-IDM-Application`
- Adds telemetry tracing
- Parses response

**What the user controls:**

- HTTP client implementation (timeout, retry, etc.)
- IDM backend URL
- Additional custom headers

### authorize()

Checks authorization policies with the IDM backend.

```typescript
export async function authorize(
  httpClient: IHttpClient,
  idmUrl: string,
  request: AuthorizationRequest
): Promise<AuthorizationResponse>;
```

**What the library does:**

- Constructs correct API endpoint: `${idmUrl}/api/realm/${tenantId}/authz/evaluate`
- Builds request payload with action, resource, etc.
- Sets required headers
- Adds telemetry tracing
- Parses response

**What the user controls:**

- HTTP client implementation
- IDM backend URL
- Additional custom headers

## HTTP Client Implementations

### Built-in: FetchHttpClient

```typescript
import { FetchHttpClient } from '@idm-auth/client';

const httpClient = new FetchHttpClient(5000); // 5 second timeout
```

Uses native `fetch` API with:

- Configurable timeout via AbortController
- Automatic error handling
- Zero external dependencies

### User-Provided: AxiosHttpClient

```typescript
import { IHttpClient, HttpOptions } from '@idm-auth/client';
import axios from 'axios';

class AxiosHttpClient implements IHttpClient {
  private axiosInstance;

  constructor(timeout = 5000) {
    this.axiosInstance = axios.create({ timeout });
  }

  async post<T>(url: string, data: unknown, options?: HttpOptions): Promise<T> {
    const response = await this.axiosInstance.post(url, data, {
      headers: options?.headers,
    });
    return response.data;
  }

  async get<T>(url: string, options?: HttpOptions): Promise<T> {
    const response = await this.axiosInstance.get(url, {
      headers: options?.headers,
    });
    return response.data;
  }
}
```

User can add:

- Retry logic with `axios-retry`
- Request/response interceptors
- Custom error handling
- API keys in headers
- Any axios feature

## Usage Patterns

### Simple Usage (Built-in Client)

```typescript
import { authenticate, FetchHttpClient } from '@idm-auth/client';

const httpClient = new FetchHttpClient();

const result = await validateAuthentication(
  httpClient,
  'https://idm-auth.example.com',
  {
    tenantId: 'tenant-123',
    token: 'jwt-token',
    application: 'my-app',
  }
);

if (result.valid) {
  console.log('Authenticated:', result.valid);
}
```

### Advanced Usage (Custom Client)

```typescript
import { authorize, IHttpClient } from '@idm-auth/client';
import axios from 'axios';
import axiosRetry from 'axios-retry';

class CustomHttpClient implements IHttpClient {
  private axiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      headers: { 'X-API-Key': process.env.API_KEY },
    });

    axiosRetry(this.axiosInstance, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
    });

    this.axiosInstance.interceptors.request.use((config) => {
      console.log('Request:', config);
      return config;
    });
  }

  async post<T>(url: string, data: unknown, options?: HttpOptions): Promise<T> {
    const response = await this.axiosInstance.post(url, data, {
      headers: { ...options?.headers },
    });
    return response.data;
  }

  async get<T>(url: string, options?: HttpOptions): Promise<T> {
    const response = await this.axiosInstance.get(url, {
      headers: { ...options?.headers },
    });
    return response.data;
  }
}

const httpClient = new CustomHttpClient();

const result = await authorize(httpClient, 'https://idm-auth.example.com', {
  tenantId: 'tenant-123',
  accountId: 'account-456',
  action: 'iam:accounts:read',
  resource: 'grn:global:iam::tenant-123:accounts/*',
  application: 'my-app',
});
```

## Self-Hosting Pattern

The IDM backend itself uses this library to validate its own tokens:

```
IDM Backend → @idm-auth/client → HTTP → IDM Backend (itself)
```

This creates a powerful feedback loop:

- Library is battle-tested in production
- Same code path as external clients
- Integration issues caught immediately
- Forces good API design

See [Backend Self-Hosting Pattern](../../backend-koa/.docs/architecture/self-hosting-pattern.md) for details.

## Design Decisions

### Why Interface-Based?

**Problem:** Different applications use different HTTP libraries (axios, fetch, undici, got, etc.)

**Solution:** Define minimal interface, let user provide implementation

**Benefits:**

- Zero forced dependencies
- User controls timeout, retry, headers
- Works with any HTTP library
- Easy to test (mock IHttpClient)

### Why Not Include HTTP Client?

**Option 1:** Bundle axios

- ❌ Forces dependency on users
- ❌ May conflict with user's axios version
- ❌ Larger bundle size

**Option 2:** Use fetch only

- ❌ Limited customization
- ❌ No retry, interceptors out of box
- ❌ User may prefer axios

**Option 3:** Interface + examples (chosen)

- ✅ Zero forced dependencies
- ✅ User chooses their library
- ✅ Minimal bundle size
- ✅ Maximum flexibility

### Why Pass httpClient to Every Function?

**Alternative:** Singleton pattern

```typescript
// Not used
IDMClient.configure({ httpClient, idmUrl });
await IDMClient.authenticate(request);
```

**Problems:**

- Global state
- Hard to test
- Can't use multiple configurations
- Not functional

**Current approach:**

```typescript
// Used
await validateAuthentication(httpClient, idmUrl, request);
```

**Benefits:**

- No global state
- Easy to test
- Multiple configurations possible
- Functional programming style
- Explicit dependencies

## Telemetry

The library includes OpenTelemetry tracing:

```typescript
return tracer.startActiveSpan('idm-auth-client.authenticate', async (span) => {
  span.setAttributes({
    'idm-auth-client.operation': 'authenticate',
    'idm-auth-client.application': request.application,
    'idm-auth-client.tenant_id': request.tenantId,
  });

  // ... operation

  span.setAttributes({ 'idm-auth-client.auth.valid': result.valid });
  return result;
});
```

This provides:

- Distributed tracing across services
- Performance monitoring
- Error tracking
- Request correlation

## Testing

### Unit Tests

Mock the IHttpClient:

```typescript
const mockHttpClient: IHttpClient = {
  post: vi.fn().mockResolvedValue({ valid: true }),
  get: vi.fn().mockResolvedValue({ allowed: true }),
};

const result = await validateAuthentication(
  mockHttpClient,
  'http://test',
  request
);
```

### Integration Tests

Use real HTTP client against test backend:

```typescript
const httpClient = new FetchHttpClient();
const result = await validateAuthentication(
  httpClient,
  'http://localhost:3000',
  request
);
```

## Future Enhancements

### Potential Additions

1. **Caching layer** - Cache validation results
2. **Circuit breaker** - Fail fast on backend issues
3. **Metrics** - Prometheus metrics export
4. **Batch operations** - Validate multiple tokens at once

### Non-Goals

- ❌ Implement HTTP client - user provides
- ❌ Token generation - backend responsibility
- ❌ Policy evaluation - backend responsibility
- ❌ Database access - backend responsibility

The library remains a **thin HTTP client** focused on communication, not business logic.
