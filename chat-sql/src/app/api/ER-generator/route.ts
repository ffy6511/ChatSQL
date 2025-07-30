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
  ERGeneratorRequest,
  ERGeneratorResponse,
  SchemaGeneratorResponse,
  AGENT_CONFIG,
} from '@/types/agents';
import { ERDiagramData } from '@/types/erDiagram';

/**
 * 解析智能体响应中的元数据和ER图数据
 */
function parseERResponse(text: string): { cleanText: string; erData?: ERDiagramData; metadata?: any } {
  try {
    // 尝试从响应文本中提取JSON格式的ER图数据
    const erDataRegex = /```json\s*(\{[\s\S]*?"entities"[\s\S]*?\})\s*```/;
    const metadataRegex = /```metadata\s*(\{[\s\S]*?\})\s*```/;
    
    const erMatch = text.match(erDataRegex);
    const metadataMatch = text.match(metadataRegex);
    
    let cleanText = text;
    let erData: ERDiagramData | undefined;
    let metadata: any | undefined;
    
    if (erMatch) {
      try {
        erData = JSON.parse(erMatch[1]) as ERDiagramData;
        cleanText = cleanText.replace(erDataRegex, '').trim();
      } catch (parseError) {
        console.warn('Failed to parse ER data from response:', parseError);
      }
    }
    
    if (metadataMatch) {
      try {
        metadata = JSON.parse(metadataMatch[1]);
        cleanText = cleanText.replace(metadataRegex, '').trim();
      } catch (parseError) {
        console.warn('Failed to parse metadata from response:', parseError);
      }
    }
    
    // 如果没有找到专门的ER数据，尝试解析整个响应为JSON
    if (!erData) {
      try {
        const possibleERData = JSON.parse(cleanText);
        if (possibleERData.entities && Array.isArray(possibleERData.entities)) {
          erData = possibleERData as ERDiagramData;
          cleanText = ''; // 如果整个响应都是ER数据，则清空文本
        }
      } catch (parseError) {
        // 不是JSON格式，保持原文本
      }
    }
    
    return { cleanText, erData, metadata };
  } catch (error) {
    console.warn('Failed to parse ER response:', error);
    return { cleanText: text };
  }
}

/**
 * 创建ER-generator智能体请求
 */
function createERGeneratorRequest(
  naturalLanguageQuery: string,
  providedSchema: string,
  sessionId?: string,
  parameters?: any
): BailianAIRequest {
  const request: BailianAIRequest = {
    input: {
      prompt: `自然语言查询: ${naturalLanguageQuery}\n\n提供的Schema: ${providedSchema}`,
      biz_params: {
        natural_language_query: naturalLanguageQuery,
        provided_schema: providedSchema,
      },
    },
    parameters: parameters || {},
    debug: {},
  };

  if (sessionId) {
    request.input.session_id = sessionId;
  }

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
      
      console.warn(`ER-generator API调用失败，${delay}ms后进行第${attempt + 1}次重试:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * 调用Schema-generator API获取DDL语句
 */
async function callSchemaGeneratorAPI(
  naturalLanguageQuery: string,
  sessionId?: string,
  parameters?: any
): Promise<string> {
  try {
    console.log('调用Schema-generator API:', { naturalLanguageQuery, sessionId });

    // 构建请求体，使用百炼AI标准格式
    const requestBody: any = {
      input: {
        prompt: "根据以下描述生成DDL",
        biz_params: {
          "natural_language_query": naturalLanguageQuery,
        },
      },
      parameters: parameters || {
        stream: false,
        temperature: 0.7,
        maxTokens: 2000,
      },
      debug: {},
    };

    if (sessionId) {
      requestBody.input.session_id = sessionId;
    }

    // 调用Schema-generator API
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/Schema-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Schema-generator API调用失败: ${response.status} ${response.statusText}`);
    }

    const data: SchemaGeneratorResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error?.message || 'Schema-generator API返回错误');
    }

    const ddlResult = data.data?.output?.result;
    if (!ddlResult) {
      throw new Error('Schema-generator API未返回有效的DDL语句');
    }

    console.log('Schema-generator API调用成功，生成的DDL:', ddlResult);
    return ddlResult;

  } catch (error) {
    console.error('调用Schema-generator API失败:', error);
    throw new BailianAIAPIError(
      `无法生成DDL语句: ${error instanceof Error ? error.message : '未知错误'}`,
      ErrorType.NETWORK_ERROR
    );
  }
}

/**
 * 调用百炼平台API
 */
async function callBailianAPI(
  request: BailianAIRequest
): Promise<BailianAIResponse> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const appId = AGENT_CONFIG.ER_GENERATOR.APP_ID;

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
 * POST /api/ER-generator - 处理ER图生成请求
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('接收到的请求体:', JSON.stringify(body, null, 2));

    // 支持两种格式：新格式（百炼AI标准）和旧格式（向后兼容）
    let natural_language_query: string;
    let provided_schema: string;
    let sessionId: string | undefined;
    let parameters: any;

    if (body.input && body.input.biz_params) {
      // 新格式：百炼AI标准格式
      natural_language_query = body.input.biz_params.natural_language_query;
      provided_schema = body.input.biz_params.provided_schema;
      sessionId = body.input.session_id;
      parameters = body.parameters;
    } else {
      // 旧格式：向后兼容
      natural_language_query = body.natural_language_query;
      provided_schema = body.provided_schema;
      sessionId = body.sessionId;
      parameters = body.parameters;
    }

    if (!natural_language_query || typeof natural_language_query !== 'string') {
      console.log('错误: 自然语言查询内容无效:', natural_language_query);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_QUERY',
            message: '自然语言查询内容不能为空',
          },
        } as ERGeneratorResponse,
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    // 修改逻辑：如果provided_schema为空，则调用Schema-generator获取DDL
    if (!provided_schema || typeof provided_schema !== 'string' || provided_schema.trim() === '') {
      console.log('provided_schema为空，将调用Schema-generator生成DDL');
      try {
        provided_schema = await callSchemaGeneratorAPI(
          natural_language_query,
          sessionId,
          parameters
        );
        console.log('成功从Schema-generator获取DDL:', provided_schema);
      } catch (error) {
        console.error('调用Schema-generator失败:', error);
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'SCHEMA_GENERATION_FAILED',
              message: error instanceof Error ? error.message : '生成DDL语句失败',
            },
          } as ERGeneratorResponse,
          { status: HTTPStatus.INTERNAL_SERVER_ERROR }
        );
      }
    }

    console.log('创建ER-generator请求参数:', { natural_language_query, provided_schema, sessionId, parameters });

    const bailianRequest = createERGeneratorRequest(
      natural_language_query,
      provided_schema,
      sessionId,
      parameters
    );

    // ER-generator不支持流式响应
    const response = await callBailianAPI(bailianRequest) as BailianAIResponse;
    const { cleanText, erData, metadata } = parseERResponse(response.output.text);

    const erResponse: ERGeneratorResponse = {
      success: true,
      data: {
        output: {
          erData: erData,
          description: cleanText,
          summary: cleanText,
          rawText: response.output.text,
          hasStructuredData: !!erData,
          outputType: erData ? 'multiple' : 'single',
        },
        sessionId: response.output.session_id,
        metadata: {
          module: 'ER',
          topic: 'er-generation',
          action: {
            type: 'visualize',
            target: '/er-diagram',
            params: { erData: erData },
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

    return NextResponse.json(erResponse);
  } catch (error) {
    console.error('ER-generator API error:', error);

    const apiError = handleAPIError(error);
    const errorResponse: ERGeneratorResponse = {
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
