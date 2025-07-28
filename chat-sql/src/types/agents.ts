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
 * 智能体类型枚举
 */
export enum AgentType {
  SCHEMA_GENERATOR = 'schema-generator',
  ER_GENERATOR = 'er-generator',
  CHAT = 'chat', // 默认聊天智能体
}

/**
 * 智能体输入字段接口
 */
export interface AgentInputField {
  name: string;
  label: string;
  description: string;
  type: 'text' | 'textarea';
  required: boolean;
  placeholder?: string;
}

/**
 * 智能体信息接口
 */
export interface AgentInfo {
  type: AgentType;
  name: string;
  description: string;
  icon: string; // Material-UI图标名称
  endpoint: string;
  inputFields: AgentInputField[];
}

/**
 * 智能体选择状态接口
 */
export interface AgentSelectionState {
  selectedAgent: AgentType;
  inputValues: Record<string, string>;
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
  CHAT: {
    APP_ID: '6533b3711b8143068af6b09b98a3323c', // 默认聊天智能体
    INPUT_PARAM: 'message',
    OUTPUT_PARAM: 'text',
  },
} as const;

/**
 * 智能体信息配置
 */
export const AGENTS_INFO: Record<AgentType, AgentInfo> = {
  [AgentType.CHAT]: {
    type: AgentType.CHAT,
    name: '通用聊天',
    description: '通用的AI助手，可以回答各种问题',
    icon: 'Chat',
    endpoint: '/api/chat',
    inputFields: [
      {
        name: 'message',
        label: '消息内容',
        description: '请输入您想要咨询的问题',
        type: 'textarea',
        required: true,
        placeholder: '请输入您的问题...',
      },
    ],
  },
  [AgentType.SCHEMA_GENERATOR]: {
    type: AgentType.SCHEMA_GENERATOR,
    name: 'DDL生成器',
    description: '根据自然语言描述生成数据库表结构DDL语句',
    icon: 'Storage',
    endpoint: '/api/Schema-generator',
    inputFields: [
      {
        name: 'natural_language_query',
        label: '需求描述',
        description: '请用自然语言描述您需要的数据库表结构',
        type: 'textarea',
        required: true,
        placeholder: '例如：创建一个学生选课系统的数据库表结构...',
      },
    ],
  },
  [AgentType.ER_GENERATOR]: {
    type: AgentType.ER_GENERATOR,
    name: 'ER图生成器',
    description: '根据自然语言和DDL生成ER图的JSON数据',
    icon: 'AccountTree',
    endpoint: '/api/ER-generator',
    inputFields: [
      {
        name: 'natural_language_query',
        label: '需求描述',
        description: '请用自然语言描述您需要的ER图',
        type: 'textarea',
        required: true,
        placeholder: '例如：为学生选课系统创建ER图...',
      },
      {
        name: 'provided_schema',
        label: 'DDL语句',
        description: '请提供相关的数据库表结构DDL语句',
        type: 'textarea',
        required: true,
        placeholder: 'CREATE TABLE students (...);',
      },
    ],
  },
};

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
