# Queries Module

## Overview

The queries module provides standardized CRUD operations for AWS Amplify Data models with type-safe database operations, error handling, logging, and optional caching.

## Core Components

### QueryFactory

Generates create, read, update, delete, and list operations for Amplify Data models.

- Type preservation across package boundaries
- Automatic client management through singleton pattern
- Error handling with context preservation
- Structured logging for all operations
- Optional in-memory caching with LRU eviction and TTL
- Generic design supporting arbitrary model schemas

**Operations:**

- `create`: Insert new records with validation
- `update`: Modify existing records with validation
- `delete`: Remove records by identifier
- `get`: Retrieve single records by identifier (cache-enabled)
- `list`: Retrieve records for a model with pagination support (cache-enabled)

### ClientManager

Singleton manager for AWS Amplify client instances.

- Multi-client support via unique keys
- Lazy initialization with promise-based concurrency handling
- Global reset functionality for testing scenarios
- Error recovery through re-initialization attempts
- Query factory storage and retrieval

### Caching System

Optional in-memory caching layer with LRU eviction.

- LRU eviction when memory limit reached
- Configurable maximum size (default: 50MB shared across all models)
- TTL support (default: 5 minutes)
- Smart invalidation on create/update/delete operations
- Composite key support for single and multi-field identifiers
- Performance monitoring with hit/miss statistics

### REST-Aware Operations

Extended query operations with HTTP-specific error handling.

**Error Mapping:**

- Not found conditions → 404 Not Found
- Validation failures → 400 Bad Request
- Constraint violations → 409 Conflict
- System errors → 500 Internal Server Error

## Usage

### Initialization

```typescript
import { initializeQueries } from '@your-org/amplify-shared-utilities/queries';

const queries = await initializeQueries({
  amplifyOutputs,
  schema,
  entities: ['User', 'Course', 'Enrollment'],
  cache: { enabled: true, maxSize: 50 * 1024 * 1024 },
});
```

### Basic Operations

```typescript
// Create
const user = await queries.User.create({ input: userData });

// Get (cache-enabled)
const user = await queries.User.get({ input: { userId: '123' } });

// Update
const updatedUser = await queries.User.update({ input: updateData });

// Delete
await queries.User.delete({ input: { userId: '123' } });

// List
const result = await queries.User.list({ limit: 50 });
```

### Auto-Initializing Query Factories

```typescript
import { getQueryFactories } from '@your-org/amplify-shared-utilities/queries';

// Automatically initializes missing entities
const queries = await getQueryFactories({
  entities: ['User', 'Course'],
  cache: { enabled: true },
});

const users = await queries.User.list();
```

### Existing Query Factories Only

```typescript
import {
  getExistingQueryFactories,
  areEntitiesInitialized,
} from '@your-org/amplify-shared-utilities/queries';

if (areEntitiesInitialized(['User'])) {
  const queries = getExistingQueryFactories({ entities: ['User'] });
  if (queries.User) {
    const users = await queries.User.list();
  }
}
```

## Pagination

### Manual Pagination

```typescript
// First page
const page1 = await queries.User.list({ limit: 20 });

// Next page
const page2 = await queries.User.list({
  limit: 20,
  nextToken: page1.nextToken,
});
```

### Automatic Pagination

```typescript
// Retrieve all pages automatically
const allUsers = await queries.User.list({
  followNextToken: true,
  maxPages: 50, // Safety limit
});

console.log(`Retrieved ${allUsers.items.length} total users`);
console.log(`Scanned ${allUsers.scannedCount} records`);
```

### Filtered Pagination

```typescript
const activeUsers = await queries.User.list({
  filter: { isActive: { eq: true } },
  followNextToken: true,
  maxPages: 20,
});
```

## Configuration Options

### Cache Configuration

```typescript
interface CacheConfig {
  enabled?: boolean; // Default: true
  maxSize?: number; // Default: 50MB
  ttl?: number; // Default: 5 minutes
  keyPrefix?: string; // Cache key prefix
}
```

### Pagination Parameters

| Parameter         | Type            | Default | Description                      |
| ----------------- | --------------- | ------- | -------------------------------- |
| `limit`           | number          | -       | Items per page                   |
| `nextToken`       | string          | -       | Token for specific page          |
| `followNextToken` | boolean         | false   | Auto-follow all pages            |
| `maxPages`        | number          | 10      | Safety limit for auto-pagination |
| `filter`          | object          | -       | Filter criteria                  |
| `sortDirection`   | "asc" \| "desc" | -       | Sort direction                   |
| `authMode`        | AmplifyAuthMode | -       | Authorization mode               |

