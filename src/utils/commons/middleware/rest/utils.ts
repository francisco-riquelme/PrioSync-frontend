import { logger } from "../../log";
import type { RestInputWithModels, RestEvent } from "./types";
import type { AmplifyModelType, QueryFactoryResult } from "../../queries/types";

/**
 * Build standardized log context for REST operations
 *
 * Extracts Lambda context and API Gateway event information to create
 * a structured logging context for REST middleware operations.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Subset of model types to include
 * @param input - REST input containing event and Lambda context
 * @param additionalContext - Extra context fields to merge
 * @returns Structured logging context object
 */
export function buildRestContext<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  input: RestInputWithModels<TTypes, TSelected>,
  additionalContext: Record<string, unknown> = {}
): Record<string, unknown> {
  const { event, context } = input;

  return {
    ...additionalContext,
    method: event.httpMethod || "UNKNOWN",
    path: event.path || "UNKNOWN",
    resource: event.resource || "UNKNOWN",
    // Add null checks to prevent undefined values from being logged
    requestId: context?.awsRequestId || undefined,
    functionName: context?.functionName || undefined,
    functionVersion: context?.functionVersion || undefined,
    stage: event.requestContext?.stage,
    sourceIp: event.requestContext?.identity?.sourceIp,
  };
}

/**
 * Extract basic event information for logging
 *
 * Parses API Gateway event to extract essential request information
 * for logging and monitoring purposes. Safely handles missing fields.
 *
 * @param event - API Gateway proxy event
 * @returns Object containing basic request information
 */
export function extractEventInfo(event: RestEvent): Record<string, unknown> {
  return {
    method: event.httpMethod || "UNKNOWN",
    path: event.path || "UNKNOWN",
    resource: event.resource || "UNKNOWN",
    stage: event.requestContext?.stage,
    hasBody: !!event.body,
    bodyLength: event.body?.length || 0,
    queryStringParameters: event.queryStringParameters,
    pathParameters: event.pathParameters,
  };
}

/**
 * Setup structured logging for REST middleware
 *
 * Configures the logger with structured logging enabled and sets
 * request context for consistent log formatting across middleware.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Subset of model types to include
 * @param input - REST input containing event and context
 * @param forceStructuredLogging - Whether to force enable structured logging
 * @param defaultContext - Default context to include in all logs
 */
export function setupStructuredLogging<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  input: RestInputWithModels<TTypes, TSelected>,
  forceStructuredLogging: boolean = true,
  defaultContext: Record<string, unknown> = {}
): void {
  if (forceStructuredLogging && !logger.isStructuredLoggingEnabled()) {
    logger.setStructuredLogging(true);
  }

  logger.setContext({
    ...buildRestContext(input, defaultContext),
  });
}

/**
 * Extract error message safely
 *
 * Safely extracts error message from unknown error objects,
 * handling both Error instances and primitive values.
 *
 * @param error - Unknown error object or value
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Get error stack trace if available
 *
 * Safely extracts stack trace from error objects,
 * returning undefined for non-Error values.
 *
 * @param error - Unknown error object or value
 * @returns Stack trace string or undefined
 */
export function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

/**
 * Safely parses JSON body with error handling and logging
 * @param body - Raw request body string
 * @param context - Logging context for error reporting
 * @returns Parsed JSON object or null if parsing fails
 */
