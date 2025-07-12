import React from 'react';
import { EdgeProps, getSmoothStepPath, EdgeLabelRenderer, BaseEdge } from '@xyflow/react';

// 完全参与约束边组件（双线效果，折线）
const TotalParticipationEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  labelStyle = {},
  labelShowBg = true,
  labelBgStyle = {},
  selected
}) => {
  // 计算折线路径
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 6,
  });

  // 计算平行线的偏移量
  const offset = 10; // 双线间距
  
  // 计算垂直于路径的偏移向量
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / length;
  const unitY = dy / length;
  
  // 垂直向量（逆时针旋转90度）
  const perpX = -unitY * offset;
  const perpY = unitX * offset;

  // 计算两条平行线的路径（折线）
  const [edgePath1] = getSmoothStepPath({
    sourceX: sourceX + perpX,
    sourceY: sourceY + perpY,
    sourcePosition,
    targetX: targetX + perpX,
    targetY: targetY + perpY,
    targetPosition,
    borderRadius: 6,
  });

  const [edgePath2] = getSmoothStepPath({
    sourceX: sourceX - perpX,
    sourceY: sourceY - perpY,
    sourcePosition,
    targetX: targetX - perpX,
    targetY: targetY - perpY,
    targetPosition,
    borderRadius: 6,
  });

  // 边的样式
  const edgeStyle = {
    stroke: selected ? '#1976d2' : '#2196f3',
    strokeWidth: selected ? 3 : 2,
    fill: 'none',
    ...style
  };

  // 标签样式
  const finalLabelStyle = {
    fill: '#1976d2',
    fontWeight: 600,
    fontSize: '12px',
    fontFamily: 'Arial, sans-serif',
    ...labelStyle
  };

  const finalLabelBgStyle = {
    fill: 'white',
    fillOpacity: 0.9,
    stroke: '#e0e0e0',
    strokeWidth: 1,
    rx: 3,
    ry: 3,
    ...labelBgStyle
  };

  return (
    <>
      {/* 第一条线 */}
      <BaseEdge
        path={edgePath1}
        style={edgeStyle}
        markerEnd={markerEnd}
      />
      
      {/* 第二条线 */}
      <BaseEdge
        path={edgePath2}
        style={{
          ...edgeStyle,
          markerEnd: undefined // 只在一条线上显示箭头
        }}
      />

      {/* 标签渲染 */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              fontWeight: 600,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <svg width="auto" height="auto">
              {labelShowBg && (
                <rect
                  x="-15"
                  y="-10"
                  width="30"
                  height="20"
                  style={finalLabelBgStyle}
                />
              )}
              <text
                x="0"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                style={finalLabelStyle}
              >
                {label}
              </text>
            </svg>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default TotalParticipationEdge;
