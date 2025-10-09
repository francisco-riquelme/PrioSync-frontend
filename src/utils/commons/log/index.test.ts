// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock console methods
const mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
};

// Mock process.env
const originalEnv = process.env;

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    // Mock console
    global.console = mockConsole;

    // Reset environment
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    process.env = originalEnv;
  });

  describe('LogLevel', () => {
    it('should have correct log level values', async () => {
      const { LogLevel } = await import('./index');

      expect(LogLevel.NONE).toBe(0);
      expect(LogLevel.ERROR).toBe(1);
      expect(LogLevel.WARN).toBe(2);
      expect(LogLevel.INFO).toBe(3);
      expect(LogLevel.DEBUG).toBe(4);
    });
  });

  describe('Logger Instance', () => {
    it('should return singleton instance', async () => {
      const { logger } = await import('./index');
      const { logger: logger2 } = await import('./index');

      expect(logger).toBe(logger2);
    });

    it('should have default log level of INFO', async () => {
      const { logger } = await import('./index');

      expect(logger.getLevel()).toBe(3); // INFO
      expect(logger.getLevelName()).toBe('INFO');
    });
  });

  describe('Environment Detection', () => {
    it('should detect development environment by default', async () => {
      const { logger } = await import('./index');

      expect(logger.getEnvironment()).toBe('development');
    });

    it('should detect production environment from NODE_ENV', async () => {
      process.env.NODE_ENV = 'production';
      const { logger } = await import('./index');

      expect(logger.getEnvironment()).toBe('production');
    });

    it('should detect AWS Lambda environment', async () => {
      process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs22.x';
      const { logger } = await import('./index');

      expect(logger.getEnvironment()).toBe('aws-lambda');
    });

    it('should detect production from AWS function name', async () => {
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'myapp-main-userFunction';
      const { logger } = await import('./index');

      expect(logger.getEnvironment()).toBe('production');
    });
  });

  describe('Log Level Management', () => {
    it('should set and get log level', async () => {
      const { logger, LogLevel } = await import('./index');

      logger.setLevel(LogLevel.DEBUG);
      expect(logger.getLevel()).toBe(LogLevel.DEBUG);
      expect(logger.getLevelName()).toBe('DEBUG');
    });

    it('should not log messages below current level', async () => {
      const { logger, LogLevel } = await import('./index');

      logger.setLevel(LogLevel.WARN);
      logger.debug('This should not be logged');

      expect(mockConsole.debug).not.toHaveBeenCalled();
    });
  });

  describe('Context Management', () => {
    it('should set and get context', async () => {
      const { logger } = await import('./index');

      const context = { userId: '123', operation: 'create' };
      logger.setContext(context);

      expect(logger.getContext()).toEqual(context);
    });

    it('should merge context', async () => {
      const { logger } = await import('./index');

      logger.setContext({ userId: '123' });
      logger.setContext({ operation: 'create' });

      expect(logger.getContext()).toEqual({
        userId: '123',
        operation: 'create',
      });
    });

    it('should clear context', async () => {
      const { logger } = await import('./index');

      logger.setContext({ userId: '123' });
      logger.clearContext();

      expect(logger.getContext()).toEqual({});
    });
  });

  describe('Structured Logging', () => {
    it('should enable structured logging in production', async () => {
      process.env.NODE_ENV = 'production';
      const { logger } = await import('./index');

      expect(logger.isStructuredLoggingEnabled()).toBe(true);
    });

    it('should enable structured logging in AWS Lambda', async () => {
      process.env.AWS_EXECUTION_ENV = 'AWS_Lambda_nodejs22.x';
      const { logger } = await import('./index');

      expect(logger.isStructuredLoggingEnabled()).toBe(true);
    });

    it('should respect STRUCTURED_LOGGING environment variable', async () => {
      process.env.STRUCTURED_LOGGING = 'true';
      const { logger } = await import('./index');

      expect(logger.isStructuredLoggingEnabled()).toBe(true);
    });

    it('should disable structured logging when explicitly set to false', async () => {
      process.env.STRUCTURED_LOGGING = 'false';
      const { logger } = await import('./index');

      expect(logger.isStructuredLoggingEnabled()).toBe(false);
    });
  });

  describe('Logging Methods', () => {
    it('should log error messages', async () => {
      const { logger } = await import('./index');

      logger.error('Test error message');

      expect(mockConsole.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Test error message'),
      );
    });

    it('should log warning messages', async () => {
      const { logger } = await import('./index');

      logger.warn('Test warning message');

      expect(mockConsole.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Test warning message'),
      );
    });

    it('should log info messages', async () => {
      const { logger } = await import('./index');

      logger.info('Test info message');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test info message'),
      );
    });

    it('should log debug messages', async () => {
      const { logger, LogLevel } = await import('./index');

      logger.setLevel(LogLevel.DEBUG);
      logger.debug('Test debug message');

      expect(mockConsole.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Test debug message'),
      );
    });

    it('should log with context', async () => {
      const { logger } = await import('./index');

      logger.setContext({ userId: '123' });
      logger.info('User action');

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('{"userId":"123"}'),
      );
    });

    it('should log multiple arguments', async () => {
      const { logger } = await import('./index');

      logger.info('User created', { id: '123', name: 'John' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('User created'),
      );
    });
  });

  describe('Structured Logging Output', () => {
    it('should output JSON in structured mode', async () => {
      process.env.STRUCTURED_LOGGING = 'true';
      const { logger } = await import('./index');

      logger.info('Test message', { data: 'value' });

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringMatching(
          /^\{.*"level":"INFO".*"message":"Test message".*"data":"value".*\}\n$/,
        ),
      );
    });

    it('should include AWS context in structured logs', async () => {
      process.env.STRUCTURED_LOGGING = 'true';
      process.env.AWS_REQUEST_ID = 'req-123';
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-function';
      process.env._X_AMZN_TRACE_ID = 'trace-456';

      const { logger } = await import('./index');

      logger.info('Test message');

      const logCall = mockConsole.info.mock.calls[0][0];
      const logData = JSON.parse(logCall.trim());

      expect(logData.awsRequestId).toBe('req-123');
      expect(logData.functionName).toBe('test-function');
      expect(logData.xrayTraceId).toBe('trace-456');
    });

    it('should include environment in structured logs', async () => {
      process.env.STRUCTURED_LOGGING = 'true';
      process.env.NODE_ENV = 'production';

      const { logger } = await import('./index');

      logger.info('Test message');

      const logCall = mockConsole.info.mock.calls[0][0];
      const logData = JSON.parse(logCall.trim());

      expect(logData.environment).toBe('production');
    });
  });

  describe('Error Handling', () => {
    it('should handle circular references in objects', async () => {
      const { logger } = await import('./index');

      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      logger.info('Circular object', circularObj);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Circular object'),
      );
    });

    it('should handle undefined and null values', async () => {
      const { logger } = await import('./index');

      logger.info('Test', undefined, null);

      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test'),
      );
    });
  });

  describe('Direct Log Method', () => {
    it('should log directly without level checking', async () => {
      const { logger, LogLevel } = await import('./index');

      logger.setLevel(LogLevel.ERROR); // Only errors should be logged
      logger.log('Direct message'); // This should still work

      expect(mockConsole.log).toHaveBeenCalledWith('Direct message');
    });

    it('should stringify objects in direct log', async () => {
      const { logger } = await import('./index');

      const obj = { name: 'test', value: 123 };
      logger.log('Object:', obj);

      expect(mockConsole.log).toHaveBeenCalledWith(
        'Object:',
        '{"name":"test","value":123}',
      );
    });
  });

  describe('Integration Tests', () => {
    it('should work with typical QueryFactory logging pattern', async () => {
      const { logger } = await import('./index');

      logger.setContext({ userId: '123', operation: 'create' });
      logger.info('Creating User', { data: { name: 'John' } });
      logger.info('User created successfully');

      expect(mockConsole.info).toHaveBeenCalledTimes(2);
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('Creating User'),
      );
      expect(mockConsole.info).toHaveBeenCalledWith(
        expect.stringContaining('User created successfully'),
      );
    });

    it('should handle AWS Lambda context properly', async () => {
      process.env.AWS_REQUEST_ID = 'req-123';
      process.env.AWS_LAMBDA_FUNCTION_NAME = 'user-function';
      process.env.STRUCTURED_LOGGING = 'true';

      const { logger } = await import('./index');

      logger.setContext({ userId: '123' });
      logger.info('Function started');

      const logCall = mockConsole.info.mock.calls[0][0];
      const logData = JSON.parse(logCall.trim());

      expect(logData.awsRequestId).toBe('req-123');
      expect(logData.functionName).toBe('user-function');
      expect(logData.context.userId).toBe('123');
      expect(logData.message).toBe('Function started');
    });
  });
});
