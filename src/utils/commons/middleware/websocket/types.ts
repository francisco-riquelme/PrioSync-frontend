import type { Context, APIGatewayProxyWebsocketEventV2 } from "aws-lambda";
import type { Middleware, MiddlewareChain } from "../middlewareChain";
import type {
  AmplifyOutputs,
  AmplifyModelType,
  QueryFactoryResult,
} from "../../queries/types";
import type * as yup from "yup";
import type { CacheConfig } from "../../queries/types";

/**
 * Enhanced error with middleware chain context
 *
 * Extends the standard Error interface with additional middleware-specific
 * information for debugging and error tracking in WebSocket middleware chains.
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
 * WebSocket event structure for API Gateway WebSocket APIs
 * Uses the official AWS Lambda WebSocket event type
 */
export type WebSocketEvent = APIGatewayProxyWebsocketEventV2;

/**
 * Standard WebSocket response structure
 *
 * Response format for WebSocket Lambda handlers, compatible with
 * API Gateway WebSocket API requirements.
 */
export interface WebSocketResponse {
  /** HTTP status code for the response */
  statusCode: number;
  /** Optional response headers */
  headers?: Record<string, string>;
  /** Response body (typically JSON string) */
  body: string;
  /** Whether the body is base64 encoded */
  isBase64Encoded?: boolean;
}

/**
 * Type alias for WebSocket model instance
 *
 * Represents a query factory result for a specific model type,
 * providing type-safe access to CRUD operations.
 *
 * @template T - Model name
 * @template Types - Available model types
 */
export type WebSocketModelInstance<
  T extends string = string,
  Types extends Record<T, AmplifyModelType> = Record<T, AmplifyModelType>,
> = QueryFactoryResult<T, Types>;

/**
 * Base WebSocket input structure
 *
 * Core input structure for WebSocket handlers containing the event
 * and Lambda execution context.
 */
export interface WebSocketBaseInput {
  /** WebSocket event from API Gateway */
  event: WebSocketEvent;
  /** Lambda execution context */
  context: Context;
}

/**
 * WebSocket input with initialized models
 *
 * Extended input structure that includes initialized Amplify Data models.
 * Used by handlers that require database access through query factories.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types that are initialized
 */
export interface WebSocketInputWithModels<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
> extends WebSocketBaseInput {
  /** Initialized query factories for selected models */
  models?: {
    [K in TSelected]: QueryFactoryResult<K, TTypes>;
  };
}

/**
 * IAM policy statement structure
 *
 * Represents a single statement in an IAM policy document,
 * used for WebSocket API authorization.
 */
export interface IAMPolicyStatement {
  /** Whether to allow or deny the action */
  Effect: "Allow" | "Deny";
  /** Action or actions to allow/deny */
  Action: string | string[];
  /** Resource or resources the action applies to */
  Resource: string | string[];
  /** Optional conditions for the statement */
  Condition?: Record<string, unknown>;
}

/**
 * IAM policy document structure
 *
 * Complete IAM policy document for WebSocket API authorization,
 * containing version information and policy statements.
 */
export interface IAMPolicyDocument {
  /** IAM policy language version */
  Version: string;
  /** Array of policy statements */
  Statement: IAMPolicyStatement[];
}

/**
 * WebSocket authorizer response structure
 *
 * Response format for WebSocket custom authorizer functions,
 * including principal ID, policy document, and optional context.
 */
export interface AuthorizerResponse {
  /** Unique identifier for the principal being authorized */
  principalId: string;
  /** IAM policy document defining permissions */
  policyDocument: IAMPolicyDocument;
  /** Optional context data passed to the handler */
  context?: Record<string, string | number | boolean>;
  /** Optional usage identifier for API throttling */
  usageIdentifierKey?: string;
}

/**
 * Union type for WebSocket handler return values
 *
 * WebSocket handlers can return either a standard response or
 * an authorizer response depending on the handler type.
 */
export type WebSocketHandlerReturn = WebSocketResponse | AuthorizerResponse;

/**
 * WebSocket-specific middleware chain type
 *
 * Type alias for middleware chains that work with WebSocket inputs
 * and return WebSocket-compatible responses.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types for this chain
 * @template TReturn - Expected return type of the chain
 */
export type WebSocketMiddlewareChain<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn = WebSocketHandlerReturn,
> = MiddlewareChain<WebSocketInputWithModels<TTypes, TSelected>, TReturn>;

/**
 * WebSocket-specific middleware function type
 *
 * Type alias for middleware functions that process WebSocket inputs
 * and can access initialized models.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types available to middleware
 * @template TReturn - Expected return type of the middleware chain
 */
export type WebSocketMiddleware<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn = WebSocketHandlerReturn,
> = Middleware<WebSocketInputWithModels<TTypes, TSelected>, TReturn>;

/**
 * Configuration for WebSocket model initializer middleware
 *
 * Defines the settings needed to initialize Amplify Data models
 * for use in WebSocket handlers.
 *
 * @template TSchema - Amplify Data schema type
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types to initialize
 */
export interface WebSocketModelInitializerConfig<
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
 * Configuration for WebSocket request logger middleware
 *
 * Controls logging behavior for WebSocket requests and responses,
 * including field exclusion and depth limits.
 */
export interface WebSocketRequestLoggerConfig {
  /** Maximum depth for object serialization */
  maxDepth?: number;
  /** Event fields to exclude from logs */
  excludeEventFields?: string[];
  /** Response fields to exclude from logs */
  excludeResponseFields?: string[];
  /** Default context added to all log entries */
  defaultContext?: Record<string, unknown>;
  /** Whether to log message body content */
  logMessageBody?: boolean;
}

/**
 * Configuration for WebSocket error handler middleware
 *
 * Settings for error handling behavior in WebSocket middleware chains.
 */
export interface WebSocketErrorHandlerConfig {
  /** Default context added to error logs */
  defaultContext?: Record<string, unknown>;
}

/**
 * Configuration for WebSocket request validation middleware
 *
 * Defines validation behavior for incoming WebSocket messages,
 * including schema validation and error handling.
 */
export interface WebSocketRequestValidationConfig {
  /** Yup schema for validating message body */
  bodySchema?: yup.Schema;
  /** Whether to remove unknown fields during validation */
  stripUnknown?: boolean;
  /** Whether to abort validation on first error */
  abortEarly?: boolean;
  /** Custom error message for validation failures */
  errorMessage?: string;
  /** Additional context for validation errors */
  errorContext?: Record<string, unknown>;
  /** Routes that require validation (defaults to all) */
  validateOnlyOnRoutes?: string[];
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
