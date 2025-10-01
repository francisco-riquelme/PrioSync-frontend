import { logger } from '../log';

/**
 * Type definition for error context objects that can be passed to throwError.
 * This allows for structured error information while maintaining type safety.
 */
export type ErrorContext = Record<string, unknown>;

/**
 * Helper to process string messages with optional context.
 */
function processStringMessage(
  message: string,
  originalErrorOrContext?: unknown,
): {
  finalMessage: string;
  originalError: unknown;
  errorContext: ErrorContext;
} {
  if (originalErrorOrContext === undefined) {
    return {
      finalMessage: message,
      originalError: undefined,
      errorContext: {},
    };
  }

  if (originalErrorOrContext instanceof Error) {
    return {
      finalMessage: `${message}: ${originalErrorOrContext.message}`,
      originalError: originalErrorOrContext,
      errorContext: {
        originalError: {
          name: originalErrorOrContext.name,
          message: originalErrorOrContext.message,
          stack: originalErrorOrContext.stack,
        },
      },
    };
  }

  if (
    typeof originalErrorOrContext === 'object' &&
    originalErrorOrContext !== null
  ) {
    return {
      finalMessage: message,
      originalError: originalErrorOrContext,
      errorContext: originalErrorOrContext as ErrorContext,
    };
  }

  return {
    finalMessage: `${message}: ${String(originalErrorOrContext)}`,
    originalError: originalErrorOrContext,
    errorContext: { originalError: originalErrorOrContext },
  };
}

/**
 * Helper to process Error objects.
 */
function processErrorObject(error: Error): {
  finalMessage: string;
  originalError: Error;
  errorContext: ErrorContext;
} {
  return {
    finalMessage: error.message,
    originalError: error,
    errorContext: {
      originalError: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    },
  };
}

/**
 * Helper to process arrays of errors.
 */
function processErrorArray(errors: unknown[]): {
  finalMessage: string;
  originalError: unknown[];
  errorContext: ErrorContext;
} {
  const errorMessages = errors.map(err => {
    if (err instanceof Error) return err.message;
    if (typeof err === 'object' && err !== null && 'message' in err) {
      return String((err as { message: unknown }).message);
    }
    return String(err);
  });

  const finalMessage =
    errorMessages.length > 1
      ? `Multiple errors occurred: ${errorMessages.join('; ')}`
      : errorMessages[0] || 'Unknown error occurred';

  return {
    finalMessage,
    originalError: errors,
    errorContext: { errors },
  };
}

/**
 * Helper to process unknown values.
 */
function processUnknownValue(unknownError: unknown): {
  finalMessage: string;
  originalError: unknown;
  errorContext: ErrorContext;
} {
  const errorObj = unknownError as { message?: unknown };

  if (
    typeof errorObj === 'object' &&
    errorObj !== null &&
    'message' in errorObj
  ) {
    return {
      finalMessage: String(errorObj.message),
      originalError: unknownError,
      errorContext: { originalError: unknownError },
    };
  }

  return {
    finalMessage: `Unexpected error: ${String(unknownError)}`,
    originalError: unknownError,
    errorContext: { originalError: unknownError },
  };
}

/**
 * Helper to create and configure the error object using ES2022 standards.
 */
