/**
 * 消息内容渲染器组件
 * 根据 message.metadata.module 直接选择合适的渲染器进行渲染
 */

import React from 'react';
import { Message } from '@/types/chatbot';

// 导入渲染器组件
import DefaultTextRenderer from './DefaultTextRenderer';
import SqlRenderer from './SqlRenderer';
import JsonRenderer from './JsonRenderer';

interface MessageContentRendererProps {
  message: Message;
  isUser: boolean;
  className?: string;
  onCopy?: (content: string) => void;
}

/**
 * 消息内容渲染器组件
 * 基于 metadata.module 进行智能渲染分发
 */
const MessageContentRenderer: React.FC<MessageContentRendererProps> = ({
  message,
  isUser,
  className,
  onCopy,
}) => {
  // 构建渲染器属性
  const rendererProps = {
    message,
    isUser,
    className,
    onCopy,
  };

  // 根据 message.metadata.module 选择渲染器
  switch (message.metadata?.module) {
    case 'coding':
    case 'DDL':
      // 编程和 DDL 模块使用 SQL 渲染器
      return <SqlRenderer {...rendererProps} />;

    case 'ER':
      // ER 模块使用 JSON 渲染器
      return <JsonRenderer {...rendererProps} />;

    case 'default':
    default:
      // 默认使用文本渲染器
      return <DefaultTextRenderer {...rendererProps} />;
  }
};

export default MessageContentRenderer;
