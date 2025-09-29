import type { Middleware } from '../middlewareChain';
import type {
  RestResponse,
  RestInputWithModels,
  RestErrorHandlerConfig,
  MiddlewareError,
} from './types';
import type { AmplifyModelType } from '../../queries/types';
import {
  isRestError,
  createRestErrorResponse,
  type RestError,
} from './RestErrors';
import {
  buildErrorContext,
  setupStructuredLogging,
  getErrorMessage,
  getErrorStack,
  getRequestId,
} from './utils';
import { logger } from '../../log';

/**
 * Checks if an error is a middleware-specific error
 */
function isMiddlewareError(error: unknown): error is MiddlewareError {
  return (
    error instanceof Error &&
    typeof (error as MiddlewareError).middlewareName === 'string'
  );
}

/**
 * Extracts middleware information from middleware errors
 */
function getMiddlewareInfo(error: MiddlewareError) {
  return {
    name: error.middlewareName || 'unknown',
    index: error.middlewareIndex ?? -1,
    total: error.totalMiddlewares ?? 0,
    chain: error.middlewareChain || [],
  };
}

/**
 * Checks if error was already logged by the error library
 */
function wasErrorAlreadyLogged(error: unknown): boolean {
  return (
    error instanceof Error &&
    '__fromErrorLibrary' in error &&
    (error as Error & { __fromErrorLibrary?: boolean }).__fromErrorLibrary ===
      true
  );
}

/**
 * Error handling context
 */
interface ErrorHandlingContext {
  input: RestInputWithModels;
  requestId: string;
  defaultContext: Record<string, unknown>;
  isDev: boolean;
  wasAlreadyLogged: boolean;
}

/**
 * Handles REST error processing and response creation
 */
function handleRestError<TOutput>(
  error: RestError,
  context: ErrorHandlingContext,
): TOutput {
  const { input, requestId, defaultContext, isDev, wasAlreadyLogged } = context;

  if (!wasAlreadyLogged) {
    logger.error('REST error occurred', {
      ...(isDev ? buildErrorContext(input, error, defaultContext) : {}),
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      ...(isDev && { stack: getErrorStack(error) }),
    });
  }

  return createRestErrorResponse(error, requestId) as TOutput;
}

/**
 * Handles middleware error processing and response creation
 */
function handleMiddlewareError<TOutput>(
  error: MiddlewareError,
  context: ErrorHandlingContext,
): TOutput {
  const { input, requestId, defaultContext, isDev, wasAlreadyLogged } = context;
  const middlewareInfo = getMiddlewareInfo(error);
  const message = getErrorMessage(error);
  const stack = getErrorStack(error);

  if (!wasAlreadyLogged) {
    logger.error('Middleware error occurred', {
      ...(isDev ? buildErrorContext(input, null, defaultContext) : {}),
      middlewareName: middlewareInfo.name,
      middlewareIndex: middlewareInfo.index,
      totalMiddlewares: middlewareInfo.total,
      middlewareChain: middlewareInfo.chain,
      originalError: message,
      ...(isDev && { stack }),
    });
  }

  const restError: RestError = {
    name: 'MiddlewareError',
    message: `Middleware error in ${middlewareInfo.name}`,
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    context: {
      ...buildErrorContext(input, null, defaultContext),
      middlewareName: middlewareInfo.name,
      middlewareIndex: middlewareInfo.index,
      totalMiddlewares: middlewareInfo.total,
      middlewareChain: middlewareInfo.chain,
    },
    originalError: error,
  };

  return createRestErrorResponse(restError, requestId) as TOutput;
}

/**
 * Handles application error processing and response creation
 */
function handleApplicationError<TOutput>(
  error: unknown,
  context: ErrorHandlingContext,
): TOutput {
  const { input, requestId, defaultContext, isDev, wasAlreadyLogged } = context;
  const message = getErrorMessage(error);
  const stack = getErrorStack(error);

  if (!wasAlreadyLogged) {
    logger.error('Application error occurred', {
      ...(isDev ? buildErrorContext(input, null, defaultContext) : {}),
      originalError: message,
      errorType: error instanceof Error ? error.constructor.name : 'Unknown',
      ...(isDev && { stack }),
    });
  }

  const restError: RestError = {
    name: 'ApplicationError',
    message: message,
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    context: {
      ...buildErrorContext(input, null, defaultContext),
    },
    originalError: error,
  };

  return createRestErrorResponse(restError, requestId) as TOutput;
}

/**
 * Creates REST error handler middleware
 *
 * Creates a middleware function that catches and processes all errors
 * in the middleware chain, converting them to appropriate HTTP responses.
 * Uses REST error code mapping for graceful error handling.
 */
export function createRestErrorHandler<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
  TOutput = RestResponse,
>(
  config: RestErrorHandlerConfig = {},
): Middleware<RestInputWithModels<TTypes, TSelected>, TOutput> {
  const { defaultContext = {} } = config;
  const environment = process.env.ENVIRONMENT || 'dev';
  const isDev = environment === 'dev';

  return async (
    input: RestInputWithModels<TTypes, TSelected>,
    next: (input?: RestInputWithModels<TTypes, TSelected>) => Promise<TOutput>,
  ): Promise<TOutput> => {
    setupStructuredLogging(input, true, defaultContext);
    const requestId = getRequestId(input.event, input.context);

    try {
      return await next(input);
    } catch (error) {
      const context: ErrorHandlingContext = {
        input,
        requestId,
        defaultContext,
        isDev,
        wasAlreadyLogged: wasErrorAlreadyLogged(error),
      };

      if (isRestError(error)) {
        return handleRestError(error, context);
      }

      if (isMiddlewareError(error)) {
        return handleMiddlewareError(error, context);
      }

      return handleApplicationError(error, context);
    }
  };
}
