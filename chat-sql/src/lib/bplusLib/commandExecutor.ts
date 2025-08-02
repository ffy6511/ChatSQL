/**
 * 指令执行器
 * 负责将B+树算法指令转换为React Flow可视化更新
 */

import { Node, Edge, MarkerType } from "@xyflow/react";
import { BPlusCommand, BTREE_CONSTANTS } from "./commands";
import { BPlusNodeData } from "@/types/BplusTypes/bPlusTree";

export interface CommandExecutorCallbacks {
  setNodes: (
    updater: (nodes: Node<BPlusNodeData>[]) => Node<BPlusNodeData>[],
  ) => void;
  setEdges: (updater: (edges: Edge[]) => Edge[]) => void;
  showMessage: (
    message: string,
    type?: "info" | "success" | "warning" | "error",
  ) => void;
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
      case "SetMessage":
        this.executeSetMessage(command);
        break;

      case "SetText":
        // SetText指令已废弃，由updateView()统一处理
        console.warn("SetText command is deprecated, handled by updateView()");
        break;

      case "SetHighlight":
        this.executeSetHighlight(command);
        break;

      case "SetEdgeHighlight":
        this.executeSetEdgeHighlight(command);
        break;

      case "SetNodeState":
        this.executeSetNodeState(command);
        break;

      case "SetKeyHighlight":
        this.executeSetKeyHighlight(command);
        break;

      case "CreateBTreeNode":
        // CreateBTreeNode指令已废弃，由updateView()统一处理
        console.warn(
          "CreateBTreeNode command is deprecated, handled by updateView()",
        );
        break;

      case "DeleteNode":
        this.executeDeleteNode(command);
        break;

      case "SetNumElements":
        // SetNumElements指令已废弃，由updateView()统一处理
        console.warn(
          "SetNumElements command is deprecated, handled by updateView()",
        );
        break;

      case "Connect":
        this.executeConnect(command);
        break;

      case "Disconnect":
        this.executeDisconnect(command);
        break;

      case "Move":
        this.executeMove(command);
        break;

      case "ResizeTree":
        // ResizeTree指令已废弃，由updateView()统一处理
        console.warn(
          "ResizeTree command is deprecated, handled by updateView()",
        );
        break;

      case "Step":
        // Step指令不需要执行任何操作，只是动画断点
        break;

      default:
        console.warn("Unknown command type:", (command as any).type);
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
  private executeSetMessage(command: {
    type: "SetMessage";
    text: string;
  }): void {
    if (command.text.trim()) {
      this.callbacks.showMessage(command.text, "info");
    }
  }

  /**
   * 执行SetHighlight指令
   */
  private executeSetHighlight(command: {
    type: "SetHighlight";
    nodeId: string;
    highlight: boolean;
  }): void {
    this.callbacks.setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === command.nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              highlighted: command.highlight,
            },
          };
        }
        return node;
      }),
    );
  }

  /**
   * 执行SetNodeState指令 - 精确控制节点溢出状态可视化
   */
  private executeSetNodeState(
    command:
      | {
          type: "SetNodeState";
          nodeId: string;
          state: "overflowing";
          keys: (number | null)[];
        }
      | { type: "SetNodeState"; nodeId: string; state: "normal"; keys?: never },
  ): void {
    this.callbacks.setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === command.nodeId) {
          if (command.state === "overflowing") {
            // 溢出状态：更新isOverflowing标志并使用指令携带的keys覆盖节点数据
            return {
              ...node,
              data: {
                ...node.data,
                isOverflowing: true,
                keys: [...command.keys], // 使用指令携带的完整keys数组（包含溢出键）
              },
            };
          } else {
            // 正常状态：只清除溢出标志，保持现有keys不变（由updateView()处理）
            return {
              ...node,
              data: {
                ...node.data,
                isOverflowing: false,
              },
            };
          }
        }
        return node;
      }),
    );
  }

  /**
   * 执行SetKeyHighlight指令 - 精确控制特定键的高亮状态
   */
  private executeSetKeyHighlight(command: {
    type: "SetKeyHighlight";
    nodeId: string;
    keyIndex: number;
    highlight: boolean;
  }): void {
    this.callbacks.setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === command.nodeId) {
          // 初始化或更新keyHighlights数组
          const keyHighlights =
            node.data.keyHighlights ||
            new Array(node.data.keys.length).fill(false);
          if (
            command.keyIndex >= 0 &&
            command.keyIndex < keyHighlights.length
          ) {
            keyHighlights[command.keyIndex] = command.highlight;
          }

          return {
            ...node,
            data: {
              ...node.data,
              keyHighlights: [...keyHighlights],
            },
          };
        }
        return node;
      }),
    );
  }

  /**
   * 执行SetEdgeHighlight指令
   */
  private executeSetEdgeHighlight(command: {
    type: "SetEdgeHighlight";
    fromId: string;
    toId: string;
    highlight: boolean;
  }): void {
    const edgeId = `${command.fromId}-${command.toId}`;

    this.callbacks.setEdges((edges) =>
      edges.map((edge) => {
        if (
          edge.id === edgeId ||
          (edge.source === command.fromId && edge.target === command.toId)
        ) {
          return {
            ...edge,
            className: command.highlight ? "highlighted" : "",
            style: {
              ...edge.style,
              stroke: command.highlight
                ? BTREE_CONSTANTS.HIGHLIGHT_COLOR
                : BTREE_CONSTANTS.EDGE_COLOR,
              strokeWidth: command.highlight ? 3 : 1,
            },
          };
        }
        return edge;
      }),
    );
  }

  /**
   * 执行DeleteNode指令
   */
  private executeDeleteNode(command: {
    type: "DeleteNode";
    nodeId: string;
  }): void {
    this.nodeMap.delete(command.nodeId);

    this.callbacks.setNodes((nodes) =>
      nodes.filter((node) => node.id !== command.nodeId),
    );

    // 同时删除相关的边
    this.callbacks.setEdges((edges) =>
      edges.filter(
        (edge) =>
          edge.source !== command.nodeId && edge.target !== command.nodeId,
      ),
    );
  }

  /**
   * 执行Connect指令
   */
  private executeConnect(command: {
    type: "Connect";
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
      type: "default",
      style: {
        stroke: command.color || BTREE_CONSTANTS.EDGE_COLOR,
        strokeWidth: 1,
      },
      markerEnd: command.directed
        ? { type: MarkerType.ArrowClosed }
        : undefined,
      label: command.label || "",
    };

    this.edgeMap.set(edgeId, newEdge);

    this.callbacks.setEdges((edges) => {
      // 移除现有的相同连接
      const filteredEdges = edges.filter((edge) => edge.id !== edgeId);
      return [...filteredEdges, newEdge];
    });
  }

  /**
   * 执行Disconnect指令
   */
  private executeDisconnect(command: {
    type: "Disconnect";
    fromId: string;
    toId: string;
  }): void {
    const edgeId = `${command.fromId}-${command.toId}`;
    this.edgeMap.delete(edgeId);

    this.callbacks.setEdges((edges) =>
      edges.filter(
        (edge) =>
          edge.id !== edgeId &&
          !(edge.source === command.fromId && edge.target === command.toId),
      ),
    );
  }

  /**
   * 执行Move指令
   */
  private executeMove(command: {
    type: "Move";
    nodeId: string;
    toX: number;
    toY: number;
  }): void {
    this.callbacks.setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === command.nodeId) {
          return {
            ...node,
            position: { x: command.toX, y: command.toY },
          };
        }
        return node;
      }),
    );
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
