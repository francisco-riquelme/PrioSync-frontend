/* eslint-disable max-lines */
// types.ts - Library-compatible version

//#region AMPLIFY MODEL TYPES
/**
 * Base constraint interface for AWS Amplify model type definitions.
 *
 * Ensures the types object has the expected structure for AWS Amplify models.
 * This version is explicit to work better across package boundaries.
 *
 * @interface AmplifyModelType
 * @property {unknown} type - The main model type
 * @property {unknown} createType - Input type for create operations
 * @property {unknown} updateType - Input type for update operations
 * @property {unknown} deleteType - Input type for delete operations
 * @property {unknown} identifier - Primary key identifier type
 */
export interface AmplifyModelType {
  readonly type: unknown;
  readonly createType: unknown;
  readonly updateType: unknown;
  readonly deleteType: unknown;
  readonly identifier: unknown;
}

/**
 * Extracts the main model type from Amplify model definitions.
 *
 * More explicit type extraction that works better in distributed libraries
 * and preserves type information across package boundaries.
 *
 * @template T - Model name as string literal
 * @template Types - Record of all available Amplify model types
 * @returns The extracted model type or never
 */
export type ModelType<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> = Types[T] extends AmplifyModelType ? Types[T]['type'] : never;

/**
 * Extracts the create input type from Amplify model definitions.
 *
 * @template T - Model name as string literal
 * @template Types - Record of all available Amplify model types
 * @returns The extracted create input type or never
 */
export type CreateInput<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> = Types[T] extends AmplifyModelType ? Types[T]['createType'] : never;

/**
 * Extracts the update input type from Amplify model definitions.
 *
 * @template T - Model name as string literal
 * @template Types - Record of all available Amplify model types
 * @returns The extracted update input type or never
 */
export type UpdateInput<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> = Types[T] extends AmplifyModelType ? Types[T]['updateType'] : never;

/**
 * Extracts the delete input type from Amplify model definitions.
 *
 * @template T - Model name as string literal
 * @template Types - Record of all available Amplify model types
 * @returns The extracted delete input type or never
 */
export type DeleteInput<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> = Types[T] extends AmplifyModelType ? Types[T]['deleteType'] : never;

/**
 * Extracts the identifier type from Amplify model definitions.
 *
 * Used for get and delete operations that require primary key identification.
 *
 * @template T - Model name as string literal
 * @template Types - Record of all available Amplify model types
 * @returns The extracted identifier type or never
 */
export type Identifier<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> = Types[T] extends AmplifyModelType ? Types[T]['identifier'] : never;
//#endregion

//#region AMPLIFY CONFIGURATION TYPES
/**
 * Supported AWS Amplify authorization modes.
 *
 * @typedef {("iam" | "userPool" | "oidc" | "lambda" | "apiKey")} AmplifyAuthMode
 */
export type AmplifyAuthMode = 'iam' | 'userPool' | 'oidc' | 'lambda' | 'apiKey';

/**
 * AWS Amplify configuration outputs structure.
 *
 * Contains the necessary configuration data for initializing Amplify clients
 * and establishing connections to AWS services.
 *
 * @interface AmplifyOutputs
 * @property {Object} data - Core Amplify data configuration
 * @property {string} data.url - GraphQL endpoint URL
 * @property {string} data.aws_region - AWS region identifier
 * @property {AmplifyAuthMode} data.default_authorization_type - Default auth mode
 * @property {AmplifyAuthMode[]} [data.authorization_types] - Available auth modes
 * @property {string} [data.api_id] - API Gateway ID
 */
export interface AmplifyOutputs {
  data: {
    url: string;
    aws_region: string;
    default_authorization_type: AmplifyAuthMode;
    authorization_types?: AmplifyAuthMode[];
    api_id?: string;
  };
}
//#endregion

//#region DATABASE OPERATION TYPES
/**
 * Valid database operation types for logging and validation.
 *
 * @typedef {("create" | "update" | "delete" | "get" | "list")} OperationType
 */
export type OperationType = 'create' | 'update' | 'delete' | 'get' | 'list';

