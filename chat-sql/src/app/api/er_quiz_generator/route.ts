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
  ERGeneratorResponse,
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
    let cleanText = text;
    let description = '';
    let erData: ERDiagramData | undefined;
    let metadata: any  | undefined;


    // 尝试从响应文本中提取JSON格式的ER图数据
    const erDataRegex = /```json\s*(\{[\s\S]*?"erData"[\s\S]*?\})\s*```/;
    const descriptionRegex = /```description\s*(\{[\s\S]*?\})\s*```/;
    const metadataRegex = /```metadata\s*(\{[\s\S]*?\})\s*```/;

    const erMatch = text.match(erDataRegex);
    const descriptionMatch = text.match(descriptionRegex);
    const metadataMatch = text.match(metadataRegex);

    if(erMatch){
        try{
            erData = JSON.parse(erMatch[1]) as ERDiagramData;
            cleanText = cleanText.replace(erDataRegex, '').trim();
        }
        catch (parseError) {
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

    if (descriptionMatch) {
        try {
            description = JSON.parse(descriptionMatch[1]);
            cleanText = cleanText.replace(descriptionRegex, '').trim();
        } catch (parseError) {
            console.warn('Failed to parse description from response:', parseError);
        }
    }

    if(!erData)
        throw new Error('ER图数据解析失败');

    return {
        cleanText,
        description,
        erData,
        metadata,
    }


  } catch (err) {
    console.error('解析ERQuiz响应失败: 内容为 \n', text, '\n 错误为 \n', err);
    throw new Error(`解析ERQuiz响应失败：返回内容为 '${text}'， 错误为 '${err}'`);
  }
}

/**
 * 创建ER-quiz-generator智能体请求
 */
function createERQuizGeneratorRequest(
    description: string,
    difficulty?: string,
    sessionId?: string,
    parameters?: any,
): BailianAIRequest {
    const request: BailianAIRequest = {
        input:{
            prompt:"根据用户的描述生成合适的ER-quiz，请将输出结果包裹在 \`\`\`json ... \`\`\` 的代码块中， 并确保包含 description, erData字段",
            biz_params:{
                "description": description,
                "difficulty": difficulty,
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
    const apiKey = process.env.DASHSCOPE_API_KEY;
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

    const { description: userInput, difficulty = 'simple', } = body.input.biz_params;
    let sessionId: string | undefined = body.input.session_id;

    // 调用提示词增强的智能体
    const quizGenRequest = createERQuizGeneratorRequest(userInput,  difficulty);
    const quizGenResponse = await callBailianAPI(quizGenRequest) as BailianAIResponse;
    const enhancedDescription = quizGenResponse.output.text; // 得到智能体的增强描述

    // 调用ER-generator得到ER图数据
    const erGenRequestBody = {
        input:{
            biz_params:{
                "natural_language_query": enhancedDescription,
                "provided_schema": "",
            },
        }
    };

    // 发起内部的调用
    const erGenApiResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/ER-generator`,{
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(erGenRequestBody),
    });

    if(!erGenApiResponse.ok){
        const errorData = await erGenApiResponse.json();
        throw new Error(`ER-generator调用失败: ${errorData.error?.message || '未知错误'}`);
    }

    const erGenResult: ERGeneratorResponse = await erGenApiResponse.json();
    console.log('ER-generator调用成功，得到的ER图数据:', erGenResult);

    // 构建基于类型数组的输出格式
    const outputParts: import('@/types/agents').AgentOutputPart[] = [];

    // 添加题目描述部分
    if (enhancedDescription) {
      outputParts.push({
        type: 'text',
        content: enhancedDescription
      });
    }

    // 添加ER图数据部分（作为JSON类型）
    const finalErData = erGenResult.data?.output?.find(part =>
      part.type === 'json' && part.metadata?.dataType === 'er-diagram'
    )?.content;

    if (finalErData) {
      outputParts.push({
        type: 'json',
        content: finalErData,
        metadata: {
          dataType: 'er-diagram'
        }
      });
    }

    // 整合响应
    const finalResponse: ERQuizGeneratorResponse = {
        success: true,
        data: {
            output: outputParts,
            sessionId: quizGenResponse.output.session_id ,
        },
        usage: erGenResult.usage?{
            inputTokens: erGenResult.usage.inputTokens,
            outputTokens: erGenResult.usage.outputTokens,
            totalTokens: erGenResult.usage.totalTokens,
        } : undefined,
    };

    return NextResponse.json(finalResponse);
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
