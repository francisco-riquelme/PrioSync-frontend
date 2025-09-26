import { logger } from "../log";
import { createHash } from "crypto";
import type {
  OperationType,
  AmplifyModelType,
  CacheConfig,
  QueryFactoryResult,
} from "./types";
import { ClientManager } from "./ClientManager";

//#region IDENTIFIER AND DATA EXTRACTION UTILITIES
/**
 * Extracts identifier fields from input data using schema metadata.
 *
 * Handles both single and composite primary keys by extracting the appropriate
 * identifier fields from the input based on the entity's schema definition.
 *
 * @param input - The input data object containing potential identifier fields
 * @param entityName - Name of the entity to extract identifiers for
 * @returns Object containing only the identifier fields and their values
 *
 * @example
 * ```typescript
 * // Single key
 * const id = extractIdentifier({ userId: "123", name: "John" }, "User");
 * // Returns: { userId: "123" }
 *
 * // Composite key
 * const compositeId = extractIdentifier(
 *   { tenantId: "org1", userId: "123", name: "John" },
 *   "UserProfile"
 * );
 * // Returns: { tenantId: "org1", userId: "123" }
 * ```
 */
export const extractIdentifier = (
  input: Record<string, unknown>,
  entityName: string
): Record<string, unknown> => {
  const identifierFields = ClientManager.getIdentifierFields(entityName);
  const identifier: Record<string, unknown> = {};

  // Extract all identifier fields (handles both single and composite keys)
  for (const field of identifierFields) {
    if (input[field] !== undefined) {
      identifier[field] = input[field];
    }
  }

  // Validate we found at least one identifier field
  if (Object.keys(identifier).length === 0) {
    logger.warn(`No identifier fields found in input for ${entityName}`, {
      input,
      expectedFields: identifierFields,
    });
    return input; // Fallback to full input
  }

  // For composite keys, we need ALL fields to be present
  if (
    identifierFields.length > 1 &&
    Object.keys(identifier).length < identifierFields.length
  ) {
    const missingFields = identifierFields.filter(
      (field) => !(field in identifier)
    );
    logger.warn(`Incomplete composite key for ${entityName}`, {
      found: Object.keys(identifier),
      missing: missingFields,
      required: identifierFields,
    });
  }

  return identifier;
};
//#endregion

//#region LOGGING UTILITIES
/**
 * Logs the initiation of a database operation with structured context.
 *
 * Creates standardized log entries for the start of database operations,
 * including operation type, model name, and optional input data.
 *
 * @internal
 * @param nameStr - The model name being operated on
 * @param operation - The type of database operation being performed
 * @param data - Optional additional data to include in the log entry
 *
 * @example
 * ```typescript
 * logOperation("User", "create", { email: "user@example.com" });
 * // Logs: "Creating User" with operation context
 * ```
 */
export const logOperation = (
  nameStr: string,
  operation: OperationType,
  data?: unknown
): void => {
  const presentParticiple =
    operation === "create"
      ? "Creating"
      : operation === "update"
        ? "Updating"
        : operation === "delete"
          ? "Deleting"
          : operation === "get"
            ? "Getting"
            : "Listing";

  logger.info(`${presentParticiple} ${nameStr}`, {
    operation,
    model: nameStr,
    ...(data ? { data } : {}),
  });
};

/**
 * Logs the successful completion of a database operation.
 *
 * Creates standardized log entries for successful database operations,
 * including operation type and optional additional context information.
 *
 * @internal
 * @param operation - The type of database operation that completed
 * @param additionalInfo - Optional additional information to include in the log
 *
 * @example
 * ```typescript
 * logSuccess("create", { nameStr: "User", id: "123" });
 * // Logs: "Successfully created" with additional context
 * ```
 */
export const logSuccess = (
  operation: OperationType,
  additionalInfo?: unknown
): void => {
  const pastTense =
    operation === "create"
      ? "created"
      : operation === "update"
        ? "updated"
        : operation === "delete"
          ? "deleted"
          : operation === "get"
            ? "retrieved"
            : "listed";

  logger.info(`Successfully ${pastTense}`, {
    operation,
    ...(additionalInfo ? { additionalInfo } : {}),
  });
};
//#endregion

