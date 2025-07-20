import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  Panel,
  Node,
  Edge,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  NodeChange,
  NodePositionChange,
  Connection,
} from '@xyflow/react';
import { Box, Typography, Paper, Chip, Tooltip, Snackbar, Alert } from '@mui/material';

import { ERDiagramData, ERConnection } from '../../types/erDiagram';
import { convertERJsonToFlow, LayoutConfig } from '../../utils/erToFlow';
import EntityNode from './EntityNode';
import DiamondNode from './DiamondNode';
import { useThemeContext } from '@/contexts/ThemeContext';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import {
  createDefaultEntity,
  createDefaultRelationship,
  createDefaultWeakEntity,
  validateDragData
} from './utils/nodeFactory';
import styles from './ERDiagram.module.css';

import '@xyflow/react/dist/style.css';

// 自定义节点类型
const nodeTypes = {
  entity: EntityNode as React.ComponentType<any>,
  diamond: DiamondNode as React.ComponentType<any>,
};


// 边样式类型
type EdgeStyle = 'step' | 'bezier';

// ER图组件的属性接口
interface ERDiagramProps {
  data: ERDiagramData;
  layoutConfig?: Partial<LayoutConfig>; // Partial: 将某个类型的所有属性变为可选
  className?: string;
  showControls?: boolean;
  showBackground?: boolean;
  onNodeClick?: (node: Node) => void;
  onEdgeClick?: (edge: Edge) => void;
  onNodeDoubleClick?: (node: Node) => void;
}

// 自定义控制面板组件 - 参考DatabaseFlow的样式
const CustomControls: React.FC<{
  edgeStyle: EdgeStyle;
  onEdgeStyleChange: (style: EdgeStyle) => void;
}> = ({ edgeStyle, onEdgeStyleChange }) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  return (
    <Panel position="bottom-right" className={styles.customControls}>
      <Tooltip title="放大" placement="bottom">
        <button
          type="button"
          onClick={() => zoomIn({ duration: 800 })}
          className={styles.controlButton}
          aria-label="放大"
        >
          +
        </button>
      </Tooltip>
      <Tooltip title="缩小" placement="bottom">
        <button
          type="button"
          onClick={() => zoomOut({ duration: 800 })}
          className={styles.controlButton}
          aria-label="缩小"
        >
          -
        </button>
      </Tooltip>
      <Tooltip title="适应视图" placement="bottom">
        <button
          type="button"
          onClick={() => fitView({ duration: 800, padding: 0.2 })}
          className={`${styles.controlButton} ${styles.fitButton}`}
          aria-label="适应视图"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </Tooltip>
      <Tooltip title={edgeStyle === 'bezier' ? "切换为折线" : "切换为曲线"} placement="bottom">
        <button
          type="button"
          onClick={() => onEdgeStyleChange(edgeStyle === 'bezier' ? 'step' : 'bezier')}
          className={`${styles.controlButton} ${styles.styleButton}`}
          aria-label={edgeStyle === 'bezier' ? "切换为折线" : "切换为曲线"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {edgeStyle === 'bezier' ? (
              // 折线图标
              <path d="M3 3v18h18 M3 12h18 M12 3v18" />
            ) : (
              // 曲线图标
              <path d="M3 18c3 0 6-4 9-4s6 4 9 4" />
            )}
          </svg>
        </button>
      </Tooltip>
    </Panel>
  );
};

// 信息面板组件
const InfoPanel: React.FC<{ data: ERDiagramData }> = ({ data }) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <Panel position="top-left" className={styles.infoPanel}>
      {/* <Tooltip title={showInfo ? "隐藏信息" : "显示信息"}>
        <IconButton 
          size="small" 
          onClick={() => setShowInfo(!showInfo)}
          className={styles.infoButton}
        >
          <InfoIcon />
        </IconButton>
      </Tooltip> */}
      
      {showInfo && (
        <Paper className={styles.infoContent} elevation={3}>
          <Typography variant="h6" className={styles.infoTitle}>
            {data.metadata?.title || 'ER图'}
          </Typography>
          
          {data.metadata?.description && (
            <Typography variant="body2" className={styles.infoDescription}>
              {data.metadata.description}
            </Typography>
          )}
          
          <Box className={styles.statsContainer}>
            <Chip 
              label={`实体: ${data.entities.length}`} 
              size="small" 
              color="primary" 
              variant="outlined"
            />
            <Chip 
              label={`关系: ${data.relationships.length}`} 
              size="small" 
              color="secondary" 
              variant="outlined"
            />
          </Box>
          
          {data.metadata?.version && (
            <Typography variant="caption" className={styles.version}>
              版本: {data.metadata.version}
            </Typography>
          )}
        </Paper>
      )}
    </Panel>
  );
};

