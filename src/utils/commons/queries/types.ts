// types.ts - Library-compatible version
/**
 * Constraint to ensure the types object has the expected structure for AWS Amplify models.
 * This version is more explicit to work better across package boundaries.
 */
export interface AmplifyModelType {
  readonly type: unknown;
  readonly createType: unknown;
  readonly updateType: unknown;
  readonly deleteType: unknown;
  readonly identifier: unknown;
}

/**
 * More explicit type extraction that works better in distributed libraries
 */
export type ModelType<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> = Types[T] extends AmplifyModelType ? Types[T]['type'] : never;

export type CreateInput<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> = Types[T] extends AmplifyModelType ? Types[T]['createType'] : never;

export type UpdateInput<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> = Types[T] extends AmplifyModelType ? Types[T]['updateType'] : never;

export type DeleteInput<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> = Types[T] extends AmplifyModelType ? Types[T]['deleteType'] : never;

export type Identifier<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> = Types[T] extends AmplifyModelType ? Types[T]['identifier'] : never;

/**
 * More explicit QueryFactory result type that preserves types across package boundaries
 */
export interface QueryFactoryResult<
  T extends string,
  Types extends Record<T, AmplifyModelType>,
> {
  create(props: { input: CreateInput<T, Types> }): Promise<ModelType<T, Types>>;

  update(props: { input: UpdateInput<T, Types> }): Promise<ModelType<T, Types>>;

  delete(props: { input: DeleteInput<T, Types> }): Promise<ModelType<T, Types>>;

  get(props: { input: Identifier<T, Types> }): Promise<ModelType<T, Types>>;

  list(): Promise<ModelType<T, Types>[]>;
}

/**
 * Helper type for better IntelliSense in consuming applications
 */
export type TypedQueryResult<
  TName extends string,
  TTypes extends Record<TName, AmplifyModelType>,
> = {
  [K in TName]: QueryFactoryResult<K, TTypes>;
};

export type AmplifyAuthMode = 'iam' | 'userPool' | 'oidc' | 'lambda' | 'apiKey';

export interface AmplifyOutputs {
  data: {
    url: string;
    aws_region: string;
    default_authorization_type: AmplifyAuthMode;
    authorization_types?: AmplifyAuthMode[];
    api_id?: string;
  };
}

/**
 * Cache configuration options
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
 * Configuration object for QueryFactory
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

/**
 * Standard response structure for database operations
 */
export type DatabaseResponse<T> = {
  data: T | null;
  errors?: Array<{ message: string }>;
};

/**
 * Valid operation types for logging and validation
 */
export type OperationType = 'create' | 'update' | 'delete' | 'get' | 'list';
