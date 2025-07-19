/**
 * B+树算法实现
 * 基于指令序列的算法层，参考cache/bplus.js实现
 */

import { AlgorithmBase, BPlusCommand, BPlusNode, createBPlusNode, BTREE_CONSTANTS } from './commands';
import { BPlusTreeCore } from './core';

export class BPlusTreeAlgorithm extends AlgorithmBase {
  private tree: BPlusTreeCore;
  private messageID: string = 'message';
  private startingX: number = 400;
  private startingY: number = BTREE_CONSTANTS.STARTING_Y;

  constructor(order: number) {
    super();
    this.tree = new BPlusTreeCore(order);
  }

  /**
   * 插入元素的主入口函数
   */
  public insertElement(insertedValue: number): BPlusCommand[] {
    this.commands = [];

    this.cmd('SetMessage', `Inserting ${insertedValue}`);
    this.cmd('Step');

    if (this.tree.root === null) {
      // 创建根节点
      this.tree.root = createBPlusNode(
        `node-${this.getNextIndex()}`,
        `graphic-${this.nextIndex}`,
        this.startingX,
        this.startingY,
        true,
        0
      );

      this.cmd('CreateBTreeNode',
        this.tree.root.graphicID,
        BTREE_CONSTANTS.WIDTH_PER_ELEM,
        BTREE_CONSTANTS.NODE_HEIGHT,
        1,
        this.startingX,
        this.startingY,
        BTREE_CONSTANTS.BACKGROUND_COLOR,
        BTREE_CONSTANTS.FOREGROUND_COLOR
      );

      this.tree.root.keys[0] = insertedValue;
      this.tree.root.numKeys = 1;
      this.cmd('SetText', this.tree.root.graphicID, insertedValue.toString(), 0);
    } else {
      this.insert(this.tree.root, insertedValue);
      if (!this.tree.root.isLeaf) {
        this.resizeTree();
      }
    }

    this.cmd('SetMessage', '');
    return this.getCommands();
  }

  /**
   * 递归插入函数
   */
  private insert(node: BPlusNode, insertValue: number): void {
    this.cmd('SetHighlight', node.graphicID, 1);
    this.cmd('Step');

    if (node.isLeaf) {
      this.insertIntoLeaf(node, insertValue);
    } else {
      this.insertIntoInternal(node, insertValue);
    }
  }

  /**
   * 插入到叶子节点
   */
  private insertIntoLeaf(node: BPlusNode, insertValue: number): void {
    this.cmd('SetMessage', `Inserting ${insertValue}. Inserting into a leaf`);
    
    node.numKeys++;
    this.cmd('SetNumElements', node.graphicID, node.numKeys);

    // 找到插入位置并移动键值
    let insertIndex = node.numKeys - 1;
    while (insertIndex > 0 && node.keys[insertIndex - 1] > insertValue) {
      node.keys[insertIndex] = node.keys[insertIndex - 1];
      this.cmd('SetText', node.graphicID, node.keys[insertIndex].toString(), insertIndex);
      insertIndex--;
    }

    node.keys[insertIndex] = insertValue;
    this.cmd('SetText', node.graphicID, node.keys[insertIndex].toString(), insertIndex);
    this.cmd('SetHighlight', node.graphicID, 0);

    // 更新叶子节点链表连接
    if (node.next !== null) {
      this.cmd('Disconnect', node.graphicID, node.next.graphicID);
      this.cmd('Connect', 
        node.graphicID,
        node.next.graphicID,
        BTREE_CONSTANTS.FOREGROUND_COLOR,
        0, // curve
        1, // directed
        '', // label
        node.numKeys
      );
    }

    this.resizeTree();
    this.insertRepair(node);
  }

  /**
   * 插入到内部节点
   */
  private insertIntoInternal(node: BPlusNode, insertValue: number): void {
    let findIndex = 0;
    while (findIndex < node.numKeys && node.keys[findIndex] < insertValue) {
      findIndex++;
    }

    this.cmd('SetEdgeHighlight', node.graphicID, node.children[findIndex].graphicID, 1);
    this.cmd('Step');
    this.cmd('SetEdgeHighlight', node.graphicID, node.children[findIndex].graphicID, 0);
    this.cmd('SetHighlight', node.graphicID, 0);
    this.insert(node.children[findIndex], insertValue);
  }

  /**
   * 插入后的修复函数，检查是否需要分裂
   */
  private insertRepair(node: BPlusNode): void {
    const maxKeys = this.tree.getMaxKeys();

    if (node.numKeys <= maxKeys) {
      return;
    } else if (node.parent === null) {
      this.tree.root = this.split(node);
      return;
    } else {
      const newNode = this.split(node);
      this.insertRepair(newNode);
    }
  }

