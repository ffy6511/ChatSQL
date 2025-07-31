import { NextRequest, NextResponse } from 'next/server';
import {
  BailianAIRequest,
  BailianAIResponse,
  BailianAIAPIError,
  ErrorType,
  HTTPStatus,
} from '@/types/chatbot/bailianai';
import {
  AGENT_CONFIG,
  ERVerifierRequest,
  ERVerifierResponse,
} from '@/types/agents';
import * as agentsHandlers from '@/services/agentsHandlers';

/**
 * 解析ERVerifier响应中的评价数据
 */
function parseERVerifierResponse(text: string): {
  cleanText: string;
  evaluation?: string;
  score?: number;
  suggestions?: string[];
  metadata?: any
} {
  try {
    // 尝试从响应文本中提取结构化数据
    const evaluationRegex = /```evaluation\s*([\s\S]*?)\s*```/;
    const scoreRegex = /```score\s*(\d+(?:\.\d+)?)\s*```/;
    const suggestionsRegex = /```suggestions\s*(\[[\s\S]*?\])\s*```/;
    const metadataRegex = /```metadata\s*(\{[\s\S]*?\})\s*```/;

    const evalMatch = text.match(evaluationRegex);
    const scoreMatch = text.match(scoreRegex);
    const suggestionsMatch = text.match(suggestionsRegex);
    const metadataMatch = text.match(metadataRegex);

    let cleanText = text;
    let evaluation: string | undefined;
    let score: number | undefined;
    let suggestions: string[] | undefined;
    let metadata: any | undefined;

    // 解析评价内容
    if (evalMatch) {
      evaluation = evalMatch[1].trim();
      cleanText = cleanText.replace(evaluationRegex, '').trim();
    }

    // 解析分数
    if (scoreMatch) {
      score = parseFloat(scoreMatch[1]);
      cleanText = cleanText.replace(scoreRegex, '').trim();
    }

    // 解析建议
    if (suggestionsMatch) {
      try {
        suggestions = JSON.parse(suggestionsMatch[1]);
        cleanText = cleanText.replace(suggestionsRegex, '').trim();
      } catch (parseError) {
        console.warn('Failed to parse suggestions:', parseError);
      }
    }

    // 解析元数据
    if (metadataMatch) {
      try {
        metadata = JSON.parse(metadataMatch[1]);
        cleanText = cleanText.replace(metadataRegex, '').trim();
      } catch (parseError) {
        console.warn('Failed to parse metadata:', parseError);
      }
    }

    // 如果没有找到结构化数据，尝试解析整个响应为JSON
    if (!evaluation && !score) {
      try {
        const possibleData = JSON.parse(cleanText);
        if (possibleData.evaluation || possibleData.score) {
          evaluation = possibleData.evaluation;
          score = possibleData.score;
          suggestions = possibleData.suggestions;
          cleanText = possibleData.summary || cleanText;
        }
      } catch (parseError) {
        // 不是JSON格式，保持原文本作为评价内容
        evaluation = cleanText;
      }
    }

    return { cleanText, evaluation, score, suggestions, metadata };
  } catch (error) {
    console.warn('Failed to parse ER verifier response:', error);
    return { cleanText: text, evaluation: text };
  }
}

/**
 * 创建ERVerifier智能体请求
 */
function createERVerifierRequest(
  description: string,
  erDiagramDone: string,
  erDiagramAns: string,
  sessionId?: string,
  parameters?: any
): BailianAIRequest {
  // 将三个参数合并为一个json字段, 因为在智能体中直接使用query参数
  const mergedParams = {
    original_problem: description,
    user_er_diagram: erDiagramDone,
    model_answer_er_diagram: erDiagramAns,
  };

  const request: BailianAIRequest = {
    input: {
      prompt: mergedParams,
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
 * POST /api/er_verifier - 处理ER图验证请求
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('接收到的请求体:', JSON.stringify(body, null, 2));

    let description: string;
    let erDiagramDone: string;
    let erDiagramAns: string;
    let sessionId: string | undefined;
    let parameters: any;

    if (body.input && body.input.biz_params) {
      description = body.input.biz_params.description;
      erDiagramDone = body.input.biz_params.erDiagramDone;
      erDiagramAns = body.input.biz_params.erDiagramAns;
      sessionId = body.input.session_id;
      parameters = body.parameters;
    } else {
      throw new BailianAIAPIError(
        '请求参数错误',
        ErrorType.VALIDATION_ERROR,
      );
    }

    // 验证必需参数
    if (!description || typeof description !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_DESCRIPTION',
          message: '缺少题目描述',
        },
      } as ERVerifierResponse,
      { status: HTTPStatus.BAD_REQUEST });
    }

    if (!erDiagramDone || typeof erDiagramDone !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_USER_DIAGRAM',
          message: '缺少用户提交的ER图数据',
        },
      } as ERVerifierResponse,
      { status: HTTPStatus.BAD_REQUEST });
    }

    if (!erDiagramAns || typeof erDiagramAns !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_ANSWER_DIAGRAM',
          message: '缺少标准答案ER图数据',
        },
      } as ERVerifierResponse,
      { status: HTTPStatus.BAD_REQUEST });
    }

    console.log('创建ER-verifier请求参数:', { description, erDiagramDone, erDiagramAns, sessionId });

    const request = createERVerifierRequest(
      description,
      erDiagramDone,
      erDiagramAns,
      sessionId,
      parameters
    );

    const response = await agentsHandlers.callBailianAPI(
      request,
      AGENT_CONFIG.ER_VERIFIER.APP_ID
    ) as BailianAIResponse;

    const { cleanText, evaluation, score, suggestions } = parseERVerifierResponse(response.output.text);

    // 构建基于类型数组的输出格式
    const outputParts: import('@/types/agents').AgentOutputPart[] = [];

    // 构建完整的评估文本
    let fullEvaluationText = '';

    if (evaluation || cleanText) {
      fullEvaluationText += `评估结果：\n${evaluation || cleanText}\n\n`;
    }

    if (score !== undefined) {
      fullEvaluationText += `评分：${score}\n\n`;
    }

    if (suggestions && suggestions.length > 0) {
      fullEvaluationText += `改进建议：\n`;
      if (Array.isArray(suggestions)) {
        suggestions.forEach((suggestion, index) => {
          fullEvaluationText += `${index + 1}. ${suggestion}\n`;
        });
      } else {
        fullEvaluationText += suggestions;
      }
    }

    // 添加完整的评估结果作为单个文本部分
    if (fullEvaluationText.trim()) {
      outputParts.push({
        type: 'text',
        content: fullEvaluationText.trim()
      });
    }

    const erVerifierResponse: ERVerifierResponse = {
      success: true,
      data: {
        output: outputParts,
        sessionId: response.output.session_id,
      },
      usage: response.usage ? {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined,
    };

    return NextResponse.json(erVerifierResponse);
  } catch (error) {
    console.error('ER-verifier API error:', error);

    const apiError = agentsHandlers.handleAPIError(error);
    const errorResponse: ERVerifierResponse = {
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