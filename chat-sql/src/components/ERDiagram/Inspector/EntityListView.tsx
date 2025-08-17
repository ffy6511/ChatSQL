"use client";

import React, { useState, useEffect, useRef } from "react";
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
import { useSnackbar } from "@/contexts/SnackbarContext";
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
    updateEntity,
    updateAttribute,
    addAttribute,
    deleteAttribute,
    updateAttributeOrder,
    renameNode,
  } = useERDiagramContext();
  const { showSnackbar } = useSnackbar();
  const entities = state.diagramData?.entities || [];
  const [expandedEntities, setExpandedEntities] = useState<string[]>([]);
  // 用于临时存储每个属性的参数输入 和 属性名的输入
  const [editingEntityNames, setEditingEntityNames] = useState<{
    [entityId: string]: string;
  }>({});
  const [isEntityComposing, setIsEntityComposing] = useState<{
    [entityId: string]: boolean;
  }>({});
  const entityRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 临时存储实体描述的输入状态
  const [editingEntityDescriptions, setEditingEntityDescriptions] = useState<{
    [entityId: string]: string;
  }>({}); // 初始化为空对象

  // 当实体变化时初始化 editingEntityDescriptions
  useEffect(() => {
    const initialDescriptions: { [entityId: string]: string } = {};
    entities.forEach((entity) => {
      // 仅在描述存在时设置，否则使用空字符串
      initialDescriptions[entity.id] = entity.description || "";
    });
    setEditingEntityDescriptions(initialDescriptions);
  }, [entities]); // 依赖于 entities，以便在 entities 变化时重新初始化

  // 处理正在编辑的描述
  const handleUpdateDescription = (entityId: string, description: string) => {
    setEditingEntityDescriptions((prev) => ({
      ...prev,
      [entityId]: description,
    }));
  };

  // 保存描述的处理函数
  const handleSaveDescription = async (entityId: string) => {
    const newDescription = editingEntityDescriptions[entityId];
    if (newDescription !== undefined && state.currentDiagramId) {
      try {
        // 调用上下文函数更新实体
        await updateEntity(entityId, { description: newDescription });
        showSnackbar("实体描述保存成功", "success");
      } catch (error) {
        console.error("保存描述失败:", error);
        showSnackbar("保存描述失败，请重试", "error");
      }
    }
  };

  const {
    menuAnchor,
    attributeParams,
    setAttributeParams,
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
    })
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
      (attr) => `${entityId}-${attr.id}` === activeId
    );
    const newIndex = entity.attributes.findIndex(
      (attr) => `${entityId}-${attr.id}` === overId
    );

    if (oldIndex !== -1 && newIndex !== -1) {
      const newAttributeOrder = arrayMove(
        entity.attributes,
        oldIndex,
        newIndex
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
          attribute.dataType || "VARCHAR"
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
        : [...prev, entityId]
    );
  };

  // 根据selectedElementId自动展开对应实体并滚动到视图
  React.useEffect(() => {
    if (
      state.selectedElementId &&
      entities.find((e) => e.id === state.selectedElementId)
    ) {
      const entityId = state.selectedElementId;
      setExpandedEntities((prev) =>
        prev.includes(entityId) ? prev : [...prev, entityId]
      );

      // 滚动到对应的实体
      setTimeout(() => {
        entityRefs.current[entityId]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100); // 延迟以确保展开动画完成后再滚动
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
        variant='h6'
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <TableChartIcon /> 实体列表
      </Typography>
      <Divider sx={{ my: 1 }} />
      {entities.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant='body2'>暂无实体</Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {entities.map((entity) => (
            <Card
              key={entity.id}
              ref={(el) => {
                entityRefs.current[entity.id] = el;
              }}
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
                  <Stack direction='row' alignItems='center' spacing={0.5}>
                    {expandedEntities.includes(entity.id) ? (
                      <ExpandMoreIcon />
                    ) : (
                      <ExpandLessIcon />
                    )}
                    <TextField
                      size='small'
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
                      variant='standard'
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
                  <Typography variant='body2' color='var(--secondary-text)'>
                    {entity.attributes.length} attributes
                  </Typography>
                </Box>
                <Tooltip title='删除实体'>
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
                    size='small'
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
                timeout='auto'
                unmountOnExit
              >
                <CardContent>
                  <Stack spacing={0}>
                    {entity.attributes.length === 0 ? (
                      <Typography variant='body2' color='var(--secondary-text)'>
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
                            (attr) => `${entity.id}-${attr.id}`
                          )}
                          strategy={verticalListSortingStrategy}
                        >
                          {entity.attributes.map((attr) => (
                            <SortableAttributeItem
                              key={attr.id}
                              id={`${entity.id}-${attr.id}`}
                              attribute={attr}
                              entityId={entity.id}
                              menuAnchor={menuAnchor[attr.id] || null}
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
                                  attr.dataType || "VARCHAR"
                                );
                                handleParamChange(
                                  entity.id,
                                  attr.id,
                                  paramIndex,
                                  value,
                                  typeName
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
                        size='small'
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
                  <Box sx={{ mt: 1 }}>
                    <Typography variant='body2' color='var(--secondary-text)'>
                      描述：
                    </Typography>
                    <TextField
                      multiline
                      rows={2}
                      fullWidth
                      value={editingEntityDescriptions[entity.id] || ""}
                      onChange={(e) =>
                        handleUpdateDescription(entity.id, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveDescription(entity.id);
                          // 失去聚焦
                          (e.target as HTMLTextAreaElement).blur();
                        }
                      }}
                      onBlur={() => handleSaveDescription(entity.id)}
                      placeholder='实体描述为空'
                      variant='standard'
                      size='small'
                      slotProps={{
                        input: {
                          disableUnderline: true,
                          style: {
                            color: "var(--secondary-text)",
                            fontSize: "0.875rem",
                          },
                        },
                      }}
                      sx={{
                        mt: 1,
                        "& .MuiInputBase-root": {
                          border: "none",
                          borderRadius: "16px",
                          transition: " all 0.2s ease-in-out",
                          "&:hover": {
                            border: "1px solid var(--border-color)",
                            padding: "8px",
                          },
                          "&.Mui-focused": {
                            border: "1px solid var(--border-color)",
                            padding: "8px",
                          },
                        },
                        "& .MuiInputBase-input": {
                          padding: "4px",
                        },
                      }}
                    />
                  </Box>
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
        <Typography variant='body2'>
          从组件库添加实体后，将在此处显示
        </Typography>
        <Typography variant='body2'> 点击实体可展开查看和编辑属性</Typography>
      </Box>
    </Box>
  );
};

export default EntityListView;
