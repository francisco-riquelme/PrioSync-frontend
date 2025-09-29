import { logger } from '../log';
import type { OperationType, DatabaseResponse } from './types';
import { getIdentifierFields } from './initialize';

/**
 * Extract identifier from input using stored metadata
 */
export const extractIdentifier = (
  input: Record<string, unknown>,
  entityName: string,
): Record<string, unknown> => {
  const identifierFields = getIdentifierFields(entityName);
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
      field => !(field in identifier),
    );
    logger.warn(`Incomplete composite key for ${entityName}`, {
      found: Object.keys(identifier),
      missing: missingFields,
      required: identifierFields,
    });
  }

  return identifier;
};

/**
 * Logs the start of a database operation.
 * @internal
 * @param nameStr - The model name
 * @param operation - The type of operation being performed.
 * @param data - Additional data to log with the operation.
 */
export const logOperation = (
  nameStr: string,
  operation: OperationType,
  data?: unknown,
): void => {
  const presentParticiple =
    operation === 'create'
      ? 'Creating'
      : operation === 'update'
        ? 'Updating'
        : operation === 'delete'
          ? 'Deleting'
          : operation === 'get'
            ? 'Getting'
            : 'Listing';

  logger.info(`${presentParticiple} ${nameStr}`, {
    operation,
    model: nameStr,
    ...(data ? { data } : {}),
  });
};

/**
 * Logs the successful completion of a database operation.
 * @internal
 * @param operation - The type of operation that was completed.
 * @param additionalInfo - Any additional information to include in the log.
 */
export const logSuccess = (
  operation: OperationType,
  additionalInfo?: unknown,
): void => {
  const pastTense =
    operation === 'create'
      ? 'created'
      : operation === 'update'
        ? 'updated'
        : operation === 'delete'
          ? 'deleted'
          : operation === 'get'
            ? 'retrieved'
            : 'listed';

  logger.debug(`Successfully ${pastTense}`, {
    operation,
    ...(additionalInfo ? { additionalInfo } : {}),
  });
};

/**
 * Validates a GraphQL-like response object.
 * Ensures the response is present, correctly structured, and free of errors.
 *
 * @template R The expected type of the `data` property in the response
 * @param props The arguments for the validation
 * @returns The `data` from the response
 * @throws Will throw an error if the response is invalid
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
  if (typeof response !== 'object' || !('data' in response)) {
    const errorMsg = `Invalid response structure for ${name} ${operation}`;
    logger.error(errorMsg, { response, input });
    throw new Error(errorMsg);
  }

  const { data, errors } = response;

  // Check for GraphQL errors
  if (errors && errors.length > 0) {
    const errorMessages = errors.map(error => {
      const message =
        (error as { message?: string })?.message || 'Unknown error';
      const errorMessage = `GraphQL error during ${name} ${operation}: ${message}`;
      logger.error(errorMessage, { specificError: error, input });
      return errorMessage;
    });
    throw new Error(errorMessages.join('\n'));
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

/**
 * Validates a database response and returns the data if valid.
 * @internal
 * @param response - The response from the database operation.
 * @param operation - The type of operation that was performed.
 * @param modelName - The name of the model being operated on.
 * @param input - The input that was provided to the operation.
 * @returns The validated data from the response.
 */
export const validateAndReturn = <T>(
  response: DatabaseResponse<T>,
  operation: string,
  modelName: string,
  input: unknown,
): T => {
  return validateResponse({
    response,
    operation,
    name: modelName, // Use the actual model name instead of operation
    input,
  });
};
