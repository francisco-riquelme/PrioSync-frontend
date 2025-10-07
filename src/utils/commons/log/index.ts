/**
 * Defines the log levels for the logger.
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

/**
 * Defines the structure for contextual information attached to logs.
 */
export interface LogContext {
  requestId?: string;
  operation?: string;
  userId?: string;
  [key: string]: unknown;
}

/**
 * Defines the structure for a structured log entry in JSON format.
 */
export interface StructuredLogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  data?: unknown;
  // AWS Lambda context
  awsRequestId?: string;
  functionName?: string;
  xrayTraceId?: string;
  // Environment info
  environment?: string;
}

/**
 * A singleton Logger class that provides structured and text-based logging.
 * It supports different log levels, contextual information, and can adapt
 * its output format based on the environment (e.g., development, production, AWS Lambda).
 */
class Logger {
  private static instance: Logger;
  private level: LogLevel = LogLevel.INFO; // Default level
  private context: LogContext = {};
  private useStructuredLogging: boolean = false;
  private environment: string = "development";

  // Make constructor private to enforce singleton pattern
  private constructor() {
    // Detect environment using multiple methods
    this.environment = this.detectEnvironment();

    // Enable structured logging based on environment detection
    this.useStructuredLogging = this.shouldUseStructuredLogging();
  }

  /**
   * Detects the current runtime environment.
   * It checks for Amplify-specific environment variables, AWS Lambda function names,
   * and standard `NODE_ENV`. Defaults to 'development'.
   * @returns The detected environment name (e.g., 'production', 'development').
   */
  private detectEnvironment(): string {
    // Method 1: Explicit environment variable (set in backend.ts)
    if (process.env.environment === "prod") {
      return "production";
    }

    // Method 2: AWS stack name pattern (matches backend.ts logic)
    const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
    if (functionName && functionName.includes("-main-")) {
      return "production";
    }

    // Method 3: AWS execution environment
    if (process.env.AWS_EXECUTION_ENV) {
      return "aws-lambda";
    }

    // Method 4: Traditional NODE_ENV
    if (process.env.NODE_ENV === "production") {
      return "production";
    }

    // Default to development
    return "development";
  }

  /**
   * Determines whether to use structured (JSON) logging.
   * Structured logging is enabled if the `STRUCTURED_LOGGING` environment variable is 'true',
   * or if the environment is detected as 'pro' or 'aws-lambda'.
   * @returns `true` if structured logging should be used, otherwise `false`.
   */
  private shouldUseStructuredLogging(): boolean {
    // Explicit override
    if (process.env.STRUCTURED_LOGGING === "true") {
      return true;
    }
    if (process.env.STRUCTURED_LOGGING === "false") {
      return false;
    }

    // Auto-enable for production and AWS Lambda environments
    return (
      this.environment === "production" || this.environment === "aws-lambda"
    );
  }

  /**
   * Gets the singleton instance of the Logger.
   * @returns The singleton Logger instance.
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Sets the log level for the logger. Messages with a level lower than
   * the set level will not be logged.
   * @param level The log level to set.
   */
  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Gets the current log level of the logger.
   * @returns The current LogLevel.
   */
  public getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Gets the name of the current log level.
   * @returns The name of the current log level (e.g., 'INFO', 'DEBUG').
   */
  public getLevelName(): string {
    return LogLevel[this.level];
  }

  /**
   * Gets the detected runtime environment.
   * @returns The name of the environment (e.g., 'production', 'development').
   */
  public getEnvironment(): string {
    return this.environment;
  }

  /**
   * Enables or disables structured (JSON) logging.
   * @param enabled `true` to enable structured logging, `false` to disable it.
   */
  public setStructuredLogging(enabled: boolean): void {
    this.useStructuredLogging = enabled;
  }

  /**
   * Checks if structured logging is currently enabled.
   * @returns `true` if structured logging is enabled, otherwise `false`.
   */
  public isStructuredLoggingEnabled(): boolean {
    return this.useStructuredLogging;
  }

  /**
   * Sets context that will be included in all subsequent log messages.
   * The new context is merged with any existing context.
   * @param newContext A partial LogContext object to merge into the current context.
   */
  public setContext(newContext: Partial<LogContext>): void {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Gets a copy of the current log context.
   * @returns A copy of the current LogContext.
   */
  public getContext(): LogContext {
    return { ...this.context };
  }

  /**
   * Clears the current log context.
   */
  public clearContext(): void {
    this.context = {};
  }

  /**
   * Retrieves AWS Lambda-specific context from environment variables.
   * @returns An object containing AWS request ID, function name, trace ID, and environment.
   */
  private getAWSContext(): Partial<StructuredLogEntry> {
    const awsContext: Partial<StructuredLogEntry> = {};

    if (process.env.AWS_REQUEST_ID) {
      awsContext.awsRequestId = process.env.AWS_REQUEST_ID;
    }

    if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
      awsContext.functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
    }

    if (process.env._X_AMZN_TRACE_ID) {
      awsContext.xrayTraceId = process.env._X_AMZN_TRACE_ID;
    }

    // Include detected environment
    awsContext.environment = this.environment;

    return awsContext;
  }

  /**
   * Creates a structured log entry object.
   * @param level The log level name (e.g., 'ERROR').
   * @param message The main log message.
   * @param data Additional data to include in the log.
   * @returns A StructuredLogEntry object.
   */
  private createStructuredLog(
    level: string,
    message: string,
    data?: unknown
  ): StructuredLogEntry {
    const logEntry: StructuredLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...this.getAWSContext(),
    };

