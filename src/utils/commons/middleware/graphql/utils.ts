import { logger } from '../../log';
import type { GraphQLInputWithModels, GraphQLEvent } from './types';
import type { AmplifyModelType, QueryFactoryResult } from '../../queries/types';

/**
 * Build standardized log context for GraphQL operations
 *
 * Creates a consistent logging context object that includes essential GraphQL
 * operation information and Lambda execution details. This context is used
 * across all GraphQL middleware for structured logging.
 *
 * @template TTypes - Record of available Amplify model types
 * @param input - GraphQL input containing event and context
 * @param additionalContext - Extra context fields to include in the log context
 * @returns Standardized context object for logging
 *
 * @example
 * ```typescript
 * const context = buildGraphQLContext(input, {
 *   userId: 'user123',
 *   operation: 'getUser'
 * });
 *
 * logger.info('Processing GraphQL request', context);
 * // Logs: fieldName, parentTypeName, requestId, functionName, etc.
 * ```
 */
export function buildGraphQLContext<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
>(
  input: GraphQLInputWithModels<TTypes>,
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  const { event, context } = input;
  const { info, identity } = event;

  return {
    ...additionalContext,
    fieldName: info.fieldName,
    parentTypeName: info.parentTypeName,
    username:
      identity && 'username' in identity ? identity.username : undefined,
    sub: identity && 'sub' in identity ? identity.sub : undefined,
    cognitoIdentityId:
      identity && 'cognitoIdentityId' in identity
        ? identity.cognitoIdentityId
        : undefined,
    requestId: context.awsRequestId,
    functionName: context.functionName,
    functionVersion: context.functionVersion,
  };
}

/**
 * Extract basic event information for logging
 *
 * Extracts essential GraphQL event information in a lightweight format
 * suitable for logging. Focuses on operation metadata and identity
 * without exposing sensitive argument data.
 *
 * @param event - GraphQL event to extract information from
 * @returns Basic event information object
 *
 */
export function extractEventInfo(event: GraphQLEvent): Record<string, unknown> {
  const { info, arguments: args, identity } = event;

  return {
    fieldName: info.fieldName,
    parentTypeName: info.parentTypeName,
    hasArguments: !!args && Object.keys(args).length > 0,
    argumentCount: args ? Object.keys(args).length : 0,
    hasIdentity: !!identity,
    username:
      identity && 'username' in identity ? identity.username : undefined,
    hasVariables: !!info.variables && Object.keys(info.variables).length > 0,
    variableCount: info.variables ? Object.keys(info.variables).length : 0,
  };
}

/**
 * Safely parse and validate arguments with error handling
 *
 * Attempts to safely access and validate GraphQL arguments with comprehensive
 * error handling and logging. Returns null for missing arguments with appropriate
 * warning logs for debugging.
 *
 * @param event - GraphQL event containing arguments
 * @param context - Logging context for error reporting
 * @returns Arguments object, or null if not available
 */
