import { logger } from '../../log';
import { WebSocketErrors } from '../../error';
import * as yup from 'yup';
import type { Middleware } from '../middlewareChain';
import type {
  WebSocketEvent,
  WebSocketInputWithModels,
  WebSocketResponse,
  WebSocketRequestValidationConfig,
  ValidationErrorDetail,
} from './types';
import type { AmplifyModelType } from '../../queries/types';
import { buildWebSocketContext, parseJsonBody, isMessageEvent } from './utils';

/**
 * Symbol used to store validated message data on the WebSocket event
 * @internal
 */
const VALIDATED_MESSAGE_KEY = Symbol('validatedMessage');

/**
 * Retrieve validated message data from a WebSocket event
 *
 * This function extracts the validated message data that was stored by the
 * WebSocket request validator middleware. Returns undefined if no validation
 * was performed or if validation failed.
 *
 * @template T - Type of the validated message data
 * @param event - The WebSocket event that may contain validated data
 * @returns The validated message data, or undefined if not available
 *
 * @example
 * ```typescript
 * interface MessageData {
 *   action: string;
 *   payload: Record<string, unknown>;
 * }
 *
 * const validatedMessage = getValidatedMessage<MessageData>(event);
 * if (validatedMessage) {
 *   console.log('Action:', validatedMessage.action);
 * }
 * ```
 */
export function getValidatedMessage<T = unknown>(
  event: WebSocketEvent,
): T | undefined {
  return (event as WebSocketEvent & { [VALIDATED_MESSAGE_KEY]?: T })[
    VALIDATED_MESSAGE_KEY
  ];
}

/**
 * Extract detailed error information from Yup validation errors
 *
 * Converts Yup's nested validation errors into a standardized format
 * for consistent error reporting across the application.
 *
 * @param error - The Yup validation error to process
 * @returns Array of validation error details
 * @internal
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
 * Determine if validation should be performed for the current request
 *
 * Checks various conditions to decide whether to validate the WebSocket message:
 * - Must be a MESSAGE event (not CONNECT/DISCONNECT)
 * - Must have a validation schema configured
 * - Must have a message body
 * - Route must be in the validation allowlist (if specified)
 *
 * @template TTypes - Available model types
 * @template TSelected - Selected model types for this request
 * @param input - The WebSocket input with models
 * @param bodySchema - The Yup schema for validation (undefined if no validation)
 * @param validateOnlyOnRoutes - Array of routes that require validation
 * @returns Object with validation decision and optional reason
 * @internal
 */
function shouldValidate<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  input: WebSocketInputWithModels<TTypes, TSelected>,
  bodySchema: yup.Schema | undefined,
  validateOnlyOnRoutes: string[],
): { shouldValidate: boolean; reason?: string } {
  const { event } = input;

  if (!isMessageEvent(event)) {
    return { shouldValidate: false, reason: 'Not a MESSAGE event' };
  }

  if (!bodySchema) {
    return { shouldValidate: false, reason: 'No validation schema' };
  }

  const bodyStr = (event as { body?: string }).body;
  if (!bodyStr) {
    return { shouldValidate: false, reason: 'No message body' };
  }

  if (
    validateOnlyOnRoutes.length > 0 &&
    !validateOnlyOnRoutes.includes(
      (event as { requestContext?: { routeKey?: string } }).requestContext
        ?.routeKey ?? '',
    )
  ) {
    return {
      shouldValidate: false,
      reason: `Route ${(event as { requestContext?: { routeKey?: string } }).requestContext?.routeKey ?? 'unknown'} not in validation list`,
    };
  }

  return { shouldValidate: true };
}

