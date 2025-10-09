/* eslint-disable max-lines */
// QueryFactory.ts - Type-safe CRUD operations for AWS Amplify Data models
import { throwError } from '../error';
import { ClientManager } from './ClientManager';
import {
  logOperation,
  logSuccess,
  validateResponse,
  extractIdentifier,
  createObjectHash,
  handlePagination,
  buildListParams,
  buildIndexParams,
  checkQueryCache,
  setQueryCache,
} from './helpers';
import { getGlobalCache, type QueryCache } from './cache';
import type {
  AmplifyModelType,
  QueryFactoryConfig,
  QueryFactoryResult,
  CreateInput,
  UpdateInput,
  DeleteInput,
  ModelType,
  Identifier,
  PaginationResult,
  SortDirection,
  AmplifyAuthMode,
  ModelFilter, // Add this import
} from './types';

//#region MAIN FACTORY FUNCTION
/**
 * Creates type-safe CRUD operations for AWS Amplify Data models.
 *
 * Generates a complete set of database operations (create, read, update, delete, list)
 * with comprehensive error handling, logging, and optional caching. All operations
 * preserve TypeScript types across package boundaries.
 *
 * **Features:**
 * - Type-safe operations with full TypeScript support
 * - Automatic error handling and logging
 * - Optional LRU caching with smart invalidation
 * - Pagination support with automatic following
 * - Schema-aware identifier extraction
 * - Client isolation via unique keys
 *
 * @template Types - Record of all available Amplify model types
 * @template TName - Specific model name as string literal
 * @param config - Configuration object for factory creation
 * @returns Promise resolving to complete CRUD operations interface
 *
 * @example
 * ```typescript
 * const userFactory = await QueryFactory({
 *   name: "User",
 *   clientKey: "main",
 *   cache: { enabled: true, maxSize: 10 * 1024 * 1024 }
 * });
 *
 * const user = await userFactory.get({ input: { userId: "123" } });
 * const users = await userFactory.list({ limit: 50, followNextToken: true });
 * ```
 */
export function QueryFactory<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  config: QueryFactoryConfig<TName>,
): Promise<QueryFactoryResult<TName, Types>> {
  return createQueryFactory<Types, TName>(config);
}

/**
 * Internal factory implementation that creates the actual query operations.
 *
 * @internal
 * @template Types - Record of all available Amplify model types
 * @template TName - Specific model name as string literal
 * @param config - Configuration object for factory creation
 * @returns Promise resolving to query operations interface
 */

async function createQueryFactory<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  config: QueryFactoryConfig<TName>,
): Promise<QueryFactoryResult<TName, Types>> {
  const { name, clientKey = 'default', cache: cacheConfig } = config;
  const nameStr = String(name);

  const cache = cacheConfig ? getGlobalCache(cacheConfig) : undefined;

  const manager = ClientManager.getInstance(clientKey);
  const client = await manager.getClient<{ models: Record<string, unknown> }>();
  const model = getModelFromClient(client, nameStr);

  const queryResult: QueryFactoryResult<TName, Types> = {
    create: createCreateOperation<Types, TName>(model, nameStr, cache),
    update: createUpdateOperation<Types, TName>(model, nameStr, cache),
    delete: createDeleteOperation<Types, TName>(model, nameStr, cache),
    get: createGetOperation<Types, TName>(model, nameStr, cache),
    list: createListOperation<Types, TName>(model, nameStr, cache),
    queryIndex: createIndexQueryOperation<Types, TName>(nameStr, cache),
  };

  return queryResult;
}
//#endregion

//#region OPERATION FACTORY FUNCTIONS
/**
 * Creates a type-safe create operation with caching invalidation.
 *
 * @internal
 * @template Types - Record of all available Amplify model types
 * @template TName - Specific model name as string literal
 * @param model - Amplify model instance
 * @param nameStr - String representation of model name
 * @param cache - Optional cache instance for invalidation
 * @returns Function that performs create operations
 */
