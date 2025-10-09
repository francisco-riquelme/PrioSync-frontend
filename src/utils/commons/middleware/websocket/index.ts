/**
 * WebSocket Middleware Module
 *
 * This module provides a comprehensive set of middleware components for AWS API Gateway WebSocket APIs.
 * It includes error handling, request logging, validation, and middleware chain utilities
 * specifically designed for WebSocket connections.
 *
 * @module WebSocketMiddleware
 */

// WebSocket error handling
export { createWebSocketErrorHandler } from './WebSocketErrorHandler';

// WebSocket request logging
export { createWebSocketRequestLogger } from './WebSocketRequestLogger';

// WebSocket request validation
export {
  createWebSocketRequestValidator,
  getValidatedMessage,
} from './WebSocketRequestValidator';

// WebSocket model initialization
export { createWebSocketModelInitializer } from './WebSocketModelInitializer';

// WebSocket middleware chain
export {
  createWebSocketChain,
  wrapWebSocketHandler,
} from './WebSocketMiddlewareChain';

// WebSocket utilities
export {
  buildWebSocketContext,
  extractEventInfo,
  parseJsonBody,
  setupStructuredLogging,
  isMessageEvent,
  getConnectionId,
  getErrorMessage,
  getErrorStack,
  buildErrorContext,
  getModelsFromInput,
} from './utils';

// All WebSocket types
export type {
  // Core types
  WebSocketEvent,
  WebSocketResponse,
  WebSocketModelInstance,
  WebSocketBaseInput,
  WebSocketInputWithModels,

  // Middleware types
  WebSocketMiddlewareChain,
  WebSocketMiddleware,

  // Configuration types
  WebSocketModelInitializerConfig,
  WebSocketRequestLoggerConfig,
  WebSocketErrorHandlerConfig,
  WebSocketRequestValidationConfig,
  ValidationErrorDetail,
} from './types';
