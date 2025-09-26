import type {
  QueryFactoryResult,
  AmplifyModelType,
  ModelType,
  CreateInput,
  UpdateInput,
  DeleteInput,
  Identifier,
  SortDirection,
  AmplifyAuthMode,
  PaginationResult,
} from "./types";
import { RestErrors } from "../middleware/rest/RestErrors";
import {
  getErrorMessage,
  isNotFoundError,
  isValidationError,
  isConflictError,
} from "./helpers";

/**
 * REST-aware query operations interface with HTTP error handling.
 *
 * Extends standard QueryFactory operations with REST-specific error handling
 * that automatically maps database errors to appropriate HTTP status codes.
 * All operations throw RestErrors instead of generic errors.
 *
 * @template T - Model name as string literal
 * @template TTypes - Record of all available Amplify model types
 * @interface RestAwareQueryOperations
 */
export interface RestAwareQueryOperations<
  T extends string,
  TTypes extends Record<T, AmplifyModelType>,
> {
  /**
   * Retrieve a single record by identifier with 404 error handling.
   *
   * @param props - Object containing identifier input
   * @param props.input - Identifier for the record to retrieve
   * @returns Promise resolving to the retrieved record
   * @throws {RestError} 404 if record not found, 500 for other errors
   */
  get(props: { input: Identifier<T, TTypes> }): Promise<ModelType<T, TTypes>>;

  /**
   * Create a new record with validation and conflict error handling.
   *
   * @param props - Object containing creation input
   * @param props.input - Data for creating the record
   * @returns Promise resolving to the created record
   * @throws {RestError} 400 for validation errors, 409 for conflicts, 500 for other errors
   */
  create(props: {
    input: CreateInput<T, TTypes>;
  }): Promise<ModelType<T, TTypes>>;

  /**
   * Update an existing record with comprehensive error handling.
   *
   * @param props - Object containing update input
   * @param props.input - Data for updating the record (must include identifier)
   * @returns Promise resolving to the updated record
   * @throws {RestError} 404 if not found, 400 for validation, 409 for conflicts, 500 for other errors
   */
  update(props: {
    input: UpdateInput<T, TTypes>;
  }): Promise<ModelType<T, TTypes>>;

  /**
   * Delete an existing record with 404 error handling.
   *
   * @param props - Object containing deletion input
   * @param props.input - Identifier for the record to delete
   * @returns Promise resolving to the deleted record
   * @throws {RestError} 404 if record not found, 500 for other errors
   */
  delete(props: {
    input: DeleteInput<T, TTypes>;
  }): Promise<ModelType<T, TTypes>>;

  /**
   * Retrieve multiple records with pagination and general error handling.
   *
   * @param props - Optional configuration for the list operation
   * @returns Promise resolving to paginated results
   * @throws {RestError} 500 for any operation errors
   */
  list(props?: {
    filter?: Record<string, unknown>;
    sortDirection?: SortDirection;
    limit?: number;
    nextToken?: string;
    authMode?: AmplifyAuthMode;
    followNextToken?: boolean;
    maxPages?: number;
  }): Promise<PaginationResult<ModelType<T, TTypes>>>;
}

/**
 * Creates REST-aware query factory wrappers with automatic HTTP error mapping.
 *
 * Wraps standard QueryFactory operations to intercept database errors and convert
 * them to appropriate REST errors with proper HTTP status codes. This enables
 * consistent REST API error responses without manual error handling in each endpoint.
 *
 * **Error Mapping Strategy:**
 * - `"No data returned"` → 404 Not Found
 * - AppSync validation errors → 400 Bad Request
 * - Conflict/constraint violations → 409 Conflict
 * - All other errors → 500 Internal Server Error
 *
 * @template T - Model name type extending string
 * @template TTypes - Record of all available Amplify model types
 * @param rawModel - Original QueryFactory instance to wrap
 * @param modelName - Human-readable model name for error messages
 * @param context - Request context object for error logging and tracing
 * @returns REST-aware query operations that throw HTTP-appropriate errors
 *
 * @example
 * ```typescript
 * const restQueries = createRestAwareQueryOperations(
 *   queries.User,
 *   "User",
 *   { requestId: "req-123", userId: "current-user" }
 * );
 *
 * // Automatically throws 404 RestError if user not found
 * const user = await restQueries.get({ input: { userId: "123" } });
 * ```
 */
export function createRestAwareQueryOperations<
  T extends string,
  TTypes extends Record<T, AmplifyModelType>,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>
): RestAwareQueryOperations<T, TTypes> {
  return {
    get: createRestAwareGetOperation<TTypes, T>(rawModel, modelName, context),
    create: createRestAwareCreateOperation<TTypes, T>(
      rawModel,
      modelName,
      context
    ),
    update: createRestAwareUpdateOperation<TTypes, T>(
      rawModel,
      modelName,
      context
    ),
    delete: createRestAwareDeleteOperation<TTypes, T>(
      rawModel,
      modelName,
      context
    ),
    list: createRestAwareListOperation<TTypes, T>(rawModel, modelName, context),
  };
}

/**
 * Internal factory functions that create REST-aware operation handlers.
 * These functions maintain type information and provide consistent error handling patterns.
 */

/**
 * Creates a REST-aware get operation with 404 error handling.
 *
 * @internal
 * @template TTypes - Record of all available Amplify model types
 * @template T - Model name as string literal
 * @param rawModel - Original QueryFactory instance
 * @param modelName - Human-readable model name for error messages
 * @param context - Request context for error logging
 * @returns Function that performs get operation with REST error handling
 */
