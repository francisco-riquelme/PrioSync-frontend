# Middleware System

Universal composable middleware chains for AWS Lambda with REST, WebSocket, and GraphQL support. Express-style middleware functionality with type safety and context preservation.

## Core Features

- **Universal Chain**: Generic middleware implementation for any AWS service
- **Type Safety**: Full TypeScript support with generic input/output preservation
- **Error Enhancement**: Automatic error context with middleware chain information
- **REST APIs**: Complete REST API middleware with validation and error handling
- **WebSocket Support**: WebSocket-specific middleware with connection management
- **GraphQL Integration**: GraphQL resolver middleware with error handling
- **Validation**: Yup-based validation with built-in patterns
- **Sanitization**: Sensitive data protection across all middleware types

## Architecture

The middleware system is organized into specialized modules:

- **Core MiddlewareChain**: Generic middleware implementation for any AWS service
- **REST Middleware**: API Gateway REST APIs with HTTP-specific handling
- **WebSocket Middleware**: API Gateway WebSocket APIs with real-time connection management
- **GraphQL Middleware**: GraphQL resolvers with schema-aware error handling
- **Utils**: Validation patterns and sanitization utilities shared across all middleware types

## Core Middleware Chain

### Execution Model

Middleware follows the "onion model" pattern where each middleware wraps the next one in the chain. Middleware executes in the order they were added, with each middleware receiving the input and a `next` function to continue to the next middleware or final handler.

### Error Enhancement

The middleware chain automatically enhances errors with contextual information including the middleware name, execution index, total middleware count, and the complete middleware chain. This provides comprehensive debugging information while preserving the original error context.

### Lambda Integration

The core system provides Lambda handler wrapping functionality that transforms standard AWS Lambda handlers to work with the middleware chain pattern. The wrapper handles the conversion between Lambda's event/context pattern and the middleware's input/output pattern.

## REST Middleware

**Purpose**: Complete REST API middleware system for AWS API Gateway with Amplify Data integration and HTTP-specific error handling.

### Core Components

#### RestMiddlewareChain

Factory for REST middleware chains with type-safe composition and HTTP-specific event handling. Provides generic type preservation across the middleware stack and specialized REST handler wrapping.

#### RestModelInitializer

Handles lazy Amplify Data model initialization with caching and REST-aware error wrapping. Converts Amplify errors to appropriate HTTP status codes (404, 400, 409, 500) and provides concurrent request protection with timeout handling. Supports multi-tenant scenarios via client key isolation.

#### RestRequestValidator

Provides Yup schema validation for request components (body, query, path, headers) with type-safe data access via component-specific getters. Uses symbol-based storage to prevent tampering and offers configurable error handling with field stripping capabilities.

#### RestRequestLogger

Handles request/response cycle logging with HTTP metadata extraction including method, path, and resource information with timing data. Provides configurable field exclusion for security and query/path parameter logging with sanitization.

#### RestErrorHandler

Centralized REST error conversion to HTTP responses with status code mapping and context preservation. Captures stack traces and middleware execution information while integrating with structured error logging.

### Error System

The REST middleware includes a comprehensive error system with predefined error codes that map to HTTP status codes. Error utilities provide convenient methods for throwing common HTTP errors with automatic status code assignment and context preservation.

### Single Endpoint Pattern

The REST middleware is optimized for AWS API Gateway's single Lambda per resource pattern, where each Lambda function handles one HTTP method for a specific resource endpoint. This pattern works perfectly with CDK REST API deployment strategies.

## WebSocket Middleware

**Purpose**: WebSocket-specific middleware for AWS API Gateway WebSocket APIs with real-time connection management and message processing.

### Core Components

#### WebSocketMiddlewareChain

Factory for WebSocket middleware chains with type-safe composition and automatic validation. Includes IAM policy generation utilities for WebSocket authorizers with both allow and deny policy creation.

#### WebSocketModelInitializer

Provides lazy Amplify Data model initialization with caching and concurrent request protection via promise sharing. Includes timeout protection and error recovery mechanisms with multi-tenant support via client key isolation.

#### WebSocketRequestValidator

Handles Yup schema validation specifically for MESSAGE events with route-specific validation filtering. Provides type-safe data access and configurable error handling with field stripping capabilities.

#### WebSocketRequestLogger

Manages request/response cycle logging with timing and connection metadata extraction. Includes configurable field exclusion for security and object depth limiting with JSON safety features.

#### WebSocketErrorHandler

Centralized WebSocket error conversion with context preservation and stack trace capture. Provides middleware execution trace information and structured error logging integration.

### Connection Management

The WebSocket middleware handles the complete connection lifecycle including connect, disconnect, and message events. It provides utilities for route handling and connection state management with proper error handling for each event type.

### IAM Policy Generation

Includes utilities for generating IAM policies for WebSocket authorizers, supporting both allow and deny policies with proper resource ARN handling and principal identification.