  /**
   * 分裂节点
   */
  private split(node: BPlusNode): BPlusNode {
    this.cmd('SetMessage', 'Node now contains too many keys. Splitting...');
    this.cmd('SetHighlight', node.graphicID, 1);
    this.cmd('Step');
    this.cmd('SetHighlight', node.graphicID, 0);

    // 创建右节点
    const rightNode = createBPlusNode(
      `node-${this.getNextIndex()}`,
      `graphic-${this.nextIndex}`,
      node.x + 100,
      node.y,
      node.isLeaf,
      node.level
    );

    const splitIndex = this.tree.getSplitIndex();
    let risingKey: number;

    if (node.isLeaf) {
      // 叶子节点分裂
      risingKey = node.keys[splitIndex];
      
      // 创建右节点的可视化
      this.cmd('CreateBTreeNode',
        rightNode.graphicID,
        BTREE_CONSTANTS.WIDTH_PER_ELEM,
        BTREE_CONSTANTS.NODE_HEIGHT,
        node.numKeys - splitIndex,
        rightNode.x,
        rightNode.y,
        BTREE_CONSTANTS.BACKGROUND_COLOR,
        BTREE_CONSTANTS.FOREGROUND_COLOR
      );

      // 移动键值到右节点
      for (let i = splitIndex; i < node.numKeys; i++) {
        rightNode.keys[i - splitIndex] = node.keys[i];
        this.cmd('SetText', rightNode.graphicID, rightNode.keys[i - splitIndex].toString(), i - splitIndex);
      }
      rightNode.numKeys = node.numKeys - splitIndex;

      // 更新左节点
      node.numKeys = splitIndex;
      this.cmd('SetNumElements', node.graphicID, node.numKeys);

      // 更新叶子节点链表
      rightNode.next = node.next;
      node.next = rightNode;

      if (rightNode.next !== null) {
        this.cmd('Disconnect', node.graphicID, rightNode.next.graphicID);
        this.cmd('Connect', rightNode.graphicID, rightNode.next.graphicID,
          BTREE_CONSTANTS.FOREGROUND_COLOR, 0, 1, '', rightNode.numKeys);
      }
      this.cmd('Connect', node.graphicID, rightNode.graphicID,
        BTREE_CONSTANTS.FOREGROUND_COLOR, 0, 1, '', node.numKeys);
    } else {
      // 内部节点分裂
      risingKey = node.keys[splitIndex];

      // 创建右节点的可视化
      this.cmd('CreateBTreeNode',
        rightNode.graphicID,
        BTREE_CONSTANTS.WIDTH_PER_ELEM,
        BTREE_CONSTANTS.NODE_HEIGHT,
        node.numKeys - splitIndex - 1,
        rightNode.x,
        rightNode.y,
        BTREE_CONSTANTS.BACKGROUND_COLOR,
        BTREE_CONSTANTS.FOREGROUND_COLOR
      );

      // 移动键值到右节点
      for (let i = splitIndex + 1; i < node.numKeys; i++) {
        rightNode.keys[i - splitIndex - 1] = node.keys[i];
        this.cmd('SetText', rightNode.graphicID, rightNode.keys[i - splitIndex - 1].toString(), i - splitIndex - 1);
      }
      rightNode.numKeys = node.numKeys - splitIndex - 1;

      // 移动子节点到右节点
      for (let i = splitIndex + 1; i <= node.numKeys; i++) {
        rightNode.children[i - splitIndex - 1] = node.children[i];
        rightNode.children[i - splitIndex - 1].parent = rightNode;
        this.cmd('Disconnect', node.graphicID, node.children[i].graphicID);
        this.cmd('Connect', rightNode.graphicID, node.children[i].graphicID,
          BTREE_CONSTANTS.EDGE_COLOR, 0, 1, '');
      }

      // 更新左节点
      node.numKeys = splitIndex;
      node.children.length = splitIndex + 1;
      this.cmd('SetNumElements', node.graphicID, node.numKeys);
    }

    // 处理父节点
    if (node.parent === null) {
      // 创建新的根节点
      const newRoot = createBPlusNode(
        `node-${this.getNextIndex()}`,
        `graphic-${this.nextIndex}`,
        node.x,
        node.y - 50,
        false,
        node.level + 1
      );

      this.cmd('CreateBTreeNode',
        newRoot.graphicID,
        BTREE_CONSTANTS.WIDTH_PER_ELEM,
        BTREE_CONSTANTS.NODE_HEIGHT,
        1,
        newRoot.x,
        newRoot.y,
        BTREE_CONSTANTS.BACKGROUND_COLOR,
        BTREE_CONSTANTS.FOREGROUND_COLOR
      );

      newRoot.keys[0] = risingKey;
      newRoot.numKeys = 1;
      newRoot.children[0] = node;
      newRoot.children[1] = rightNode;

      node.parent = newRoot;
      rightNode.parent = newRoot;

      this.cmd('SetText', newRoot.graphicID, risingKey.toString(), 0);
      this.cmd('Connect', newRoot.graphicID, node.graphicID, BTREE_CONSTANTS.EDGE_COLOR, 0, 1, '');
      this.cmd('Connect', newRoot.graphicID, rightNode.graphicID, BTREE_CONSTANTS.EDGE_COLOR, 0, 1, '');

      return newRoot;
    } else {
      // 将上升的键插入到父节点
      rightNode.parent = node.parent;
      this.insertIntoParent(node.parent, risingKey, rightNode);
      return node.parent;
    }
  }