export function parseJsonBody(
  body: string | undefined,
  context: Record<string, unknown>
): unknown {
  if (!body) return null;

  try {
    return JSON.parse(body);
  } catch (error) {
    logger.warn("Failed to parse REST request body", {
      ...context,
      bodyLength: body.length,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Parses JSON body with fallback value for error cases
 * @param body - Raw request body string
 * @param fallback - Value to return if parsing fails
 * @returns Parsed JSON object or fallback value
 */
export function parseJsonBodyWithFallback<T = unknown>(
  body: string | undefined,
  fallback: T
): unknown | T {
  if (!body) return fallback;

  try {
    return JSON.parse(body);
  } catch {
    return fallback;
  }
}

/**
 * Create validation error with context
 *
 * Creates an Error object with additional validation context
 * information attached for detailed error reporting.
 *
 * @param message - Error message
 * @param field - Field name that failed validation
 * @param value - Value that failed validation
 * @param context - Additional error context
 * @returns Error object with validation context
 */
export function createValidationError(
  message: string,
  field: string,
  value: unknown,
  context: Record<string, unknown> = {}
): Error {
  const error = new Error(message);
  Object.assign(error, {
    field,
    value,
    ...context,
  });
  return error;
}

/**
 * Extracts request ID from multiple possible sources
 * @param event - REST event
 * @param context - Lambda context (optional)
 * @returns Request ID string or generated fallback
 */
export function getRequestId(
  event: RestEvent,
  context?: { awsRequestId?: string }
): string {
  return (
    context?.awsRequestId ||
    event.requestContext?.requestId ||
    `unknown-${Date.now()}`
  );
}

/**
 * Build error context with REST information
 *
 * Creates comprehensive error context by combining base REST context
 * with error-specific information for detailed error reporting.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Subset of model types to include
 * @param input - REST input containing event and context
 * @param error - Error object with optional code and statusCode
 * @param additionalContext - Extra context to include
 * @returns Complete error context object
 */
export function buildErrorContext<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  input: RestInputWithModels<TTypes, TSelected>,
  error: { code?: string; statusCode?: number } | null,
  additionalContext: Record<string, unknown> = {}
): Record<string, unknown> {
  const baseContext = buildRestContext(input, additionalContext);

  if (error) {
    return {
      ...baseContext,
      errorCode: error.code,
      statusCode: error.statusCode,
    };
  }

  return baseContext;
}

/**
 * Creates standardized success response in API Gateway format
 * @param data - Response data
 * @param statusCode - HTTP status code (defaults to 200)
 * @param requestId - Request ID for tracking
 * @param meta - Additional metadata
 * @returns API Gateway response object with success data
 */
export function createSuccessResponse<T = unknown>(
  data: T,
  statusCode: number = 200,
  requestId: string = "unknown",
  meta: Record<string, unknown> = {}
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
    },
    body: JSON.stringify({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        ...meta,
      },
    }),
  };
}

/**
 * Creates standardized error response in API Gateway format
 * @param error - Error message or Error object
 * @param statusCode - HTTP status code (defaults to 500)
 * @param requestId - Request ID for tracking
 * @param meta - Additional metadata
 * @returns API Gateway response object with error data
 */
export function createErrorResponse(
  error: string | Error,
  statusCode: number = 500,
  requestId: string = "unknown",
  meta: Record<string, unknown> = {}
): {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
} {
  const errorMessage = typeof error === "string" ? error : error.message;

  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "X-Request-ID": requestId,
    },
    body: JSON.stringify({
      success: false,
      error: {
        message: errorMessage,
        code: statusCode,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId,
        ...meta,
      },
    }),
  };
}

/**
 * Common HTTP status codes for REST APIs
 *
 * Predefined HTTP status codes commonly used in REST API responses.
 * Provides type-safe constants for consistent status code usage.
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Comprehensive error codes for REST API responses
 *
 * Standardized error codes for consistent error classification
 * and client-side error handling in REST APIs.
 */
export const ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNPROCESSABLE_ENTITY: "UNPROCESSABLE_ENTITY",
  UNAUTHORIZED: "UNAUTHORIZED",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  FORBIDDEN: "FORBIDDEN",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

/**
 * Environment detection helper
 *
 * Boolean flag indicating if the application is running in development mode.
 * Based on NODE_ENV environment variable.
 */
export const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Common middleware initialization helper that sets up logging and context
 * @param input - REST input with event and context
 * @param config - Configuration options for initialization
 * @returns Initialized input, context, and request ID
 */
