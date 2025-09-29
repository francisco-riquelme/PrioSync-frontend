# GraphQL Middleware

GraphQL resolver middleware for AWS AppSync with Amplify Data integration and structured error handling.

## Core Components

### GraphQLMiddlewareChain

- `createGraphQLChain`: Factory for GraphQL middleware chains
- `wrapGraphQLResolver`: AppSync resolver wrapper
- Type-safe composition with GraphQL event handling
- Generic type preservation across middleware stack

### GraphQLModelInitializer

- Lazy Amplify Data model initialization with caching
- GraphQL-aware error wrapping and context preservation
- Concurrent request protection and timeout handling
- Multi-tenant support via client key isolation

### GraphQLRequestLogger

- Resolver execution logging with GraphQL metadata
- Field name, operation type, and argument extraction
- Configurable field exclusion for security
- Identity and request context logging

### GraphQLErrorHandler

- Centralized GraphQL error handling with structured responses
- AppSync error format compliance with extensions
- Stack trace capture and middleware execution info
- Error classification with context preservation

## Error System

GraphQL errors maintain AppSync compatibility while providing structured error information through extensions.

### Error Utilities

```typescript
buildErrorContext(error, additionalContext);
getErrorMessage(error);
getErrorStack(error);
extractEventInfo(event);
```

## Model Access

```typescript
// Type-safe model retrieval
const models = getModelsFromInput<TTypes, TSelected>(input);
const user = getModelFromInput(input, 'User');
const hasUser = hasModel(input, 'User');
const available = getAvailableModelNames(input);
```

## Utilities

**Context**: `buildGraphQLContext`, `setupStructuredLogging`, `buildErrorContext`
**Event**: `extractEventInfo`, `extractArguments`, `hasArguments`  
**Models**: `getModelsFromInput`, `getModelFromInput`, `hasModel`, `getAvailableModelNames`
**Error**: `getErrorMessage`, `getErrorStack`

## Usage Pattern

```typescript
const chain = createGraphQLChain()
  .use(createGraphQLModelInitializer({ entities: ['User', 'Post'] }))
  .use(createGraphQLRequestLogger())
  .use(createGraphQLErrorHandler());

export const handler = wrapGraphQLResolver(chain, async input => {
  const { User } = getModelsFromInput(input);
  const { userId } = extractArguments(input);
  // Resolver logic
  return result;
});
```

## Key Types

```typescript
GraphQLEvent; // AppSync resolver event
GraphQLResponse; // AppSync resolver result
GraphQLBaseInput; // Input without models
GraphQLInputWithModels; // Input with Amplify models
GraphQLMiddleware; // Middleware function signature
MiddlewareError; // Enhanced error with middleware context
```

## Performance

- **Initialization**: 100-500ms first request, cached afterward
- **Logging**: Minimal overhead with configurable detail levels
- **Error Handling**: Optimized AppSync error format generation
- **Model Access**: Cached client instances with lazy loading

## Security

- Field exclusion for sensitive data in logs
- Stack traces logged but not exposed in GraphQL responses
- Client key isolation for multi-tenant scenarios
- Identity context extraction with safe property access
