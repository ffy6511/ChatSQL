import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BPlusNodeData } from '../utils/bPlusTreeToReactFlow';
import styles from './BPlusTreeVisualizer.module.css';

interface BPlusInternalNodeProps extends NodeProps<BPlusNodeData> {}

const BPlusInternalNode: React.FC<BPlusInternalNodeProps> = ({ data }) => {
  const { keys, pointers, isLeaf } = data;
  
  // 计算实际的键和指针数量
  const actualKeys = keys.filter(k => k !== null);
  const actualPointers = pointers.filter(p => p !== null);
  
  return (
    <div className={styles['bplus-internal-node']}>
      {/* 顶部连接点 */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={`${styles['bplus-handle']} ${styles['bplus-handle-target']}`}
      />

      <div className={styles['bplus-node-content']}>
        <div className={styles['bplus-node-header']}>
          <span className={styles['bplus-node-type']}>内部节点</span>
          <span className={styles['bplus-node-level']}>Level {data.level}</span>
        </div>

        <div className={styles['bplus-internal-layout']}>
          {/* 第一个指针 */}
          <div className={styles['bplus-pointer-cell']}>
            <div className={styles['bplus-pointer-content']}>
              {actualPointers[0] ? '●' : '_'}
            </div>
            {actualPointers[0] && (
              <Handle
                type="source"
                position={Position.Bottom}
                id="pointer-0"
                className={`${styles['bplus-handle']} ${styles['bplus-handle-source']}`}
                style={{ left: '50%', transform: 'translateX(-50%)' }}
              />
            )}
          </div>

          {/* 键和指针的交替布局 */}
          {keys.map((key, index) => (
            <React.Fragment key={index}>
              {/* 键槽位 */}
              <div className={styles['bplus-key-cell']}>
                <div className={styles['bplus-key-content']}>
                  {key !== null ? key : '_'}
                </div>
              </div>

              {/* 对应的指针槽位 */}
              {index + 1 < pointers.length && (
                <div className={styles['bplus-pointer-cell']}>
                  <div className={styles['bplus-pointer-content']}>
                    {pointers[index + 1] ? '●' : '_'}
                  </div>
                  {pointers[index + 1] && (
                    <Handle
                      type="source"
                      position={Position.Bottom}
                      id={`pointer-${index + 1}`}
                      className={`${styles['bplus-handle']} ${styles['bplus-handle-source']}`}
                      style={{ left: '50%', transform: 'translateX(-50%)' }}
                    />
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className={styles['bplus-node-info']}>
          <span>键: {actualKeys.length}/{keys.length}</span>
          <span>指针: {actualPointers.length}/{pointers.length}</span>
        </div>
      </div>
    </div>
  );
};

export default BPlusInternalNode;