export function initializeRestMiddleware<T extends RestInputWithModels>(
  input: T,
  config: {
    defaultContext?: Record<string, unknown>;
    forceStructuredLogging?: boolean;
    operation?: string;
  } = {}
): {
  input: RestInputWithModels;
  context: Record<string, unknown>;
  requestId: string;
} {
  const {
    defaultContext = {},
    forceStructuredLogging = true,
    operation = "middleware",
  } = config;

  const typedInput = input as RestInputWithModels;
  setupStructuredLogging(typedInput, forceStructuredLogging, defaultContext);

  const { context, requestId } = validateBasicRequestInfo(
    typedInput,
    operation
  );

  return {
    input: typedInput,
    context,
    requestId,
  };
}

/**
 * Validates and extracts basic request information with error context
 * @param input - REST input containing event and context
 * @param operation - Operation name for logging context
 * @returns Object containing event, context, and request ID
 */
export function validateBasicRequestInfo(
  input: RestInputWithModels,
  operation: string
): {
  event: RestEvent;
  context: Record<string, unknown>;
  requestId: string;
} {
  const { event } = input;
  const requestId = getRequestId(event, input.context);
  const context = buildRestContext(input, { operation });

  return {
    event,
    context,
    requestId,
  };
}

/**
 * Retrieves all initialized models from middleware input
 *
 * Extracts the complete collection of initialized Amplify Data models
 * from the middleware chain input with type safety.
 *
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 * @param input - REST input containing initialized models
 * @returns Object containing all initialized QueryFactory instances
 * @throws Error if models are not available or empty
 */
export function getModelsFromInput<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  input: RestInputWithModels<TTypes, TSelected>
): {
  [K in TSelected]: QueryFactoryResult<K & string, TTypes>;
} {
  if (!input.models) {
    throw new Error(
      "Models not available. Ensure RestModelInitializer middleware is used before this handler."
    );
  }

  const models = input.models as {
    [K in TSelected]: QueryFactoryResult<K & string, TTypes>;
  };

  const modelKeys = Object.keys(models);
  if (modelKeys.length === 0) {
    throw new Error(
      "No models found in input. Check RestModelInitializer configuration."
    );
  }

  return models;
}

/**
 * Retrieves a specific model by name from middleware input
 *
 * Extracts a single initialized Amplify Data model by name
 * with type safety and error handling.
 *
 * @template T - Specific model type to retrieve
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 * @param input - REST input containing initialized models
 * @param modelName - Name of the model to retrieve
 * @returns QueryFactory instance for the specified model
 * @throws Error if model is not found or not available
 */
export function getModelFromInput<
  T extends TSelected,
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  input: RestInputWithModels<TTypes, TSelected>,
  modelName: T
): QueryFactoryResult<T & string, TTypes> {
  const models = getModelsFromInput(input);

  const model = models[modelName];
  if (!model) {
    const availableModels = Object.keys(models);
    throw new Error(
      `Model '${String(modelName)}' not found. Available models: ${availableModels.join(", ")}`
    );
  }

  return model;
}

/**
 * Checks if a specific model is available in middleware input
 *
 * Safely determines whether a named model has been initialized
 * and is available for use without throwing errors.
 *
 * @template T - Specific model type to check
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 * @param input - REST input containing initialized models
 * @param modelName - Name of the model to check
 * @returns True if model is available, false otherwise
 */
export function hasModel<
  T extends TSelected,
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes = keyof TTypes,
>(input: RestInputWithModels<TTypes, TSelected>, modelName: T): boolean {
  try {
    const models = getModelsFromInput(input);
    return modelName in models && !!models[modelName];
  } catch {
    return false;
  }
}

/**
 * Retrieves names of all available models from middleware input
 *
 * Returns an array of model names that have been successfully
 * initialized and are available for use.
 *
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 * @param input - REST input containing initialized models
 * @returns Array of available model names
 */
export function getAvailableModelNames<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes = keyof TTypes,
>(input: RestInputWithModels<TTypes, TSelected>): TSelected[] {
  try {
    const models = getModelsFromInput(input);
    return Object.keys(models).filter(
      (key) => models[key as TSelected]
    ) as TSelected[];
  } catch {
    return [];
  }
}