## GraphQL Middleware

**Purpose**: GraphQL resolver middleware for AWS AppSync with Amplify Data integration and structured error handling.

### Core Components

#### GraphQLMiddlewareChain

Factory for GraphQL middleware chains with type-safe composition and GraphQL event handling. Provides generic type preservation across the middleware stack and specialized AppSync resolver wrapping.

#### GraphQLModelInitializer

Handles lazy Amplify Data model initialization with caching and GraphQL-aware error wrapping with context preservation. Provides concurrent request protection and timeout handling with multi-tenant support via client key isolation.

#### GraphQLRequestLogger

Manages resolver execution logging with GraphQL metadata extraction including field name, operation type, and argument information. Provides configurable field exclusion for security and identity/request context logging.

#### GraphQLErrorHandler

Centralized GraphQL error handling with structured responses and AppSync error format compliance. Maintains AppSync compatibility while providing structured error information through extensions with stack trace capture and middleware execution info.

### Error System

GraphQL errors maintain AppSync compatibility while providing structured error information through extensions. Error utilities provide context building, message extraction, and stack trace handling with event information extraction.

### Model Access

The GraphQL middleware provides type-safe model retrieval utilities including `getModelsFromInput`, `getModelFromInput`, `hasModel`, and `getAvailableModelNames` for safe model access patterns and availability checking.

### Resolver Integration

The GraphQL middleware wraps individual AppSync resolvers with consistent error handling and logging while preserving GraphQL resolver semantics. Supports argument extraction, event information parsing, and identity context handling.

## Validation Utils

**Purpose**: Universal validation patterns and data sanitization utilities shared across REST, WebSocket, and GraphQL middleware.

### Validation Patterns

Provides pre-built Yup schemas for common validation use cases including UUID validation, email format validation, pagination parameters, and ID path parameter validation. These patterns ensure consistency across different middleware types.

### Error Extraction

Converts Yup validation errors to structured error details with field-specific information, human-readable messages, and validation type details. This provides consistent error formatting across all middleware types.

### Data Sanitization

Automatic sensitive data redaction system that detects and removes passwords, tokens, secrets, keys, and authentication fields. Includes configurable field exclusion lists, depth limiting, and circular reference protection.

## Type System

The middleware system provides comprehensive TypeScript support with generic type preservation throughout the middleware chain. Input types can be augmented by middleware (adding models, validation results) while maintaining type safety.

### Input Augmentation

Middleware can progressively augment input types, starting with base event/context and adding models, validation results, and other context as the request flows through the chain.

### Type Safety

All middleware functions maintain strict type safety with generic input/output types that preserve type information through the entire chain execution.

## Performance Considerations

- **Initialization**: Model initialization takes 100-500ms on first request but is cached for subsequent requests
- **Validation**: Component-based validation allows selective processing to minimize overhead
- **Logging**: Configurable detail levels minimize production overhead
- **Error Handling**: Optimized error classification and response generation
- **Model Loading**: Lazy initialization with concurrent request protection prevents duplicate loading

## Security Features

- **Field Exclusion**: Automatic sensitive data protection in logs and responses
- **Stack Trace Protection**: Stack traces are logged but not exposed in production responses
- **Client Isolation**: Multi-tenant support via client key separation
- **JSON Safety**: Protection against malformed input with fallback parsing
- **Sanitization**: Automatic detection and redaction of sensitive field patterns

## Configuration

The middleware system supports environment-based configuration for logging levels, structured logging format, and behavior changes between development and production environments.

### Chain Configuration

Middleware chains accept configuration for debug logging, error handling, and environment-specific behavior. This allows fine-tuning of middleware behavior for different deployment scenarios.

## Usage Patterns

### Single Endpoint Pattern (REST)

Optimized for CDK REST API deployment where each Lambda handles one resource endpoint with one HTTP method.

### Event-Driven Pattern (WebSocket)

Handles multiple WebSocket routes ($connect, $disconnect, custom routes) in a single function with route-based processing.

### Resolver Pattern (GraphQL)

Wraps individual GraphQL resolvers with consistent error handling and logging while preserving GraphQL resolver semantics.

## Exports

The middleware system provides comprehensive exports for all middleware types with namespaced exports to prevent naming conflicts. REST and WebSocket exports are prefixed to distinguish between similar functionality across different middleware types.

### Core Exports

- MiddlewareChain and related types
- Lambda handler wrapping utilities
- Generic middleware interfaces

### REST Exports

- REST-specific middleware factories and utilities
- REST error handling and validation utilities
- REST type definitions with HTTP-specific interfaces

### WebSocket Exports

- WebSocket-specific middleware factories and utilities
- Connection management and IAM policy utilities
- WebSocket type definitions with real-time interfaces

### GraphQL Exports

- GraphQL resolver middleware and error handling
- GraphQL-specific type definitions

### Utility Exports

- Validation patterns and error extraction utilities
- Sanitization functions and configuration types