function createCreateOperation<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  model: unknown,
  nameStr: string,
  cache?: QueryCache,
): (props: {
  input: CreateInput<TName, Types>;
  selectionSet?: SelectionSet;
}) => Promise<ModelType<TName, Types>> {
  return async props => {
    try {
      const { input, selectionSet } = props;
      logOperation(nameStr, 'create', input);

      // Build request params - ensure input is treated as object
      const requestParams: Record<string, unknown> = Object.assign(
        {},
        input as Record<string, unknown>,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (model as any).create(
        requestParams,
        selectionSet ? { selectionSet } : undefined,
      );
      const data = validateResponse({
        response,
        operation: 'create',
        name: nameStr,
        input,
      });

      cache?.invalidatePattern(`${nameStr}:list`);

      logSuccess('create', { nameStr });
      return data as ModelType<TName, Types>;
    } catch (error) {
      throw throwError(`${nameStr} could not be created`, error);
    }
  };
}

/**
 * Creates a type-safe update operation with cache invalidation.
 *
 * @internal
 * @template Types - Record of all available Amplify model types
 * @template TName - Specific model name as string literal
 * @param model - Amplify model instance
 * @param nameStr - String representation of model name
 * @param cache - Optional cache instance for invalidation
 * @returns Function that performs update operations
 */
function createUpdateOperation<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  model: unknown,
  nameStr: string,
  cache?: QueryCache,
): (props: {
  input: UpdateInput<TName, Types>;
  selectionSet?: SelectionSet;
}) => Promise<ModelType<TName, Types>> {
  return async props => {
    try {
      const { input, selectionSet } = props;
      logOperation(nameStr, 'update', input);

      // Build request params - ensure input is treated as object
      const requestParams: Record<string, unknown> = Object.assign(
        {},
        input as Record<string, unknown>,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (model as any).update(
        requestParams,
        selectionSet ? { selectionSet } : undefined,
      );
      const data = validateResponse({
        response,
        operation: 'update',
        name: nameStr,
        input,
      });

      const identifier = extractIdentifier(
        input as Record<string, unknown>,
        nameStr,
      );
      cache?.delete(`${nameStr}:get:${createObjectHash(identifier, nameStr)}`);
      cache?.invalidatePattern(`${nameStr}:list`);

      logSuccess('update', { nameStr });
      return data as ModelType<TName, Types>;
    } catch (error) {
      throw throwError(`${nameStr} could not be updated`, error);
    }
  };
}

/**
 * Creates a type-safe delete operation with cache invalidation.
 *
 * @internal
 * @template Types - Record of all available Amplify model types
 * @template TName - Specific model name as string literal
 * @param model - Amplify model instance
 * @param nameStr - String representation of model name
 * @param cache - Optional cache instance for invalidation
 * @returns Function that performs delete operations
 */
function createDeleteOperation<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  model: unknown,
  nameStr: string,
  cache?: QueryCache,
): (props: {
  input: DeleteInput<TName, Types>;
  selectionSet?: SelectionSet;
}) => Promise<ModelType<TName, Types>> {
  return async props => {
    try {
      const { input, selectionSet } = props;
      logOperation(nameStr, 'delete', input);

      // Build request params - ensure input is treated as object
      const requestParams: Record<string, unknown> = Object.assign(
        {},
        input as Record<string, unknown>,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (model as any).delete(
        requestParams,
        selectionSet ? { selectionSet } : undefined,
      );
      const data = validateResponse({
        response,
        operation: 'delete',
        name: nameStr,
        input,
      });

      const identifier = extractIdentifier(
        input as Record<string, unknown>,
        nameStr,
      );
      cache?.delete(`${nameStr}:get:${createObjectHash(identifier, nameStr)}`);
      cache?.invalidatePattern(`${nameStr}:list`);

      logSuccess('delete', { nameStr });
      return data as ModelType<TName, Types>;
    } catch (error) {
      throw throwError(`${nameStr} could not be deleted`, error);
    }
  };
}

/**
 * Creates a type-safe get operation with cache-first strategy.
 *
 * @internal
 * @template Types - Record of all available Amplify model types
 * @template TName - Specific model name as string literal
 * @param model - Amplify model instance
 * @param nameStr - String representation of model name
 * @param cache - Optional cache instance for retrieval and storage
 * @returns Function that performs get operations
 */
function createGetOperation<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  model: unknown,
  nameStr: string,
  cache?: QueryCache,
): (props: {
  input: Identifier<TName, Types>;
  selectionSet?: SelectionSet;
}) => Promise<ModelType<TName, Types>> {
  return async props => {
    try {
      const { input, selectionSet } = props;
      const cacheKey = `${nameStr}:get:${createObjectHash(input as Record<string, unknown>, nameStr)}${selectionSet ? `:${JSON.stringify(selectionSet)}` : ''}`;

      const cached = cache?.get<ModelType<TName, Types>>(cacheKey);
      if (cached) {
        logSuccess('get', { nameStr, source: 'cache' });
        return cached;
      }

      logOperation(nameStr, 'get', input);

      // Build request params
      const inputObj = input as Record<string, unknown>;
      const requestParams: Record<string, unknown> = { ...inputObj };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (model as any).get(
        requestParams,
        selectionSet ? { selectionSet } : undefined,
      );
      const data = validateResponse({
        response,
        operation: 'get',
        name: nameStr,
        input,
      });

      cache?.set(cacheKey, data);

      logSuccess('get', { nameStr, data, selectionSet });
      return data as ModelType<TName, Types>;
    } catch (error) {
      throw throwError(`${nameStr} could not be retrieved`, error);
    }
  };
}

