import { logger } from '../../log';
import type { Context } from 'aws-lambda';
import {
  setupStructuredLoggingWith,
  buildErrorContextWith,
  getModelsFromInput as sharedGetModelsFromInput,
} from '../utils/common';
import type { InputWithModels } from '../utils/common';
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

  return {
    ...additionalContext,
    fieldName: event?.fieldName,
    parentTypeName: event?.typeName,
    requestId: context?.awsRequestId,
    functionName: context?.functionName,
    functionVersion: context?.functionVersion,
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
  const { arguments: args, identity } = event;

  return {
    fieldName: event.fieldName,
    parentTypeName: event.typeName,
    hasArguments: !!args && Object.keys(args).length > 0,
    argumentCount: args ? Object.keys(args).length : 0,
    hasIdentity: !!identity,
    username:
      identity && 'username' in identity ? identity.username : undefined,
    hasVariables: false, // Amplify events don't have variables in the same way
    variableCount: 0,
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
  type TSelected = keyof TTypes & string;
  type TArgs = Record<string, unknown>;
  type TSrc = Record<string, unknown> | null;
  const typedInput = input as unknown as InputWithModels<
    TTypes,
    TSelected,
    GraphQLEvent<TArgs, TSrc>,
    Context
  >;
  const buildContext = (
    i: InputWithModels<TTypes, TSelected, GraphQLEvent<TArgs, TSrc>, Context>,
    extra?: Record<string, unknown>,
  ) =>
    buildGraphQLContext(i as unknown as GraphQLInputWithModels<TTypes>, extra);
  setupStructuredLoggingWith<
    TTypes,
    TSelected,
    GraphQLEvent<TArgs, TSrc>,
    Context
  >(typedInput, buildContext, forceStructuredLogging, defaultContext);
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
  type TSelected = keyof TTypes & string;
  type TArgs = Record<string, unknown>;
  type TSrc = Record<string, unknown> | null;
  const typedInput = input as unknown as InputWithModels<
    TTypes,
    TSelected,
    GraphQLEvent<TArgs, TSrc>,
    Context
  >;
  const buildContext = (
    i: InputWithModels<TTypes, TSelected, GraphQLEvent<TArgs, TSrc>, Context>,
    extra?: Record<string, unknown>,
  ) =>
    buildGraphQLContext(i as unknown as GraphQLInputWithModels<TTypes>, extra);
  return buildErrorContextWith<
    TTypes,
    TSelected,
    GraphQLEvent<TArgs, TSrc>,
    Context
  >(typedInput, buildContext, error, additionalContext);
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
  type TArgs = Record<string, unknown>;
  type TSrc = Record<string, unknown> | null;
  const typedInput = input as unknown as InputWithModels<
    TTypes,
    TSelected,
    GraphQLEvent<TArgs, TSrc>,
    Context
  >;
  return sharedGetModelsFromInput<
    TTypes,
    TSelected,
    GraphQLEvent<TArgs, TSrc>,
    Context
  >(
    typedInput,
    'Models not available. Ensure GraphQLModelInitializer middleware is used before this handler.',
  ) as unknown as {
    [K in TSelected]: QueryFactoryResult<K, TTypes>;
  };
}
