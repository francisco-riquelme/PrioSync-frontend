// Core middleware chain implementation
export {
  MiddlewareChain,
  wrapLambdaHandler,
  type Middleware,
  type MiddlewareError,
} from './middlewareChain';

// GraphQL middleware (namespaced exports)
export {
  // GraphQL functions
  createGraphQLErrorHandler,
  createGraphQLRequestLogger,
  createGraphQLModelInitializer,
  createGraphQLChain,
  wrapGraphQLResolver,

  // GraphQL types
  type GraphQLErrorHandlerConfig,
  type GraphQLRequestLoggerConfig,
  type GraphQLMiddlewareChain,
  type GraphQLMiddleware,
  type GraphQLEvent,
  type GraphQLResponse,
  type GraphQLHandlerReturn,
  type GraphQLInputWithModels,
  type GraphQLBaseInput,
  type GraphQLModelInitializerConfig,

  // GraphQL utilities (with prefix)
  buildGraphQLContext,
  setupStructuredLogging as setupGraphQLStructuredLogging,
  getModelsFromInput as getGraphQLModelsFromInput,
} from './graphql';

// REST middleware (namespaced exports)
export {
  // REST functions
  createRestErrorHandler,
  createRestRequestLogger,
  createRestRequestValidator,
  createRestModelInitializer,
  createRestChain,
  wrapRestHandler,
  getValidatedBody,
  getValidatedQuery,
  getValidatedPath,
  getValidatedHeaders,

  // REST types
  type RestErrorHandlerConfig,
  type RestRequestLoggerConfig,
  type RestRequestValidationConfig,
  type RestMiddlewareChain,
  type RestMiddleware,
  type RestEvent,
  type RestResponse,
  type RestHandlerReturn,
  type RestInputWithModels,
  type RestInputWithValidation,
  type ValidationErrorDetail as RestValidationErrorDetail,

  // REST utilities (with prefix)
  buildRestContext,
  extractEventInfo as extractRestEventInfo,
  setupStructuredLogging as setupRestStructuredLogging,
  getErrorMessage as getRestErrorMessage,
  getErrorStack as getRestErrorStack,
  parseJsonBody as parseRestJsonBody,
  getRequestId as getRestRequestId,
  buildErrorContext as buildRestErrorContext,
  getModelsFromInput as getRestModelsFromInput,
} from './rest';

// WebSocket middleware (namespaced exports)
export {
  // WebSocket functions
  createWebSocketErrorHandler,
  createWebSocketRequestLogger,
  createWebSocketRequestValidator,
  createWebSocketModelInitializer,
  createWebSocketChain,
  wrapWebSocketHandler,
  getValidatedMessage,

  // WebSocket types
  type WebSocketEvent,
  type WebSocketResponse,
  type WebSocketModelInstance,
  type WebSocketBaseInput,
  type WebSocketInputWithModels,
  type WebSocketMiddlewareChain,
  type WebSocketMiddleware,
  type WebSocketModelInitializerConfig,
  type WebSocketRequestLoggerConfig,
  type WebSocketErrorHandlerConfig,
  type WebSocketRequestValidationConfig,
  type ValidationErrorDetail as WebSocketValidationErrorDetail,

  // WebSocket utilities (with prefix)
  buildWebSocketContext,
  extractEventInfo as extractWebSocketEventInfo,
  parseJsonBody as parseWebSocketJsonBody,
  setupStructuredLogging as setupWebSocketStructuredLogging,
  isMessageEvent,
  getErrorMessage as getWebSocketErrorMessage,
  getErrorStack as getWebSocketErrorStack,
  buildErrorContext as buildWebSocketErrorContext,
  getModelsFromInput as getWebSocketModelsFromInput,
  getConnectionId,
} from './websocket';

// Utility functions
export { sanitizeObject, extractYupErrors, ValidationPatterns } from './utils';

// Type exports
export type {
  SanitizationConfig,
  BaseValidationConfig,
  ValidationPatternsType,
} from './utils';

// Add missing MiddlewareChainConfig export
export type { MiddlewareChainConfig } from './middlewareChain';