/**
 * Creates a type-safe list operation with pagination and caching.
 *
 * @internal
 * @template Types - Record of all available Amplify model types
 * @template TName - Specific model name as string literal
 * @param model - Amplify model instance
 * @param nameStr - String representation of model name
 * @param cache - Optional cache instance for retrieval and storage
 * @returns Function that performs list operations with pagination
 */
function createListOperation<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  model: unknown,
  nameStr: string,
  cache?: QueryCache,
): (props?: {
  filter?: ModelFilter<ModelType<TName, Types>>;
  sortDirection?: SortDirection;
  limit?: number;
  nextToken?: string;
  authMode?: AmplifyAuthMode;
  followNextToken?: boolean;
  maxPages?: number;
  selectionSet?: SelectionSet;
}) => Promise<PaginationResult<ModelType<TName, Types>>> {
  return async (props = {}) => {
    try {
      const {
        filter,
        sortDirection,
        limit,
        nextToken,
        authMode,
        followNextToken = false,
        maxPages = 10,
        selectionSet,
      } = props;

      // Check cache
      const isCacheable = !nextToken && !filter && !followNextToken && !!cache;
      const cached = checkQueryCache<PaginationResult<ModelType<TName, Types>>>(
        {
          nameStr,
          cacheType: 'list',
          isCacheable,
          hashData: { limit, sortDirection, selectionSet },
          cache,
        },
      );
      if (cached) {
        logSuccess('list', { count: cached.items.length, source: 'cache' });
        return cached;
      }

      logOperation(nameStr, 'list');

      // Build params and execute pagination
      const listParams = buildListParams({
        filter,
        sortDirection,
        limit,
        authMode,
        selectionSet,
      });
      const result = await handlePagination<ModelType<TName, Types>>(
        async (params = {}) =>
          (
            model as {
              list: (p?: Record<string, unknown>) => Promise<{
                data: ModelType<TName, Types>[];
                errors?: unknown[];
                nextToken?: string;
              }>;
            }
          ).list(params),
        { ...listParams, nextToken },
        { followNextToken, maxPages },
      );

      // Cache result if eligible
      setQueryCache({
        nameStr,
        cacheType: 'list',
        isCacheable,
        hashData: { limit, sortDirection, selectionSet },
        result,
        cache,
      });

      logSuccess('list', { count: result.items.length });

      return result;
    } catch (error) {
      throw throwError(`${nameStr} list could not be retrieved`, error);
    }
  };
}
//#endregion

