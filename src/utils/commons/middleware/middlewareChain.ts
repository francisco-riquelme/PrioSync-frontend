// Future Enhancement: Response Transformation Support
// Planned features for response processing:
// - useResponseTransformer() method for response-only transformations
// - useFull() method for combined request/response middleware
// - ResponseTransformer<TInput, TOutput> type for type-safe response modifications
// These features will provide cleaner patterns for response processing (timestamps, compression, headers, etc.)

/**
 * Base middleware function type
 *
 * Middleware follows the "onion model" pattern:
 * 1. Middleware executes in the order they were added
 * 2. Each middleware can modify input before calling next()
 * 3. Each middleware can process the result after next() returns
 * 4. If next() is not called, the chain stops and remaining middleware/handler are skipped
 *
 * @template TInput - Type of input passed to middleware
 * @template TOutput - Type of output returned by middleware chain
 * @param input - The input data passed through the chain
 * @param next - Function to continue to the next middleware or final handler
 * @returns Promise resolving to the output of the chain
 *
 * @example
 * ```typescript
 * const loggingMiddleware: Middleware<MyInput, MyOutput> = async (input, next) => {
 *   console.log('Before handler');
 *   const result = await next();
 *   console.log('After handler');
 *   return result;
 * };
 * ```
 */
export type Middleware<TInput = unknown, TOutput = unknown> = (
  input: TInput,
  next: (input?: TInput) => Promise<TOutput>,
) => Promise<TOutput>;

/**
 * Enhanced error with middleware chain context
 */
export interface MiddlewareError extends Error {
  middlewareName?: string;
  middlewareIndex?: number;
  totalMiddlewares?: number;
  middlewareChain?: string[];
  originalError?: unknown;
}

/**
 * Configuration for middleware chain
 */
export interface MiddlewareChainConfig {
  enableDebugLogging?: boolean;
  onError?: (error: unknown, middlewareName: string) => void;
}

/**
 * Generic middleware chain implementation
 *
 * Provides Express-style middleware functionality for AWS Lambda handlers.
 * Middleware executes in an "onion model" where each middleware wraps the next one in the chain.
 *
 * **Execution Flow:**
 * ```
 * Middleware 1 (before) →
 *   Middleware 2 (before) →
 *     Final Handler →
 *   Middleware 2 (after) ←
 * Middleware 1 (after) ←
 * ```
 *
 * **Input Mutation:**
 * - Middleware can mutate the input object directly
 * - Changes are visible to all subsequent middleware and the final handler
 * - Consider input immutability for complex applications
 *
 * **Error Handling:**
 * - Errors thrown by middleware are enhanced with chain context
 * - Execution stops at the first error (no subsequent middleware execute)
 * - Configure `onError` handler for centralized error processing
 *
 * **Performance:**
 * - Each execution creates a closure chain - consider reusing chains for high-frequency operations
 * - Debug logging adds overhead - disable in production
 *
 * @template TInput - Type of input data passed through the chain
 * @template TOutput - Type of output returned by the chain
 *
 * @example
 * ```typescript
 * const chain = new MiddlewareChain<MyInput, MyOutput>({
 *   enableDebugLogging: true,
 *   onError: (error, middlewareName) => {
 *     console.error(`Middleware ${middlewareName} failed:`, error);
 *   }
 * });
 *
 * chain
 *   .use('auth', authMiddleware)
 *   .use('logging', loggingMiddleware)
 *   .use('validation', validationMiddleware);
 *
 * const result = await chain.execute(input, finalHandler);
 * ```
 */
export class MiddlewareChain<TInput = unknown, TOutput = unknown> {
  private middlewares: Array<{
    name: string;
    middleware: Middleware<TInput, TOutput>;
  }> = [];
  private config: MiddlewareChainConfig;

  constructor(config: MiddlewareChainConfig = {}) {
    this.config = config;
  }

  /**
   * Create a middleware chain specifically for AWS Lambda handlers
   *
   * This is a convenience method that creates a chain with the standard
   * Lambda input structure: `{ event: TEvent; context: TContext }`
   *
   * @template TEvent - Type of the Lambda event
   * @template TContext - Type of the Lambda context
   * @template TReturn - Type of the Lambda return value
   * @param config - Configuration options for the chain
   * @returns A new middleware chain configured for Lambda handlers
   *
   * @example
   * ```typescript
   * const chain = MiddlewareChain.createLambdaChain<APIGatewayProxyEvent, Context, APIGatewayProxyResult>();
   * ```
   */
  static createLambdaChain<
    TEvent = Record<string, unknown>,
    TContext = Record<string, unknown>,
    TReturn = Record<string, unknown>,
  >(
    config: MiddlewareChainConfig = {},
  ): MiddlewareChain<{ event: TEvent; context: TContext }, TReturn> {
    return new MiddlewareChain<{ event: TEvent; context: TContext }, TReturn>(
      config,
    );
  }

  /**
   * Add middleware to the chain
   *
   * Middleware functions are executed in the order they are added.
   * Each middleware receives the input and a `next` function to continue
   * to the next middleware or final handler.
   *
   * @param name - Descriptive name for the middleware (used in error messages and logging)
   * @param middleware - The middleware function to add
   * @returns This chain instance for method chaining
   *
   * @example
   * ```typescript
   * chain
   *   .use('authentication', authMiddleware)
   *   .use('logging', loggingMiddleware)
   *   .use('validation', validationMiddleware);
   * ```
   */
  use(name: string, middleware: Middleware<TInput, TOutput>): this {
    this.middlewares.push({ name, middleware });
    return this;
  }

