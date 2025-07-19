/**
 * B+树核心数据结构
 * 纯数据操作，不包含任何可视化逻辑
 */

import { BPlusNode, createBPlusNode } from './commands';

export class BPlusTreeCore {
  public root: BPlusNode | null = null;
  private order: number;
  private maxKeys: number;
  private minKeys: number;
  private splitIndex: number;
  private nodeCounter: number = 0;

  constructor(order: number) {
    this.order = order;
    this.maxKeys = order - 1;
    this.minKeys = Math.floor((order - 1) / 2);
    this.splitIndex = Math.floor(order / 2);
  }

  /**
   * 查找键值应该插入的叶子节点
   */
  public findLeafNode(key: number): BPlusNode | null {
    if (!this.root) return null;

    let current = this.root;
    while (!current.isLeaf) {
      let index = 0;
      while (index < current.numKeys && current.keys[index] < key) {
        index++;
      }
      current = current.children[index];
    }
    return current;
  }

  /**
   * 在节点中查找键值
   */
  public findKeyInNode(node: BPlusNode, key: number): number {
    for (let i = 0; i < node.numKeys; i++) {
      if (node.keys[i] === key) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 检查键值是否存在
   */
  public find(key: number): boolean {
    const leafNode = this.findLeafNode(key);
    if (!leafNode) return false;
    return this.findKeyInNode(leafNode, key) !== -1;
  }

  /**
   * 在节点中插入键值（保持排序）
   */
  public insertKeyIntoNode(node: BPlusNode, key: number): void {
    let insertIndex = node.numKeys;
    
    // 找到插入位置
    while (insertIndex > 0 && node.keys[insertIndex - 1] > key) {
      node.keys[insertIndex] = node.keys[insertIndex - 1];
      insertIndex--;
    }
    
    node.keys[insertIndex] = key;
    node.numKeys++;
  }

  /**
   * 分裂节点
   */
  public splitNode(node: BPlusNode): { leftNode: BPlusNode; rightNode: BPlusNode; promotedKey: number } {
    const rightNode = createBPlusNode(
      `node-${this.nodeCounter++}`,
      `graphic-${this.nodeCounter}`,
      node.x + 100,
      node.y,
      node.isLeaf,
      node.level
    );

    rightNode.parent = node.parent;

    if (node.isLeaf) {
      // 叶子节点分裂
      const splitPoint = this.splitIndex;
      const promotedKey = node.keys[splitPoint];

      // 移动键值到右节点
      for (let i = splitPoint; i < node.numKeys; i++) {
        rightNode.keys[i - splitPoint] = node.keys[i];
      }
      rightNode.numKeys = node.numKeys - splitPoint;

      // 更新左节点
      node.numKeys = splitPoint;
      node.keys.length = splitPoint;

      // 更新叶子节点链表
      rightNode.next = node.next;
      node.next = rightNode;

      return { leftNode: node, rightNode, promotedKey };
    } else {
      // 内部节点分裂
      const splitPoint = this.splitIndex;
      const promotedKey = node.keys[splitPoint];

      // 移动键值到右节点
      for (let i = splitPoint + 1; i < node.numKeys; i++) {
        rightNode.keys[i - splitPoint - 1] = node.keys[i];
      }
      rightNode.numKeys = node.numKeys - splitPoint - 1;

      // 移动子节点到右节点
      for (let i = splitPoint + 1; i <= node.numKeys; i++) {
        rightNode.children[i - splitPoint - 1] = node.children[i];
        if (node.children[i]) {
          node.children[i].parent = rightNode;
        }
      }

      // 更新左节点
      node.numKeys = splitPoint;
      node.keys.length = splitPoint;
      node.children.length = splitPoint + 1;

      return { leftNode: node, rightNode, promotedKey };
    }
  }

  /**
   * 合并两个节点
   */
  public mergeNodes(leftNode: BPlusNode, rightNode: BPlusNode, separatorKey?: number): BPlusNode {
    if (leftNode.isLeaf) {
      // 叶子节点合并
      for (let i = 0; i < rightNode.numKeys; i++) {
        leftNode.keys[leftNode.numKeys + i] = rightNode.keys[i];
      }
      leftNode.numKeys += rightNode.numKeys;
      leftNode.next = rightNode.next;
    } else {
      // 内部节点合并
      if (separatorKey !== undefined) {
        leftNode.keys[leftNode.numKeys] = separatorKey;
        leftNode.numKeys++;
      }

      // 合并键值
      for (let i = 0; i < rightNode.numKeys; i++) {
        leftNode.keys[leftNode.numKeys + i] = rightNode.keys[i];
      }

      // 合并子节点
      for (let i = 0; i <= rightNode.numKeys; i++) {
        leftNode.children[leftNode.numKeys + i] = rightNode.children[i];
        if (rightNode.children[i]) {
          rightNode.children[i].parent = leftNode;
        }
      }

      leftNode.numKeys += rightNode.numKeys;
    }

    return leftNode;
  }

  /**
   * 从节点中删除键值
   */
  public removeKeyFromNode(node: BPlusNode, key: number): boolean {
    const keyIndex = this.findKeyInNode(node, key);
    if (keyIndex === -1) return false;

    // 移动键值
    for (let i = keyIndex; i < node.numKeys - 1; i++) {
      node.keys[i] = node.keys[i + 1];
    }
    node.numKeys--;
    node.keys.length = node.numKeys;

    return true;
  }

  /**
   * 检查节点是否需要重平衡
   */
  public needsRebalance(node: BPlusNode): boolean {
    if (node === this.root) {
      return node.numKeys === 0 && node.children.length > 0;
    }
    return node.numKeys < this.minKeys;
  }

  /**
   * 检查节点是否可以借出键值
   */
  public canLendKey(node: BPlusNode): boolean {
    return node.numKeys > this.minKeys;
  }

  /**
   * 获取节点的兄弟节点
   */
  public getSiblings(node: BPlusNode): { leftSibling: BPlusNode | null; rightSibling: BPlusNode | null; parentIndex: number } {
    if (!node.parent) {
      return { leftSibling: null, rightSibling: null, parentIndex: -1 };
    }

    const parent = node.parent;
    let parentIndex = -1;

    // 找到当前节点在父节点中的位置
    for (let i = 0; i <= parent.numKeys; i++) {
      if (parent.children[i] === node) {
        parentIndex = i;
        break;
      }
    }

    const leftSibling = parentIndex > 0 ? parent.children[parentIndex - 1] : null;
    const rightSibling = parentIndex < parent.numKeys ? parent.children[parentIndex + 1] : null;

    return { leftSibling, rightSibling, parentIndex };
  }

  /**
   * 从左兄弟借键
   */
  public borrowFromLeftSibling(node: BPlusNode, leftSibling: BPlusNode, parentIndex: number): void {
    const parent = node.parent!;

    if (node.isLeaf) {
      // 叶子节点借键
      const borrowedKey = leftSibling.keys[leftSibling.numKeys - 1];
      leftSibling.numKeys--;
      leftSibling.keys.length = leftSibling.numKeys;

      // 在当前节点前插入借来的键
      for (let i = node.numKeys; i > 0; i--) {
        node.keys[i] = node.keys[i - 1];
      }
      node.keys[0] = borrowedKey;
      node.numKeys++;

      // 更新父节点的分隔键
      parent.keys[parentIndex - 1] = node.keys[0];
    } else {
      // 内部节点借键
      const borrowedKey = leftSibling.keys[leftSibling.numKeys - 1];
      const borrowedChild = leftSibling.children[leftSibling.numKeys];
      
      leftSibling.numKeys--;
      leftSibling.keys.length = leftSibling.numKeys;
      leftSibling.children.length = leftSibling.numKeys + 1;

      // 在当前节点前插入父节点的分隔键
      for (let i = node.numKeys; i > 0; i--) {
        node.keys[i] = node.keys[i - 1];
      }
      for (let i = node.numKeys + 1; i > 0; i--) {
        node.children[i] = node.children[i - 1];
      }

      node.keys[0] = parent.keys[parentIndex - 1];
      node.children[0] = borrowedChild;
      node.numKeys++;

      if (borrowedChild) {
        borrowedChild.parent = node;
      }

      // 更新父节点的分隔键
      parent.keys[parentIndex - 1] = borrowedKey;
    }
  }

  /**
   * 从右兄弟借键
   */
  public borrowFromRightSibling(node: BPlusNode, rightSibling: BPlusNode, parentIndex: number): void {
    const parent = node.parent!;

    if (node.isLeaf) {
      // 叶子节点借键
      const borrowedKey = rightSibling.keys[0];
      
      // 从右兄弟移除第一个键
      for (let i = 0; i < rightSibling.numKeys - 1; i++) {
        rightSibling.keys[i] = rightSibling.keys[i + 1];
      }
      rightSibling.numKeys--;
      rightSibling.keys.length = rightSibling.numKeys;

      // 添加到当前节点末尾
      node.keys[node.numKeys] = borrowedKey;
      node.numKeys++;

      // 更新父节点的分隔键
      parent.keys[parentIndex] = rightSibling.keys[0];
    } else {
      // 内部节点借键
      const borrowedKey = rightSibling.keys[0];
      const borrowedChild = rightSibling.children[0];

      // 从右兄弟移除第一个键和子节点
      for (let i = 0; i < rightSibling.numKeys - 1; i++) {
        rightSibling.keys[i] = rightSibling.keys[i + 1];
      }
      for (let i = 0; i < rightSibling.numKeys; i++) {
        rightSibling.children[i] = rightSibling.children[i + 1];
      }
      rightSibling.numKeys--;
      rightSibling.keys.length = rightSibling.numKeys;
      rightSibling.children.length = rightSibling.numKeys + 1;

      // 添加父节点的分隔键到当前节点
      node.keys[node.numKeys] = parent.keys[parentIndex];
      node.children[node.numKeys + 1] = borrowedChild;
      node.numKeys++;

      if (borrowedChild) {
        borrowedChild.parent = node;
      }

      // 更新父节点的分隔键
      parent.keys[parentIndex] = borrowedKey;
    }
  }

  /**
   * 清空树
   */
  public clear(): void {
    this.root = null;
    this.nodeCounter = 0;
  }

  /**
   * 获取树的高度
   */
  public getHeight(): number {
    if (!this.root) return 0;
    return this.root.level + 1;
  }

  /**
   * 获取所有叶子节点的键值（有序）
   */
  public getAllKeys(): number[] {
    const keys: number[] = [];
    if (!this.root) return keys;

    // 找到最左边的叶子节点
    let current: BPlusNode | null = this.root;
    while (current && !current.isLeaf) {
      current = current.children[0];
    }

    // 遍历所有叶子节点
    while (current) {
      for (let i = 0; i < current.numKeys; i++) {
        keys.push(current.keys[i]);
      }
      current = current.next;
    }

    return keys;
  }

  /**
   * 获取最大键数
   */
  public getMaxKeys(): number {
    return this.maxKeys;
  }

  /**
   * 获取最小键数
   */
  public getMinKeys(): number {
    return this.minKeys;
  }

  /**
   * 获取分裂索引
   */
  public getSplitIndex(): number {
    return this.splitIndex;
  }

  /**
   * 获取阶数
   */
  public getOrder(): number {
    return this.order;
  }
}
