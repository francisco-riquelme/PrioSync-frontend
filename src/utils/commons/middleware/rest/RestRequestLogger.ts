import { logger } from "../../log";
import { sanitizeObject } from "../utils/sanitization";
import type { Middleware } from "../middlewareChain";
import type {
  RestResponse,
  RestInputWithModels,
  RestRequestLoggerConfig,
} from "./types";
import type { AmplifyModelType } from "../../queries/types";
import { extractEventInfo, setupStructuredLogging } from "./utils";

/** Maximum object nesting depth for serialization */
const MAX_DEPTH = 6;

/**
 * Extracts and sanitizes response information for logging
 *
 * Processes API Gateway response objects to extract essential
 * information while sanitizing sensitive data according to
 * configuration settings.
 *
 * @param response - Response object to extract information from
 * @param config - Logger configuration with field exclusion settings
 * @returns Sanitized response information object
 */
function extractResponseInfo(
  response: unknown,
  config: RestRequestLoggerConfig
): Record<string, unknown> {
  const { excludeResponseFields = [] } = config;

  if (
    response &&
    typeof response === "object" &&
    "statusCode" in response &&
    "body" in response
  ) {
    const restResponse = response as RestResponse;
    const info: Record<string, unknown> = {
      statusCode: restResponse.statusCode,
      isBase64Encoded: restResponse.isBase64Encoded,
    };

    if (restResponse.body) {
      try {
        const parsedBody = JSON.parse(restResponse.body);
        info.body = sanitizeObject(parsedBody, {
          excludeFields: excludeResponseFields,
          maxDepth: MAX_DEPTH,
        });
      } catch {
        info.bodyLength = restResponse.body.length;
        info.body = "[Non-JSON response]";
      }
    }

    if (restResponse.headers && Object.keys(restResponse.headers).length > 0) {
      info.headers = sanitizeObject(restResponse.headers, {
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
 * Extracts detailed event information with sanitization
 *
 * Processes API Gateway events to extract comprehensive request
 * information including parsed body data while applying field
 * exclusion and depth limits for security.
 *
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 * @param input - REST input containing event and context
 * @param config - Logger configuration with sanitization settings
 * @returns Detailed and sanitized event information
 */
function extractDetailedEventInfo<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  input: RestInputWithModels<TTypes, TSelected>,
  config: RestRequestLoggerConfig
): Record<string, unknown> {
  const { event } = input;
  const { excludeEventFields = [], maxDepth = MAX_DEPTH } = config;

  const basicInfo = extractEventInfo(event);

  // Add sanitized event details if needed
  if (event.body) {
    try {
      const parsedBody = JSON.parse(event.body);
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
        body: "[Invalid JSON]",
      };
    }
  }

  return basicInfo;
}

/**
 * Creates REST request logger middleware
 *
 * Creates a middleware function that logs detailed request and response
 * information for REST API operations. Handles request timing, sanitizes
 * sensitive data, and provides structured logging with CloudWatch integration.
 *
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 * @template TOutput - Response type (defaults to RestResponse)
 * @param config - Logger configuration options
 * @param config.maxDepth - Maximum object nesting depth for serialization
 * @param config.excludeEventFields - Event fields to exclude from logs
 * @param config.excludeResponseFields - Response fields to exclude from logs
 * @param config.defaultContext - Default context to include in all log entries
 * @returns Middleware function for request/response logging
 */
export function createRestRequestLogger<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
  TOutput = RestResponse,
>(
  config: RestRequestLoggerConfig = {}
): Middleware<RestInputWithModels<TTypes, TSelected>, TOutput> {
  const { defaultContext = {} } = config;

  return async (
    input: RestInputWithModels<TTypes, TSelected>,
    next: (input?: RestInputWithModels<TTypes, TSelected>) => Promise<TOutput>
  ): Promise<TOutput> => {
    const startTime = Date.now();
    const { context } = input;

    setupStructuredLogging(
      input as unknown as RestInputWithModels<
        Record<string, AmplifyModelType>,
        string
      >,
      true,
      defaultContext
    );

    try {
      const eventInfo = extractDetailedEventInfo(input, config);
      logger.info("REST request received", {
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

        logger.info("REST response sent", {
          ...responseInfo,
          ...defaultContext,
          duration: `${duration}ms`,
          requestId: context?.awsRequestId || undefined,
        });
      }

      const duration = Date.now() - startTime;
      logger.debug("REST request completed", {
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
