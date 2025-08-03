"use client";

import React, { useState } from "react";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Stack,
  Divider,
  Typography,
  Tooltip,
  Collapse,
  TextField,
  Button,
} from "@mui/material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  TableChart as TableChartIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useERDiagramContext } from "@/contexts/ERDiagramContext";
import { ERAttribute } from "@/types/ERDiagramTypes/erDiagram";
import { useAttributeEditor } from "@/hooks/useAttributeEditor";
import {
  dataTypeParamConfig,
  parseDataType,
  getDefaultParams,
} from "@/types/ERDiagramTypes/dataTypes";
import SortableAttributeItem from "./SortableAttributeItem";
import styles from "./Inspector.module.css";

const EntityListView: React.FC = () => {
  const {
    state,
    deleteEntity,
    updateAttribute,
    addAttribute,
    deleteAttribute,
    updateAttributeOrder,
    renameNode,
  } = useERDiagramContext();
  const entities = state.diagramData?.entities || [];
  const [expandedEntities, setExpandedEntities] = useState<string[]>([]);
  // 用于临时存储每个属性的参数输入 和 属性名的输入
  const [editingEntityNames, setEditingEntityNames] = useState<{
    [entityId: string]: string;
  }>({});
  const [isEntityComposing, setIsEntityComposing] = useState<{
    [entityId: string]: boolean;
  }>({});

  const {
    editingNames,
    isComposing,
    menuAnchor,
    attributeParams,
    setAttributeParams,
    handleNameChange,
    handleNameSave,
    handleCompositionStart,
    handleCompositionEnd,
    handleMenuOpen,
    handleMenuClose,
    handleDeleteAttribute,
    handleTypeChange,
    handleParamChange,
  } = useAttributeEditor({
    updateAttribute,
    deleteAttribute,
  });

  // 拖拽传感器配置
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // 处理拖拽结束事件
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // 解析拖拽项的 ID，格式为 "entityId-attributeId"
    const activeId = active.id as string;
    const overId = over.id as string;

    const [entityId] = activeId.split("-");
    const entity = entities.find((e) => e.id === entityId);

    if (!entity) return;

    const oldIndex = entity.attributes.findIndex(
      (attr) => `${entityId}-${attr.id}` === activeId,
    );
    const newIndex = entity.attributes.findIndex(
      (attr) => `${entityId}-${attr.id}` === overId,
    );

    if (oldIndex !== -1 && newIndex !== -1) {
      const newAttributeOrder = arrayMove(
        entity.attributes,
        oldIndex,
        newIndex,
      );
      const newAttributeIds = newAttributeOrder.map((attr) => attr.id);

      try {
        await updateAttributeOrder(entityId, newAttributeIds);
      } catch (error) {
        console.error("拖拽排序失败:", error);
      }
    }
  };

  // 生成新属性的辅助函数
  const generateNewAttribute = (): ERAttribute => {
    const timestamp = Date.now();
    return {
      id: `attr_${timestamp}`,
      name: "新属性",
      dataType: "int",
      isPrimaryKey: false,
      isRequired: false,
      description: "",
    };
  };

  // 添加属性处理函数
  const handleAddAttribute = async (entityId: string) => {
    const newAttribute = generateNewAttribute();
    await addAttribute(entityId, newAttribute);
  };

  // 顶层 useEffect 初始化 attributeParams(避免前后属性改变后hook调用 的数量差异)
  React.useEffect(() => {
    const newParams: { [attrId: string]: string[] } = {};
    entities.forEach((entity) => {
      entity.attributes.forEach((attribute) => {
        const { typeName, params } = parseDataType(
          attribute.dataType || "VARCHAR",
        );

        if (dataTypeParamConfig[typeName] && !attributeParams[attribute.id]) {
          newParams[attribute.id] = params.length
            ? params
            : getDefaultParams(typeName);
        }
      });
    });
    if (Object.keys(newParams).length > 0) {
      setAttributeParams((prev) => ({ ...prev, ...newParams }));
    }
  }, [entities]);

  // 处理展开/收起
  const handleExpand = (entityId: string) => {
    setExpandedEntities((prev) =>
      prev.includes(entityId)
        ? prev.filter((id) => id !== entityId)
        : [...prev, entityId],
    );
  };

  // 根据selectedElementId自动展开对应实体
  React.useEffect(() => {
    if (
      state.selectedElementId &&
      entities.find((e) => e.id === state.selectedElementId)
    ) {
      setExpandedEntities((prev) =>
        prev.includes(state.selectedElementId!)
          ? prev
          : [...prev, state.selectedElementId!],
      );
    }
  }, [state.selectedElementId, entities]);

  const handleEntityNameChange = (entityId: string, newName: string) => {
    setEditingEntityNames((prev) => ({ ...prev, [entityId]: newName }));
  };

  const handleEntityNameSave = async (entityId: string) => {
    if (isEntityComposing[entityId]) {
      return;
    }

    const newName = editingEntityNames[entityId];
    if (newName !== undefined) {
      const finalName = newName.trim() || "未命名实体";
      await renameNode(entityId, finalName);

      setEditingEntityNames((prev) => {
        const newState = { ...prev };
        delete newState[entityId];
        return newState;
      });
    }
  };

  const handleEntityCompositionStart = (entityId: string) => {
    setIsEntityComposing((prev) => ({ ...prev, [entityId]: true }));
  };

  const handleEntityCompositionEnd = (entityId: string) => {
    setIsEntityComposing((prev) => ({ ...prev, [entityId]: false }));
  };

  // 数据类型选项已从 @/types/dataTypes 导入

  return (
    <Box>
      <Typography
        variant="h6"
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <TableChartIcon /> 实体列表
      </Typography>
      <Divider sx={{ my: 1 }} />
      {entities.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant="body2">暂无实体</Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {entities.map((entity) => (
            <Card
              key={entity.id}
              className={`${styles.entityCard} ${
                state.selectedElementId === entity.id ? styles.selected : ""
              }`}
              sx={{
                border: 1,
                borderColor: "primary.light",
                "&:hover": { borderColor: "primary.main", boxShadow: 1 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  onClick={() => handleExpand(entity.id)}
                >
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    {expandedEntities.includes(entity.id) ? (
                      <ExpandMoreIcon />
                    ) : (
                      <ExpandLessIcon />
                    )}
                    <TextField
                      size="small"
                      value={
                        editingEntityNames[entity.id] !== undefined
                          ? editingEntityNames[entity.id]
                          : entity.name
                      }
                      onChange={(e) =>
                        handleEntityNameChange(entity.id, e.target.value)
                      }
                      onBlur={() => handleEntityNameSave(entity.id)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !isEntityComposing[entity.id]
                        ) {
                          e.preventDefault();
                          handleEntityNameSave(entity.id);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      onCompositionStart={() =>
                        handleEntityCompositionStart(entity.id)
                      }
                      onCompositionEnd={() =>
                        handleEntityCompositionEnd(entity.id)
                      }
                      variant="standard"
                      slotProps={{
                        input: {
                          disableUnderline: true,
                          style: {
                            fontWeight: "500",
                            fontSize: "inherit",
                          },
                        },
                      }}
                      sx={{
                        maxWidth: "200px",
                        "& .MuiInputBase-input": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        },
                      }}
                    />
                  </Stack>
                  <Typography variant="body2" color="var(--secondary-text)">
                    {entity.attributes.length} attributes
                  </Typography>
                </Box>
                <Tooltip title="删除实体">
                  <IconButton
                    sx={{
                      opacity: 0.6,
                      mr: 2,
                      "&:hover": {
                        opacity: 1,
                        color: "var(--error-color)",
                        backgroundColor: "var(--hover-bg)",
                      },
                    }}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteEntity(entity.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Collapse
                in={expandedEntities.includes(entity.id)}
                timeout="auto"
                unmountOnExit
              >
                <CardContent>
                  <Stack spacing={0}>
                    {entity.attributes.length === 0 ? (
                      <Typography variant="body2" color="var(--secondary-text)">
                        暂无属性
                      </Typography>
                    ) : (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={entity.attributes.map(
                            (attr) => `${entity.id}-${attr.id}`,
                          )}
                          strategy={verticalListSortingStrategy}
                        >
                          {entity.attributes.map((attr) => (
                            <SortableAttributeItem
                              key={attr.id}
                              id={`${entity.id}-${attr.id}`}
                              attribute={attr}
                              entityId={entity.id}
                              editingName={editingNames[attr.id] || attr.name}
                              isComposing={isComposing[attr.id] || false}
                              menuAnchor={menuAnchor[attr.id] || null}
                              onNameChange={(value) =>
                                handleNameChange(attr.id, value)
                              }
                              onNameSave={() =>
                                handleNameSave(entity.id, attr.id)
                              }
                              onCompositionStart={() =>
                                handleCompositionStart(attr.id)
                              }
                              onCompositionEnd={() =>
                                handleCompositionEnd(attr.id)
                              }
                              onMenuOpen={(e) => handleMenuOpen(e, attr.id)}
                              onMenuClose={() => handleMenuClose()}
                              onDeleteAttribute={() =>
                                handleDeleteAttribute(entity.id, attr.id)
                              }
                              onTypeChange={(newType) =>
                                handleTypeChange(entity.id, attr.id, newType)
                              }
                              onParamChange={(paramIndex, value) => {
                                const { typeName } = parseDataType(
                                  attr.dataType || "VARCHAR",
                                );
                                handleParamChange(
                                  entity.id,
                                  attr.id,
                                  paramIndex,
                                  value,
                                  typeName,
                                );
                              }}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    )}

                    {/* 添加属性按钮 */}
                    <Box
                      sx={{ mt: 1, display: "flex", justifyContent: "center" }}
                    >
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddAttribute(entity.id);
                        }}
                        sx={{
                          color: "var(--secondary-text)",
                          "&:hover": {
                            color: "var(--primary-text)",
                            backgroundColor: "var(--hover-bg)",
                          },
                        }}
                      >
                        添加属性
                      </Button>
                    </Box>
                  </Stack>
                  {entity.description && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="var(--secondary-text)">
                        描述：
                      </Typography>
                      <Typography
                        variant="body2"
                        color="var(--primary-text)"
                        sx={{ ml: 2 }}
                      >
                        {entity.description}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Collapse>
            </Card>
          ))}
        </Stack>
      )}

      <Box
        sx={{
          mt: 2,
          p: 1.5,
          borderRadius: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: "var(--card-border)",
        }}
      >
        <Typography variant="body2">
          从组件库添加实体后，将在此处显示
        </Typography>
        <Typography variant="body2"> 点击实体可展开查看和编辑属性</Typography>
      </Box>
    </Box>
  );
};

export default EntityListView;
