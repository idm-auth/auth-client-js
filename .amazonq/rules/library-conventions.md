# Auth Client Library Conventions

## Project Phase: Foundation/Construction

- Project is NOT in production - it's being built from scratch
- Breaking changes are EXPECTED and ENCOURAGED when they improve architecture
- Refactoring is part of the process - embrace it
- When finding architectural flaws, FIX them completely, don't work around them
- ALWAYS prioritize correctness over backward compatibility
- ALWAYS suggest the architecturally correct solution, even if it requires refactoring
- NEVER be defensive about breaking changes - the project is small and designed for this

## Library Purpose

- Backend-agnostic HTTP client for IDM authentication and authorization
- Thin communication layer - NO business logic, NO token generation, NO policy evaluation
- Interface-based design - user provides HTTP client implementation
- Zero forced dependencies - works with any HTTP library (axios, fetch, undici, etc.)

## Architecture Principles

- **Backend Agnosticism**: Library doesn't know which backend it talks to
- **Interface-Based**: Define minimal IHttpClient interface, user implements
- **Functional Style**: Pass dependencies explicitly, no global state, no singletons
- **Separation of Concerns**: Library controls API endpoints/structure, user controls HTTP behavior

## Core Interface

```typescript
export interface IHttpClient {
  post<T>(url: string, data: unknown, options?: HttpOptions): Promise<T>;
  get<T>(url: string, options?: HttpOptions): Promise<T>;
}

export interface HttpOptions {
  headers?: Record<string, string>;
}
```

## Directory Structure

- `src/auth/` - Authentication and authorization functions
- `src/http/` - HTTP client interface and implementations
- `src/types/` - TypeScript types and interfaces
- `src/telemetry/` - OpenTelemetry tracing
- `src/examples/` - Example HTTP client implementations
- `.docs/` - Architecture documentation

## Naming Rules

- Files: lowercase with dots: `authenticate.ts`, `httpClient.mock.ts`
- Types: PascalCase with descriptive names: `AuthenticationRequest`, `IHttpClient`
- Functions: camelCase, verb-based: `validateAuthentication`, `authorize`

## File Organization Rules

- NEVER create separate `.type.ts` files - types in same file as implementation
- Each function in its own file
- Export everything through `index.ts` barrel files
- Keep files small and focused

## TypeScript Rules

- NEVER use `any` type - defeats the purpose of TypeScript
- NEVER use type casting (`as`) - fix the types instead
- ALWAYS provide proper type annotations and generics
- Type safety is non-negotiable
- All public APIs must have explicit types

## Code Style Rules

- Write MINIMAL code - only what's necessary
- NO verbose comments - code must be self-documenting
- ONE responsibility per file/function
- Functional programming style - pure functions, no side effects

## Function Design Pattern

```typescript
// ALWAYS pass dependencies explicitly
export async function validateAuthentication(
  httpClient: IHttpClient, // User-provided
  idmUrl: string, // Configuration
  request: AuthenticationRequest // Input
): Promise<AuthenticationResponse> {
  // Library controls: endpoints, headers, structure
  // User controls: timeout, retry, custom headers
}
```

## What Library Controls

- API endpoints construction
- Request payload structure
- Required headers (Content-Type, X-IDM-Application)
- Response parsing
- Telemetry tracing
- Type definitions

## What User Controls

- HTTP client implementation (axios, fetch, undici, custom)
- Timeout values
- Retry logic
- Custom headers
- Request/response interceptors
- Error handling
- Logging

## Telemetry Rules

- ALWAYS wrap operations in OpenTelemetry spans
- Set meaningful attributes: operation, application, tenantId
- Include success/failure status in spans
- Use consistent span naming: `idm-auth-client.{operation}`

## Testing Rules

- Unit tests: Mock IHttpClient interface
- Integration tests: Use real HTTP client against test backend
- ALWAYS test both success and error paths
- Test with different HTTP client implementations

## Problem Solving Rules

- NEVER remove functionality when encountering errors - ALWAYS investigate and fix properly
- When something doesn't work, research the correct solution
- Removing features is NOT a solution - it's avoiding the problem
- If unsure about the correct approach, ask for clarification before implementing
- ALWAYS present the solution plan BEFORE implementing, especially when making architectural changes
- Wait for user confirmation before proceeding with major refactoring

## Non-Goals (What NOT to Add)

- ❌ Bundled HTTP client - user provides
- ❌ Token generation - backend responsibility
- ❌ Policy evaluation - backend responsibility
- ❌ Database access - backend responsibility
- ❌ Caching - can be added later if needed
- ❌ Global state/singletons - keep functional
- ❌ Business logic - thin client only

## Documentation

- Architecture: `.docs/architecture.md`
- Usage examples in README.md
- Example implementations in `src/examples/`
