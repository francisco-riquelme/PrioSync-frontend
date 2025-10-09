import type { Context } from 'aws-lambda';
import type { Middleware, MiddlewareChain } from '../middlewareChain';
import type {
  AmplifyOutputs,
  AmplifyModelType,
  QueryFactoryResult,
} from '../../queries/types';
import type * as yup from 'yup';
import type { CacheConfig } from '../../queries/types';
import type { AmplifyGraphQlResolverEvent } from 'aws-lambda/trigger/amplify-resolver';

/**
 * Enhanced error with middleware chain context
 *
 * Extends the standard Error interface with additional middleware-specific
 * information for debugging and error tracking in GraphQL middleware chains.
 */
export interface MiddlewareError extends Error {
  /** Name of the middleware that threw the error */
  middlewareName?: string;
  /** Zero-based index of the middleware in the chain */
  middlewareIndex?: number;
  /** Total number of middlewares in the chain */
  totalMiddlewares?: number;
  /** Array of all middleware names in execution order */
  middlewareChain?: string[];
}

/**
 * GraphQL resolver event structure for AWS Amplify
 * Uses Amplify's native event type for better compatibility
 */
export type GraphQLEvent<
  TArguments = Record<string, unknown>,
  TSource = Record<string, unknown> | null,
> = AmplifyGraphQlResolverEvent<TArguments, TSource>;

/**
 * GraphQL resolver response structure
 *
 * Standard response format for GraphQL resolvers, can be any valid
 * GraphQL return type including scalars, objects, arrays, or null.
 */
export type GraphQLResponse = unknown;

/**
 * Type alias for GraphQL model instance
 *
 * Represents a query factory result for a specific model type,
 * providing type-safe access to CRUD operations.
 *
 * @template T - Model name
 * @template Types - Available model types
 */
export type GraphQLModelInstance<
  T extends string = string,
  Types extends Record<T, AmplifyModelType> = Record<T, AmplifyModelType>,
> = QueryFactoryResult<T, Types>;

/**
 * Base GraphQL input structure
 */
export interface GraphQLBaseInput<
  TArguments = Record<string, unknown>,
  TSource = Record<string, unknown> | null,
> {
  /** GraphQL resolver event from AppSync */
  event: GraphQLEvent<TArguments, TSource>;
  /** Lambda execution context */
  context: Context;
}

/**
 * GraphQL input with initialized models
 */
export interface GraphQLInputWithModels<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TArguments = Record<string, unknown>,
  TSource = Record<string, unknown> | null,
> extends GraphQLBaseInput<TArguments, TSource> {
  /** Initialized query factories for selected models */
  models?: {
    [K in TSelected]: QueryFactoryResult<K, TTypes>;
  };
}

/**
 * GraphQL input with validated arguments
 *
 * Extended input structure that includes validated GraphQL arguments.
 * Used by handlers that require input validation through Yup schemas.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types that are initialized
 */
export interface GraphQLInputWithValidation<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
> extends GraphQLInputWithModels<TTypes, TSelected> {
  /** Validated arguments object */
  validatedArguments?: Record<string, unknown>;
}

/**
 * Union type for GraphQL handler return values
 *
 * GraphQL handlers can return any valid GraphQL response type.
 */
export type GraphQLHandlerReturn = GraphQLResponse;

/**
 * GraphQL-specific middleware chain type
 *
 * Type alias for middleware chains that work with GraphQL inputs
 * and return GraphQL-compatible responses.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types for this chain
 * @template TReturn - Expected return type of the chain
 */
export type GraphQLMiddlewareChain<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn = GraphQLHandlerReturn,
> = MiddlewareChain<GraphQLInputWithModels<TTypes, TSelected>, TReturn>;

/**
 * GraphQL-specific middleware function type
 *
 * Type alias for middleware functions that process GraphQL inputs
 * and can access initialized models.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types available to middleware
 * @template TReturn - Expected return type of the middleware chain
 */
export type GraphQLMiddleware<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn = GraphQLHandlerReturn,
> = Middleware<GraphQLInputWithModels<TTypes, TSelected>, TReturn>;

/**
 * Configuration for GraphQL model initializer middleware
 *
 * Defines the settings needed to initialize Amplify Data models
 * for use in GraphQL resolvers.
 *
 * @template TSchema - Amplify Data schema type
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types to initialize
 */
export interface GraphQLModelInitializerConfig<
  TSchema extends { models: Record<string, unknown> },
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
> {
  /** Amplify Data schema definition */
  schema: TSchema;
  /** Amplify backend configuration outputs */
  amplifyOutputs: AmplifyOutputs;
  /** Specific entities to initialize (defaults to all) */
  entities?: readonly TSelected[];
  /** Optional client identifier for connection pooling */
  clientKey?: string;
  /** Connection timeout in milliseconds */
  timeout?: number;
  /** Cache configuration for read operations */
  cache?: CacheConfig;
}

/**
 * Configuration for GraphQL request logger middleware
 *
 * Controls logging behavior for GraphQL requests and responses,
 * including field exclusion and depth limits.
 */
export interface GraphQLRequestLoggerConfig {
  /** Maximum depth for object serialization */
  maxDepth?: number;
  /** Event fields to exclude from logs */
  excludeEventFields?: string[];
  /** Response fields to exclude from logs */
  excludeResponseFields?: string[];
  /** Default context added to all log entries */
  defaultContext?: Record<string, unknown>;
  /** Whether to log GraphQL arguments */
  logArguments?: boolean;
  /** Whether to log GraphQL variables */
  logVariables?: boolean;
  /** Whether to log identity information */
  logIdentity?: boolean;
  /** Whether to log the selection set */
  logSelectionSet?: boolean;
}

/**
 * Configuration for GraphQL request validation middleware
 *
 * Defines validation behavior for incoming GraphQL arguments,
 * including schema validation and error handling.
 */
export interface GraphQLRequestValidationConfig {
  /** Yup schema for validating arguments */
  argumentsSchema?: yup.Schema;
  /** Yup schema for validating variables */
  variablesSchema?: yup.Schema;
  /** Whether to remove unknown fields during validation */
  stripUnknown?: boolean;
  /** Whether to abort validation on first error */
  abortEarly?: boolean;
  /** Custom error message for validation failures */
  errorMessage?: string;
  /** Additional context for validation errors */
  errorContext?: Record<string, unknown>;
  /** Fields that require validation (defaults to all) */
  validateOnlyFields?: string[];
  /** Whether to log when validation is skipped */
  logValidationSkipped?: boolean;
  /** Whether to log validation errors */
  logValidationErrors?: boolean;
}

/**
 * Detailed validation error information
 *
 * Structured information about individual validation failures,
 * used for detailed error reporting.
 */
export interface ValidationErrorDetail {
  /** Field name that failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
  /** Value that caused the validation failure */
  value: unknown;
  /** Type of validation that failed */
  type: string;
}

// Add utility types to extract handler signature
export type ExtractHandlerEvent<T> = T extends (
  event: infer E,
  context: Context,
) => unknown
  ? E
  : never;

export type ExtractHandlerReturn<T> = T extends (
  event: unknown,
  context: Context,
) => Promise<infer R>
  ? R
  : never;

export type ExtractHandlerArguments<T> =
  ExtractHandlerEvent<T> extends AmplifyGraphQlResolverEvent<infer A, unknown>
    ? A
    : Record<string, unknown>;

export type ExtractHandlerSource<T> =
  ExtractHandlerEvent<T> extends AmplifyGraphQlResolverEvent<unknown, infer S>
    ? S
    : Record<string, unknown> | null;