  /**
   * 将键插入到父节点
   */
  private insertIntoParent(parent: BPlusNode, key: number, rightChild: BPlusNode): void {
    // 找到插入位置
    let insertIndex = parent.numKeys;
    while (insertIndex > 0 && parent.keys[insertIndex - 1] > key) {
      parent.keys[insertIndex] = parent.keys[insertIndex - 1];
      parent.children[insertIndex + 1] = parent.children[insertIndex];
      this.cmd('SetText', parent.graphicID, parent.keys[insertIndex].toString(), insertIndex);
      insertIndex--;
    }

    parent.keys[insertIndex] = key;
    parent.children[insertIndex + 1] = rightChild;
    parent.numKeys++;

    this.cmd('SetNumElements', parent.graphicID, parent.numKeys);
    this.cmd('SetText', parent.graphicID, key.toString(), insertIndex);
    this.cmd('Connect', parent.graphicID, rightChild.graphicID, BTREE_CONSTANTS.EDGE_COLOR, 0, 1, '');
  }

  /**
   * 重新计算树的布局
   */
  private resizeTree(): void {
    this.cmd('ResizeTree');
    // 实际的布局计算将在可视化层处理
  }

  /**
   * 删除元素的主入口函数
   */
  public deleteElement(deleteValue: number): BPlusCommand[] {
    this.commands = [];

    this.cmd('SetMessage', `Deleting ${deleteValue}`);
    this.cmd('Step');

    if (this.tree.root === null) {
      this.cmd('SetMessage', 'Tree is empty');
      return this.getCommands();
    }

    const leafNode = this.tree.findLeafNode(deleteValue);
    if (!leafNode || this.tree.findKeyInNode(leafNode, deleteValue) === -1) {
      this.cmd('SetMessage', `Key ${deleteValue} not found`);
      return this.getCommands();
    }

    this.delete(leafNode, deleteValue);
    this.cmd('SetMessage', '');
    return this.getCommands();
  }

  /**
   * 删除操作的递归函数
   */
  private delete(node: BPlusNode, deleteValue: number): void {
    this.cmd('SetHighlight', node.graphicID, 1);
    this.cmd('Step');

    // 从节点中删除键值
    this.tree.removeKeyFromNode(node, deleteValue);
    this.cmd('SetNumElements', node.graphicID, node.numKeys);

    // 重新设置文本
    for (let i = 0; i < node.numKeys; i++) {
      this.cmd('SetText', node.graphicID, node.keys[i].toString(), i);
    }

    this.cmd('SetHighlight', node.graphicID, 0);

    // 检查是否需要重平衡
    if (this.tree.needsRebalance(node)) {
      this.deleteRepair(node);
    }

    this.resizeTree();
  }

  /**
   * 删除后的修复函数
   */
  private deleteRepair(node: BPlusNode): void {
    if (node === this.tree.root) {
      if (node.numKeys === 0 && node.children.length > 0) {
        // 根节点为空，提升子节点为新根
        this.tree.root = node.children[0];
        this.tree.root.parent = null;
        this.cmd('DeleteNode', node.graphicID);
      }
      return;
    }

    const { leftSibling, rightSibling, parentIndex } = this.tree.getSiblings(node);

    // 尝试从兄弟节点借键
    if (leftSibling && this.tree.canLendKey(leftSibling)) {
      this.borrowFromLeft(node, leftSibling, parentIndex);
    } else if (rightSibling && this.tree.canLendKey(rightSibling)) {
      this.borrowFromRight(node, rightSibling, parentIndex);
    } else {
      // 需要合并
      if (leftSibling) {
        this.mergeWithLeft(node, leftSibling, parentIndex);
      } else if (rightSibling) {
        this.mergeWithRight(node, rightSibling, parentIndex);
      }
    }
  }

