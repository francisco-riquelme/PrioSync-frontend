import { MiddlewareChain } from '../middlewareChain';
import type {
  GraphQLInputWithModels,
  GraphQLHandlerReturn,
  GraphQLMiddlewareChain,
} from './types';
import type { AmplifyModelType } from '../../queries/types';

/**
 * Create a GraphQL-specific middleware chain
 */
export function createGraphQLChain<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn = GraphQLHandlerReturn,
>(
  config: {
    enableDebugLogging?: boolean;
    onError?: (error: unknown, middlewareName: string) => void;
  } = {},
): GraphQLMiddlewareChain<TTypes, TSelected, TReturn> {
  return new MiddlewareChain<
    GraphQLInputWithModels<TTypes, TSelected>,
    TReturn
  >(config);
}

/**
 * Wrap a GraphQL resolver with middleware chain functionality
 */
export function wrapGraphQLResolver<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn extends GraphQLHandlerReturn = GraphQLHandlerReturn,
>(
  chain: GraphQLMiddlewareChain<TTypes, TSelected, TReturn>,
  resolver: (
    input: GraphQLInputWithModels<TTypes, TSelected>,
  ) => Promise<TReturn>,
): (
  event: GraphQLInputWithModels<TTypes, TSelected>['event'],
  context: GraphQLInputWithModels<TTypes, TSelected>['context'],
) => Promise<TReturn> {
  return async (event, context) => {
    const input = { event, context } as GraphQLInputWithModels<
      TTypes,
      TSelected
    >;
    return await chain.execute(input, resolver);
  };
}
