# Error Utility

Standardized error handling with structured logging, context preservation, and WebSocket-specific error management.

## Core Features

- **Error Processing**: Handles strings, Error objects, arrays, and unknown types
- **Context Preservation**: Maintains original error information with structured context
- **Automatic Logging**: Integrates with logger for structured error tracking
- **Stack Trace Chaining**: Preserves original stack traces with ES2022 cause support
- **WebSocket Errors**: Specialized error handling for WebSocket connections

## Basic Usage

```typescript
import {
  throwError,
  extractErrorMessage,
  createErrorContext,
} from '@your-org/amplify-shared-utilities/error';

// Throw with message and context
throwError('Operation failed', { userId: '123', operation: 'create' });

// Throw with original error
try {
  riskyOperation();
} catch (error) {
  throwError('Database operation failed', error);
}

// Extract message from unknown error
const message = extractErrorMessage(error); // Handles any type

// Create filtered context
const context = createErrorContext({
  userId: user?.id, // undefined values removed
  operation: 'delete', // preserved
});
```

## WebSocket Errors

```typescript
import {
  throwWebSocketError,
  WebSocketErrorCodes,
  isWebSocketError,
} from '@your-org/amplify-shared-utilities/error';

// Throw WebSocket-specific error
throwWebSocketError(400, 'VALIDATION_ERROR', 'Invalid message format', {
  connectionId: 'conn-123',
  routeKey: '$default',
});

// Check if error is WebSocket error
if (isWebSocketError(error)) {
  console.log(error.statusCode, error.code);
}
```

## Error Codes

WebSocket error codes:

- `VALIDATION_ERROR`
- `AUTHENTICATION_ERROR`
- `AUTHORIZATION_ERROR`
- `CONNECTION_ERROR`
- `MESSAGE_TOO_LARGE`
- `RATE_LIMIT_EXCEEDED`
- `INTERNAL_SERVER_ERROR`
- `BAD_REQUEST`
- `SERVICE_UNAVAILABLE`

## Error Processing

- **String Messages**: Direct processing with optional context/original error
- **Error Objects**: Preserves name, message, stack with chaining
- **Arrays**: Flattens and combines multiple error messages
- **Unknown Types**: Safe conversion to string representation

## Features

- **ES2022 Cause Support**: Uses modern Error constructor with cause parameter
- **Stack Chaining**: Appends original stack traces for debugging
- **Context Properties**: Non-enumerable context attachment
- **Library Marking**: Identifies errors from this utility
- **Automatic Logging**: Structured error logging with context

## Exports

```typescript
export {
  throwError,
  extractErrorMessage,
  createErrorContext,
  WebSocketErrorCodes,
  WebSocketErrors,
  throwWebSocketError,
  isWebSocketError,
  extractWebSocketErrorInfo,
  type ErrorContext,
  type WebSocketError,
  type WebSocketErrorContext,
};
```

```

```
