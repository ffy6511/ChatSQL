import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styles from './BPlusTreeVisualizer.module.css';

// 1. 更新接口定义
interface BPlusNodeData {
  keys: (number | string | null)[];
  pointers: (string | null)[];
  isLeaf: boolean;
  level: number;
  next?: string | null;
  order: number;
  highlighted?: boolean; // 添加高亮状态
  isOverflowing?: boolean; // 添加溢出状态字段
  keyHighlights?: boolean[]; // 添加键高亮状态数组
}

const BPlusLeafNode: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as unknown as BPlusNodeData;
  const { keys, order, highlighted, isOverflowing, keyHighlights } = nodeData;

  // 根据高亮状态和溢出状态确定CSS类名
  let nodeClassName = styles['bplus-leaf-node'];
  if (highlighted) {
    nodeClassName += ` ${styles['bplus-node-highlighted']}`;
  }
  if (isOverflowing) {
    nodeClassName += ` ${styles['nodeOverflow']}`;
  }

  return (
    <div className={nodeClassName}>
      {/* 顶部连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`${styles['bplus-handle']} ${styles['bplus-handle-target']}`}
      />

      {/* 兄弟节点连接点 (用于被指向) */}
      <Handle
        type="target"
        position={Position.Left}
        id="sibling-target"
        className={`${styles['bplus-handle']} ${styles['bplus-handle-sibling']}`}
        style={{ top: '50%' }}
      />

      <div className={styles['bplus-node-content']}>
        <div className={styles['bplus-leaf-layout']}>
          {/* 槽位容器 */}
          <div className={styles['bplus-slot-container']}>
            {/* 溢出时渲染order个槽位，正常时渲染order-1个槽位 */}
            {Array.from({ length: isOverflowing ? order : order - 1 }, (_, index) => {
              const isKeyHighlighted = keyHighlights && keyHighlights[index];
              return (
                <div
                  key={index}
                  className={`${styles['bplus-slot']} ${keys[index] === null ? styles['bplus-slot-empty'] : ''} ${isKeyHighlighted ? styles['bplus-key-highlighted'] : ''}`}
                >
                  <div className={styles['bplus-slot-content']}>
                    {keys[index] !== null ? keys[index] : '\u00A0'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. 使用正确的条件渲染兄弟指针Handle */}
        {nodeData.next && (
          <Handle
            type="source"
            position={Position.Right}
            id="sibling"
            className={`${styles['bplus-handle']} ${styles['bplus-handle-sibling']}`}
            style={{ top: '50%' }}
          />
        )}
      </div>
    </div>
  );
};

export default BPlusLeafNode;