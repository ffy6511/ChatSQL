import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import {
  BailianAIRequest,
  BailianAIResponse,
  BailianAIError,
  BailianAIAPIError,
  ErrorType,
  HTTPStatus,
  DEFAULT_BAILIAN_CONFIG,
  DEFAULT_RETRY_CONFIG,
} from '@/types/chatbot/bailianai';
import {
  SchemaGeneratorRequest,
  SchemaGeneratorResponse,
  AGENT_CONFIG,
} from '@/types/agents';

/**
 * 解析智能体响应中的元数据
 */
function parseMetadata(text: string): { cleanText: string; metadata?: any } {
  try {
    // 尝试从响应文本中提取JSON格式的元数据
    const metadataRegex = /```json\s*(\{[\s\S]*?\})\s*```/;
    const match = text.match(metadataRegex);

    if (match) {
      const metadata = JSON.parse(match[1]);
      const cleanText = text.replace(metadataRegex, '').trim();
      return { cleanText, metadata };
    }

    return { cleanText: text };
  } catch (error) {
    console.warn('Failed to parse metadata from response:', error);
    return { cleanText: text };
  }
}

/**
 * 创建Schema-generator智能体请求
 */
function createSchemaGeneratorRequest(
  naturalLanguageQuery: string,
  sessionId?: string,
  parameters?: any
): BailianAIRequest {
  const request: BailianAIRequest = {
    input: {
      prompt: naturalLanguageQuery,
    },
    parameters: {
      incremental_output: parameters?.stream ? true : false,
      ...parameters,
    },
    debug: {},
  };

  if (sessionId) {
    request.input.session_id = sessionId;
  }

  // 设置用户提示词参数
  request.input.biz_params = {
    user_prompt_params: {
      [AGENT_CONFIG.SCHEMA_GENERATOR.INPUT_PARAM]: naturalLanguageQuery,
    },
  };

  return request;
}

/**
 * 处理API错误
 */
function handleAPIError(error: any): BailianAIAPIError {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const data = error.response?.data as BailianAIError;

    switch (status) {
      case HTTPStatus.UNAUTHORIZED:
        return new BailianAIAPIError(
          'API密钥无效或已过期',
          ErrorType.AUTHENTICATION_ERROR,
          data?.code,
          data?.request_id,
          status
        );
      case HTTPStatus.TOO_MANY_REQUESTS:
        return new BailianAIAPIError(
          '请求频率过高，请稍后重试',
          ErrorType.RATE_LIMIT_ERROR,
          data?.code,
          data?.request_id,
          status
        );
      case HTTPStatus.BAD_REQUEST:
        return new BailianAIAPIError(
          data?.message || '请求参数错误',
          ErrorType.VALIDATION_ERROR,
          data?.code,
          data?.request_id,
          status
        );
      default:
        return new BailianAIAPIError(
          data?.message || error.message || '网络请求失败',
          ErrorType.NETWORK_ERROR,
          data?.code,
          data?.request_id,
          status
        );
    }
  }

  return new BailianAIAPIError(
    error.message || '未知错误',
    ErrorType.UNKNOWN_ERROR
  );
}

/**
 * 实现指数退避重试
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = DEFAULT_RETRY_CONFIG.maxRetries
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // 如果是最后一次尝试，直接抛出错误
      if (attempt === maxRetries) {
        throw lastError;
      }

      // 对于某些错误类型，不进行重试
      if (error instanceof BailianAIAPIError) {
        if (error.type === ErrorType.AUTHENTICATION_ERROR ||
            error.type === ErrorType.VALIDATION_ERROR) {
          throw error;
        }
      }

      // 计算延迟时间（指数退避）
      const delay = Math.min(
        DEFAULT_RETRY_CONFIG.baseDelay * Math.pow(DEFAULT_RETRY_CONFIG.backoffFactor, attempt),
        DEFAULT_RETRY_CONFIG.maxDelay
      );

      console.warn(`Schema-generator API调用失败，${delay}ms后进行第${attempt + 1}次重试:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * 调用百炼平台API
 */
async function callBailianAPI(
  request: BailianAIRequest
): Promise<BailianAIResponse> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const appId = AGENT_CONFIG.SCHEMA_GENERATOR.APP_ID;

  if (!apiKey) {
    throw new BailianAIAPIError(
      'API密钥未配置，请检查环境变量DASHSCOPE_API_KEY',
      ErrorType.AUTHENTICATION_ERROR
    );
  }

  const url = `${DEFAULT_BAILIAN_CONFIG.baseUrl}/${appId}/completion`;

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };

  return retryWithBackoff(async () => {
    const response = await axios.post(url, request, {
      headers,
      timeout: DEFAULT_BAILIAN_CONFIG.timeout,
      responseType: 'json',
    });

    return response.data;
  });
}

/**
 * POST /api/Schema-generator - 处理Schema生成请求
 */
export async function POST(request: NextRequest) {
  try {
    const body: SchemaGeneratorRequest = await request.json();

    const { natural_language_query, sessionId, parameters } = body;

    if (!natural_language_query || typeof natural_language_query !== 'string') {
      console.log('错误: 自然语言查询内容无效:', natural_language_query);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: '自然语言查询内容不能为空',
          },
        } as SchemaGeneratorResponse,
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    console.log('创建Schema-generator请求参数:', { natural_language_query, sessionId, parameters });

    const bailianRequest = createSchemaGeneratorRequest(
      natural_language_query,
      sessionId,
      parameters
    );

    // Schema-generator不支持流式响应
    const response = await callBailianAPI(bailianRequest) as BailianAIResponse;
    const { cleanText, metadata } = parseMetadata(response.output.text);

    const schemaResponse: SchemaGeneratorResponse = {
      success: true,
      data: {
        result: cleanText,
        sessionId: response.output.session_id,
        metadata: {
          module: 'coding',
          topic: 'schema-generation',
          action: {
            type: 'update',
            target: 'schema-editor',
            params: { ddl: cleanText },
          },
          ...metadata,
        },
      },
      usage: response.usage ? {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };

    return NextResponse.json(schemaResponse);
  } catch (error) {
    console.error('Schema-generator API error:', error);

    const apiError = handleAPIError(error);
    const errorResponse: SchemaGeneratorResponse = {
      success: false,
      error: {
        code: apiError.code || apiError.type,
        message: apiError.message,
      },
    };

    const statusCode = apiError.statusCode || HTTPStatus.INTERNAL_SERVER_ERROR;
    return NextResponse.json(errorResponse, { status: statusCode });
  }
}