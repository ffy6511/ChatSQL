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
  Node as FlowNode,
  Edge as FlowEdge,
  NodeChange,
  applyNodeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import './DatabaseFlow.css';

// 删除原有的类型定义，改为导入
import { Column, Table, Edge } from '@/types/database';

type TableNodeData = {
  tableName: string;
  columns: Column[];
  isReferenced: boolean;
} & Record<string, unknown>;

type CustomNode = FlowNode<TableNodeData>;
type CustomEdge = FlowEdge;

// 生成随机颜色
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, 0.5)`; // 添加 80% 透明度
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
}: {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  sourcePosition: Position;
  targetPosition: Position;
  style?: React.CSSProperties;
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <path
      id={id}
      style={{
        ...style,
        strokeWidth: 2,
        stroke: '#ff9900',
      }}
      className="react-flow__edge-path"
      d={edgePath}
    />
  );
};

// 表节点组件
const TableNode = ({
  data,
}: {
  data: { tableName: string; columns: Column[]; isReferenced: boolean };
}) => {
  const headerColorRef = useRef<string | null>(null);

  if (headerColorRef.current === null) {
    headerColorRef.current = getRandomColor();
  }

  return (
    <div className="table-node">
      <div
        className="table-header"
        style={{ 
          background: headerColorRef.current,
          textAlign: 'center',
          padding: '12px 8px',
          fontSize: '1.1em',
          fontWeight: 'bold'
        }}
      >
        {data.tableName}
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
            {/* 主键列在右侧添加连接点 */}
            {col.isPrimary && (
              <Handle
                type="target"
                position={Position.Right}
                id={`${col.name}`}
                className="primary-key-handle"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 注册自定义组件
const nodeTypes = { table: TableNode };
const edgeTypes = { custom: CustomEdge };

// 生成边
const generateEdges = (tables: Table[]): Edge[] => {
  const edges: Edge[] = [];
  tables.forEach((sourceTable) => {
    sourceTable.columns.forEach((col) => {
      if (col.foreignKeyRefs) {
        col.foreignKeyRefs.forEach((ref) => {
          edges.push({
            id: `${sourceTable.id}-${ref.tableId}-${col.name}`,
            source: sourceTable.id,
            target: ref.tableId,
            sourceHandle: col.name,
            targetHandle: ref.columnName,
            type: 'custom',
            style: {
              stroke: '#ff9900',
              strokeWidth: 2
            }
          });
        });
      }
    });
  });
  return edges;
};

// 主组件
interface DatabaseFlowProps {
  tables: Table[];
  styles?: React.CSSProperties;
}

export const DatabaseFlow = ({ tables, styles = {} }: DatabaseFlowProps) => {
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

  const initialEdges = generateEdges(tables);

  const [nodes, setNodes, onNodesChange] = useNodesState<CustomNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<CustomEdge>(initialEdges);

  // 只在 tables 变化时更新节点和边
  useEffect(() => {
    if (tables && tables.length > 0) {
      setNodes(initialNodes);
      setEdges(initialEdges);
    }
  }, [tables]);

  return (
    <div className="database-flow-container" style={styles}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
        minZoom={0.2}
        maxZoom={2}
        fitViewOptions={{ padding: 0.2 }}
        nodesDraggable={true}
        elementsSelectable={true}
        defaultEdgeOptions={{
          type: 'custom',
          animated: false,
          style: { 
            stroke: '#ff9900', 
            strokeWidth: 2
          }
        }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: '8px',
            padding: '4px',
            backgroundColor: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="bottom-right"
        />
      </ReactFlow>
    </div>
  );
};

export default DatabaseFlow;
