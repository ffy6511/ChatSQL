/**
 * 渲染器工厂和调度逻辑
 * 实现渲染器选择逻辑，根据 metadata.module 字段选择合适的渲染器组件
 */

import { Message } from '@/types/chatbot';
import { MessageRenderer, RendererFactory, RendererType } from '@/types/chatbot/renderers';

/**
 * 渲染器工厂实现类
 */
class RendererFactoryImpl implements RendererFactory {
  private renderers: Map<RendererType, MessageRenderer> = new Map();

  /**
   * 注册渲染器
   */
  register(renderer: MessageRenderer): void {
    this.renderers.set(renderer.type, renderer);
  }

  /**
   * 获取适合的渲染器
   */
  getRenderer(message: Message): MessageRenderer | null {
    // 获取所有可用的渲染器，按优先级排序
    const availableRenderers = Array.from(this.renderers.values())
      .filter(renderer => renderer.canRender(message))
      .sort((a, b) => b.priority - a.priority);

    // 返回优先级最高的渲染器
    return availableRenderers[0] || null;
  }

  /**
   * 获取所有渲染器
   */
  getAllRenderers(): MessageRenderer[] {
    return Array.from(this.renderers.values());
  }

  /**
   * 移除渲染器
   */
  unregister(type: RendererType): void {
    this.renderers.delete(type);
  }
}

/**
 * 检测消息是否包含 SQL 内容
 */
export const detectSqlContent = (message: Message): boolean => {
  const content = message.content.toLowerCase();
  
  // 检查是否有 SQL 代码块
  if (content.includes('```sql')) {
    return true;
  }
  
  // 检查是否包含 SQL 关键字
  const sqlKeywords = [
    'select', 'insert', 'update', 'delete', 'create', 'drop', 'alter',
    'from', 'where', 'join', 'inner join', 'left join', 'right join',
    'order by', 'group by', 'having', 'limit'
  ];
  
  const hasMultipleSqlKeywords = sqlKeywords.filter(keyword => 
    content.includes(keyword)
  ).length >= 2;
  
  return hasMultipleSqlKeywords;
};

/**
 * 检测消息是否包含 JSON 内容
 */
export const detectJsonContent = (message: Message): boolean => {
  const content = message.content.trim();
  
  // 检查是否有 JSON 代码块
  if (content.includes('```json')) {
    return true;
  }
  
  // 检查是否以 { 或 [ 开头，} 或 ] 结尾
  if ((content.startsWith('{') && content.endsWith('}')) ||
      (content.startsWith('[') && content.endsWith(']'))) {
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
};

/**
 * 基于模块类型的渲染器选择逻辑
 */
export const getRendererByModule = (message: Message): RendererType => {
  const messageModule = message.metadata?.module;
  
  switch (messageModule) {
    case 'ER':
      // ER 模块优先使用 JSON 渲染器
      if (detectJsonContent(message)) {
        return 'json';
      }
      break;
      
    case 'coding':
      // 编程模块优先检测 SQL
      if (detectSqlContent(message)) {
        return 'sql';
      }
      if (detectJsonContent(message)) {
        return 'json';
      }
      break;
      
    case 'Bplus':
      // B+树模块可能包含 JSON 配置
      if (detectJsonContent(message)) {
        return 'json';
      }
      break;
  }
  
  // 内容类型检测（不依赖模块）
  if (detectSqlContent(message)) {
    return 'sql';
  }
  
  if (detectJsonContent(message)) {
    return 'json';
  }
  
  return 'default';
};

/**
 * 创建并配置渲染器工厂实例
 */
export const createRendererFactory = (): RendererFactory => {
  const factory = new RendererFactoryImpl();
  
  // 注册默认文本渲染器
  factory.register({
    type: 'default',
    component: null as any, // 将在组件中动态导入
    canRender: () => true, // 默认渲染器可以渲染任何消息
    priority: 0, // 最低优先级
  });
  
  // 注册 SQL 渲染器
  factory.register({
    type: 'sql',
    component: null as any, // 将在组件中动态导入
    canRender: (message: Message) => {
      // 优先检查模块类型
      if (message.metadata?.module === 'coding') {
        return detectSqlContent(message);
      }
      // 然后检查内容类型
      return detectSqlContent(message);
    },
    priority: 10, // 高优先级
  });
  
  // 注册 JSON 渲染器
  factory.register({
    type: 'json',
    component: null as any, // 将在组件中动态导入
    canRender: (message: Message) => {
      // 优先检查模块类型
      if (message.metadata?.module === 'ER') {
        return detectJsonContent(message);
      }
      // 然后检查内容类型
      return detectJsonContent(message);
    },
    priority: 10, // 高优先级
  });
  
  return factory;
};

/**
 * 全局渲染器工厂实例
 */
export const rendererFactory = createRendererFactory();
