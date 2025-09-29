import { MiddlewareChain } from '../middlewareChain';
import type {
  RestInputWithModels,
  RestHandlerReturn,
  RestMiddlewareChain,
} from './types';
import type { AmplifyModelType } from '../../queries/types';

/**
 * Creates a new REST middleware chain with type-safe model support
 *
 * Initializes a composable middleware chain for REST API handlers
 * with support for Amplify Data models and custom return types.
 *
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 * @template TReturn - Handler return type (defaults to RestHandlerReturn)
 * @param config - Configuration options for the middleware chain
 * @param config.enableDebugLogging - Enable detailed middleware execution logging
 * @param config.onError - Custom error handler for middleware failures
 * @returns Configured REST middleware chain instance
 */
export function createRestChain<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes = keyof TTypes,
  TReturn = RestHandlerReturn,
>(
  config: {
    enableDebugLogging?: boolean;
    onError?: (error: unknown, middlewareName: string) => void;
  } = {},
): RestMiddlewareChain<TTypes, TSelected, TReturn> {
  return new MiddlewareChain<RestInputWithModels<TTypes, TSelected>, TReturn>(
    config,
  );
}

/**
 * Wraps a REST handler function with middleware chain execution
 *
 * Converts a middleware chain and handler into a Lambda-compatible
 * function that executes middleware before the handler.
 *
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 * @template TReturn - Handler return type
 * @param chain - Configured REST middleware chain
 * @param handler - Handler function to execute after middleware
 * @returns Lambda-compatible function with middleware execution
 */
export function wrapRestHandler<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes = keyof TTypes,
  TReturn extends RestHandlerReturn = RestHandlerReturn,
>(
  chain: RestMiddlewareChain<TTypes, TSelected, TReturn>,
  handler: (input: RestInputWithModels<TTypes, TSelected>) => Promise<TReturn>,
): (
  event: RestInputWithModels<TTypes, TSelected>['event'],
  context: RestInputWithModels<TTypes, TSelected>['context'],
) => Promise<TReturn> {
  return async (event, context) => {
    const input = { event, context } as RestInputWithModels<TTypes, TSelected>;
    return await chain.execute(input, handler);
  };
}