/**
 * Standard response structure for database operations.
 *
 * Follows GraphQL response format with data and errors fields.
 *
 * @template T - Type of the data being returned
 * @interface DatabaseResponse
 * @property {T | null} data - The response data or null if error
 * @property {Array<{message: string}>} [errors] - Array of error objects
 */
export type DatabaseResponse<T> = {
  data: T | null;
  errors?: Array<{ message: string }>;
};

/**
 * Sort direction for list operations.
 *
 * @typedef {("asc" | "desc")} SortDirection
 */
export type SortDirection = 'asc' | 'desc';
//#endregion

//#region PAGINATION TYPES
/**
 * Input parameters for paginated list operations.
 *
 * @interface PaginationParams
 * @property {number} [limit] - Maximum number of items to return per page
 * @property {string} [nextToken] - Token for retrieving the next page
 * @property {AmplifyAuthMode} [authMode] - Authorization mode for the request
 */
export interface PaginationParams {
  limit?: number;
  nextToken?: string;
  authMode?: AmplifyAuthMode;
}

/**
 * Result structure for paginated list operations.
 *
 * @template T - Type of items in the result array
 * @interface PaginationResult
 * @property {T[]} items - Array of retrieved items
 * @property {string} [nextToken] - Token for retrieving the next page
 * @property {number} [scannedCount] - Total number of items scanned
 */
export interface PaginationResult<T> {
  items: T[];
  nextToken?: string;
  scannedCount?: number;
}
//#endregion

//#region CACHE TYPES
/**
 * Configuration options for the caching system.
 *
 * @interface CacheConfig
 * @property {boolean} [enabled=true] - Enable caching for read operations
 * @property {number} [maxSize=52428800] - Maximum cache size in bytes (default: 50MB)
 * @property {number} [ttl=300000] - Time-to-live for cache entries in milliseconds (default: 5 minutes)
 * @property {string} [keyPrefix] - Cache key prefix for isolation
 */
export interface CacheConfig {
  /** Enable caching for read operations */
  enabled?: boolean;
  /** Maximum cache size in bytes (default: 50MB) */
  maxSize?: number;
  /** Time-to-live for cache entries in milliseconds (default: 5 minutes) */
  ttl?: number;
  /** Cache key prefix for isolation */
  keyPrefix?: string;
}

/**
 * Cache performance statistics for monitoring.
 *
 * @interface CacheStats
 * @property {number} hits - Number of successful cache retrievals
 * @property {number} misses - Number of cache misses requiring database queries
 * @property {number} currentSize - Current cache size in bytes
 * @property {number} entryCount - Number of entries currently in cache
 * @property {number} hitRate - Cache hit rate as decimal (0.0 to 1.0)
 */
export interface CacheStats {
  hits: number;
  misses: number;
  currentSize: number;
  entryCount: number;
  hitRate: number;
}
//#endregion

//#region FILTER TYPES
/**
 * Filter operators for string fields.
 * Provides operations like equality, comparison, pattern matching, etc.
 */
export interface StringFilter<T extends string = string> {
  /** Check if attribute exists */
  attributeExists?: boolean;
  /** String starts with the given prefix */
  beginsWith?: string;
  /** Value is between two strings (inclusive) */
  between?: [string, string];
  /** String contains the substring */
  contains?: string;
  /** Equals exact value */
  eq?: T;
  /** Greater than or equal */
  ge?: string;
  /** Greater than */
  gt?: string;
  /** Less than or equal */
  le?: string;
  /** Less than */
  lt?: string;
  /** Not equal */
  ne?: T;
  /** Does not contain substring */
  notContains?: string;
  /** Size-based filters */
  size?: SizeFilter;
}

/**
 * Filter operators for numeric fields.
 */
export interface NumericFilter {
  /** Check if attribute exists */
  attributeExists?: boolean;
  /** Value is between two numbers (inclusive) */
  between?: [number, number];
  /** Equals exact value */
  eq?: number;
  /** Greater than or equal */
  ge?: number;
  /** Greater than */
  gt?: number;
  /** Less than or equal */
  le?: number;
  /** Less than */
  lt?: number;
  /** Not equal */
  ne?: number;
}

