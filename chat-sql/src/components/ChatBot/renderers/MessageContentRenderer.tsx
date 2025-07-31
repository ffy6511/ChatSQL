/**
 * 消息内容渲染器组件
 * 根据 message.metadata.module 直接选择合适的渲染器进行渲染
 * 支持结构化对象（AgentOutputPart[]）的多部分渲染
 */

import React from 'react';
import { Message } from '@/types/chatbot';
import { AgentOutputPart } from '@/types/agents';

// 导入渲染器组件
import DefaultTextRenderer from './DefaultTextRenderer';
import MessagePartsRenderer from './MessagePartsRenderer';
import SqlRenderer from './SqlRenderer';
import JsonRenderer from './JsonRenderer';
import { getRendererByModule } from './RendererFactory';

interface MessageContentRendererProps {
  message: Message;
  isUser: boolean;
  className?: string;
  onCopy?: (content: string) => void;
  onAction?: (actionType: string, data: any, fieldKey?: string) => void;
}

/**
 * 消息内容渲染器组件
 * 基于 metadata.module 和内容类型进行智能渲染分发
 * 支持结构化对象的多部分渲染
 */
const MessageContentRenderer: React.FC<MessageContentRendererProps> = ({
  message,
  isUser,
  className,
  onCopy,
  onAction,
}) => {
  // 检查是否为parts数组格式（新格式）
  if (Array.isArray(message.content)) {
    return (
      <MessagePartsRenderer
        parts={message.content}
      />
    );
  }

  // 对于字符串内容，根据内容类型选择合适的渲染器
  const rendererType = getRendererByModule(message);
  const rendererProps = {
    message: {
      ...message,
      content: message.content as string, // 类型断言，因为已经排除了对象类型
    },
    isUser,
    className,
    onCopy,
  };

  // 根据内容类型选择渲染器
  switch (rendererType) {
    case 'sql':
      return <SqlRenderer {...rendererProps} />;
    case 'json':
      return <JsonRenderer {...rendererProps} />;
    default:
      return <DefaultTextRenderer {...rendererProps} />;
  }
};

export default MessageContentRenderer;
