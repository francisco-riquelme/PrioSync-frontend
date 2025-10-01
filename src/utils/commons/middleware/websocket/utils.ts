import { logger } from '../../log';
import type { WebSocketInputWithModels, WebSocketEvent } from './types';
import type { AmplifyModelType, QueryFactoryResult } from '../../queries/types';

/**
 * Build standardized log context for WebSocket operations
 *
 * Creates a consistent logging context object that includes essential WebSocket
 * connection information and Lambda execution details. This context is used
 * across all WebSocket middleware for structured logging.
 *
 * @template TTypes - Record of available Amplify model types
 * @param input - WebSocket input containing event and context
 * @param additionalContext - Extra context fields to include in the log context
 * @returns Standardized context object for logging
 *
 * @example
 * ```typescript
 * const context = buildWebSocketContext(input, {
 *   userId: 'user123',
 *   action: 'sendMessage'
 * });
 *
 * logger.info('Processing WebSocket request', context);
 * // Logs: connectionId, routeKey, eventType, messageId, requestId, etc.
 * ```
 */
export function buildWebSocketContext<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
>(
  input: WebSocketInputWithModels<TTypes>,
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  const { event, context } = input;
  const { requestContext } = event;

  return {
    ...additionalContext,
    connectionId: requestContext.connectionId,
    routeKey: requestContext.routeKey,
    eventType: requestContext.eventType,
    messageId: requestContext.messageId,
    requestId: context.awsRequestId,
    functionName: context.functionName,
    functionVersion: context.functionVersion,
  };
}

/**
 * Extract basic event information for logging
 *
 * Extracts essential WebSocket event information in a lightweight format
 * suitable for logging. Focuses on connection metadata and message presence
 * without parsing message content.
 *
 * @param event - WebSocket event to extract information from
 * @returns Basic event information object
 *
 * @example
 * ```typescript
 * const eventInfo = extractEventInfo(event);
 * console.log(eventInfo);
 * // Output: {
 * //   connectionId: "abc123",
 * //   routeKey: "$default",
 * //   eventType: "MESSAGE",
 * //   messageId: "msg456",
 * //   hasBody: true,
 * //   bodyLength: 150
 * // }
 * ```
 */
export function extractEventInfo(
  event: WebSocketEvent,
): Record<string, unknown> {
  const { requestContext, body } = event;

  return {
    connectionId: requestContext.connectionId,
    routeKey: requestContext.routeKey,
    eventType: requestContext.eventType,
    messageId: requestContext.messageId,
    hasBody: !!body,
    bodyLength: body?.length || 0,
  };
}

/**
 * Safely parse JSON body with error handling
 *
 * Attempts to parse a JSON string with comprehensive error handling and logging.
 * Returns null for empty bodies or parsing failures, with appropriate warning
 * logs for debugging.
 *
 * @param body - String body content to parse (may be undefined)
 * @param context - Logging context for error reporting
 * @returns Parsed JSON object, or null if parsing fails or body is empty
 *
 * @example
 * ```typescript
 * const context = buildWebSocketContext(input);
 * const messageData = parseJsonBody(event.body, context);
 *
 * if (messageData) {
 *   // Successfully parsed JSON
 *   console.log('Message:', messageData);
 * } else {
 *   // Handle parsing failure or empty body
 *   console.log('No valid JSON message');
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Handles various input scenarios:
 * parseJsonBody('{"action": "send"}', context);     // Returns: {action: "send"}
 * parseJsonBody('invalid json', context);           // Returns: null (logs warning)
 * parseJsonBody(undefined, context);                // Returns: null
 * parseJsonBody('', context);                       // Returns: null
 * ```
 */
