// GraphQL error handling
export {
  createGraphQLErrorHandler,
  type GraphQLErrorHandlerConfig,
} from './GraphQLErrorHandler';

// GraphQL middleware chain
export {
  createGraphQLChain,
  wrapGraphQLResolver,
} from './GraphQLMiddlewareChain';

// GraphQL model initializer
export { createGraphQLModelInitializer } from './GraphQLModelInitializer';

// GraphQL request logger
export { createGraphQLRequestLogger } from './GraphQLRequestLogger';

// GraphQL utilities
export {
  buildGraphQLContext,
  extractEventInfo,
  extractArguments,
  setupStructuredLogging,
  hasArguments,
  getErrorMessage,
  getErrorStack,
  buildErrorContext,
  getModelsFromInput,
  getModelFromInput,
  hasModel,
  getAvailableModelNames,
} from './utils';

// GraphQL types
export type {
  GraphQLEvent,
  GraphQLResponse,
  GraphQLModelInstance,
  GraphQLBaseInput,
  GraphQLInputWithModels,
  GraphQLHandlerReturn,
  GraphQLMiddlewareChain,
  GraphQLMiddleware,
  GraphQLModelInitializerConfig,
  GraphQLRequestLoggerConfig,
  MiddlewareError,
} from './types';
