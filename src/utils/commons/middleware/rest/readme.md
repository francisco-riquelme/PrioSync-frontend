# REST Middleware

REST-specific middleware for AWS API Gateway REST APIs with Amplify Data integration and HTTP error handling.

## Core Components

### RestMiddlewareChain

- `createRestChain`: Factory for REST middleware chains
- `wrapRestHandler`: Lambda handler wrapper
- Type-safe composition with HTTP-specific event handling
- Generic type preservation across middleware stack

### RestModelInitializer

- Lazy Amplify Data model initialization with caching
- REST-aware error wrapping (404, 400, 409, 500 conversion)
- Concurrent request protection and timeout handling
- Multi-tenant support via client key isolation

### RestRequestValidator

- Yup schema validation for body, query, path, headers
- Type-safe data access via component-specific getters
- Symbol-based storage with tampering protection
- Configurable error handling and field stripping

### RestRequestLogger

- Request/response cycle logging with HTTP metadata
- Method, path, resource extraction with timing
- Configurable field exclusion for security
- Query/path parameter logging with sanitization

### RestErrorHandler

- Centralized REST error conversion to HTTP responses
- Status code mapping with context preservation
- Stack trace capture and middleware execution info
- Structured error logging integration

## Error System

### Error Codes & Status Mapping

```typescript
VALIDATION_ERROR; // 400 Bad Request
AUTHENTICATION_ERROR; // 401 Unauthorized
AUTHORIZATION_ERROR; // 403 Forbidden
NOT_FOUND; // 404 Not Found
CONFLICT; // 409 Conflict
INTERNAL_SERVER_ERROR; // 500 Internal Server Error
SERVICE_UNAVAILABLE; // 503 Service Unavailable
TOO_MANY_REQUESTS; // 429 Too Many Requests
```

### Error Utilities

```typescript
throwRestError(statusCode, code, message, context);
throwBadRequest(message, context);
throwUnauthorized(message, context);
throwForbidden(message, context);
throwNotFound(message, context);
throwConflict(message, context);
```

## Validation Access

```typescript
// Type-safe validated data retrieval
const body = getValidatedBody<BodyType>(input);
const query = getValidatedQuery<QueryType>(input);
const path = getValidatedPath<PathType>(input);
const headers = getValidatedHeaders<HeaderType>(input);
```

## Utilities

**Context**: `buildRestContext`, `setupStructuredLogging`, `buildErrorContext`
**Request**: `extractEventInfo`, `parseJsonBody`, `getRequestId`
**Response**: `createSuccessResponse`, `createErrorResponse`, `HTTP_STATUS`
**Models**: `getModelsFromInput`, `getModelFromInput`, `hasModel`

## Usage Pattern

```typescript
const chain = createRestChain()
  .use(createRestModelInitializer({ entities: ['User', 'Post'] }))
  .use(
    createRestRequestValidator({
      body: userSchema,
      query: paginationSchema,
    }),
  )
  .use(createRestRequestLogger())
  .use(createRestErrorHandler());

export const handler = wrapRestHandler(chain, async input => {
  const { User } = getModelsFromInput(input);
  const body = getValidatedBody<CreateUserInput>(input);
  // Handler logic
  return createSuccessResponse(result);
});
```

## Key Types

```typescript
RestEvent; // API Gateway proxy event
RestResponse; // API Gateway proxy result
RestBaseInput; // Input without models
RestInputWithModels; // Input with Amplify models
RestInputWithValidation; // Input with validated data
RestMiddleware; // Middleware function signature
RestError; // Enhanced error with HTTP status
```

## Performance

- **Initialization**: 100-500ms first request, cached afterward
- **Validation**: Component-based validation for selective processing
- **Logging**: Minimal overhead with configurable detail levels
- **Error Handling**: Optimized classification and response generation

## Security

- Field exclusion for sensitive data in logs
- Stack traces logged but not exposed in responses
- Client key isolation for multi-tenant scenarios
- JSON parsing safety with malformed input protection
