import { logger } from '../../log';
import type { AmplifyModelType, QueryFactoryResult } from '../../queries/types';

/**
 * Shared middleware utilities for REST, WebSocket, and GraphQL.
 * Centralizes common helpers and generic types to reduce duplication.
 */

export type ModelsResult<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string,
> = { [K in TSelected]: QueryFactoryResult<K, TTypes> };

export interface MinimalLambdaContext {
  awsRequestId?: string;
  functionName?: string;
  functionVersion?: string;
}

export interface InputWithModels<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string,
  TEvent,
  TCtx extends MinimalLambdaContext,
> {
  event: TEvent;
  context: TCtx;
  models?: ModelsResult<TTypes, TSelected>;
}

export function ensureStructuredLogging(): void {
  if (!logger.isStructuredLoggingEnabled()) {
    logger.setStructuredLogging(true);
  }
}

export function setupStructuredLoggingWith<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string,
  TEvent,
  TCtx extends MinimalLambdaContext,
>(
  input: InputWithModels<TTypes, TSelected, TEvent, TCtx>,
  buildContext: (
    input: InputWithModels<TTypes, TSelected, TEvent, TCtx>,
    extra?: Record<string, unknown>,
  ) => Record<string, unknown>,
  forceStructuredLogging: boolean = true,
  defaultContext: Record<string, unknown> = {},
): void {
  if (forceStructuredLogging) ensureStructuredLogging();
  logger.setContext(buildContext(input, defaultContext));
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function getErrorStack(error: unknown): string | undefined {
  return error instanceof Error ? error.stack : undefined;
}

export function parseJsonBody(
  body: string | undefined,
  context: Record<string, unknown>,
  scope: 'REST' | 'WebSocket' | string = 'REST',
): unknown {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch (error) {
    logger.warn(`Failed to parse ${scope} body`, {
      ...context,
      bodyLength: body.length,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

export function buildErrorContextWith<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string,
  TEvent,
  TCtx extends MinimalLambdaContext,
>(
  input: InputWithModels<TTypes, TSelected, TEvent, TCtx>,
  buildContext: (
    input: InputWithModels<TTypes, TSelected, TEvent, TCtx>,
    extra?: Record<string, unknown>,
  ) => Record<string, unknown>,
  error: { code?: string; statusCode?: number } | null,
  additionalContext: Record<string, unknown> = {},
): Record<string, unknown> {
  const base = buildContext(input, additionalContext);
  return error
    ? { ...base, errorCode: error.code, statusCode: error.statusCode }
    : base;
}

export function getModelsFromInput<
  TTypes extends Record<string, AmplifyModelType>,
  TSelected extends keyof TTypes & string,
  TEvent,
  TCtx extends MinimalLambdaContext,
>(
  input: InputWithModels<TTypes, TSelected, TEvent, TCtx>,
  missingMessage: string,
): ModelsResult<TTypes, TSelected> {
  if (!input.models) {
    throw new Error(missingMessage);
  }
  return input.models;
}
