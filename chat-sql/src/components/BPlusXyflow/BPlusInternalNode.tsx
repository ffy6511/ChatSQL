import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styles from './BPlusTreeVisualizer.module.css';

interface BPlusNodeData {
  keys: (number | string | null)[];
  pointers: (string | null)[];
  isLeaf: boolean;
  level: number;
  order: number;
  highlighted?: boolean; // 添加高亮状态
  isOverflowing?: boolean; // 添加溢出状态字段
  keyHighlights?: boolean[]; // 添加键高亮状态数组
}

const BPlusInternalNode: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as unknown as BPlusNodeData;
  const { keys, pointers, order, highlighted, isOverflowing, keyHighlights } = nodeData;

  // 根据高亮状态和溢出状态确定CSS类名
  let nodeClassName = styles['bplus-internal-node'];
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

      {/* 第一个指针位置（左侧） */}
      {pointers[0] && (
        <Handle
          type="source"
          position={Position.Left}
          id="pointer-0"
          className={`${styles['bplus-handle']} ${styles['bplus-handle-source']}`}
          style={{ top: '50%', left: '-4px' }}
        />
      )}

      <div className={styles['bplus-node-content']}>
        <div className={styles['bplus-internal-layout']}>
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
                  {/* 键下方的指针连接点 */}
                  {pointers[index + 1] && (
                    <Handle
                      type="source"
                      position={Position.Bottom}
                      id={`pointer-${index + 1}`}
                      className={`${styles['bplus-handle']} ${styles['bplus-handle-source']}`}
                      style={{ left: '50%', transform: 'translateX(-50%)', bottom: '-8px' }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BPlusInternalNode;
