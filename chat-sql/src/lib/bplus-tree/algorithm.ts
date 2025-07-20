import { BPlusTreeCore } from './core';
import { BPlusCommand, BPlusNode, createBPlusNode, BTREE_CONSTANTS } from './commands';

/**
 * B+树算法类 - 完全重构版本
 * 实现完整的B+树插入、删除、分裂、合并算法
 */
export class BPlusTreeAlgorithm {
  private tree: BPlusTreeCore;
  private commands: BPlusCommand[] = [];
  private nextIndex: number = 1;
  private messageID: string = 'message';
  private startingX: number = 400;
  private startingY: number = BTREE_CONSTANTS.STARTING_Y;

  constructor(order: number) {
    this.tree = new BPlusTreeCore(order);
  }

  /**
   * 生成命令
   */
  private cmd(command: string, ...args: any[]): void {
    switch (command) {
      case 'SetMessage':
        this.commands.push({ type: 'SetMessage', text: args[0] });
        break;
      case 'SetText':
        this.commands.push({ type: 'SetText', target: args[0], text: args[1], index: args[2] });
        break;
      case 'SetHighlight':
        this.commands.push({ type: 'SetHighlight', nodeId: args[0], highlight: args[1] });
        break;
      case 'SetEdgeHighlight':
        this.commands.push({ type: 'SetEdgeHighlight', fromId: args[0], toId: args[1], highlight: args[2] });
        break;
      case 'CreateBTreeNode':
        this.commands.push({
          type: 'CreateBTreeNode',
          nodeId: args[0],
          width: args[1],
          height: args[2],
          numElements: args[3],
          x: args[4],
          y: args[5],
          backgroundColor: args[6],
          foregroundColor: args[7]
        });
        break;
      case 'SetNumElements':
        this.commands.push({ type: 'SetNumElements', nodeId: args[0], count: args[1] });
        break;
      case 'Connect':
        this.commands.push({
          type: 'Connect',
          fromId: args[0],
          toId: args[1],
          color: args[2],
          curve: args[3],
          directed: args[4],
          label: args[5],
          connectionPoint: args[6]
        });
        break;
      case 'Disconnect':
        this.commands.push({ type: 'Disconnect', fromId: args[0], toId: args[1] });
        break;
      case 'Delete':
        this.commands.push({ type: 'DeleteNode', nodeId: args[0] });
        break;
      case 'Step':
        this.commands.push({ type: 'Step' });
        break;
      case 'ResizeTree':
        this.commands.push({ type: 'ResizeTree' });
        break;
      default:
        console.warn(`Unknown command: ${command}`);
    }
  }

  /**
   * 获取下一个索引
   */
  private getNextIndex(): number {
    return this.nextIndex++;
  }

  /**
   * 获取命令序列
   */
  public getCommands(): BPlusCommand[] {
    return this.commands;
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
      this.cmd('SetNumElements', this.tree.root.graphicID, 1);
    } else {
      this.insert(this.tree.root, insertedValue);
      if (!this.tree.root.isLeaf) {
        this.resizeTree();
      }
    }

