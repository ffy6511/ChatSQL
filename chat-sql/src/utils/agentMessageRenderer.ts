// 智能体消息渲染工具函数
import { UnifiedAgentOutput } from '@/types/agents';

/**
 * 消息类型定义
 */
export interface RenderedMessage {
  type: 'text' | 'code' | 'er-diagram' | 'evaluation' | 'suggestions';
  content: any;
  metadata?: {
    language?: string;
    score?: number;
    title?: string;
  };
}

/**
 * 渲染智能体消息为多个消息组件
 * 根据UnifiedAgentOutput的内容动态生成消息列表
 */
export function renderAgentMessage(output: UnifiedAgentOutput): RenderedMessage[] {
  const messages: RenderedMessage[] = [];
  
  if (output.outputType === 'multiple') {
    // 多条消息渲染
    
    // 1. 题目描述
    if (output.description) {
      messages.push({
        type: 'text',
        content: output.description,
        metadata: {
          title: '题目描述',
        },
      });
    }
    
    // 2. ER图数据
    if (output.erData) {
      messages.push({
        type: 'er-diagram',
        content: output.erData,
        metadata: {
          title: 'ER图',
        },
      });
    }
    
    // 3. 评价结果
    if (output.evaluation) {
      messages.push({
        type: 'evaluation',
        content: output.evaluation,
        metadata: {
          score: output.score,
          title: '评价结果',
        },
      });
    }
    
    // 4. 改进建议
    if (output.suggestions && output.suggestions.length > 0) {
      messages.push({
        type: 'suggestions',
        content: output.suggestions,
        metadata: {
          title: '改进建议',
        },
      });
    }
    
    // 5. DDL代码
    if (output.result) {
      messages.push({
        type: 'code',
        content: output.result,
        metadata: {
          language: 'sql',
          title: 'DDL语句',
        },
      });
    }
    
  } else {
    // 单条消息渲染
    if (output.result) {
      // Schema Generator 的DDL结果
      messages.push({
        type: 'code',
        content: output.result,
        metadata: {
          language: 'sql',
          title: 'DDL语句',
        },
      });
    } else {
      // 通用文本消息
      messages.push({
        type: 'text',
        content: output.summary || output.rawText || '',
      });
    }
  }
  
  return messages;
}

/**
 * 检查输出是否包含结构化数据
 */
export function hasStructuredData(output: UnifiedAgentOutput): boolean {
  return output.hasStructuredData || false;
}

/**
 * 获取输出的主要内容摘要
 */
export function getOutputSummary(output: UnifiedAgentOutput): string {
  if (output.summary) {
    return output.summary;
  }
  
  if (output.description) {
    return output.description;
  }
  
  if (output.evaluation) {
    return output.evaluation.substring(0, 100) + '...';
  }
  
  if (output.result) {
    return 'DDL语句已生成';
  }
  
  return output.rawText?.substring(0, 100) + '...' || '无内容';
}

/**
 * 获取输出的类型标签
 */
export function getOutputTypeLabel(output: UnifiedAgentOutput): string {
  if (output.erData && output.description) {
    return 'ER图题目';
  }
  
  if (output.erData) {
    return 'ER图';
  }
  
  if (output.evaluation) {
    return '评价结果';
  }
  
  if (output.result) {
    return 'DDL语句';
  }
  
  return '文本消息';
}

/**
 * 检查是否为测评类型的输出
 */
export function isEvaluationOutput(output: UnifiedAgentOutput): boolean {
  return !!(output.evaluation || output.score !== undefined || output.suggestions);
}

/**
 * 检查是否为代码类型的输出
 */
export function isCodeOutput(output: UnifiedAgentOutput): boolean {
  return !!output.result;
}

/**
 * 检查是否为ER图类型的输出
 */
export function isERDiagramOutput(output: UnifiedAgentOutput): boolean {
  return !!output.erData;
}
