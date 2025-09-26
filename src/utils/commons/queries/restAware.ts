import type {
  QueryFactoryResult,
  AmplifyModelType,
  ModelType,
  CreateInput,
  UpdateInput,
  DeleteInput,
  Identifier,
} from './types';
import { RestErrors } from '../middleware/rest/RestErrors';

/**
 * REST-aware query operations that throw appropriate HTTP errors
 *
 * Extended interface that wraps standard QueryFactory operations
 * with REST-specific error handling and HTTP status code mapping.
 */
export interface RestAwareQueryOperations<
  T extends string,
  TTypes extends Record<T, AmplifyModelType>,
> {
  /** Get operation with 404 error handling for not found items */
  get(props: { input: Identifier<T, TTypes> }): Promise<ModelType<T, TTypes>>;
  /** Create operation with validation and conflict error handling */
  create(props: {
    input: CreateInput<T, TTypes>;
  }): Promise<ModelType<T, TTypes>>;
  /** Update operation with 404 and validation error handling */
  update(props: {
    input: UpdateInput<T, TTypes>;
  }): Promise<ModelType<T, TTypes>>;
  /** Delete operation with 404 error handling */
  delete(props: {
    input: DeleteInput<T, TTypes>;
  }): Promise<ModelType<T, TTypes>>;
  /** List operation with general error handling */
  list(): Promise<ModelType<T, TTypes>[]>;
}

/**
 * Creates REST-aware query factory wrappers
 *
 * Wraps QueryFactory operations to catch generic database errors and convert
 * them to appropriate REST errors with proper HTTP status codes.
 *
 * Error Mapping:
 * - "No data returned" → 404 Not Found
 * - Validation errors → 400 Bad Request
 * - Duplicate/constraint errors → 409 Conflict
 * - All other errors → 500 Internal Server Error
 *
 * @template T - Model name type extending string
 * @template TTypes - Record of all available Amplify model types
 * @param rawModel - Original QueryFactory instance
 * @param modelName - Name of the model for error messages
 * @param context - Request context for error logging
 * @returns REST-aware query operations with HTTP error handling
 */
export function createRestAwareQueryOperations<
  T extends string,
  TTypes extends Record<T, AmplifyModelType>,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>,
): RestAwareQueryOperations<T, TTypes> {
  return {
    get: createRestAwareGetOperation<TTypes, T>(rawModel, modelName, context),
    create: createRestAwareCreateOperation<TTypes, T>(
      rawModel,
      modelName,
      context,
    ),
    update: createRestAwareUpdateOperation<TTypes, T>(
      rawModel,
      modelName,
      context,
    ),
    delete: createRestAwareDeleteOperation<TTypes, T>(
      rawModel,
      modelName,
      context,
    ),
    list: createRestAwareListOperation<TTypes, T>(rawModel, modelName, context),
  };
}

// Separate functions to maintain type information (similar to QueryFactory pattern)
function createRestAwareGetOperation<
  TTypes extends Record<string, AmplifyModelType>,
  T extends keyof TTypes & string,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>,
): (props: { input: Identifier<T, TTypes> }) => Promise<ModelType<T, TTypes>> {
  return async props => {
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
          error,
        );
      }

      return RestErrors.internal(
        `Failed to retrieve ${modelName}`,
        {
          ...context,
          modelName,
          operation: 'get',
          searchCriteria: props.input,
        },
        error,
      );
    }
  };
}

function createRestAwareCreateOperation<
  TTypes extends Record<string, AmplifyModelType>,
  T extends keyof TTypes & string,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>,
): (props: { input: CreateInput<T, TTypes> }) => Promise<ModelType<T, TTypes>> {
  return async props => {
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
          error,
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
          error,
        );
      }

      return RestErrors.internal(
        `Failed to create ${modelName}`,
        {
          ...context,
          modelName,
          operation: 'create',
          inputData: props.input,
        },
        error,
      );
    }
  };
}

function createRestAwareUpdateOperation<
  TTypes extends Record<string, AmplifyModelType>,
  T extends keyof TTypes & string,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>,
): (props: { input: UpdateInput<T, TTypes> }) => Promise<ModelType<T, TTypes>> {
  return async props => {
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
          error,
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
          error,
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
          error,
        );
      }

      return RestErrors.internal(
        `Failed to update ${modelName}`,
        {
          ...context,
          modelName,
          operation: 'update',
          updateData: props.input,
        },
        error,
      );
    }
  };
}

function createRestAwareDeleteOperation<
  TTypes extends Record<string, AmplifyModelType>,
  T extends keyof TTypes & string,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>,
): (props: { input: DeleteInput<T, TTypes> }) => Promise<ModelType<T, TTypes>> {
  return async props => {
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
          error,
        );
      }

      return RestErrors.internal(
        `Failed to delete ${modelName}`,
        {
          ...context,
          modelName,
          operation: 'delete',
          deleteCriteria: props.input,
        },
        error,
      );
    }
  };
}

function createRestAwareListOperation<
  TTypes extends Record<string, AmplifyModelType>,
  T extends keyof TTypes & string,
>(
  rawModel: QueryFactoryResult<T, TTypes>,
  modelName: string,
  context: Record<string, unknown>,
): () => Promise<ModelType<T, TTypes>[]> {
  return async () => {
    try {
      return await rawModel.list();
    } catch (error) {
      return RestErrors.internal(
        `Failed to list ${modelName} items`,
        {
          ...context,
          modelName,
          operation: 'list',
        },
        error,
      );
    }
  };
}

/**
 * Safely extracts error message from unknown error objects
 */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Checks if error message indicates a not found condition
 *
 * Patterns that typically indicate missing data:
 * - "No data returned" from GraphQL operations
 * - Generic "not found" messages
 * - "Does not exist" variations
 */
function isNotFoundError(message: string): boolean {
  const notFoundPatterns = [
    /no data returned/i,
    /not found/i,
    /does not exist/i,
    /item not found/i,
    /record not found/i,
  ];

  return notFoundPatterns.some(pattern => pattern.test(message));
}

/**
 * Checks if error message indicates a validation error
 *
 * Patterns that typically indicate invalid input data:
 * - Validation failures
 * - Required field violations
 * - Format/schema mismatches
 */
function isValidationError(message: string): boolean {
  const validationPatterns = [
    /validation/i,
    /invalid/i,
    /required/i,
    /constraint/i,
    /format/i,
    /schema/i,
  ];

  return validationPatterns.some(pattern => pattern.test(message));
}

/**
 * Checks if error message indicates a conflict error
 *
 * Patterns that typically indicate data conflicts:
 * - Duplicate key violations
 * - Unique constraint failures
 * - Resource conflicts
 */
function isConflictError(message: string): boolean {
  const conflictPatterns = [
    /already exists/i,
    /duplicate/i,
    /conflict/i,
    /unique constraint/i,
    /primary key/i,
  ];

  return conflictPatterns.some(pattern => pattern.test(message));
}