export function extractArguments(
  event: GraphQLEvent,
  context: Record<string, unknown>,
): Record<string, unknown> | null {
  if (!event.arguments || Object.keys(event.arguments).length === 0) {
    logger.debug('No arguments provided for GraphQL operation', context);
    return null;
  }

  try {
    return event.arguments;
  } catch (error) {
    logger.warn('Failed to extract GraphQL arguments', {
      ...context,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Setup structured logging for GraphQL middleware
 *
 * Initializes the logger with structured logging mode and sets up the logging
 * context with GraphQL-specific information. This ensures consistent logging
 * format across all GraphQL middleware and resolvers.
 *
 * @template TTypes - Record of available Amplify model types
 * @param input - GraphQL input containing event and context
 * @param forceStructuredLogging - Whether to force enable structured logging
 * @param defaultContext - Default context fields to include in all logs
 *
 */
export function setupStructuredLogging<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
>(
  input: GraphQLInputWithModels<TTypes>,
  forceStructuredLogging: boolean = true,
  defaultContext: Record<string, unknown> = {},
): void {
  if (forceStructuredLogging && !logger.isStructuredLoggingEnabled()) {
    logger.setStructuredLogging(true);
  }

  logger.setContext({
    ...buildGraphQLContext(input, defaultContext),
  });
}

/**
 * Check if event contains arguments
 *
 * Determines whether the GraphQL event contains any arguments from the client.
 * Used for conditional logic that should only execute when arguments are present.
 *
 * @param event - GraphQL event to check
 * @returns True if event has arguments, false otherwise
 */
export function hasArguments(event: GraphQLEvent): boolean {
  return !!event.arguments && Object.keys(event.arguments).length > 0;
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
 */
export function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

/**
 * Build error context with GraphQL information
 *
 * Creates a comprehensive error context that combines GraphQL operation
 * information with error-specific details. Used for consistent error logging
 * and reporting across GraphQL middleware.
 *
 * @template TTypes - Record of available Amplify model types
 * @param input - GraphQL input containing event and context
 * @param error - Error object containing code and status information
 * @param additionalContext - Extra context fields to include
 * @returns Complete error context for logging and reporting
 *
 */
export function buildErrorContext<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
>(
  input: GraphQLInputWithModels<TTypes>,
  error: { code?: string; statusCode?: number } | null,
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  const baseContext = buildGraphQLContext(input, additionalContext);

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
 * Get all initialized models from GraphQL input
 *
 * Extracts the complete set of initialized Amplify Data models from the
 * GraphQL input object. Models must be available (added by GraphQLModelInitializer
 * middleware) or this function will throw an error.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types that are available
 * @param input - GraphQL input object containing models
 * @returns Object containing all initialized query factories
 * @throws {Error} When models are not available (middleware not used)
 */
export function getModelsFromInput<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  input: GraphQLInputWithModels<TTypes, TSelected>,
): {
  [K in TSelected]: QueryFactoryResult<K, TTypes>;
} {
  if (!input.models) {
    throw new Error(
      'Models not available. Ensure GraphQLModelInitializer middleware is used before this handler.',
    );
  }

  return input.models;
}

/**
 * Get a specific model from GraphQL input
 *
 * Extracts a single named model from the GraphQL input object. Provides
 * type-safe access to individual model query factories with runtime validation.
 *
 * @template T - Specific model name being requested
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types that are available
 * @param input - GraphQL input object containing models
 * @param modelName - Name of the specific model to retrieve
 * @returns Query factory for the requested model
 * @throws {Error} When the specific model is not found or models are not available
 */
export function getModelFromInput<
  T extends TSelected,
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  input: GraphQLInputWithModels<TTypes, TSelected>,
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
 * Check if a specific model is available in GraphQL input
 *
 * Safely checks whether a named model is available and properly initialized
 * in the GraphQL input object. Returns false if models are not available
 * or the specific model is missing.
 *
 * @template T - Specific model name being checked
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types that are available
 * @param input - GraphQL input object that may contain models
 * @param modelName - Name of the model to check for availability
 * @returns True if the model is available, false otherwise
 */
export function hasModel<
  T extends TSelected,
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(input: GraphQLInputWithModels<TTypes, TSelected>, modelName: T): boolean {
  try {
    const models = getModelsFromInput<TTypes, TSelected>(input);
    return modelName in models && !!models[modelName];
  } catch {
    return false;
  }
}

/**
 * Get list of available model names from GraphQL input
 *
 * Returns an array of model names that are currently available and properly
 * initialized in the GraphQL input object. Useful for debugging, logging,
 * or dynamic model access patterns.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types that are available
 * @param input - GraphQL input object that may contain models
 * @returns Array of available model names, empty array if none available
 */
export function getAvailableModelNames<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(input: GraphQLInputWithModels<TTypes, TSelected>): TSelected[] {
  try {
    const models = getModelsFromInput<TTypes, TSelected>(input);
    return Object.keys(models).filter(
      key => models[key as TSelected],
    ) as TSelected[];
  } catch {
    return [];
  }
}
