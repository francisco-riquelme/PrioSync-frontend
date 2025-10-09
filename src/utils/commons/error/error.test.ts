// @ts-nocheck
const mockLogger = {
  log: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
};

vi.mock('../log', () => ({
  logger: mockLogger,
}));

vi.mock('@log', () => ({
  logger: mockLogger,
}));

describe('Error Utility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('throwError', () => {
    it('should throw error with simple message', async () => {
      const { throwError } = await import('./error');

      expect(() => throwError('Simple error message')).toThrow(
        'Simple error message',
      );
      expect(mockLogger.error).toHaveBeenCalledWith('Simple error message', {
        errorType: 'undefined',
        stack: expect.any(String),
      });
    });

    it('should throw error with message and Error object', async () => {
      const { throwError } = await import('./error');
      const originalError = new Error('Database connection failed');

      expect(() => throwError('User creation failed', originalError)).toThrow(
        'User creation failed: Database connection failed',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'User creation failed: Database connection failed',
        {
          originalError: {
            name: 'Error',
            message: 'Database connection failed',
            stack: expect.any(String),
          },
          errorType: 'object',
          stack: expect.any(String),
        },
      );
    });

    it('should throw error with message and string error', async () => {
      const { throwError } = await import('./error');

      expect(() => throwError('Operation failed', 'Network timeout')).toThrow(
        'Operation failed: Network timeout',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Operation failed: Network timeout',
        {
          originalError: 'Network timeout',
          errorType: 'string',
          stack: expect.any(String),
        },
      );
    });

    it('should throw error with message and context object', async () => {
      const { throwError } = await import('./error');
      const context = {
        userId: '123',
        operation: 'create',
        additionalInfo: 'test',
      };

      expect(() => throwError('Context error', context)).toThrow(
        'Context error',
      );

      expect(mockLogger.error).toHaveBeenCalledWith('Context error', {
        userId: '123',
        operation: 'create',
        additionalInfo: 'test',
        errorType: 'object',
        stack: expect.any(String),
      });
    });

    it('should throw error with message and primitive value', async () => {
      const { throwError } = await import('./error');

      expect(() => throwError('Number error', 404)).toThrow(
        'Number error: 404',
      );

      expect(mockLogger.error).toHaveBeenCalledWith('Number error: 404', {
        originalError: 404,
        errorType: 'number',
        stack: expect.any(String),
      });
    });

    it('should throw error with Error object only', async () => {
      const { throwError } = await import('./error');
      const error = new Error('Direct error');

      expect(() => throwError(error)).toThrow('Direct error');

      expect(mockLogger.error).toHaveBeenCalledWith('Direct error', {
        originalError: {
          name: 'Error',
          message: 'Direct error',
          stack: expect.any(String),
        },
        errorType: 'object',
        stack: expect.any(String),
      });
    });

    it('should throw error with array of errors', async () => {
      const { throwError } = await import('./error');
      const errors = [
        new Error('First error'),
        { message: 'Second error' },
        'Third error',
      ];

      expect(() => throwError(errors)).toThrow(
        'Multiple errors occurred: First error; Second error; Third error',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Multiple errors occurred: First error; Second error; Third error',
        {
          errors,
          errorType: 'object',
          stack: expect.any(String),
        },
      );
    });

    it('should handle single error in array', async () => {
      const { throwError } = await import('./error');
      const errors = [new Error('Single error')];

      expect(() => throwError(errors)).toThrow('Single error');

      expect(mockLogger.error).toHaveBeenCalledWith('Single error', {
        errors,
        errorType: 'object',
        stack: expect.any(String),
      });
    });

    it('should handle empty array', async () => {
      const { throwError } = await import('./error');
      const errors = [];

      expect(() => throwError(errors)).toThrow('Unknown error occurred');

      expect(mockLogger.error).toHaveBeenCalledWith('Unknown error occurred', {
        errors,
        errorType: 'object',
        stack: expect.any(String),
      });
    });

    it('should handle unknown object with message property', async () => {
      const { throwError } = await import('./error');
      const unknownError = { message: 'Custom error', code: 500 };

      expect(() => throwError(unknownError)).toThrow('Custom error');

      expect(mockLogger.error).toHaveBeenCalledWith('Custom error', {
        originalError: unknownError,
        errorType: 'object',
        stack: expect.any(String),
      });
    });

    it('should handle unknown object without message property', async () => {
      const { throwError } = await import('./error');
      const unknownError = { code: 500, status: 'failed' };

      expect(() => throwError(unknownError)).toThrow(
        'Unexpected error: [object Object]',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Unexpected error: [object Object]',
        {
          originalError: unknownError,
          errorType: 'object',
          stack: expect.any(String),
        },
      );
    });

    it('should preserve original stack trace when available', async () => {
      const { throwError } = await import('./error');
      const originalError = new Error('Original error');
      originalError.stack = 'Original stack trace\n  at someFunction';

      try {
        throwError('Wrapped error', originalError);
      } catch (error) {
        expect(error.stack).toContain('Wrapped error: Original error');
        expect(error.stack).toContain('Caused by: Original stack trace');
      }
    });

    it('should handle null and undefined values', async () => {
      const { throwError } = await import('./error');

      expect(() => throwError('Null error', null)).toThrow('Null error: null');

      expect(() => throwError('Undefined error', undefined)).toThrow(
        'Undefined error',
      );
    });
  });

  describe('extractErrorMessage', () => {
    it('should extract message from Error object', async () => {
      const { extractErrorMessage } = await import('./error');
      const error = new Error('Test error message');

      const result = extractErrorMessage(error);

      expect(result).toBe('Test error message');
    });

    it('should return string as-is', async () => {
      const { extractErrorMessage } = await import('./error');

      const result = extractErrorMessage('String error');

      expect(result).toBe('String error');
    });

    it('should extract message from object with message property', async () => {
      const { extractErrorMessage } = await import('./error');
      const error = { message: 'Object error message', code: 404 };

      const result = extractErrorMessage(error);

      expect(result).toBe('Object error message');
    });

    it('should handle array of errors', async () => {
      const { extractErrorMessage } = await import('./error');
      const errors = [
        new Error('First error'),
        'Second error',
        { message: 'Third error' },
      ];

      const result = extractErrorMessage(errors);

      expect(result).toBe('First error; Second error; Third error');
    });

    it('should convert unknown types to string', async () => {
      const { extractErrorMessage } = await import('./error');

      expect(extractErrorMessage(404)).toBe('404');
      expect(extractErrorMessage(true)).toBe('true');
      expect(extractErrorMessage(null)).toBe('null');
      expect(extractErrorMessage(undefined)).toBe('undefined');
    });

    it('should handle complex objects', async () => {
      const { extractErrorMessage } = await import('./error');
      const complexObject = { code: 500, details: { reason: 'timeout' } };

      const result = extractErrorMessage(complexObject);

      expect(result).toBe('[object Object]');
    });

    it('should handle empty array', async () => {
      const { extractErrorMessage } = await import('./error');

      const result = extractErrorMessage([]);

      expect(result).toBe('');
    });

    it('should handle nested arrays', async () => {
      const { extractErrorMessage } = await import('./error');
      const nestedErrors = [
        'Error 1',
        ['Nested error 1', 'Nested error 2'],
        new Error('Error 2'),
      ];

      const result = extractErrorMessage(nestedErrors);

      expect(result).toBe('Error 1; Nested error 1; Nested error 2; Error 2');
    });
  });

  describe('createErrorContext', () => {
    it('should create error context object', async () => {
      const { createErrorContext } = await import('./error');
      const context = {
        userId: '123',
        operation: 'create',
        endpoint: '/api/users',
      };

      const result = createErrorContext(context);

      expect(result).toEqual({
        userId: '123',
        operation: 'create',
        endpoint: '/api/users',
      });
    });

    it('should handle empty context', async () => {
      const { createErrorContext } = await import('./error');

      const result = createErrorContext({});

      expect(result).toEqual({});
    });

    it('should handle various data types in context', async () => {
      const { createErrorContext } = await import('./error');
      const context = {
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        arrayValue: [1, 2, 3],
        objectValue: { nested: 'value' },
        nullValue: null,
        undefinedValue: undefined,
      };

      const result = createErrorContext(context);

      expect(result).toEqual({
        stringValue: 'test',
        numberValue: 42,
        booleanValue: true,
        arrayValue: [1, 2, 3],
        objectValue: { nested: 'value' },
        nullValue: null,
      });
    });
  });

  describe('integration tests', () => {
    it('should work with typical QueryFactory error pattern', async () => {
      const { throwError } = await import('./error');
      const dbError = new Error('Connection timeout');

      expect(() => throwError('User could not be created', dbError)).toThrow(
        'User could not be created: Connection timeout',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'User could not be created: Connection timeout',
        expect.objectContaining({
          originalError: expect.objectContaining({
            name: 'Error',
            message: 'Connection timeout',
          }),
          errorType: 'object',
          stack: expect.any(String),
        }),
      );
    });

    it('should work with GraphQL errors array pattern', async () => {
      const { throwError } = await import('./error');
      const graphqlErrors = [
        { message: 'Field validation failed' },
        { message: 'Permission denied' },
      ];

      expect(() => throwError(graphqlErrors)).toThrow(
        'Multiple errors occurred: Field validation failed; Permission denied',
      );
    });

    it('should work with context-based error pattern', async () => {
      const { throwError, createErrorContext } = await import('./error');
      const context = createErrorContext({
        userId: 'user-123',
        operation: 'delete',
        resource: 'Calendar',
      });

      expect(() => throwError('Resource deletion failed', context)).toThrow(
        'Resource deletion failed',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Resource deletion failed',
        expect.objectContaining({
          userId: 'user-123',
          operation: 'delete',
          resource: 'Calendar',
        }),
      );
    });
  });
});