export function parseJsonBody(
  body: string | undefined,
  context: Record<string, unknown>,
): unknown {
  if (!body) return null;

  try {
    return JSON.parse(body);
  } catch (error) {
    logger.warn('Failed to parse WebSocket message body', {
      ...context,
      bodyLength: body.length,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Setup structured logging for WebSocket middleware
 *
 * Initializes the logger with structured logging mode and sets up the logging
 * context with WebSocket-specific information. This ensures consistent logging
 * format across all WebSocket middleware and handlers.
 *
 * @template TTypes - Record of available Amplify model types
 * @param input - WebSocket input containing event and context
 * @param forceStructuredLogging - Whether to force enable structured logging
 * @param defaultContext - Default context fields to include in all logs
 *
 * @example
 * ```typescript
 * // Basic setup
 * setupStructuredLogging(input);
 *
 * // With custom context
 * setupStructuredLogging(input, true, {
 *   service: 'chat-api',
 *   version: '2.1.0'
 * });
 *
 * // All subsequent logger calls will include WebSocket context
 * logger.info('Message processed'); // Includes connectionId, routeKey, etc.
 * ```
 */
export function setupStructuredLogging<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
>(
  input: WebSocketInputWithModels<TTypes>,
  forceStructuredLogging: boolean = true,
  defaultContext: Record<string, unknown> = {},
): void {
  if (forceStructuredLogging && !logger.isStructuredLoggingEnabled()) {
    logger.setStructuredLogging(true);
  }

  logger.setContext({
    ...buildWebSocketContext(input, defaultContext),
  });
}

/**
 * Check if event is a MESSAGE type
 *
 * Determines whether the WebSocket event represents a message from a client
 * (as opposed to CONNECT or DISCONNECT events). Used for conditional logic
 * that should only execute for actual message processing.
 *
 * @param event - WebSocket event to check
 * @returns True if event is a MESSAGE type, false otherwise
 *
 * @example
 * ```typescript
 * if (isMessageEvent(event)) {
 *   // Process message content
 *   const messageData = parseJsonBody(event.body, context);
 *   await handleMessage(messageData);
 * } else {
 *   // Handle CONNECT/DISCONNECT events
 *   logger.info('Connection event', { eventType: event.requestContext.eventType });
 * }
 * ```
 */
export function isMessageEvent(event: WebSocketEvent): boolean {
  return event.requestContext.eventType === 'MESSAGE';
}

/**
 * Extract error message safely
 *
 * Safely extracts a string error message from any error value, handling
 * both Error objects and other thrown values. Provides consistent error
 * message formatting across the application.
 *
 * @param error - Error value of any type
 * @returns String representation of the error message
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   logger.error('Operation failed', { error: message });
 * }
 *
 * // Handles various error types:
 * getErrorMessage(new Error('Something went wrong'));  // "Something went wrong"
 * getErrorMessage('String error');                     // "String error"
 * getErrorMessage({ code: 'ERR_001' });               // "[object Object]"
 * getErrorMessage(null);                               // "null"
 * ```
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Get error stack trace if available
 *
 * Safely extracts the stack trace from an Error object. Returns undefined
 * for non-Error values or Error objects without stack traces. Useful for
 * detailed error logging and debugging.
 *
 * @param error - Error value that may contain a stack trace
 * @returns Stack trace string if available, undefined otherwise
 *
 * @example
 * ```typescript
 * try {
 *   await complexOperation();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   const stack = getErrorStack(error);
 *
 *   logger.error('Operation failed', {
 *     error: message,
 *     ...(stack && { stack })
 *   });
 * }
 * ```
 */
export function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

/**
 * Build error context with WebSocket information
 *
 * Creates a comprehensive error context that combines WebSocket connection
 * information with error-specific details. Used for consistent error logging
 * and reporting across WebSocket middleware.
 *
 * @template TTypes - Record of available Amplify model types
 * @param input - WebSocket input containing event and context
 * @param error - Error object containing code and status information
 * @param additionalContext - Extra context fields to include
 * @returns Complete error context for logging and reporting
 *
 * @example
 * ```typescript
 * // Basic error context
 * const errorContext = buildErrorContext(input, {
 *   code: 'VALIDATION_ERROR',
 *   statusCode: 400
 * });
 *
 * // With additional context
 * const detailedContext = buildErrorContext(input, error, {
 *   userId: 'user123',
 *   operation: 'sendMessage'
 * });
 *
 * logger.error('Request failed', detailedContext);
 * // Includes: connectionId, routeKey, errorCode, statusCode, userId, operation
 * ```
 *
 * @example
 * ```typescript
 * // Handle null error (no specific error details)
 * const baseContext = buildErrorContext(input, null, { source: 'validation' });
 * // Returns only WebSocket context + additional context
 * ```
 */
export function buildErrorContext<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
>(
  input: WebSocketInputWithModels<TTypes>,
  error: { code?: string; statusCode?: number } | null,
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  const baseContext = buildWebSocketContext(input, additionalContext);

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
 * Get all initialized models from WebSocket input
 *
 * Extracts the complete set of initialized Amplify Data models from the
 * WebSocket input object. Models must be available (added by WebSocketModelInitializer
 * middleware) or this function will throw an error.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types that are available
 * @param input - WebSocket input object containing models
 * @returns Object containing all initialized query factories
 * @throws {Error} When models are not available (middleware not used)
 */
export function getModelsFromInput<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  input: WebSocketInputWithModels<TTypes, TSelected>,
): {
  [K in TSelected]: QueryFactoryResult<K, TTypes>;
} {
  if (!input.models) {
    throw new Error(
      'Models not available. Ensure WebSocketModelInitializer middleware is used before this handler.',
    );
  }

  return input.models;
}

/**
 * Get a specific model from WebSocket input
 *
 * Extracts a single named model from the WebSocket input object. Provides
 * type-safe access to individual model query factories with runtime validation.
 *
 * @template T - Specific model name being requested
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types that are available
 * @param input - WebSocket input object containing models
 * @param modelName - Name of the specific model to retrieve
 * @returns Query factory for the requested model
 * @throws {Error} When the specific model is not found or models are not available
 */
export function getModelFromInput<
  T extends TSelected,
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  input: WebSocketInputWithModels<TTypes, TSelected>,
  modelName: T,
): QueryFactoryResult<T, TTypes> {
  const models = getModelsFromInput<TTypes, TSelected>(input);

  const model = models[modelName];
  if (!model) {
    const availableModels = Object.keys(models);
    throw new Error(
      `Model '${String(modelName)}' not found. Available models: ${availableModels.join(', ')}`,
    );
  }

  return model;
}

/**
 * Check if a specific model is available in WebSocket input
 *
 * Safely checks whether a named model is available and properly initialized
 * in the WebSocket input object. Returns false if models are not available
 * or the specific model is missing.
 *
 * @template T - Specific model name being checked
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types that are available
 * @param input - WebSocket input object that may contain models
 * @param modelName - Name of the model to check for availability
 * @returns True if the model is available, false otherwise
 */
export function hasModel<
  T extends TSelected,
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(input: WebSocketInputWithModels<TTypes, TSelected>, modelName: T): boolean {
  try {
    const models = getModelsFromInput<TTypes, TSelected>(input);
    return modelName in models && !!models[modelName];
  } catch {
    return false;
  }
}

/**
 * Get list of available model names from WebSocket input
 *
 * Returns an array of model names that are currently available and properly
 * initialized in the WebSocket input object. Useful for debugging, logging,
 * or dynamic model access patterns.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types that are available
 * @param input - WebSocket input object that may contain models
 * @returns Array of available model names, empty array if none available
 */
export function getAvailableModelNames<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(input: WebSocketInputWithModels<TTypes, TSelected>): TSelected[] {
  try {
    const models = getModelsFromInput<TTypes, TSelected>(input);
    return Object.keys(models).filter(
      key => models[key as TSelected],
    ) as TSelected[];
  } catch {
    return [];
  }
}
