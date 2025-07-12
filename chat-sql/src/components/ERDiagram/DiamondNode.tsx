import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styles from './DiamondNode.module.css';
import { Tooltip, useTheme } from '@mui/material';

// 菱形节点的数据类型
export interface DiamondNodeData {
  label: string;
  description?: string;
  attributes?: Array<{
    id: string;
    name: string;
    dataType?: string;
  }>;
  [key: string]: unknown; // 添加索引签名
}

// 关系描述内容组件
const RelationTooltipContent: React.FC<{ description?: string; attributes?: DiamondNodeData['attributes'] }> = ({ description, attributes }) => (
  <div style={{ minWidth: 120, maxWidth: 260, fontSize: 13, color: 'inherit', lineHeight: 1.6 }}>
    {description && <div style={{ marginBottom: 4 }}>{description}</div>}
    {attributes && attributes.length > 0 && (
      <ul style={{ paddingLeft: 16, margin: 0 }}>
        {attributes.map(attr => (
          <li key={attr.id} style={{ marginBottom: 2 }}>
            {attr.name}{attr.dataType ? ` : ${attr.dataType}` : ''}
          </li>
        ))}
      </ul>
    )}
  </div>
);

// 菱形节点组件
const DiamondNode: React.FC<NodeProps<DiamondNodeData>> = ({ data, selected }) => {
  const { label, description, attributes } = data;
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  // 菱形的尺寸
  const width = 160;
  const height = 100;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // 菱形的四个顶点坐标
  const points = [
    `${centerX},10`,           // 上顶点
    `${width - 10},${centerY}`, // 右顶点
    `${centerX},${height - 10}`, // 下顶点
    `10,${centerY}`            // 左顶点
  ].join(' ');

  return (
    <Tooltip
      title={<RelationTooltipContent description={description} attributes={attributes} />}
      placement="right"
      arrow
      componentsProps={{
        tooltip: {
          sx: {
            bgcolor: isDark ? '#444' : '#fff',
            color: isDark ? '#fff' : '#222',
            boxShadow: 3,
            borderRadius: 2,
            fontSize: 13,
            px: 2,
            py: 1.5,
          }
        },
        arrow: {
          sx: {
            color: isDark ? '#444' : '#fff',
          }
        }
      }}
    >
      <div className={`${styles.diamondNode} ${selected ? styles.selected : ''}`}> 
        {/* 上方连接点 */}
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className={styles.handle}
          style={{ 
            top: '10px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            background: '#555'
          }}
        />
        {/* 右侧连接点 */}
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          className={styles.handle}
          style={{ 
            top: '50%', 
            right: '10px', 
            transform: 'translateY(-50%)',
            background: '#555'
          }}
        />
        {/* 下方连接点 */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          className={styles.handle}
          style={{ 
            bottom: '10px', 
            left: '50%', 
            transform: 'translateX(-50%)',
            background: '#555'
          }}
        />
        {/* 左侧连接点 */}
        <Handle
          type="target"
          position={Position.Left}
          id="left"
          className={styles.handle}
          style={{ 
            top: '50%', 
            left: '10px', 
            transform: 'translateY(-50%)',
            background: '#555'
          }}
        />
        {/* SVG 菱形 */}
        <svg 
          width={width} 
          height={height} 
          className={styles.diamondSvg}
          viewBox={`0 0 ${width} ${height}`}
        >
          <polygon
            points={points}
            className={styles.diamondShape}
            fill="#e1f5fe"
            stroke="#0277bd"
            strokeWidth="2"
          />
        </svg>
        {/* 只显示关系名 */}
        <div className={styles.labelContainer}>
          <div className={styles.label}>{label}</div>
        </div>
      </div>
    </Tooltip>
  );
};

export default DiamondNode;
