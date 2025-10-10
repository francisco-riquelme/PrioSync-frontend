import { MiddlewareChain } from '../middlewareChain';
import type {
  WebSocketInputWithModels,
  WebSocketResponse,
  WebSocketMiddlewareChain,
} from './types';
import type { AmplifyModelType } from '../../queries/types';

/**
 * Create a WebSocket-specific middleware chain
 *
 * This function creates a middleware chain optimized for WebSocket handlers with
 * proper typing for WebSocket events, contexts, and model access. It extends the
 * base MiddlewareChain with WebSocket-specific input types.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types for this chain
 * @template TReturn - Expected return type of the WebSocket handler
 * @param config - Configuration options for the middleware chain
 * @returns A typed middleware chain for WebSocket handlers
 *
 * @example
 * ```typescript
 * interface MyModels {
 *   User: AmplifyModelType;
 *   Message: AmplifyModelType;
 * }
 *
 * const chain = createWebSocketChain<MyModels, 'User' | 'Message'>({
 *   enableDebugLogging: true,
 *   onError: (error, middlewareName) => {
 *     console.error(`WebSocket middleware ${middlewareName} failed:`, error);
 *   }
 * });
 * ```
 */
export function createWebSocketChain<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn = WebSocketResponse,
>(
  config: {
    enableDebugLogging?: boolean;
    onError?: (error: unknown, middlewareName: string) => void;
  } = {},
): WebSocketMiddlewareChain<TTypes, TSelected, TReturn> {
  return new MiddlewareChain<
    WebSocketInputWithModels<TTypes, TSelected>,
    TReturn
  >(config);
}

/**
 * Wrap a WebSocket handler with middleware chain functionality
 *
 * This function creates a Lambda-compatible WebSocket handler that executes
 * the middleware chain before calling the original handler. It handles the
 * conversion between Lambda's individual event/context parameters and the
 * middleware chain's combined input object.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types for this handler
 * @template TReturn - Expected return type of the WebSocket handler
 * @param chain - The middleware chain to execute
 * @param handler - The original WebSocket handler function
 * @returns A Lambda-compatible WebSocket handler function
 *
 * @example
 * ```typescript
 * const wrappedHandler = wrapWebSocketHandler(
 *   chain,
 *   async (input) => {
 *     const { event, context, models } = input;
 *
 *     // Handle WebSocket message
 *     if (event.requestContext.eventType === 'MESSAGE') {
 *       const user = await models.User.get({ id: event.requestContext.connectionId });
 *       return { statusCode: 200 };
 *     }
 *
 *     return { statusCode: 200 };
 *   }
 * );
 * ```
 */
export function wrapWebSocketHandler<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn extends WebSocketResponse = WebSocketResponse,
>(
  chain: WebSocketMiddlewareChain<TTypes, TSelected, TReturn>,
  handler: (
    input: WebSocketInputWithModels<TTypes, TSelected>,
  ) => Promise<TReturn>,
): (
  event: WebSocketInputWithModels<TTypes, TSelected>['event'],
  context: WebSocketInputWithModels<TTypes, TSelected>['context'],
) => Promise<TReturn> {
  return async (event, context) => {
    const input = { event, context } as WebSocketInputWithModels<
      TTypes,
      TSelected
    >;
    return await chain.execute(input, handler);
  };
}
