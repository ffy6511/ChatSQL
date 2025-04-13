'use client'

import React, { useCallback, useRef } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  Handle,
  Position,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import './DatabaseFlow.css';

// 删除原有的类型定义，改为导入
import { Column, Table, Edge } from '@/types/database';

// 生成随机颜色
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, 0.5)`; // 添加 80% 透明度
};

const TableNode = ({
  data,
}: {
  data: { tableName: string; columns: Column[]; isReferenced: boolean };
}) => {
  const headerColorRef = useRef<string | null>(null);

  if (headerColorRef.current === null) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    headerColorRef.current = `rgba(${r}, ${g}, ${b}, 0.5)`;
  }

  return (
    <div className="table-node">
      <div 
        className="table-header"
        style={{ background: headerColorRef.current }}
      >
        {data.tableName}
      </div>
      <div className="table-content">
        {data.columns.map((col, index) => (
          <div key={index}>
            <div className="column-row">
              <Handle
                type="source"
                position={Position.Left}
                id={col.name}
                className="handle"
              />
              <span className="column-name">{col.name}</span>
              <div className="column-info">
                <span className="column-type">{col.type}</span>
                {col.isPrimary && <span style={{ marginLeft: "5px" }}></span>}
                {col.foreignKeyRefs && col.foreignKeyRefs.length > 0 && (
                  <span style={{ marginLeft: "5px" }}>(FK)</span>
                )}
              </div>
              <Handle
                type="target"
                position={Position.Right}
                id={col.name}
                className="handle"
              />
            </div>
            <hr className="column-divider" />
          </div>
        ))}
      </div>
    </div>
  );
};

// 定义节点类型
const nodeTypes = {
  table: TableNode,
};



// 根据表数据自动生成边
const generateEdges = (tables: Table[]): Edge[] => {
  const edges: Edge[] = [];
  tables.forEach((table) => {
    table.columns.forEach((col) => {
      if (col.foreignKeyRefs) {
        col.foreignKeyRefs.forEach((ref) => {
          // 反转 source 和 target
          edges.push({
            id: `e${table.id}-${ref.tableId}-${col.name}`, // 修改 id
            source: table.id, // 引用表
            target: ref.tableId, // 被引用表
            sourceHandle: col.name, // 外键字段
            targetHandle: ref.columnName, // 主键字段
            type: "smoothstep",
            label: ``,
            markerEnd: {
              type: "arrowclosed",
              width: 20,
              height: 20,
              color: "#777",
            },
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
  const [nodes, setNodes, onNodesChange] = useNodesState(
    tables.map((table) => ({
      id: table.id,
      type: "table",
      position: table.position,
      data: {
        tableName: table.tableName,
        columns: table.columns,
        isReferenced: table.isReferenced,
      },
    }))
  );
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(
    generateEdges(tables)
  );

  const onConnect = useCallback(
    (params: any) => {
      setEdges((eds) => [
        ...eds,
        {
          id: `e${params.source}-${params.target}`,
          source: params.source,
          target: params.target,
          sourceHandle: params.sourceHandle,
          targetHandle: params.targetHandle,
          type: "smoothstep",
          label: ``,
          markerEnd: {
            type: "arrowclosed",
            width: 20,
            height: 20,
            color: "#777",
          },
        },
      ]);
    },
    [setEdges]
  );

  return (
    <div className="database-flow-container" style={styles}>
      <ReactFlow
        nodes={nodes}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <MiniMap />
        <Controls className="flow-controls" />
      </ReactFlow>
    </div>
  );
};

export default DatabaseFlow;
