// rest/RestErrors.ts
import { throwError, createErrorContext, type ErrorContext } from '../../error';
import type { RestResponse } from './types';

/**
 * REST-specific error codes for standardized error classification
 *
 * Provides consistent error codes for common REST API error scenarios
 * that map to appropriate HTTP status codes.
 */
export const RestErrorCodes = {
  /** Request validation failed - malformed or invalid data */
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  /** Authentication required or invalid credentials */
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  /** Access denied - valid credentials but insufficient permissions */
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  /** Requested resource not found */
  NOT_FOUND: 'NOT_FOUND',
  /** Resource conflict - duplicate or constraint violation */
  CONFLICT: 'CONFLICT',
  /** Malformed request or invalid parameters */
  BAD_REQUEST: 'BAD_REQUEST',
  /** Internal server error - unexpected failure */
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  /** Service temporarily unavailable */
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  /** Rate limit exceeded */
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
} as const;

/**
 * Enhanced REST error interface with HTTP-specific properties
 *
 * Extends the base Error interface with REST API specific
 * information including status codes and structured context.
 */
export interface RestError extends Error {
  /** HTTP status code for the error response */
  statusCode: number;
  /** Structured error code for client handling */
  code: string;
  /** Additional context information for debugging */
  context?: RestErrorContext;
  /** Original error that caused this REST error */
  originalError?: unknown;
}

/**
 * REST error context with HTTP-specific information
 *
 * Provides structured context for REST errors including
 * request details and HTTP metadata.
 */
export interface RestErrorContext extends ErrorContext {
  /** HTTP method of the failed request */
  method?: string;
  /** Request path that failed */
  path?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Unique request identifier for tracing */
  requestId?: string;
  /** Request headers relevant to the error */
  headers?: Record<string, string>;
}

/**
 * Creates a REST-specific error with proper status code and error code
 *
 * Central function for creating standardized REST errors with
 * appropriate HTTP status codes and structured context.
 *
 * @param statusCode - HTTP status code for the error
 * @param code - REST error code from RestErrorCodes
 * @param message - Human-readable error message
 * @param context - Additional context and original error information
 * @throws Always throws - this function never returns
 */