    this.cmd('SetMessage', '');
    return this.commands;
  }

  /**
   * 递归插入函数
   */
  private insert(node: BPlusNode, insertValue: number): void {
    this.cmd('SetHighlight', node.graphicID, true);
    this.cmd('Step');

    if (node.isLeaf) {
      // 叶子节点插入
      this.cmd('SetMessage', `Inserting ${insertValue}. Inserting into a leaf`);
      
      // 插入键值到正确位置
      this.tree.insertKeyIntoNode(node, insertValue);
      
      this.cmd('SetNumElements', node.graphicID, node.numKeys);
      
      console.log('node.keys:', node.keys, 'node.numKeys:', node.numKeys);

      
      // 更新可视化文本
      for (let i = 0; i < node.numKeys; i++) {
        const key = node.keys[i];
        this.cmd('SetText', node.graphicID, key != null ? key.toString() : '', i);
      }
      
      this.cmd('SetHighlight', node.graphicID, false);
      
      // 更新叶子节点链表连接
      if (node.next !== null) {
        this.cmd('Disconnect', node.graphicID, node.next.graphicID);
        this.cmd('Connect', node.graphicID, node.next.graphicID,
          BTREE_CONSTANTS.FOREGROUND_COLOR, 0, 1, '', node.numKeys);
      }
      
      this.resizeTree();
      this.insertRepair(node);
    } else {
      // 内部节点：找到子节点
      let findIndex = 0;
      while (findIndex < node.numKeys && node.keys[findIndex] < insertValue) {
        findIndex++;
      }
      
      this.cmd('SetEdgeHighlight', node.graphicID, node.children[findIndex].graphicID, true);
      this.cmd('Step');
      this.cmd('SetEdgeHighlight', node.graphicID, node.children[findIndex].graphicID, false);
      this.cmd('SetHighlight', node.graphicID, false);
      
      this.insert(node.children[findIndex], insertValue);
    }
  }

  /**
   * 插入修复 - 检查节点是否需要分裂
   */
  private insertRepair(node: BPlusNode): void {
    const maxKeys = this.tree.getOrder() - 1;
    
    if (node.numKeys <= maxKeys) {
      return;
    } else if (node.parent === null) {
      // 根节点分裂
      this.tree.root = this.split(node);
      return;
    } else {
      // 非根节点分裂
      const newParent = this.split(node);
      this.insertRepair(newParent);
    }
  }

  /**
   * 分裂节点
   */
  private split(node: BPlusNode): BPlusNode {
    this.cmd('SetMessage', 'Node contains too many keys. Splitting...');
    this.cmd('SetHighlight', node.graphicID, true);
    this.cmd('Step');
    this.cmd('SetHighlight', node.graphicID, false);

    const order = this.tree.getOrder();
    const splitIndex = Math.floor(order / 2);
    
    // 创建右节点
    const rightNode = createBPlusNode(
      `node-${this.getNextIndex()}`,
      `graphic-${this.nextIndex}`,
      node.x + 100,
      node.y,
      node.isLeaf,
      node.level
    );

    this.cmd('CreateBTreeNode',
      rightNode.graphicID,
      BTREE_CONSTANTS.WIDTH_PER_ELEM,
      BTREE_CONSTANTS.NODE_HEIGHT,
      order - splitIndex,
      rightNode.x,
      rightNode.y,
      BTREE_CONSTANTS.BACKGROUND_COLOR,
      BTREE_CONSTANTS.FOREGROUND_COLOR
    );

    let risingKey: number;

    if (node.isLeaf) {
      // 叶子节点分裂：复制分裂点及之后的键
      risingKey = node.keys[splitIndex];
      
      // 复制键值到右节点
      for (let i = splitIndex; i < node.numKeys; i++) {
        const keyValue = node.keys[i];
        if (keyValue !== undefined && keyValue !== null) {
          rightNode.keys[i - splitIndex] = keyValue;
          this.cmd('SetText', rightNode.graphicID, keyValue.toString(), i - splitIndex);
        }
      }
      rightNode.numKeys = node.numKeys - splitIndex;
      
      // 更新左节点
      node.numKeys = splitIndex;
      this.cmd('SetNumElements', node.graphicID, node.numKeys);
      this.cmd('SetNumElements', rightNode.graphicID, rightNode.numKeys);
      
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
      // 内部节点分裂：上浮中间键
      risingKey = node.keys[splitIndex];
      
      // 复制键值到右节点（跳过上浮的键）
      for (let i = splitIndex + 1; i < node.numKeys; i++) {
        const keyValue = node.keys[i];
        if (keyValue !== undefined && keyValue !== null) {
          rightNode.keys[i - splitIndex - 1] = keyValue;
          this.cmd('SetText', rightNode.graphicID, keyValue.toString(), i - splitIndex - 1);
        }
      }
      rightNode.numKeys = node.numKeys - splitIndex - 1;
      
      // 复制子节点到右节点
      for (let i = splitIndex + 1; i <= node.numKeys; i++) {
        rightNode.children[i - splitIndex - 1] = node.children[i];
        if (rightNode.children[i - splitIndex - 1]) {
          rightNode.children[i - splitIndex - 1].parent = rightNode;
        }
      }
      
      // 更新左节点
      node.numKeys = splitIndex;
      this.cmd('SetNumElements', node.graphicID, node.numKeys);
      this.cmd('SetNumElements', rightNode.graphicID, rightNode.numKeys);
    }

    // 处理父节点
    if (node.parent === null) {
      // 创建新的根节点
      const newRoot = createBPlusNode(
        `node-${this.getNextIndex()}`,
        `graphic-${this.nextIndex}`,
        node.x,
        node.y - BTREE_CONSTANTS.HEIGHT_DELTA,
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
      this.cmd('SetNumElements', newRoot.graphicID, 1);
      this.cmd('Connect', newRoot.graphicID, node.graphicID,
        BTREE_CONSTANTS.FOREGROUND_COLOR, 0, 1, '', 0);
      this.cmd('Connect', newRoot.graphicID, rightNode.graphicID,
        BTREE_CONSTANTS.FOREGROUND_COLOR, 0, 1, '', 1);
      
      return newRoot;
    } else {
      // 插入到现有父节点
      const parent = node.parent;
      rightNode.parent = parent;
      
      // 在父节点中找到插入位置
      let insertIndex = parent.numKeys;
      while (insertIndex > 0 && parent.keys[insertIndex - 1] > risingKey) {
        parent.keys[insertIndex] = parent.keys[insertIndex - 1];
        parent.children[insertIndex + 1] = parent.children[insertIndex];
        const key = parent.keys[insertIndex];
        this.cmd('SetText', parent.graphicID, key != null ? key.toString() : '', insertIndex);
        insertIndex--;
      }
      
      parent.keys[insertIndex] = risingKey;
      parent.children[insertIndex + 1] = rightNode;
      parent.numKeys++;
      
      this.cmd('SetText', parent.graphicID, risingKey.toString(), insertIndex);
      this.cmd('SetNumElements', parent.graphicID, parent.numKeys);
      this.cmd('Connect', parent.graphicID, rightNode.graphicID,
        BTREE_CONSTANTS.FOREGROUND_COLOR, 0, 1, '', insertIndex + 1);
      
      return parent;
    }
  }

  /**
   * 重新计算树的布局
   */
  private resizeTree(): void {
    this.cmd('ResizeTree');
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

  /**
   * 获取树的根节点
   */
  public getRoot(): BPlusNode | null {
    return this.tree.root;
  }

  /**
   * 获取树中的所有节点
   */
  public getAllNodes(): BPlusNode[] {
    const nodes: BPlusNode[] = [];
    if (this.tree.root) {
      this.collectAllNodes(this.tree.root, nodes);
    }
    return nodes;
  }

  /**
   * 递归收集所有节点
   */
  private collectAllNodes(node: BPlusNode, nodes: BPlusNode[]): void {
    nodes.push(node);
    if (!node.isLeaf) {
      for (let i = 0; i <= node.numKeys; i++) {
        if (node.children[i]) {
          this.collectAllNodes(node.children[i], nodes);
        }
      }
    }
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
      this.cmd('Step');
      return this.commands;
    }

    const leafNode = this.tree.findLeafNode(deleteValue);
    if (!leafNode || this.tree.findKeyInNode(leafNode, deleteValue) === -1) {
      this.cmd('SetMessage', `Key ${deleteValue} not found`);
      this.cmd('Step');
      return this.commands;
    }

    this.delete(leafNode, deleteValue);
    this.cmd('SetMessage', '');
    return this.commands;
  }

  /**
   * 删除操作的递归函数
   */
  private delete(node: BPlusNode, deleteValue: number): void {
    this.cmd('SetHighlight', node.graphicID, true);
    this.cmd('Step');

    // 从节点中删除键值
    const keyIndex = this.tree.findKeyInNode(node, deleteValue);
    this.tree.removeKeyFromNode(node, deleteValue);
  

    // 更新可视化
    for (let i = keyIndex; i < node.numKeys; i++) {
      const key = node.keys[i];
      this.cmd('SetText', node.graphicID, key != null ? key.toString() : '', i);
    }
    this.cmd('SetText', node.graphicID, '', node.numKeys);
    this.cmd('SetNumElements', node.graphicID, node.numKeys);

    this.cmd('SetHighlight', node.graphicID, false);

    // 处理删除第一个键值的情况
    if (keyIndex === 0 && node.parent !== null) {
      this.updateParentKeys(node, deleteValue);
    }

    // 检查是否需要修复
    this.repairAfterDelete(node);
    this.resizeTree();
  }

  /**
   * 更新父节点中的键值（当删除第一个键时）
   */
  private updateParentKeys(node: BPlusNode, deletedValue: number): void {
    if (!node.parent) return;

    let currentNode = node;
    // 由于上面已经检查了 node.parent 不为 null，这里可以安全地断言
    let parentNode = currentNode.parent as BPlusNode;
    let parentIndex: number;
    let nextSmallest: number | null = null;

    // 找到对应的index
    parentIndex = parentNode.children.indexOf(currentNode);

    // 如果当前节点在删除之后没有key
    if (currentNode.numKeys == 0) {
      // 如果当前节点没有右兄弟
      if (parentIndex == parentNode.numKeys)
        nextSmallest = null;
      else {
        // 取右兄弟的第一个key
        nextSmallest = parentNode.children[parentIndex + 1].keys[0];
      }
    } else {
      // 如果节点非空, 取删除之后的第一个key
      nextSmallest = currentNode.keys[0];
    }

    if (nextSmallest == null) return;

    while (parentNode != null) {
      if (parentIndex > 0 && parentNode.keys[parentIndex - 1] == deletedValue) {
        parentNode.keys[parentIndex - 1] = nextSmallest; // to fix
        this.cmd("SetText", parentNode.graphicID, parentNode.keys[parentIndex - 1], parentIndex - 1);
        return;
      }
      let grandParent: BPlusNode;
      if (parentNode.parent == null) break;
      
      grandParent = parentNode.parent;

      parentIndex = grandParent.children.indexOf(parentNode);
      
      // 移动到上一层
      parentNode = grandParent;
    }
  }

  /**
   * 删除后的修复函数
   */
  private repairAfterDelete(node: BPlusNode): void {
    const minKeys = Math.floor((this.tree.getOrder() - 1) / 2);

    if (node.parent === null) {
      // 根节点特殊处理
      if (node.numKeys === 0 && !node.isLeaf) {
        // 根节点为空且不是叶子节点，提升子节点为新根
        this.tree.root = node.children[0];
        this.tree.root.parent = null;
        this.cmd('Delete', node.graphicID);
      }
      return;
    }

    if (node.numKeys >= minKeys) {
      return; // 不需要修复
    }

    // 找到当前节点在父节点中的索引
    const parent = node.parent;
    let nodeIndex = 0;
    while (nodeIndex <= parent.numKeys && parent.children[nodeIndex] !== node) {
      nodeIndex++;
    }

    // 尝试从左兄弟借键
    if (nodeIndex > 0 && parent.children[nodeIndex - 1].numKeys > minKeys) {
      this.stealFromLeft(node, nodeIndex);
    }
    // 尝试从右兄弟借键
    else if (nodeIndex < parent.numKeys && parent.children[nodeIndex + 1].numKeys > minKeys) {
      this.stealFromRight(node, nodeIndex);
    }
    // 与左兄弟合并
    else if (nodeIndex > 0) {
      const newNode = this.mergeWithLeft(node, nodeIndex);
      this.repairAfterDelete(newNode.parent!);
    }
    // 与右兄弟合并
    else {
      const newNode = this.mergeWithRight(node, nodeIndex);
      this.repairAfterDelete(newNode.parent!);
    }
  }

  /**
   * 从左兄弟借键
   */
  private stealFromLeft(node: BPlusNode, nodeIndex: number): void {
    const parent = node.parent!;
    const leftSibling = parent.children[nodeIndex - 1];

    this.cmd('SetMessage', 'Stealing from left sibling');
    this.cmd('SetHighlight', leftSibling.graphicID, true);
    this.cmd('Step');

    // 右移当前节点的键
    for (let i = node.numKeys; i > 0; i--) {
      node.keys[i] = node.keys[i - 1];
      const key = node.keys[i];
      this.cmd('SetText', node.graphicID, key != null ? key.toString() : '', i);
    }

    if (node.isLeaf) {
      // 叶子节点：直接移动键
      node.keys[0] = leftSibling.keys[leftSibling.numKeys - 1];
      parent.keys[nodeIndex - 1] = leftSibling.keys[leftSibling.numKeys - 1];
    } else {
      // 内部节点：从父节点下移键，左兄弟上移键
      node.keys[0] = parent.keys[nodeIndex - 1];
      parent.keys[nodeIndex - 1] = leftSibling.keys[leftSibling.numKeys - 1];

      // 移动子节点
      for (let i = node.numKeys + 1; i > 0; i--) {
        node.children[i] = node.children[i - 1];
      }
      node.children[0] = leftSibling.children[leftSibling.numKeys];
      if (node.children[0]) {
        node.children[0].parent = node;
      }
    }

    node.numKeys++;
    leftSibling.numKeys--;

    // 更新可视化
    this.cmd('SetText', node.graphicID, node.keys[0].toString(), 0);
    this.cmd('SetText', parent.graphicID, parent.keys[nodeIndex - 1].toString(), nodeIndex - 1);
    this.cmd('SetText', leftSibling.graphicID, '', leftSibling.numKeys);
    this.cmd('SetNumElements', node.graphicID, node.numKeys);
    this.cmd('SetNumElements', leftSibling.graphicID, leftSibling.numKeys);

    this.cmd('SetHighlight', leftSibling.graphicID, false);
  }

  /**
   * 从右兄弟借键
   */
  private stealFromRight(node: BPlusNode, nodeIndex: number): void {
    const parent = node.parent!;
    const rightSibling = parent.children[nodeIndex + 1];

    this.cmd('SetMessage', 'Stealing from right sibling');
    this.cmd('SetHighlight', rightSibling.graphicID, true);
    this.cmd('Step');

    if (node.isLeaf) {
      // 叶子节点：直接移动键
      node.keys[node.numKeys] = rightSibling.keys[0];
      parent.keys[nodeIndex] = rightSibling.keys[1] || rightSibling.keys[0];
    } else {
      // 内部节点：从父节点下移键，右兄弟上移键
      node.keys[node.numKeys] = parent.keys[nodeIndex];
      parent.keys[nodeIndex] = rightSibling.keys[0];

      // 移动子节点
      node.children[node.numKeys + 1] = rightSibling.children[0];
      if (node.children[node.numKeys + 1]) {
        node.children[node.numKeys + 1].parent = node;
      }

      // 左移右兄弟的子节点
      for (let i = 0; i < rightSibling.numKeys; i++) {
        rightSibling.children[i] = rightSibling.children[i + 1];
      }
    }

    // 左移右兄弟的键
    for (let i = 0; i < rightSibling.numKeys - 1; i++) {
      rightSibling.keys[i] = rightSibling.keys[i + 1];
      this.cmd('SetText', rightSibling.graphicID, rightSibling.keys[i].toString(), i);
    }

    node.numKeys++;
    rightSibling.numKeys--;

    // 更新可视化
    this.cmd('SetText', node.graphicID, node.keys[node.numKeys - 1].toString(), node.numKeys - 1);
    this.cmd('SetText', parent.graphicID, parent.keys[nodeIndex].toString(), nodeIndex);
    this.cmd('SetText', rightSibling.graphicID, '', rightSibling.numKeys);
    this.cmd('SetNumElements', node.graphicID, node.numKeys);
    this.cmd('SetNumElements', rightSibling.graphicID, rightSibling.numKeys);

    this.cmd('SetHighlight', rightSibling.graphicID, false);
  }

  /**
   * 与左兄弟合并
   */
  private mergeWithLeft(node: BPlusNode, nodeIndex: number): BPlusNode {
    const parent = node.parent!;
    const leftSibling = parent.children[nodeIndex - 1];

    this.cmd('SetMessage', 'Merging with left sibling');
    this.cmd('SetHighlight', leftSibling.graphicID, true);
    this.cmd('SetHighlight', node.graphicID, true);
    this.cmd('Step');

    if (!node.isLeaf) {
      // 内部节点：下移父节点的键
      leftSibling.keys[leftSibling.numKeys] = parent.keys[nodeIndex - 1];
      leftSibling.numKeys++;
    }

    // 移动当前节点的键到左兄弟
    for (let i = 0; i < node.numKeys; i++) {
      const key = node.keys[i];
      if (key != null) {
        leftSibling.keys[leftSibling.numKeys] = key;
        this.cmd('SetText', leftSibling.graphicID, key.toString(), leftSibling.numKeys);
        leftSibling.numKeys++;
      }
    }

    // 移动子节点（如果是内部节点）
    if (!node.isLeaf) {
      for (let i = 0; i <= node.numKeys; i++) {
        leftSibling.children[leftSibling.numKeys - node.numKeys + i] = node.children[i];
        if (node.children[i]) {
          node.children[i].parent = leftSibling;
        }
      }
    } else {
      // 更新叶子节点链表
      leftSibling.next = node.next;
      if (node.next) {
        this.cmd('Disconnect', node.graphicID, node.next.graphicID);
        this.cmd('Connect', leftSibling.graphicID, node.next.graphicID,
          BTREE_CONSTANTS.FOREGROUND_COLOR, 0, 1, '', leftSibling.numKeys);
      }
    }

    // 从父节点删除键和子节点引用
    for (let i = nodeIndex - 1; i < parent.numKeys - 1; i++) {
      parent.keys[i] = parent.keys[i + 1];
      parent.children[i + 1] = parent.children[i + 2];
      this.cmd('SetText', parent.graphicID, parent.keys[i].toString(), i);
    }
    parent.numKeys--;

    // 删除当前节点的可视化
    this.cmd('Delete', node.graphicID);

    // 更新可视化
    this.cmd('SetNumElements', leftSibling.graphicID, leftSibling.numKeys);
    this.cmd('SetNumElements', parent.graphicID, parent.numKeys);
    this.cmd('SetText', parent.graphicID, '', parent.numKeys);

    this.cmd('SetHighlight', leftSibling.graphicID, false);

    return leftSibling;
  }

  /**
   * 与右兄弟合并
   */
  private mergeWithRight(node: BPlusNode, nodeIndex: number): BPlusNode {
    const parent = node.parent!;
    const rightSibling = parent.children[nodeIndex + 1];

    this.cmd('SetMessage', 'Merging with right sibling');
    this.cmd('SetHighlight', node.graphicID, true);
    this.cmd('SetHighlight', rightSibling.graphicID, true);
    this.cmd('Step');

    if (!node.isLeaf) {
      // 内部节点：下移父节点的键
      node.keys[node.numKeys] = parent.keys[nodeIndex];
      node.numKeys++;
    }

    // 移动右兄弟的键到当前节点
    for (let i = 0; i < rightSibling.numKeys; i++) {
      node.keys[node.numKeys] = rightSibling.keys[i];
      this.cmd('SetText', node.graphicID, node.keys[node.numKeys].toString(), node.numKeys);
      node.numKeys++;
    }

    // 移动子节点（如果是内部节点）
    if (!node.isLeaf) {
      for (let i = 0; i <= rightSibling.numKeys; i++) {
        node.children[node.numKeys - rightSibling.numKeys + i] = rightSibling.children[i];
        if (rightSibling.children[i]) {
          rightSibling.children[i].parent = node;
        }
      }
    } else {
      // 更新叶子节点链表
      node.next = rightSibling.next;
      if (rightSibling.next) {
        this.cmd('Disconnect', rightSibling.graphicID, rightSibling.next.graphicID);
        this.cmd('Connect', node.graphicID, rightSibling.next.graphicID,
          BTREE_CONSTANTS.FOREGROUND_COLOR, 0, 1, '', node.numKeys);
      }
    }

    // 从父节点删除键和子节点引用
    for (let i = nodeIndex; i < parent.numKeys - 1; i++) {
      parent.keys[i] = parent.keys[i + 1];
      parent.children[i + 1] = parent.children[i + 2];
      this.cmd('SetText', parent.graphicID, parent.keys[i].toString(), i);
    }
    parent.numKeys--;

    // 删除右兄弟的可视化
    this.cmd('Delete', rightSibling.graphicID);

    // 更新可视化
    this.cmd('SetNumElements', node.graphicID, node.numKeys);
    this.cmd('SetNumElements', parent.graphicID, parent.numKeys);
    this.cmd('SetText', parent.graphicID, '', parent.numKeys);

    this.cmd('SetHighlight', node.graphicID, false);

    return node;
  }
}
