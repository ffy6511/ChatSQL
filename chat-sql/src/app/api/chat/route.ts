import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import {
  BailianAIRequest,
  BailianAIResponse,
  BailianAIError,
  ChatRequest,
  ChatResponse,
  StreamChatResponse,
  BailianAIAPIError,
  ErrorType,
  HTTPStatus,
  DEFAULT_BAILIAN_CONFIG,
  DEFAULT_RETRY_CONFIG,
} from '@/types/chatbot/bailianai';

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
 * 创建百炼平台API请求
 */
function createBailianRequest(
  message: string,
  sessionId?: string,
  parameters?: any,
  userPromptParams?: Record<string, string>
): BailianAIRequest {
  const request: BailianAIRequest = {
    input: {
      prompt: message,
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

  if (userPromptParams && Object.keys(userPromptParams).length > 0) {
    request.input.biz_params = {
      user_prompt_params: userPromptParams,
    };
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
      
      console.warn(`API调用失败，${delay}ms后进行第${attempt + 1}次重试:`, error);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * 调用百炼平台API
 */
async function callBailianAPI(
  request: BailianAIRequest,
  stream: boolean = false
): Promise<BailianAIResponse | any> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  const appId = process.env.BAILIAN_APP_ID || '6533b3711b8143068af6b09b98a3323c';

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
    ...(stream && { 'X-DashScope-SSE': 'enable' }),
  };

  return retryWithBackoff(async () => {
    const response = await axios.post(url, request, {
      headers,
      timeout: DEFAULT_BAILIAN_CONFIG.timeout,
      responseType: stream ? 'stream' : 'json',
    });

    return response.data;
  });
}

/**
 * 处理流式响应 - 将Node.js stream转换为Web ReadableStream
 * 基于官方DashScope SSE协议实现
 */
function createStreamResponse(nodeStream: any): ReadableStream {
  const encoder = new TextEncoder();

  return new ReadableStream({
    start(controller) {
      let buffer = '';
      let currentSessionId = '';
      let isClosed = false; // 添加状态跟踪

      nodeStream.on('data', (chunk: Buffer) => {
        try {
          const chunkStr = chunk.toString();
          console.log('收到原始chunk:', chunkStr);
          buffer += chunkStr;

          // 按SSE事件分割（两个换行符）
          const events = buffer.split(/\n\n/);
          buffer = events.pop() || ''; // 保留未完成部分
          console.log('解析到事件数量:', events.length);

          events.forEach(eventData => {
            if (!eventData.trim()) return;

            const lines = eventData.split('\n');
            let textContent = '';
            let sessionId = '';
            let finishReason = '';

            // 解析事件内容
            lines.forEach(line => {
              if (line.startsWith('data:')) {
                try {
                  const jsonStr = line.slice(5).trim();
                  console.log('解析JSON数据:', jsonStr);
                  const jsonData = JSON.parse(jsonStr);
                  console.log('解析后的数据:', jsonData);

                  if (jsonData.output) {
                    if (jsonData.output.text) {
                      textContent = jsonData.output.text;
                      console.log('提取到文本:', textContent);
                    }
                    if (jsonData.output.session_id) {
                      sessionId = jsonData.output.session_id;
                      currentSessionId = sessionId;
                      console.log('更新会话ID:', sessionId);
                    }
                    if (jsonData.output.finish_reason) {
                      finishReason = jsonData.output.finish_reason;
                      console.log('完成原因:', finishReason);
                    }
                  }
                } catch (parseError) {
                  console.warn('JSON解析错误:', parseError, '原始行:', line);
                }
              }
            });

            // 如果有文本内容，发送chunk
            if (textContent) {
              const { cleanText } = parseMetadata(textContent);

              const streamResponse: StreamChatResponse = {
                type: 'chunk',
                data: {
                  text: cleanText,
                  sessionId: currentSessionId,
                  isComplete: false,
                },
              };

              controller.enqueue(encoder.encode(`data: ${JSON.stringify(streamResponse)}\n\n`));
            }

            // 检查是否完成
            if (finishReason === 'stop' && !isClosed) {
              try {
                const doneResponse: StreamChatResponse = {
                  type: 'done',
                  data: {
                    text: '',
                    sessionId: currentSessionId,
                    isComplete: true
                  },
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneResponse)}\n\n`));
              } catch (error) {
                console.error('Failed to send done response:', error);
              } finally {
                isClosed = true;
                controller.close();
              }
              return;
            }
          });
        } catch (error) {
          console.error('Stream data processing error:', error);
        }
      });

      nodeStream.on('end', () => {
        if (isClosed) return; // 避免重复处理

        // 处理剩余的buffer
        if (buffer.trim()) {
          try {
            const lines = buffer.split('\n');
            lines.forEach(line => {
              if (line.startsWith('data:')) {
                try {
                  const jsonData = JSON.parse(line.slice(5).trim());
                  if (jsonData.output?.text) {
                    const { cleanText } = parseMetadata(jsonData.output.text);

                    const streamResponse: StreamChatResponse = {
                      type: 'chunk',
                      data: {
                        text: cleanText,
                        sessionId: currentSessionId,
                        isComplete: false,
                      },
                    };

                    if (!isClosed) {
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(streamResponse)}\n\n`));
                    }
                  }
                } catch (parseError) {
                  console.warn('Final buffer JSON解析错误:', parseError);
                }
              }
            });
          } catch (error) {
            console.warn('Final buffer processing error:', error);
          }
        }

        // 发送完成信号
        try {
          const doneResponse: StreamChatResponse = {
            type: 'done',
            data: {
              text: '',
              sessionId: currentSessionId,
              isComplete: true
            },
          };
          if (!isClosed) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(doneResponse)}\n\n`));
          }
        } catch (error) {
          console.error('Failed to send final done response:', error);
        } finally {
          isClosed = true;
          controller.close();
        }
      });

      nodeStream.on('error', (error: Error) => {
        if (isClosed) return; // 避免重复处理

        console.error('Node stream error:', error);

        try {
          const errorResponse: StreamChatResponse = {
            type: 'error',
            error: {
              code: 'STREAM_ERROR',
              message: error.message || '流式响应处理失败',
            },
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorResponse)}\n\n`));
        } catch (enqueueError) {
          console.error('Failed to send error response:', enqueueError);
        } finally {
          isClosed = true;
          controller.close();
        }
      });
    },
  });
}

