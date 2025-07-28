// 智能体API相关类型定义

import { ERDiagramData } from './erDiagram';

/**
 * Schema-generator 智能体请求参数
 */
export interface SchemaGeneratorRequest {
  natural_language_query: string;
  sessionId?: string;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
}

/**
 * Schema-generator 智能体响应数据
 */
export interface SchemaGeneratorResponse {
  success: boolean;
  data?: {
    result: string; // DDL语句
    sessionId: string;
    metadata?: {
      module?: string;
      topic?: string;
      action?: {
        type: string;
        target: string;
        params?: Record<string, any>;
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
 * ER-generator 智能体请求参数
 */
export interface ERGeneratorRequest {
  natural_language_query: string;
  provided_schema: string;
  sessionId?: string;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
}

/**
 * ER-generator 智能体响应数据
 */
export interface ERGeneratorResponse {
  success: boolean;
  data?: {
    output: string | ERDiagramData; // JSON格式的ER图数据
    sessionId: string;
    metadata?: {
      module?: string;
      topic?: string;
      action?: {
        type: string;
        target: string;
        params?: Record<string, any>;
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
 * 智能体配置常量
 */
export const AGENT_CONFIG = {
  SCHEMA_GENERATOR: {
    APP_ID: '0724fb734047434994d49505c17560c7',
    INPUT_PARAM: 'natural_language_query',
    OUTPUT_PARAM: 'result',
  },
  ER_GENERATOR: {
    APP_ID: 'a7f68b0e9e67463f85b489fb367a8842',
    INPUT_PARAMS: ['natural_language_query', 'provided_schema'],
    OUTPUT_PARAM: 'output',
  },
} as const;

/**
 * 智能体类型枚举
 */
export enum AgentType {
  SCHEMA_GENERATOR = 'schema-generator',
  ER_GENERATOR = 'er-generator',
}

/**
 * 通用智能体请求接口
 */
export interface BaseAgentRequest {
  sessionId?: string;
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
}

/**
 * 通用智能体响应接口
 */
export interface BaseAgentResponse {
  success: boolean;
  data?: {
    sessionId: string;
    metadata?: {
      module?: string;
      topic?: string;
      action?: {
        type: string;
        target: string;
        params?: Record<string, any>;
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
