# Queries Module

## Overview

The queries module provides standardized CRUD operations for AWS Amplify Data models. It abstracts Amplify client management and implements type-safe database operations with consistent error handling, logging, and optional in-memory caching.

## Core Components

### QueryFactory

The primary interface for creating type-safe CRUD operations. Generates create, read, update, delete, and list operations for specified Amplify Data models.

**Key Features:**

- Type preservation across package boundaries
- Automatic client management through singleton pattern
- Comprehensive error handling with context preservation
- Structured logging for all operations
- Optional in-memory caching with LRU eviction and TTL
- Generic design supporting arbitrary model schemas

**Operation Types:**

- `create`: Insert new records with validation
- `update`: Modify existing records with validation
- `delete`: Remove records by identifier
- `get`: Retrieve single records by identifier (cache-enabled)
- `list`: Retrieve all records for a model (cache-enabled)

### ClientManager

Singleton manager for AWS Amplify client instances. Handles client initialization, lifecycle management, and instance isolation.

**Capabilities:**

- Multi-client support via unique keys
- Lazy initialization with promise-based concurrency handling
- Global reset functionality for testing scenarios
- Error recovery through re-initialization attempts

### Initialization System

Global configuration system for Amplify setup and automatic query factory generation.

**Functions:**

- `initializeQueries`: Configures Amplify and generates query factories for specified entities
- `getGlobalAmplifyOutputs`: Retrieves current global configuration

**Features:**

- Schema-driven entity discovery
- Selective entity initialization
- Client key isolation
- Configuration caching and reuse
- Identifier field extraction for cache optimization

### Caching System

Optional in-memory caching layer with LRU eviction and memory-based size limits.

**Cache Features:**

- **LRU Eviction**: Automatically removes least recently used entries when memory limit reached
- **Memory Limits**: Configurable maximum size (default: 50MB shared across all models)
- **TTL Support**: Time-to-live expiration (default: 5 minutes)
- **Smart Invalidation**: Automatic cache invalidation on create/update/delete operations
- **Composite Key Support**: Handles single and multi-field identifiers from schema
- **Performance Monitoring**: Hit/miss statistics and cache size tracking

**Cache Configuration:**

```typescript
interface CacheConfig {
  enabled?: boolean; // Enable/disable caching (default: true)
  maxSize?: number; // Maximum cache size in bytes (default: 50MB)
  ttl?: number; // Time-to-live in milliseconds (default: 5 minutes)
  keyPrefix?: string; // Cache key prefix for isolation
}
```

**Cache Behavior:**

- **Read Operations**: `get` and `list` operations check cache first, fall back to database
- **Write Operations**: `create`, `update`, `delete` operations invalidate related cache entries
- **Key Generation**: Uses schema-extracted identifiers for compact, efficient cache keys
- **Memory Management**: Shared global cache instance prevents per-model memory multiplication

### REST-Aware Operations

Extended query operations with HTTP-specific error handling. Maps database errors to appropriate REST status codes.

**Error Mapping:**

- Not found conditions → 404 Not Found
- Validation failures → 400 Bad Request
- Constraint violations → 409 Conflict
- System errors → 500 Internal Server Error

**Benefits:**

- Consistent REST API behavior
- Structured error context for debugging
- Type-safe wrapper around base operations

## Type System

### Core Types

- `AmplifyModelType`: Base interface defining model structure requirements
- `ModelType`: Extracts concrete type from model definition
- `CreateInput`/`UpdateInput`/`DeleteInput`: Operation-specific input types
- `Identifier`: Primary key type extraction
- `QueryFactoryResult`: Complete CRUD operation interface

### Configuration Types

- `QueryFactoryConfig`: Configuration for individual factory creation
- `AmplifyOutputs`: AWS Amplify configuration structure
- `DatabaseResponse`: Standardized response format
- `CacheConfig`: Cache behavior configuration
- `CacheStats`: Cache performance metrics

## Helper Functions

### Logging Utilities

- `logOperation`: Standardized operation start logging
- `logSuccess`: Standardized operation completion logging

