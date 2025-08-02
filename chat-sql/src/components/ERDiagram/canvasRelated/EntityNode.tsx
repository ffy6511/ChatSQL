import React, { useRef } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Tooltip, Typography, Box } from "@mui/material";
import { styled } from "@mui/material/styles";
import { tooltipClasses, TooltipProps } from "@mui/material/Tooltip";
import { ERAttribute } from "../../../types/ERDiagramTypes/erDiagram";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useERDiagramContext } from "@/contexts/ERDiagramContext";
import InlineEditor from "../utils/InlineEditor";
import styles from "./EntityNode.module.css";

// 实体节点的数据类型
export interface EntityNodeData {
  label: string;
  description?: string;
  attributes: ERAttribute[];
  isWeakEntity?: boolean; // 是否为弱实体集
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

  return <Tooltip {...props} classes={{ popper: className }} />;
})(({ theme: muiTheme }) => {
  const { theme: appTheme } = useThemeContext();

  return {
    [`& .${tooltipClasses.tooltip}`]: {
      backgroundColor: "var(--card-bg)",
      color: "var(--primary-text)",
      maxWidth: "none",
      minWidth: "80px",
      width: "fit-content",
      fontSize: muiTheme.typography.pxToRem(12),
      padding: "12px",
    },
  };
});

// 约束内容组件 - 显示实体描述而不是PK/FK信息
const ConstraintContent: React.FC<{
  description?: string;
  entityName: string;
}> = ({ description, entityName }) => {
  const { theme } = useThemeContext();

  return (
    <Box
      sx={{
        width: "fit-content",
        minWidth: "80px",
      }}
    >
      <Typography
        component="span"
        sx={{
          color: "#d32f2f",
          fontWeight: "bold",
          fontSize: "1em",
          display: "block",
          mb: 0.5,
        }}
      >
        {entityName}
      </Typography>
      {description ? (
        <Typography
          component="span"
          sx={{ fontSize: "0.9em", color: "var(--secondary-text)" }}
        >
          {description}
        </Typography>
      ) : (
        <Typography
          component="span"
          sx={{ fontSize: "0.9em", fontStyle: "italic" }}
        >
          无描述信息
        </Typography>
      )}
    </Box>
  );
};

// 实体节点组件
const EntityNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  const { label, description, attributes, isWeakEntity } =
    data as EntityNodeData;
  const headerColorRef = useRef<string | null>(null);

  // 使用ERDiagram上下文
  const {
    state,
    startEditNode,
    finishEditNode,
    renameNode,
    selectNode,
    setActiveTab,
    setSelectedElement,
  } = useERDiagramContext();

  // 判断当前节点是否处于编辑状态
  const isEditing =
    state.editingNodeId === id && state.nodeEditMode === "rename";

  if (headerColorRef.current === null) {
    headerColorRef.current = getRandomColor();
  }

  // 双击标题重命名
  const handleTitleDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isEditing) {
      startEditNode(id, "rename");
    }
  };

  // 双击实体内部 - 切换到实体列表并选中
  const handleEntityDoubleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setActiveTab("entities");
    setSelectedElement(id);
  };

  // 保存重命名
  const handleSaveRename = (newName: string) => {
    renameNode(id, newName);
  };

  // 取消重命名
  const handleCancelRename = () => {
    finishEditNode();
  };

  // 单击选中节点
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    selectNode(id);
  };

  // 右键菜单 - 进入属性编辑模式
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    selectNode(id);
    startEditNode(id, "properties");
  };

  return (
    <div
      className={`${styles.entityNode} ${selected ? styles.selected : ""} ${isWeakEntity ? styles.weakEntity : ""}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* 连接点：四个方向都可连线，id与erToFlow.ts一致 */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className={styles.handle}
        style={{ top: "4px", left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className={styles.handle}
        style={{ top: "4px", left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className={styles.handle}
        style={{ top: "50%", right: "4px", transform: "translateY(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        className={styles.handle}
        style={{ top: "50%", right: "4px", transform: "translateY(-50%)" }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className={styles.handle}
        style={{ bottom: "4px", left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        className={styles.handle}
        style={{ bottom: "4px", left: "50%", transform: "translateX(-50%)" }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className={styles.handle}
        style={{ top: "50%", left: "4px", transform: "translateY(-50%)" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className={styles.handle}
        style={{ top: "50%", left: "4px", transform: "translateY(-50%)" }}
      />

      {/* 实体标题 */}
      <div
        className={styles.header}
        style={{
          background: headerColorRef.current,
          position: "relative",
          fontSize: "1.1em",
          fontWeight: "bold",
        }}
        onDoubleClick={handleTitleDoubleClick}
      >
        {isEditing ? (
          <InlineEditor
            nodeId={id}
            currentName={label}
            onSave={handleSaveRename}
            onCancel={handleCancelRename}
            className={styles.inlineEditor}
          />
        ) : (
          <div className={styles.title}>{label}</div>
        )}
        <ConstraintTooltip
          title={
            <ConstraintContent description={description} entityName={label} />
          }
          placement="right"
          arrow
        >
          <span className={styles.constraintIcon}>?</span>
        </ConstraintTooltip>
      </div>

      {/* 属性列表 */}
      <div
        className={styles.attributesList}
        onDoubleClick={handleEntityDoubleClick}
      >
        {attributes.map((attr) => (
          <div
            key={attr.id}
            className={`${styles.attribute} ${attr.isPrimaryKey ? styles.primaryKey : ""}`}
          >
            <span className={styles.attributeName}>{attr.name}</span>
            <span className={styles.dataType}>{attr.dataType || ""}</span>
            <div className={styles.attributeBadges}>
              {attr.isPrimaryKey &&
                (isWeakEntity ? (
                  <span className={styles.disBadge}>DIS</span>
                ) : (
                  <span className={styles.pkBadge}>PK</span>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EntityNode;
