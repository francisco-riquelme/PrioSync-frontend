import { isWebSocketError, WebSocketErrors } from '../../error';
import type { Middleware } from '../middlewareChain';
import type {
  WebSocketInputWithModels,
  WebSocketErrorHandlerConfig,
  MiddlewareError,
  WebSocketHandlerReturn,
} from './types';
import type { AmplifyModelType } from '../../queries/types';
import {
  buildErrorContext,
  setupStructuredLogging,
  getErrorMessage,
  getErrorStack,
} from './utils';

function isMiddlewareError(error: unknown): error is MiddlewareError {
  return (
    error instanceof Error &&
    typeof (error as MiddlewareError).middlewareName === 'string'
  );
}

function getMiddlewareInfo(error: MiddlewareError) {
  return {
    name: error.middlewareName || 'unknown',
    index: error.middlewareIndex ?? -1,
    total: error.totalMiddlewares ?? 0,
    chain: error.middlewareChain || [],
  };
}

export function createWebSocketErrorHandler<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TOutput = WebSocketHandlerReturn,
>(
  config: WebSocketErrorHandlerConfig = {},
): Middleware<WebSocketInputWithModels<TTypes, TSelected>, TOutput> {
  const { defaultContext = {} } = config;
  const environment = process.env.ENVIRONMENT || 'dev';
  const isDev = environment === 'dev';

  return async (
    input: WebSocketInputWithModels<TTypes, TSelected>,
    next: (
      input?: WebSocketInputWithModels<TTypes, TSelected>,
    ) => Promise<TOutput>,
  ): Promise<TOutput> => {
    setupStructuredLogging(
      input as unknown as WebSocketInputWithModels<
        Record<string, AmplifyModelType>,
        string
      >,
      true,
      defaultContext,
    );

    try {
      return await next(input);
    } catch (error) {
      const message = getErrorMessage(error);
      const stack = getErrorStack(error);

      if (isWebSocketError(error)) {
        throw WebSocketErrors.internal(error.message, {
          ...(isDev
            ? buildErrorContext(
                input as unknown as WebSocketInputWithModels<
                  Record<string, AmplifyModelType>,
                  string
                >,
                error,
                defaultContext,
              )
            : {}),
          originalError: error,
          ...(isDev && { stack }),
        });
      }

      if (isMiddlewareError(error)) {
        const middlewareInfo = getMiddlewareInfo(error);
        throw WebSocketErrors.internal(
          `Middleware error in ${middlewareInfo.name}`,
          {
            ...(isDev
              ? buildErrorContext(
                  input as unknown as WebSocketInputWithModels<
                    Record<string, AmplifyModelType>,
                    string
                  >,
                  null,
                  defaultContext,
                )
              : {}),
            middlewareName: middlewareInfo.name,
            middlewareIndex: middlewareInfo.index,
            totalMiddlewares: middlewareInfo.total,
            middlewareChain: middlewareInfo.chain,
            originalError: message,
            ...(isDev && { stack }),
          },
        );
      }

      throw WebSocketErrors.internal('Internal server error', {
        ...(isDev
          ? buildErrorContext(
              input as unknown as WebSocketInputWithModels<
                Record<string, AmplifyModelType>,
                string
              >,
              null,
              defaultContext,
            )
          : {}),
        originalError: message,
        errorType: error instanceof Error ? error.constructor.name : 'Unknown',
        ...(isDev && { stack }),
      });
    }
  };
}
