// Main interface
export { ClientManager } from "./ClientManager";

// Static method convenience exports
import { ClientManager } from "./ClientManager";
export const initializeQueries = ClientManager.initializeQueries;
export const getGlobalAmplifyOutputs = ClientManager.getGlobalAmplifyOutputs;
export const getIdentifierFields = ClientManager.getIdentifierFields;

// Instance method convenience utilities - now from helpers
export { getQueryFactories } from "./helpers";

// QueryFactory is internal - users should use ClientManager methods

// Cache system
export { QueryCache, getGlobalCache, resetGlobalCache } from "./cache";

// REST-aware operations
export {
  createRestAwareQueryOperations,
  type RestAwareQueryOperations,
} from "./restAware";

// Core types - all from types file now
export type {
  AmplifyOutputs as AmplifyOutputsType,
  AmplifyModelType,
  ModelType,
  CreateInput,
  UpdateInput,
  DeleteInput,
  Identifier,
  QueryFactoryResult,
  AmplifyAuthMode,
  DatabaseResponse,
  OperationType,
  CacheConfig,
  CacheStats,
  PaginationParams,
  PaginationResult,
  SortDirection,
  PickModels,
} from "./types";
