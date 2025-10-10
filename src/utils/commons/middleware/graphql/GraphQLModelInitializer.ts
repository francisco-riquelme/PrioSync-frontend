import { throwError } from '../../error';
import { ClientManager } from '../../queries/ClientManager';
import { logger } from '../../log';
import type {
  GraphQLModelInitializerConfig,
  GraphQLInputWithModels,
  GraphQLHandlerReturn,
} from './types';
import type { Middleware } from '../middlewareChain';
import type { AmplifyModelType, QueryFactoryResult } from '../../queries/types';

const modelsCache = new Map<string, Record<string, unknown>>();
const initializationPromises = new Map<
  string,
  Promise<Record<string, unknown>>
>();

function createCacheKey(
  clientKey: string,
  entities?: readonly string[],
): string {
  const entityKey = entities ? [...entities].sort().join(',') : 'all';
  return `${clientKey}-${entityKey}`;
}

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

  logger.info('Starting GraphQL model initialization', {
    clientKey,
    entities: entities || 'all',
    timeout,
    cacheEnabled: !!cache?.enabled,
    schemaModels: Object.keys(schema?.models || {}),
    middleware: 'GraphQLModelInitializer',
  });

  const initPromise = ClientManager.initializeQueries({
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
    logger.debug('Waiting for model initialization', {
      clientKey,
      timeout,
      middleware: 'GraphQLModelInitializer',
    });

    const models = await Promise.race([initPromise, timeoutPromise]);

    logger.info('Model initialization completed successfully', {
      initializedModels: Object.keys(models || {}),
      modelCount: Object.keys(models || {}).length,
      clientKey,
      middleware: 'GraphQLModelInitializer',
    });

    return models as { [K in TSelected]: QueryFactoryResult<K, TTypes> };
  } catch (error) {
    logger.error('Model initialization failed', {
      error: error instanceof Error ? error.message : String(error),
      clientKey,
      entities: entities || 'all',
      timeout,
      cacheEnabled: !!cache?.enabled,
      middleware: 'GraphQLModelInitializer',
    });

    throwError('GraphQL model initialization failed', {
      originalError: error,
      clientKey,
      entities: entities || 'all',
      timeout,
      cacheEnabled: !!cache?.enabled,
    });
  }
}

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

  logger.debug('Creating GraphQL model initializer middleware', {
    clientKey,
    entities: entities || 'all',
    cacheKey,
    middleware: 'GraphQLModelInitializer',
  });

  return async (
    input: GraphQLInputWithModels<TTypes, TSelected>,
    next: () => Promise<TReturn>,
  ): Promise<TReturn> => {
    logger.debug('GraphQL model initializer middleware execution started', {
      cacheKey,
      hasModels: !!input.models,
      availableModels: Object.keys(input.models || {}),
      middleware: 'GraphQLModelInitializer',
    });

    let models: { [K in TSelected]: QueryFactoryResult<K, TTypes> } | undefined;

    try {
      models = modelsCache.get(cacheKey) as
        | { [K in TSelected]: QueryFactoryResult<K, TTypes> }
        | undefined;

      if (!models) {
        logger.debug('Models not cached, checking initialization status', {
          cacheKey,
          middleware: 'GraphQLModelInitializer',
        });

        let initPromise = initializationPromises.get(cacheKey);

        if (!initPromise) {
          logger.info('Starting new model initialization', {
            cacheKey,
            middleware: 'GraphQLModelInitializer',
          });
          initPromise = initializeModelsWithTimeout(config);
          initializationPromises.set(cacheKey, initPromise);
        } else {
          logger.debug('Waiting for existing initialization', {
            cacheKey,
            middleware: 'GraphQLModelInitializer',
          });
        }

        try {
          models = (await initPromise) as {
            [K in TSelected]: QueryFactoryResult<K, TTypes>;
          };
          modelsCache.set(cacheKey, models);
          logger.info('Models cached successfully', {
            cacheKey,
            modelCount: Object.keys(models || {}).length,
            modelNames: Object.keys(models || {}),
            middleware: 'GraphQLModelInitializer',
          });
        } catch (error) {
          logger.error('Clearing failed initialization from cache', {
            cacheKey,
            error: error instanceof Error ? error.message : String(error),
            middleware: 'GraphQLModelInitializer',
          });
          initializationPromises.delete(cacheKey);
          modelsCache.delete(cacheKey);
          throw error;
        } finally {
          initializationPromises.delete(cacheKey);
        }
      } else {
        logger.debug('Using cached models', {
          cacheKey,
          modelCount: Object.keys(models || {}).length,
          modelNames: Object.keys(models || {}),
          middleware: 'GraphQLModelInitializer',
        });
      }

      input.models = models;

      logger.debug('Proceeding to next middleware', {
        cacheKey,
        modelCount: Object.keys(models || {}).length,
        middleware: 'GraphQLModelInitializer',
      });
    } catch (error) {
      logger.error('GraphQL model initialization failed', {
        originalError: error,
        cacheKey,
        middleware: 'GraphQLModelInitializer',
      });

      throwError('GraphQL model initialization failed', {
        originalError: error,
        cacheKey,
        middleware: 'GraphQLModelInitializer',
      });
    }

    return await next();
  };
}
