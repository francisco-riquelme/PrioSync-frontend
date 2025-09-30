# Middleware Utils

Universal utilities for validation patterns and data sanitization across REST, WebSocket, and GraphQL middleware.

## Core Components

### Validation Utilities

- `extractYupErrors`: Converts Yup validation errors to structured details
- `ValidationPatterns`: Pre-built schemas for common use cases
- Unified error structure across all validators
- Type-safe validation pattern definitions

### Sanitization System

- `sanitizeObject`: Recursive data sanitization with sensitive field detection
- Automatic redaction of passwords, tokens, secrets, keys, auth fields
- Configurable field exclusion lists and depth limiting
- JSON string parsing and re-sanitization

## Validation Patterns

### Built-in Patterns

```typescript
ValidationPatterns.uuid(); // UUID validation
ValidationPatterns.email(); // Email format validation
ValidationPatterns.pagination(); // Page/limit parameters
ValidationPatterns.idParam(); // Path parameter ID validation
```

### Error Structure

```typescript
{
  field: string; // Field name that failed
  message: string; // Human-readable error message
  value: unknown; // Value that failed validation
  type: string; // Validation type that failed
}
```

## Sanitization Features

### Automatic Detection

- Case-insensitive field name patterns
- Password, token, secret, key, auth field detection
- Configurable redaction markers

### Safety Protection

- `maxDepth`: Object nesting limit (default: 3)
- Circular reference protection
- Memory usage optimization
- JSON string parsing with fallback

## Usage

```typescript
import { sanitizeObject, extractYupErrors, ValidationPatterns } from './utils';

// Sanitization
const clean = sanitizeObject(data, {
  excludeFields: ['customSecret'],
  maxDepth: 5,
});

// Validation
const schema = ValidationPatterns.email();
try {
  await schema.validate(data);
} catch (error) {
  const details = extractYupErrors(error);
}
```

## Integration

**Cross-Middleware**: Consistent usage across REST, WebSocket, GraphQL
**Error Flow**: Yup validation → error extraction → structured details → sanitized logging
**Security**: Multi-layer sensitive data protection with performance safeguards

## Types

```typescript
SanitizationConfig; // Sanitization behavior configuration
BaseValidationConfig; // Shared validation configuration
ValidationErrorDetail; // Structured validation error info
ValidationPatternsType; // Type-safe pattern definitions
```

## Performance

- **Sanitization**: Linear time complexity with configurable depth limiting
- **Validation**: Direct Yup integration with pre-compiled patterns
- **Memory**: Non-destructive processing with efficient allocation
