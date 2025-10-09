import { logger } from '../../log';
import { sanitizeObject } from '../utils/sanitization';
import type { Middleware } from '../middlewareChain';
import type {
  RestResponse,
  RestInputWithModels,
  RestRequestLoggerConfig,
} from './types';
import type { AmplifyModelType } from '../../queries/types';
import { extractEventInfo, setupStructuredLogging } from './utils';

function summarizeResponse(
  response: unknown,
  config: RestRequestLoggerConfig,
): Record<string, unknown> {
  const { excludeResponseFields = [], maxDepth = 6 } = config;

  if (
    response &&
    typeof response === 'object' &&
    'statusCode' in response &&
    'body' in response
  ) {
    const r = response as RestResponse;
    const info: Record<string, unknown> = {
      statusCode: r.statusCode,
      isBase64Encoded: r.isBase64Encoded,
    };

    if (r.body) {
      try {
        const parsed = JSON.parse(r.body);
        info.body = sanitizeObject(parsed, {
          excludeFields: excludeResponseFields,
          maxDepth,
        });
      } catch {
        info.body = '[Non-JSON response]';
        info.bodyLength = r.body.length;
      }
    }

    if (r.headers && Object.keys(r.headers).length > 0) {
      info.headers = sanitizeObject(r.headers, {
        excludeFields: excludeResponseFields,
        maxDepth,
      });
    }

    return info;
  }

  return {
    responseType: typeof response,
    responseData: sanitizeObject(response as Record<string, unknown>, {
      excludeFields: excludeResponseFields,
      maxDepth,
    }),
  };
}

function summarizeEvent<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  input: RestInputWithModels<TTypes, TSelected>,
  config: RestRequestLoggerConfig,
): Record<string, unknown> {
  const { excludeEventFields = [], maxDepth = 6 } = config;
  const { event } = input;

  const base = extractEventInfo(event);
  if (!event.body) return base;

  try {
    const parsed = JSON.parse(event.body);
    return {
      ...base,
      body: sanitizeObject(parsed, {
        excludeFields: excludeEventFields,
        maxDepth,
      }),
    };
  } catch {
    return { ...base, body: '[Invalid JSON]' };
  }
}

export function createRestRequestLogger<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
  TOutput = RestResponse,
>(
  config: RestRequestLoggerConfig = {},
): Middleware<RestInputWithModels<TTypes, TSelected>, TOutput> {
  const { defaultContext = {} } = config;

  return async (
    input: RestInputWithModels<TTypes, TSelected>,
    next: (input?: RestInputWithModels<TTypes, TSelected>) => Promise<TOutput>,
  ): Promise<TOutput> => {
    const start = Date.now();
    const { context } = input;

    setupStructuredLogging(
      input as unknown as RestInputWithModels<
        Record<string, AmplifyModelType>,
        string
      >,
      true,
      defaultContext,
    );

    try {
      const eventInfo = summarizeEvent(input, config);
      logger.info('REST request received', {
        ...eventInfo,
        ...defaultContext,
        requestId: context?.awsRequestId || undefined,
        functionName: context?.functionName || undefined,
        functionVersion: context?.functionVersion || undefined,
      });

      const result = await next(input);

      const responseInfo = summarizeResponse(result, config);
      logger.info('REST response sent', {
        ...responseInfo,
        ...defaultContext,
        duration: `${Date.now() - start}ms`,
        requestId: context?.awsRequestId || undefined,
      });

      return result;
    } finally {
      logger.clearContext();
    }
  };
}