//#region VALIDATION UTILITIES
/**
 * Validates GraphQL-like response objects for correctness and data presence.
 *
 * Performs comprehensive validation of database responses including:
 * - Response object existence and structure
 * - GraphQL error detection and reporting
 * - Data presence validation
 * - Structured error logging with context
 *
 * @template R - The expected type of the data property in the response
 * @param props - Validation configuration object
 * @param props.response - The response object to validate
 * @param props.operation - The operation that generated this response
 * @param props.name - The model name for context
 * @param props.input - Optional input data for error context
 * @returns The validated data from the response
 * @throws {Error} When response is invalid, malformed, or contains errors
 *
 * @example
 * ```typescript
 * const userData = validateResponse({
 *   response: { data: { id: "123", name: "John" }, errors: [] },
 *   operation: "get",
 *   name: "User",
 *   input: { userId: "123" }
 * });
 * // Returns: { id: "123", name: "John" }
 * ```
 */
export const validateResponse = <R>(props: {
  response: { data: R | null; errors?: unknown[] } | null | undefined;
  operation: string;
  name: string;
  input?: unknown;
}): R => {
  const { response, operation, name, input } = props;

  // Validate that response exists
  if (response === null || response === undefined) {
    const errorMsg = `No response received for ${name} ${operation}`;
    logger.error(errorMsg, { input });
    throw new Error(errorMsg);
  }

  // Validate that response has the expected structure
  if (typeof response !== "object" || !("data" in response)) {
    const errorMsg = `Invalid response structure for ${name} ${operation}`;
    logger.error(errorMsg, { response, input });
    throw new Error(errorMsg);
  }

  const { data, errors } = response;

  // Check for GraphQL errors
  if (errors && errors.length > 0) {
    const errorMessages = errors.map((error) => {
      const message =
        (error as { message?: string })?.message || "Unknown error";
      const errorMessage = `GraphQL error during ${name} ${operation}: ${message}`;
      logger.error(errorMessage, { specificError: error, input });
      return errorMessage;
    });
    throw new Error(errorMessages.join("\n"));
  }

  // Validate data presence
  if (data === null || data === undefined) {
    const errorMsg = `No data returned for ${name} ${operation}`;
    logger.error(errorMsg, {
      searchCriteria: input,
      operation,
      model: name,
    });
    throw new Error(errorMsg);
  }

  return data;
};
//#endregion

//#region CLIENT MANAGER CONVENIENCE WRAPPERS
/**
 * Convenience wrapper functions that delegate to ClientManager methods.
 *
 * These provide a simpler API for common use cases while maintaining
 * backwards compatibility with the previous function-based interface.
 */

/**
 * Retrieves query factories with automatic initialization of missing entities.
 *
 * Convenience wrapper around ClientManager.getInstance().getQueryFactories()
 * that automatically creates query factories for entities that haven't been
 * initialized yet.
 *
 * @template TTypes - Record of all available Amplify model types
 * @template TSelected - Selected entity names as string literals
 * @param config - Configuration for query factory retrieval
 * @param config.entities - Array of entity names to retrieve factories for
 * @param config.cache - Optional cache configuration for all factories
 * @param config.clientKey - Optional client key for isolation (default: "default")
 * @returns Promise resolving to object with query factories for each entity
 *
 * @example
 * ```typescript
 * const queries = await getQueryFactories({
 *   entities: ["User", "Post", "Comment"],
 *   cache: { enabled: true, maxSize: 50 * 1024 * 1024 },
 *   clientKey: "main"
 * });
 *
 * const user = await queries.User.get({ input: { userId: "123" } });
 * ```
 */
export function getQueryFactories<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string,
>(config: {
  entities: readonly TSelected[];
  cache?: CacheConfig;
  clientKey?: string;
}): Promise<{
  [K in TSelected]: QueryFactoryResult<K, TTypes>;
}> {
  const { clientKey = "default", ...rest } = config;
  const manager = ClientManager.getInstance(clientKey);
  return manager.getQueryFactories<TTypes, TSelected>(rest);
}

//#region ERROR CLASSIFICATION UTILITIES
/**
 * Safely extracts error messages from unknown error objects.
 *
 * Handles various error types including Error instances, strings, and other objects
 * by attempting to extract a meaningful error message.
 *
 * @param error - Unknown error object to extract message from
 * @returns String representation of the error message
 *
 * @example
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   console.log(`Operation failed: ${message}`);
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Determines if an error message indicates a "not found" condition.
 *
 * Specifically checks for the error message generated by our validateResponse()
 * function when no data is returned from a database operation.
 *
 * @param message - Error message to analyze
 * @returns True if the message indicates no data was returned
 *
 * @example
 * ```typescript
 * // Error from validateResponse when data is null/undefined
 * const errorMsg = "No data returned for User get";
 * if (isNotFoundError(errorMsg)) {
 *   // Handle as 404 Not Found
 *   return RestErrors.notFound("User not found");
 * }
 * ```
 */