    // Add context if it exists
    if (Object.keys(this.context).length > 0) {
      logEntry.context = this.context;
    }

    // Add data if provided
    if (data !== undefined) {
      logEntry.data = data;
    }

    return logEntry;
  }

  /**
   * Formats a log message with context for plain text logging.
   * @param level The log level name (e.g., 'INFO').
   * @param args The array of arguments to log.
   * @returns A formatted log string.
   */
  private formatWithContext(level: string, args: unknown[]): string {
    const contextStr =
      Object.keys(this.context).length > 0
        ? ` ${JSON.stringify(this.context)}`
        : "";

    const argsStr = args
      .map((arg) => {
        try {
          return typeof arg === "string" ? arg : JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(" ");

    return `[${level}]${contextStr} ${argsStr}`;
  }

  /**
   * The main logging method that handles both structured and text logging.
   * It checks the log level and formats the message accordingly.
   * @param level The log level of the message.
   * @param levelName The name of the log level.
   * @param args The arguments to log.
   */
  private logMessage(
    level: LogLevel,
    levelName: string,
    ...args: unknown[]
  ): void {
    if (this.level < level) return;

    if (this.useStructuredLogging) {
      // Structured JSON logging
      const message = args.length > 0 ? String(args[0]) : "";
      const data = args.length > 1 ? args.slice(1) : undefined;

      const structuredLog = this.createStructuredLog(levelName, message, data);
      const output = JSON.stringify(structuredLog);

      // Use appropriate console method
      if (level === LogLevel.ERROR) {
        console.error(output);
      } else if (level === LogLevel.WARN) {
        console.warn(output);
      } else if (level === LogLevel.INFO) {
        console.info(output);
      } else {
        console.debug(output);
      }
    } else {
      // Text logging (existing behavior)
      const message = this.formatWithContext(levelName, args);

      if (level === LogLevel.ERROR) {
        console.error(message);
      } else if (level === LogLevel.WARN) {
        console.warn(message);
      } else if (level === LogLevel.INFO) {
        console.info(message);
      } else {
        console.debug(message);
      }
    }

    // Add newline after each log message for better readability
    console.log();
  }

  /**
   * Logs an error message.
   * @param args The arguments to log.
   */
  public error(...args: unknown[]): void {
    this.logMessage(LogLevel.ERROR, "ERROR", ...args);
  }

  /**
   * Logs a warning message.
   * @param args The arguments to log.
   */
  public warn(...args: unknown[]): void {
    this.logMessage(LogLevel.WARN, "WARN", ...args);
  }

  /**
   * Logs an informational message.
   * @param args The arguments to log.
   */
  public info(...args: unknown[]): void {
    this.logMessage(LogLevel.INFO, "INFO", ...args);
  }

  /**
   * Logs a debug message.
   * @param args The arguments to log.
   */
  public debug(...args: unknown[]): void {
    this.logMessage(LogLevel.DEBUG, "DEBUG", ...args);
  }

  /**
   * Logs a message directly to the console without level checking or formatting.
   * All arguments are stringified.
   * @param args The arguments to log.
   */
  public log(...args: unknown[]): void {
    const stringifiedArgs = args.map((arg) => {
      try {
        return typeof arg === "string" ? arg : JSON.stringify(arg);
      } catch {
        return String(arg);
      }
    });
    console.log(...stringifiedArgs);
  }
}

/**
 * # Usage in AWS Lambda with CloudWatch
 *
 * This logger is optimized for use within AWS Lambda functions, sending structured
 * JSON logs to Amazon CloudWatch.
 *
 * ## Structured Logging
 *
 * When running in a detected AWS Lambda environment, the logger automatically
 * switches to structured JSON format. This provides several advantages in CloudWatch:
 *
 * - **Searchable Logs**: Structured logs enable easy searching and filtering in CloudWatch Logs
 *   based on JSON fields (e.g., `level`, `context.requestId`, `data.someValue`).
 * - **CloudWatch Logs Insights**: Structured logs can be queried with CloudWatch
 *   Logs Insights for powerful analysis and visualization.
 * - **Automatic Context**: The logger automatically captures Lambda-specific context
 *   like `awsRequestId` and `functionName`.
 *
 * ## Example Handler
 *
 * ```typescript
 * import { logger } from './util/log';
 *
 * export const handler = async (event, context) => {
 *   // Set context for all logs in this invocation for easy tracking
 *   logger.setContext({
 *     awsRequestId: context.awsRequestId,
 *     userId: event.arguments.userId, // Example
 *   });
 *
 *   try {
 *     logger.info('Function started', { input: event.arguments });
 *
 *     // ... business logic implementation ...
 *
 *     const result = { success: true };
 *     logger.info('Function finished successfully', { result });
 *     return result;
 *
 *   } catch (error) {
 *     // Log the error with structured data
 *     logger.error('An unhandled error occurred', {
 *       error: error.message,
 *       stack: error.stack,
 *     });
 *     // Rethrow or handle as appropriate
 *     throw error;
 *   } finally {
 *     // Clear context to avoid leaking information between invocations
 *     logger.clearContext();
 *   }
 * };
 * ```
 */
// Export a singleton instance
export const logger = Logger.getInstance();
let logLevel;
try {
  // Remove the debug console.log(process) statement
  logLevel = parseInt(process?.env?.LOG_LEVEL || "3");
} catch {
  logLevel = 3;
}
logger.setLevel(logLevel as LogLevel);
