import { ERDiagramData } from '@/types/erDiagram';
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
  AGENT_CONFIG,
  ERQuizGeneratorRequest,
  ERQuizGeneratorResponse,
} from '@/types/agents';

import * as agentsHandlers from '@/services/agentsHandlers';

/**
 * 解析智能体响应中的ER图数据
 */
function parseERQuizResponse(
  text: string
): { cleanText: string; description: string; erData: ERDiagramData; metadata?: any } {
  try {
    // 尝试使用正则表达式提取 JSON 字符串（从完整响应文本中提取有效 JSON）
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if( !match || !match[1]){
        throw new Error('未找到有效的JSON数据');
    }

    const jsonString = match[1];
    const json = JSON.parse(jsonString);

    const description = json.description;
    const erData = json.erData;
    const metadata = json.metadata;

    if (!description || !erData) {
      throw new Error('缺少必须字段 description 或 erData');
    }

    return {
      cleanText: text.trim(),
      description,
      erData,
      metadata,
    };
  } catch (err) {
    console.error('解析ERQuiz响应失败:', err);
    throw new Error('解析ERQuiz响应失败');
  }
}

/**
 * 创建ER-quiz-generator智能体请求
 */
function createERQuizGeneratorRequest(
    description: string,
    sessionId?: string,
    parameters?: any
): BailianAIRequest {
    const request: BailianAIRequest = {
        input:{
            prompt:"根据用户的描述生成合适的ER-quiz，请将输出结果包裹在 \`\`\`json ... \`\`\` 的代码块中， 并确保包含 description, erData字段",
            biz_params:{
                "description": description,
            },
        },
        parameters: parameters || {},
        debug:{},
    };

    if(sessionId){
        request.input.session_id = sessionId;
    }

    return request;
}


// 调用百炼平台的API
async function callBailianAPI(
    request: BailianAIRequest
): Promise<BailianAIResponse>{
    const apiKey = process.env.DashScope_API_KEY;
    const apiId = AGENT_CONFIG.ER_QUIZ_GENERATOR.APP_ID;

    if(!apiKey){
        throw new BailianAIAPIError(
            'API密钥未配置，请检查环境变量DASHSCOPE_API_KEY',
            ErrorType.AUTHENTICATION_ERROR,
        );
    }

    const url = `${DEFAULT_BAILIAN_CONFIG.baseUrl}/${apiId}/completion`;

    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
    };

    return agentsHandlers.retryWithBackoff( async() =>{
        const response = await axios.post(url, request, {
            headers,
            timeout: DEFAULT_BAILIAN_CONFIG.timeout,
            responseType: 'json',
        });

        return response.data;
    });
}


// POST /api/er_quiz_generator - 处理ER图生成请求
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('接收到的请求体:', JSON.stringify(body, null, 2));

    let description_input: string;
    let sessionId: string | undefined;
    let parameters: any;

    if(body.input && body.input.biz_params){
        description_input = body.input.biz_params.description;
        sessionId = body.input.session_id;
        parameters = body.parameters;
    }else{
        throw new BailianAIAPIError(
            '请求参数错误',
            ErrorType.PARAMETER_ERROR,
        );
    }

    if(!description_input || typeof description_input !== 'string'){
        console.log('Error: 缺少对题目的描述', description_input);
        return NextResponse.json({
            success: false,
            error:{
                code: 'INVALID_DESCRIPTION',
                message: '缺少对题目的描述',
            },
        }as ERQuizGeneratorResponse,
        {status: HTTPStatus.BAD_REQUEST}
    );
  }

  console.log('创建ER-quiz-generator请求:', createERQuizGeneratorRequest(description_input, sessionId, parameters));

  const request = createERQuizGeneratorRequest(description_input, sessionId, parameters);

  const response = await callBailianAPI(request) as BailianAIResponse;

  const { cleanText, description, erData, metadata } = parseERQuizResponse(response.output.text);

  // 验证必需字段
  if (!description || !erData) {
    throw new BailianAIAPIError(
      'ER-quiz-generator响应缺少必需字段: description 或 erData',
      ErrorType.PARAMETER_ERROR,
    );
  }

  const erQuizGeneratorResponse: ERQuizGeneratorResponse = {
    success: true,
    data: {
      output: {
        description: description,
        erData: erData as ERDiagramData,
        summary: `题目：${description}`,
        rawText: response.output.text,
        hasStructuredData: !!(description && erData),
        outputType: 'multiple',
      },
      sessionId: response.output.session_id,
      metadata: {
        module: 'ER',
        topic: 'er-quiz-generation',
        action: {
          type: 'visualize',
          target: '/er-diagram',
          params: { erData: erData, isQuiz: true },
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

  return NextResponse.json(erQuizGeneratorResponse);
  } catch (error) {
    console.error('ER-quiz-generator API error:', error);

    const apiError = agentsHandlers.handleAPIError(error);
    const errorResponse: ERQuizGeneratorResponse = {
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