/**
 * Create a WebSocket request validation middleware
 *
 * This middleware validates incoming WebSocket message bodies against a Yup schema.
 * It only validates MESSAGE events (not CONNECT/DISCONNECT) and can be configured
 * to validate only specific routes.
 *
 * **Validation Process:**
 * 1. Checks if validation should be performed (MESSAGE event, has schema, etc.)
 * 2. Parses the JSON message body
 * 3. Validates against the provided Yup schema
 * 4. Stores validated data on the event for later retrieval
 * 5. Continues to next middleware with original input
 *
 * **Error Handling:**
 * - JSON parsing errors: Returns BAD_REQUEST with context
 * - Validation errors: Returns BAD_REQUEST with validation details
 * - Other errors: Returns INTERNAL_SERVER_ERROR
 *
 * **Validated Data Access:**
 * Use `getValidatedMessage<T>(event)` to retrieve validated data in subsequent middleware.
 *
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types for this middleware chain
 * @template TOutput - Expected output type of the middleware chain
 * @param config - Configuration options for validation behavior
 * @returns Middleware function for WebSocket request validation
 *
 * @example
 * ```typescript
 * import * as yup from 'yup';
 *
 * const messageSchema = yup.object({
 *   action: yup.string().required(),
 *   payload: yup.object().required(),
 *   timestamp: yup.number().optional(),
 * });
 *
 * const validator = createWebSocketRequestValidator({
 *   bodySchema: messageSchema,
 *   validateOnlyOnRoutes: ['sendMessage', 'updateStatus'],
 *   stripUnknown: true,
 *   errorMessage: 'Invalid message format',
 * });
 *
 * chain.use('validation', validator);
 * ```
 *
 * @example
 * ```typescript
 * // In your handler, retrieve validated data:
 * const handler = async (input) => {
 *   const validatedMessage = getValidatedMessage<MessageData>(input.event);
 *   if (validatedMessage) {
 *     // Process validated message
 *     return { statusCode: 200 };
 *   }
 * };
 * ```
 */
export function createWebSocketRequestValidator<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TOutput = WebSocketResponse,
>(
  config: WebSocketRequestValidationConfig,
): Middleware<WebSocketInputWithModels<TTypes, TSelected>, TOutput> {
  const {
    bodySchema,
    stripUnknown = true,
    abortEarly = false,
    errorMessage = 'Validation failed',
    errorContext = {},
    validateOnlyOnRoutes = ['$default'],
    logValidationSkipped = false,
  } = config;

  return async (
    input: WebSocketInputWithModels<TTypes, TSelected>,
    next: (
      input?: WebSocketInputWithModels<TTypes, TSelected>,
    ) => Promise<TOutput>,
  ): Promise<TOutput> => {
    const { event } = input;

    const validationDecision = shouldValidate(
      input,
      bodySchema,
      validateOnlyOnRoutes,
    );

    if (!validationDecision.shouldValidate) {
      if (logValidationSkipped) {
        const ctx = buildWebSocketContext(
          input as unknown as WebSocketInputWithModels<
            Record<string, AmplifyModelType>,
            string
          >,
        );
        logger.debug('WebSocket validation skipped', {
          connectionId: ctx.connectionId,
          routeKey: (event as { requestContext?: { routeKey?: string } })
            .requestContext?.routeKey,
          reason: validationDecision.reason,
        });
      }
      return await next(input);
    }

    // Validate only this block; do NOT catch downstream handler errors
    try {
      const context = buildWebSocketContext(
        input as unknown as WebSocketInputWithModels<
          Record<string, AmplifyModelType>,
          string
        >,
      );

      const bodyStr = (event as { body?: string }).body;
      const messageData = parseJsonBody(bodyStr, context);

      if (messageData === null) {
        const connId = (event as { requestContext?: { connectionId?: string } })
          .requestContext?.connectionId;
        const routeKey = (event as { requestContext?: { routeKey?: string } })
          .requestContext?.routeKey;

        const ctx = {
          ...(connId ? { connectionId: connId } : {}),
          ...(routeKey ? { routeKey } : {}),
        };

        throw WebSocketErrors.badRequest('Invalid JSON in message body', ctx);
      }

      const validatedData = await bodySchema!.validate(messageData, {
        stripUnknown,
        abortEarly,
      });

      (event as WebSocketEvent & { [VALIDATED_MESSAGE_KEY]?: unknown })[
        VALIDATED_MESSAGE_KEY
      ] = validatedData;
    } catch (error) {
      const context = buildWebSocketContext(
        input as unknown as WebSocketInputWithModels<
          Record<string, AmplifyModelType>,
          string
        >,
        errorContext,
      );

      if (error instanceof yup.ValidationError) {
        const validationErrors = extractErrors(error);

        throw WebSocketErrors.badRequest(errorMessage, {
          ...context,
          validationErrors,
          field: validationErrors[0]?.field,
        });
      }

      // Unexpected error during validation phase only
      throw WebSocketErrors.internal('Validation processing error', context);
    }

    // Run next outside of the validation try/catch so chain errors propagate
    return await next(input);
  };
}
