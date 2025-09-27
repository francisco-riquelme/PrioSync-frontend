/**
 * Shared sanitization utilities for middleware logging
 */

/**
 * Configuration for sanitization
 */
export interface SanitizationConfig {
  excludeFields?: string[];
  maxDepth?: number;
}

/**
 * Checks if a field name indicates sensitive data
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerKey = fieldName.toLowerCase();
  return (
    lowerKey.includes('password') ||
    lowerKey.includes('token') ||
    lowerKey.includes('secret') ||
    lowerKey.includes('key') ||
    lowerKey.includes('auth')
  );
}

/**
 * Sanitizes an array by recursively sanitizing each item
 */
function sanitizeArray(
  obj: unknown[],
  config: SanitizationConfig,
  currentDepth: number,
): unknown[] {
  return obj.map(item => sanitizeObject(item, config, currentDepth + 1));
}

/**
 * Sanitizes an object's properties
 */
function sanitizeObjectProperties(
  obj: Record<string, unknown>,
  config: SanitizationConfig,
  currentDepth: number,
): Record<string, unknown> {
  const { excludeFields = [] } = config;
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (excludeFields.includes(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (key === 'body' && typeof value === 'string') {
      try {
        const parsedBody = JSON.parse(value);
        const sanitizedBody = sanitizeObject(
          parsedBody,
          config,
          currentDepth + 1,
        );
        sanitized[key] = JSON.stringify(sanitizedBody);
      } catch {
        // Not a valid JSON string, treat as a regular field
        sanitized[key] = sanitizeObject(value, config, currentDepth + 1);
      }
    } else {
      sanitized[key] = sanitizeObject(value, config, currentDepth + 1);
    }
  }

  return sanitized;
}

/**
 * Checks if a value is a primitive type
 */
function isPrimitive(obj: unknown): boolean {
  return (
    typeof obj === 'string' ||
    typeof obj === 'number' ||
    typeof obj === 'boolean'
  );
}

/**
 * Sanitizes an object by removing sensitive fields and limiting depth
 */
export function sanitizeObject(
  obj: unknown,
  config: SanitizationConfig = {},
  currentDepth = 0,
): unknown {
  const { maxDepth = 3 } = config;

  if (currentDepth >= maxDepth) {
    return '[Object: max depth reached]';
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (isPrimitive(obj)) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return sanitizeArray(obj, config, currentDepth);
  }

  if (typeof obj === 'object') {
    return sanitizeObjectProperties(
      obj as Record<string, unknown>,
      config,
      currentDepth,
    );
  }

  return '[Unknown type]';
}
