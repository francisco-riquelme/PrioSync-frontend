import { logger } from '../../log';
import { sanitizeObject } from '../utils/sanitization';
import type { Middleware } from '../middlewareChain';
import type {
  GraphQLInputWithModels,
  GraphQLRequestLoggerConfig,
  GraphQLHandlerReturn,
} from './types';
import type { AmplifyModelType } from '../../queries/types';
import { extractEventInfo, setupStructuredLogging } from './utils';

function summarizeResponse(
  response: unknown,
  config: GraphQLRequestLoggerConfig,
): Record<string, unknown> {
  const { excludeResponseFields = [], maxDepth = 5 } = config;

  if (response === null) return { responseType: 'null', isNull: true };
  if (response === undefined)
    return { responseType: 'undefined', isUndefined: true };
  if (Array.isArray(response)) {
    return {
      responseType: 'array',
      isArray: true,
      length: response.length,
      sample:
        response.length > 0
          ? sanitizeObject(response[0] as Record<string, unknown>, {
              excludeFields: excludeResponseFields,
              maxDepth,
            })
          : undefined,
    };
  }
  if (typeof response === 'object') {
    return {
      responseType: 'object',
      isObject: true,
      response: sanitizeObject(response as Record<string, unknown>, {
        excludeFields: excludeResponseFields,
        maxDepth,
      }),
    };
  }
  return { responseType: typeof response, response };
}

function summarizeEvent<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  event: GraphQLInputWithModels<TTypes, TSelected>['event'],
  config: GraphQLRequestLoggerConfig,
): Record<string, unknown> {
  const {
    excludeEventFields = [],
    maxDepth = 5,
    logArguments = true,
    logIdentity = true,
  } = config;

  const base = extractEventInfo(event);
  const out: Record<string, unknown> = { ...base };

  if (logArguments && event?.arguments) {
    out.arguments = sanitizeObject(event.arguments, {
      excludeFields: excludeEventFields,
      maxDepth,
    });
  }

  if (logIdentity && event?.identity) {
    out.identity = sanitizeObject(event.identity, {
      excludeFields: excludeEventFields,
      maxDepth,
    });
  }

  return out;
}

export function createGraphQLRequestLogger<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn extends GraphQLHandlerReturn = GraphQLHandlerReturn,
>(
  config: GraphQLRequestLoggerConfig = {},
): Middleware<GraphQLInputWithModels<TTypes, TSelected>, TReturn> {
  const { defaultContext = {} } = config;

  return async (
    input: GraphQLInputWithModels<TTypes, TSelected>,
    next: () => Promise<TReturn>,
  ): Promise<TReturn> => {
    const start = Date.now();

    try {
      setupStructuredLogging(input as GraphQLInputWithModels<TTypes>, true, {
        ...defaultContext,
        middleware: 'GraphQLRequestLogger',
      });

      const eventInfo = summarizeEvent(input.event, config);
      logger.info('GraphQL request started', {
        event: eventInfo,
        timestamp: new Date().toISOString(),
      });

      const result = await next();
      const duration = Date.now() - start;

      const responseInfo = summarizeResponse(result, config);
      logger.info('GraphQL request completed', {
        response: responseInfo,
        duration,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - start;
      logger.error('GraphQL request failed', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        duration,
        success: false,
        middleware: 'GraphQLRequestLogger',
      });
      throw error;
    }
  };
}
