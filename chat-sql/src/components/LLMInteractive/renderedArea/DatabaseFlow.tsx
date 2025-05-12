'use client'

import React, { useCallback, useRef, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  MarkerType,
  getBezierPath,
  getSmoothStepPath,
  Node as FlowNode,
  Edge as FlowEdge,
  NodeChange,
  NodePositionChange,
  applyNodeChanges,
  useReactFlow,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import './DatabaseFlow.css';
import { styled } from '@mui/material/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

// 删除原有的类型定义，改为导入
import { Column, Table, Edge } from '@/types/database';

type TableNodeData = {
  tableName: string;
  columns: Column[];
  isReferenced: boolean;
} & Record<string, unknown>;

type CustomNode = FlowNode<TableNodeData>;
type CustomEdge = FlowEdge;

// 添加边样式类型定义
type EdgeStyle = 'bezier' | 'step';

// 生成随机颜色
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, 0.5)`; // 添加 50% 透明度
};

// 自定义边组件
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
}: {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  style?: React.CSSProperties;
  data?: { edgeStyle: EdgeStyle };
}) => {
  // 根据样式类型选择路径生成函数
  let edgePath = '';
  
  if (data?.edgeStyle === 'bezier') {
    const [path] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    edgePath = path;
  } else {
    const [path] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 6,
    });
    edgePath = path;
  }

  return (
    <path
      id={id}
      style={{
        ...style,
        strokeWidth: 1,
        stroke: '#e8b05c',
      }}
      className="react-flow__edge-path"
      d={edgePath}
    />
  );
};

// 修改自定义 Tooltip 样式
const ConstraintTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: '#f5f5f9',
    color: 'rgba(0, 0, 0, 0.87)',
    maxWidth: 'none', // 覆盖默认的 maxWidth
    minWidth: '80px', // 设置最小宽度
    width: 'fit-content', // 根据内容自适应宽度
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9',
    padding: '12px',
  },
}));

// 修改 ConstraintContent 组件
const ConstraintContent = ({ columns, tableName, tables }: { 
  columns: Column[], 
  tableName: string,
  tables: Table[]
}) => {
  const primaryKeys = columns.filter(col => col.isPrimary);
  const foreignKeys = columns.filter(col => col.foreignKeyRefs && col.foreignKeyRefs.length > 0);

  return (
    <Box sx={{ 
      width: 'fit-content', // 让容器宽度适应内容
      minWidth: '80px', // 设置最小宽度
    }}>
      {/* 主键约束 */}
      <Box sx={{ mb: 1 }}>
        <Typography 
          component="span" 
          sx={{ 
            color: '#d32f2f',
            fontWeight: 'bold',
            fontSize: '1em',
            display: 'block',
            mb: 0.5,
            // textAlign: 'center',
          }}
        >
          Primary Key
        </Typography>
        {primaryKeys.length >= 1 ? (
          <Typography component="span" sx={{ fontSize: '0.9em' }}>
            {primaryKeys[0].name}
          </Typography>
        ) : (
          <Typography component="span" sx={{ fontSize: '0.9em', fontStyle: 'italic' }}>
            No primary key
          </Typography>
        )}
      </Box>

      {/* 外键约束 */}
      {foreignKeys.length > 0 && (
        <Box>
          <Typography 
            component="span" 
            sx={{ 
              color: '#ed6c02',
              fontWeight: 'bold',
              fontSize: '1em',
              display: 'block',
              mt: 1,
              mb: 0.5,
              // textAlign:'center'
            }}
          >
            Foreign Key
          </Typography>
          {foreignKeys.map((col, index) => (
            col.foreignKeyRefs?.map((ref, refIndex) => {
              const targetTable = tables.find(t => t.id === ref.tableId);
              return (
                <Typography 
                  key={`fk-${index}-${refIndex}`}
                  component="div"
                  sx={{ 
                    fontSize: '0.9em',
                    mb: 0.5,
                    '&:last-child': { mb: 0 },
                    whiteSpace: 'nowrap', // 防止换行
                  }}
                >
                  {col.name} → <Box component="span" sx={{ textDecoration: 'underline', fontWeight: 'bold' }}>
                    {targetTable?.tableName || ref.tableId}
                  </Box>.{ref.columnName}
                </Typography>
              );
            })
          ))}
        </Box>
      )}
    </Box>
  );
};

// 修改 TableNode 组件
const TableNode = ({
  data,
}: {
  data: { tableName: string; columns: Column[]; isReferenced: boolean };
}) => {
  const headerColorRef = useRef<string | null>(null);
  const { getNodes } = useReactFlow();

  // 正确处理类型转换
  const tables = useMemo(() => {
    const nodes = getNodes();
    return nodes.map(node => ({
      id: node.id,
      tableName: node.data.tableName as string,
      columns: node.data.columns as Column[],
      isReferenced: node.data.isReferenced as boolean,
      position: node.position, // 添加 position 属性
    })) as Table[]; // 确保类型匹配
  }, [getNodes]);

  if (headerColorRef.current === null) {
    headerColorRef.current = getRandomColor();
  }

  return (
    <div className="table-node">
      <div 
        className="table-header" 
        style={{ 
          background: headerColorRef.current,
          position: 'relative',
          fontSize: '1.1em',
          fontWeight: 'bold',
        }}
      >
        <div className="table-name">{data.tableName}</div>
        <ConstraintTooltip
          title={<ConstraintContent columns={data.columns} tableName={data.tableName} tables={tables} />}
          placement="right"
          arrow
        >
          <span className="constraint-icon">?</span>
        </ConstraintTooltip>
      </div>
      <div className="table-content">
        {data.columns.map((col, index) => (
          <div key={index} className="column-row">
            {/* 外键列在左侧添加连接点 */}
            {col.foreignKeyRefs && (
              <Handle
                type="source"
                position={Position.Left}
                id={`${col.name}`}
                className="foreign-key-handle"
              />
            )}
            <span className="column-name">{col.name}</span>
            <div className="column-info">
              <span className="column-type">{col.type}</span>
              {col.isPrimary && <span className="primary-key-badge">PK</span>}
              {col.foreignKeyRefs && <span className="foreign-key-badge">FK</span>}
            </div>
            {/* 主键列添加隐藏的连接点 */}
            {col.isPrimary && (
              <Handle
                type="target"
                position={Position.Right}
                id={`${col.name}`}
                className="hidden-primary-key-handle"
                style={{ opacity: 0, pointerEvents: 'none' }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 注册节点类型
const nodeTypes = { table: TableNode };
const edgeTypes = { custom: CustomEdge };

// 修改生成边的函数
const generateEdges = (tables: Table[]): Edge[] => {
  const edges: Edge[] = [];
  const tableMap = new Map(tables.map(table => [table.id, table])); // 创建表ID到表对象的映射

  tables.forEach((sourceTable) => {
    sourceTable.columns.forEach((col) => {
      if (col.foreignKeyRefs) {
        // 更新外键引用信息，添加表名
        col.foreignKeyRefs = col.foreignKeyRefs.map(ref => {
          const targetTable = tableMap.get(ref.tableId);
          return {
            ...ref,
            tableName: targetTable?.tableName || ref.tableId // 如果找不到表名，使用表ID作为后备
          };
        });

        // 生成边
        col.foreignKeyRefs.forEach((ref) => {
          edges.push({
            id: `${sourceTable.id}-${ref.tableId}-${col.name}`,
            source: sourceTable.id,
            target: ref.tableId,
            sourceHandle: col.name,
            targetHandle: ref.columnName,
            type: 'custom',
          });
        });
      }
    });
  });
  return edges;
};

// 添加自定义按钮组件
const ZoomControls = ({ 
  edgeStyle, 
  onEdgeStyleChange 
}: {
  edgeStyle: EdgeStyle;
  onEdgeStyleChange: (style: EdgeStyle) => void;
}) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  
  return (
    // 添加tooltip提示
    <Panel position="bottom-right" className="custom-zoom-controls">
      <Tooltip title="放大" placement="bottom">
        <button 
          onClick={() => zoomIn({ duration: 800 })} 
          className="zoom-button"
          aria-label="放大"
          title="放大"
        >
          +
        </button>
      </Tooltip>
      <Tooltip title="缩小" placement="bottom">
        <button 
          onClick={() => zoomOut({ duration: 800 })} 
          className="zoom-button"
          aria-label="缩小"
          title="缩小"
        >
          -
        </button>
      </Tooltip>
      <Tooltip title="适应视图" placement="bottom">
        <button 
          onClick={() => fitView({ duration: 800, padding: 0.2 })} 
          className="zoom-button fit-button"
          aria-label="适应视图"
          title="适应视图"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
        </button>
      </Tooltip>
      <Tooltip title={edgeStyle === 'bezier' ? "切换为折线" : "切换为曲线"} placement="bottom">
        <button 
          onClick={() => onEdgeStyleChange(edgeStyle === 'bezier' ? 'step' : 'bezier')} 
          className="zoom-button style-button"
          aria-label={edgeStyle === 'bezier' ? "切换为折线" : "切换为曲线"}
          title={edgeStyle === 'bezier' ? "切换为折线" : "切换为曲线"}
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

// 主组件
interface DatabaseFlowProps {
  tables: Table[];
  styles?: React.CSSProperties;
}

export const DatabaseFlow = ({ tables, styles = {} }: DatabaseFlowProps) => {
  // 添加边样式状态
  const [edgeStyle, setEdgeStyle] = useState<EdgeStyle>('step');
  
  const initialNodes = tables.map((table, index) => ({
    id: table.id,
    type: "table",
    position: {
      x: (index % 3) * 350 + 50,
      y: Math.floor(index / 3) * 350 + 50
    },
    data: {
      tableName: table.tableName,
      columns: table.columns,
      isReferenced: table.isReferenced,
    },
    draggable: true,
  }));

  const initialEdges = useMemo(() => {
    return generateEdges(tables).map(edge => ({
      ...edge,
      data: { edgeStyle },
    }));
  }, [tables, edgeStyle]);

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>(initialEdges);
  
  // 处理节点变化，为拖拽中的节点添加特殊类名
  const handleNodesChange = useCallback((changes: NodeChange<CustomNode>[]) => {
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
          className: draggedNodeIds.includes(node.id) ? 'dragging-node' : '',
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

  // 处理边样式变化
  useEffect(() => {
    setEdges(eds => 
      eds.map(edge => ({
        ...edge,
        data: { ...edge.data, edgeStyle },
      }))
    );
  }, [edgeStyle, setEdges]);

  // 只在 tables 变化时更新节点和边
  useEffect(() => {
    if (tables && tables.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [tables, initialEdges]);

  return (
    <div className="database-flow-container" style={styles}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
        minZoom={0.2}
        maxZoom={2}
        fitViewOptions={{ 
          padding: 0.2,
          duration: 400 // 添加动画持续时间
        }}
        nodesDraggable={true}
        elementsSelectable={true}
        defaultEdgeOptions={{
          type: 'custom',
          animated: false,
          data: { edgeStyle },
          style: { 
            stroke: '#ff9900', 
            strokeWidth: 2
          }
        }}
        // 添加平滑过渡效果的配置
        proOptions={{
          hideAttribution: true,
        }}
        zoomOnScroll={true}
        zoomOnPinch={true}
        panOnScroll={true}
        panOnDrag={true}
        // 添加自定义类名以应用CSS过渡效果
        className="flow-with-transitions"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        {/* 使用自定义缩放控件替代默认控件 */}
        <ZoomControls edgeStyle={edgeStyle} onEdgeStyleChange={setEdgeStyle} />
      </ReactFlow>
    </div>
  );
};

export default DatabaseFlow;
