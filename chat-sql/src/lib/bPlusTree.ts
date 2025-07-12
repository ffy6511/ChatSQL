// B+树动画步骤类型定义
export type AnimationStep = 
  | { type: 'traverse', nodeId: string, path: string[] }
  | { type: 'insert_key', nodeId: string, key: number }
  | { type: 'split', originalNodeId: string, newNodeId: string, promotedKey: number }
  | { type: 'delete_key', nodeId: string, key: number }
  | { type: 'merge', nodeId1: string, nodeId2: string, resultNodeId: string }
  | { type: 'redistribute', fromNodeId: string, toNodeId: string, key: number }
  | { type: 'update_parent', nodeId: string, newKey: number };

// B+树节点接口
export interface BPlusTreeNode {
  id: string;
  keys: number[];
  pointers: (string | null)[];
  isLeaf: boolean;
  level: number;
  parent?: string | null;
  next?: string | null; // 叶子节点的兄弟指针
}

// B+树类
export class BPlusTree {
  private order: number;
  private root: BPlusTreeNode | null = null;
  private nodeCounter = 0;
  private allNodes: Map<string, BPlusTreeNode> = new Map();

  constructor(order: number = 3) {
    this.order = order;
  }

  // 创建新节点
  private createNode(isLeaf: boolean, level: number): BPlusTreeNode {
    const node: BPlusTreeNode = {
      id: `node-${this.nodeCounter++}`,
      keys: [],
      pointers: [],
      isLeaf,
      level,
      parent: null,
      next: null
    };

    this.allNodes.set(node.id, node);
    return node;
  }

  // 查找叶子节点
  private *findLeafNode(key: number): Generator<AnimationStep, BPlusTreeNode, unknown> {
    if (!this.root) {
      throw new Error('树为空');
    }

    let current = this.root;
    const path: string[] = [current.id];

    while (!current.isLeaf) {
      yield { type: 'traverse', nodeId: current.id, path: [...path] };

      // 找到合适的子节点
      let childIndex = 0;
      while (childIndex < current.keys.length && key >= current.keys[childIndex]) {
        childIndex++;
      }

      const childId = current.pointers[childIndex];
      if (!childId || !this.allNodes.has(childId)) {
        throw new Error('无效的子节点指针');
      }

      current = this.allNodes.get(childId)!;
      path.push(current.id);
    }

    yield { type: 'traverse', nodeId: current.id, path: [...path] };
    return current;
  }

  // 插入键值的生成器函数
  public *insert(key: number): Generator<AnimationStep, void, unknown> {
    // 如果树为空，创建根节点
    if (!this.root) {
      this.root = this.createNode(true, 0);
      this.root.keys.push(key);
      yield { type: 'insert_key', nodeId: this.root.id, key };
      return;
    }

    // 阶段1：查找阶段 - 完整执行findLeafNode生成器
    const findGenerator = this.findLeafNode(key);
    let findResult = findGenerator.next();

    // 消费所有traverse步骤
    while (!findResult.done) {
      yield findResult.value; // yield traverse步骤
      findResult = findGenerator.next();
    }

    // 获取查找结果：叶子节点
    const leafNode = findResult.value;

    // 检查键是否已存在
    if (leafNode.keys.includes(key)) {
      throw new Error(`键 ${key} 已存在`);
    }

    // 阶段2：更新阶段 - 自底向上
    // 1. 插入到叶子节点
    yield { type: 'insert_key', nodeId: leafNode.id, key };
    this.insertKeyIntoNode(leafNode, key);

    // 2. 逐层向上处理分裂
    let currentNode = leafNode;

    while (currentNode.keys.length >= this.order) {
      // 需要分裂当前节点
      const splitResult = this.performSplit(currentNode);
      yield {
        type: 'split',
        originalNodeId: currentNode.id,
        newNodeId: splitResult.newNode.id,
        promotedKey: splitResult.promotedKey
      };

      // 处理父节点
      if (!currentNode.parent) {
        // 根节点分裂，创建新根
        const newRoot = this.createNode(false, currentNode.level + 1);
        newRoot.keys.push(splitResult.promotedKey);
        newRoot.pointers.push(currentNode.id, splitResult.newNode.id);
        currentNode.parent = newRoot.id;
        splitResult.newNode.parent = newRoot.id;
        this.root = newRoot;
        break;
      } else {
        // 向父节点插入提升的键
        const parent = this.allNodes.get(currentNode.parent)!;
        this.insertKeyIntoNode(parent, splitResult.promotedKey);

        // 找到插入位置并插入指针
        let insertIndex = 0;
        while (insertIndex < parent.keys.length - 1 && splitResult.promotedKey > parent.keys[insertIndex]) {
          insertIndex++;
        }
        parent.pointers.splice(insertIndex + 1, 0, splitResult.newNode.id);
        splitResult.newNode.parent = parent.id;

        // 继续向上检查父节点
        currentNode = parent;
      }
    }
  }

