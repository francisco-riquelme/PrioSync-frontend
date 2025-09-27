import {
  throwError,
  extractErrorMessage,
  createErrorContext,
  type ErrorContext,
} from './error';

/**
 * WebSocket-specific error codes
 */
export const WebSocketErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  MESSAGE_TOO_LARGE: 'MESSAGE_TOO_LARGE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * WebSocket error context with connection-specific information
 */
export interface WebSocketErrorContext extends ErrorContext {
  connectionId?: string;
  routeKey?: string;
  eventType?: 'CONNECT' | 'DISCONNECT' | 'MESSAGE';
  messageId?: string;
}

/**
 * Enhanced WebSocket error with status code and error code
 */
export interface WebSocketError extends Error {
  statusCode: number;
  code: string;
  context?: WebSocketErrorContext;
  originalError?: unknown;
}

/**
 * Creates a WebSocket-specific error with proper status code and error code
 */
export function throwWebSocketError(
  statusCode: number,
  code: keyof typeof WebSocketErrorCodes,
  message: string,
  context?: WebSocketErrorContext & { originalError?: unknown },
): never {
  const { originalError, ...errorContext } = context || {};

  const fullContext = createErrorContext({
    ...errorContext,
    statusCode,
    code,
    originalError,
  });

  throwError(message, fullContext);
}

/**
 * Convenience functions for common WebSocket error scenarios
 */
export const WebSocketErrors = {
  /**
   * Throws a validation error (400)
   */
  validation(
    message: string,
    context?: WebSocketErrorContext,
    originalError?: unknown,
  ): never {
    throwWebSocketError(400, 'VALIDATION_ERROR', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws an authentication error (401)
   */
  authentication(
    message: string,
    context?: WebSocketErrorContext,
    originalError?: unknown,
  ): never {
    throwWebSocketError(401, 'AUTHENTICATION_ERROR', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws an authorization error (403)
   */
  authorization(
    message: string,
    context?: WebSocketErrorContext,
    originalError?: unknown,
  ): never {
    throwWebSocketError(403, 'AUTHORIZATION_ERROR', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws a connection error (400)
   */
  connection(
    message: string,
    context?: WebSocketErrorContext,
    originalError?: unknown,
  ): never {
    throwWebSocketError(400, 'CONNECTION_ERROR', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws a message too large error (413)
   */
  messageTooLarge(
    message: string,
    context?: WebSocketErrorContext,
    originalError?: unknown,
  ): never {
    throwWebSocketError(413, 'MESSAGE_TOO_LARGE', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws a rate limit error (429)
   */
  rateLimitExceeded(
    message: string,
    context?: WebSocketErrorContext,
    originalError?: unknown,
  ): never {
    throwWebSocketError(429, 'RATE_LIMIT_EXCEEDED', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws a bad request error (400)
   */
  badRequest(
    message: string,
    context?: WebSocketErrorContext,
    originalError?: unknown,
  ): never {
    throwWebSocketError(400, 'BAD_REQUEST', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws a service unavailable error (503)
   */
  serviceUnavailable(
    message: string,
    context?: WebSocketErrorContext,
    originalError?: unknown,
  ): never {
    throwWebSocketError(503, 'SERVICE_UNAVAILABLE', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws an internal server error (500)
   */
  internal(
    message: string,
    context?: WebSocketErrorContext,
    originalError?: unknown,
  ): never {
    throwWebSocketError(500, 'INTERNAL_SERVER_ERROR', message, {
      ...context,
      originalError,
    });
  },
};

/**
 * Checks if an error is a WebSocket error with status code
 */
export function isWebSocketError(error: unknown): error is WebSocketError {
  return (
    error instanceof Error &&
    'context' in error &&
    typeof (error as { context?: unknown }).context === 'object' &&
    typeof (error as WebSocketError).statusCode === 'number' &&
    typeof (error as WebSocketError).code === 'string'
  );
}

/**
 * Extracts WebSocket error information for response formatting
 */
export function extractWebSocketErrorInfo(error: WebSocketError): {
  statusCode: number;
  code: string;
  message: string;
  context?: WebSocketErrorContext | undefined;
} {
  return {
    statusCode: error.statusCode || 500,
    code: error.code || WebSocketErrorCodes.INTERNAL_SERVER_ERROR,
    message: extractErrorMessage(error),
    context: error.context !== undefined ? error.context : undefined,
  };
}
