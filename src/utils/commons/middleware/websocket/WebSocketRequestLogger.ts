import { logger } from '../../log';
import { sanitizeObject } from '../utils/sanitization';
import type { Middleware } from '../middlewareChain';
import type {
  WebSocketResponse,
  WebSocketInputWithModels,
  WebSocketRequestLoggerConfig,
} from './types';
import type { AmplifyModelType } from '../../queries/types';
import {
  extractEventInfo,
  setupStructuredLogging,
  isMessageEvent,
} from './utils';

/**
 * Maximum depth for object sanitization to prevent infinite recursion
 * @internal
 */
const MAX_DEPTH = 10;

/**
 * Extract structured information from WebSocket response for logging
 *
 * Processes the response object to extract relevant logging information while
 * applying sanitization rules to exclude sensitive fields. Handles both
 * standard WebSocket responses and arbitrary response objects.
 *
 * @param response - The response object to extract information from
 * @param config - Configuration specifying which fields to exclude
 * @returns Sanitized response information for logging
 * @internal
 */
function extractResponseInfo(
  response: unknown,
  config: WebSocketRequestLoggerConfig,
): Record<string, unknown> {
  const { excludeResponseFields = [] } = config;

  if (
    response &&
    typeof response === 'object' &&
    'statusCode' in response &&
    'body' in response
  ) {
    const wsResponse = response as WebSocketResponse;
    const info: Record<string, unknown> = {
      statusCode: wsResponse.statusCode,
      isBase64Encoded: wsResponse.isBase64Encoded,
    };

    if (wsResponse.body) {
      try {
        const parsedBody = JSON.parse(wsResponse.body);
        info.body = sanitizeObject(parsedBody, {
          excludeFields: excludeResponseFields,
          maxDepth: MAX_DEPTH,
        });
      } catch {
        info.bodyLength = wsResponse.body.length;
        info.body = '[Non-JSON response]';
      }
    }

    if (wsResponse.headers && Object.keys(wsResponse.headers).length > 0) {
      info.headers = sanitizeObject(wsResponse.headers, {
        excludeFields: excludeResponseFields,
        maxDepth: MAX_DEPTH,
      });
    }

    return info;
  }

  return {
    responseType: typeof response,
    responseData: sanitizeObject(response as Record<string, unknown>, {
      excludeFields: excludeResponseFields,
      maxDepth: MAX_DEPTH,
    }),
  };
}

/**
 * Extract detailed event information for comprehensive logging
 *
 * Builds a detailed logging object from the WebSocket event, including
 * basic connection information and optionally the message body for
 * MESSAGE events. Applies field exclusion and sanitization rules.
 *
 * @template TTypes - Available model types
 * @template TSelected - Selected model types for this request
 * @param input - The WebSocket input with models
 * @param config - Configuration for logging behavior and field exclusions
 * @returns Sanitized event information for logging
 * @internal
 */
function extractDetailedEventInfo<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  input: WebSocketInputWithModels<TTypes, TSelected>,
  config: WebSocketRequestLoggerConfig,
): Record<string, unknown> {
  const { event } = input;
  const {
    logMessageBody = true,
    excludeEventFields = [],
    maxDepth = MAX_DEPTH,
  } = config;

  const basicInfo = extractEventInfo(event);

  if (logMessageBody && isMessageEvent(event)) {
    const bodyStr = (event as { body?: string }).body;

    if (bodyStr) {
      try {
        const parsedBody = JSON.parse(bodyStr);
        return {
          ...basicInfo,
          body: sanitizeObject(parsedBody, {
            excludeFields: excludeEventFields,
            maxDepth,
          }),
        };
      } catch {
        return {
          ...basicInfo,
          body: '[Invalid JSON]',
        };
      }
    }
  }

  return basicInfo;
}

/**
 * Create a WebSocket request logging middleware
 *
 * This middleware provides comprehensive logging for WebSocket requests and responses.
 * It captures connection details, message timing, and optionally message bodies while
 * applying sanitization to exclude sensitive information.
 *
 * **Logging Flow:**
 * 1. Sets up structured logging context with connection details
 * 2. Logs incoming request with event information
 * 3. Executes next middleware and measures duration
 * 4. Logs response information (if response is provided)
 * 5. Logs completion with total duration
 * 6. Clears logging context
 *
 * **Log Levels:**
 * - `info`: Request received and response sent
 * - `debug`: Request completion timing
 *
 * **Security Features:**
 * - Field exclusion for sensitive data
 * - Object depth limiting to prevent large logs
 * - JSON parsing safety with fallback handling
 * - Automatic context cleanup
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types for this middleware chain
 * @template TOutput - Expected output type of the middleware chain
 * @param config - Configuration options for logging behavior
 * @returns Middleware function for WebSocket request logging
 *
 * @example
 * ```typescript
 * const requestLogger = createWebSocketRequestLogger({
 *   logMessageBody: true,  // This enables body logging
 *   excludeEventFields: ['authToken'], // Optional: exclude sensitive fields
 * });
 *
 * chain.use('logging', requestLogger);
 * ```
 *
 * @example
 * ```typescript
 * // Production logging - minimal message body logging
 * const productionLogger = createWebSocketRequestLogger({
 *   logMessageBody: false,
 *   excludeEventFields: ['body', 'headers'],
 *   defaultContext: { environment: 'production' },
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Development logging - detailed logging with message bodies
 * const devLogger = createWebSocketRequestLogger({
 *   logMessageBody: true,
 *   maxDepth: 8,
 *   defaultContext: {
 *     environment: 'development',
 *     debug: true
 *   },
 * });
 * ```
 */
export function createWebSocketRequestLogger<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TOutput = WebSocketResponse,
>(
  config: WebSocketRequestLoggerConfig = {},
): Middleware<WebSocketInputWithModels<TTypes, TSelected>, TOutput> {
  const { defaultContext = {} } = config;

  return async (
    input: WebSocketInputWithModels<TTypes, TSelected>,
    next: (
      input?: WebSocketInputWithModels<TTypes, TSelected>,
    ) => Promise<TOutput>,
  ): Promise<TOutput> => {
    const startTime = Date.now();
    const { context } = input;

    setupStructuredLogging(
      input as unknown as WebSocketInputWithModels<
        Record<string, AmplifyModelType>,
        string
      >,
      true,
      defaultContext,
    );

    try {
      const eventInfo = extractDetailedEventInfo(input, config);
      logger.info('WebSocket request received', {
        ...eventInfo,
        ...defaultContext,
        requestId: context?.awsRequestId || undefined,
        functionName: context?.functionName || undefined,
        functionVersion: context?.functionVersion || undefined,
      });

      const result = await next(input);

      if (result !== undefined) {
        const responseInfo = extractResponseInfo(result, config);
        const duration = Date.now() - startTime;

        logger.info('WebSocket response sent', {
          ...responseInfo,
          ...defaultContext,
          duration: `${duration}ms`,
          requestId: context?.awsRequestId || undefined,
        });
      }

      const duration = Date.now() - startTime;
      logger.debug('WebSocket request completed', {
        ...defaultContext,
        duration: `${duration}ms`,
        requestId: context?.awsRequestId || undefined,
      });

      return result;
    } finally {
      logger.clearContext();
    }
  };
}
