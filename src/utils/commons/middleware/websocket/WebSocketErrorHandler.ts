import { isWebSocketError, WebSocketErrors } from '../../error';
import type { Middleware } from '../middlewareChain';
import type {
  WebSocketInputWithModels,
  WebSocketErrorHandlerConfig,
  MiddlewareError,
  WebSocketResponse,
} from './types';
import type { AmplifyModelType } from '../../queries/types';
import { buildWebSocketContext } from './utils';
import {
  buildErrorContextWith,
  setupStructuredLoggingWith,
  getErrorMessage,
  getErrorStack,
} from '../utils/common';
import type { Context } from 'aws-lambda';
import type { WebSocketEvent } from './types';
import type { InputWithModels } from '../utils/common';

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
  TOutput = WebSocketResponse,
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
    const typedInput = input as unknown as InputWithModels<
      Record<string, AmplifyModelType>,
      string,
      WebSocketEvent,
      Context
    >;

    setupStructuredLoggingWith<
      Record<string, AmplifyModelType>,
      string,
      WebSocketEvent,
      Context
    >(
      typedInput,
      (i, extra) =>
        buildWebSocketContext(
          i as unknown as WebSocketInputWithModels<
            Record<string, AmplifyModelType>,
            string
          >,
          extra,
        ),
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
            ? buildErrorContextWith<
                Record<string, AmplifyModelType>,
                string,
                WebSocketEvent,
                Context
              >(
                typedInput,
                (i, extra) =>
                  buildWebSocketContext(
                    i as unknown as WebSocketInputWithModels<
                      Record<string, AmplifyModelType>,
                      string
                    >,
                    extra,
                  ),
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
              ? buildErrorContextWith<
                  Record<string, AmplifyModelType>,
                  string,
                  WebSocketEvent,
                  Context
                >(
                  typedInput,
                  (i, extra) =>
                    buildWebSocketContext(
                      i as unknown as WebSocketInputWithModels<
                        Record<string, AmplifyModelType>,
                        string
                      >,
                      extra,
                    ),
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
          ? buildErrorContextWith<
              Record<string, AmplifyModelType>,
              string,
              WebSocketEvent,
              Context
            >(
              typedInput,
              (i, extra) =>
                buildWebSocketContext(
                  i as unknown as WebSocketInputWithModels<
                    Record<string, AmplifyModelType>,
                    string
                  >,
                  extra,
                ),
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
