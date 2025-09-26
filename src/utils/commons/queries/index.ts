// Client management
export { ClientManager } from './ClientManager';
export { initializeQueries, getGlobalAmplifyOutputs } from './initialize';

// Query Factory
export { QueryFactory } from './QueryFactory';

// Cache system
export {
  QueryCache,
  getGlobalCache,
  resetGlobalCache,
  type CacheConfig,
  type CacheStats,
} from './cache';

// REST-aware operations
export {
  createRestAwareQueryOperations,
  type RestAwareQueryOperations,
} from './restAware';

// Core types
export type {
  AmplifyOutputs as AmplifyOutputsType,
  AmplifyModelType,
  ModelType,
  CreateInput,
  UpdateInput,
  DeleteInput,
  Identifier,
  QueryFactoryResult,
  QueryFactoryConfig,
  TypedQueryResult,
  AmplifyAuthMode,
  DatabaseResponse,
  OperationType,
} from './types';
