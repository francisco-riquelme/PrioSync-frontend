import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest';
import {
  WebSocketErrorCodes,
  throwWebSocketError,
  WebSocketErrors,
  isWebSocketError,
  extractWebSocketErrorInfo,
  type WebSocketError,
  type WebSocketErrorContext,
} from './websocket';
import { throwError, extractErrorMessage, createErrorContext } from './error';

vi.mock('./error', () => ({
  throwError: vi.fn(),
  extractErrorMessage: vi.fn(error => error.message || 'Unknown error'),
  createErrorContext: vi.fn(context => ({
    ...context,
    timestamp: 'mock-timestamp',
  })),
}));

describe('WebSocket Error Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('throwWebSocketError', () => {
    it('should call throwError with correct parameters including context', () => {
      const context: WebSocketErrorContext = { connectionId: 'conn-123' };
      throwWebSocketError(400, 'BAD_REQUEST', 'Invalid request', context);

      expect(createErrorContext).toHaveBeenCalledWith({
        ...context,
        statusCode: 400,
        code: 'BAD_REQUEST',
        originalError: undefined,
      });

      expect(throwError).toHaveBeenCalledWith('Invalid request', {
        ...context,
        statusCode: 400,
        code: 'BAD_REQUEST',
        originalError: undefined,
        timestamp: 'mock-timestamp',
      });
    });

    it('should handle originalError correctly', () => {
      const originalError = new Error('Original cause');
      const context: WebSocketErrorContext = {
        connectionId: 'conn-456',
        originalError,
      };
      throwWebSocketError(
        500,
        'INTERNAL_SERVER_ERROR',
        'Server failure',
        context,
      );

      expect(createErrorContext).toHaveBeenCalledWith({
        connectionId: 'conn-456',
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
        originalError,
      });

      expect(throwError).toHaveBeenCalledWith('Server failure', {
        connectionId: 'conn-456',
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
        originalError,
        timestamp: 'mock-timestamp',
      });
    });

    it('should function without a context object', () => {
      throwWebSocketError(401, 'AUTHENTICATION_ERROR', 'Unauthorized');

      expect(createErrorContext).toHaveBeenCalledWith({
        statusCode: 401,
        code: 'AUTHENTICATION_ERROR',
        originalError: undefined,
      });

      expect(throwError).toHaveBeenCalledWith('Unauthorized', {
        statusCode: 401,
        code: 'AUTHENTICATION_ERROR',
        originalError: undefined,
        timestamp: 'mock-timestamp',
      });
    });
  });

  describe('WebSocketErrors', () => {
    const testCases: {
      name: keyof typeof WebSocketErrors;
      statusCode: number;
      code: keyof typeof WebSocketErrorCodes;
    }[] = [
      { name: 'validation', statusCode: 400, code: 'VALIDATION_ERROR' },
      { name: 'authentication', statusCode: 401, code: 'AUTHENTICATION_ERROR' },
      { name: 'authorization', statusCode: 403, code: 'AUTHORIZATION_ERROR' },
      { name: 'connection', statusCode: 400, code: 'CONNECTION_ERROR' },
      { name: 'messageTooLarge', statusCode: 413, code: 'MESSAGE_TOO_LARGE' },
      {
        name: 'rateLimitExceeded',
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
      },
      { name: 'badRequest', statusCode: 400, code: 'BAD_REQUEST' },
      {
        name: 'serviceUnavailable',
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
      },
    ];

    for (const { name, statusCode, code } of testCases) {
      it(`WebSocketErrors.${name} should call throwError with correct parameters`, () => {
        const message = `${name} error message`;
        const context = { connectionId: 'test-conn-id' };
        const originalError = new Error('Original test error');

        WebSocketErrors[name](message, context, originalError);

        expect(throwError).toHaveBeenCalledWith(message, {
          statusCode,
          code,
          ...context,
          originalError,
          timestamp: 'mock-timestamp',
        });
      });
    }
  });

  describe('isWebSocketError', () => {
    it('should return true for a valid WebSocketError object', () => {
      const error: WebSocketError = {
        name: 'WebSocketError',
        message: 'A test error',
        statusCode: 400,
        code: 'BAD_REQUEST',
        context: { connectionId: '123' },
      };
      // The type guard relies on `instanceof Error` which may not work for plain objects.
      // We simulate an error object.
      const errorObject = Object.assign(new Error('A test error'), error);
      expect(isWebSocketError(errorObject)).toBe(true);
    });

    it('should return false for a plain Error object', () => {
      const error = new Error('Plain error');
      expect(isWebSocketError(error)).toBe(false);
    });

    it('should return false if statusCode is missing', () => {
      const error = Object.assign(new Error(), {
        code: 'BAD_REQUEST',
        context: {},
      });
      expect(isWebSocketError(error)).toBe(false);
    });

    it('should return false if code is not a string', () => {
      const error = Object.assign(new Error(), {
        statusCode: 400,
        code: 123,
        context: {},
      });
      expect(isWebSocketError(error)).toBe(false);
    });

    it('should return false if context is missing', () => {
      const error = Object.assign(new Error(), {
        statusCode: 400,
        code: 'BAD_REQUEST',
      });
      expect(isWebSocketError(error)).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isWebSocketError(null)).toBe(false);
      expect(isWebSocketError(undefined)).toBe(false);
    });
  });

  describe('extractWebSocketErrorInfo', () => {
    it('should extract information from a valid WebSocketError', () => {
      const error: WebSocketError = {
        name: 'Error',
        message: 'Detailed error message',
        statusCode: 403,
        code: 'AUTHORIZATION_ERROR',
        context: { connectionId: 'conn-789' },
      };
      (extractErrorMessage as Mock).mockReturnValue('Detailed error message');

      const result = extractWebSocketErrorInfo(error);

      expect(result).toEqual({
        statusCode: 403,
        code: 'AUTHORIZATION_ERROR',
        message: 'Detailed error message',
        context: { connectionId: 'conn-789' },
      });
    });

    it('should provide fallbacks for missing statusCode and code', () => {
      const malformedError = {
        name: 'Error',
        message: 'An incomplete error',
      } as WebSocketError; // Cast to test fallback logic
      (extractErrorMessage as Mock).mockReturnValue('An incomplete error');

      const result = extractWebSocketErrorInfo(malformedError);

      expect(result).toEqual({
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An incomplete error',
        context: undefined,
      });
    });

    it('should extract message using extractErrorMessage', () => {
      const error: WebSocketError = {
        name: 'Error',
        message: 'Original message',
        statusCode: 400,
        code: 'BAD_REQUEST',
      };
      (extractErrorMessage as Mock).mockReturnValue('Extracted message');

      const result = extractWebSocketErrorInfo(error);
      expect(result.message).toBe('Extracted message');
      expect(extractErrorMessage).toHaveBeenCalledWith(error);
    });
  });
});