  // 在节点中插入键（保持有序）
  private insertKeyIntoNode(node: BPlusTreeNode, key: number): void {
    let insertIndex = 0;
    while (insertIndex < node.keys.length && node.keys[insertIndex] < key) {
      insertIndex++;
    }
    node.keys.splice(insertIndex, 0, key);
  }

  // 获取从根到指定节点的路径
  private getPathToNode(nodeId: string): BPlusTreeNode[] {
    const path: BPlusTreeNode[] = [];
    let current = this.allNodes.get(nodeId);

    if (!current) return path;

    // 从叶子节点向上构建路径
    while (current) {
      path.unshift(current);
      if (current.parent) {
        current = this.allNodes.get(current.parent);
      } else {
        break;
      }
    }

    return path;
  }

  // 执行节点分裂操作
  private performSplit(node: BPlusTreeNode): { newNode: BPlusTreeNode; promotedKey: number } {
    if (node.isLeaf) {
      // 叶子节点分裂
      const mid = Math.ceil(node.keys.length / 2);
      const newNode = this.createNode(true, node.level);
      newNode.keys = node.keys.splice(mid);
      newNode.next = node.next;
      node.next = newNode.id;
      newNode.parent = node.parent;
      const promotedKey = newNode.keys[0];
      return { newNode, promotedKey };
    } else {
      // 内部节点分裂
      const mid = Math.floor(node.keys.length / 2);
      const newNode = this.createNode(false, node.level);
      const promotedKey = node.keys[mid];
      newNode.keys = node.keys.splice(mid + 1);
      newNode.pointers = node.pointers.splice(mid + 1);
      node.keys.splice(mid, 1); // 移除提升的键
      newNode.parent = node.parent;

      // 更新子节点的父指针
      newNode.pointers.forEach(pointerId => {
        if (pointerId) {
          const child = this.allNodes.get(pointerId);
          if (child) child.parent = newNode.id;
        }
      });

      return { newNode, promotedKey };
    }
  }



  // 删除键值的生成器函数
  public *delete(key: number): Generator<AnimationStep, void, unknown> {
    if (!this.root) {
      throw new Error('树为空');
    }

    // 阶段1：查找阶段 - 完整执行findLeafNode生成器
    const findGenerator = this.findLeafNode(key);
    let findResult = findGenerator.next();

    // 消费所有traverse步骤
    while (!findResult.done) {
      yield findResult.value; // yield traverse步骤
      findResult = findGenerator.next();
    }

    // 获取查找结果：叶子节点
    const leafNode = findResult.value;

    // 检查键是否存在
    const keyIndex = leafNode.keys.indexOf(key);
    if (keyIndex === -1) {
      throw new Error(`键 ${key} 不存在`);
    }

    // 阶段2：更新阶段 - 自底向上
    // 1. 删除叶子节点的键
    yield { type: 'delete_key', nodeId: leafNode.id, key };
    leafNode.keys.splice(keyIndex, 1);

    // 2. 如果删除的是第一个键且节点还有其他键，需要更新父节点索引
    if (leafNode.keys.length > 0 && leafNode.parent && keyIndex === 0) {
      const newFirstKey = leafNode.keys[0];
      this.updateParentIndexKey(leafNode.id, newFirstKey);
      yield { type: 'update_parent', nodeId: leafNode.parent, newKey: newFirstKey };
    }

    // 3. 逐层向上处理重平衡
    let currentNode = leafNode;

    while (currentNode !== this.root) {
      const minKeys = Math.ceil((this.order - 1) / 2);

      if (currentNode.keys.length >= minKeys) {
        // 当前节点键数足够，无需重平衡
        break;
      }

      // 需要重平衡
      const parent = this.allNodes.get(currentNode.parent!)!;
      const nodeIndex = parent.pointers.indexOf(currentNode.id);

      // 尝试从兄弟节点借键
      const borrowResult = this.tryBorrowFromSibling(currentNode, parent, nodeIndex);
      if (borrowResult.success) {
        yield* borrowResult.steps;
        break; // 借键成功，无需继续向上
      }

      // 无法借键，需要合并
      const mergeResult = this.performMerge(currentNode, parent, nodeIndex);
      yield* mergeResult.steps;

      // 继续向上检查父节点
      currentNode = parent;
    }

    // 检查根节点是否需要调整
    if (this.root && this.root.keys.length === 0 && this.root.pointers.length > 0) {
      const newRoot = this.allNodes.get(this.root.pointers[0]!)!;
      newRoot.parent = null;
      this.allNodes.delete(this.root.id);
      this.root = newRoot;
    }
  }

