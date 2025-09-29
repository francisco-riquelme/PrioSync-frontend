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
 * 1. Checks if models are already initialized (uses caching)
 * 2. If not initialized, creates initialization promise with timeout
 * 3. Initializes Amplify client and query factories for specified entities
 * 4. Adds initialized models to input object for subsequent middleware
 * 5. Handles initialization failures with proper error responses
 *
 * **Caching Behavior:**
 * - Models are initialized once and cached for subsequent requests
 * - Initialization failures reset the cache to allow retry
 * - Concurrent requests share the same initialization promise
 * - Optional in-memory caching with LRU eviction for query results
 *
 * **Error Handling:**
 * - Initialization timeout: Returns 500 error response
 * - Amplify client errors: Returns 500 error response with details
 * - Post-initialization errors: Re-throws to be handled by error middleware
 *
 * **Performance Considerations:**
 * - First request bears initialization cost (typically 100-500ms)
 * - Subsequent requests use cached models (near-zero overhead)
 * - Timeout protection prevents hanging Lambda functions
 * - Optional query caching improves read performance
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
   * Tracks whether models have been successfully initialized
   * @internal
   */
  let isInitialized = false;

  /**
   * Promise for the current initialization attempt
   * Shared across concurrent requests to prevent duplicate initialization
   * @internal
   */
  let initPromise: Promise<{
    [K in TSelected]: QueryFactoryResult<K, TTypes>;
  }> | null = null;

  /**
   * Initialize Amplify models with timeout protection
   *
   * Creates Amplify client and query factories for the specified entities.
   * Uses Promise.race to implement timeout protection and prevent hanging.
   *
   * @param _input - WebSocket input (currently unused but kept for future extensibility)
   * @returns Promise resolving to initialized query factories
   * @throws {Error} When initialization times out or Amplify client fails
   * @internal
   */
  const initialize = async (
    _input: WebSocketInputWithModels<TTypes, TSelected>
  ): Promise<{
    [K in TSelected]: QueryFactoryResult<K, TTypes>;
  }> => {
    const db = await Promise.race([
      // Use unified initialization with cache support
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

    return db;
  };

  return async (input, next) => {
    const context = buildWebSocketContext(
      input as unknown as WebSocketInputWithModels<
        Record<string, AmplifyModelType>,
        string
      >
    );

    try {
      // Use cached models if already initialized
      if (isInitialized && initPromise) {
        const models = await initPromise;
        return await next({ ...input, models });
      }

      // Start initialization if not already in progress
      if (!initPromise) {
        initPromise = initialize(input);
      }

      const models = await initPromise;
      isInitialized = true;

      return await next({ ...input, models });
    } catch (error) {
      const message = getErrorMessage(error);

      // Handle initialization failures
      if (!isInitialized) {
        logger.error("WebSocket Model Initializer - Initialization failed", {
          ...context,
          error: message,
          cacheEnabled: !!cache?.enabled,
        });

        // Reset state to allow retry on next request
        isInitialized = false;
        initPromise = null;

        return {
          statusCode: 500,
          body: JSON.stringify({
            error: "Model initialization failed",
            message,
          }),
        } as TReturn;
      }

      // Re-throw post-initialization errors for error middleware to handle
      throw error;
    }
  };
}
