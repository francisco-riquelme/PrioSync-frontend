// ClientManager.ts
import { generateClient } from "aws-amplify/data";
import { Amplify } from "aws-amplify";
import { logger } from "../log";
import type {
  QueryFactoryResult,
  AmplifyModelType,
  CacheConfig,
  AmplifyOutputs,
} from "./types";

//#region GLOBAL STATE AND UTILITIES
/**
 * Global state for schema and configuration management.
 * These variables maintain the system-wide Amplify configuration.
 */
let globalAmplifyOutputs: AmplifyOutputs | null = null;
let globalSchema: { models: Record<string, unknown> } | null = null;
let initializationPromise: Promise<void> | null = null;

/**
 * Extracts identifier field names from Amplify model schema.
 *
 * Attempts to find identifier fields using various schema properties:
 * - identifier (array or string)
 * - primaryKey (array)
 * - keys (array)
 * - Falls back to convention-based naming
 *
 * @param schema - The Amplify schema containing model definitions
 * @param entityName - Name of the entity to extract identifiers for
 * @returns Array of identifier field names
 */
function extractIdentifierFields<
  TSchema extends { models: Record<string, unknown> },
>(schema: TSchema, entityName: string): string[] {
  try {
    const model = schema.models[entityName];
    if (!model || typeof model !== "object") {
      logger.warn(`Model ${entityName} not found in schema`);
      return [`${entityName.toLowerCase()}Id`];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modelAny = model as any;

    if (modelAny.identifier && Array.isArray(modelAny.identifier)) {
      return modelAny.identifier;
    }

    if (modelAny.identifier && typeof modelAny.identifier === "string") {
      return [modelAny.identifier];
    }

    if (modelAny.primaryKey && Array.isArray(modelAny.primaryKey)) {
      return modelAny.primaryKey;
    }

    if (modelAny.keys && Array.isArray(modelAny.keys)) {
      return modelAny.keys;
    }

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
//#endregion

//#region CLIENT MANAGER CLASS
/**
 * Singleton manager for AWS Amplify client instances and query factories.
 *
 * Handles complete lifecycle management including:
 * - Amplify client initialization
 * - Query factory creation and storage
 * - Global system configuration
 * - Multi-client isolation via unique keys
 */
export class ClientManager {
  private static instances = new Map<string, ClientManager>();
  private client: unknown | null = null;
  private initPromise: Promise<void> | null = null;
  private queryFactories = new Map<string, unknown>();
  private schema: { models: Record<string, unknown> } | null = null;

  private constructor(private readonly clientKey: string) {}

  //#region STATIC FACTORY METHODS
  /**
   * Gets or creates a ClientManager instance for the specified key with optional schema.
   *
   * @template TSchema - Schema type containing model definitions
   * @param clientKey - Unique identifier for client isolation (default: "default")
   * @param schema - Optional schema to use for typing the client
   * @returns ClientManager instance for the specified key
   */
  public static getInstance<
    TSchema extends { models: Record<string, unknown> } = {
      models: Record<string, unknown>;
    },
  >(clientKey: string = "default", schema?: TSchema): ClientManager {
    if (!ClientManager.instances.has(clientKey)) {
      ClientManager.instances.set(clientKey, new ClientManager(clientKey));
    }

    const instance = ClientManager.instances.get(clientKey)!;

    // Store the schema if provided
    if (schema) {
      instance.setSchema(schema);
    }

    return instance;
  }

  /**
   * Main initialization method for the entire system.
   *
   * Configures Amplify globally and initializes query factories for specified entities.
   * This is the primary entry point for system setup.
   *
   * @template TSchema - Schema type containing model definitions
   * @template TTypes - Record of all available Amplify model types
   * @template TSelected - Selected entity names to initialize
   * @param config - Configuration object for initialization
   * @returns Promise resolving to query factories for all specified entities
   */
  public static async initializeQueries<
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
    [K in TSelected]: QueryFactoryResult<K, TTypes>;
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
          await manager.initializeClient<TTypes>();
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

    // Get entity names to initialize
    const schemaModelNames = Object.keys(schema.models || {}).filter(
      (key): key is string => typeof key === "string"
    );

    const entitiesToInitialize: TSelected[] = entities
      ? [...entities]
      : (schemaModelNames as TSelected[]);

    const manager = ClientManager.getInstance(clientKey);

    // Use centralized logic to ensure query factories exist
    const { queries } = await manager.ensureQueryFactories<TTypes, TSelected>({
      entities: entitiesToInitialize,
      cache,
      createMissing: true,
    });

    return queries as {
      [K in TSelected]: QueryFactoryResult<K, TTypes>;
    };
  }

  /**
   * Gets global identifier fields for an entity from the schema.
   *
   * @param entityName - Name of the entity to get identifier fields for
   * @returns Array of identifier field names
   */
  public static getIdentifierFields(entityName: string): string[] {
    if (!globalSchema) {
      return [`${entityName.toLowerCase()}Id`]; // Fallback
    }
    return extractIdentifierFields(globalSchema, entityName);
  }

  /**
   * Gets the current global Amplify configuration.
   *
   * @returns Global Amplify outputs or null if not configured
   */
  public static getGlobalAmplifyOutputs(): AmplifyOutputs | null {
    return globalAmplifyOutputs;
  }

  /**
   * Resets all client instances and global state.
   * Primarily used for testing scenarios.
   */
  public static resetAll(): void {
    ClientManager.instances.forEach((manager) => manager.reset());
    ClientManager.instances.clear();
    logger.debug("All clients reset");
  }
  //#endregion

  //#region CLIENT MANAGEMENT
  /**
   * Sets the schema for this client manager instance.
   *
   * @template TSchema - Schema type containing model definitions
   * @param schema - Schema to use for typing
   */
  public setSchema<TSchema extends { models: Record<string, unknown> }>(
    schema: TSchema
  ): void {
    this.schema = schema;
  }

  /**
   * Gets the stored schema for this instance.
   *
   * @returns The stored schema or null if not set
   */
  public getSchema(): { models: Record<string, unknown> } | null {
    return this.schema;
  }

  /**
   * Gets the initialized Amplify client with proper typing based on the schema.
   *
   * @template TTypes - Record of all available Amplify model types (inferred from schema)
   * @returns Promise resolving to the initialized client
   */
  public async getClient<
    TTypes extends Record<string, unknown> = Record<string, unknown>,
  >(): Promise<TTypes> {
    // If client is already initialized, return it
    if (this.client !== null) {
      return this.client as TTypes;
    }

    // Check if Amplify has been configured globally
    if (!globalAmplifyOutputs) {
      throw new Error(
        "Amplify not configured. Call ClientManager.initializeQueries() with amplifyOutputs first."
      );
    }

    // Initialize the client if not already in progress
    await this.initializeClient<TTypes>();

    // After initialization, client should not be null
    if (this.client === null) {
      throw new Error(
        `Client initialization failed for key: ${this.clientKey}`
      );
    }

    return this.client as TTypes;
  }

  /**
   * Checks if the client has been initialized.
   *
   * @returns True if client is initialized, false otherwise
   */
  public isInitialized(): boolean {
    return this.client !== null;
  }

  /**
   * Resets this client instance, clearing all state.
   */
  public reset(): void {
    this.client = null;
    this.initPromise = null;
    this.queryFactories.clear();
    logger.debug(`Client reset for key: ${this.clientKey}`);
  }
  //#endregion

  //#region QUERY FACTORY STORAGE
  /**
   * Stores a query factory for reuse.
   *
   * @template T - Entity name as string literal
   * @template TTypes - Record of all available Amplify model types
   * @param entityName - Name of the entity
   * @param factory - Query factory instance to store
   */
  private setQueryFactory<
    T extends string,
    TTypes extends Record<T, AmplifyModelType>,
  >(entityName: T, factory: QueryFactoryResult<T, TTypes>): void {
    this.queryFactories.set(entityName, factory);
    logger.debug(`Query factory stored for entity: ${entityName}`);
  }

  /**
   * Retrieves a stored query factory.
   *
   * @template T - Entity name as string literal
   * @template TTypes - Record of all available Amplify model types
   * @param entityName - Name of the entity
   * @returns Query factory instance or null if not found
   */
  private getQueryFactory<
    T extends string,
    TTypes extends Record<T, AmplifyModelType>,
  >(entityName: T): QueryFactoryResult<T, TTypes> | null {
    const factory = this.queryFactories.get(entityName);
    return factory ? (factory as QueryFactoryResult<T, TTypes>) : null;
  }
  //#endregion

  //#region QUERY FACTORY OPERATIONS
  /**
   * Gets query factories with automatic initialization of missing entities.
   *
   * This is the main method for retrieving query factories. If entities haven't
   * been initialized yet, they will be created automatically.
   *
   * @template TTypes - Record of all available Amplify model types
   * @template TSelected - Selected entity names to retrieve
   * @param config - Configuration for query factory retrieval
   * @returns Promise resolving to query factories for all specified entities
   */
  public async getQueryFactories<
    TTypes extends Record<string, AmplifyModelType>,
    TSelected extends keyof TTypes & string,
  >(config: {
    entities: readonly TSelected[];
    cache?: CacheConfig;
  }): Promise<{
    [K in TSelected]: QueryFactoryResult<K, TTypes>;
  }> {
    const { entities, cache } = config;

    // Ensure Amplify is configured
    if (!globalAmplifyOutputs) {
      throw new Error(
        "Amplify not configured. Call ClientManager.initializeQueries() with amplifyOutputs first."
      );
    }

    const { queries } = await this.ensureQueryFactories<TTypes, TSelected>({
      entities,
      cache,
      createMissing: true,
    });

    return queries as {
      [K in TSelected]: QueryFactoryResult<K, TTypes>;
    };
  }

  /**
   * Ensures query factories exist, creating them if needed.
   *
   * This is a centralized method that eliminates code duplication between
   * different initialization functions.
   *
   * @template TTypes - Record of all available Amplify model types
   * @template TSelected - Selected entity names to ensure
   * @param config - Configuration for factory creation
   * @returns Promise resolving to factory creation results
   */
  private async ensureQueryFactories<
    TTypes extends Record<string, AmplifyModelType>,
    TSelected extends keyof TTypes & string,
  >(config: {
    entities: readonly TSelected[];
    cache?: CacheConfig;
    createMissing?: boolean;
  }): Promise<{
    queries: Record<string, unknown>;
    missing: string[];
    initialized: string[];
  }> {
    const { entities, cache, createMissing = true } = config;
    const queries: Record<string, unknown> = {};
    const missing: string[] = [];
    const initialized: string[] = [];

    // Check which entities are already initialized
    for (const entityName of entities) {
      const entityKey = String(entityName) as TSelected;
      const existingFactory = this.getQueryFactory(entityKey);

      if (existingFactory) {
        queries[entityName] = existingFactory;
      } else {
        missing.push(entityKey);
      }
    }

    // Create missing entities if requested
    if (createMissing && missing.length > 0) {
      const { QueryFactory } = await import("./QueryFactory");

      logger.info(`Creating query factories for: ${missing.join(", ")}`, {
        missing,
        clientKey: this.clientKey,
      });

      for (const entityKey of missing) {
        try {
          const queryFactory = await QueryFactory<TTypes, typeof entityKey>({
            name: entityKey as TSelected,
            clientKey: this.clientKey,
            ...(cache && { cache }),
          });

          this.setQueryFactory(entityKey, queryFactory);
          queries[entityKey] = queryFactory;
          initialized.push(entityKey);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          throw new Error(
            `Failed to initialize entity "${entityKey}": ${errorMessage}`
          );
        }
      }
    }

    return { queries, missing, initialized };
  }
  //#endregion

  //#region PRIVATE METHODS
  /**
   * Initializes the Amplify client instance.
   *
   * @private
   * @template T - Type of the client (should extend Record<string, unknown>)
   * @returns Promise that resolves when client is initialized
   * @throws Error if client generation fails
   */
  private async initializeClient<
    T extends Record<string, unknown> = Record<string, unknown>,
  >(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = (async () => {
        try {
          this.client = generateClient<T>();
        } catch (error) {
          this.initPromise = null; // Allow retry
          const message =
            error instanceof Error ? error.message : String(error);
          logger.error(`Client generation failed for key: ${this.clientKey}`, {
            error: message,
          });
          throw new Error(
            `Failed to generate client '${this.clientKey}': ${message}`
          );
        }
      })();
    }

    await this.initPromise;
  }
  //#endregion
}
//#endregion
