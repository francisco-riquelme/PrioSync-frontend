import { Amplify } from "aws-amplify";
import { ClientManager } from "./ClientManager";
import { QueryFactory } from "./QueryFactory";
import { logger } from "../log";
import type { AmplifyOutputs, AmplifyModelType, CacheConfig } from "./types";

// Global state
let globalAmplifyOutputs: AmplifyOutputs | null = null;
let globalSchema: { models: Record<string, unknown> } | null = null;
let initializationPromise: Promise<void> | null = null;
const queryFactories = new Map<string, unknown>();

/**
 * Extract identifier field names from model schema
 */
function extractIdentifierFields<
  TSchema extends { models: Record<string, unknown> },
>(schema: TSchema, entityName: string): string[] {
  try {
    // Get the model definition from schema
    const model = schema.models[entityName];
    if (!model || typeof model !== "object") {
      logger.warn(`Model ${entityName} not found in schema`);
      return [`${entityName.toLowerCase()}Id`];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelAny = model as any;

    // Check for Amplify identifier definition (composite keys)
    if (modelAny.identifier && Array.isArray(modelAny.identifier)) {
      return modelAny.identifier;
    }

    // Check for single identifier in different possible locations
    if (modelAny.identifier && typeof modelAny.identifier === "string") {
      return [modelAny.identifier];
    }

    // Check if model has a primaryKey definition
    if (modelAny.primaryKey && Array.isArray(modelAny.primaryKey)) {
      return modelAny.primaryKey;
    }

    // Check if model has keys definition
    if (modelAny.keys && Array.isArray(modelAny.keys)) {
      return modelAny.keys;
    }

    // Fallback to naming convention
    const conventionId = `${entityName.toLowerCase()}Id`;
    return [conventionId];
  } catch (error) {
    logger.warn(
      `Failed to extract identifier for ${entityName}, using convention`,
      { error }
    );
    return [`${entityName.toLowerCase()}Id`];
  }
}

/**
 * Get stored identifier fields for an entity (lazy extraction)
 */
export function getIdentifierFields(entityName: string): string[] {
  if (!globalSchema) {
    return [`${entityName.toLowerCase()}Id`]; // Fallback
  }

  return extractIdentifierFields(globalSchema, entityName);
}

/**
 * Initialize queries with schema and generate query factories automatically.
 */
export async function initializeQueries<
  TSchema extends { models: Record<string, unknown> },
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(config: {
  amplifyOutputs: AmplifyOutputs;
  schema: TSchema;
  entities?: readonly TSelected[] | undefined;
  clientKey?: string | undefined;
  cache?: CacheConfig | undefined;
}): Promise<{
  [K in TSelected]: Awaited<
    ReturnType<typeof QueryFactory<TTypes, K & string>>
  >;
}> {
  const {
    amplifyOutputs,
    schema,
    entities,
    clientKey = "default",
    cache,
  } = config;

  // Initialize Amplify system once
  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        Amplify.configure(amplifyOutputs);
        globalAmplifyOutputs = amplifyOutputs;
        globalSchema = schema;

        const manager = ClientManager.getInstance(clientKey);
        await manager.initialize<TTypes>();
      } catch (error) {
        initializationPromise = null;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        logger.error("Failed to initialize Amplify system", {
          error: errorMessage,
        });
        throw error;
      }
    })();
  }
  await initializationPromise;

  // Get entity names to initialize - filter for only the selected entities
  const schemaModelNames = Object.keys(schema.models || {}).filter(
    (key): key is string => typeof key === "string"
  );

  // Use only the entities specified, or fall back to all schema models
  const entitiesToInitialize: TSelected[] = entities
    ? [...entities]
    : (schemaModelNames as TSelected[]);

  const queries: Record<string, unknown> = {};

  // Generate query factories for selected entities only
  for (const entityName of entitiesToInitialize) {
    const entityKey = String(entityName) as TSelected;

    if (queryFactories.has(entityKey)) {
      queries[entityName] = queryFactories.get(entityKey);
      continue;
    }

    try {
      const queryFactory = await QueryFactory<TTypes, typeof entityKey>({
        name: entityKey,
        clientKey,
        ...(cache && { cache }),
      });

      queryFactories.set(entityKey, queryFactory);
      queries[entityName] = queryFactory;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to initialize entity "${entityKey}": ${errorMessage}`
      );
    }
  }

  return queries as {
    [K in TSelected]: Awaited<
      ReturnType<typeof QueryFactory<TTypes, K & string>>
    >;
  };
}

/**
 * Gets the global Amplify outputs
 */
export function getGlobalAmplifyOutputs(): AmplifyOutputs | null {
  return globalAmplifyOutputs;
}
