import { Node, Edge } from '@xyflow/react';

// B+树节点接口
interface BPlusTreeNode {
  id: string;
  keys: (number | string | null)[];
  pointers: (string | null)[];
  isLeaf: boolean;
  level: number;
  parent?: string | null;
}

// React Flow节点数据接口
export interface BPlusNodeData extends Record<string, unknown> {
  keys: (number | string | null)[];
  pointers: (string | null)[];
  isLeaf: boolean;
  level: number;
  order: number;
  next?: string | null;
  highlighted?: boolean; // 添加高亮状态
}

// 简化的B+树类
class BPlusTree {
  private order: number;
  private root: BPlusTreeNode | null = null;
  private nodeCounter = 0;
  private allNodes: Map<string, BPlusTreeNode> = new Map();

  constructor(order: number) {
    this.order = order;
  }

  // 创建新节点
  private createNode(isLeaf: boolean, level: number): BPlusTreeNode {
    const node: BPlusTreeNode = {
      id: `node-${this.nodeCounter++}`,
      keys: new Array(this.order - 1).fill(null),
      pointers: new Array(this.order).fill(null),
      isLeaf,
      level,
      parent: null
    };

    this.allNodes.set(node.id, node);
    return node;
  }

  // 简单插入（不实现完整的B+树逻辑，只是为了演示）
  public insert(key: number | string): void {
    if (!this.root) {
      this.root = this.createNode(true, 0);
      this.root.keys[0] = key;
      return;
    }

    // 找到叶子节点
    let current = this.root;
    while (!current.isLeaf) {
      // 简单地选择第一个子节点
      const childId = current.pointers[0];
      if (childId && this.allNodes.has(childId)) {
        current = this.allNodes.get(childId)!;
      } else {
        break;
      }
    }

    // 在叶子节点中找到插入位置
    let insertIndex = 0;
    while (insertIndex < current.keys.length &&
           current.keys[insertIndex] !== null &&
           current.keys[insertIndex]! < key) {
      insertIndex++;
    }

    // 如果节点未满，直接插入
    if (current.keys[this.order - 2] === null) {
      // 移动元素为新键腾出空间
      for (let i = this.order - 2; i > insertIndex; i--) {
        current.keys[i] = current.keys[i - 1];
      }
      current.keys[insertIndex] = key;
    } else {
      // 节点已满，需要分裂（简化版本）
      this.splitLeafNode(current, key, insertIndex);
    }
  }

  // 简化的叶子节点分裂
  private splitLeafNode(node: BPlusTreeNode, newKey: number | string, insertIndex: number): void {
    const newNode = this.createNode(true, node.level);
    const allKeys = [...node.keys.filter(k => k !== null), newKey].sort((a, b) => {
      if (typeof a === 'number' && typeof b === 'number') return a - b;
      return String(a).localeCompare(String(b));
    });

    const mid = Math.ceil(allKeys.length / 2);

    // 重新分配键
    node.keys.fill(null);
    newNode.keys.fill(null);

    for (let i = 0; i < mid; i++) {
      if (i < node.keys.length) node.keys[i] = allKeys[i];
    }

    for (let i = mid; i < allKeys.length; i++) {
      if (i - mid < newNode.keys.length) newNode.keys[i - mid] = allKeys[i];
    }

    // 连接兄弟指针
    newNode.pointers[this.order - 1] = node.pointers[this.order - 1];
    node.pointers[this.order - 1] = newNode.id;

    // 如果这是根节点，创建新的根
    if (node === this.root) {
      const newRoot = this.createNode(false, node.level + 1);
      newRoot.keys[0] = newNode.keys[0];
      newRoot.pointers[0] = node.id;
      newRoot.pointers[1] = newNode.id;
      node.parent = newRoot.id;
      newNode.parent = newRoot.id;
      this.root = newRoot;

      // 更新层级
      this.updateNodeLevels();
    }
  }

  // 更新节点层级
  private updateNodeLevels(): void {
    if (!this.root) return;

    const queue: { node: BPlusTreeNode; level: number }[] = [{ node: this.root, level: 0 }];
    let maxLevel = 0;

    while (queue.length > 0) {
      const { node, level } = queue.shift()!;
      maxLevel = Math.max(maxLevel, level);

      if (!node.isLeaf) {
        for (const pointerId of node.pointers) {
          if (pointerId && this.allNodes.has(pointerId)) {
            const child = this.allNodes.get(pointerId)!;
            queue.push({ node: child, level: level + 1 });
          }
        }
      }
    }

    // 重新设置层级（从上到下）
    const resetQueue: { node: BPlusTreeNode; level: number }[] = [{ node: this.root, level: maxLevel }];

    while (resetQueue.length > 0) {
      const { node, level } = resetQueue.shift()!;
      node.level = level;

      if (!node.isLeaf) {
        for (const pointerId of node.pointers) {
          if (pointerId && this.allNodes.has(pointerId)) {
            const child = this.allNodes.get(pointerId)!;
            resetQueue.push({ node: child, level: level - 1 });
          }
        }
      }
    }
  }

  // 获取所有节点
  public getAllNodes(): BPlusTreeNode[] {
    return Array.from(this.allNodes.values());
  }

  // 转换为React Flow数据
  public toReactFlowData(): { nodes: Node<BPlusNodeData>[], edges: Edge[] } {
    const nodes: Node<BPlusNodeData>[] = [];
    const edges: Edge[] = [];

    if (!this.root) {
      return { nodes, edges };
    }

    const allNodes = this.getAllNodes();

    // 创建React Flow节点
    allNodes.forEach(node => {
      nodes.push({
        id: node.id,
        type: node.isLeaf ? 'bPlusLeafNode' : 'bPlusInternalNode',
        position: { x: 0, y: 0 }, // 初始位置，稍后由布局算法设置
        data: {
          keys: [...node.keys],
          pointers: [...node.pointers],
          isLeaf: node.isLeaf,
          level: node.level,
          order: this.order
        }
      });
    });

    // 创建React Flow边
    allNodes.forEach(node => {
      if (!node.isLeaf) {
        // 内部节点的子节点连接
        node.pointers.forEach((pointerId, index) => {
          if (pointerId && this.allNodes.has(pointerId)) {
            edges.push({
              id: `${node.id}-${pointerId}`,
              source: node.id,
              target: pointerId,
              sourceHandle: `pointer-${index}`,
              targetHandle: 'top',
              type: 'default'
            });
          }
        });
      } else {
        // 叶子节点的兄弟连接
        const siblingId = node.pointers[this.order - 1];
        if (siblingId && this.allNodes.has(siblingId)) {
          edges.push({
            id: `${node.id}-sibling-${siblingId}`,
            source: node.id,
            target: siblingId,
            sourceHandle: `sibling`,
            targetHandle: 'sibling-target',
            type: 'default',
            style: { stroke: '#999', strokeDasharray: '5,5' }
          });
        }
      }
    });

    return { nodes, edges };
  }
}

// 主要导出函数
export function bPlusTreeToReactFlow(
  keys: (number | string)[],
  order: number
): { nodes: Node<BPlusNodeData>[], edges: Edge[] } {
  const tree = new BPlusTree(order);

  // 按顺序插入所有键
  keys.forEach(key => {
    tree.insert(key);
  });

  return tree.toReactFlowData();
}