  /**
   * Execute the middleware chain with the given input and final handler
   *
   * This method runs all middleware in the chain, followed by the final handler.
   * If any middleware throws an error, execution stops and the error is enhanced
   * with chain context before being re-thrown.
   *
   * @param input - The input data to pass through the middleware chain
   * @param finalHandler - The final handler function that processes the input
   * @returns Promise resolving to the output from the final handler
   *
   * @example
   * ```typescript
   * const result = await chain.execute(
   *   { userId: '123', data: { name: 'John' } },
   *   async (input) => {
   *     return await fetchUserData(input.userId);
   *   }
   * );
   * ```
   */
  async execute(
    input: TInput,
    finalHandler: (input: TInput) => Promise<TOutput>,
  ): Promise<TOutput> {
    if (this.middlewares.length === 0) {
      return finalHandler(input);
    }

    let index = 0;

    const executeNext = async (modifiedInput?: TInput): Promise<TOutput> => {
      if (index >= this.middlewares.length) {
        // We're now in the final handler - any errors should not be attributed to middleware
        return finalHandler(modifiedInput ?? input);
      }

      const { name, middleware } = this.middlewares[index];
      const currentIndex = index;
      index++;

      try {
        return await middleware(modifiedInput ?? input, executeNext);
      } catch (error) {
        // Only enhance error if it doesn't already have middleware context
        // and it came from middleware code (not bubbled up from handler)
        const isAlreadyMiddlewareError =
          error instanceof Error &&
          'middlewareName' in error &&
          typeof (error as MiddlewareError).middlewareName === 'string';

        const isFromErrorLibrary =
          error instanceof Error &&
          '__fromErrorLibrary' in error &&
          (error as Error & { __fromErrorLibrary?: boolean })
            .__fromErrorLibrary === true;

        // If it's already been processed by error library or is already a middleware error,
        // don't add middleware context (it came from handler/downstream)
        if (isAlreadyMiddlewareError || isFromErrorLibrary) {
          throw error;
        }

        // This is a genuine middleware error - enhance it
        const enhancedError: MiddlewareError =
          error instanceof Error ? error : new Error(String(error));

        enhancedError.middlewareName = name;
        enhancedError.middlewareIndex = currentIndex;
        enhancedError.totalMiddlewares = this.middlewares.length;
        enhancedError.middlewareChain = this.middlewares.map(m => m.name);

        // Store original error if we created a new Error object
        if (!(error instanceof Error)) {
          enhancedError.originalError = error;
        }

        if (this.config.onError) {
          this.config.onError(enhancedError, name);
        }
        throw enhancedError;
      }
    };

    return executeNext();
  }

  /**
   * Get the number of middlewares in the chain
   *
   * @returns The count of middleware functions currently in the chain
   *
   * @example
   * ```typescript
   * const chain = new MiddlewareChain();
   * console.log(chain.length); // 0
   *
   * chain.use('auth', authMiddleware);
   * chain.use('logging', loggingMiddleware);
   * console.log(chain.length); // 2
   * ```
   */
  get length(): number {
    return this.middlewares.length;
  }

  /**
   * Clear all middlewares from the chain
   *
   * Removes all middleware functions, resetting the chain to empty state.
   * Useful for reusing chain instances or cleaning up during testing.
   *
   * @returns This chain instance for method chaining
   *
   * @example
   * ```typescript
   * const chain = new MiddlewareChain();
   * chain.use('auth', authMiddleware);
   * chain.use('logging', loggingMiddleware);
   *
   * chain.clear(); // Chain is now empty
   * console.log(chain.length); // 0
   * ```
   */
  clear(): this {
    this.middlewares = [];
    return this;
  }
}

/**
 * Wrap a Lambda handler with middleware chain functionality
 *
 * This function creates a new Lambda handler that executes the middleware chain
 * before calling the original handler. The middleware chain receives the Lambda
 * event and context as input.
 *
 * @template TEvent - Type of the Lambda event
 * @template TContext - Type of the Lambda context
 * @template TReturn - Type of the Lambda return value
 * @param chain - The middleware chain to execute
 * @param handler - The original Lambda handler function
 * @returns A new Lambda handler function that includes middleware execution
 *
 * @example
 * ```typescript
 * const wrappedHandler = wrapLambdaHandler(
 *   chain,
 *   async (event, context) => {
 *     return { statusCode: 200, body: 'Hello World' };
 *   }
 * );
 * ```
 */
export function wrapLambdaHandler<
  TEvent = Record<string, unknown>,
  TContext = Record<string, unknown>,
  TReturn = unknown,
>(
  chain: MiddlewareChain<{ event: TEvent; context: TContext }, TReturn>,
  handler: (event: TEvent, context: TContext) => Promise<TReturn>,
): (event: TEvent, context: TContext) => Promise<TReturn> {
  return async (event: TEvent, context: TContext) => {
    return await chain.execute({ event, context }, async input => {
      return await handler(input.event, input.context);
    });
  };
}
