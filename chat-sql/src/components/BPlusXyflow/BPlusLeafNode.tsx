import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BPlusNodeData } from '../utils/bPlusTreeToReactFlow';
import styles from './BPlusTreeVisualizer.module.css';

interface BPlusLeafNodeProps extends NodeProps<BPlusNodeData> {}

const BPlusLeafNode: React.FC<BPlusLeafNodeProps> = ({ data }) => {
  const { keys, pointers, isLeaf } = data;
  
  // 计算实际的键数量
  const actualKeys = keys.filter(k => k !== null);
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
        <div className={styles['bplus-node-header']}>
          <span className={styles['bplus-node-type']}>叶子节点</span>
          <span className={styles['bplus-node-level']}>Level {data.level}</span>
        </div>

        <div className={styles['bplus-leaf-layout']}>
          {/* 键值对布局 */}
          <div className={styles['bplus-key-value-pairs']}>
            {keys.map((key, index) => (
              <div key={index} className={styles['bplus-key-value-pair']}>
                <div className={styles['bplus-key-cell']}>
                  <div className={styles['bplus-key-content']}>
                    {key !== null ? key : '_'}
                  </div>
                </div>
                <div className={styles['bplus-value-cell']}>
                  <div className={styles['bplus-value-content']}>
                    {key !== null ? `V${key}` : '_'}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 兄弟指针区域 */}
          <div className={styles['bplus-sibling-pointer']}>
            <div className={styles['bplus-sibling-label']}>Next</div>
            <div className={styles['bplus-sibling-content']}>
              {siblingPointer ? '→' : '∅'}
            </div>
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

        <div className={styles['bplus-node-info']}>
          <span>键: {actualKeys.length}/{keys.length}</span>
          <span>兄弟: {siblingPointer ? '有' : '无'}</span>
        </div>
      </div>
    </div>
  );
};

export default BPlusLeafNode;
