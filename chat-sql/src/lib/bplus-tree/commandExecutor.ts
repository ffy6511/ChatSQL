/**
 * 指令执行器
 * 负责将B+树算法指令转换为React Flow可视化更新
 */

import { Node, Edge, MarkerType } from '@xyflow/react';
import { BPlusCommand, BTREE_CONSTANTS } from './commands';
import { BPlusNodeData } from '../../components/utils/bPlusTreeToReactFlow';

export interface CommandExecutorCallbacks {
  setNodes: (updater: (nodes: Node<BPlusNodeData>[]) => Node<BPlusNodeData>[]) => void;
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
  showMessage: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
}

export class CommandExecutor {
  private callbacks: CommandExecutorCallbacks;
  private nodeMap: Map<string, Node<BPlusNodeData>> = new Map();
  private edgeMap: Map<string, Edge> = new Map();
  private nodeTypeMap: Map<string, boolean> = new Map(); // 跟踪节点是否为叶子节点

  constructor(callbacks: CommandExecutorCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * 设置节点类型信息
   */
  public setNodeType(nodeId: string, isLeaf: boolean): void {
    this.nodeTypeMap.set(nodeId, isLeaf);
  }

  /**
   * 执行单个指令
   */
  public async executeCommand(command: BPlusCommand): Promise<void> {
    switch (command.type) {
      case 'SetMessage':
        this.executeSetMessage(command);
        break;

      case 'SetText':
        this.executeSetText(command);
        break;

      case 'SetHighlight':
        this.executeSetHighlight(command);
        break;

      case 'SetEdgeHighlight':
        this.executeSetEdgeHighlight(command);
        break;

      case 'CreateBTreeNode':
        this.executeCreateBTreeNode(command);
        break;

      case 'DeleteNode':
        this.executeDeleteNode(command);
        break;

      case 'SetNumElements':
        this.executeSetNumElements(command);
        break;

      case 'Connect':
        this.executeConnect(command);
        break;

      case 'Disconnect':
        this.executeDisconnect(command);
        break;

      case 'Move':
        this.executeMove(command);
        break;

      case 'ResizeTree':
        this.executeResizeTree();
        break;

      case 'Step':
        // Step指令不需要执行任何操作，只是动画断点
        break;

      default:
        console.warn('Unknown command type:', (command as any).type);
    }
  }

  /**
   * 批量执行指令序列
   */
  public async executeCommands(commands: BPlusCommand[]): Promise<void> {
    for (const command of commands) {
      await this.executeCommand(command);
    }
  }

  /**
   * 重置执行器状态
   */
  public reset(): void {
    this.nodeMap.clear();
    this.edgeMap.clear();
    this.callbacks.setNodes(() => []);
    this.callbacks.setEdges(() => []);
  }

  /**
   * 执行SetMessage指令
   */
  private executeSetMessage(command: { type: 'SetMessage'; text: string }): void {
    if (command.text.trim()) {
      this.callbacks.showMessage(command.text, 'info');
    }
  }

  /**
   * 执行SetText指令
   */
  private executeSetText(command: { type: 'SetText'; target: string; text: string; index?: number }): void {
    const node = this.nodeMap.get(command.target);
    if (!node) return;

    this.callbacks.setNodes(nodes => 
      nodes.map(n => {
        if (n.id === command.target) {
          const newKeys = [...n.data.keys];
          if (command.index !== undefined) {
            newKeys[command.index] = parseInt(command.text) || null;
          }
          return {
            ...n,
            data: {
              ...n.data,
              keys: newKeys
            }
          };
        }
        return n;
      })
    );
  }

  /**
   * 执行SetHighlight指令
   */
  private executeSetHighlight(command: { type: 'SetHighlight'; nodeId: string; highlight: boolean }): void {
    this.callbacks.setNodes(nodes =>
      nodes.map(node => {
        if (node.id === command.nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              highlighted: command.highlight
            }
          };
        }
        return node;
      })
    );
  }

  /**
   * 执行SetEdgeHighlight指令
   */
  private executeSetEdgeHighlight(command: { type: 'SetEdgeHighlight'; fromId: string; toId: string; highlight: boolean }): void {
    const edgeId = `${command.fromId}-${command.toId}`;
    
    this.callbacks.setEdges(edges => 
      edges.map(edge => {
        if (edge.id === edgeId || (edge.source === command.fromId && edge.target === command.toId)) {
          return {
            ...edge,
            className: command.highlight ? 'highlighted' : '',
            style: {
              ...edge.style,
              stroke: command.highlight ? BTREE_CONSTANTS.HIGHLIGHT_COLOR : BTREE_CONSTANTS.EDGE_COLOR,
              strokeWidth: command.highlight ? 3 : 1
            }
          };
        }
        return edge;
      })
    );
  }

  /**
   * 执行CreateBTreeNode指令
   */
  private executeCreateBTreeNode(command: {
    type: 'CreateBTreeNode';
    nodeId: string;
    width: number;
    height: number;
    numElements: number;
    x: number;
    y: number;
    backgroundColor?: string;
    foregroundColor?: string;
  }): void {
    // 从类型映射中获取节点类型，默认为叶子节点
    const isLeaf = this.nodeTypeMap.get(command.nodeId) ?? true;

    // 确保order和keys数组长度正确
    const nodeOrder = Math.max(3, command.numElements + 1);
    const keysLength = nodeOrder - 1;
    const pointersLength = nodeOrder;

    const newNode: Node<BPlusNodeData> = {
      id: command.nodeId,
      type: isLeaf ? 'bPlusLeafNode' : 'bPlusInternalNode',
      position: { x: command.x, y: command.y },
      data: {
        keys: new Array(keysLength).fill(null),
        pointers: new Array(pointersLength).fill(null),
        isLeaf: isLeaf,
        level: 0,
        order: nodeOrder
      },
      // 移除style属性，让CSS控制样式，避免与自定义节点组件冲突
      className: isLeaf ? 'bplus-leaf-node' : 'bplus-internal-node'
    };

    this.nodeMap.set(command.nodeId, newNode);

    this.callbacks.setNodes(nodes => [...nodes, newNode]);
  }

  /**
   * 执行DeleteNode指令
   */
  private executeDeleteNode(command: { type: 'DeleteNode'; nodeId: string }): void {
    this.nodeMap.delete(command.nodeId);

    this.callbacks.setNodes(nodes => 
      nodes.filter(node => node.id !== command.nodeId)
    );

    // 同时删除相关的边
    this.callbacks.setEdges(edges => 
      edges.filter(edge => edge.source !== command.nodeId && edge.target !== command.nodeId)
    );
  }

  /**
   * 执行SetNumElements指令
   */
  private executeSetNumElements(command: { type: 'SetNumElements'; nodeId: string; count: number }): void {
    this.callbacks.setNodes(nodes => 
      nodes.map(node => {
        if (node.id === command.nodeId) {
          const newKeys = new Array(command.count).fill(null);
          // 保留现有的键值
          for (let i = 0; i < Math.min(command.count, node.data.keys.length); i++) {
            newKeys[i] = node.data.keys[i];
          }
          
          return {
            ...node,
            data: {
              ...node.data,
              keys: newKeys
            },
            style: {
              ...node.style,
              width: BTREE_CONSTANTS.WIDTH_PER_ELEM * command.count
            }
          };
        }
        return node;
      })
    );
  }

  /**
   * 执行Connect指令
   */
  private executeConnect(command: { 
    type: 'Connect'; 
    fromId: string; 
    toId: string; 
    color?: string; 
    curve?: number; 
    directed?: boolean; 
    label?: string; 
    connectionPoint?: number; 
  }): void {
    const edgeId = `${command.fromId}-${command.toId}`;
    
    const newEdge: Edge = {
      id: edgeId,
      source: command.fromId,
      target: command.toId,
      type: 'default',
      style: {
        stroke: command.color || BTREE_CONSTANTS.EDGE_COLOR,
        strokeWidth: 1
      },
      markerEnd: command.directed ? { type: MarkerType.ArrowClosed } : undefined,
      label: command.label || ''
    };

    this.edgeMap.set(edgeId, newEdge);

    this.callbacks.setEdges(edges => {
      // 移除现有的相同连接
      const filteredEdges = edges.filter(edge => edge.id !== edgeId);
      return [...filteredEdges, newEdge];
    });
  }

  /**
   * 执行Disconnect指令
   */
  private executeDisconnect(command: { type: 'Disconnect'; fromId: string; toId: string }): void {
    const edgeId = `${command.fromId}-${command.toId}`;
    this.edgeMap.delete(edgeId);

    this.callbacks.setEdges(edges => 
      edges.filter(edge => 
        edge.id !== edgeId && 
        !(edge.source === command.fromId && edge.target === command.toId)
      )
    );
  }

  /**
   * 执行Move指令
   */
  private executeMove(command: { type: 'Move'; nodeId: string; toX: number; toY: number }): void {
    this.callbacks.setNodes(nodes => 
      nodes.map(node => {
        if (node.id === command.nodeId) {
          return {
            ...node,
            position: { x: command.toX, y: command.toY }
          };
        }
        return node;
      })
    );
  }

  /**
   * 执行ResizeTree指令
   */
  private executeResizeTree(): void {
    // 这里可以实现自动布局逻辑
    // 暂时不做处理，让React Flow的自动布局处理
    console.log('ResizeTree command executed - auto layout will be handled by React Flow');
  }

  /**
   * 获取当前节点映射
   */
  public getNodeMap(): Map<string, Node<BPlusNodeData>> {
    return new Map(this.nodeMap);
  }

  /**
   * 获取当前边映射
   */
  public getEdgeMap(): Map<string, Edge> {
    return new Map(this.edgeMap);
  }
}
