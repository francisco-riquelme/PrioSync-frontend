import { logger } from "../../log";
import { sanitizeObject } from "../utils/sanitization";
import type { Middleware } from "../middlewareChain";
import type {
  GraphQLInputWithModels,
  GraphQLRequestLoggerConfig,
  GraphQLHandlerReturn,
} from "./types";
import type { AmplifyModelType } from "../../queries/types";
import { extractEventInfo, setupStructuredLogging } from "./utils";

const MAX_DEPTH = 10;

function extractResponseInfo(
  response: unknown,
  config: GraphQLRequestLoggerConfig
): Record<string, unknown> {
  const { excludeResponseFields = [] } = config;

  const info: Record<string, unknown> = {
    responseType: typeof response,
    isNull: response === null,
    isUndefined: response === undefined,
  };

  if (response === null || response === undefined) {
    return info;
  }

  if (Array.isArray(response)) {
    info.isArray = true;
    info.length = response.length;
    if (response.length > 0) {
      info.sampleItem = sanitizeObject(response[0], {
        excludeFields: excludeResponseFields,
        maxDepth: MAX_DEPTH,
      });
    }
  } else if (typeof response === "object") {
    info.isObject = true;
    info.response = sanitizeObject(response as Record<string, unknown>, {
      excludeFields: excludeResponseFields,
      maxDepth: MAX_DEPTH,
    });
  } else {
    info.response = response;
  }

  return info;
}

function addEventArguments<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  event: GraphQLInputWithModels<TTypes, TSelected>["event"],
  config: GraphQLRequestLoggerConfig,
  detailedInfo: Record<string, unknown>
): void {
  const { excludeEventFields = [], logArguments = true } = config;

  if (logArguments && event.arguments) {
    detailedInfo.arguments = sanitizeObject(event.arguments, {
      excludeFields: excludeEventFields,
      maxDepth: MAX_DEPTH,
    });
  }
}

function addEventVariables<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  event: GraphQLInputWithModels<TTypes, TSelected>["event"],
  config: GraphQLRequestLoggerConfig,
  detailedInfo: Record<string, unknown>
): void {
  const { excludeEventFields = [], logVariables = true } = config;

  if (logVariables) {
    detailedInfo.variables = {};
  }
}

function addEventIdentity<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  event: GraphQLInputWithModels<TTypes, TSelected>["event"],
  config: GraphQLRequestLoggerConfig,
  detailedInfo: Record<string, unknown>
): void {
  const { excludeEventFields = [], logIdentity = true } = config;

  if (logIdentity && event.identity) {
    detailedInfo.identity = sanitizeObject(event.identity, {
      excludeFields: excludeEventFields,
      maxDepth: MAX_DEPTH,
    });
  }
}

function addEventSelectionSet<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  event: GraphQLInputWithModels<TTypes, TSelected>["event"],
  config: GraphQLRequestLoggerConfig,
  detailedInfo: Record<string, unknown>
): void {
  const { logSelectionSet = false } = config;

  if (logSelectionSet) {
    detailedInfo.selectionSet = {
      selectionSetList: [],
      selectionSetGraphQL: "",
    };
  }
}

function addEventSourceAndStash<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  event: GraphQLInputWithModels<TTypes, TSelected>["event"],
  config: GraphQLRequestLoggerConfig,
  detailedInfo: Record<string, unknown>
): void {
  const { excludeEventFields = [] } = config;

  if (event.source) {
    detailedInfo.source = sanitizeObject(event.source, {
      excludeFields: excludeEventFields,
      maxDepth: MAX_DEPTH,
    });
  }
}

function extractDetailedEventInfo<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  input: GraphQLInputWithModels<TTypes, TSelected>,
  config: GraphQLRequestLoggerConfig
): Record<string, unknown> {
  const { event } = input;

  logger.debug("Event structure received", {
    hasEvent: !!event,
    hasArguments: !!event?.arguments,
    hasIdentity: !!event?.identity,
    hasSource: !!event?.source,
    eventKeys: event ? Object.keys(event) : [],
    middleware: "GraphQLRequestLogger",
  });

  const baseInfo = extractEventInfo(event);
  const detailedInfo: Record<string, unknown> = { ...baseInfo };

  addEventArguments(event, config, detailedInfo);
  addEventVariables(event, config, detailedInfo);
  addEventIdentity(event, config, detailedInfo);
  addEventSelectionSet(event, config, detailedInfo);
  addEventSourceAndStash(event, config, detailedInfo);

  return detailedInfo;
}

export function createGraphQLRequestLogger<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn extends GraphQLHandlerReturn = GraphQLHandlerReturn,
>(
  config: GraphQLRequestLoggerConfig = {}
): Middleware<GraphQLInputWithModels<TTypes, TSelected>, TReturn> {
  const { defaultContext = {} } = config;

  return async (
    input: GraphQLInputWithModels<TTypes, TSelected>,
    next: () => Promise<TReturn>
  ): Promise<TReturn> => {
    const startTime = Date.now();

    logger.debug("GraphQLRequestLogger middleware started", {
      middleware: "GraphQLRequestLogger",
      hasEvent: !!input.event,
      hasContext: !!input.context,
      hasModels: !!input.models,
      modelCount: Object.keys(input.models || {}).length,
    });

    try {
      logger.debug("Setting up structured logging", {
        middleware: "GraphQLRequestLogger",
      });

      setupStructuredLogging(input as GraphQLInputWithModels<TTypes>, true, {
        ...defaultContext,
        middleware: "GraphQLRequestLogger",
      });

      logger.debug("Extracting detailed event info", {
        middleware: "GraphQLRequestLogger",
      });

      const eventInfo = extractDetailedEventInfo(input, config);

      logger.info("GraphQL request started", {
        event: eventInfo,
        timestamp: new Date().toISOString(),
      });

      const result = await next();
      const duration = Date.now() - startTime;

      const responseInfo = extractResponseInfo(result, config);

      logger.info("GraphQL request completed", {
        response: responseInfo,
        duration,
        success: true,
      });

      return result;
    } catch (error) {
      logger.error("GraphQLRequestLogger middleware failed", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        middleware: "GraphQLRequestLogger",
      });

      const duration = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      logger.error("GraphQL request failed", {
        error: errorMessage,
        duration,
        success: false,
      });

      throw error;
    }
  };
}