//#region INDEX QUERY OPERATION
/**
 * Creates an operation to execute named secondary index queries.
 *
 * Relies on Amplify client's generated `queries[queryField]` shape.
 */
function createIndexQueryOperation<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  nameStr: string,
  cache?: QueryCache,
): (props: {
  queryField: string;
  input?: Record<string, unknown>;
  filter?: ModelFilter<ModelType<TName, Types>>;
  limit?: number;
  nextToken?: string;
  authMode?: AmplifyAuthMode;
  followNextToken?: boolean;
  maxPages?: number;
  selectionSet?: SelectionSet;
}) => Promise<PaginationResult<ModelType<TName, Types>>> {
  return async props => {
    const {
      queryField,
      input = {},
      filter,
      limit,
      nextToken,
      authMode,
      followNextToken = false,
      maxPages = 10,
      selectionSet,
    } = props;

    try {
      // Check cache
      const isCacheable = !nextToken && !followNextToken && !!cache;
      const cached = checkQueryCache<PaginationResult<ModelType<TName, Types>>>(
        {
          nameStr,
          cacheType: 'index',
          isCacheable,
          hashData: { queryField, input, filter, limit, selectionSet },
          cache,
        },
      );
      if (cached) {
        logSuccess('list', { source: 'cache' });
        return cached;
      }

      const manager = ClientManager.getInstance();
      const client = await manager.getClient<{
        models: Record<string, Record<string, unknown>>;
      }>();

      const model = client.models[nameStr];
      if (!model) {
        throw throwError(`Model '${nameStr}' not found in client models`);
      }

      const fn = model[queryField];
      if (typeof fn !== 'function') {
        throw throwError(
          `Index query '${queryField}' not found on model '${nameStr}'. Available methods: ${Object.keys(model).join(', ')}`,
        );
      }

      logOperation(nameStr, 'list');

      const result = await handlePagination<ModelType<TName, Types>>(
        async (p = {}) =>
          fn(
            buildIndexParams(input, {
              filter,
              limit,
              authMode,
              selectionSet,
              nextToken: p.nextToken as string | undefined,
            }),
          ),
        { nextToken },
        { followNextToken, maxPages },
      );

      setQueryCache({
        nameStr,
        cacheType: 'index',
        isCacheable,
        hashData: { queryField, input, filter, limit, selectionSet },
        result,
        cache,
      });

      logSuccess('list', { count: result.items.length });

      return result;
    } catch (error) {
      throw throwError(`${nameStr} index query failed`, error);
    }
  };
}
//#endregion

//#region UTILITY FUNCTIONS
/**
 * Extracts a specific model from the Amplify client models collection.
 *
 * @internal
 * @param client - Amplify client with models collection
 * @param nameStr - Model name to extract
 * @returns The requested model instance
 * @throws Error if model is not found, listing available models
 */
function getModelFromClient(
  client: { models: Record<string, unknown> },
  nameStr: string,
): unknown {
  const modelRef = client.models[nameStr];
  if (!modelRef) {
    throw throwError(
      `Model "${nameStr}" not found in client models. Available models: ${Object.keys(client.models).join(', ')}`,
    );
  }
  return modelRef;
}
//#endregion

//#region SELECTION SET TYPES
/**
 * Selection set type for specifying which fields to retrieve.
 * Supports dot notation for nested fields (e.g., 'author.email', 'posts.*')
 */
export type SelectionSet = readonly string[];
//#endregion

//#region QUERY FACTORY TYPES
