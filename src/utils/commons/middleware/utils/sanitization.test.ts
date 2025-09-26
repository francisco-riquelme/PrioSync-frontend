import { describe, it, expect } from 'vitest';
import { sanitizeObject, type SanitizationConfig } from './sanitization';

describe('Sanitization Utility', () => {
  describe('sanitizeObject', () => {
    describe('primitive values', () => {
      it('should return primitive values unchanged', () => {
        expect(sanitizeObject('test string')).toBe('test string');
        expect(sanitizeObject(123)).toBe(123);
        expect(sanitizeObject(true)).toBe(true);
        expect(sanitizeObject(false)).toBe(false);
      });

      it('should handle null and undefined', () => {
        expect(sanitizeObject(null)).toBe(null);
        expect(sanitizeObject(undefined)).toBe(undefined);
      });
    });

    describe('sensitive field detection', () => {
      it('should redact password fields', () => {
        const input = {
          username: 'testuser',
          password: 'secret123',
          email: 'test@example.com',
        };
        const expected = {
          username: 'testuser',
          password: '[REDACTED]',
          email: 'test@example.com',
        };
        expect(sanitizeObject(input)).toEqual(expected);
      });

      it('should redact token fields', () => {
        const input = {
          accessToken: 'abc123',
          refreshToken: 'def456',
          userToken: 'ghi789',
        };
        const expected = {
          accessToken: '[REDACTED]',
          refreshToken: '[REDACTED]',
          userToken: '[REDACTED]',
        };
        expect(sanitizeObject(input)).toEqual(expected);
      });

      it('should redact secret fields', () => {
        const input = {
          apiSecret: 'secret123',
          clientSecret: 'secret456',
          secretKey: 'secret789',
        };
        const expected = {
          apiSecret: '[REDACTED]',
          clientSecret: '[REDACTED]',
          secretKey: '[REDACTED]',
        };
        expect(sanitizeObject(input)).toEqual(expected);
      });

      it('should redact key fields', () => {
        const input = {
          apiKey: 'key123',
          privateKey: 'key456',
          encryptionKey: 'key789',
        };
        const expected = {
          apiKey: '[REDACTED]',
          privateKey: '[REDACTED]',
          encryptionKey: '[REDACTED]',
        };
        expect(sanitizeObject(input)).toEqual(expected);
      });

      it('should redact auth fields', () => {
        const input = {
          authorization: 'Bearer token123',
          authHeader: 'Basic dXNlcjpwYXNz',
          authToken: 'token456',
        };
        const expected = {
          authorization: '[REDACTED]',
          authHeader: '[REDACTED]',
          authToken: '[REDACTED]',
        };
        expect(sanitizeObject(input)).toEqual(expected);
      });

      it('should handle case-insensitive field detection', () => {
        const input = {
          PASSWORD: 'secret123',
          AccessToken: 'token123',
          API_SECRET: 'secret456',
          private_key: 'key123',
          Authorization: 'Bearer token',
        };
        const expected = {
          PASSWORD: '[REDACTED]',
          AccessToken: '[REDACTED]',
          API_SECRET: '[REDACTED]',
          private_key: '[REDACTED]',
          Authorization: '[REDACTED]',
        };
        expect(sanitizeObject(input)).toEqual(expected);
      });
    });

    describe('excludeFields configuration', () => {
      it('should redact explicitly excluded fields', () => {
        const input = {
          username: 'testuser',
          email: 'test@example.com',
          phone: '123-456-7890',
        };
        const config: SanitizationConfig = {
          excludeFields: ['email', 'phone'],
        };
        const expected = {
          username: 'testuser',
          email: '[REDACTED]',
          phone: '[REDACTED]',
        };
        expect(sanitizeObject(input, config)).toEqual(expected);
      });

      it('should combine excludeFields with sensitive field detection', () => {
        const input = {
          username: 'testuser',
          password: 'secret123',
          email: 'test@example.com',
          phone: '123-456-7890',
        };
        const config: SanitizationConfig = {
          excludeFields: ['email'],
        };
        const expected = {
          username: 'testuser',
          password: '[REDACTED]',
          email: '[REDACTED]',
          phone: '123-456-7890',
        };
        expect(sanitizeObject(input, config)).toEqual(expected);
      });
    });

    describe('maxDepth configuration', () => {
      it('should respect maxDepth limit', () => {
        const input = {
          level1: {
            level2: {
              level3: {
                level4: 'too deep',
              },
            },
          },
        };
        const config: SanitizationConfig = {
          maxDepth: 2,
        };
        const expected = {
          level1: {
            level2: '[Object: max depth reached]',
          },
        };
        expect(sanitizeObject(input, config)).toEqual(expected);
      });

      it('should use default maxDepth of 3', () => {
        const input = {
          level1: {
            level2: {
              level3: {
                level4: 'too deep',
              },
            },
          },
        };
        const expected = {
          level1: {
            level2: {
              level3: '[Object: max depth reached]',
            },
          },
        };
        expect(sanitizeObject(input)).toEqual(expected);
      });

      it('should handle maxDepth of 0', () => {
        const input = {
          level1: {
            level2: 'nested',
          },
        };
        const config: SanitizationConfig = {
          maxDepth: 0,
        };
        const expected = '[Object: max depth reached]';
        expect(sanitizeObject(input, config)).toBe(expected);
      });
    });

    describe('array handling', () => {
      it('should sanitize array elements', () => {
        const input = [
          { username: 'user1', password: 'pass1' },
          { username: 'user2', password: 'pass2' },
        ];
        const expected = [
          { username: 'user1', password: '[REDACTED]' },
          { username: 'user2', password: '[REDACTED]' },
        ];
        expect(sanitizeObject(input)).toEqual(expected);
      });

      it('should handle nested arrays with depth limits', () => {
        const input = {
          users: [
            {
              profile: {
                details: {
                  secret: 'hidden',
                },
              },
            },
          ],
        };
        const config: SanitizationConfig = {
          maxDepth: 2,
        };
        const expected = {
          users: ['[Object: max depth reached]'],
        };
        expect(sanitizeObject(input, config)).toEqual(expected);
      });

      it('should handle mixed array content', () => {
        const input = ['string', 123, { password: 'secret' }, [1, 2, 3]];
        const expected = ['string', 123, { password: '[REDACTED]' }, [1, 2, 3]];
        expect(sanitizeObject(input)).toEqual(expected);
      });
    });

    describe('complex nested structures', () => {
      it('should handle deeply nested objects with sensitive data', () => {
        const input = {
          user: {
            profile: {
              personal: {
                email: 'test@example.com',
                password: 'secret123',
              },
              preferences: {
                theme: 'dark',
              },
            },
            tokens: {
              access: 'token123',
              refresh: 'token456',
            },
          },
        };
        const expected = {
          user: {
            profile: {
              personal: '[Object: max depth reached]',
              preferences: '[Object: max depth reached]',
            },
            tokens: '[REDACTED]',
          },
        };
        expect(sanitizeObject(input)).toEqual(expected);
      });

      it('should handle objects with non-sensitive nested fields', () => {
        const input = {
          request: {
            headers: {
              'content-type': 'application/json',
              authorization: 'Bearer token123',
            },
            body: {
              data: {
                name: 'John Doe',
                age: 30,
              },
            },
          },
        };
        const expected = {
          request: {
            headers: {
              'content-type': '[Object: max depth reached]',
              authorization: '[REDACTED]',
            },
            body: {
              data: '[Object: max depth reached]',
            },
          },
        };
        expect(sanitizeObject(input)).toEqual(expected);
      });
    });

    describe('edge cases', () => {
      it('should handle empty objects', () => {
        expect(sanitizeObject({})).toEqual({});
      });

      it('should handle empty arrays', () => {
        expect(sanitizeObject([])).toEqual([]);
      });

      it('should handle objects with only sensitive fields', () => {
        const input = {
          password: 'secret123',
          token: 'abc123',
        };
        const expected = {
          password: '[REDACTED]',
          token: '[REDACTED]',
        };
        expect(sanitizeObject(input)).toEqual(expected);
      });

      it('should handle objects with only excluded fields', () => {
        const input = {
          email: 'test@example.com',
          phone: '123-456-7890',
        };
        const config: SanitizationConfig = {
          excludeFields: ['email', 'phone'],
        };
        const expected = {
          email: '[REDACTED]',
          phone: '[REDACTED]',
        };
        expect(sanitizeObject(input, config)).toEqual(expected);
      });

      it('should handle unknown types', () => {
        const input = {
          func: () => 'test',
          symbol: Symbol('test'),
        };
        const expected = {
          func: '[Unknown type]',
          symbol: '[Unknown type]',
        };
        expect(sanitizeObject(input)).toEqual(expected);
      });
    });

    describe('configuration combinations', () => {
      it('should handle all configuration options together', () => {
        const input = {
          user: {
            profile: {
              email: 'test@example.com',
              password: 'secret123',
              phone: '123-456-7890',
              details: {
                address: {
                  street: '123 Main St',
                  city: 'Anytown',
                },
              },
            },
          },
        };
        const config: SanitizationConfig = {
          excludeFields: ['phone'],
          maxDepth: 2,
        };
        const expected = {
          user: {
            profile: '[Object: max depth reached]',
          },
        };
        expect(sanitizeObject(input, config)).toEqual(expected);
      });
    });
  });
});