  // 尝试从兄弟节点借键
  private tryBorrowFromSibling(node: BPlusTreeNode, parent: BPlusTreeNode, nodeIndex: number):
    { success: boolean; steps: Generator<AnimationStep, void, unknown> } {
    const minKeys = Math.ceil((this.order - 1) / 2);

    // 尝试从右兄弟借键
    const rightSiblingId = parent.pointers[nodeIndex + 1];
    if (rightSiblingId) {
      const rightSibling = this.allNodes.get(rightSiblingId)!;
      if (rightSibling.keys.length > minKeys) {
        return {
          success: true,
          steps: this.borrowFromRightSibling(node, rightSibling, parent, nodeIndex)
        };
      }
    }

    // 尝试从左兄弟借键
    const leftSiblingId = parent.pointers[nodeIndex - 1];
    if (leftSiblingId) {
      const leftSibling = this.allNodes.get(leftSiblingId)!;
      if (leftSibling.keys.length > minKeys) {
        return {
          success: true,
          steps: this.borrowFromLeftSibling(node, leftSibling, parent, nodeIndex)
        };
      }
    }

    return { success: false, steps: (function*(){})() };
  }

  // 从右兄弟借键
  private *borrowFromRightSibling(node: BPlusTreeNode, rightSibling: BPlusTreeNode,
    parent: BPlusTreeNode, nodeIndex: number): Generator<AnimationStep, void, unknown> {
    const keyToMove = rightSibling.keys.shift()!;
    yield { type: 'redistribute', fromNodeId: rightSibling.id, toNodeId: node.id, key: keyToMove };

    if (node.isLeaf) {
      node.keys.push(keyToMove);
      parent.keys[nodeIndex] = rightSibling.keys[0];
    } else {
      const pointerToMove = rightSibling.pointers.shift()!;
      node.keys.push(parent.keys[nodeIndex]);
      parent.keys[nodeIndex] = keyToMove;
      node.pointers.push(pointerToMove);
      const child = this.allNodes.get(pointerToMove);
      if (child) child.parent = node.id;
    }

    yield { type: 'update_parent', nodeId: parent.id, newKey: parent.keys[nodeIndex] };
  }

  // 从左兄弟借键
  private *borrowFromLeftSibling(node: BPlusTreeNode, leftSibling: BPlusTreeNode,
    parent: BPlusTreeNode, nodeIndex: number): Generator<AnimationStep, void, unknown> {
    const keyToMove = leftSibling.keys.pop()!;
    yield { type: 'redistribute', fromNodeId: leftSibling.id, toNodeId: node.id, key: keyToMove };

    if (node.isLeaf) {
      node.keys.unshift(keyToMove);
      parent.keys[nodeIndex - 1] = node.keys[0];
    } else {
      const pointerToMove = leftSibling.pointers.pop()!;
      node.keys.unshift(parent.keys[nodeIndex - 1]);
      parent.keys[nodeIndex - 1] = keyToMove;
      node.pointers.unshift(pointerToMove);
      const child = this.allNodes.get(pointerToMove);
      if (child) child.parent = node.id;
    }

    yield { type: 'update_parent', nodeId: parent.id, newKey: parent.keys[nodeIndex - 1] };
  }

  // 执行合并操作
  private performMerge(node: BPlusTreeNode, parent: BPlusTreeNode, nodeIndex: number):
    { steps: Generator<AnimationStep, void, unknown> } {
    // 优先与右兄弟合并
    const rightSiblingId = parent.pointers[nodeIndex + 1];
    if (rightSiblingId) {
      const rightSibling = this.allNodes.get(rightSiblingId)!;
      return { steps: this.mergeWithRightSibling(node, rightSibling, parent, nodeIndex) };
    }

    // 与左兄弟合并
    const leftSiblingId = parent.pointers[nodeIndex - 1];
    if (leftSiblingId) {
      const leftSibling = this.allNodes.get(leftSiblingId)!;
      return { steps: this.mergeWithLeftSibling(node, leftSibling, parent, nodeIndex) };
    }

    return { steps: (function*(){})() };
  }