### Validation Functions

- `validateResponse`: GraphQL response structure validation
- `validateAndReturn`: Combined validation and data extraction

### Cache Utilities

- `extractIdentifier`: Schema-aware identifier field extraction
- `getGlobalCache`: Shared cache instance management
- `resetGlobalCache`: Cache cleanup for testing

## Error Handling

The module implements multi-layered error handling:

1. **Validation Layer**: Input and response structure validation
2. **GraphQL Layer**: AWS Amplify error interpretation
3. **Application Layer**: Context-aware error wrapping
4. **REST Layer**: HTTP status code mapping (optional)

All errors maintain original error context while providing meaningful application-level messages.

## Architecture Patterns

### Singleton Pattern

Client management uses singleton pattern to prevent duplicate initialization and ensure resource efficiency. Cache system also uses singleton pattern for shared memory management.

### Factory Pattern

Query operations are generated dynamically based on model configuration, enabling type-safe operations without code generation.

### Wrapper Pattern

REST-aware operations wrap base operations to provide specialized behavior without modifying core functionality.

### Promise-Based Concurrency

Initialization uses promise-based patterns to handle concurrent access during startup phases.

### LRU Caching Pattern

In-memory cache uses Least Recently Used eviction strategy with memory-based size limits for optimal Lambda performance.

## Performance Considerations

### Lambda Optimization

- **Shared Cache**: Single 50MB cache across all models prevents memory multiplication
- **Warm Execution**: Cache persists across Lambda invocations within same container
- **Cold Start Impact**: Cache rebuilds on new container initialization
- **Memory Efficiency**: LRU eviction ensures memory usage stays within limits

### Cache Strategy

- **Read-Heavy Workloads**: Significant performance improvement for repeated queries
- **Write Operations**: Smart invalidation maintains data consistency
- **TTL Expiration**: Prevents stale data issues in long-running containers

## Dependencies

- `aws-amplify/data`: Core Amplify data client
- `aws-amplify`: Configuration management
- `lru-cache`: In-memory caching with LRU eviction
- Internal error handling module
- Internal logging module

## Exports

### Primary Exports

- `QueryFactory`: Main factory function
- `ClientManager`: Client management class
- `initializeQueries`: Global initialization function

### Cache Exports

- `QueryCache`: LRU cache implementation
- `getGlobalCache`: Shared cache instance factory
- `resetGlobalCache`: Cache cleanup utility

### Utility Exports

- `createRestAwareQueryOperations`: REST error handling wrapper
- `extractIdentifier`: Schema-aware identifier extraction
- Complete type system for external consumption
- Helper functions for validation and logging

## Usage Examples

### Basic Usage with Caching

```typescript
import { initializeQueries } from '@your-org/amplify-shared-utilities/queries';

// Initialize with caching enabled
const queries = await initializeQueries({
  amplifyOutputs,
  schema,
  entities: ['User', 'Eve', 'Residence'],
});

// Configure cache per query factory
const userQueries = await QueryFactory({
  name: 'User',
  cache: {
    enabled: true,
    maxSize: 50 * 1024 * 1024, // 50MB
    ttl: 5 * 60 * 1000, // 5 minutes
  },
});

// Cache-enabled operations
const user = await userQueries.get({ input: { userId: '123' } }); // Database hit
const sameUser = await userQueries.get({ input: { userId: '123' } }); // Cache hit
```

### Cache Statistics Monitoring

```typescript
import { getGlobalCache } from '@your-org/amplify-shared-utilities/queries';

const cache = getGlobalCache();
const stats = cache.getStats();

console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`Cache size: ${(stats.currentSize / 1024 / 1024).toFixed(2)}MB`);
console.log(`Cache entries: ${stats.entryCount}`);
```

## Testing Considerations

The module includes comprehensive test coverage addressing:

- Type safety validation
- Error handling scenarios
- Client lifecycle management
- Concurrent initialization handling
- Mock-based external dependency isolation
- Cache behavior and invalidation logic
- Memory usage and LRU eviction scenarios
- Identifier extraction for various model schemas
