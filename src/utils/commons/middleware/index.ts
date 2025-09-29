// Core middleware chain implementation
export {
  MiddlewareChain,
  wrapLambdaHandler,
  type Middleware,
  type MiddlewareError,
} from './middlewareChain';

// GraphQL middleware
export * from './graphql';

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
  getModelsFromInput as getRestModelsFromInput,
  getModelFromInput as getRestModelFromInput,
  hasModel as hasRestModel,
  getAvailableModelNames as getRestAvailableModelNames,

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
  parseJsonBodyWithFallback as parseRestJsonBodyWithFallback,
  createValidationError as createRestValidationError,
  getRequestId as getRestRequestId,
  buildErrorContext as buildRestErrorContext,
  createSuccessResponse as createRestSuccessResponse,
  createErrorResponse as createRestErrorResponse,
  HTTP_STATUS as REST_HTTP_STATUS,
  ERROR_CODES as REST_ERROR_CODES,
  isDevelopment as isRestDevelopment,
  initializeRestMiddleware as initializeRestMiddleware,
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
  createAllowPolicy,
  createDenyPolicy,
  getValidatedMessage,

  // WebSocket types
  type WebSocketEvent,
  type WebSocketResponse,
  type WebSocketModelInstance,
  type WebSocketBaseInput,
  type WebSocketInputWithModels,
  type WebSocketHandlerReturn,
  type IAMPolicyDocument,
  type IAMPolicyStatement,
  type AuthorizerResponse,
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
  getModelFromInput as getWebSocketModelFromInput,
  hasModel as hasWebSocketModel,
  getAvailableModelNames as getWebSocketAvailableModelNames,
} from './websocket';

// Utility functions
export { sanitizeObject, extractYupErrors, ValidationPatterns } from './utils';

// Type exports
export type {
  SanitizationConfig,
  BaseValidationConfig,
  ValidationPatternsType, // Add this type export
} from './utils';

// Add missing MiddlewareChainConfig export
export type { MiddlewareChainConfig } from './middlewareChain';