// 主ER图组件
const ERDiagramComponent: React.FC<ERDiagramProps> = ({
  data,
  layoutConfig,
  className,
  showControls = true,
  showBackground = true,
  onNodeClick,
  onEdgeClick,
  onNodeDoubleClick
}) => {
  // 边样式状态 - 默认为折线
  const [edgeStyle, setEdgeStyle] = useState<EdgeStyle>('step');

  // 消息状态
  const [message, setMessage] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const showMessage = (msg: string) => {
    setMessage(msg);
    setOpen(true);
  };

  // 监听主题的变化
  const { theme: themeContext } = useThemeContext();

  // 获取 React Flow 实例用于坐标转换
  const { screenToFlowPosition } = useReactFlow();

  // 尝试获取 ERDiagramContext，如果不存在则为 null（用于独立使用的情况）
  let contextMethods: { addEntity?: any; addRelationship?: any; createConnection?: any } = {};
  try {
    const context = useERDiagramContext();
    contextMethods = {
      addEntity: context.addEntity,
      addRelationship: context.addRelationship,
      createConnection: context.createConnection
    };
  } catch (error) {
    // Context 不存在时，使用空的方法
    console.warn('ERDiagram: ERDiagramContext not available, drag and connect features disabled');
  }
  
  // 转换数据为React Flow格式
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    const result = convertERJsonToFlow(data, layoutConfig);
    // 应用边样式
    const styledEdges = result.edges.map(edge => ({
      ...edge,
      type: edgeStyle,
      data: { ...edge.data, edgeStyle }
    }));
    return { nodes: result.nodes, edges: styledEdges };
  }, [data, layoutConfig, edgeStyle]);

  // 使用React Flow的状态管理
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 当数据变化时，重新设置节点和边
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // 处理边样式变化
  useEffect(() => {
    setEdges(eds =>
      eds.map(edge => ({
        ...edge,
        type: edgeStyle,
        data: { ...edge.data, edgeStyle }
      }))
    );
  }, [edgeStyle, setEdges]);

  // 处理节点变化，为拖拽中的节点添加特殊类名
  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    // 应用节点变化
    onNodesChange(changes);
    
    // 检查是否有节点正在拖拽，并更新节点的类名
    const draggedNodeIds = changes
      .filter((change): change is NodePositionChange => 
        change.type === 'position' && 'dragging' in change && !!change.dragging)
      .map(change => change.id);
      
    if (draggedNodeIds.length > 0) {
      setNodes(nds => 
        nds.map(node => ({
          ...node,
          className: draggedNodeIds.includes(node.id) ? 'dragging' : '',
        }))
      );
    } else if (changes.some(change => change.type === 'position')) {
      // 拖拽结束时，清除类名
      setNodes(nds => 
        nds.map(node => ({
          ...node,
          className: '',
        }))
      );
    }
  }, [onNodesChange, setNodes]);

  // 节点点击处理
  const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node clicked:', node);
    onNodeClick?.(node);
  }, [onNodeClick]);

  // 边点击处理
  const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    console.log('Edge clicked:', edge);
    onEdgeClick?.(edge);
  }, [onEdgeClick]);

  // 节点双击处理
  const handleNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    console.log('Node double clicked:', node);
    onNodeDoubleClick?.(node);
  }, [onNodeDoubleClick]);

  // 拖拽处理函数
  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();

    // 如果没有 Context，则不处理拖拽
    if (!contextMethods.addEntity || !contextMethods.addRelationship) {
      console.warn('ERDiagram: Cannot handle drop, ERDiagramContext not available');
      return;
    }

    // 验证拖拽数据
    const nodeType = validateDragData(event.dataTransfer);
    if (!nodeType) return;

    // 将屏幕坐标转换为画布坐标
    const position = screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    try {
      // 根据节点类型创建相应的实体或关系并持久化到 diagramData
      if (nodeType === 'strong-entity') {
        const newEntity = createDefaultEntity(position);
        await contextMethods.addEntity(newEntity);
        console.log('创建新实体并持久化:', newEntity);
      } else if (nodeType === 'weak-entity') {
        const newEntity = createDefaultWeakEntity(position);
        await contextMethods.addEntity(newEntity);
        console.log('创建新弱实体并持久化:', newEntity);
      } else if (nodeType === 'diamond') {
        const newRelationship = createDefaultRelationship(position);
        await contextMethods.addRelationship(newRelationship);
        console.log('创建新关系并持久化:', newRelationship);
      }
    } catch (error) {
      console.error('拖拽创建节点失败:', error);
    }
  }, [screenToFlowPosition, contextMethods]);

  // 连接处理函数
  const handleConnect = useCallback(async (connection: Connection) => {
    console.log('尝试创建连接:', connection);

    // 如果没有 Context，则不处理连接
    if (!contextMethods.createConnection) {
      console.warn('ERDiagram: Cannot handle connect, ERDiagramContext not available');
      return;
    }

    // 验证连接的合法性
    if (!connection.source || !connection.target) {
      console.warn('连接缺少源节点或目标节点');
      return;
    }

    // 检查连接是否符合ER图规则（实体连接关系，关系连接实体）
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);

    if (!sourceNode || !targetNode) {
      console.warn('找不到源节点或目标节点');
      return;
    }

    // 确定哪个是实体节点，哪个是关系节点
    let entityNodeId: string;
    let relationshipNodeId: string;

    if (sourceNode.type === 'entity' && targetNode.type === 'diamond') {
      entityNodeId = sourceNode.id;
      relationshipNodeId = targetNode.id;
    } else if (sourceNode.type === 'diamond' && targetNode.type === 'entity') {
      entityNodeId = targetNode.id;
      relationshipNodeId = sourceNode.id;
    } else {
      showMessage('无效的连接：只能在实体和关系之间建立连接');
      return;
    }

    try {
      // 创建 ERConnection 对象
      const newConnection: ERConnection = {
        entityId: entityNodeId,
        cardinality: '1..*', // 默认基数
        role: undefined // 可选角色
      };

      // 持久化连接到 diagramData
      await contextMethods.createConnection(relationshipNodeId, newConnection);
      console.log('创建连接并持久化:', { relationshipNodeId, connection: newConnection });
    } catch (error) {
      console.error('创建连接失败:', error);
    }
  }, [nodes, contextMethods, showMessage]);

  return (
    <div className={`${styles.erDiagram} ${className || ''}`}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onEdgeClick={handleEdgeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onConnect={handleConnect}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.2,
          includeHiddenNodes: false,
        }}
        minZoom={0.1}
        maxZoom={2}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        attributionPosition="bottom-left"
        defaultEdgeOptions={{
          type: edgeStyle,
          animated: false,
          data: { edgeStyle },
          style: {
            stroke: themeContext === 'dark' ? '#ffb74d' : '#ff9900',
            strokeWidth: 2
          }
        }}
        proOptions={{
          hideAttribution: true,
        }}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={true}
        panOnDrag={true}
        className="flow-with-transitions"
      >
        {/* 自定义控制面板 */}
        {showControls && <CustomControls edgeStyle={edgeStyle} onEdgeStyleChange={setEdgeStyle} />}
        
        {/* 信息面板 */}
        <InfoPanel data={data} />
        
        {/* 背景 */}
        {showBackground && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={16}
            size={1}
            color={themeContext === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
            className={styles.background}
          />
        )}

        {/* 消息提示 */}
        <Snackbar
          open={open}
          autoHideDuration={3000}
          onClose={() => setOpen(false)}
          // anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx = {{ ml:5}}
        >
          <Alert onClose={() => setOpen(false)} severity="warning" sx={{ width: '100%'}}>
            {message}
          </Alert>
        </Snackbar>
      </ReactFlow>
    </div>
  );
};

// 带Provider的包装组件
const ERDiagram: React.FC<ERDiagramProps> = (props) => {
  return (
    <ReactFlowProvider>
      <ERDiagramComponent {...props} />
    </ReactFlowProvider>
  );
};

export default ERDiagram;
