import type {
  RestModelInitializerConfig,
  RestInputWithModels,
  RestHandlerReturn,
  RestResponse,
} from './types';
import type { Middleware } from '../middlewareChain';
import type { AmplifyModelType, QueryFactoryResult } from '../../queries/types';
import type { RestAwareQueryOperations } from '../../queries/restAware';
import {
  initializeQueries,
  createRestAwareQueryOperations,
} from '../../queries';
import { buildRestContext, getErrorMessage } from './utils';

/**
 * Creates REST model initializer middleware
 *
 * Creates a middleware function that initializes Amplify Data models
 * for use in REST API handlers. Provides connection pooling, timeout
 * handling, optional caching, and type-safe model access through the middleware chain.
 *
 * **Key Feature**: Automatically wraps all models with REST-aware error handling
 * that converts database errors to appropriate HTTP status codes (404, 400, 409, 500).
 *
 * Features:
 * - Lazy initialization with caching
 * - Connection timeout protection
 * - Optional in-memory caching with LRU eviction
 * - Type-safe model selection
 * - Automatic REST error conversion
 * - Structured logging integration
 */
export function createRestModelInitializer<
  TSchema extends { models: Record<string, unknown> },
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn extends RestHandlerReturn = RestResponse,
>(
  config: RestModelInitializerConfig<TSchema, TTypes, TSelected>,
): Middleware<RestInputWithModels<TTypes, TSelected>, TReturn> {
  const {
    schema,
    amplifyOutputs,
    entities,
    clientKey = 'default',
    timeout = 5000,
    cache,
  } = config;

  let isInitialized = false;
  let initPromise: Promise<{
    [K in TSelected]: RestAwareQueryOperations<K & string, TTypes>;
  }> | null = null;

  const initialize = async (input: RestInputWithModels<TTypes, TSelected>) => {
    const context = buildRestContext(
      input as unknown as RestInputWithModels<
        Record<string, AmplifyModelType>,
        string
      >,
    );

    // Initialize queries with cache configuration
    const rawModels = await Promise.race([
      // Use unified initialization with cache support
      initializeQueries<TSchema, TTypes, TSelected>({
        amplifyOutputs,
        schema,
        entities,
        clientKey,
        cache,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Initialization timeout after ${timeout}ms`)),
          timeout,
        ),
      ),
    ]);

    // Wrap each model with REST-aware error handling
    const restAwareModels = {} as {
      [K in TSelected]: RestAwareQueryOperations<K & string, TTypes>;
    };

    for (const [modelName, rawModel] of Object.entries(rawModels)) {
      restAwareModels[modelName as TSelected] = createRestAwareQueryOperations(
        rawModel as QueryFactoryResult<string, TTypes>,
        modelName,
        context,
      );
    }

    return restAwareModels;
  };

  return async (input, next) => {
    const context = buildRestContext(
      input as unknown as RestInputWithModels<
        Record<string, AmplifyModelType>,
        string
      >,
    );

    try {
      if (isInitialized && initPromise) {
        const models = await initPromise;
        return await next({ ...input, models });
      }

      if (!initPromise) {
        initPromise = initialize(input);
      }

      const models = await initPromise;
      isInitialized = true;

      return await next({ ...input, models });
    } catch (error) {
      const message = getErrorMessage(error);

      if (!isInitialized) {
        isInitialized = false;
        initPromise = null;

        return {
          statusCode: 500,
          body: JSON.stringify({
            error: 'Model initialization failed',
            message,
            ...context,
          }),
        } as TReturn;
      }

      throw error;
    }
  };
}
