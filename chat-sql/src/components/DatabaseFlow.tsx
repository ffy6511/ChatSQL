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
  const headerColorRef = useRef<string | null>(null); // 使用 useRef 存储颜色

  // 初次渲染时生成颜色
  if (headerColorRef.current === null) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    headerColorRef.current = `rgba(${r}, ${g}, ${b}, 0.5)`;
  }

  return (
    <div
      style={{
        border: "1px solid #777",
        borderRadius: "5px",
        background: "#fff",
        width: "250px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          background: headerColorRef.current, // 使用存储的颜色
          padding: "5px",
          fontWeight: "bold",
          textAlign: "center",
          borderBottom: "1px solid #777",
        }}
      >
        {data.tableName}
      </div>
      <div style={{ padding: "5px" }}>
        {data.columns.map((col, index) => (
          <div key={index} style={{ margin: "5px 0" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Handle
                type="source"
                position={Position.Left} // 源 Handle 放在左边
                id={col.name}
                style={{ background: "transparent", border: "none" }}
              />
              <span>{col.name}</span>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span>{col.type}</span>
                {/* TODO: key的标识以及类型的字体 */}
                {col.isPrimary && <span style={{ marginLeft: "5px" }}></span>}
                {col.foreignKeyRefs && col.foreignKeyRefs.length > 0 && (
                  <span style={{ marginLeft: "5px" }}>(FK)</span>
                )}
              </div>
              <Handle
                type="target"
                position={Position.Right} // 目标 Handle 放在右边
                id={col.name}
                style={{ background: "transparent", border: "none" }}
              />
            </div>
            <hr
              style={{
                border: "none",
                borderTop: "1px dashed #777",
                width: "90%",
                margin: "5px auto 0",
              }}
            />
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
    <div style={{ width: "100%", height: "100vh" , ...styles}}>
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
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default DatabaseFlow;
