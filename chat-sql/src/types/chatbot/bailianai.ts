// 百炼平台API相关类型定义

/**
 * 百炼平台API请求参数
 */
export interface BailianAIRequest {
  input: {
    prompt: string;
    session_id?: string;
    biz_params?: {
      user_prompt_params?: Record<string, string>;
    };
  };
  parameters?: {
    incremental_output?: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    top_k?: number;
  };
  debug?: Record<string, any>;
}

/**
 * 百炼平台API响应数据
 */
export interface BailianAIResponse {
  output: {
    text: string;
    session_id: string;
    finish_reason?: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
}

/**
 * 百炼平台流式响应数据块
 */
export interface BailianAIStreamChunk {
  id: string;
  event?: string;
  data: string;
}

/**
 * 解析后的流式数据
 */
export interface ParsedStreamData {
  output?: {
    text: string;
    session_id?: string;
    finish_reason?: string;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id?: string;
}

/**
 * 百炼平台错误响应
 */
export interface BailianAIError {
  code: string;
  message: string;
  request_id?: string;
}

/**
 * API配置参数
 */
export interface BailianAIConfig {
  apiKey: string;
  appId: string;
  baseUrl?: string;
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * 会话管理相关类型
 */
export interface SessionInfo {
  sessionId: string;
  createdAt: string;
  lastUsedAt: string;
  messageCount: number;
}

/**
 * 聊天请求参数
 */
export interface ChatRequest {
  message: string;
  sessionId?: string;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
  userPromptParams?: Record<string, string>;
}

/**
 * 聊天响应数据
 */
export interface ChatResponse {
  success: boolean;
  data?: {
    text: string;
    sessionId: string;
    metadata?: {
      module?: string;
      topic?: string;
      action?: {
        type: string;
        target: string;
        params?: Record<string, string>;
      };
    };
  };
  error?: {
    code: string;
    message: string;
  };
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * 流式聊天响应数据
 */
export interface StreamChatResponse {
  type: 'chunk' | 'done' | 'error';
  data?: {
    text: string;
    sessionId?: string;
    isComplete?: boolean;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * API调用选项
 */
export interface APICallOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

/**
 * 重试配置
 */
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

/**
 * 默认配置常量
 */
export const DEFAULT_BAILIAN_CONFIG: Partial<BailianAIConfig> = {
  baseUrl: 'https://dashscope.aliyuncs.com/api/v1/apps',
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
};

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

/**
 * HTTP状态码枚举
 */
export enum HTTPStatus {
  OK = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 自定义API错误类
 */
export class BailianAIAPIError extends Error {
  public readonly type: ErrorType;
  public readonly code?: string;
  public readonly requestId?: string;
  public readonly statusCode?: number;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    code?: string,
    requestId?: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'BailianAIAPIError';
    this.type = type;
    this.code = code;
    this.requestId = requestId;
    this.statusCode = statusCode;
  }
}