/**
 * Filter operators for boolean fields.
 */
export interface BooleanFilters {
  /** Check if attribute exists */
  attributeExists?: boolean;
  /** Equals exact value */
  eq?: boolean;
  /** Not equal */
  ne?: boolean;
}

/**
 * Filter options for size-based operations on strings and arrays.
 */
export interface SizeFilter {
  /** Size is between two values (inclusive) */
  between?: [number, number];
  /** Size equals exact value */
  eq?: number;
  /** Size greater than or equal */
  ge?: number;
  /** Size greater than */
  gt?: number;
  /** Size less than or equal */
  le?: number;
  /** Size less than */
  lt?: number;
  /** Size not equal */
  ne?: number;
}

/**
 * Extracts a filter type for a specific field based on its type.
 */
type FieldFilter<T> = boolean extends T
  ? BooleanFilters
  : number extends T
    ? NumericFilter
    : string extends T
      ? StringFilter
      : StringFilter; // default to StringFilter for complex types

/**
 * Generates type-safe filter object for a model type.
 * Supports field-level filters with appropriate operators based on field types,
 * plus logical operators (and, or, not) for compound filtering.
 *
 * @template T - The model type to generate filters for
 */
export type ModelFilter<T> = {
  /** Combine filters with AND logic */
  and?: ModelFilter<T> | ModelFilter<T>[];
  /** Combine filters with OR logic */
  or?: ModelFilter<T> | ModelFilter<T>[];
  /** Negate a filter */
  not?: ModelFilter<T>;
} & {
  /** Field-level filters for each property in the model */
  [K in keyof T]?: T[K] extends (...args: unknown[]) => unknown
    ? never // Exclude function properties (lazy loaders/relationships)
    : FieldFilter<T[K]>;
};
//#endregion

//#region SELECTION SET TYPES
/**
 * Selection set type for specifying which fields to retrieve.
 * Supports dot notation for nested fields (e.g., 'author.email', 'posts.*')
 */
export type SelectionSet = readonly string[];
//#endregion

//#region MODEL UTILITIES
/**
 * Utility type to extract a subset of models from a model type map based on an entity list.
 *
 * This is useful in resolvers where you only need access to specific models,
 * ensuring type safety while reducing the scope of available models.
 *
 * @template TEntities - Readonly array of entity names
 * @template TTypes - Record containing all available model types
 * @returns Object type with only the specified entities from TTypes
 *
 * @example
 * ```typescript
 * const entities = ["Curso", "Usuario"] as const;
 * type ModelTypes = PickModels<typeof entities, MainTypes>;
 * // Result: { Curso: MainTypes["Curso"], Usuario: MainTypes["Usuario"] }
 * ```
 */
export type PickModels<
  TEntities extends readonly string[],
  TTypes extends Record<string, unknown>,
> = {
  [K in TEntities[number]]: K extends keyof TTypes ? TTypes[K] : never;
};
//#endregion

//#region QUERY FACTORY TYPES
/**
 * Complete CRUD operation interface for Amplify models.
 *
 * Provides type-safe database operations with consistent error handling,
 * logging, and optional caching. Preserves types across package boundaries.
 *
 * @template T - Model name as string literal
 * @template Types - Record of all available Amplify model types
 * @interface QueryFactoryResult
 */
export interface QueryFactoryResult<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> {
  /**
   * Create a new record.
   *
   * @param props - Object containing input data
   * @param props.input - Data for creating the record
   * @param props.selectionSet - Optional array of fields to retrieve (supports dot notation)
   * @returns Promise resolving to the created record
   */
  create(props: {
    input: CreateInput<T, Types>;
    selectionSet?: SelectionSet;
  }): Promise<ModelType<T, Types>>;