export function isNotFoundError(message: string): boolean {
  return message.includes("No data returned for");
}

/**
 * Determines if an error message indicates a validation failure.
 *
 * Checks error messages against patterns that AWS AppSync returns for validation errors,
 * including schema type mismatches, constraint violations, and invalid scalar types.
 *
 * @param message - Error message to analyze
 * @returns True if the message indicates a validation error
 *
 * @example
 * ```typescript
 * // AppSync schema validation error
 * const errorMsg = "Validation error of type WrongType: argument 'email' with value 'StringValue{value='not-a-valid-email'}' is not a valid 'AWSEmail'";
 * if (isValidationError(errorMsg)) {
 *   // Handle as 400 Bad Request
 *   return RestErrors.validation("Invalid input data");
 * }
 *
 * // AppSync type mismatch error
 * const typeError = "Variable '$input' of type 'CreateUserInput' used in position expecting type 'CreateUserInput!'";
 * if (isValidationError(typeError)) {
 *   return RestErrors.validation("Required field missing");
 * }
 * ```
 */
export function isValidationError(message: string): boolean {
  const validationPatterns = [
    // AppSync schema validation errors
    /Validation error of type/i,
    /is not a valid/i,
    /WrongType:/i,

    // AppSync variable type errors
    /Variable.*of type.*used in position expecting type/i,
    /Expected type.*but was/i,
    /Variable.*has an invalid value/i,

    // AppSync scalar validation errors (AWSEmail, AWSPhone, etc.)
    /not a valid 'AWS/i,
    /Invalid value for type/i,

    // AppSync field validation errors
    /Field.*of required type.*was not provided/i,
    /Cannot return null for non-nullable field/i,

    // AppSync input validation errors
    /Unknown argument.*on field/i,
    /Field.*doesn't accept argument/i,
    /Missing required argument/i,

    // General GraphQL validation patterns that AppSync uses
    /validation failed/i,
    /schema validation/i,
    /input validation/i,

    // Legacy patterns for broader compatibility
    /invalid/i,
    /required/i,
    /constraint/i,
    /format/i,
  ];
  return validationPatterns.some((pattern) => pattern.test(message));
}

/**
 * Determines if an error message indicates a data conflict.
 *
 * Checks error messages against patterns that AWS AppSync and DynamoDB return for
 * conflict situations, including conditional check failures, version mismatches,
 * and optimistic concurrency control violations.
 *
 * @param message - Error message to analyze
 * @returns True if the message indicates a conflict error
 *
 * @example
 * ```typescript
 * // DynamoDB conditional check failure
 * const conditionalError = "The conditional request failed";
 * if (isConflictError(conditionalError)) {
 *   // Handle as 409 Conflict
 *   return RestErrors.conflict("Item already exists or has been modified");
 * }
 *
 * // AppSync version conflict
 * const versionError = "ConflictUnhandled: Conflict resolver rejects mutation.";
 * if (isConflictError(versionError)) {
 *   return RestErrors.conflict("Data was modified by another user");
 * }
 * ```
 */
export function isConflictError(message: string): boolean {
  const conflictPatterns = [
    // DynamoDB conditional check failures
    /The conditional request failed/i,
    /ConditionalCheckFailedException/i,

    // AppSync conflict resolution errors
    /ConflictUnhandled/i,
    /Conflict resolver rejects mutation/i,
    /Version mismatch/i,
    /version.*mismatch/i,

    // AppSync optimistic concurrency control
    /OptimisticConcurrencyControl/i,
    /version.*conflict/i,
    /concurrent modification/i,

    // General conflict patterns (for custom resolvers)
    /already exists/i,
    /duplicate.*key/i,
    /unique.*constraint/i,
    /primary.*key.*violation/i,
    /item.*already.*exists/i,

    // Custom conflict resolver patterns
    /conflict.*detected/i,
    /mutation.*rejected.*due.*to.*conflict/i,
    /data.*modified.*by.*another/i,

    // Resource conflicts
    /resource.*conflict/i,
    /operation.*conflict/i,
  ];
  return conflictPatterns.some((pattern) => pattern.test(message));
}
//#endregion

