import type { Context } from 'aws-lambda';
import {
  setupStructuredLoggingWith,
  getErrorMessage as sharedGetErrorMessage,
  getErrorStack as sharedGetErrorStack,
  parseJsonBody as sharedParseJsonBody,
  buildErrorContextWith,
  getModelsFromInput as sharedGetModelsFromInput,
} from '../utils/common';
import type { WebSocketInputWithModels, WebSocketEvent } from './types';
import type { AmplifyModelType, QueryFactoryResult } from '../../queries/types';
import type { InputWithModels } from '../utils/common';

/**
 * Build standardized log context for WebSocket operations
 */
export function buildWebSocketContext<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
  TSelected extends string = string,
>(
  input: WebSocketInputWithModels<TTypes, TSelected>,
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  const { event, context } = input;
  const requestContext = (
    event as unknown as {
      requestContext?: Record<string, unknown>;
    }
  ).requestContext;

  return {
    ...additionalContext,
    connectionId: (requestContext as { connectionId?: string })?.connectionId,
    eventType: (requestContext as { eventType?: string })?.eventType,
    messageId: (requestContext as { messageId?: string })?.messageId,
    // Add null checks to prevent undefined values from being logged
    requestId: context?.awsRequestId || undefined,
    functionName: context?.functionName || undefined,
    functionVersion: context?.functionVersion || undefined,
  };
}

/**
 * Extract basic event information for logging
 */
export function extractEventInfo(
  event: WebSocketEvent,
): Record<string, unknown> {
  const anyEvent = event as unknown as {
    requestContext?: {
      connectionId?: string;
      routeKey?: string;
      eventType?: string;
      messageId?: string;
    };
    routeKey?: string;
    rawQueryString?: string;
    body?: string;
  };

  return {
    connectionId: anyEvent.requestContext?.connectionId ?? '',
    // routeKey may be in requestContext (WS) or top-level (authorizer V2)
    routeKey: anyEvent.requestContext?.routeKey ?? anyEvent.routeKey,
    eventType: anyEvent.requestContext?.eventType,
    messageId: anyEvent.requestContext?.messageId,
    hasBody: !!anyEvent.body,
    bodyLength: anyEvent.body?.length || 0,
    rawQueryString: anyEvent.rawQueryString,
  };
}

/**
 * Safely parse JSON body with error handling
 */
export function parseJsonBody(
  body: string | undefined,
  context: Record<string, unknown>,
): unknown {
  return sharedParseJsonBody(body, context, 'WebSocket');
}

/**
 * Setup structured logging for WebSocket middleware
 */
export function setupStructuredLogging<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
>(
  input: WebSocketInputWithModels<TTypes>,
  forceStructuredLogging: boolean = true,
  defaultContext: Record<string, unknown> = {},
): void {
  type TSelected = keyof TTypes & string;
  const typedInput = input as unknown as InputWithModels<
    TTypes,
    TSelected,
    WebSocketEvent,
    Context
  >;
  const buildContext = (
    i: InputWithModels<TTypes, TSelected, WebSocketEvent, Context>,
    extra?: Record<string, unknown>,
  ) =>
    buildWebSocketContext(
      i as unknown as WebSocketInputWithModels<TTypes, TSelected>,
      extra,
    );

  setupStructuredLoggingWith<TTypes, TSelected, WebSocketEvent, Context>(
    typedInput,
    buildContext,
    forceStructuredLogging,
    defaultContext,
  );
}

export function isMessageEvent(event: WebSocketEvent): boolean {
  const rc = (event as { requestContext?: { eventType?: string } })
    .requestContext;
  return rc?.eventType === 'MESSAGE';
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
 * Build error context with WebSocket information
 */
export function buildErrorContext<
  TTypes extends Record<string, AmplifyModelType> = Record<
    string,
    AmplifyModelType
  >,
>(
  input: WebSocketInputWithModels<TTypes>,
  error: { code?: string; statusCode?: number } | null,
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  type TSelected = keyof TTypes & string;
  const typedInput = input as unknown as InputWithModels<
    TTypes,
    TSelected,
    WebSocketEvent,
    Context
  >;
  const buildContext = (
    i: InputWithModels<TTypes, TSelected, WebSocketEvent, Context>,
    extra?: Record<string, unknown>,
  ) =>
    buildWebSocketContext(
      i as unknown as WebSocketInputWithModels<TTypes, TSelected>,
      extra,
    );

  return buildErrorContextWith<TTypes, TSelected, WebSocketEvent, Context>(
    typedInput,
    buildContext,
    error,
    additionalContext,
  );
}

export function getConnectionId(event: WebSocketEvent): string {
  const rc = (
    event as unknown as { requestContext?: { connectionId?: string } }
  ).requestContext;
  return rc?.connectionId ?? '';
}

export function getModelsFromInput<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string = keyof TTypes & string,
>(
  input: WebSocketInputWithModels<TTypes, TSelected>,
): {
  [K in TSelected]: QueryFactoryResult<K, TTypes>;
} {
  type TSel = TSelected;
  const typedInput = input as unknown as InputWithModels<
    TTypes,
    TSel,
    WebSocketEvent,
    Context
  >;

  return sharedGetModelsFromInput<TTypes, TSel, WebSocketEvent, Context>(
    typedInput,
    'Models not available. Ensure WebSocketModelInitializer middleware is used before this handler.',
  ) as unknown as {
    [K in TSelected]: QueryFactoryResult<K, TTypes>;
  };
}