  // 与右兄弟合并
  private *mergeWithRightSibling(node: BPlusTreeNode, rightSibling: BPlusTreeNode,
    parent: BPlusTreeNode, nodeIndex: number): Generator<AnimationStep, void, unknown> {
    yield { type: 'merge', nodeId1: node.id, nodeId2: rightSibling.id, resultNodeId: node.id };

    if (node.isLeaf) {
      node.keys.push(...rightSibling.keys);
      node.next = rightSibling.next;
    } else {
      node.keys.push(parent.keys[nodeIndex]);
      node.keys.push(...rightSibling.keys);
      node.pointers.push(...rightSibling.pointers);

      // 更新子节点的父指针
      rightSibling.pointers.forEach(pointerId => {
        if (pointerId) {
          const child = this.allNodes.get(pointerId);
          if (child) child.parent = node.id;
        }
      });
    }

    parent.keys.splice(nodeIndex, 1);
    parent.pointers.splice(nodeIndex + 1, 1);
    this.allNodes.delete(rightSibling.id);
  }

  // 与左兄弟合并
  private *mergeWithLeftSibling(node: BPlusTreeNode, leftSibling: BPlusTreeNode,
    parent: BPlusTreeNode, nodeIndex: number): Generator<AnimationStep, void, unknown> {
    yield { type: 'merge', nodeId1: leftSibling.id, nodeId2: node.id, resultNodeId: leftSibling.id };

    if (node.isLeaf) {
      leftSibling.keys.push(...node.keys);
      leftSibling.next = node.next;
    } else {
      leftSibling.keys.push(parent.keys[nodeIndex - 1]);
      leftSibling.keys.push(...node.keys);
      leftSibling.pointers.push(...node.pointers);

      // 更新子节点的父指针
      node.pointers.forEach(pointerId => {
        if (pointerId) {
          const child = this.allNodes.get(pointerId);
          if (child) child.parent = leftSibling.id;
        }
      });
    }

    parent.keys.splice(nodeIndex - 1, 1);
    parent.pointers.splice(nodeIndex, 1);
    this.allNodes.delete(node.id);
  }

  // 更新父节点中指向该节点的索引键
  private updateParentIndexKey(nodeId: string, newFirstKey: number): void {
    const node = this.allNodes.get(nodeId);
    if (!node || !node.parent) {
      return;
    }

    const parent = this.allNodes.get(node.parent);
    if (!parent) {
      return;
    }

    // 找到父节点中指向该节点的指针位置
    const pointerIndex = parent.pointers.indexOf(nodeId);
    if (pointerIndex === -1) {
      return;
    }

    // 更新相应的索引键
    // 对于内部节点，第i个指针对应第i-1个键（第0个指针没有对应的键）
    if (pointerIndex > 0 && pointerIndex - 1 < parent.keys.length) {
      parent.keys[pointerIndex - 1] = newFirstKey;
    }
  }







  // 获取所有节点（用于可视化）
  public getAllNodes(): BPlusTreeNode[] {
    return Array.from(this.allNodes.values());
  }

  // 获取根节点
  public getRoot(): BPlusTreeNode | null {
    return this.root;
  }

  // 高效查找键是否存在
  public find(key: number): boolean {
    if (!this.root) {
      return false;
    }

    // 找到最左边的叶子节点
    let current = this.root;
    while (!current.isLeaf) {
      const firstChildId = current.pointers[0];
      if (!firstChildId || !this.allNodes.has(firstChildId)) {
        return false;
      }
      current = this.allNodes.get(firstChildId)!;
    }

    // 遍历所有叶子节点，查找指定键
    while (current) {
      // 检查当前叶子节点是否包含目标键
      if (current.keys.includes(key)) {
        return true;
      }

      // 移动到下一个叶子节点
      if (current.next && this.allNodes.has(current.next)) {
        current = this.allNodes.get(current.next)!;
      } else {
        break;
      }
    }

    return false;
  }

  // 获取所有键的排序数组
  public getAllKeys(): number[] {
    const keys: number[] = [];

    if (!this.root) {
      return keys;
    }

    // 找到最左边的叶子节点
    let current = this.root;
    while (!current.isLeaf) {
      const firstChildId = current.pointers[0];
      if (!firstChildId || !this.allNodes.has(firstChildId)) {
        break;
      }
      current = this.allNodes.get(firstChildId)!;
    }

    // 遍历所有叶子节点，收集键
    while (current) {
      // 添加当前叶子节点的所有键
      current.keys.forEach(key => {
        keys.push(key);
      });

      // 移动到下一个叶子节点
      if (current.next && this.allNodes.has(current.next)) {
        current = this.allNodes.get(current.next)!;
      } else {
        break;
      }
    }

    return keys.sort((a, b) => a - b);
  }

  // 清空树
  public clear(): void {
    this.root = null;
    this.allNodes.clear();
    this.nodeCounter = 0;
  }
}
