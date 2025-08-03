// 可拖拽属性项组件
import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Box,
  IconButton,
  Chip,
  TextField,
  MenuItem,
  Menu,
  Tooltip,
  Stack,
  Divider,
  Autocomplete,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  DragIndicator as DragIndicatorIcon,
} from "@mui/icons-material";
import { ERAttribute } from "@/types/ERDiagramTypes/erDiagram";
import {
  dataTypeParamConfig,
  dataTypeOptions,
  parseDataType,
} from "@/types/ERDiagramTypes/dataTypes";
import { useERDiagramContext } from "@/contexts/ERDiagramContext";

interface SortableAttributeItemProps {
  id: string;
  attribute: ERAttribute;
  entityId: string;
  editingName: string;
  isComposing: boolean;
  menuAnchor: HTMLElement | null;
  onNameChange: (value: string) => void;
  onNameSave: () => void;
  onCompositionStart: () => void;
  onCompositionEnd: () => void;
  onMenuOpen: (event: React.MouseEvent<HTMLElement>) => void;
  onMenuClose: () => void;
  onDeleteAttribute: () => void;
  onTypeChange: (newType: string) => void;
  onParamChange: (paramIndex: number, value: string) => void;
}

const SortableAttributeItem: React.FC<SortableAttributeItemProps> = ({
  id,
  attribute,
  entityId,
  editingName,
  isComposing,
  menuAnchor,
  onNameChange,
  onNameSave,
  onCompositionStart,
  onCompositionEnd,
  onMenuOpen,
  onMenuClose,
  onDeleteAttribute,
  onTypeChange,
  onParamChange,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // 获取所有实体的信息，判断当前的实体是否为弱实体
  const { state, updateAttribute } = useERDiagramContext();
  const entities = state.diagramData?.entities || [];
  const isWeakEntity = entities.find((e) => e.id === entityId)?.isWeakEntity;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isComposing) {
      e.preventDefault();
      onMenuClose();
    }
  };

  // 切换PK/DIS
  const handleAttributeKeyChange = (
    entityId: string,
    attributeId: string,
    isPrimaryKey: boolean
  ) => {
    updateAttribute(entityId, attributeId, { isPrimaryKey });
  };

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  // 解析数据类型和参数
  const { typeName } = parseDataType(attribute.dataType || "VARCHAR");

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      sx={{
        p: 1,
        borderRadius: 2,
        mb: 1,
        border: "1px solid var(--card-border)",
      }}
    >
      <Stack
        direction='row'
        alignItems='center'
        spacing={1}
        sx={{ overflow: "hidden", flexWrap: "nowrap" }}
      >
        {/* 拖拽手柄 */}
        <Box
          {...listeners}
          sx={{
            display: "flex",
            alignItems: "center",
            cursor: "grab",
            color: "var(--secondary-text)",
            "&:hover": { color: "var(--primary-text)" },
          }}
        >
          <DragIndicatorIcon fontSize='small' />
        </Box>

        <Box sx={{ flexGrow: 1, display: "flex", gap: 1 }}>
          {/* 属性名称 TextField - 直接编辑 */}
          <TextField
            size='small'
            value={editingName !== undefined ? editingName : attribute.name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameSave}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isComposing) {
                e.preventDefault();
                onNameSave();
                (e.target as HTMLInputElement).blur();
              }
            }}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
            variant='outlined'
            placeholder='属性名称'
            sx={{
              maxWidth: "100px",
              "& .MuiInputBase-input": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                fontSize: "0.8em",
              },
            }}
          />

          {/* 数据类型编辑 */}
          <Autocomplete
            disableClearable
            size='small'
            value={typeName}
            onChange={(_, newValue) => {
              if (newValue) {
                onTypeChange(newValue);
              }
            }}
            options={dataTypeOptions}
            renderInput={(params) => (
              <TextField
                {...params}
                variant='outlined'
                sx={{
                  maxWidth: "180px",
                  "& .MuiInputBase-input": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: "0.8em",
                  },
                }}
              />
            )}
            sx={{ minWidth: "140px" }}
          />
        </Box>

        {/* 主键标识移到右侧，优化样式 */}
        <Chip
          label={isWeakEntity ? "DIS" : "PK"}
          size='small'
          variant={attribute.isPrimaryKey ? "filled" : "outlined"}
          clickable
          onClick={() => {
            handleAttributeKeyChange(
              entityId,
              attribute.id,
              !attribute.isPrimaryKey
            );
          }}
          sx={{
            cursor: "pointer",
            borderRadius: "8px",
            border: "none",
            background: attribute.isPrimaryKey
              ? isWeakEntity
                ? "#e3f2fd"
                : "#ffeaea"
              : "var(--card-border)",
            // 只改 label 字体颜色
            "& .MuiChip-label": {
              color: attribute.isPrimaryKey
                ? isWeakEntity
                  ? "#1976d2"
                  : "#D3302F"
                : "var(--secondary-text)",
              fontWeight: "bold",
              letterSpacing: "1px",
            },
            "&:hover": {
              opacity: 0.8,
              transition: "all 0.2s ease",
            },
          }}
        />

        {/* 属性操作菜单 */}
        <Tooltip title='属性操作'>
          <IconButton
            size='small'
            onClick={onMenuOpen}
            sx={{
              opacity: 0.6,
              "&:hover": {
                opacity: 1,
                backgroundColor: "var(--hover-bg)",
              },
            }}
          >
            <MoreVertIcon fontSize='small' />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* 属性操作菜单 */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={onMenuClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
      >
        {/* 根据数据类型显示参数编辑选项 */}
        {dataTypeParamConfig[typeName] && (
          <div>
            {dataTypeParamConfig[typeName].paramLabels.map((label, idx) => {
              // 解析当前参数值
              const { params: currentParams } = parseDataType(
                attribute.dataType || ""
              );
              const currentValue = currentParams[idx] || "";

              return (
                <MenuItem
                  key={label}
                  sx={{
                    flexDirection: "column",
                    alignItems: "stretch",
                    py: 1,
                  }}
                >
                  <TextField
                    label={label}
                    size='small'
                    onKeyDown={handleKeyDown}
                    value={currentValue}
                    onChange={(e) => onParamChange(idx, e.target.value)}
                    onClick={(e) => e.stopPropagation()} // 防止点击输入框时关闭菜单
                    sx={{
                      minWidth: "120px",
                      "& .MuiInputBase-input": {
                        fontSize: "0.8em",
                      },
                    }}
                  />
                </MenuItem>
              );
            })}
            <Divider />
          </div>
        )}

        <MenuItem onClick={onDeleteAttribute} sx={{ color: "error.main" }}>
          <DeleteIcon fontSize='small' sx={{ mr: 1 }} />
          删除
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SortableAttributeItem;
