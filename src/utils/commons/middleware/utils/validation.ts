import * as yup from 'yup';

/**
 * Base validation configuration interface shared across all validators
 */
export interface BaseValidationConfig {
  /** Whether to strip unknown fields from validated data */
  stripUnknown?: boolean;
  /** Whether to abort validation on first error or collect all errors */
  abortEarly?: boolean;
  /** Custom error message for validation failures */
  errorMessage?: string;
  /** Additional context to include with validation errors */
  errorContext?: Record<string, unknown>;
}

/**
 * Validation error details shared across all validators
 */
export interface ValidationErrorDetail {
  /** The field that failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
  /** The value that failed validation */
  value: unknown;
  /** Type of validation that failed */
  type: string;
}

/**
 * Extracts error details from Yup validation error
 * Shared utility function for all validators
 */
export function extractYupErrors(
  error: yup.ValidationError,
): ValidationErrorDetail[] {
  const details: ValidationErrorDetail[] = [];

  if (error.inner && Array.isArray(error.inner)) {
    // Multiple validation errors
    for (const innerError of error.inner) {
      details.push({
        field: innerError.path || 'unknown',
        message: innerError.message || 'Validation failed',
        value: innerError.value,
        type: innerError.type || 'validation',
      });
    }
  } else {
    // Single validation error
    details.push({
      field: error.path || 'unknown',
      message: error.message || 'Validation failed',
      value: error.value,
      type: error.type || 'validation',
    });
  }

  return details;
}

/**
 * Common validation patterns that can be reused across validators
 */
export const ValidationPatterns = {
  /** UUID validation pattern */
  uuid: () => yup.string().uuid().required(),

  /** Email validation pattern */
  email: () => yup.string().email().required(),

  /** Pagination query parameters */
  pagination: () =>
    yup.object({
      page: yup.number().positive().integer().default(1),
      limit: yup.number().positive().integer().max(100).default(10),
    }),

  /** ID parameter for path parameters */
  idParam: () =>
    yup.object({
      id: yup.string().required(),
    }),
} as const;

// Export the type for ValidationPatterns
export type ValidationPatternsType = typeof ValidationPatterns;
