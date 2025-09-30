# Log Utility

Environment-aware singleton logger with structured JSON output for AWS Lambda and CloudWatch integration.

## Core Features

- **Singleton Pattern**: Single instance across application
- **Environment Detection**: Auto-detects AWS Lambda, production, development
- **Structured Logging**: JSON format for CloudWatch Logs Insights
- **Context Management**: Persistent context across log calls
- **Log Levels**: NONE(0), ERROR(1), WARN(2), INFO(3), DEBUG(4)

## Basic Usage

```typescript
import { logger, LogLevel } from '@your-org/amplify-shared-utilities/log';

// Set log level
logger.setLevel(LogLevel.DEBUG);

// Basic logging
logger.error('Error message', { errorCode: 500 });
logger.warn('Warning message');
logger.info('Info message', { userId: '123' });
logger.debug('Debug message');

// Set persistent context
logger.setContext({ requestId: 'req-123', userId: 'user-456' });
logger.info('Message with context'); // Includes requestId and userId

// Clear context
logger.clearContext();
```

## Environment Behavior

- **Development**: Text format with context
- **Production/AWS Lambda**: Structured JSON with AWS metadata
- **Override**: Set `STRUCTURED_LOGGING=true/false`

## AWS Lambda Integration

Automatically captures:

- `AWS_REQUEST_ID`
- `AWS_LAMBDA_FUNCTION_NAME`
- `_X_AMZN_TRACE_ID`
- Environment detection via function name patterns

## Configuration

- **Log Level**: Set via `LOG_LEVEL` environment variable (0-4)
- **Structured Logging**: Override with `STRUCTURED_LOGGING` environment variable
- **Environment**: Auto-detected or set via `environment` variable

## Exports

```typescript
export { logger, LogLevel, LogContext, StructuredLogEntry };
```

## Methods

- `setLevel(level: LogLevel)`: Set minimum log level
- `setContext(context: Partial<LogContext>)`: Add persistent context
- `getContext()`: Get current context
- `clearContext()`: Remove all context
- `error/warn/info/debug(...args)`: Log at specific level
- `log(...args)`: Direct console output
