// 消息渲染器相关类型定义

import { ReactNode } from "react";
import { Message } from "@/types/chatBotTypes/chatbot";

/**
 * 渲染器类型枚举
 */
export type RendererType = "default" | "sql" | "json" | "mermaid";

/**
 * 渲染器配置接口
 */
export interface RendererConfig {
  /** 渲染器类型 */
  type: RendererType;
  /** 是否启用语法高亮 */
  enableSyntaxHighlight?: boolean;
  /** 主题配置 */
  theme?: "light" | "dark" | "auto";
  /** 自定义样式 */
  customStyles?: Record<string, any>;
  /** 是否显示行号 */
  showLineNumbers?: boolean;
  /** 是否可复制 */
  copyable?: boolean;
}

/**
 * 渲染器属性接口
 */
export interface RendererProps {
  /** 消息对象 */
  message: Message;
  /** 渲染器配置 */
  config?: Partial<RendererConfig>;
  /** 是否为用户消息 */
  isUser: boolean;
  /** 自定义类名 */
  className?: string;
  /** 点击复制回调 */
  onCopy?: (content: string) => void;
}

/**
 * 渲染器组件接口
 */
export interface MessageRenderer {
  /** 渲染器类型 */
  type: RendererType;
  /** 渲染组件 */
  component: React.ComponentType<RendererProps>;
  /** 是否支持该消息类型 */
  canRender: (message: Message) => boolean;
  /** 渲染器优先级（数字越大优先级越高） */
  priority: number;
}

/**
 * 语法高亮配置
 */
export interface SyntaxHighlightConfig {
  /** 编程语言 */
  language: string;
  /** 主题名称 */
  theme: string;
  /** 是否显示行号 */
  showLineNumbers: boolean;
  /** 是否启用代码折叠 */
  wrapLines: boolean;
  /** 自定义样式 */
  customStyle?: Record<string, any>;
}

/**
 * JSON 渲染器特定配置
 */
export interface JsonRendererConfig extends RendererConfig {
  /** 缩进空格数 */
  indent?: number;
  /** 是否折叠对象 */
  collapsed?: boolean;
  /** 最大显示深度 */
  maxDepth?: number;
}

/**
 * SQL 渲染器特定配置
 */
export interface SqlRendererConfig extends RendererConfig {
  /** SQL 方言 */
  dialect?: "mysql" | "postgresql" | "sqlite" | "mssql" | "oracle";
  /** 是否格式化 SQL */
  formatSql?: boolean;
  /** 关键字大小写 */
  keywordCase?: "upper" | "lower" | "preserve";
}

/**
 * 默认渲染器配置
 */
export const DEFAULT_RENDERER_CONFIG: RendererConfig = {
  type: "default",
  enableSyntaxHighlight: false,
  theme: "auto",
  showLineNumbers: false,
  copyable: true,
};

/**
 * SQL 渲染器默认配置
 */
export const DEFAULT_SQL_RENDERER_CONFIG: SqlRendererConfig = {
  ...DEFAULT_RENDERER_CONFIG,
  type: "sql",
  enableSyntaxHighlight: true,
  showLineNumbers: true,
  dialect: "mysql",
  formatSql: true,
  keywordCase: "upper",
};

/**
 * JSON 渲染器默认配置
 */
export const DEFAULT_JSON_RENDERER_CONFIG: JsonRendererConfig = {
  ...DEFAULT_RENDERER_CONFIG,
  type: "json",
  enableSyntaxHighlight: true,
  showLineNumbers: true,
  indent: 2,
  collapsed: false,
  maxDepth: 10,
};

/**
 * 渲染器工厂接口
 */
export interface RendererFactory {
  /** 注册渲染器 */
  register: (renderer: MessageRenderer) => void;
  /** 获取渲染器 */
  getRenderer: (message: Message) => MessageRenderer | null;
  /** 获取所有渲染器 */
  getAllRenderers: () => MessageRenderer[];
  /** 移除渲染器 */
  unregister: (type: RendererType) => void;
}

/**
 * 渲染器上下文接口
 */
export interface RendererContextType {
  /** 全局渲染器配置 */
  config: RendererConfig;
  /** 更新配置 */
  updateConfig: (config: Partial<RendererConfig>) => void;
  /** 渲染器工厂实例 */
  factory: RendererFactory;
}
