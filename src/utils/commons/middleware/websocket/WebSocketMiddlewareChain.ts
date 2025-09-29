import { MiddlewareChain } from '../middlewareChain';
import type {
  WebSocketInputWithModels,
  AuthorizerResponse,
  WebSocketHandlerReturn,
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
  TReturn = WebSocketHandlerReturn,
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
  TReturn extends WebSocketHandlerReturn = WebSocketHandlerReturn,
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

/**
 * Create an IAM policy that allows WebSocket API access
 *
 * Generates a properly formatted IAM policy document for WebSocket API Gateway
 * authorizers. Used in custom authorizer functions to grant access to WebSocket
 * connections and route execution.
 *
 * @param principalId - Unique identifier for the principal (user/system) being authorized
 * @param resourceArn - ARN of the WebSocket API resource (defaults to '*' for all resources)
 * @param action - IAM action to allow (defaults to 'execute-api:Invoke')
 * @param context - Additional context data to pass to the handler
 * @returns Formatted authorizer response with Allow policy
 *
 * @example
 * ```typescript
 * // Basic allow policy
 * const allowPolicy = createAllowPolicy('user123');
 *
 * // Allow policy with specific resource and context
 * const specificPolicy = createAllowPolicy(
 *   'user123',
 *   'arn:aws:execute-api:us-east-1:123456789:abc123/prod/*',
 *   'execute-api:Invoke',
 *   { userId: 'user123', role: 'admin' }
 * );
 * ```
 */
export function createAllowPolicy(
  principalId: string,
  resourceArn: string = '*',
  action: string = 'execute-api:Invoke',
  context: Record<string, string | number | boolean> = {},
): AuthorizerResponse {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Effect: 'Allow', Action: action, Resource: resourceArn }],
    },
    context,
  };
}

/**
 * Create an IAM policy that denies WebSocket API access
 *
 * Generates a properly formatted IAM policy document that denies access to
 * WebSocket API Gateway resources. Used in custom authorizer functions to
 * reject unauthorized connection attempts.
 *
 * @param principalId - Unique identifier for the principal being denied
 * @param resourceArn - ARN of the WebSocket API resource (defaults to '*' for all resources)
 * @param action - IAM action to deny (defaults to 'execute-api:Invoke')
 * @returns Formatted authorizer response with Deny policy
 *
 * @example
 * ```typescript
 * // Basic deny policy
 * const denyPolicy = createDenyPolicy('invalid-user');
 *
 * // Deny policy for specific resource
 * const specificDeny = createDenyPolicy(
 *   'blocked-user',
 *   'arn:aws:execute-api:us-east-1:123456789:abc123/prod/sendMessage'
 * );
 * ```
 */
export function createDenyPolicy(
  principalId: string,
  resourceArn: string = '*',
  action: string = 'execute-api:Invoke',
): AuthorizerResponse {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [{ Effect: 'Deny', Action: action, Resource: resourceArn }],
    },
  };
}