function createErrorObject(
  finalMessage: string,
  originalError: unknown,
  errorContext: ErrorContext,
): Error {
  let error: Error;

  // Use modern Error constructor with cause (ES2022 standard) when originalError exists
  if (originalError !== undefined) {
    try {
      // Modern approach - supported in Node.js 16.9+ and modern browsers
      error = new Error(finalMessage, { cause: originalError });
    } catch {
      // Fallback for older environments that don't support cause parameter
      error = new Error(finalMessage);
      Object.defineProperty(error, 'cause', {
        value: originalError,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }

    // Backward compatibility: also set originalError property
    if (!('originalError' in error)) {
      Object.defineProperty(error, 'originalError', {
        value: originalError,
        writable: true,
        enumerable: false,
        configurable: true,
      });
    }
  } else {
    error = new Error(finalMessage);
  }

  // Enhanced stack trace chaining for better debugging
  if (originalError instanceof Error && originalError.stack) {
    error.stack = `${error.stack}\n\nCaused by: ${originalError.stack}`;
  }

  // Always add a marker to identify errors from our library
  Object.defineProperty(error, '__fromErrorLibrary', {
    value: true,
    writable: false,
    enumerable: false,
    configurable: false,
  });

  // Assign context properties as non-enumerable properties
  if (errorContext && typeof errorContext === 'object') {
    for (const [key, value] of Object.entries(errorContext)) {
      // Skip system properties that are already handled
      if (
        !['originalError', 'cause', 'stack', '__fromErrorLibrary'].includes(key)
      ) {
        Object.defineProperty(error, key, {
          value,
          writable: true,
          enumerable: false,
          configurable: true,
        });
      }
    }
  }

  return error;
}

/**
 * Enhanced error throwing function that ensures consistent error handling and logging
 * across the application. It automatically logs errors with structured data and creates
 * properly formatted Error objects with additional context.
 *
 * @param messageOrError - The primary error message (string) or Error object to throw
 * @param originalErrorOrContext - Optional: original error object or additional context
 * @throws {Error} Always throws a properly formatted Error with enhanced context
 *
 * @example
 * ```typescript
 * // Simple message
 * throwError('Database connection failed');
 *
 * // Message with context
 * throwError('User not found', { userId: '123', operation: 'getUser' });
 *
 * // Message with original error
 * throwError('Failed to process request', originalError);
 *
 * // Error object (will extract message)
 * throwError(new Error('Something went wrong'));
 *
 * // Array of errors (will combine messages)
 * throwError([error1, error2, 'Additional info']);
 * ```
 */
export function throwError(
  messageOrError: string | Error | unknown[],
  originalErrorOrContext?: unknown,
): never {
  let result: {
    finalMessage: string;
    originalError: unknown;
    errorContext: ErrorContext;
  };

  if (typeof messageOrError === 'string') {
    result = processStringMessage(messageOrError, originalErrorOrContext);
  } else if (messageOrError instanceof Error) {
    result = processErrorObject(messageOrError);
  } else if (Array.isArray(messageOrError)) {
    result = processErrorArray(messageOrError);
  } else {
    result = processUnknownValue(messageOrError);
  }

  const { finalMessage, originalError, errorContext } = result;

  // Enhanced logging with structured data (CloudWatch handles timestamps)
  logger.error(finalMessage, {
    ...errorContext,
    errorType: typeof originalError,
    stack: new Error().stack, // Capture current stack trace for debugging
  });

  // Create and throw the error
  const error = createErrorObject(finalMessage, originalError, errorContext);
  throw error;
}

/**
 * Helper to extract message from object with specific property names
 */
function extractMessageFromObject(
  obj: object,
  propertyNames: string[],
): string | null {
  for (const prop of propertyNames) {
    if (
      prop in obj &&
      typeof (obj as Record<string, unknown>)[prop] === 'string'
    ) {
      const value = (obj as Record<string, unknown>)[prop];
      return value !== undefined ? String(value) : null;
    }
  }
  return null;
}

/**
 * Utility function to safely extract an error message from an unknown error type.
 * It handles various types of error objects, strings, and other values to produce a consistent
 * string representation of the error, which is useful for displaying error messages to users.
 *
 * @param error - The error from which to extract the message. It can be of any type.
 * @returns A string representing the error message.
 * @example
 * try {
 *   // some operation
 * } catch (error) {
 *   const message = extractErrorMessage(error);
 *   console.log('Error occurred:', message);
 * }
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (Array.isArray(error)) {
    if (error.length === 0) {
      return '';
    }

    const messages: string[] = [];
    function flattenAndExtract(item: unknown): void {
      if (Array.isArray(item)) {
        item.forEach(flattenAndExtract);
      } else {
        const message = extractErrorMessage(item);
        if (message) {
          messages.push(message);
        }
      }
    }

    error.forEach(flattenAndExtract);
    return messages.join('; ');
  }

  if (typeof error === 'object' && error !== null) {
    const message = extractMessageFromObject(error, [
      'message',
      'error',
      'details',
      'description',
    ]);
    if (message) {
      return message;
    }
  }

  return String(error);
}

/**
 * Utility function to create error context objects with proper filtering.
 * This ensures consistent context structure while removing undefined values
 * that could clutter logs or cause serialization issues.
 *
 * @param context - Raw context object that may contain undefined values
 * @returns Filtered context object with undefined values removed
 * @example
 * const context = createErrorContext({
 *   userId: user?.id,        // might be undefined
 *   operation: 'deleteUser', // always defined
 *   requestId: req.id        // always defined
 * });
 * // Result: { operation: 'deleteUser', requestId: 'abc123' }
 * // (userId omitted because it was undefined)
 */
export function createErrorContext(
  context: Record<string, unknown>,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).filter(([, value]) => value !== undefined),
  );
}
