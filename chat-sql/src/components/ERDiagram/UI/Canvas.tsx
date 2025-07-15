'use client';

import React, { useRef, useCallback } from 'react';
import { Empty } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import ERDiagram from '@/components/ERDiagram/ERDiagram';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import styles from './Canvas.module.css';

interface CanvasProps {
  hasData?: boolean;
}

// 画布组件（移除拖放功能，由ERDiagram组件统一处理）
const CanvasWithDrop: React.FC<CanvasProps> = ({ hasData = true }) => {
  const { state, setSelectedElement, startEditNode } = useERDiagramContext();
  const canvasRef = useRef<HTMLDivElement>(null);

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
      className={styles.canvasContainer}
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
