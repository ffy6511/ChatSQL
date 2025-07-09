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

    // 找到要插入的叶子节点
    const leafNode = yield* this.findLeafNode(key);

    // 检查键是否已存在
    if (leafNode.keys.includes(key)) {
      throw new Error(`键 ${key} 已存在`);
    }

    // 在叶子节点中插入键
    yield { type: 'insert_key', nodeId: leafNode.id, key };
    this.insertKeyIntoNode(leafNode, key);

    // 检查是否需要分裂
    if (leafNode.keys.length >= this.order) {
      yield* this.splitLeafNode(leafNode);
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

  // 分裂叶子节点
  private *splitLeafNode(node: BPlusTreeNode): Generator<AnimationStep, void, unknown> {
    const mid = Math.ceil(node.keys.length / 2);
    const newNode = this.createNode(true, node.level);
    
    // 分配键
    newNode.keys = node.keys.splice(mid);
    
    // 更新兄弟指针
    newNode.next = node.next;
    node.next = newNode.id;
    
    // 提升的键是新节点的第一个键
    const promotedKey = newNode.keys[0];
    
    yield { 
      type: 'split', 
      originalNodeId: node.id, 
      newNodeId: newNode.id, 
      promotedKey 
    };

    // 如果是根节点，创建新的根节点
    if (!node.parent) {
      const newRoot = this.createNode(false, node.level + 1);
      newRoot.keys.push(promotedKey);
      newRoot.pointers.push(node.id, newNode.id);
      
      node.parent = newRoot.id;
      newNode.parent = newRoot.id;
      this.root = newRoot;
    } else {
      // 向父节点插入提升的键
      const parent = this.allNodes.get(node.parent)!;
      newNode.parent = node.parent;
      yield* this.insertIntoInternalNode(parent, promotedKey, newNode.id);
    }
  }

  // 向内部节点插入键
  private *insertIntoInternalNode(
    node: BPlusTreeNode, 
    key: number, 
    rightChildId: string
  ): Generator<AnimationStep, void, unknown> {
    yield { type: 'insert_key', nodeId: node.id, key };
    
    // 找到插入位置
    let insertIndex = 0;
    while (insertIndex < node.keys.length && node.keys[insertIndex] < key) {
      insertIndex++;
    }
    
    // 插入键和指针
    node.keys.splice(insertIndex, 0, key);
    node.pointers.splice(insertIndex + 1, 0, rightChildId);

    // 检查是否需要分裂
    if (node.keys.length >= this.order) {
      yield* this.splitInternalNode(node);
    }
  }

  // 分裂内部节点
  private *splitInternalNode(node: BPlusTreeNode): Generator<AnimationStep, void, unknown> {
    const mid = Math.floor(node.keys.length / 2);
    const newNode = this.createNode(false, node.level);
    
    // 提升中间键
    const promotedKey = node.keys[mid];
    
    // 分配键和指针
    newNode.keys = node.keys.splice(mid + 1);
    newNode.pointers = node.pointers.splice(mid + 1);
    node.keys.splice(mid, 1); // 移除提升的键
    
    // 更新子节点的父指针
    newNode.pointers.forEach(pointerId => {
      if (pointerId) {
        const child = this.allNodes.get(pointerId);
        if (child) {
          child.parent = newNode.id;
        }
      }
    });
    
    yield { 
      type: 'split', 
      originalNodeId: node.id, 
      newNodeId: newNode.id, 
      promotedKey 
    };

    // 如果是根节点，创建新的根节点
    if (!node.parent) {
      const newRoot = this.createNode(false, node.level + 1);
      newRoot.keys.push(promotedKey);
      newRoot.pointers.push(node.id, newNode.id);
      
      node.parent = newRoot.id;
      newNode.parent = newRoot.id;
      this.root = newRoot;
    } else {
      // 向父节点插入提升的键
      const parent = this.allNodes.get(node.parent)!;
      newNode.parent = node.parent;
      yield* this.insertIntoInternalNode(parent, promotedKey, newNode.id);
    }
  }

  // 删除键值的生成器函数
  public *delete(key: number): Generator<AnimationStep, void, unknown> {
    if (!this.root) {
      throw new Error('树为空');
    }

    // 找到包含键的叶子节点
    const leafNode = yield* this.findLeafNode(key);

    // 检查键是否存在
    const keyIndex = leafNode.keys.indexOf(key);
    if (keyIndex === -1) {
      throw new Error(`键 ${key} 不存在`);
    }

    // 记录是否删除的是第一个键
    const isFirstKey = keyIndex === 0;

    // 从叶子节点删除键
    yield { type: 'delete_key', nodeId: leafNode.id, key };
    leafNode.keys.splice(keyIndex, 1);

    // 如果删除的是第一个键且节点还有其他键，需要更新父节点索引
    if (isFirstKey && leafNode.keys.length > 0 && leafNode.parent) {
      const newFirstKey = leafNode.keys[0];
      this.updateParentIndexKey(leafNode.id, newFirstKey);
      yield { type: 'update_parent', nodeId: leafNode.parent, newKey: newFirstKey };
    }

    // 检查是否需要重新平衡
    const minKeys = Math.ceil((this.order - 1) / 2);
    if (leafNode.keys.length < minKeys && leafNode !== this.root) {
      yield* this.rebalanceAfterDeletion(leafNode);
    }
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

  // 删除后重新平衡
  private *rebalanceAfterDeletion(node: BPlusTreeNode): Generator<AnimationStep, void, unknown> {
    // 如果是叶子节点且还有键，检查是否需要更新父节点索引
    if (node.isLeaf && node.keys.length > 0 && node.parent) {
      const newFirstKey = node.keys[0];
      this.updateParentIndexKey(node.id, newFirstKey);
      yield { type: 'update_parent', nodeId: node.parent, newKey: newFirstKey };
    }

    if (!node.parent) {
      // 如果是根节点且变空，则删除
      if (node.keys.length === 0 && node.pointers.length > 0) {
        this.root = this.allNodes.get(node.pointers[0]!)!;
        this.root.parent = null;
        this.allNodes.delete(node.id);
      }
      return;
    }

    const parent = this.allNodes.get(node.parent)!;
    const nodeIndex = parent.pointers.indexOf(node.id);

    // 尝试从右兄弟借
    const rightSiblingId = parent.pointers[nodeIndex + 1];
    if (rightSiblingId) {
      const rightSibling = this.allNodes.get(rightSiblingId)!;
      if (rightSibling.keys.length > Math.ceil((this.order - 1) / 2)) {
        yield* this.redistributeFromRight(node, rightSibling, parent, nodeIndex);
        return;
      }
    }

    // 尝试从左兄弟借
    const leftSiblingId = parent.pointers[nodeIndex - 1];
    if (leftSiblingId) {
      const leftSibling = this.allNodes.get(leftSiblingId)!;
      if (leftSibling.keys.length > Math.ceil((this.order - 1) / 2)) {
        yield* this.redistributeFromLeft(node, leftSibling, parent, nodeIndex);
        return;
      }
    }

    // 如果无法借用，则合并
    if (rightSiblingId) {
      const rightSibling = this.allNodes.get(rightSiblingId)!;
      yield* this.mergeNodes(node, rightSibling, parent, nodeIndex);
    } else if (leftSiblingId) {
      const leftSibling = this.allNodes.get(leftSiblingId)!;
      // 合并左兄弟时，将左兄弟合并到当前节点，然后删除左兄弟
      yield* this.mergeNodes(leftSibling, node, parent, nodeIndex - 1);
    }
  }

  // 从右兄弟借键
  private *redistributeFromRight(
    node: BPlusTreeNode,
    rightSibling: BPlusTreeNode,
    parent: BPlusTreeNode,
    parentIndex: number
  ): Generator<AnimationStep, void, unknown> {
    const keyToMove = rightSibling.keys.shift()!;
    yield { type: 'redistribute', fromNodeId: rightSibling.id, toNodeId: node.id, key: keyToMove };
    
    if (node.isLeaf) {
      node.keys.push(keyToMove);
      parent.keys[parentIndex] = rightSibling.keys[0];
    } else {
      const pointerToMove = rightSibling.pointers.shift()!;
      node.keys.push(parent.keys[parentIndex]);
      parent.keys[parentIndex] = keyToMove;
      node.pointers.push(pointerToMove);
      const child = this.allNodes.get(pointerToMove);
      if (child) child.parent = node.id;
    }
    yield { type: 'update_parent', nodeId: parent.id, newKey: parent.keys[parentIndex] };
  }

  // 从左兄弟借键
  private *redistributeFromLeft(
    node: BPlusTreeNode,
    leftSibling: BPlusTreeNode,
    parent: BPlusTreeNode,
    parentIndex: number
  ): Generator<AnimationStep, void, unknown> {
    const keyToMove = leftSibling.keys.pop()!;
    yield { type: 'redistribute', fromNodeId: leftSibling.id, toNodeId: node.id, key: keyToMove };

    if (node.isLeaf) {
      node.keys.unshift(keyToMove);
      parent.keys[parentIndex - 1] = node.keys[0];
    } else {
      const pointerToMove = leftSibling.pointers.pop()!;
      node.keys.unshift(parent.keys[parentIndex - 1]);
      parent.keys[parentIndex - 1] = keyToMove;
      node.pointers.unshift(pointerToMove);
      const child = this.allNodes.get(pointerToMove);
      if (child) child.parent = node.id;
    }
    yield { type: 'update_parent', nodeId: parent.id, newKey: parent.keys[parentIndex - 1] };
  }

  // 合并节点
  private *mergeNodes(
    leftNode: BPlusTreeNode,
    rightNode: BPlusTreeNode,
    parent: BPlusTreeNode,
    parentKeyIndex: number
  ): Generator<AnimationStep, void, unknown> {
    yield { type: 'merge', nodeId1: leftNode.id, nodeId2: rightNode.id, resultNodeId: leftNode.id };

    // 如果不是叶子节点，需要把父节点的key���拉下来
    if (!leftNode.isLeaf) {
      leftNode.keys.push(parent.keys[parentKeyIndex]);
    }

    // 合并键和指针
    leftNode.keys.push(...rightNode.keys);
    leftNode.pointers.push(...rightNode.pointers);

    // 更新子节点的父指针
    rightNode.pointers.forEach(pointerId => {
      if (pointerId) {
        const child = this.allNodes.get(pointerId);
        if (child) child.parent = leftNode.id;
      }
    });

    // 更新叶子节点的兄弟指针
    if (leftNode.isLeaf) {
      leftNode.next = rightNode.next;
    }

    // 从父节点删除key和指针
    parent.keys.splice(parentKeyIndex, 1);
    parent.pointers.splice(parentKeyIndex + 1, 1);

    // 删除右侧节点
    this.allNodes.delete(rightNode.id);

    // 递归检查父节点是否需要重新平衡
    const minKeys = Math.ceil((this.order - 1) / 2);
    if (parent.keys.length < minKeys && parent !== this.root) {
      yield* this.rebalanceAfterDeletion(parent);
    } else if (parent === this.root && parent.keys.length === 0) {
      // 如果根节点变空，更新根节点
      this.root = leftNode;
      leftNode.parent = null;
      this.allNodes.delete(parent.id);
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
