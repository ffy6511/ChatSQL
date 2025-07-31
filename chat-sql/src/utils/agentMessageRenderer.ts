// 智能体消息渲染工具函数
import { AgentOutputPart } from '@/types/chatBotTypes/agents';

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
 * 根据AgentOutputPart数组动态生成消息列表
 */
export function renderAgentMessage(parts: AgentOutputPart[]): RenderedMessage[] {
  const messages: RenderedMessage[] = [];

  // 遍历parts数组，为每个部分创建对应的渲染消息
  parts?.forEach((part: AgentOutputPart) => {
    switch (part.type) {
      case 'text':
        messages.push({
          type: 'text',
          content: part.content,
          metadata: {
            title: '文本内容',
          },
        });
        break;

      case 'sql':
        messages.push({
          type: 'code',
          content: part.content,
          metadata: {
            language: 'sql',
            title: 'SQL代码',
          },
        });
        break;

      case 'json':
        messages.push({
          type: 'er-diagram',
          content: part.content,
          metadata: {
            title: 'ER图数据',
          },
        });
        break;

      default:
        // 对于未知类型，作为文本处理
        messages.push({
          type: 'text',
          content: typeof part.content === 'string' ? part.content : JSON.stringify(part.content),
          metadata: {
            title: '内容',
          },
        });
    }
  });

  return messages;
}

/**
 * 检查输出是否包含结构化数据
 */
export function hasStructuredData(parts: AgentOutputPart[]): boolean {
  return parts && parts.length > 0;
}

/**
 * 获取输出的主要内容摘要
 */
export function getOutputSummary(parts: AgentOutputPart[]): string {
  if (!parts || parts.length === 0) {
    return '无内容';
  }

  // 优先获取文本类型的内容
  const textPart = parts.find((part: AgentOutputPart) => part.type === 'text');
  if (textPart) {
    return textPart.content.substring(0, 100) + (textPart.content.length > 100 ? '...' : '');
  }

  // 如果有SQL代码，返回提示
  const sqlPart = parts.find((part: AgentOutputPart) => part.type === 'sql');
  if (sqlPart) {
    return 'DDL语句已生成';
  }

  // 如果有ER图JSON，返回提示
  const erPart = parts.find((part: AgentOutputPart) => part.type === 'json');
  if (erPart) {
    return 'ER图已生成';
  }

  return '内容已生成';
}

/**
 * 获取输出的类型标签
 */
export function getOutputTypeLabel(parts: AgentOutputPart[]): string {
  if (!parts || parts.length === 0) {
    return '文本消息';
  }

  const hasErDiagram = parts.some((part: AgentOutputPart) => part.type === 'json');
  const hasText = parts.some((part: AgentOutputPart) => part.type === 'text');
  const hasSql = parts.some((part: AgentOutputPart) => part.type === 'sql');

  if (hasErDiagram && hasText) {
    return 'ER图题目';
  }

  if (hasErDiagram) {
    return 'ER图';
  }

  if (hasSql) {
    return 'DDL语句';
  }

  return '文本消息';
}

/**
 * 检查是否为测评类型的输出（现在基于文本内容判断）
 */
export function isEvaluationOutput(parts: AgentOutputPart[]): boolean {
  return parts?.some((part: AgentOutputPart) =>
    part.type === 'text' && (
      part.content.includes('评估结果') ||
      part.content.includes('评分') ||
      part.content.includes('建议')
    )
  ) || false;
}

/**
 * 检查是否为代码类型的输出
 */
export function isCodeOutput(parts: AgentOutputPart[]): boolean {
  return parts?.some((part: AgentOutputPart) => part.type === 'sql') || false;
}

/**
 * 检查是否为ER图类型的输出
 */
export function isERDiagramOutput(parts: AgentOutputPart[]): boolean {
  return parts?.some((part: AgentOutputPart) => part.type === 'json') || false;
}