  /**
   * Update an existing record.
   *
   * @param props - Object containing input data
   * @param props.input - Data for updating the record (must include identifier)
   * @param props.selectionSet - Optional array of fields to retrieve (supports dot notation)
   * @returns Promise resolving to the updated record
   */
  update(props: {
    input: UpdateInput<T, Types>;
    selectionSet?: SelectionSet;
  }): Promise<ModelType<T, Types>>;

  /**
   * Delete an existing record.
   *
   * @param props - Object containing input data
   * @param props.input - Identifier for the record to delete
   * @param props.selectionSet - Optional array of fields to retrieve (supports dot notation)
   * @returns Promise resolving to the deleted record
   */
  delete(props: {
    input: DeleteInput<T, Types>;
    selectionSet?: SelectionSet;
  }): Promise<ModelType<T, Types>>;

  /**
   * Retrieve a single record by identifier.
   *
   * @param props - Object containing input data
   * @param props.input - Identifier for the record to retrieve
   * @param props.selectionSet - Optional array of fields to retrieve (supports dot notation)
   * @returns Promise resolving to the retrieved record
   */
  get(props: {
    input: Identifier<T, Types>;
    selectionSet?: SelectionSet;
  }): Promise<ModelType<T, Types>>;

  /**
   * Retrieve multiple records with optional filtering and pagination.
   *
   * @param props - Optional configuration for the list operation
   * @param props.filter - Type-safe filter criteria for the query
   * @param props.sortDirection - Sort direction (asc or desc)
   * @param props.limit - Maximum number of items to return
   * @param props.nextToken - Token for pagination
   * @param props.authMode - Authorization mode for the request
   * @param props.followNextToken - Automatically follow pagination to get all results
   * @param props.maxPages - Safety limit for automatic pagination
   * @param props.selectionSet - Optional array of fields to retrieve (supports dot notation)
   * @returns Promise resolving to paginated results
   */
  list(props?: {
    filter?: ModelFilter<ModelType<T, Types>>;
    sortDirection?: SortDirection;
    limit?: number;
    nextToken?: string;
    authMode?: AmplifyAuthMode;
    followNextToken?: boolean;
    maxPages?: number;
    selectionSet?: SelectionSet;
  }): Promise<PaginationResult<ModelType<T, Types>>>;

  /**
   * Execute a named secondary index query (queryField from schema keys).
   *
   * @param props - Configuration for the index query
   * @param props.queryField - GraphQL query field name (e.g., UsersByEmail)
   * @param props.input - Input arguments for the query field
   * @param props.filter - Type-safe filter criteria for the query
   * @param props.limit - Max items per page
   * @param props.nextToken - Token for pagination
   * @param props.authMode - Authorization mode for the request
   * @param props.followNextToken - Automatically follow pagination
   * @param props.maxPages - Safety limit for pagination
   */
  queryIndex(props: {
    queryField: string;
    input?: Record<string, unknown>;
    filter?: ModelFilter<ModelType<T, Types>>;
    limit?: number;
    nextToken?: string;
    authMode?: AmplifyAuthMode;
    followNextToken?: boolean;
    maxPages?: number;
    selectionSet?: SelectionSet;
  }): Promise<PaginationResult<ModelType<T, Types>>>;
}

/**
 * Configuration object for QueryFactory creation.
 *
 * @template T - Model name as string literal
 * @interface QueryFactoryConfig
 * @property {T} name - The name of the model from the consumer's schema
 * @property {AmplifyOutputs} [amplifyOutputs] - AWS Amplify outputs configuration
 * @property {string} [clientKey="default"] - Unique identifier for the client instance
 * @property {CacheConfig} [cache] - Cache configuration for read operations
 */
export interface QueryFactoryConfig<T extends string> {
  /** The name of the model from the consumer's schema */
  name: T;
  /**
   * AWS Amplify outputs configuration.
   * Can be provided here or globally via initializeQueries()
   */
  amplifyOutputs?: AmplifyOutputs;
  /**
   * Unique identifier for the client instance.
   * Used with singleton client management via ClientManager.
   * @default 'default'
   */
  clientKey?: string;
  /**
   * Cache configuration for read operations
   */
  cache?: CacheConfig;
}
//#endregion