//#region CACHE KEY UTILITIES
/**
 * Creates deterministic hash strings from objects using schema-aware identifier fields.
 *
 * Generates consistent cache keys by extracting identifier fields from the schema
 * and creating SHA-256 hashes. Falls back to JSON serialization if identifier
 * extraction fails.
 *
 * @param obj - Object to generate hash from
 * @param entityName - Name of the entity for identifier field extraction
 * @returns SHA-256 hash string for use as cache key
 *
 * @example
 * ```typescript
 * const user = { userId: "123", email: "user@example.com", name: "John" };
 * const hash = createObjectHash(user, "User");
 * // Returns hash of { userId: "123" } (only identifier fields)
 *
 * const cacheKey = `User:get:${hash}`;
 * ```
 */
export function createObjectHash(
  obj: Record<string, unknown>,
  entityName: string
): string {
  try {
    const identifierFields = ClientManager.getIdentifierFields(entityName);

    const identifierData: Record<string, unknown> = {};
    for (const field of identifierFields) {
      if (obj[field] !== undefined) {
        identifierData[field] = obj[field];
      }
    }

    const dataToHash =
      Object.keys(identifierData).length > 0 ? identifierData : obj;

    const keys = Object.keys(dataToHash).sort();
    const pairs = keys.map((key) => `${key}:${String(dataToHash[key])}`);
    const serialized = pairs.join("|");

    return createHash("sha256").update(serialized).digest("hex");
  } catch (error) {
    logger.warn(
      `Hash generation failed for ${entityName}, falling back to JSON`,
      { error }
    );
    return createHash("sha256").update(JSON.stringify(obj)).digest("hex");
  }
}
//#endregion

//#region PAGINATION UTILITIES
/**
 * Handles pagination consistently across database operations.
 *
 * Provides automatic pagination following with safety limits and comprehensive
 * error handling. Can retrieve all pages automatically or handle single-page
 * operations with consistent response formatting.
 *
 * @template T - Type of items being paginated
 * @param operation - Function that performs the paginated operation
 * @param params - Parameters to pass to the operation function
 * @param options - Pagination behavior configuration
 * @param options.followNextToken - Whether to automatically follow all pages
 * @param options.maxPages - Safety limit to prevent infinite loops (default: 10)
 * @returns Promise resolving to aggregated pagination results
 *
 * @example
 * ```typescript
 * // Single page
 * const singlePage = await handlePagination(
 *   (params) => model.list(params),
 *   { limit: 20 },
 *   { followNextToken: false }
 * );
 *
 * // All pages
 * const allPages = await handlePagination(
 *   (params) => model.list(params),
 *   { limit: 100 },
 *   { followNextToken: true, maxPages: 50 }
 * );
 * ```
 */
export async function handlePagination<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  operation: (params?: Record<string, unknown>) => Promise<any>,
  params: Record<string, unknown> = {},
  options: {
    followNextToken?: boolean;
    maxPages?: number;
  } = {}
): Promise<{
  items: T[];
  nextToken?: string;
  scannedCount?: number;
}> {
  const { followNextToken = false, maxPages = 10 } = options;
  let allItems: T[] = [];
  let currentToken = params.nextToken;
  let totalScanned = 0;
  let pageCount = 0;

  do {
    const requestParams = { ...params };
    if (currentToken) {
      requestParams.nextToken = currentToken;
    }

    const response = await operation(requestParams);
    const { data, errors, nextToken: responseNextToken } = response;

    if (errors && errors.length > 0) {
      const { throwError } = await import("../error");
      throw throwError("Pagination operation failed", errors);
    }

    if (!Array.isArray(data)) {
      const { throwError } = await import("../error");
      throw throwError("Invalid pagination response format");
    }

    const items = data as T[];
    allItems = allItems.concat(items);
    totalScanned += items.length;
    currentToken = responseNextToken;
    pageCount++;

    if (pageCount >= maxPages) {
      logger.warn(
        `Pagination stopped at ${maxPages} pages to prevent infinite loop`
      );
      break;
    }
  } while (followNextToken && currentToken);

  return {
    items: allItems,
    nextToken: currentToken as string | undefined,
    scannedCount: totalScanned,
  };
}
//#endregion