/**
 * POST /api/chat - 处理聊天请求
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('接收到的请求体:', JSON.stringify(body, null, 2));

    // 支持两种格式：新格式（百炼AI标准）和旧格式（向后兼容）
    let message: string;
    let sessionId: string | undefined;
    let parameters: any;
    let userPromptParams: any;

    if (body.input && body.input.biz_params) {
      // 新格式：百炼AI标准格式
      message = body.input.biz_params.message;
      sessionId = body.input.session_id;
      parameters = body.parameters;
      userPromptParams = body.userPromptParams;
    } else {
      // 旧格式：向后兼容
      message = body.message;
      sessionId = body.sessionId;
      parameters = body.parameters;
      userPromptParams = body.userPromptParams;
    }

    if (!message || typeof message !== 'string') {
      console.log('错误: 消息内容无效:', message);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_MESSAGE',
            message: '消息内容不能为空',
          },
        } as ChatResponse,
        { status: HTTPStatus.BAD_REQUEST }
      );
    }

    console.log('创建百炼请求参数:', { message, sessionId, parameters, userPromptParams });

    const bailianRequest = createBailianRequest(
      message,
      sessionId,
      parameters,
      userPromptParams
    );

    const isStream = parameters?.stream === true;

    if (isStream) {
      // 流式响应
      const nodeStream = await callBailianAPI(bailianRequest, true);
      const responseStream = createStreamResponse(nodeStream);

      return new Response(responseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // 非流式响应
      const response = await callBailianAPI(bailianRequest, false) as BailianAIResponse;
      const { cleanText, metadata } = parseMetadata(response.output.text);

      const chatResponse: ChatResponse = {
        success: true,
        data: {
          text: cleanText,
          sessionId: response.output.session_id,
          metadata: {
            module: 'default',
            ...metadata,
          },
        },
        usage: response.usage ? {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens: response.usage.total_tokens,
        } : undefined,
      };

      return NextResponse.json(chatResponse);
    }
  } catch (error) {
    console.error('Chat API error:', error);

    const apiError = handleAPIError(error);
    const errorResponse: ChatResponse = {
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
