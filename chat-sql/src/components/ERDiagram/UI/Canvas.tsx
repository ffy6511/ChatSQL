'use client';

import React, { useRef, useCallback, useState } from 'react';
import { Empty } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import ERDiagram from '@/components/ERDiagram/ERDiagram';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import {
  createDefaultEntity,
  createDefaultRelationship,
  calculateDropPosition,
  validateDragData
} from '@/components/ERDiagram/utils/nodeFactory';
import styles from './Canvas.module.css';

interface CanvasProps {
  hasData?: boolean;
}

// 带拖放功能的画布组件
const CanvasWithDrop: React.FC<CanvasProps> = ({ hasData = true }) => {
  const { state, setSelectedElement, addEntity, addRelationship, startEditNode } = useERDiagramContext();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // 处理拖拽进入
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  }, []);

  // 处理拖拽离开
  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  // 处理拖放
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const nodeType = validateDragData(event.dataTransfer);
    if (!nodeType || !canvasRef.current) return;

    // 获取画布位置信息
    const canvasRect = canvasRef.current.getBoundingClientRect();

    // 计算拖放位置（简化版本，不考虑viewport）
    const position = calculateDropPosition(event.nativeEvent, canvasRect);

    // 根据节点类型创建相应的实体或关系
    if (nodeType === 'entity') {
      const newEntity = createDefaultEntity(position);
      addEntity(newEntity);
    } else if (nodeType === 'diamond') {
      const newRelationship = createDefaultRelationship(position);
      addRelationship(newRelationship);
    }
  }, [addEntity, addRelationship]);

  // 处理节点双击事件
  const handleNodeDoubleClick = useCallback((node: any) => {
    console.log('Canvas: Node double clicked:', node);
    // 启动节点编辑模式
    startEditNode(node.id, 'rename');
  }, [startEditNode]);

  if (!hasData) {
    return (
      <div className={styles.canvasContainer}>
        <div className={styles.canvasContent}>
          <Empty
            image={<DatabaseOutlined className={styles.emptyIcon} />}
            description={
              <div className={styles.emptyDescription}>
                <h3>ER图画布</h3>
                <p>从左侧组件库拖拽组件到此处开始创建ER图</p>
                <p>或者点击"新建图表"创建一个新的ER图</p>
              </div>
            }
          />
        </div>

        {/* 临时网格背景，便于查看布局 */}
        <div className={styles.gridBackground}></div>
      </div>
    );
  }

  if (!state.diagramData) {
    return (
      <div className={styles.canvasContainer}>
        <div className={styles.canvasContent}>
          <Empty
            image={<DatabaseOutlined className={styles.emptyIcon} />}
            description={
              <div className={styles.emptyDescription}>
                <h3>ER图画布</h3>
                <p>暂无数据</p>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className={`${styles.canvasContainer} ${isDragOver ? styles.dragOver : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <ERDiagram
        data={state.diagramData}
        showControls={true}
        showBackground={true}
        onNodeClick={(node) => {
          console.log('节点被点击:', node);
          setSelectedElement(node.id);
        }}
        onEdgeClick={(edge) => {
          console.log('边被点击:', edge);
          setSelectedElement(edge.id);
        }}
        onNodeDoubleClick={handleNodeDoubleClick}
      />

      {/* 拖拽提示覆盖层 */}
      {isDragOver && (
        <div className={styles.dropOverlay}>
          <div className={styles.dropMessage}>
            <DatabaseOutlined className={styles.dropIcon} />
            <span>释放以添加组件</span>
          </div>
        </div>
      )}
    </div>
  );
};

// 主Canvas组件，包装ReactFlowProvider
const Canvas: React.FC<CanvasProps> = (props) => {
  return (
    <CanvasWithDrop {...props} />
  );
};

export default Canvas;
