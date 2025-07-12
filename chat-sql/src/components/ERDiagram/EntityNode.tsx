import React, { useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Tooltip, Typography, Box } from '@mui/material';
import { styled } from '@mui/material/styles';
import { tooltipClasses, TooltipProps } from '@mui/material/Tooltip';
import { ERAttribute } from '../../types/erDiagram';
import { useThemeContext } from '@/contexts/ThemeContext';
import styles from './EntityNode.module.css';

// 实体节点的数据类型
export interface EntityNodeData {
  label: string;
  description?: string;
  attributes: ERAttribute[];
  [key: string]: unknown; // 添加索引签名
}

// 生成随机颜色
const getRandomColor = () => {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return `rgba(${r}, ${g}, ${b}, 0.5)`; // 添加 50% 透明度
};

// 自定义 Tooltip 样式
const ConstraintTooltip = styled(({ className, ...props }: TooltipProps) => {
  const { theme } = useThemeContext();
  
  return (
    <Tooltip {...props} classes={{ popper: className }} />
  );
})(({ theme: muiTheme }) => {
  const { theme: appTheme } = useThemeContext();
  
  return {
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: 'var(--card-bg)',
      color: 'var(--primary-text)',
      maxWidth: 'none',
      minWidth: '80px',
      width: 'fit-content',
      fontSize: muiTheme.typography.pxToRem(12),
      padding: '12px',
    },
  };
});

// 约束内容组件 - 显示实体描述而不是PK/FK信息
const ConstraintContent: React.FC<{ description?: string; entityName: string }> = ({
  description,
  entityName
}) => {
  const { theme } = useThemeContext();

  return (
    <Box sx={{
      width: 'fit-content',
      minWidth: '80px',
    }}>
      <Typography
        component="span"
        sx={{
          color: '#d32f2f',
          fontWeight: 'bold',
          fontSize: '1em',
          display: 'block',
          mb: 0.5,
        }}
      >
        {entityName}
      </Typography>
      {description ? (
        <Typography component="span" sx={{ fontSize: '0.9em', color: 'var(--secondary-text)' }}>
          {description}
        </Typography>
      ) : (
        <Typography component="span" sx={{ fontSize: '0.9em', fontStyle: 'italic' }}>
          无描述信息
        </Typography>
      )}
    </Box>
  );
};

// 实体节点组件
const EntityNode: React.FC<NodeProps<EntityNodeData>> = ({ data, selected }) => {
  const { label, description, attributes } = data;
  const headerColorRef = useRef<string | null>(null);

  if (headerColorRef.current === null) {
    headerColorRef.current = getRandomColor();
  }

  return (
    <div className={`${styles.entityNode} ${selected ? styles.selected : ''}`}>
      {/* 连接点：四个方向都可连线，id与erToFlow.ts一致 */}
      <Handle type="source" position={Position.Top} id="top" className={styles.handle} style={{ top: '-4px', left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="target" position={Position.Top} id="top" className={styles.handle} style={{ top: '-4px', left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="source" position={Position.Right} id="right" className={styles.handle} style={{ top: '50%', right: '-4px', transform: 'translateY(-50%)' }} />
      <Handle type="target" position={Position.Right} id="right" className={styles.handle} style={{ top: '50%', right: '-4px', transform: 'translateY(-50%)' }} />
      <Handle type="source" position={Position.Bottom} id="bottom" className={styles.handle} style={{ bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="target" position={Position.Bottom} id="bottom" className={styles.handle} style={{ bottom: '-4px', left: '50%', transform: 'translateX(-50%)' }} />
      <Handle type="source" position={Position.Left} id="left" className={styles.handle} style={{ top: '50%', left: '-4px', transform: 'translateY(-50%)' }} />
      <Handle type="target" position={Position.Left} id="left" className={styles.handle} style={{ top: '50%', left: '-4px', transform: 'translateY(-50%)' }} />

      {/* 实体标题 */}
      <div 
        className={styles.header} 
        style={{ 
          background: headerColorRef.current,
          position: 'relative',
          fontSize: '1.1em',
          fontWeight: 'bold',
        }}
      >
        <div className={styles.title}>{label}</div>
        <ConstraintTooltip
          title={<ConstraintContent description={description} entityName={label} />}
          placement="right"
          arrow
        >
          <span className={styles.constraintIcon}>?</span>
        </ConstraintTooltip>
      </div>

      {/* 属性列表 */}
      <div className={styles.attributesList}>
        {attributes.map((attr) => (
          <div
            key={attr.id}
            className={
              `${styles.attribute} ${attr.isPrimaryKey ? styles.primaryKey : ''}`
            }
          >
            <span className={styles.attributeName}>{attr.name}</span>
            <span className={styles.dataType}>{attr.dataType || ''}</span>
            <div className={styles.attributeBadges}>
              {attr.isPrimaryKey && (
                <span className={styles.pkBadge}>PK</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntityNode;