## REST-Aware Operations

```typescript
import { createRestAwareQueryOperations } from '@your-org/amplify-shared-utilities/queries';

const restQueries = createRestAwareQueryOperations(queries.User, 'User', {
  requestId: 'req-123',
});

// Throws appropriate HTTP errors
const user = await restQueries.get({ input: { userId: '123' } });
```

## Next.js Integration

### App-Level Initialization

```typescript
// _app.tsx or layout.tsx
import { ClientManager } from '@your-org/amplify-shared-utilities/queries';

const initializeApp = async () => {
  await ClientManager.initializeQueries({
    amplifyOutputs,
    schema,
    entities: ['User', 'Course', 'Enrollment'],
    cache: { enabled: true, maxSize: 50 * 1024 * 1024 },
  });
};

initializeApp();
```

### Page-Level Usage

```typescript
// pages/users.tsx
import { getQueryFactories } from '@your-org/amplify-shared-utilities/queries';

export default function UsersPage() {
  useEffect(() => {
    const loadUsers = async () => {
      const queries = await getQueryFactories({
        entities: ['User'],
        cache: { enabled: true },
      });

      const result = await queries.User.list({ limit: 50 });
      setUsers(result.items);
    };

    loadUsers();
  }, []);
}
```

### Server-Side Rendering

```typescript
export const getServerSideProps: GetServerSideProps = async context => {
  const queries = await getQueryFactories({
    entities: ['Course'],
  });

  const courseId = context.params?.id as string;
  const course = await queries.Course.get({ input: { courseId } });

  return { props: { course: course || null } };
};
```

## Performance Considerations

### Caching Strategy

- Read operations check cache first, fall back to database
- Write operations invalidate related cache entries
- Simple queries (no filters, no pagination) are cached automatically
- Complex pagination queries always hit the database

### Memory Management

- Shared 50MB cache across all models prevents memory multiplication
- Cache persists across Lambda invocations within same container
- LRU eviction ensures memory usage stays within limits

### Pagination Best Practices

- Use reasonable page sizes (avoid > 1000 items per page)
- Set `maxPages` to prevent infinite loops
- Filter at database level rather than after retrieval
- Use `followNextToken: true` for complete datasets
- Consider incremental loading for very large datasets

## Error Handling

Multi-layered error handling:

1. **Validation Layer**: Input and response structure validation
2. **GraphQL Layer**: AWS Amplify error interpretation
3. **Application Layer**: Context-aware error wrapping
4. **REST Layer**: HTTP status code mapping (optional)

```typescript
try {
  const result = await queries.User.list({
    followNextToken: true,
    maxPages: 100,
  });
} catch (error) {
  if (error.message.includes('Pagination stopped')) {
    // Hit pagination safety limit
  } else {
    // Other error
  }
}
```

## Cache Statistics

```typescript
import { getGlobalCache } from '@your-org/amplify-shared-utilities/queries';

const cache = getGlobalCache();
const stats = cache.getStats();

console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`Size: ${(stats.currentSize / 1024 / 1024).toFixed(2)}MB`);
console.log(`Entries: ${stats.entryCount}`);
```

## Types

### Core Types

- `AmplifyModelType`: Base interface for model structure requirements
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

## Architecture

### Patterns

- **Singleton Pattern**: Client management and cache system
- **Factory Pattern**: Dynamic query operation generation
- **Wrapper Pattern**: REST-aware operations extend base operations
- **Promise-Based Concurrency**: Handles concurrent access during initialization

### Dependencies

- `aws-amplify/data`: Core Amplify data client
- `aws-amplify`: Configuration management
- `lru-cache`: In-memory caching with LRU eviction

## Exports

### Primary

- `ClientManager`: Client management class
- `initializeQueries`: Global initialization function
- `getQueryFactories`: Auto-initializing query factory retrieval
- `getExistingQueryFactories`: Existing-only query factory retrieval

### Cache

- `QueryCache`: LRU cache implementation
- `getGlobalCache`: Shared cache instance factory
- `resetGlobalCache`: Cache cleanup utility

### REST

- `createRestAwareQueryOperations`: REST error handling wrapper
- `RestAwareQueryOperations`: Type interface for REST operations

### Utilities

- `areEntitiesInitialized`: Check initialization status
- `getAllQueryFactories`: Get all initialized factories
- `extractIdentifier`: Schema-aware identifier extraction
