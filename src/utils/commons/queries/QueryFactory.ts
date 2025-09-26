// QueryFactory.ts - Library-compatible version
import { createHash } from 'crypto';
import { throwError } from '../error';
import { logger } from '../log';
import { ClientManager } from './ClientManager';
import {
  logOperation,
  logSuccess,
  validateAndReturn,
  extractIdentifier,
} from './helpers';
import { getGlobalCache, type QueryCache } from './cache';
import { getIdentifierFields } from './initialize';
import type {
  AmplifyModelType,
  QueryFactoryConfig,
  QueryFactoryResult,
  CreateInput,
  UpdateInput,
  DeleteInput,
  ModelType,
  Identifier,
} from './types';

/**
 * Create deterministic hash from object using schema-aware identifier fields
 */
function createObjectHash(
  obj: Record<string, unknown>,
  entityName: string,
): string {
  try {
    const identifierFields = getIdentifierFields(entityName);

    // Extract only the identifier fields for hashing
    const identifierData: Record<string, unknown> = {};
    for (const field of identifierFields) {
      if (obj[field] !== undefined) {
        identifierData[field] = obj[field];
      }
    }

    // If no identifier fields found, use the whole object
    const dataToHash =
      Object.keys(identifierData).length > 0 ? identifierData : obj;

    // Create deterministic hash from sorted key-value pairs
    const keys = Object.keys(dataToHash).sort();
    const pairs = keys.map(key => `${key}:${String(dataToHash[key])}`);
    const serialized = pairs.join('|');

    return createHash('sha256').update(serialized).digest('hex');
  } catch (error) {
    // Fallback to JSON.stringify if hash generation fails
    logger.warn(
      `Hash generation failed for ${entityName}, falling back to JSON`,
      { error },
    );
    return createHash('sha256').update(JSON.stringify(obj)).digest('hex');
  }
}

/**
 * Creates type-safe CRUD operations for AWS Amplify Data models.
 * Library-compatible version with explicit type preservation.
 */
export function QueryFactory<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  config: QueryFactoryConfig<TName>,
): Promise<QueryFactoryResult<TName, Types>> {
  return createQueryFactory<Types, TName>(config);
}

async function createQueryFactory<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  config: QueryFactoryConfig<TName>,
): Promise<QueryFactoryResult<TName, Types>> {
  const { name, clientKey = 'default', cache: cacheConfig } = config;
  const nameStr = String(name);

  const cache = cacheConfig ? getGlobalCache(cacheConfig) : undefined;

  // Get the initialized client
  const client = await getInitializedClient(nameStr, clientKey);
  const model = getModelFromClient(client, nameStr);

  // Create operations with explicit typing that survives compilation
  const queryResult: QueryFactoryResult<TName, Types> = {
    create: createCreateOperation<Types, TName>(model, nameStr, cache),
    update: createUpdateOperation<Types, TName>(model, nameStr, cache),
    delete: createDeleteOperation<Types, TName>(model, nameStr, cache),
    get: createGetOperation<Types, TName>(model, nameStr, cache),
    list: createListOperation<Types, TName>(model, nameStr, cache),
  };

  return queryResult;
}

// Separate functions to maintain type information
function createCreateOperation<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  model: unknown,
  nameStr: string,
  cache?: QueryCache,
): (props: {
  input: CreateInput<TName, Types>;
}) => Promise<ModelType<TName, Types>> {
  return async props => {
    try {
      const { input } = props;
      logOperation(nameStr, 'create', input);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (model as any).create(input);
      const data = validateAndReturn(response, 'create', nameStr, input);

      // Invalidate list cache after creation
      cache?.invalidatePattern(`${nameStr}:list`);

      logSuccess('create', { nameStr });
      return data as ModelType<TName, Types>;
    } catch (error) {
      throw throwError(`${nameStr} could not be created`, error);
    }
  };
}

function createUpdateOperation<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  model: unknown,
  nameStr: string,
  cache?: QueryCache,
): (props: {
  input: UpdateInput<TName, Types>;
}) => Promise<ModelType<TName, Types>> {
  return async props => {
    try {
      const { input } = props;
      logOperation(nameStr, 'update', input);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (model as any).update(input);
      const data = validateAndReturn(response, 'update', nameStr, input);

      // Extract identifier and invalidate cache
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

function createDeleteOperation<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  model: unknown,
  nameStr: string,
  cache?: QueryCache,
): (props: {
  input: DeleteInput<TName, Types>;
}) => Promise<ModelType<TName, Types>> {
  return async props => {
    try {
      const { input } = props;
      logOperation(nameStr, 'delete', input);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (model as any).delete(input);
      const data = validateAndReturn(response, 'delete', nameStr, input);

      // Extract identifier and invalidate cache
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

function createGetOperation<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  model: unknown,
  nameStr: string,
  cache?: QueryCache,
): (props: {
  input: Identifier<TName, Types>;
}) => Promise<ModelType<TName, Types>> {
  return async props => {
    try {
      const { input } = props;
      const cacheKey = `${nameStr}:get:${createObjectHash(input as Record<string, unknown>, nameStr)}`;

      // Check cache first
      const cached = cache?.get<ModelType<TName, Types>>(cacheKey);
      if (cached) {
        logSuccess('get', { nameStr, source: 'cache' });
        return cached;
      }

      logOperation(nameStr, 'get', input);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (model as any).get(input);
      const data = validateAndReturn(response, 'get', nameStr, input);

      // Cache the result
      cache?.set(cacheKey, data);

      logSuccess('get', { nameStr, data });
      return data as ModelType<TName, Types>;
    } catch (error) {
      throw throwError(`${nameStr} could not be retrieved`, error);
    }
  };
}

function createListOperation<
  Types extends Record<string, AmplifyModelType>,
  TName extends keyof Types & string,
>(
  model: unknown,
  nameStr: string,
  cache?: QueryCache,
): () => Promise<ModelType<TName, Types>[]> {
  return async () => {
    try {
      const cacheKey = `${nameStr}:list`;

      // Check cache first
      const cached = cache?.get<ModelType<TName, Types>[]>(cacheKey);
      if (cached) {
        logSuccess('list', { count: cached.length, nameStr, source: 'cache' });
        return cached;
      }

      logOperation(nameStr, 'list');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (model as any).list();
      const { data, errors } = response;

      if (errors && errors.length > 0) {
        logger.error(`GraphQL errors during ${nameStr} list operation`, {
          errors,
        });
        throw throwError(`${nameStr} list failed`, errors);
      }

      const result = (data || []) as ModelType<TName, Types>[];

      // Cache the result
      cache?.set(cacheKey, result);

      logSuccess('list', { count: result.length, nameStr });
      return result;
    } catch (error) {
      throw throwError(`${nameStr} list could not be retrieved`, error);
    }
  };
}

// Helper functions remain the same
async function getInitializedClient(nameStr: string, clientKey: string) {
  try {
    const manager = ClientManager.getInstance(clientKey);
    return await manager.getClient<{ models: Record<string, unknown> }>();
  } catch (error) {
    throw throwError(
      `Failed to resolve client for model: ${nameStr}. Make sure to call initializeQueries() first.`,
      error,
    );
  }
}

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
