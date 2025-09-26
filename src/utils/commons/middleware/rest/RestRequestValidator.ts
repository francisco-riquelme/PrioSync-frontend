import { RestErrors } from './RestErrors';
import * as yup from 'yup';
import type { Middleware } from '../middlewareChain';
import type {
  RestResponse,
  RestInputWithModels,
  RestInputWithValidation,
  RestRequestValidationConfig,
  ValidationErrorDetail,
} from './types';
import type { AmplifyModelType } from '../../queries/types';
import { buildRestContext, parseJsonBody } from './utils';

/** Symbol key for storing validated request body data */
const VALIDATED_BODY_KEY = Symbol('validatedBody');
/** Symbol key for storing validated query parameters */
const VALIDATED_QUERY_KEY = Symbol('validatedQuery');
/** Symbol key for storing validated path parameters */
const VALIDATED_PATH_KEY = Symbol('validatedPath');
/** Symbol key for storing validated headers */
const VALIDATED_HEADERS_KEY = Symbol('validatedHeaders');

export {
  VALIDATED_BODY_KEY,
  VALIDATED_QUERY_KEY,
  VALIDATED_PATH_KEY,
  VALIDATED_HEADERS_KEY,
};

/**
 * Retrieves validated request body from middleware chain
 *
 * Extracts the validated and type-safe request body that was
 * processed by the validation middleware.
 *
 * @template T - Expected type of the validated body
 * @param input - REST input with validation data
 * @returns Validated request body data
 */
export function getValidatedBody<T = unknown>(
  input: RestInputWithValidation,
): T {
  return (input.event as unknown as Record<symbol, unknown>)[
    VALIDATED_BODY_KEY
  ] as T;
}

/**
 * Retrieves validated query parameters from middleware chain
 *
 * Extracts the validated and type-safe query string parameters
 * that were processed by the validation middleware.
 *
 * @template T - Expected type of the validated query parameters
 * @param input - REST input with validation data
 * @returns Validated query parameters object
 */
export function getValidatedQuery<T = Record<string, unknown>>(
  input: RestInputWithValidation,
): T {
  return (input.event as unknown as Record<symbol, unknown>)[
    VALIDATED_QUERY_KEY
  ] as T;
}

/**
 * Retrieves validated path parameters from middleware chain
 *
 * Extracts the validated and type-safe path parameters
 * that were processed by the validation middleware.
 *
 * @template T - Expected type of the validated path parameters
 * @param input - REST input with validation data
 * @returns Validated path parameters object
 */
export function getValidatedPath<T = Record<string, unknown>>(
  input: RestInputWithValidation,
): T {
  return (input.event as unknown as Record<symbol, unknown>)[
    VALIDATED_PATH_KEY
  ] as T;
}

/**
 * Retrieves validated headers from middleware chain
 *
 * Extracts the validated and type-safe request headers
 * that were processed by the validation middleware.
 *
 * @template T - Expected type of the validated headers
 * @param input - REST input with validation data
 * @returns Validated headers object
 */
export function getValidatedHeaders<T = Record<string, unknown>>(
  input: RestInputWithValidation,
): T {
  return (input.event as unknown as Record<symbol, unknown>)[
    VALIDATED_HEADERS_KEY
  ] as T;
}

/**
 * Stores validated data in the event object using symbol keys
 *
 * Internal function for securely storing validated data in the
 * event object without conflicting with existing properties.
 *
 * @param input - REST input with validation capabilities
 * @param key - Symbol key for storage
 * @param data - Validated data to store
 */
function storeValidatedData(
  input: RestInputWithValidation,
  key: symbol,
  data: unknown,
): void {
  (input.event as unknown as Record<symbol, unknown>)[key] = data;
}

/**
 * Extracts detailed error information from Yup validation errors
 *
 * Processes Yup validation errors to create structured error
 * details for comprehensive error reporting.
 *
 * @param error - Yup validation error object
 * @returns Array of detailed validation error information
 */
function extractErrors(error: yup.ValidationError): ValidationErrorDetail[] {
  return error.inner.map(innerError => ({
    field: innerError.path || 'unknown',
    message: innerError.message,
    value: innerError.value,
    type: innerError.type || 'validation',
  }));
}

/**
 * Creates REST request validator middleware
 *
 * Creates a middleware function that validates different parts of
 * the HTTP request (body, query, path, headers) using Yup schemas.
 * Stores validated data for type-safe access in downstream handlers.
 *
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Subset of model types to initialize
 * @param config - Validation configuration with schemas and options
 * @param config.bodySchema - Yup schema for request body validation
 * @param config.querySchema - Yup schema for query parameter validation
 * @param config.pathSchema - Yup schema for path parameter validation
 * @param config.headersSchema - Yup schema for header validation
 * @param config.stripUnknown - Remove unknown fields from validated data
 * @param config.abortEarly - Stop validation on first error
 * @param config.errorMessage - Custom error message for validation failures
 * @param config.errorContext - Additional context to include in validation errors
 * @returns Middleware function for request validation
 * @throws RestErrors.validation when validation fails
 */
export function createRestRequestValidator<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  config: RestRequestValidationConfig,
): Middleware<RestInputWithModels<TTypes, TSelected>, RestResponse> {
  const {
    bodySchema,
    querySchema,
    pathSchema,
    headersSchema,
    stripUnknown = true,
    abortEarly = false,
    errorMessage = 'Validation failed',
    errorContext = {},
  } = config;

  return async (input, next) => {
    const typedInput = input as RestInputWithValidation;
    const { event } = typedInput;

    try {
      if (bodySchema && event.body) {
        const bodyData = parseJsonBody(event.body, buildRestContext(input));
        const validatedBody = await bodySchema.validate(bodyData, {
          stripUnknown,
          abortEarly,
        });
        storeValidatedData(typedInput, VALIDATED_BODY_KEY, validatedBody);
      }

      if (querySchema) {
        const validatedQuery = await querySchema.validate(
          event.queryStringParameters || {},
          { stripUnknown, abortEarly },
        );
        storeValidatedData(typedInput, VALIDATED_QUERY_KEY, validatedQuery);
      }

      if (pathSchema) {
        const validatedPath = await pathSchema.validate(
          event.pathParameters || {},
          { stripUnknown, abortEarly },
        );
        storeValidatedData(typedInput, VALIDATED_PATH_KEY, validatedPath);
      }

      if (headersSchema) {
        const validatedHeaders = await headersSchema.validate(
          event.headers || {},
          { stripUnknown, abortEarly },
        );
        storeValidatedData(typedInput, VALIDATED_HEADERS_KEY, validatedHeaders);
      }

      return await next(typedInput);
    } catch (error) {
      const requestContext = buildRestContext(input, errorContext);

      if (error instanceof yup.ValidationError) {
        const validationErrors = extractErrors(error);

        throw RestErrors.validation(errorMessage, {
          ...requestContext,
          validationErrors,
          field: validationErrors[0]?.field,
        });
      }

      throw error;
    }
  };
}
