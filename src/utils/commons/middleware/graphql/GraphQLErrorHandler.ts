import { logger } from '../../log';
import { extractErrorMessage, createErrorContext } from '../../error';
import type { Middleware, MiddlewareError } from '../middlewareChain';
import type {
  GraphQLInputWithModels,
  GraphQLHandlerReturn,
  GraphQLEvent,
} from './types';
import type { AmplifyModelType } from '../../queries/types';

/**
 * Configuration options for the GraphQL error handling middleware.
 */
export interface GraphQLErrorHandlerConfig {
  /** Whether to include stack traces in logs (default: false in production). */
  includeStackTrace?: boolean;
  /** Additional context to include with all logged errors. */
  defaultContext?: Record<string, unknown>;
  /** Whether to force structured logging regardless of environment. */
  forceStructuredLogging?: boolean;
}

/**
 * Helper to check if error is from our error library.
 * This looks for properties that throwError always adds to identify our errors.
 */
function isOurError(
  error: unknown,
): error is Error & { [key: string]: unknown } {
  return (
    error instanceof Error &&
    Object.prototype.hasOwnProperty.call(error, '__fromErrorLibrary')
  );
}

/**
 * Helper to safely extract AppSync event properties.
 */
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
    arguments: event.arguments || {},
    identity: event.identity
      ? (event.identity as unknown as Record<string, unknown>)
      : null,
    info: event.info
      ? {
          fieldName: event.info.fieldName,
          parentTypeName: event.info.parentTypeName,
          variables: event.info.variables || {},
        }
      : undefined,
  };
}

/**
 * Helper to build structured log context for GraphQL errors.
 */
function buildGraphQLLogContext<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string,
>(
  input: GraphQLInputWithModels<TTypes, TSelected>,
  error: Error & { [key: string]: unknown },
  defaultContext: Record<string, unknown>,
): Record<string, unknown> {
  const eventInfo = extractAppSyncEventInfo(input.event);
  const errorWithMiddleware = error as MiddlewareError;
  const context = input.context as unknown as Record<string, unknown>;

  const getMiddlewareChainString = (): string | undefined => {
    const chain = errorWithMiddleware.middlewareChain;
    if (Array.isArray(chain)) {
      return chain.join(' -> ');
    }
    return undefined;
  };

  return createErrorContext({
    ...defaultContext,
    // Include any additional properties from the error first
    ...Object.fromEntries(
      Object.entries(error).filter(
        ([key]) => !['name', 'message', 'stack'].includes(key),
      ),
    ),
    requestId: context.awsRequestId || 'unknown',
    functionName: context.functionName,
    graphql: {
      typeName: eventInfo.info?.parentTypeName,
      fieldName: eventInfo.info?.fieldName,
      arguments: eventInfo.arguments,
    },
    identity: eventInfo.identity,
    failedMiddleware: errorWithMiddleware.middlewareName,
    middlewareChain: getMiddlewareChainString(),
  });
}

/**
 * Creates an error handling middleware for AppSync GraphQL Lambda resolvers.
 */
export function createGraphQLErrorHandler<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn extends GraphQLHandlerReturn = GraphQLHandlerReturn,
>(
  config: GraphQLErrorHandlerConfig = {},
): Middleware<GraphQLInputWithModels<TTypes, TSelected>, TReturn> {
  const {
    includeStackTrace = process.env.NODE_ENV === 'development',
    defaultContext = {},
  } = config;

  return async (
    input: GraphQLInputWithModels<TTypes, TSelected>,
    next: () => Promise<TReturn>,
  ): Promise<TReturn> => {
    try {
      return await next();
    } catch (error) {
      let standardError: Error & { [key: string]: unknown };
      let errorMessage: string;

      // Handle non-standard errors by creating a standard error with context
      if (!isOurError(error)) {
        logger.warn('Non-standard error thrown, wrapping with throwError', {
          error,
        });

        // Create a standard error manually with the same structure as throwError
        const wrappedMessage =
          'Non-standard error thrown to GraphQL error handler';
        standardError = new Error(wrappedMessage) as Error & {
          [key: string]: unknown;
        };

        // Add properties that throwError would have added
        standardError.errorType = typeof error;
        standardError.originalError = error;

        errorMessage = wrappedMessage;
      } else {
        standardError = error;
        errorMessage = extractErrorMessage(standardError);
      }

      const logContext = buildGraphQLLogContext(
        input,
        standardError,
        defaultContext,
      );

      logger.error(`GraphQL resolver error: ${errorMessage}`, {
        ...logContext,
        ...(includeStackTrace && { stack: standardError.stack }),
        originalError: standardError.originalError || standardError,
      });

      throw standardError;
    }
  };
}
