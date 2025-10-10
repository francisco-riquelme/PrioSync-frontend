import type { Context } from 'aws-lambda';
import {
  setupStructuredLoggingWith,
  getErrorMessage as sharedGetErrorMessage,
  getErrorStack as sharedGetErrorStack,
  parseJsonBody as sharedParseJsonBody,
  buildErrorContextWith,
  getModelsFromInput as sharedGetModelsFromInput,
} from '../utils/common';
import type { RestInputWithModels, RestEvent } from './types';
import type { AmplifyModelType, QueryFactoryResult } from '../../queries/types';
import type { InputWithModels } from '../utils/common';
import type { RestResponse } from './types';

/**
 * Build standardized log context for REST operations
 */
export function buildRestContext<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  input: RestInputWithModels<TTypes, TSelected>,
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  const { event, context } = input;

  return {
    ...additionalContext,
    method: event.httpMethod || 'UNKNOWN',
    path: event.path || 'UNKNOWN',
    resource: event.resource || 'UNKNOWN',
    // Add null checks to prevent undefined values from being logged
    requestId: context?.awsRequestId || undefined,
    functionName: context?.functionName || undefined,
    functionVersion: context?.functionVersion || undefined,
    stage: event.requestContext?.stage,
    sourceIp: event.requestContext?.identity?.sourceIp,
  };
}

/**
 * Extract basic event information for logging
 */
export function extractEventInfo(event: RestEvent): Record<string, unknown> {
  return {
    method: event.httpMethod || 'UNKNOWN',
    path: event.path || 'UNKNOWN',
    resource: event.resource || 'UNKNOWN',
    stage: event.requestContext?.stage,
    hasBody: !!event.body,
    bodyLength: event.body?.length || 0,
    queryStringParameters: event.queryStringParameters,
    pathParameters: event.pathParameters,
  };
}

/**
 * Setup structured logging for REST middleware
 */
export function setupStructuredLogging<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  input: RestInputWithModels<TTypes, TSelected>,
  forceStructuredLogging: boolean = true,
  defaultContext: Record<string, unknown> = {},
): void {
  type TSel = TSelected & string;
  const typedInput = input as unknown as InputWithModels<
    TTypes,
    TSel,
    RestEvent,
    Context
  >;
  const buildContext = (
    i: InputWithModels<TTypes, TSel, RestEvent, Context>,
    extra?: Record<string, unknown>,
  ) =>
    buildRestContext(
      i as unknown as RestInputWithModels<TTypes, TSelected>,
      extra,
    );

  setupStructuredLoggingWith<TTypes, TSel, RestEvent, Context>(
    typedInput,
    buildContext,
    forceStructuredLogging,
    defaultContext,
  );
}

/**
 * Extract error message safely
 */
export function getErrorMessage(error: unknown): string {
  return sharedGetErrorMessage(error);
}

/**
 * Get error stack trace if available
 */
export function getErrorStack(error: unknown): string | undefined {
  return sharedGetErrorStack(error);
}

/**
 * Safely parses JSON body with error handling and logging
 */
export function parseJsonBody(
  body: string | undefined,
  context: Record<string, unknown>,
): unknown {
  return sharedParseJsonBody(body, context, 'REST');
}

/**
 * Extracts request ID from multiple possible sources
 */
export function getRequestId(
  event: RestEvent,
  context?: { awsRequestId?: string },
): string {
  return (
    context?.awsRequestId ||
    event.requestContext?.requestId ||
    `unknown-${Date.now()}`
  );
}

/**
 * Build error context with REST information
 */
export function buildErrorContext<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  input: RestInputWithModels<TTypes, TSelected>,
  error: { code?: string; statusCode?: number } | null,
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  type TSel = TSelected & string;
  const typedInput = input as unknown as InputWithModels<
    TTypes,
    TSel,
    RestEvent,
    Context
  >;
  const buildContext = (
    i: InputWithModels<TTypes, TSel, RestEvent, Context>,
    extra?: Record<string, unknown>,
  ) =>
    buildRestContext(
      i as unknown as RestInputWithModels<TTypes, TSelected>,
      extra,
    );

  return buildErrorContextWith<TTypes, TSel, RestEvent, Context>(
    typedInput,
    buildContext,
    error,
    additionalContext,
  );
}

export function getModelsFromInput<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes = keyof TTypes,
>(
  input: RestInputWithModels<TTypes, TSelected>,
): {
  [K in TSelected]: QueryFactoryResult<K & string, TTypes>;
} {
  type TSel = TSelected & string;
  const typedInput = input as unknown as InputWithModels<
    TTypes,
    TSel,
    RestEvent,
    Context
  >;

  return sharedGetModelsFromInput<TTypes, TSel, RestEvent, Context>(
    typedInput,
    'Models not available. Ensure RestModelInitializer middleware is used before this handler.',
  ) as unknown as {
    [K in TSelected]: QueryFactoryResult<K & string, TTypes>;
  };
}

export function createSuccessResponse(
  payload?: unknown,
  options: {
    statusCode?: number;
    headers?: Record<string, string>;
    isBase64Encoded?: boolean;
  } = {},
): RestResponse {
  const { statusCode = 200, headers = {}, isBase64Encoded = false } = options;

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const body = payload === undefined ? '' : JSON.stringify(payload);

  return {
    statusCode,
    headers: { ...baseHeaders, ...headers },
    body,
    isBase64Encoded,
  };
}

/**
 * Create a standard API Gateway error response
 */
export function createErrorResponse(
  message: string,
  options: {
    statusCode?: number;
    code?: string;
    details?: unknown;
    headers?: Record<string, string>;
    isBase64Encoded?: boolean;
  } = {},
): RestResponse {
  const {
    statusCode = 400,
    code,
    details,
    headers = {},
    isBase64Encoded = false,
  } = options;

  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const body = JSON.stringify({
    message,
    ...(code ? { code } : {}),
    ...(details !== undefined ? { details } : {}),
  });

  return {
    statusCode,
    headers: { ...baseHeaders, ...headers },
    body,
    isBase64Encoded,
  };
}
