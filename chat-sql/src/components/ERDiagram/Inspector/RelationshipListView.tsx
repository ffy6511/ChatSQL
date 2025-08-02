"use client";

import React, { useState } from "react";
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
  } = useERDiagramContext();
  const relationships = state.diagramData?.relationships || [];
  const entities = state.diagramData?.entities || [];
  const [expandedRelationships, setExpandedRelationships] = useState<string[]>(
    []
  );
  const [editingConnection, setEditingConnection] = useState<string | null>(
    null
  );

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
      const finalName = newName.trim() || "未命名属性";
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

  // 根据selectedElementId自动展开对应关系
  React.useEffect(() => {
    if (
      state.selectedElementId &&
      relationships.find((r) => r.id === state.selectedElementId)
    ) {
      setExpandedRelationships((prev) =>
        prev.includes(state.selectedElementId!)
          ? prev
          : [...prev, state.selectedElementId!]
      );
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
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 1,
          mb: 1,
        }}
      >
        <Typography sx={{ flex: 1 }}>
          {getEntityName(connection.entityId)}
        </Typography>

        {isEditing ? (
          <FormControl size='small' sx={{ minWidth: 80 }}>
            <Select
              value={connection.cardinality}
              onChange={(e) =>
                handleCardinalityChange(
                  relationshipId,
                  connection.entityId,
                  e.target.value
                )
              }
              autoFocus
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
            color='info'
            clickable
            onClick={() =>
              setEditingConnection(`${relationshipId}-${connection.entityId}`)
            }
          />
        )}

        {connection.role && (
          <Typography variant='body2' color='text.secondary'>
            ({connection.role})
          </Typography>
        )}
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
          borderRadius: 1,
          mb: 1,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
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
          <Typography variant='body2' color='text.secondary'>
            暂无关系
          </Typography>
        </Box>
      ) : (
        <Stack spacing={1}>
          {relationships.map((relationship) => (
            <Card
              key={relationship.id}
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
                    {/* {isWeakRelationship(relationship) && (
                      <Chip label="弱关系" color="secondary" />
                    )} */}
                  </Stack>
                  <Typography variant='body2' color='text.secondary'>
                    {relationship.connections.length} 个连接
                  </Typography>
                </Box>
                <Stack direction='row' spacing={0.5}>
                  <Tooltip title='编辑'>
                    <IconButton
                      size='small'
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedElement(relationship.id);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='删除'>
                    <IconButton
                      size='small'
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteRelationship(relationship.id);
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Box>

              <Collapse
                in={expandedRelationships.includes(relationship.id)}
                timeout='auto'
                unmountOnExit
              >
                <CardContent>
                  <Divider style={{ margin: "8px 0" }} />

                  <Stack spacing={0.5}>
                    <Typography variant='body2' color='text.secondary'>
                      连接实体：
                    </Typography>
                    {relationship.connections.map((connection) =>
                      renderConnectionItem(connection, relationship.id)
                    )}
                  </Stack>

                  {/* 关系属性部分 */}
                  <Stack spacing={0.5}>
                    <Typography variant='body2' color='text.secondary'>
                      关系属性：
                    </Typography>
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

                  {relationship.description && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant='body2' color='text.secondary'>
                        描述：
                      </Typography>
                      <Typography>{relationship.description}</Typography>
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
          bgcolor: "grey.100",
          borderRadius: 1,
          borderLeft: 3,
          borderColor: "primary.main",
        }}
      >
        <Typography variant='body2' color='text.secondary'>
          连接实体和关系后，将在此处显示
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          可以编辑基数约束和参与约束
        </Typography>
      </Box>
    </Box>
  );
};

export default RelationshipListView;