  /**
   * 从左兄弟借键
   */
  private borrowFromLeft(node: BPlusNode, leftSibling: BPlusNode, parentIndex: number): void {
    this.cmd('SetMessage', 'Borrowing from left sibling');
    this.tree.borrowFromLeftSibling(node, leftSibling, parentIndex);
    
    // 更新可视化
    this.cmd('SetNumElements', leftSibling.graphicID, leftSibling.numKeys);
    this.cmd('SetNumElements', node.graphicID, node.numKeys);
    
    // 重新设置文本
    for (let i = 0; i < leftSibling.numKeys; i++) {
      this.cmd('SetText', leftSibling.graphicID, leftSibling.keys[i].toString(), i);
    }
    for (let i = 0; i < node.numKeys; i++) {
      this.cmd('SetText', node.graphicID, node.keys[i].toString(), i);
    }
  }

  /**
   * 从右兄弟借键
   */
  private borrowFromRight(node: BPlusNode, rightSibling: BPlusNode, parentIndex: number): void {
    this.cmd('SetMessage', 'Borrowing from right sibling');
    this.tree.borrowFromRightSibling(node, rightSibling, parentIndex);
    
    // 更新可视化
    this.cmd('SetNumElements', node.graphicID, node.numKeys);
    this.cmd('SetNumElements', rightSibling.graphicID, rightSibling.numKeys);
    
    // 重新设置文本
    for (let i = 0; i < node.numKeys; i++) {
      this.cmd('SetText', node.graphicID, node.keys[i].toString(), i);
    }
    for (let i = 0; i < rightSibling.numKeys; i++) {
      this.cmd('SetText', rightSibling.graphicID, rightSibling.keys[i].toString(), i);
    }
  }

  /**
   * 与左兄弟合并
   */
  private mergeWithLeft(node: BPlusNode, leftSibling: BPlusNode, parentIndex: number): void {
    this.cmd('SetMessage', 'Merging with left sibling');
    
    const parent = node.parent!;
    const separatorKey = node.isLeaf ? undefined : parent.keys[parentIndex - 1];
    
    this.tree.mergeNodes(leftSibling, node, separatorKey);
    
    // 更新可视化
    this.cmd('DeleteNode', node.graphicID);
    this.cmd('SetNumElements', leftSibling.graphicID, leftSibling.numKeys);
    
    // 重新设置文本
    for (let i = 0; i < leftSibling.numKeys; i++) {
      this.cmd('SetText', leftSibling.graphicID, leftSibling.keys[i].toString(), i);
    }
    
    // 从父节点删除分隔键
    if (!node.isLeaf) {
      this.tree.removeKeyFromNode(parent, separatorKey!);
      this.cmd('SetNumElements', parent.graphicID, parent.numKeys);
    }
    
    // 递归检查父节点
    if (this.tree.needsRebalance(parent)) {
      this.deleteRepair(parent);
    }
  }

  /**
   * 与右兄弟合并
   */
  private mergeWithRight(node: BPlusNode, rightSibling: BPlusNode, parentIndex: number): void {
    this.cmd('SetMessage', 'Merging with right sibling');
    
    const parent = node.parent!;
    const separatorKey = node.isLeaf ? undefined : parent.keys[parentIndex];
    
    this.tree.mergeNodes(node, rightSibling, separatorKey);
    
    // 更新可视化
    this.cmd('DeleteNode', rightSibling.graphicID);
    this.cmd('SetNumElements', node.graphicID, node.numKeys);
    
    // 重新设置文本
    for (let i = 0; i < node.numKeys; i++) {
      this.cmd('SetText', node.graphicID, node.keys[i].toString(), i);
    }
    
    // 从父节点删除分隔键
    if (!node.isLeaf) {
      this.tree.removeKeyFromNode(parent, separatorKey!);
      this.cmd('SetNumElements', parent.graphicID, parent.numKeys);
    }
    
    // 递归检查父节点
    if (this.tree.needsRebalance(parent)) {
      this.deleteRepair(parent);
    }
  }

  /**
   * 查找键值是否存在
   */
  public find(key: number): boolean {
    return this.tree.find(key);
  }

  /**
   * 清空树
   */
  public clear(): void {
    this.tree.clear();
  }

  /**
   * 获取所有键值
   */
  public getAllKeys(): number[] {
    return this.tree.getAllKeys();
  }
}
