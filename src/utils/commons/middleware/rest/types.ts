import type {
  Context,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import type { Middleware, MiddlewareChain } from '../middlewareChain';
import type {
  AmplifyOutputs,
  AmplifyModelType,
  QueryFactoryResult,
} from '../../queries/types';
import type * as yup from 'yup';
import type { CacheConfig } from '../../queries/types';

/**
 * Extended Error interface for middleware-specific error information
 *
 * Provides additional context about which middleware failed and
 * the position within the middleware chain execution.
 */
export interface MiddlewareError extends Error {
  /** Name of the middleware that threw the error */
  middlewareName?: string;
  /** Index position of the failed middleware in the chain */
  middlewareIndex?: number;
  /** Total number of middlewares in the chain */
  totalMiddlewares?: number;
  /** Array of middleware names in execution order */
  middlewareChain?: string[];
}

/**
 * Core REST event type alias for API Gateway proxy events
 */
export type RestEvent = APIGatewayProxyEvent;

/**
 * Core REST response type alias for API Gateway proxy results
 */
export type RestResponse = APIGatewayProxyResult;

/**
 * Return type for REST handlers
 */
export type RestHandlerReturn = RestResponse;

/**
 * Base input interface for REST middleware operations
 *
 * Contains the essential Lambda context and API Gateway event
 * required by all REST middleware functions.
 */
export interface RestBaseInput {
  /** API Gateway proxy event containing request data */
  event: RestEvent;
  /** Lambda execution context */
  context: Context;
}

/**
 * Extended REST input interface with Amplify Data models
 *
 * Provides type-safe access to initialized database models
 * through the middleware chain.
 *
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 */
export interface RestInputWithModels<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
> extends RestBaseInput {
  /** Initialized QueryFactory instances for selected models */
  models?: {
    [K in TSelected]: QueryFactoryResult<K & string, TTypes>;
  };
}

/**
 * Extended REST input interface with validated request data
 *
 * Stores validated and parsed request data from validation middleware
 * for type-safe access in downstream handlers.
 */
export interface RestInputWithValidation extends RestBaseInput {
  /** Validated and parsed request body */
  validatedBody?: unknown;
  /** Validated query string parameters */
  validatedQuery?: unknown;
  /** Validated path parameters */
  validatedPath?: unknown;
  /** Validated request headers */
  validatedHeaders?: unknown;
}

/**
 * Type-safe REST middleware chain interface
 *
 * Provides a composable middleware execution chain with
 * support for Amplify Data models and custom return types.
 *
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 * @template TReturn - Handler return type
 */
export type RestMiddlewareChain<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
  TReturn = RestHandlerReturn,
> = MiddlewareChain<RestInputWithModels<TTypes, TSelected>, TReturn>;

/**
 * Type-safe REST middleware function interface
 *
 * Defines the signature for individual middleware functions
 * in the REST middleware chain.
 *
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 * @template TReturn - Handler return type
 */
export type RestMiddleware<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
  TReturn = RestHandlerReturn,
> = Middleware<RestInputWithModels<TTypes, TSelected>, TReturn>;

/**
 * Configuration interface for REST model initializer middleware
 *
 * Defines settings for initializing Amplify Data models
 * within the middleware chain.
 *
 * @template TSchema - Amplify Data schema type
 * @template TTypes - Record of available model types from schema
 * @template TSelected - Subset of model types to initialize
 */
export interface RestModelInitializerConfig<
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
 * Configuration interface for REST request logger middleware
 *
 * Controls logging behavior for request and response data
 * including field exclusion and sanitization settings.
 */
export interface RestRequestLoggerConfig {
  /** Maximum object nesting depth for serialization */
  maxDepth?: number;
  /** Event fields to exclude from logs */
  excludeEventFields?: string[];
  /** Response fields to exclude from logs */
  excludeResponseFields?: string[];
  /** Default context to include in all log entries */
  defaultContext?: Record<string, unknown>;
}

/**
 * Configuration interface for REST error handler middleware
 *
 * Defines settings for error processing and context generation.
 */
export interface RestErrorHandlerConfig {
  /** Default context to include in error logs */
  defaultContext?: Record<string, unknown>;
}

/**
 * Configuration interface for REST request validation middleware
 *
 * Defines Yup schemas and validation options for different
 * parts of the HTTP request.
 */
export interface RestRequestValidationConfig {
  /** Yup schema for request body validation */
  bodySchema?: yup.Schema;
  /** Yup schema for query parameter validation */
  querySchema?: yup.Schema;
  /** Yup schema for path parameter validation */
  pathSchema?: yup.Schema;
  /** Yup schema for header validation */
  headersSchema?: yup.Schema;
  /** Remove unknown fields from validated data */
  stripUnknown?: boolean;
  /** Stop validation on first error */
  abortEarly?: boolean;
  /** Custom error message for validation failures */
  errorMessage?: string;
  /** Additional context to include in validation errors */
  errorContext?: Record<string, unknown>;
  /** Whether to log validation errors */
  logValidationErrors?: boolean;
}

/**
 * Detailed validation error information
 *
 * Provides specific information about individual field
 * validation failures for detailed error reporting.
 */
export interface ValidationErrorDetail {
  /** Name of the field that failed validation */
  field: string;
  /** Validation error message */
  message: string;
  /** Value that failed validation */
  value: unknown;
  /** Type of validation that failed */
  type: string;
}
