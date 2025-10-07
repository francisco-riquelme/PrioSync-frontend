import { logger } from "../../log";
import { extractErrorMessage, createErrorContext } from "../../error";
import type { Middleware, MiddlewareError } from "../middlewareChain";
import type {
  GraphQLInputWithModels,
  GraphQLHandlerReturn,
  GraphQLEvent,
} from "./types";
import type { AmplifyModelType } from "../../queries/types";

export interface GraphQLErrorHandlerConfig {
  includeStackTrace?: boolean;
  defaultContext?: Record<string, unknown>;
  forceStructuredLogging?: boolean;
}

function isOurError(
  error: unknown
): error is Error & { [key: string]: unknown } {
  return (
    error instanceof Error &&
    Object.prototype.hasOwnProperty.call(error, "__fromErrorLibrary")
  );
}

function extractAppSyncEventInfo(event: GraphQLEvent): {
  arguments: Record<string, unknown>;
  identity: Record<string, unknown> | null;
  info:
    | {
        fieldName: string | undefined;
        parentTypeName: string | undefined;
        variables: Record<string, unknown>;
      }
    | undefined;
} {
  return {
    arguments: event?.arguments || {},
    identity: event?.identity
      ? (event.identity as unknown as Record<string, unknown>)
      : null,
    info: {
      fieldName: event?.fieldName,
      parentTypeName: event?.typeName,
      variables: {},
    },
  };
}

function buildGraphQLLogContext<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string,
>(
  input: GraphQLInputWithModels<TTypes, TSelected>,
  error: Error & { [key: string]: unknown },
  defaultContext: Record<string, unknown>
): Record<string, unknown> {
  const eventInfo = extractAppSyncEventInfo(input.event);
  const errorWithMiddleware = error as MiddlewareError;

  const middlewareChain = errorWithMiddleware.middlewareChain;
  const chainString = Array.isArray(middlewareChain)
    ? middlewareChain.join(" -> ")
    : undefined;

  return {
    ...defaultContext,
    ...Object.fromEntries(
      Object.entries(error).filter(
        ([key]) => !["name", "message", "stack"].includes(key)
      )
    ),
    requestId: input.context.awsRequestId || "unknown",
    functionName: input.context.functionName,
    graphql: {
      fieldName: input.event.fieldName,
      parentTypeName: input.event.typeName,
      arguments: input.event.arguments,
    },
    middlewareChain: chainString,
  };
}

export function createGraphQLErrorHandler<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn extends GraphQLHandlerReturn = GraphQLHandlerReturn,
>(
  config: GraphQLErrorHandlerConfig = {}
): Middleware<GraphQLInputWithModels<TTypes, TSelected>, TReturn> {
  const {
    includeStackTrace = process.env.NODE_ENV === "development",
    defaultContext = {},
  } = config;

  return async (
    input: GraphQLInputWithModels<TTypes, TSelected>,
    next: () => Promise<TReturn>
  ): Promise<TReturn> => {
    try {
      return await next();
    } catch (error) {
      let standardError: Error & { [key: string]: unknown };

      if (isOurError(error)) {
        standardError = error;
      } else {
        logger.warn("Non-standard error thrown, wrapping with throwError", {
          error,
        });

        const wrappedMessage =
          "Non-standard error thrown to GraphQL error handler";
        standardError = new Error(wrappedMessage) as Error & {
          [key: string]: unknown;
        };
        standardError.originalError = error;
      }

      const logContext = buildGraphQLLogContext(
        input,
        standardError,
        defaultContext
      );

      logger.error(extractErrorMessage(standardError), {
        ...logContext,
        ...Object.fromEntries(
          Object.entries(standardError).filter(
            ([key]) => !["name", "message", "stack"].includes(key)
          )
        ),
        requestId: input.context.awsRequestId || "unknown",
        functionName: input.context.functionName,
        graphql: {
          fieldName: input.event.fieldName,
          parentTypeName: input.event.typeName,
          arguments: input.event.arguments,
        },
        ...(includeStackTrace && { stack: standardError.stack }),
      });

      throw standardError;
    }
  };
}