export function throwRestError(
  statusCode: number,
  code: keyof typeof RestErrorCodes,
  message: string,
  context?: RestErrorContext & { originalError?: unknown },
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
 * Convenience functions for common REST error scenarios
 *
 * Provides pre-configured error throwing functions for standard
 * HTTP error cases with appropriate status codes and error codes.
 */
export const RestErrors = {
  /**
   * Throws a validation error (400 Bad Request)
   *
   * Used when request data fails validation or is malformed.
   *
   * @param message - Description of the validation failure
   * @param context - Request context and validation details
   * @param originalError - Original validation error if available
   * @throws Always throws validation error
   */
  validation(
    message: string,
    context?: RestErrorContext,
    originalError?: unknown,
  ): never {
    throwRestError(400, 'VALIDATION_ERROR', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws an authentication error (401 Unauthorized)
   *
   * Used when authentication is required or credentials are invalid.
   *
   * @param message - Description of the authentication failure
   * @param context - Request context and authentication details
   * @param originalError - Original authentication error if available
   * @throws Always throws authentication error
   */
  authentication(
    message: string,
    context?: RestErrorContext,
    originalError?: unknown,
  ): never {
    throwRestError(401, 'AUTHENTICATION_ERROR', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws an authorization error (403 Forbidden)
   *
   * Used when user is authenticated but lacks required permissions.
   *
   * @param message - Description of the authorization failure
   * @param context - Request context and permission details
   * @param originalError - Original authorization error if available
   * @throws Always throws authorization error
   */
  authorization(
    message: string,
    context?: RestErrorContext,
    originalError?: unknown,
  ): never {
    throwRestError(403, 'AUTHORIZATION_ERROR', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws a not found error (404 Not Found)
   *
   * Used when requested resource does not exist.
   *
   * @param message - Description of what was not found
   * @param context - Request context and resource details
   * @param originalError - Original lookup error if available
   * @throws Always throws not found error
   */
  notFound(
    message: string,
    context?: RestErrorContext,
    originalError?: unknown,
  ): never {
    throwRestError(404, 'NOT_FOUND', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws a conflict error (409 Conflict)
   *
   * Used when request conflicts with current resource state.
   *
   * @param message - Description of the conflict
   * @param context - Request context and conflict details
   * @param originalError - Original conflict error if available
   * @throws Always throws conflict error
   */
  conflict(
    message: string,
    context?: RestErrorContext,
    originalError?: unknown,
  ): never {
    throwRestError(409, 'CONFLICT', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws a bad request error (400 Bad Request)
   *
   * Used when request is malformed or contains invalid parameters.
   *
   * @param message - Description of the bad request
   * @param context - Request context and parameter details
   * @param originalError - Original parsing error if available
   * @throws Always throws bad request error
   */
  badRequest(
    message: string,
    context?: RestErrorContext,
    originalError?: unknown,
  ): never {
    throwRestError(400, 'BAD_REQUEST', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws a rate limit error (429 Too Many Requests)
   *
   * Used when client has exceeded rate limiting thresholds.
   *
   * @param message - Description of the rate limit violation
   * @param context - Request context and rate limit details
   * @param originalError - Original rate limiting error if available
   * @throws Always throws rate limit error
   */
  tooManyRequests(
    message: string,
    context?: RestErrorContext,
    originalError?: unknown,
  ): never {
    throwRestError(429, 'TOO_MANY_REQUESTS', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws a service unavailable error (503 Service Unavailable)
   *
   * Used when service is temporarily unavailable or under maintenance.
   *
   * @param message - Description of the service unavailability
   * @param context - Request context and service status details
   * @param originalError - Original service error if available
   * @throws Always throws service unavailable error
   */
  serviceUnavailable(
    message: string,
    context?: RestErrorContext,
    originalError?: unknown,
  ): never {
    throwRestError(503, 'SERVICE_UNAVAILABLE', message, {
      ...context,
      originalError,
    });
  },

  /**
   * Throws an internal server error (500 Internal Server Error)
   *
   * Used when an unexpected error occurs on the server side.
   *
   * @param message - Description of the internal error
   * @param context - Request context and error details
   * @param originalError - Original internal error if available
   * @throws Always throws internal server error
   */
  internal(
    message: string,
    context?: RestErrorContext,
    originalError?: unknown,
  ): never {
    throwRestError(500, 'INTERNAL_SERVER_ERROR', message, {
      ...context,
      originalError,
    });
  },
};

/**
 * Checks if an error is a REST error with status code
 *
 * Type guard function to determine if an unknown error object
 * is a properly structured REST error with HTTP status code.
 *
 * @param error - Unknown error object to check
 * @returns True if error is a REST error with status code and code properties
 */
export function isRestError(error: unknown): error is RestError {
  return (
    error instanceof Error &&
    'statusCode' in error &&
    'code' in error &&
    typeof (error as RestError).statusCode === 'number' &&
    typeof (error as RestError).code === 'string'
  );
}

/**
 * Maps REST error codes to HTTP status codes and response formatting
 *
 * Provides centralized mapping between REST error codes and their
 * corresponding HTTP status codes for consistent error handling.
 */
export const RestErrorMapping = {
  [RestErrorCodes.VALIDATION_ERROR]: {
    statusCode: 400,
    title: 'Validation Error',
    description: 'Request data failed validation',
  },
  [RestErrorCodes.AUTHENTICATION_ERROR]: {
    statusCode: 401,
    title: 'Authentication Error',
    description: 'Authentication required or invalid credentials',
  },
  [RestErrorCodes.AUTHORIZATION_ERROR]: {
    statusCode: 403,
    title: 'Authorization Error',
    description: 'Access denied - insufficient permissions',
  },
  [RestErrorCodes.NOT_FOUND]: {
    statusCode: 404,
    title: 'Not Found',
    description: 'Requested resource not found',
  },
  [RestErrorCodes.CONFLICT]: {
    statusCode: 409,
    title: 'Conflict',
    description: 'Resource conflict or constraint violation',
  },
  [RestErrorCodes.BAD_REQUEST]: {
    statusCode: 400,
    title: 'Bad Request',
    description: 'Malformed request or invalid parameters',
  },
  [RestErrorCodes.TOO_MANY_REQUESTS]: {
    statusCode: 429,
    title: 'Too Many Requests',
    description: 'Rate limit exceeded',
  },
  [RestErrorCodes.INTERNAL_SERVER_ERROR]: {
    statusCode: 500,
    title: 'Internal Server Error',
    description: 'Unexpected server error occurred',
  },
  [RestErrorCodes.SERVICE_UNAVAILABLE]: {
    statusCode: 503,
    title: 'Service Unavailable',
    description: 'Service temporarily unavailable',
  },
} as const;

/**
 * Creates a standardized error response for REST errors
 *
 * Converts REST errors into properly formatted API Gateway responses
 * with consistent structure and appropriate HTTP status codes.
 *
 * @param error - REST error with code and context
 * @param requestId - Request ID for response tracking
 * @returns API Gateway response object with error details
 */
export function createRestErrorResponse(
  error: RestError,
  requestId: string,
): RestResponse {
  const mapping = RestErrorMapping[error.code as keyof typeof RestErrorMapping];
  const statusCode = error.statusCode || mapping?.statusCode || 500;

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
    },
    body: JSON.stringify({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        title: mapping?.title || 'Error',
        statusCode,
      },
      context: error.context,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
      },
    }),
  };
}

/**
 * Checks if an error code is a known REST error code
 *
 * Determines if an error code is recognized and can be
 * handled gracefully by the error response system.
 *
 * @param code - Error code to check
 * @returns True if code is a known REST error code
 */
export function isKnownRestErrorCode(
  code: string,
): code is keyof typeof RestErrorCodes {
  return Object.values(RestErrorCodes).includes(
    code as unknown as keyof typeof RestErrorCodes,
  );
}
