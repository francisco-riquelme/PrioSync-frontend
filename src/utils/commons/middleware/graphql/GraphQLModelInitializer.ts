import { throwError } from '../../error';
import { initializeQueries } from '../../queries/initialize';
import type {
  GraphQLModelInitializerConfig,
  GraphQLInputWithModels,
  GraphQLHandlerReturn,
} from './types';
import type { Middleware } from '../middlewareChain';
import type { AmplifyModelType, QueryFactoryResult } from '../../queries/types';

/**
 * Global cache for initialized models across invocations
 * Key format: `${clientKey}-${entityKey}`
 * @internal
 */
const modelsCache = new Map<string, Record<string, unknown>>();

/**
 * Global cache for initialization promises to prevent concurrent initialization
 * Key format: `${clientKey}-${entityKey}`
 * @internal
 */
const initializationPromises = new Map<
  string,
  Promise<Record<string, unknown>>
>();

/**
 * Create cache key for model storage
 * @internal
 */
function createCacheKey(
  clientKey: string,
  entities?: readonly string[],
): string {
  const entityKey = entities ? [...entities].sort().join(',') : 'all';
  return `${clientKey}-${entityKey}`;
}

/**
 * Initialize models with timeout protection
 * @internal
 */
async function initializeModelsWithTimeout<
  TSchema extends { models: Record<string, unknown> },
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string,
>(
  config: GraphQLModelInitializerConfig<TSchema, TTypes, TSelected>,
): Promise<{ [K in TSelected]: QueryFactoryResult<K, TTypes> }> {
  const {
    schema,
    amplifyOutputs,
    entities,
    clientKey = 'default',
    timeout = 5000,
    cache,
  } = config;

  const initPromise = initializeQueries({
    schema,
    amplifyOutputs,
    entities,
    clientKey,
    cache,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Model initialization timeout after ${timeout}ms`));
    }, timeout);
  });

  try {
    const models = await Promise.race([initPromise, timeoutPromise]);
    return models as { [K in TSelected]: QueryFactoryResult<K, TTypes> };
  } catch (error) {
    throwError('GraphQL model initialization failed', {
      originalError: error,
      clientKey,
      entities: entities || 'all',
      timeout,
      cacheEnabled: !!cache?.enabled,
    });
  }
}

/**
 * Create a GraphQL model initializer middleware
 *
 * This middleware initializes Amplify Data model query factories for GraphQL resolvers.
 * It handles lazy initialization with caching, timeout protection, and automatic retry
 * logic on initialization failures.
 *
 * **Initialization Flow:**
 * 1. Checks if models are already initialized (uses caching)
 * 2. If not initialized, creates initialization promise with timeout
 * 3. Initializes Amplify client and query factories for specified entities
 * 4. Adds initialized models to input object for subsequent middleware
 * 5. Handles initialization failures with proper error responses
 *
 * **Caching Behavior:**
 * - Models are initialized once and cached for subsequent requests
 * - Initialization failures reset the cache to allow retry
 * - Concurrent requests share the same initialization promise
 *
 * **Error Handling:**
 * - Initialization timeout: Throws error to be handled by error middleware
 * - Amplify client errors: Throws error with details for debugging
 * - Post-initialization errors: Re-throws to be handled by error middleware
 *
 * **Performance Considerations:**
 * - First request bears initialization cost (typically 100-500ms)
 * - Subsequent requests use cached models (near-zero overhead)
 * - Timeout protection prevents hanging Lambda functions
 *
 * @template TSchema - Amplify Data schema type with models property
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types to initialize (subset of TTypes)
 * @template TReturn - Expected return type of the GraphQL resolver
 * @param config - Configuration for model initialization
 * @returns Middleware function that adds initialized models to the input
 */
export function createGraphQLModelInitializer<
  TSchema extends { models: Record<string, unknown> },
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn extends GraphQLHandlerReturn = GraphQLHandlerReturn,
>(
  config: GraphQLModelInitializerConfig<TSchema, TTypes, TSelected>,
): Middleware<GraphQLInputWithModels<TTypes, TSelected>, TReturn> {
  const { clientKey = 'default', entities } = config;
  const cacheKey = createCacheKey(clientKey, entities);

  return async (
    input: GraphQLInputWithModels<TTypes, TSelected>,
    next: () => Promise<TReturn>,
  ): Promise<TReturn> => {
    try {
      // Check if models are already cached
      let models = modelsCache.get(cacheKey) as
        | { [K in TSelected]: QueryFactoryResult<K, TTypes> }
        | undefined;

      if (!models) {
        // Check if initialization is already in progress
        let initPromise = initializationPromises.get(cacheKey);

        if (!initPromise) {
          // Start new initialization
          initPromise = initializeModelsWithTimeout(config);
          initializationPromises.set(cacheKey, initPromise);
        }

        try {
          models = (await initPromise) as {
            [K in TSelected]: QueryFactoryResult<K, TTypes>;
          };
          modelsCache.set(cacheKey, models);
        } catch (error) {
          // Clear failed initialization from cache
          initializationPromises.delete(cacheKey);
          modelsCache.delete(cacheKey);
          throw error;
        } finally {
          // Clear the promise once completed (success or failure)
          initializationPromises.delete(cacheKey);
        }
      }

      // Add models to input for next middleware
      input.models = models;

      return await next();
    } catch (error) {
      throwError('GraphQL model initializer middleware failed', {
        originalError: error,
        cacheKey,
        middleware: 'GraphQLModelInitializer',
      });
    }
  };
}
