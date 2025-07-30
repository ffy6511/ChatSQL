// 智能体API相关类型定义

import { ERDiagramData } from './erDiagram';

/**
 * 统一的智能体输出数据结构
 */
export interface UnifiedAgentOutput {
  // Schema Generator 输出
  result?: string;

  // ER Generator 输出
  erData?: ERDiagramData;
  description?: string;

  // ER Quiz Generator 输出
  // description 和 erData 已在上面定义

  // ER Verifier 输出
  evaluation?: string;
  score?: number;
  suggestions?: string[];

  // 通用字段
  summary?: string;
  rawText?: string;

  // 元数据
  hasStructuredData?: boolean;
  outputType?: 'single' | 'multiple';
}

/**
 * Schema-generator 智能体请求参数 - 支持百炼AI标准格式
 */
export interface SchemaGeneratorRequest {
  // 新格式：百炼AI标准格式
  input?: {
    prompt?: string;
    session_id?: string;
    biz_params: {
      "natural_language_query": string;
    };
  };
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
  debug?: any;

  // 旧格式：向后兼容
  sessionId?: string;
  natural_language_query?: string;
}

/**
 * Schema-generator 智能体响应数据
 */
export interface SchemaGeneratorResponse {
  success: boolean;
  data?: {
    output: UnifiedAgentOutput; // 改为统一结构
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
 * ER-generator 智能体请求参数 - 支持百炼AI标准格式
 */
export interface ERGeneratorRequest {
  // 新格式：百炼AI标准格式
  input?: {
    prompt?: string;
    session_id?: string;
    biz_params: {
      natural_language_query: string;
      provided_schema?: string; // 改为可选，允许为空时自动调用Schema-generator
    };
  };
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
  debug?: any;

  // 旧格式：向后兼容
  natural_language_query?: string;
  provided_schema?: string; // 保持可选
  sessionId?: string;
}

/**
 * ER-generator 智能体响应数据
 */
export interface ERGeneratorResponse {
  success: boolean;
  data?: {
    output: UnifiedAgentOutput; // 改为统一结构
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
 * ER-quiz-generator 智能体请求参数 - 支持百炼AI标准格式
 */
export interface ERQuizGeneratorRequest {
  // 新格式：百炼AI标准格式
  input?: {
    prompt?: string;
    session_id?: string;
    biz_params: {
      description: string;
      // TODO: 添加难度
    };
  };
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
  debug?: any;
}

/**
 * ER-quiz-generator 智能体响应数据
 */
export interface ERQuizGeneratorResponse {
  success: boolean;
  data?: {
    output: UnifiedAgentOutput; // 改为统一结构
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
 * ER-verifier 智能体请求参数 - 支持百炼AI标准格式
 */
export interface ERVerifierRequest {
  // 新格式：百炼AI标准格式
  input?: {
    prompt?: string;
    session_id?: string;
    biz_params: { 
      description: string;
      er_diagram_done: string;
      er_diagram_ans: string;
    };
  };
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  };
  debug?: any;
}

/**
 * ER-verifier 智能体响应数据
 */
export interface ERVerifierResponse {
  success: boolean;
  data?: {
    output: UnifiedAgentOutput; // 改为统一结构
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
  ER_QUIZ_GENERATOR = 'er_quiz_generator',
  ER_VERIFIER = 'er_verifier',
}

/**
 * 智能体输入字段接口
 */
export interface AgentInputField {
  name: string;
  label: string;
  description: string;
  type: 'text' | 'textarea' | 'er-diagram-selector' | 'quiz-selector';
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
  ER_QUIZ_GENERATOR: {
    APP_ID: 'be6e28193aea4049949d4fcb6a29f92e', 
    INPUT_PARAM: 'message',
    OUTPUT_PARAM: 'text',
  },
  ER_VERIFIER: {
    APP_ID: '6533b3711b8143068af6b09b98a3323c', // 默认聊天智能体
    INPUT_PARAMS: ['verification_description', 'er_diagram_json'],
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
        label: 'DDL语句（可选）',
        description: '可选：提供相关的数据库表结构DDL语句。如果不提供，系统将自动根据需求描述生成DDL语句',
        type: 'textarea',
        required: false, // 改为非必需
        placeholder: 'CREATE TABLE students (...); （可选，留空将自动生成）',
      },
    ],
  },
  [AgentType.ER_QUIZ_GENERATOR]: {
    type: AgentType.ER_QUIZ_GENERATOR,
    name: 'ER图出题助手',
    description: '根据自然语言描述生成ER图设计题目',
    icon: 'Quiz',
    endpoint: '/api/er_quiz_generator', 
    inputFields: [
      {
        name: 'description_input',
        label: '题目要求描述',
        description: '请描述需要生成的ER图设计题目要求',
        type: 'textarea',
        required: true,
        placeholder: '例如：设计一个学生选课系统，包含学生、课程、教师实体...',
      },
    ],
  },
  [AgentType.ER_VERIFIER]: {
    type: AgentType.ER_VERIFIER,
    name: 'ER图测评助手',
    description: '检验ER图与需求描述的一致性',
    icon: 'Rule',
    endpoint: '/api/er_verifier',
    inputFields: [
      {
        name: 'quiz_id',
        label: '选择要检验的题目',
        description: '从已保存的题目中选择一个进行检验',
        type: 'quiz-selector',
        required: true,
        placeholder: '请选择一个题目进行检验',
      },
      {
        name: 'user_answer_session_id',
        label: '选择你的ER图设计',
        description: '从历史记录中选择你设计的ER图',
        type: 'er-diagram-selector',
        required: true,
        placeholder: '请选择你设计的ER图',
      },
    ],
  },
};

/**
 * ER助手Tab配置
 */
export interface ERAssistantTab {
  agentType: AgentType;
  label: string;
}

export const ER_ASSISTANT_TABS: ERAssistantTab[] = [
  { agentType: AgentType.ER_QUIZ_GENERATOR, label: '出题模式' },
  { agentType: AgentType.ER_VERIFIER, label: '测评模式' },
];

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
