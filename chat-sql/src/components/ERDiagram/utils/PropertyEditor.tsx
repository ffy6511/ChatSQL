"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Chip,
  Box,
  Alert,
} from "@mui/material";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Key as KeyIcon,
  Settings as SettingsIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import { useERDiagramContext } from "@/contexts/ERDiagramContext";
import {
  EREntity,
  ERRelationship,
  ERAttribute,
} from "@/types/ERDiagramTypes/erDiagram";
import styles from "./PropertyEditor.module.css";

interface PropertyEditorProps {
  selectedElement: EREntity | ERRelationship | null;
  onUpdateEntity: (id: string, updates: Partial<EREntity>) => void;
  onUpdateRelationship: (id: string, updates: Partial<ERRelationship>) => void;
}

// 数据类型选项
const DATA_TYPES = [
  "char",
  "VARCHAR",
  "INT",
  "SMALLINT",
  "NUMERIC",
  "FLOAT",
  "DOUBLE PRECISION",
  "BOOLEAN",
  "DATE",
  "TIME",
  "TIMESTAMP",
  "INTERVAL",
  "ENUM",
];

const PropertyEditor: React.FC<PropertyEditorProps> = ({
  selectedElement,
  onUpdateEntity,
  onUpdateRelationship,
}) => {
  const [isAddingAttribute, setIsAddingAttribute] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<ERAttribute | null>(
    null,
  );
  const [newAttribute, setNewAttribute] = useState<Partial<ERAttribute>>({
    name: "",
    dataType: "VARCHAR(50)",
    isPrimaryKey: false,
    isRequired: false,
    description: "",
  });

  // 判断选中元素类型
  const isEntity =
    selectedElement &&
    "attributes" in selectedElement &&
    !("connections" in selectedElement);
  const isRelationship = selectedElement && "connections" in selectedElement;

  // 添加新属性
  const handleAddAttribute = () => {
    if (!selectedElement || !newAttribute.name?.trim()) return;

    const attributeToAdd: ERAttribute = {
      id: `attr_${Date.now()}`,
      name: newAttribute.name.trim(),
      dataType: newAttribute.dataType || "VARCHAR(50)",
      isPrimaryKey: newAttribute.isPrimaryKey || false,
      isRequired: newAttribute.isRequired || false,
      description: newAttribute.description || "",
    };

    if (isEntity) {
      const entity = selectedElement as EREntity;
      const updatedAttributes = [...(entity.attributes || []), attributeToAdd];
      onUpdateEntity(entity.id, { attributes: updatedAttributes });
    } else if (isRelationship) {
      const relationship = selectedElement as ERRelationship;
      const updatedAttributes = [
        ...(relationship.attributes || []),
        attributeToAdd,
      ];
      onUpdateRelationship(relationship.id, { attributes: updatedAttributes });
    }

    setIsAddingAttribute(false);
    setNewAttribute({
      name: "",
      dataType: "VARCHAR",
      isPrimaryKey: false,
      isRequired: false,
      description: "",
    });
  };

  // 编辑属性
  const handleEditAttribute = () => {
    if (!selectedElement || !editingAttribute || !editingAttribute.name?.trim())
      return;

    const updatedAttribute: ERAttribute = {
      ...editingAttribute,
      name: editingAttribute.name.trim(),
    };

    if (isEntity) {
      const entity = selectedElement as EREntity;
      const updatedAttributes = entity.attributes.map((attr) =>
        attr.id === editingAttribute.id ? updatedAttribute : attr,
      );
      onUpdateEntity(entity.id, { attributes: updatedAttributes });
    } else if (isRelationship) {
      const relationship = selectedElement as ERRelationship;
      const updatedAttributes = (relationship.attributes || []).map((attr) =>
        attr.id === editingAttribute.id ? updatedAttribute : attr,
      );
      onUpdateRelationship(relationship.id, { attributes: updatedAttributes });
    }

    setEditingAttribute(null);
  };

  // 删除属性
  const handleDeleteAttribute = (attributeId: string) => {
    if (!selectedElement) return;

    if (isEntity) {
      const entity = selectedElement as EREntity;
      const updatedAttributes = entity.attributes.filter(
        (attr) => attr.id !== attributeId,
      );
      onUpdateEntity(entity.id, { attributes: updatedAttributes });
    } else if (isRelationship) {
      const relationship = selectedElement as ERRelationship;
      const updatedAttributes = (relationship.attributes || []).filter(
        (attr) => attr.id !== attributeId,
      );
      onUpdateRelationship(relationship.id, { attributes: updatedAttributes });
    }
  };

  // 更新实体描述
  const handleUpdateDescription = (description: string) => {
    if (!selectedElement) return;

    if (isEntity) {
      onUpdateEntity(selectedElement.id, { description });
    } else if (isRelationship) {
      onUpdateRelationship(selectedElement.id, { description });
    }
  };

  // 切换弱实体集状态
  const handleToggleWeakEntity = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!selectedElement || !isEntity) return;
    onUpdateEntity(selectedElement.id, { isWeakEntity: event.target.checked });
  };

  if (!selectedElement) {
    return (
      <Box className={styles.emptyState}>
        <SettingsIcon className={styles.emptyIcon} />
        <Typography variant="body2" color="textSecondary">
          选择一个节点来编辑其属性
        </Typography>
      </Box>
    );
  }

  const attributes = isEntity
    ? (selectedElement as EREntity).attributes
    : (selectedElement as ERRelationship).attributes || [];

  return (
    <Box className={styles.propertyEditor}>
      <Box className={styles.header}>
        <Typography variant="h6" className={styles.title}>
          {isEntity ? "实体属性" : "关系属性"}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {selectedElement.name}
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* 基本信息 */}
      <Card className={styles.section}>
        <CardHeader title="基本信息" />
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                名称：
              </Typography>
              <Typography variant="body2">{selectedElement.name}</Typography>
            </Box>

            <Box>
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", mb: 1 }}
              >
                描述：
              </Typography>
              <TextField
                multiline
                rows={2}
                fullWidth
                value={selectedElement.description || ""}
                onChange={(e) => handleUpdateDescription(e.target.value)}
                placeholder="输入描述信息"
                variant="outlined"
                size="small"
              />
            </Box>

            {isEntity && (
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={
                        (selectedElement as EREntity).isWeakEntity || false
                      }
                      onChange={handleToggleWeakEntity}
                      color="primary"
                    />
                  }
                  label="弱实体集"
                />
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* 属性列表 */}
      <Card className={styles.section}>
        <CardHeader
          title="属性列表"
          action={
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setIsAddingAttribute(true)}
            >
              添加属性
            </Button>
          }
        />
        <CardContent>
          <List>
            {attributes.map((attribute) => (
              <ListItem key={attribute.id} divider>
                <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
                  {attribute.isPrimaryKey && (
                    <KeyIcon className={styles.primaryKeyIcon} />
                  )}
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold" }}
                      >
                        {attribute.name}
                      </Typography>
                      {attribute.isPrimaryKey && (
                        <Chip
                          label={
                            isEntity &&
                            (selectedElement as EREntity).isWeakEntity
                              ? "DIS"
                              : "PK"
                          }
                          size="small"
                          color="error"
                          className={styles.pkBadge}
                        />
                      )}
                      {attribute.isRequired && (
                        <Chip
                          label="必填"
                          size="small"
                          color="warning"
                          className={styles.requiredBadge}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="textSecondary">
                        {attribute.dataType}
                      </Typography>
                      {attribute.description && (
                        <Typography
                          variant="caption"
                          color="textSecondary"
                          className={styles.description}
                        >
                          {attribute.description}
                        </Typography>
                      )}
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    size="small"
                    onClick={() => setEditingAttribute(attribute)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handleDeleteAttribute(attribute.id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {attributes.length === 0 && (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      color="textSecondary"
                      align="center"
                    >
                      暂无属性，点击"添加属性"开始添加
                    </Typography>
                  }
                />
              </ListItem>
            )}
          </List>
        </CardContent>
      </Card>

      {/* 添加属性对话框 */}
      <Dialog
        open={isAddingAttribute}
        onClose={() => {
          setIsAddingAttribute(false);
          setNewAttribute({
            name: "",
            dataType: "VARCHAR(50)",
            isPrimaryKey: false,
            isRequired: false,
            description: "",
          });
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>添加属性</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <TextField
              label="属性名称"
              value={newAttribute.name || ""}
              onChange={(e) =>
                setNewAttribute({ ...newAttribute, name: e.target.value })
              }
              placeholder="输入属性名称"
              fullWidth
              required
            />

            <FormControl fullWidth>
              <InputLabel>数据类型</InputLabel>
              <Select
                value={newAttribute.dataType || "VARCHAR(50)"}
                onChange={(e) =>
                  setNewAttribute({ ...newAttribute, dataType: e.target.value })
                }
                label="数据类型"
              >
                {DATA_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControlLabel
              control={
                <Switch
                  checked={newAttribute.isPrimaryKey || false}
                  onChange={(e) =>
                    setNewAttribute({
                      ...newAttribute,
                      isPrimaryKey: e.target.checked,
                    })
                  }
                />
              }
              label="主键"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={newAttribute.isRequired || false}
                  onChange={(e) =>
                    setNewAttribute({
                      ...newAttribute,
                      isRequired: e.target.checked,
                    })
                  }
                />
              }
              label="必填"
            />

            <TextField
              label="描述"
              value={newAttribute.description || ""}
              onChange={(e) =>
                setNewAttribute({
                  ...newAttribute,
                  description: e.target.value,
                })
              }
              placeholder="输入属性描述"
              multiline
              rows={2}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setIsAddingAttribute(false);
              setNewAttribute({
                name: "",
                dataType: "VARCHAR(50)",
                isPrimaryKey: false,
                isRequired: false,
                description: "",
              });
            }}
          >
            取消
          </Button>
          <Button
            onClick={handleAddAttribute}
            variant="contained"
            disabled={!newAttribute.name?.trim()}
            startIcon={<SaveIcon />}
          >
            添加
          </Button>
        </DialogActions>
      </Dialog>

      {/* 编辑属性对话框 */}
      <Dialog
        open={!!editingAttribute}
        onClose={() => setEditingAttribute(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>编辑属性</DialogTitle>
        <DialogContent>
          {editingAttribute && (
            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}
            >
              <TextField
                label="属性名称"
                value={editingAttribute.name || ""}
                onChange={(e) =>
                  setEditingAttribute({
                    ...editingAttribute,
                    name: e.target.value,
                  })
                }
                placeholder="输入属性名称"
                fullWidth
                required
              />

              <FormControl fullWidth>
                <InputLabel>数据类型</InputLabel>
                <Select
                  value={editingAttribute.dataType || "VARCHAR(50)"}
                  onChange={(e) =>
                    setEditingAttribute({
                      ...editingAttribute,
                      dataType: e.target.value,
                    })
                  }
                  label="数据类型"
                >
                  {DATA_TYPES.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControlLabel
                control={
                  <Switch
                    checked={editingAttribute.isPrimaryKey || false}
                    onChange={(e) =>
                      setEditingAttribute({
                        ...editingAttribute,
                        isPrimaryKey: e.target.checked,
                      })
                    }
                  />
                }
                label="主键"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={editingAttribute.isRequired || false}
                    onChange={(e) =>
                      setEditingAttribute({
                        ...editingAttribute,
                        isRequired: e.target.checked,
                      })
                    }
                  />
                }
                label="必填"
              />

              <TextField
                label="描述"
                value={editingAttribute.description || ""}
                onChange={(e) =>
                  setEditingAttribute({
                    ...editingAttribute,
                    description: e.target.value,
                  })
                }
                placeholder="输入属性描述"
                multiline
                rows={2}
                fullWidth
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditingAttribute(null)}>取消</Button>
          <Button
            onClick={handleEditAttribute}
            variant="contained"
            disabled={!editingAttribute?.name?.trim()}
            startIcon={<SaveIcon />}
          >
            保存
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PropertyEditor;
