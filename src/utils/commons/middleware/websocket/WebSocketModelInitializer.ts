import { logger } from "../../log";
import type {
  WebSocketModelInitializerConfig,
  WebSocketInputWithModels,
  WebSocketHandlerReturn,
} from "./types";
import type { Middleware } from "../middlewareChain";
import type { AmplifyModelType, QueryFactoryResult } from "../../queries/types";
import { initializeQueries } from "../../queries";
import { buildWebSocketContext, getErrorMessage } from "./utils";

/**
 * Create a WebSocket model initializer middleware
 *
 * This middleware initializes Amplify Data model query factories for WebSocket handlers.
 * It handles lazy initialization with caching, timeout protection, optional in-memory caching,
 * and automatic retry logic on initialization failures.
 *
 * **Initialization Flow:**
 * 1. Delegates to ClientManager.initializeQueries() for all initialization logic
 * 2. ClientManager handles global state management and caching automatically
 * 3. Initializes Amplify client and query factories for specified entities
 * 4. Adds initialized models to input object for subsequent middleware
 * 5. Handles initialization failures with proper error responses
 *
 * **Caching Behavior:**
 * - ClientManager handles all caching and state management globally
 * - Models are initialized once per clientKey and cached automatically
 * - Concurrent requests are handled efficiently by ClientManager
 * - Optional in-memory caching with LRU eviction for query results
 *
 * **Error Handling:**
 * - Initialization timeout: Returns 500 error response
 * - Amplify client errors: Returns 500 error response with details
 * - Post-initialization errors: Re-throws to be handled by error middleware
 *
 * **Performance Considerations:**
 * - First request bears initialization cost (typically 100-500ms)
 * - Subsequent requests use ClientManager's cached models (near-zero overhead)
 * - Timeout protection prevents hanging Lambda functions
 * - Optional query caching improves read performance
 * - No duplicate state management - relies on ClientManager singleton
 *
 * @template TSchema - Amplify Data schema type with models property
 * @template TTypes - Record of available Amplify model types
 * @template TSelected - Selected model types to initialize (subset of TTypes)
 * @template TReturn - Expected return type of the WebSocket handler
 * @param config - Configuration for model initialization
 * @returns Middleware function that adds initialized models to the input
 */
export function createWebSocketModelInitializer<
  TSchema extends { models: Record<string, unknown> },
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
  TReturn extends WebSocketHandlerReturn = WebSocketHandlerReturn,
>(
  config: WebSocketModelInitializerConfig<TSchema, TTypes, TSelected>
): Middleware<WebSocketInputWithModels<TTypes, TSelected>, TReturn> {
  const {
    schema,
    amplifyOutputs,
    entities,
    clientKey = "default",
    timeout = 5000,
    cache,
  } = config;

  /**
   * Initialize Amplify models with timeout protection
   *
   * Delegates to ClientManager.initializeQueries() which handles all caching and
   * state management. Uses Promise.race to implement timeout protection.
   *
   * @returns Promise resolving to initialized query factories
   * @throws {Error} When initialization times out or Amplify client fails
   * @internal
   */
  const initializeWithTimeout = async (): Promise<{
    [K in TSelected]: QueryFactoryResult<K, TTypes>;
  }> => {
    const models = await Promise.race([
      // Use ClientManager's unified initialization with cache support
      initializeQueries<TSchema, TTypes, TSelected>({
        amplifyOutputs,
        schema,
        entities: entities ?? undefined,
        clientKey: clientKey ?? undefined,
        cache,
      }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Initialization timeout after ${timeout}ms`)),
          timeout
        )
      ),
    ]);

    return models;
  };

  return async (input, next) => {
    const context = buildWebSocketContext(
      input as unknown as WebSocketInputWithModels<
        Record<string, AmplifyModelType>,
        string
      >
    );

    // Only catch model initialization errors, not errors from next()
    let models: { [K in TSelected]: QueryFactoryResult<K, TTypes> } | undefined;

    try {
      // Let ClientManager handle all caching and state management
      models = await initializeWithTimeout();
    } catch (error) {
      const message = getErrorMessage(error);

      logger.error("WebSocket Model Initializer - Initialization failed", {
        ...context,
        error: message,
        clientKey,
        cacheEnabled: !!cache?.enabled,
        entitiesRequested: entities || "all",
      });

      return {
        statusCode: 500,
        body: JSON.stringify({
          error: "Model initialization failed",
          message,
        }),
      } as TReturn;
    }

    // Call next() outside the try-catch so errors from other middlewares bubble up naturally
    return await next({ ...input, models });
  };
}
