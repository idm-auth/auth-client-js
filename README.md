# IDM Auth Client

HTTP client library for IDM authentication and authorization.

## Installation

```bash
npm install @idm-auth/auth-client
```

## Quick Start

This library requires you to provide an HTTP client implementation. You can use the built-in `FetchHttpClient` or create your own.

### Using Built-in FetchHttpClient

```typescript
import { validateAuthentication, FetchHttpClient } from '@idm-auth/auth-client';

const httpClient = new FetchHttpClient(5000); // 5 second timeout

const result = await validateAuthentication(
  httpClient,
  'https://idm-auth.example.com',
  {
    application: 'my-app',
    token: 'jwt.token.here',
    tenantId: 'tenant-123',
  }
);

if (result.valid) {
  console.log('Authenticated:', result.valid);
} else {
  console.error('Authentication failed:', result.error);
}
```

### Using Custom HTTP Client (Axios)

```typescript
import {
  validateAuthentication,
  authorize,
  IHttpClient,
  HttpOptions,
} from '@idm-auth/auth-client';
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

const httpClient = new AxiosHttpClient(10000); // 10 second timeout

const authResult = await validateAuthentication(
  httpClient,
  'https://idm-auth.example.com',
  {
    application: 'my-app',
    token: 'jwt.token.here',
    tenantId: 'tenant-123',
  }
);

const authzResult = await authorize(
  httpClient,
  'https://idm-auth.example.com',
  {
    application: 'my-app',
    accountId: 'account-123',
    tenantId: 'tenant-123',
    action: 'iam:accounts:read',
    resource: 'grn:global:iam::tenant-123:accounts/*',
  }
);
```

## HTTP Client Interface

You must implement the `IHttpClient` interface:

```typescript
export interface IHttpClient {
  post<T>(url: string, data: unknown, options?: HttpOptions): Promise<T>;
  get<T>(url: string, options?: HttpOptions): Promise<T>;
}

export interface HttpOptions {
  headers?: Record<string, string>;
}
```

The library will pass required headers (like `Content-Type` and `X-IDM-Application`) through the `options` parameter. Your implementation should merge these with any custom headers you want to add.

## API

### `validateAuthentication(httpClient, idmUrl, request)`

Validates authentication token with IDM backend.

**Why validate remotely?**
Even if a JWT token is technically valid (correct signature, not expired), the IDM backend performs additional contextual validations:

- Account status (active, blocked, deleted)
- Session validity (not revoked)
- IP address validation (optional)
- User-Agent validation (optional)
- Permission changes since token was issued

**Parameters:**

- `httpClient` (IHttpClient): HTTP client implementation
- `idmUrl` (string): IDM API base URL
- `request` (AuthenticationValidationRequest):
  - `application` (string): Application identifier
  - `token` (string): Authentication token (JWT, API Key, OAuth token, etc)
  - `tenantId` (string): Tenant context

**Returns:** `Promise<AuthenticationValidationResponse>`

- `valid` (boolean): Whether authentication is valid
- `user?` (UserPayload): User data if valid
  - `accountId` (string): User account ID
  - `email` (string): User email
  - `roles?` (string[]): User roles
  - `permissions?` (string[]): User permissions
- `error?` (string): Error message if invalid

### `authorize(httpClient, idmUrl, request)`

Checks authorization with IDM.

**Parameters:**

- `httpClient` (IHttpClient): HTTP client implementation
- `idmUrl` (string): IDM API base URL
- `request` (AuthorizationRequest):
  - `application` (string): Application identifier
  - `accountId` (string): User account ID
  - `tenantId` (string): Tenant context
  - `partition?` (string): Partition (default: 'global')
  - `region?` (string): Region
  - `action` (string): Action format: `{system}:{resource}:{operation}`
  - `resource` (string): GRN format resource

**Returns:** `Promise<AuthorizationResponse>`

- `allowed` (boolean): Whether action is authorized
- `payload?` (object): Additional data
- `error?` (string): Error message if denied

## Customization

Your HTTP client implementation can add:

- Custom timeout values
- Retry logic
- Request/response interceptors
- Custom headers (API keys, authentication)
- Logging
- Error handling

The library handles:

- Correct API endpoints
- Required headers
- Request/response structure
- Telemetry tracing

## License

ISC
