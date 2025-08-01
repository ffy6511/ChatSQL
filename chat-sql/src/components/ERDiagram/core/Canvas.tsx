'use client';

import React, { useRef, useCallback } from 'react';
import { Empty } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { AccountTree as AccountTreeIcon, Add, Add as AddIcon } from '@mui/icons-material';
import ERDiagram from '@/components/ERDiagram/canvasRelated/ERDiagram';
import EmptyState from '@/components/common/EmptyState';
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


  // 检查是否选中图表
  const noSelected = !state.currentDiagramId && !state.diagramData;
  if (noSelected) {
    return (
      <div
        ref={canvasRef}
        className={styles.canvasContainer}
      >
        <EmptyState
          mainIcon={<AccountTreeIcon />}
          secondaryIcon = {<AddIcon />}
          title="开始创建您的ER图"
          subTitle="新建图表 => 选中'组件库' => 拖拽组件到画布"
          description="您可以添加强实体集、弱实体集和关系来构建完整的ER图"
          hint="提示：拖拽节点的连接点实现连接效果"
        />
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className={styles.canvasContainer}
    >
      <ERDiagram
        data={state.diagramData!}
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
