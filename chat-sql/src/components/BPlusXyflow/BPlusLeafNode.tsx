import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styles from './BPlusTreeVisualizer.module.css';

interface BPlusNodeData {
  keys: (number | string | null)[];
  pointers: (string | null)[];
  isLeaf: boolean;
  level: number;
  order: number;
}

const BPlusLeafNode: React.FC<NodeProps> = ({ data }) => {
  const nodeData = data as unknown as BPlusNodeData;
  const { keys, pointers, order } = nodeData;
  const siblingPointer = pointers[pointers.length - 1]; // 最后一个指针是兄弟指针

  return (
    <div className={styles['bplus-leaf-node']}>
      {/* 顶部连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`${styles['bplus-handle']} ${styles['bplus-handle-target']}`}
      />

      {/* 兄弟节点连接点 */}
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
            {Array.from({ length: order - 1 }, (_, index) => (
              <div
                key={index}
                className={`${styles['bplus-slot']} ${keys[index] === null ? styles['bplus-slot-empty'] : ''}`}
              >
                <div className={styles['bplus-slot-content']}>
                  {keys[index] !== null ? keys[index] : '\u00A0'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 兄弟指针 */}
        {siblingPointer && (
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
