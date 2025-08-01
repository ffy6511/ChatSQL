/**
 * 渲染器组件导出文件
 */

// 渲染器组件
export { default as MarkdownRenderer } from './MarkdownRenderer';
export { default as SqlRenderer } from './SqlRenderer';
export { default as JsonRenderer } from './JsonRenderer';
export { default as MessageContentRenderer } from './MessageContentRenderer';

// 渲染器工厂和工具函数
export {
  rendererFactory,
  createRendererFactory,
  detectSqlContent,
  detectJsonContent,
  getRendererByModule,
} from './RendererFactory';

// 类型定义
export type {
  RendererType,
  RendererConfig,
  RendererProps,
  MessageRenderer,
  RendererFactory,
  SyntaxHighlightConfig,
  JsonRendererConfig,
  SqlRendererConfig,
  RendererContextType,
} from '@/types/chatBotTypes/renderers';

// 默认配置
export {
  DEFAULT_RENDERER_CONFIG,
  DEFAULT_SQL_RENDERER_CONFIG,
  DEFAULT_JSON_RENDERER_CONFIG,
} from '@/types/chatBotTypes/renderers';