function createRestAwareGetOperation<
  TTypes extends Record<string, AmplifyModelType>,
  T extends keyof TTypes & string,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>
): (props: { input: Identifier<T, TTypes> }) => Promise<ModelType<T, TTypes>> {
  return async (props) => {
    try {
      return await rawModel.get(props);
    } catch (error) {
      const message = getErrorMessage(error);

      if (isNotFoundError(message)) {
        return RestErrors.notFound(
          `${modelName} not found`,
          {
            ...context,
            modelName,
            searchCriteria: props.input,
          },
          error
        );
      }

      return RestErrors.internal(
        `Failed to retrieve ${modelName}`,
        {
          ...context,
          modelName,
          operation: "get",
          searchCriteria: props.input,
        },
        error
      );
    }
  };
}

/**
 * Creates a REST-aware create operation with validation and conflict error handling.
 *
 * @internal
 * @template TTypes - Record of all available Amplify model types
 * @template T - Model name as string literal
 * @param rawModel - Original QueryFactory instance
 * @param modelName - Human-readable model name for error messages
 * @param context - Request context for error logging
 * @returns Function that performs create operation with REST error handling
 */
function createRestAwareCreateOperation<
  TTypes extends Record<string, AmplifyModelType>,
  T extends keyof TTypes & string,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>
): (props: { input: CreateInput<T, TTypes> }) => Promise<ModelType<T, TTypes>> {
  return async (props) => {
    try {
      return await rawModel.create(props);
    } catch (error) {
      const message = getErrorMessage(error);

      if (isValidationError(message)) {
        return RestErrors.validation(
          `Invalid data for ${modelName} creation`,
          {
            ...context,
            modelName,
            inputData: props.input,
          },
          error
        );
      }

      if (isConflictError(message)) {
        return RestErrors.conflict(
          `${modelName} already exists or conflicts with existing data`,
          {
            ...context,
            modelName,
            inputData: props.input,
          },
          error
        );
      }

      return RestErrors.internal(
        `Failed to create ${modelName}`,
        {
          ...context,
          modelName,
          operation: "create",
          inputData: props.input,
        },
        error
      );
    }
  };
}

/**
 * Creates a REST-aware update operation with comprehensive error handling.
 *
 * @internal
 * @template TTypes - Record of all available Amplify model types
 * @template T - Model name as string literal
 * @param rawModel - Original QueryFactory instance
 * @param modelName - Human-readable model name for error messages
 * @param context - Request context for error logging
 * @returns Function that performs update operation with REST error handling
 */
function createRestAwareUpdateOperation<
  TTypes extends Record<string, AmplifyModelType>,
  T extends keyof TTypes & string,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>
): (props: { input: UpdateInput<T, TTypes> }) => Promise<ModelType<T, TTypes>> {
  return async (props) => {
    try {
      return await rawModel.update(props);
    } catch (error) {
      const message = getErrorMessage(error);

      if (isNotFoundError(message)) {
        return RestErrors.notFound(
          `${modelName} not found for update`,
          {
            ...context,
            modelName,
            updateCriteria: props.input,
          },
          error
        );
      }

      if (isValidationError(message)) {
        return RestErrors.validation(
          `Invalid data for ${modelName} update`,
          {
            ...context,
            modelName,
            updateData: props.input,
          },
          error
        );
      }

      if (isConflictError(message)) {
        return RestErrors.conflict(
          `Update conflicts with existing ${modelName} data`,
          {
            ...context,
            modelName,
            updateData: props.input,
          },
          error
        );
      }

      return RestErrors.internal(
        `Failed to update ${modelName}`,
        {
          ...context,
          modelName,
          operation: "update",
          updateData: props.input,
        },
        error
      );
    }
  };
}

/**
 * Creates a REST-aware delete operation with 404 error handling.
 *
 * @internal
 * @template TTypes - Record of all available Amplify model types
 * @template T - Model name as string literal
 * @param rawModel - Original QueryFactory instance
 * @param modelName - Human-readable model name for error messages
 * @param context - Request context for error logging
 * @returns Function that performs delete operation with REST error handling
 */
function createRestAwareDeleteOperation<
  TTypes extends Record<string, AmplifyModelType>,
  T extends keyof TTypes & string,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>
): (props: { input: DeleteInput<T, TTypes> }) => Promise<ModelType<T, TTypes>> {
  return async (props) => {
    try {
      return await rawModel.delete(props);
    } catch (error) {
      const message = getErrorMessage(error);

      if (isNotFoundError(message)) {
        return RestErrors.notFound(
          `${modelName} not found for deletion`,
          {
            ...context,
            modelName,
            deleteCriteria: props.input,
          },
          error
        );
      }

      return RestErrors.internal(
        `Failed to delete ${modelName}`,
        {
          ...context,
          modelName,
          operation: "delete",
          deleteCriteria: props.input,
        },
        error
      );
    }
  };
}

/**
 * Creates a REST-aware list operation with general error handling.
 *
 * @internal
 * @template TTypes - Record of all available Amplify model types
 * @template T - Model name as string literal
 * @param rawModel - Original QueryFactory instance
 * @param modelName - Human-readable model name for error messages
 * @param context - Request context for error logging
 * @returns Function that performs list operation with REST error handling
 */
function createRestAwareListOperation<
  TTypes extends Record<string, AmplifyModelType>,
  T extends keyof TTypes & string,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>
): (props?: {
  filter?: Record<string, unknown>;
  sortDirection?: SortDirection;
  limit?: number;
  nextToken?: string;
  authMode?: AmplifyAuthMode;
  followNextToken?: boolean;
  maxPages?: number;
}) => Promise<PaginationResult<ModelType<T, TTypes>>> {
  return async (props) => {
    try {
      return await rawModel.list(props);
    } catch (error) {
      return RestErrors.internal(
        `Failed to list ${modelName} items`,
        {
          ...context,
          modelName,
          operation: "list",
          listParams: props,
        },
        error
      );
    }
  };
}
