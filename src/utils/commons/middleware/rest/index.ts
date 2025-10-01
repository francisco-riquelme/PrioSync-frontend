/**
 * REST Middleware Module
 *
 * Comprehensive middleware components for AWS API Gateway REST APIs including
 * error handling, request logging, validation, middleware chain utilities, and
 * model initialization.
 *
 * @example
 * ```typescript
 * import {
 *   createRestChain,
 *   createRestErrorHandler,
 *   createRestRequestLogger,
 *   createRestRequestValidator,
 *   createRestModelInitializer
 * } from '@your-org/shared-utilities/middleware/rest';
 *
 * // Create middleware chain
 * const chain = createRestChain<MyModelTypes>();
 *
 * // Add middleware
 * chain.use('errorHandler', createRestErrorHandler());
 * chain.use('logger', createRestRequestLogger());
 * chain.use('validator', createRestRequestValidator({ body: mySchema }));
 * chain.use('models', createRestModelInitializer(modelConfig));
 *
 * // Export Lambda handler
 * export const handler = wrapRestHandler(chain, myHandler);
 * ```
 *
 * @module RestMiddleware
 */

export { createRestErrorHandler } from './RestErrorHandler';

export { createRestRequestLogger } from './RestRequestLogger';

export {
  createRestRequestValidator,
  getValidatedBody,
  getValidatedQuery,
  getValidatedPath,
  getValidatedHeaders,
} from './RestRequestValidator';

export { ValidationPatterns } from '../utils/validation';

export { createRestModelInitializer } from './RestModelInitializer';

export { createRestChain, wrapRestHandler } from './RestMiddlewareChain';

export {
  buildRestContext,
  extractEventInfo,
  setupStructuredLogging,
  getErrorMessage,
  getErrorStack,
  parseJsonBody,
  parseJsonBodyWithFallback,
  createValidationError,
  getRequestId,
  buildErrorContext,
  createSuccessResponse,
  createErrorResponse,
  HTTP_STATUS,
  ERROR_CODES,
  isDevelopment,
  initializeRestMiddleware,
  getModelsFromInput,
  getModelFromInput,
  hasModel,
  getAvailableModelNames,
} from './utils';

export {
  RestErrors,
  RestErrorCodes,
  createRestErrorResponse,
  isRestError,
  isKnownRestErrorCode,
  throwRestError,
} from './RestErrors';

export type {
  RestErrorHandlerConfig,
  RestRequestLoggerConfig,
  RestRequestValidationConfig,
  RestMiddlewareChain,
  RestMiddleware,
  RestEvent,
  RestResponse,
  RestHandlerReturn,
  RestInputWithModels,
  RestInputWithValidation,
  ValidationErrorDetail,
} from './types';

export type { RestError, RestErrorContext } from './RestErrors';

export {
  throwError,
  extractErrorMessage,
  createErrorContext,
} from '../../error';
