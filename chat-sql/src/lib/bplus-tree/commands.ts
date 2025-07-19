/**
 * B+树可视化指令系统
 * 基于参考实现的cmd指令模式，实现算法与可视化的完全分离
 */

// 边样式定义
export interface EdgeStyle {
  color?: string;
  strokeDasharray?: string;
  strokeWidth?: number;
}

// B+树操作指令类型定义
export type BPlusCommand = 
  // 文本和消息指令
  | { type: 'SetText'; target: string; text: string; index?: number }
  | { type: 'SetMessage'; text: string }
  
  // 节点高亮指令
  | { type: 'SetHighlight'; nodeId: string; highlight: boolean }
  | { type: 'SetEdgeHighlight'; fromId: string; toId: string; highlight: boolean }
  
  // 节点创建和删除指令
  | { type: 'CreateBTreeNode'; nodeId: string; width: number; height: number; numElements: number; x: number; y: number; backgroundColor?: string; foregroundColor?: string }
  | { type: 'DeleteNode'; nodeId: string }
  
  // 节点属性更新指令
  | { type: 'SetNumElements'; nodeId: string; count: number }
  | { type: 'SetNodePosition'; nodeId: string; x: number; y: number }
  
  // 连接指令
  | { type: 'Connect'; fromId: string; toId: string; color?: string; curve?: number; directed?: boolean; label?: string; connectionPoint?: number }
  | { type: 'Disconnect'; fromId: string; toId: string }
  
  // 动画控制指令
  | { type: 'Step' } // 动画断点
  | { type: 'Move'; nodeId: string; toX: number; toY: number }
  
  // 树结构调整指令
  | { type: 'ResizeTree' };

// 指令生成器基类
export abstract class AlgorithmBase {
  protected commands: BPlusCommand[] = [];
  protected recordAnimation: boolean = true;
  protected nextIndex: number = 0;

  /**
   * 生成指令的核心方法，模拟参考实现中的cmd方法
   */
  protected cmd(commandType: string, ...args: any[]): void {
    if (!this.recordAnimation) return;

    let command: BPlusCommand;

    switch (commandType) {
      case 'SetText':
        command = {
          type: 'SetText',
          target: args[0],
          text: args[1],
          index: args[2]
        };
        break;

      case 'SetMessage':
        command = {
          type: 'SetMessage',
          text: args[0]
        };
        break;

      case 'SetHighlight':
        command = {
          type: 'SetHighlight',
          nodeId: args[0],
          highlight: args[1] === 1
        };
        break;

      case 'SetEdgeHighlight':
        command = {
          type: 'SetEdgeHighlight',
          fromId: args[0],
          toId: args[1],
          highlight: args[2] === 1
        };
        break;

      case 'CreateBTreeNode':
        command = {
          type: 'CreateBTreeNode',
          nodeId: args[0],
          width: args[1],
          height: args[2],
          numElements: args[3],
          x: args[4],
          y: args[5],
          backgroundColor: args[6],
          foregroundColor: args[7]
        };
        break;

      case 'DeleteNode':
        command = {
          type: 'DeleteNode',
          nodeId: args[0]
        };
        break;

      case 'SetNumElements':
        command = {
          type: 'SetNumElements',
          nodeId: args[0],
          count: args[1]
        };
        break;

      case 'Connect':
        command = {
          type: 'Connect',
          fromId: args[0],
          toId: args[1],
          color: args[2],
          curve: args[3],
          directed: args[4] === 1,
          label: args[5],
          connectionPoint: args[6]
        };
        break;

      case 'Disconnect':
        command = {
          type: 'Disconnect',
          fromId: args[0],
          toId: args[1]
        };
        break;

      case 'Step':
        command = { type: 'Step' };
        break;

      case 'Move':
        command = {
          type: 'Move',
          nodeId: args[0],
          toX: args[1],
          toY: args[2]
        };
        break;

      case 'ResizeTree':
        command = { type: 'ResizeTree' };
        break;

      default:
        console.warn(`Unknown command type: ${commandType}`);
        return;
    }

    this.commands.push(command);
  }

  /**
   * 获取生成的指令序列
   */
  public getCommands(): BPlusCommand[] {
    return [...this.commands];
  }

  /**
   * 清空指令序列
   */
  public clearCommands(): void {
    this.commands = [];
  }

  /**
   * 设置是否记录动画指令
   */
  public setRecordAnimation(record: boolean): void {
    this.recordAnimation = record;
  }

  /**
   * 获取下一个可用的节点ID
   */
  protected getNextIndex(): number {
    return this.nextIndex++;
  }
}

// 常量定义
export const BTREE_CONSTANTS = {
  WIDTH_PER_ELEM: 50,
  NODE_HEIGHT: 30,
  STARTING_Y: 50,
  HEIGHT_DELTA: 80, // 层级间距
  BACKGROUND_COLOR: '#FFFFFF',
  FOREGROUND_COLOR: '#000000',
  HIGHLIGHT_COLOR: '#1976d2', // 深蓝色高亮
  EDGE_COLOR: '#000000'
};

// 节点数据结构
export interface BPlusNode {
  id: string;
  keys: number[];
  children: BPlusNode[];
  parent: BPlusNode | null;
  next: BPlusNode | null; // 叶子节点的兄弟指针
  isLeaf: boolean;
  numKeys: number;
  level: number;
  // 可视化相关属性（用于指令生成）
  graphicID: string;
  x: number;
  y: number;
}

// 工具函数：创建新节点
export function createBPlusNode(
  id: string,
  graphicID: string,
  x: number,
  y: number,
  isLeaf: boolean = true,
  level: number = 0
): BPlusNode {
  return {
    id,
    keys: [],
    children: [],
    parent: null,
    next: null,
    isLeaf,
    numKeys: 0,
    level,
    graphicID,
    x,
    y
  };
}
