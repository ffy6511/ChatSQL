"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Chip,
  Stack,
  Divider,
  Typography,
  Tooltip,
  Collapse,
  Select,
  MenuItem,
  FormControl,
  TextField,
  Button,
  Menu,
  Autocomplete,
} from "@mui/material";
import {
  Share as ShareIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
} from "@mui/icons-material";
import { useERDiagramContext } from "@/contexts/ERDiagramContext";
import {
  ERRelationship,
  ERConnection,
  ERAttribute,
} from "@/types/ERDiagramTypes/erDiagram";
import {
  dataTypeParamConfig,
  dataTypeOptions,
  parseDataType,
  buildDataType,
  getDefaultParams,
} from "@/types/ERDiagramTypes/dataTypes";
import styles from "./Inspector.module.css";
import { useSnackbar } from "@/contexts/SnackbarContext";

const RelationshipListView: React.FC = () => {
  const {
    state,
    deleteRelationship,
    setSelectedElement,
    updateConnection,
    addRelationshipAttribute,
    deleteRelationshipAttribute,
    updateRelationshipAttribute,
    renameNode,
    updateRelationship,
    deleteConnection, // 添加deleteConnection方法
  } = useERDiagramContext();
  const { showSnackbar } = useSnackbar();
  const relationships = state.diagramData?.relationships || [];
  const entities = state.diagramData?.entities || [];
  const [expandedRelationships, setExpandedRelationships] = useState<string[]>(
    []
  );
  const [editingConnection, setEditingConnection] = useState<string | null>(
    null
  );
  const relationshipRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // 跟踪编辑的关系属性
  const [editingAttributeNames, setEditingAttributeNames] = useState<{
    [attrId: string]: string;
  }>({});
  const [editingRelationshipNames, setEditingRelationshipNames] = useState<{
    [relId: string]: string;
  }>({});
  const [isComposing, setIsComposing] = useState<{ [attrId: string]: boolean }>(
    {}
  );
  const [isRelationshipComposing, setIsRelationshipComposing] = useState<{
    [relId: string]: boolean;
  }>({});
  const [attributeMenuAnchor, setAttributeMenuAnchor] = useState<{
    [attrId: string]: HTMLElement | null;
  }>({});
  // 用于临时存储每个关系属性的参数输入
  const [attributeParams, setAttributeParams] = useState<{
    [attrId: string]: string[];
  }>({});

  // 临时存储关系描述的输入
  const [editingRelationshipDescriptions, setEditingRelationshipDescriptions] =
    useState<{
      [relId: string]: string;
    }>({});

  // 关系变化时初始化描述
  useEffect(() => {
    // 初始化为空
    const initialDescriptions: { [relId: string]: string } = {};

    // 遍历关系并初始化描述
    relationships.forEach((relationship) => {
      initialDescriptions[relationship.id] = relationship.description || "";
    });
    setEditingRelationshipDescriptions(initialDescriptions);
  }, [relationships]);

  // 处理正在编辑的描述
  const handleDescriptionChange = (
    relationshipId: string,
    newDescription: string
  ) => {
    setEditingRelationshipDescriptions((prev) => ({
      ...prev,
      [relationshipId]: newDescription,
    }));
  };

  // 保存描述
  const handleSaveDescription = async (relationshipId: string) => {
    const newDescription = editingRelationshipDescriptions[relationshipId];
    if (newDescription !== undefined && state.currentDiagramId) {
      try {
        // 调用上下文函数更新关系
        await updateRelationship(relationshipId, {
          description: newDescription,
        });
        showSnackbar("关系描述保存成功", "success");
      } catch (error) {
        console.error("保存描述失败:", error);
        showSnackbar("保存描述失败，请重试", "error");
      }
    }
  };

  // 生成新关系属性的辅助函数
  const generateNewRelationshipAttribute = (): ERAttribute => {
    const timestamp = Date.now();
    return {
      id: `rel_attr_${timestamp}`,
      name: "新属性",
      dataType: "VARCHAR",
      isPrimaryKey: false,
      isRequired: false,
      description: "",
    };
  };

  // 添加关系属性处理函数
  const handleAddRelationshipAttribute = async (relationshipId: string) => {
    const newAttribute = generateNewRelationshipAttribute();
    await addRelationshipAttribute(relationshipId, newAttribute);
  };

  // 关系属性菜单处理函数
  const handleAttributeMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    attributeId: string
  ) => {
    event.stopPropagation();
    setAttributeMenuAnchor((prev) => ({
      ...prev,
      [attributeId]: event.currentTarget,
    }));
  };

  const handleAttributeMenuClose = () => {
    setAttributeMenuAnchor({});
  };

  const handleDeleteRelationshipAttributeFromMenu = async (
    relationshipId: string,
    attributeId: string
  ) => {
    handleAttributeMenuClose();
    await deleteRelationshipAttribute(relationshipId, attributeId);
  };

  // 关系属性名称编辑相关处理函数
  const handleAttributeNameChange = (attributeId: string, newName: string) => {
    setEditingAttributeNames((prev) => ({ ...prev, [attributeId]: newName }));
  };

  const handleAttributeNameSave = async (
    relationshipId: string,
    attributeId: string
  ) => {
    if (isComposing[attributeId]) {
      return;
    }

    const newName = editingAttributeNames[attributeId];
    if (newName !== undefined) {
      const finalName = newName.trim() || "未命名";
      await updateRelationshipAttribute(relationshipId, attributeId, {
        name: finalName,
      });

      setEditingAttributeNames((prev) => {
        const newState = { ...prev };
        delete newState[attributeId];
        return newState;
      });
    }
  };

  const handleCompositionStart = (attributeId: string) => {
    setIsComposing((prev) => ({ ...prev, [attributeId]: true }));
  };

  const handleCompositionEnd = (attributeId: string) => {
    setIsComposing((prev) => ({ ...prev, [attributeId]: false }));
  };

  const handleRelationshipNameChange = (
    relationshipId: string,
    newName: string
  ) => {
    setEditingRelationshipNames((prev) => ({
      ...prev,
      [relationshipId]: newName,
    }));
  };

  const handleRelationshipNameSave = async (relationshipId: string) => {
    if (isRelationshipComposing[relationshipId]) {
      return;
    }

    const newName = editingRelationshipNames[relationshipId];
    if (newName !== undefined) {
      const finalName = newName.trim() || "未命名关系";
      await renameNode(relationshipId, finalName);

      setEditingRelationshipNames((prev) => {
        const newState = { ...prev };
        delete newState[relationshipId];
        return newState;
      });
    }
  };

  const handleRelationshipCompositionStart = (relationshipId: string) => {
    setIsRelationshipComposing((prev) => ({ ...prev, [relationshipId]: true }));
  };

  const handleRelationshipCompositionEnd = (relationshipId: string) => {
    setIsRelationshipComposing((prev) => ({
      ...prev,
      [relationshipId]: false,
    }));
  };

  const handleAttributeTypeChange = (
    relationshipId: string,
    attributeId: string,
    dataType: string
  ) => {
    // 切换类型时，初始化参数输入
    if (dataTypeParamConfig[dataType]) {
      setAttributeParams((prev) => ({
        ...prev,
        [attributeId]: getDefaultParams(dataType),
      }));
    } else {
      setAttributeParams((prev) => ({ ...prev, [attributeId]: [] }));
    }
    // 先只存类型名，参数后续拼接
    updateRelationshipAttribute(relationshipId, attributeId, { dataType });
  };

  // 处理关系属性参数变化
  const handleRelationshipParamChange = async (
    relationshipId: string,
    attributeId: string,
    paramIndex: number,
    value: string,
    typeName: string
  ) => {
    // 获取当前属性的参数
    const relationship = relationships.find((r) => r.id === relationshipId);
    const attribute = relationship?.attributes?.find(
      (attr) => attr.id === attributeId
    );
    if (!attribute) return;

    const { params: currentParams } = parseDataType(attribute.dataType || "");

    // 更新指定索引的参数
    const newParams = [...currentParams];
    newParams[paramIndex] = value;

    // 构建新的数据类型字符串
    const newDataType = buildDataType(typeName, newParams);

    // 保存更新
    await updateRelationshipAttribute(relationshipId, attributeId, {
      dataType: newDataType,
    });
  };

  // 初始化关系属性参数
  React.useEffect(() => {
    const newParams: { [attrId: string]: string[] } = {};
    relationships.forEach((relationship) => {
      relationship.attributes?.forEach((attribute) => {
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
  }, [relationships]);

  // 处理展开/收起
  const handleExpand = (relationshipId: string) => {
    setExpandedRelationships((prev) =>
      prev.includes(relationshipId)
        ? prev.filter((id) => id !== relationshipId)
        : [...prev, relationshipId]
    );
  };

  // 根据selectedElementId自动展开对应关系并滚动到视图
  React.useEffect(() => {
    if (
      state.selectedElementId &&
      relationships.find((r) => r.id === state.selectedElementId)
    ) {
      const relationshipId = state.selectedElementId;
      setExpandedRelationships((prev) =>
        prev.includes(relationshipId) ? prev : [...prev, relationshipId]
      );

      // 滚动到对应的关系
      setTimeout(() => {
        relationshipRefs.current[relationshipId]?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100); // 延迟以确保展开动画完成后再滚动
    }
  }, [state.selectedElementId, relationships]);

  // 获取实体名称
  const getEntityName = (entityId: string) => {
    const entity = entities.find((e) => e.id === entityId);
    return entity?.name || "未知实体";
  };

  // 判断是否为弱关系
  const isWeakRelationship = (relationship: ERRelationship) => {
    return relationship.connections.some((connection: ERConnection) => {
      const entity = entities.find((e) => e.id === connection.entityId);
      return entity?.isWeakEntity === true;
    });
  };

  // 基数选项
  const cardinalityOptions = ["0..1", "1..1", "0..*", "1..*"];

  // 处理基数变更
  const handleCardinalityChange = (
    relationshipId: string,
    entityId: string,
    newCardinality: string
  ) => {
    updateConnection(relationshipId, entityId, {
      cardinality: newCardinality as ERConnection["cardinality"],
    });
    setEditingConnection(null);
  };

  const renderConnectionItem = (
    connection: ERConnection,
    relationshipId: string
  ) => {
    const isEditing =
      editingConnection === `${relationshipId}-${connection.entityId}`;

    return (
      <Box
        key={connection.entityId}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          p: 1,
          border: "1px solid var(--card-border)",
          borderRadius: 2,
          mb: 1,
        }}
      >
        <Typography sx={{ flex: 1, ml: 1 }}>
          {getEntityName(connection.entityId)}
        </Typography>

        {isEditing ? (
          <FormControl size='small' sx={{ minWidth: 40 }}>
            <Select
              value={connection.cardinality}
              onChange={(e) =>
                handleCardinalityChange(
                  relationshipId,
                  connection.entityId,
                  e.target.value
                )
              }
              onBlur={() => setEditingConnection(null)}
              autoFocus
              onClose={() => setEditingConnection(null)}
            >
              {cardinalityOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Chip
            label={connection.cardinality}
            clickable
            onClick={() =>
              setEditingConnection(`${relationshipId}-${connection.entityId}`)
            }
          />
        )}

        {connection.role && (
          <Typography variant='body2'>({connection.role})</Typography>
        )}
        
        <Tooltip title="删除连接">
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              deleteConnection(relationshipId, connection.entityId);
            }}
            sx={{
              opacity: 0.6,
              "&:hover": {
                opacity: 1,
                color: "var(--error-color)",
                backgroundColor: "var(--hover-bg)",
              },
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  };

  // 渲染关系属性项（支持内联编辑）
  const renderRelationshipAttributeItem = (
    attribute: ERAttribute,
    relationshipId: string
  ) => {
    // 解析当前类型和参数
    const { typeName } = parseDataType(attribute.dataType || "VARCHAR");

    return (
      <Box
        key={attribute.id}
        sx={{
          p: 1,
          borderRadius: 2,
          mb: 1,
          bgcolor: "var(--card-bg)",
          border: "1px solid var(--card-border)",
        }}
      >
        <Stack
          direction='row'
          alignItems='center'
          spacing={1}
          sx={{ overflow: "hidden", flexWrap: "nowrap" }}
        >
          <Box sx={{ display: "flex", gap: 1, flexGrow: 1 }}>
            <TextField
              size='small'
              value={
                editingAttributeNames[attribute.id] !== undefined
                  ? editingAttributeNames[attribute.id]
                  : attribute.name
              }
              onChange={(e) =>
                handleAttributeNameChange(attribute.id, e.target.value)
              }
              onBlur={() =>
                handleAttributeNameSave(relationshipId, attribute.id)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isComposing[attribute.id]) {
                  e.preventDefault();
                  handleAttributeNameSave(relationshipId, attribute.id);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              onCompositionStart={() => handleCompositionStart(attribute.id)}
              onCompositionEnd={() => handleCompositionEnd(attribute.id)}
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
              value={attribute.dataType || "VARCHAR"}
              onChange={(_, newValue) => {
                if (newValue) {
                  handleAttributeTypeChange(
                    relationshipId,
                    attribute.id,
                    newValue
                  );
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

          {/* 属性操作菜单 */}
          <Tooltip title='属性操作'>
            <IconButton
              size='small'
              onClick={(e) => handleAttributeMenuOpen(e, attribute.id)}
              sx={{
                opacity: 0.6,
                marginLeft: "auto",
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
          anchorEl={attributeMenuAnchor[attribute.id]}
          open={Boolean(attributeMenuAnchor[attribute.id])}
          onClose={handleAttributeMenuClose}
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
            <>
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
                      value={currentValue}
                      onChange={(e) =>
                        handleRelationshipParamChange(
                          relationshipId,
                          attribute.id,
                          idx,
                          e.target.value,
                          typeName
                        )
                      }
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
            </>
          )}

          <MenuItem
            onClick={() =>
              handleDeleteRelationshipAttributeFromMenu(
                relationshipId,
                attribute.id
              )
            }
            sx={{ color: "error.main" }}
          >
            <DeleteIcon fontSize='small' sx={{ mr: 1 }} />
            删除
          </MenuItem>
        </Menu>
      </Box>
    );
  };

  return (
    <Box>
      <Typography
        variant='h6'
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <ShareIcon /> 关系列表
      </Typography>
      <Divider sx={{ my: 1 }} />
      {relationships.length === 0 ? (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography variant='body2'>暂无关系</Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {relationships.map((relationship) => (
            <Card
              key={relationship.id}
              ref={(el) => {
                relationshipRefs.current[relationship.id] = el;
              }}
              className={`${styles.relationshipCard} ${
                state.selectedElementId === relationship.id
                  ? styles.selected
                  : ""
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
                onClick={() => handleExpand(relationship.id)}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Stack direction='row' alignItems='center' spacing={0.5}>
                    {expandedRelationships.includes(relationship.id) ? (
                      <ExpandMoreIcon />
                    ) : (
                      <ExpandLessIcon />
                    )}
                    <TextField
                      size='small'
                      value={
                        editingRelationshipNames[relationship.id] !== undefined
                          ? editingRelationshipNames[relationship.id]
                          : relationship.name
                      }
                      onChange={(e) =>
                        handleRelationshipNameChange(
                          relationship.id,
                          e.target.value
                        )
                      }
                      onBlur={() => handleRelationshipNameSave(relationship.id)}
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !isRelationshipComposing[relationship.id]
                        ) {
                          e.preventDefault();
                          handleRelationshipNameSave(relationship.id);
                          (e.target as HTMLInputElement).blur();
                        }
                      }}
                      onCompositionStart={() =>
                        handleRelationshipCompositionStart(relationship.id)
                      }
                      onCompositionEnd={() =>
                        handleRelationshipCompositionEnd(relationship.id)
                      }
                      variant='standard'
                      InputProps={{
                        disableUnderline: true,
                        style: {
                          fontWeight: "bold",
                          fontSize: "inherit",
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
                  <Typography variant='body2'>
                    {relationship.connections.length} 个连接
                  </Typography>
                </Box>
                <Tooltip title='删除关系'>
                  <IconButton
                    size='small'
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRelationship(relationship.id);
                    }}
                    sx={{
                      opacity: 0.6,
                      mr: 2,
                      "&:hover": {
                        opacity: 1,
                        color: "var(--error-color)",
                        backgroundColor: "var(--hover-bg)",
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Collapse
                in={expandedRelationships.includes(relationship.id)}
                timeout='auto'
                unmountOnExit
              >
                <CardContent>
                  <Divider style={{ margin: "8px 0" }} />

                  <Stack spacing={0.5}>
                    <Typography variant='body2'>连接实体：</Typography>
                    {relationship.connections.map((connection) =>
                      renderConnectionItem(connection, relationship.id)
                    )}
                  </Stack>

                  {/* 关系属性部分 */}
                  <Stack spacing={0.5} sx={{ mt: 2 }}>
                    <Typography variant='body2'>关系属性：</Typography>
                    {relationship.attributes &&
                    relationship.attributes.length > 0 ? (
                      relationship.attributes.map((attr) =>
                        renderRelationshipAttributeItem(attr, relationship.id)
                      )
                    ) : (
                      <Typography variant='body2' color='var(--secondary-text)'>
                        暂无属性
                      </Typography>
                    )}

                    {/* 添加关系属性按钮 */}
                    <Box
                      sx={{ mt: 1, display: "flex", justifyContent: "center" }}
                    >
                      <Button
                        size='small'
                        startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddRelationshipAttribute(relationship.id);
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
                      value={
                        editingRelationshipDescriptions[relationship.id] || ""
                      }
                      onChange={(e) =>
                        handleDescriptionChange(relationship.id, e.target.value)
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSaveDescription(relationship.id);
                          // 失去聚焦
                          (e.target as HTMLTextAreaElement).blur();
                        }
                      }}
                      onBlur={() => handleSaveDescription(relationship.id)}
                      placeholder='关系描述为空'
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
        <Typography variant='body2'>连接实体和关系后，将在此处显示</Typography>
        <Typography variant='body2'>可以编辑基数约束和参与约束</Typography>
      </Box>
    </Box>
  );
};

export default RelationshipListView;
