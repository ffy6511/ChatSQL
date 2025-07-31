/**
 * 全局可视化服务
 * 提供统一的可视化功能，避免props层层传递的复杂性
 */

import { erDiagramStorage } from '@/services/erDiagramStorage';

export type VisualizationType = 'sql' | 'er-diagram';

export interface VisualizationData {
  data: any;
  type: VisualizationType;
  metadata?: Record<string, any>;
}

/**
 * 可视化服务类
 */
class VisualizationService {
  private router: any = null;

  /**
   * 设置路由器实例（在组件中调用）
   */
  setRouter(router: any) {
    this.router = router;
  }

  /**
   * 检测数据是否为ER图数据
   */
  isERDiagramData(data: any): boolean {
    if (!data || typeof data !== 'object') return false;
    
    return (
      data.entities || 
      data.relationships || 
      (Array.isArray(data) && data.some((item: any) => 
        item && (item.entities || item.relationships || item.type === 'entity' || item.type === 'relationship')
      ))
    );
  }

  /**
   * 检测数据是否为SQL数据
   */
  isSQLData(data: any): boolean {
    if (typeof data !== 'string') return false;
    
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'FROM', 'WHERE'];
    const upperData = data.toUpperCase();
    return sqlKeywords.some(keyword => upperData.includes(keyword));
  }

  /**
   * 自动检测数据类型
   */
  detectDataType(data: any): VisualizationType | null {
    if (this.isERDiagramData(data)) return 'er-diagram';
    if (this.isSQLData(data)) return 'sql';
    return null;
  }

  /**
   * 执行可视化
   */
  async visualize(data: any, type?: VisualizationType): Promise<void> {
    try {
      // 如果没有指定类型，尝试自动检测
      const visualizeType = type || this.detectDataType(data);
      
      if (!visualizeType) {
        console.warn('无法确定数据类型，跳过可视化');
        return;
      }

      console.log(`开始可视化，类型: ${visualizeType}, 数据:`, data);

      switch (visualizeType) {
        case 'er-diagram':
          await this.visualizeERDiagram(data);
          break;
        case 'sql':
          await this.visualizeSQL(data);
          break;
        default:
          console.warn(`不支持的可视化类型: ${visualizeType}`);
      }
    } catch (error) {
      console.error('可视化失败:', error);
    }
  }

  /**
   * 可视化ER图
   */
  private async visualizeERDiagram(data: any): Promise<void> {
    try {
      const newId = await erDiagramStorage.saveDiagram(data);
      if (this.router) {
        this.router.push(`/er-diagram?id=${newId}`);
      } else {
        // 如果没有路由器，使用window.location
        window.location.href = `/er-diagram?id=${newId}`;
      }
    } catch (error) {
      console.error('保存ER图失败:', error);
    }
  }

  /**
   * 可视化SQL
   */
  private async visualizeSQL(data: any): Promise<void> {
    // 这里可以根据需要实现SQL可视化逻辑
    // 比如打开SQL编辑器、跳转到SQL分析页面等
    console.log('SQL可视化功能待实现:', data);
    
    // 示例：可以跳转到一个SQL分析页面
    // if (this.router) {
    //   this.router.push(`/sql-analyzer?sql=${encodeURIComponent(data)}`);
    // }
  }

  /**
   * 快速可视化方法 - 供渲染器直接调用
   */
  quickVisualize = (data: any, type?: VisualizationType) => {
    this.visualize(data, type).catch(console.error);
  };
}

// 创建全局实例
export const visualizationService = new VisualizationService();

// 导出便捷方法
export const visualize = visualizationService.quickVisualize;
export const setVisualizationRouter = visualizationService.setRouter.bind(visualizationService);
