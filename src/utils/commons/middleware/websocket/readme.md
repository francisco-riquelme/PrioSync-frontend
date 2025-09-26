# WebSocket Middleware

WebSocket-specific middleware for AWS API Gateway WebSocket APIs with Amplify Data integration.

## Core Components

### WebSocketMiddlewareChain

- `createWebSocketChain`: Factory for middleware chains
- `wrapWebSocketHandler`: Lambda handler wrapper
- `createAllowPolicy`/`createDenyPolicy`: IAM policy generation
- Type-safe composition with automatic validation

### WebSocketModelInitializer

- Lazy Amplify Data model initialization with caching
- Concurrent request protection via promise sharing
- Timeout protection and error recovery
- Multi-tenant support via client key isolation

### WebSocketRequestValidator

- Yup schema validation for MESSAGE events
- Route-specific validation filtering
- Type-safe data access via `getValidatedMessage<T>()`
- Configurable error handling and field stripping

### WebSocketRequestLogger

- Request/response cycle logging with timing
- Connection metadata extraction
- Configurable field exclusion for security
- Object depth limiting and JSON safety

### WebSocketErrorHandler

- Centralized WebSocket error conversion
- Context preservation and stack trace capture
- Middleware execution trace information
- Structured error logging integration

## Utilities

**Context**: `buildWebSocketContext`, `setupStructuredLogging`, `buildErrorContext`
**Events**: `extractEventInfo`, `parseJsonBody`, `isMessageEvent`
**Models**: `getModelsFromInput`, `getModelFromInput`, `hasModel`
**Errors**: `getErrorMessage`, `getErrorStack`

## Key Types

```typescript
WebSocketEvent; // Extended API Gateway event
WebSocketResponse; // Standard response structure
WebSocketBaseInput; // Input without models
WebSocketInputWithModels; // Input with Amplify models
WebSocketMiddleware; // Middleware function signature
WebSocketMiddlewareChain; // Type-safe chain definition
```

## Usage Pattern

```typescript
const chain = createWebSocketChain()
  .use(createWebSocketModelInitializer({ entities: ['User', 'Post'] }))
  .use(createWebSocketRequestValidator({ schema: messageSchema }))
  .use(createWebSocketRequestLogger())
  .use(createWebSocketErrorHandler());

export const handler = wrapWebSocketHandler(chain, async input => {
  const { User } = getModelsFromInput(input);
  const message = getValidatedMessage<MessageType>(input);
  // Handler logic
});
```

## Performance

- **Initialization**: 100-500ms first request, cached afterward
- **Validation**: Scales with schema complexity, route filtering available
- **Logging**: Minimal overhead with configurable detail levels

## Security

- Field exclusion for sensitive data in logs
- Stack traces logged but not exposed in responses
- Client key isolation for multi-tenant scenarios
- JSON parsing safety with malformed input protection
