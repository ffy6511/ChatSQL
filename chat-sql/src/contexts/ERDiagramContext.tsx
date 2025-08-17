"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  ERDiagramData,
  sampleERData,
  employeeDepartmentERData,
  weakEntityERData,
  EREntity,
  ERRelationship,
} from "@/types/ERDiagramTypes/erDiagram";
import {
  erDiagramStorage,
  ERDiagramMetadata,
} from "@/services/erDiagramStorage";
import { useEffect, useCallback } from "react";

type ActiveTab = "components" | "entities" | "relationships" | "quiz-history";
type NodeEditMode = "none" | "rename" | "properties";

interface ERDiagramState {
  currentDiagramId: string | null;
  diagramData: ERDiagramData | null;
  activeSidebarTab: ActiveTab;
  selectedElementId: string | null;
  // 节点编辑相关状态
  selectedNodeId: string | null;
  editingNodeId: string | null;
  nodeEditMode: NodeEditMode;
  diagramList: ERDiagramMetadata[];
  // 固定题目相关状态
  pinnedQuizId: string | null;
}

// 重构后的 Action 类型，移除异步相关的 Action 类型
type ERDiagramAction =
  | { type: "SET_DIAGRAM_DATA"; payload: ERDiagramData }
  | { type: "SET_ACTIVE_TAB"; payload: ActiveTab }
  | { type: "SET_SELECTED_ELEMENT"; payload: string | null }
  | { type: "LOAD_SAMPLE_DATA" }
  | { type: "ADD_ENTITY"; payload: { entity: EREntity } }
  | { type: "ADD_RELATIONSHIP"; payload: { relationship: ERRelationship } }
  | {
      type: "UPDATE_ENTITY";
      payload: { id: string; entity: Partial<EREntity> };
    }
  | {
      type: "UPDATE_RELATIONSHIP";
      payload: { id: string; relationship: Partial<ERRelationship> };
    }
  | { type: "DELETE_ENTITY"; payload: { id: string } }
  | { type: "DELETE_RELATIONSHIP"; payload: { id: string } }
  // 节点编辑相关Action
  | { type: "SELECT_NODE"; payload: { nodeId: string | null } }
  | { type: "START_EDIT_NODE"; payload: { nodeId: string; mode: NodeEditMode } }
  | { type: "FINISH_EDIT_NODE" }
  | { type: "RENAME_NODE"; payload: { nodeId: string; newName: string } }
  // 属性编辑相关Action
  | {
      type: "ADD_ATTRIBUTE";
      payload: {
        entityId: string;
        attribute: import("@/types/ERDiagramTypes/erDiagram").ERAttribute;
      };
    }
  | {
      type: "DELETE_ATTRIBUTE";
      payload: { entityId: string; attributeId: string };
    }
  | {
      type: "UPDATE_ATTRIBUTE";
      payload: {
        entityId: string;
        attributeId: string;
        updates: Partial<
          import("@/types/ERDiagramTypes/erDiagram").ERAttribute
        >;
      };
    }
  | {
      type: "UPDATE_CONNECTION";
      payload: {
        relationshipId: string;
        entityId: string;
        updates: Partial<
          import("@/types/ERDiagramTypes/erDiagram").ERConnection
        >;
      };
    }
  // 关系属性编辑相关的Action
  | {
      type: "ADD_RELATIONSHIP_ATTRIBUTE";
      payload: {
        relationshipId: string;
        attribute: import("@/types/ERDiagramTypes/erDiagram").ERAttribute;
      };
    }
  | {
      type: "DELETE_RELATIONSHIP_ATTRIBUTE";
      payload: { relationshipId: string; attributeId: string };
    }
  | {
      type: "UPDATE_RELATIONSHIP_ATTRIBUTE";
      payload: {
        relationshipId: string;
        attributeId: string;
        updates: Partial<
          import("@/types/ERDiagramTypes/erDiagram").ERAttribute
        >;
      };
    }
  // 连接管理相关Action
  | {
      type: "CREATE_CONNECTION";
      payload: {
        relationshipId: string;
        connection: import("@/types/ERDiagramTypes/erDiagram").ERConnection;
      };
    }
  | {
      type: "DELETE_CONNECTION";
      payload: { relationshipId: string; entityId: string };
    }
  // 纯状态更新的 Action
  | { type: "NEW_DIAGRAM" }
  | { type: "SET_CURRENT_DIAGRAM_ID"; payload: { id: string | null } }
  | { type: "SET_DIAGRAM_LIST"; payload: ERDiagramMetadata[] }
  | {
      type: "UPDATE_ATTRIBUTE_ORDER";
      payload: { entityId: string; attributeIds: string[] };
    }
  // 固定题目相关Action
  | { type: "SET_PINNED_QUIZ"; payload: { quizId: string | null } }
  | {
      type: "UPDATE_NODE_POSITION";
      payload: { nodeId: string; position: { x: number; y: number } };
    };

const initialState: ERDiagramState = {
  currentDiagramId: null,
  diagramData: null,
  activeSidebarTab: "components",
  selectedElementId: null,
  //节点编辑相关初始状态
  selectedNodeId: null,
  editingNodeId: null,
  nodeEditMode: "none",
  diagramList: [],
  // 固定题目相关初始状态
  pinnedQuizId: null,
};

function erDiagramReducer(
  state: ERDiagramState,
  action: ERDiagramAction
): ERDiagramState {
  switch (action.type) {
    case "SET_DIAGRAM_DATA":
      // 优化：SET_DIAGRAM_DATA 只负责更新图表数据，不修改 currentDiagramId
      return {
        ...state,
        diagramData: action.payload,
      };
    case "SET_ACTIVE_TAB":
      return {
        ...state,
        activeSidebarTab: action.payload,
      };
    case "SET_SELECTED_ELEMENT":
      return {
        ...state,
        selectedElementId: action.payload,
      };
    case "NEW_DIAGRAM":
      return {
        ...state,
        currentDiagramId: null,
        diagramData: {
          entities: [],
          relationships: [],
          metadata: {
            title: "新建ER图",
            description: "",
            version: "1.0.0",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "LOAD_SAMPLE_DATA":
      return {
        ...state,
        diagramData: sampleERData,
      };
    case "ADD_ENTITY":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: [...state.diagramData.entities, action.payload.entity],
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "ADD_RELATIONSHIP":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: [
            ...state.diagramData.relationships,
            action.payload.relationship,
          ],
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "UPDATE_ENTITY":
      if (!state.diagramData) return state;

      const updatedEntities = state.diagramData.entities.map((entity) =>
        entity.id === action.payload.id
          ? { ...entity, ...action.payload.entity }
          : entity
      );

      // 如果更新了实体的 isWeakEntity 属性，需要重新检查所有相关关系的弱关系状态
      const updatedRelationshipsForEntity = state.diagramData.relationships.map(
        (relationship) => {
          const hasUpdatedEntity = relationship.connections.some(
            (conn) => conn.entityId === action.payload.id
          );

          if (hasUpdatedEntity) {
            // 重新检查是否为弱关系
            const isWeakRelation = relationship.connections.some((conn) => {
              const entity = updatedEntities.find(
                (e) => e.id === conn.entityId
              );
              return entity?.isWeakEntity === true;
            });

            return {
              ...relationship,
              isWeakRelation,
            };
          }

          return relationship;
        }
      );

      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: updatedEntities,
          relationships: updatedRelationshipsForEntity,
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "UPDATE_RELATIONSHIP":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: state.diagramData.relationships.map((relationship) =>
            relationship.id === action.payload.id
              ? { ...relationship, ...action.payload.relationship }
              : relationship
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "DELETE_ENTITY":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: state.diagramData.entities.filter(
            (entity) => entity.id !== action.payload.id
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "DELETE_RELATIONSHIP":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: state.diagramData.relationships.filter(
            (relationship) => relationship.id !== action.payload.id
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    // 新增节点编辑相关reducer case
    case "SELECT_NODE":
      return {
        ...state,
        selectedNodeId: action.payload.nodeId,
        // 选择新节点时清除编辑状态
        editingNodeId: null,
        nodeEditMode: "none",
      };
    case "START_EDIT_NODE":
      return {
        ...state,
        editingNodeId: action.payload.nodeId,
        nodeEditMode: action.payload.mode,
        selectedNodeId: action.payload.nodeId,
      };
    case "FINISH_EDIT_NODE":
      return {
        ...state,
        editingNodeId: null,
        nodeEditMode: "none",
      };
    case "RENAME_NODE":
      if (!state.diagramData) return state;

      // 查找并更新实体或关系的名称
      const renamedEntities = state.diagramData.entities.map((entity) =>
        entity.id === action.payload.nodeId
          ? { ...entity, name: action.payload.newName }
          : entity
      );

      const renamedRelationships = state.diagramData.relationships.map(
        (relationship) =>
          relationship.id === action.payload.nodeId
            ? { ...relationship, name: action.payload.newName }
            : relationship
      );

      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: renamedEntities,
          relationships: renamedRelationships,
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        // 重命名完成后清除编辑状态
        editingNodeId: null,
        nodeEditMode: "none",
      };

    // 关系属性编辑相关
    case "ADD_RELATIONSHIP_ATTRIBUTE":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: state.diagramData.relationships.map((relationship) =>
            relationship.id === action.payload.relationshipId
              ? {
                  ...relationship,
                  attributes: [
                    ...(relationship.attributes || []),
                    action.payload.attribute,
                  ],
                }
              : relationship
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };

    case "DELETE_RELATIONSHIP_ATTRIBUTE":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: state.diagramData.relationships.map((relationship) =>
            relationship.id === action.payload.relationshipId
              ? {
                  ...relationship,
                  attributes: (relationship.attributes || []).filter(
                    (attr) => attr.id !== action.payload.attributeId
                  ),
                }
              : relationship
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };

    case "UPDATE_RELATIONSHIP_ATTRIBUTE":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: state.diagramData.relationships.map((relationship) =>
            relationship.id === action.payload.relationshipId
              ? {
                  ...relationship,
                  attributes: (relationship.attributes || []).map((attr) =>
                    attr.id === action.payload.attributeId
                      ? { ...attr, ...action.payload.updates }
                      : attr
                  ),
                }
              : relationship
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };

    case "ADD_ATTRIBUTE":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: state.diagramData.entities.map((entity) =>
            entity.id === action.payload.entityId
              ? {
                  ...entity,
                  attributes: [...entity.attributes, action.payload.attribute],
                }
              : entity
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "DELETE_ATTRIBUTE":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: state.diagramData.entities.map((entity) =>
            entity.id === action.payload.entityId
              ? {
                  ...entity,
                  attributes: entity.attributes.filter(
                    (attr) => attr.id !== action.payload.attributeId
                  ),
                }
              : entity
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "UPDATE_ATTRIBUTE":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: state.diagramData.entities.map((entity) =>
            entity.id === action.payload.entityId
              ? {
                  ...entity,
                  attributes: entity.attributes.map((attr) =>
                    attr.id === action.payload.attributeId
                      ? { ...attr, ...action.payload.updates }
                      : attr
                  ),
                }
              : entity
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "UPDATE_CONNECTION":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: state.diagramData.relationships.map((relationship) =>
            relationship.id === action.payload.relationshipId
              ? {
                  ...relationship,
                  connections: relationship.connections.map((conn) =>
                    conn.entityId === action.payload.entityId
                      ? { ...conn, ...action.payload.updates }
                      : conn
                  ),
                }
              : relationship
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "CREATE_CONNECTION":
      if (!state.diagramData) return state;

      // 添加连接并检查弱关系
      const updatedRelationshipsAfterCreate =
        state.diagramData.relationships.map((relationship) => {
          if (relationship.id === action.payload.relationshipId) {
            const newConnections = [
              ...relationship.connections,
              action.payload.connection,
            ];

            // 检查是否为弱关系（连接了弱实体）
            const isWeakRelation = newConnections.some((conn) => {
              const entity = state.diagramData!.entities.find(
                (e) => e.id === conn.entityId
              );
              return entity?.isWeakEntity === true;
            });

            return {
              ...relationship,
              connections: newConnections,
              isWeakRelation,
            };
          }
          return relationship;
        });

      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: updatedRelationshipsAfterCreate,
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "DELETE_CONNECTION":
      if (!state.diagramData) return state;

      // 删除连接并重新检查弱关系
      const updatedRelationshipsAfterDelete =
        state.diagramData.relationships.map((relationship) => {
          if (relationship.id === action.payload.relationshipId) {
            const newConnections = relationship.connections.filter(
              (conn) => conn.entityId !== action.payload.entityId
            );

            // 重新检查是否为弱关系
            const isWeakRelation = newConnections.some((conn) => {
              const entity = state.diagramData!.entities.find(
                (e) => e.id === conn.entityId
              );
              return entity?.isWeakEntity === true;
            });

            return {
              ...relationship,
              connections: newConnections,
              isWeakRelation,
            };
          }
          return relationship;
        });

      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: updatedRelationshipsAfterDelete,
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "SET_CURRENT_DIAGRAM_ID":
      return {
        ...state,
        currentDiagramId: action.payload.id,
      };
    case "SET_DIAGRAM_LIST":
      return { ...state, diagramList: action.payload };
    case "UPDATE_ATTRIBUTE_ORDER":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          // 遍历实体,找到需要重新排序的实体
          entities: state.diagramData.entities.map((entity) => {
            if (entity.id === action.payload.entityId) {
              // 构建一个属性ID到属性的Map
              const attributeMap = new Map(
                entity.attributes.map((attr) => [attr.id, attr])
              );
              const reorderedAttributes = action.payload.attributeIds
                .map((id) => attributeMap.get(id))
                .filter(
                  (
                    attr
                  ): attr is import("@/types/ERDiagramTypes/erDiagram").ERAttribute =>
                    attr !== undefined
                );

              return {
                ...entity,
                attributes: reorderedAttributes,
              };
            }
            return entity;
          }),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case "SET_PINNED_QUIZ":
      return {
        ...state,
        pinnedQuizId: action.payload.quizId,
      };
    case "UPDATE_NODE_POSITION":
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: state.diagramData.entities.map((entity) =>
            entity.id === action.payload.nodeId
              ? { ...entity, position: action.payload.position }
              : entity
          ),
          relationships: state.diagramData.relationships.map((relationship) =>
            relationship.id === action.payload.nodeId
              ? { ...relationship, position: action.payload.position }
              : relationship
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    default:
      return state;
  }
}

interface ERDiagramContextType {
  state: ERDiagramState;
  dispatch: React.Dispatch<ERDiagramAction>;
  // 便捷方法
  setActiveTab: (tab: ActiveTab) => void;
  setDiagramData: (data: ERDiagramData) => void;
  setSelectedElement: (id: string | null) => void;
  loadSampleData: () => void;
  // 实体和关系操作方法
  addEntity: (entity: EREntity) => Promise<void>;
  addRelationship: (relationship: ERRelationship) => Promise<void>;
  updateEntity: (id: string, entity: Partial<EREntity>) => Promise<void>;
  updateRelationship: (
    id: string,
    relationship: Partial<ERRelationship>
  ) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
  deleteRelationship: (id: string) => Promise<void>;
  // 新增节点编辑相关便捷方法
  selectNode: (nodeId: string | null) => void;
  startEditNode: (nodeId: string, mode: NodeEditMode) => void;
  finishEditNode: () => void;
  renameNode: (nodeId: string, newName: string) => Promise<void>;
  // 属性编辑相关方法
  addAttribute: (
    entityId: string,
    attribute: import("@/types/ERDiagramTypes/erDiagram").ERAttribute
  ) => Promise<void>;
  deleteAttribute: (entityId: string, attributeId: string) => Promise<void>;
  updateAttribute: (
    entityId: string,
    attributeId: string,
    updates: Partial<import("@/types/ERDiagramTypes/erDiagram").ERAttribute>
  ) => Promise<void>;
  updateAttributeOrder: (
    entityId: string,
    attributeIds: string[]
  ) => Promise<void>;
  updateConnection: (
    relationshipId: string,
    entityId: string,
    updates: Partial<import("@/types/ERDiagramTypes/erDiagram").ERConnection>
  ) => Promise<void>;

  // 关系属性的编辑方法
  addRelationshipAttribute: (
    relationshipId: string,
    attribute: import("@/types/ERDiagramTypes/erDiagram").ERAttribute
  ) => Promise<void>;
  deleteRelationshipAttribute: (
    relationshipId: string,
    attributeId: string
  ) => Promise<void>;
  updateRelationshipAttribute: (
    relationshipId: string,
    attributeId: string,
    updates: Partial<import("@/types/ERDiagramTypes/erDiagram").ERAttribute>
  ) => Promise<void>;

  // 连接管理相关方法
  createConnection: (
    relationshipId: string,
    connection: import("@/types/ERDiagramTypes/erDiagram").ERConnection
  ) => Promise<void>;
  deleteConnection: (relationshipId: string, entityId: string) => Promise<void>;
  // 存储相关方法
  saveDiagram: (
    diagramData: ERDiagramData,
    existingId?: string
  ) => Promise<string>;
  loadDiagram: (id: string) => Promise<void>;
  newDiagram: () => void;
  createNewDiagram: (
    name: string,
    description: string,
    templateId: string
  ) => Promise<string>;
  listDiagrams: () => Promise<ERDiagramMetadata[]>;
  deleteDiagram: (id: string) => Promise<void>;
  // 历史记录的状态更新相关
  diagramList: ERDiagramMetadata[];
  fetchDiagramList: () => Promise<void>;
  // 显示通知的函数
  showSnackbar: (
    message: string,
    severity: "info" | "success" | "warning" | "error"
  ) => void;
  // 固定题目相关方法
  setPinnedQuiz: (quizId: string | null) => void;
  // 节点位置更新
  updateNodePosition: (
    nodeId: string,
    position: { x: number; y: number }
  ) => void;
}

const ERDiagramContext = createContext<ERDiagramContextType | undefined>(
  undefined
);

export const useERDiagramContext = () => {
  const context = useContext(ERDiagramContext);
  if (context === undefined) {
    throw new Error(
      "useERDiagramContext must be used within an ERDiagramProvider"
    );
  }
  return context;
};

interface ERDiagramProviderProps {
  children: ReactNode;
}

export const ERDiagramProvider: React.FC<ERDiagramProviderProps> = ({
  children,
}) => {
  const { showSnackbar } = useSnackbar();
  const [state, dispatch] = useReducer(erDiagramReducer, initialState);

  const setActiveTab = (tab: ActiveTab) => {
    dispatch({ type: "SET_ACTIVE_TAB", payload: tab });
  };

  const setDiagramData = (data: ERDiagramData) => {
    dispatch({ type: "SET_DIAGRAM_DATA", payload: data });
  };

  const setSelectedElement = (id: string | null) => {
    dispatch({ type: "SET_SELECTED_ELEMENT", payload: id });
  };

  const loadSampleData = () => {
    dispatch({ type: "LOAD_SAMPLE_DATA" });
  };

  const addEntity = async (entity: EREntity) => {
    dispatch({ type: "ADD_ENTITY", payload: { entity } });

    // 自动保存到 IndexedDB
    if (state.diagramData && state.currentDiagramId) {
      try {
        const updatedData = {
          ...state.diagramData,
          entities: [...state.diagramData.entities, entity],
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        };
        await saveDiagram(updatedData, state.currentDiagramId);
        console.log("实体添加后自动保存成功");
      } catch (error) {
        console.error("实体添加后自动保存失败:", error);
      }
    }
  };

  const addRelationship = async (relationship: ERRelationship) => {
    dispatch({ type: "ADD_RELATIONSHIP", payload: { relationship } });

    // 自动保存到 IndexedDB
    if (state.diagramData && state.currentDiagramId) {
      try {
        const updatedData = {
          ...state.diagramData,
          relationships: [...state.diagramData.relationships, relationship],
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        };
        await saveDiagram(updatedData, state.currentDiagramId);
        console.log("关系添加后自动保存成功");
      } catch (error) {
        console.error("关系添加后自动保存失败:", error);
      }
    }
  };

  const updateEntity = async (id: string, entity: Partial<EREntity>) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法更新实体：未找到当前图表", "error");
      return;
    }

    try {
      // 计算更新后的数据
      const updatedEntities = state.diagramData.entities.map((e) =>
        e.id === id ? { ...e, ...entity } : e
      );

      const updatedData = {
        ...state.diagramData,
        entities: updatedEntities,
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      // 保存到持久化存储
      await saveDiagram(updatedData, state.currentDiagramId);
      dispatch({ type: "UPDATE_ENTITY", payload: { id, entity } });

      showSnackbar("实体更新成功", "success");
    } catch (error) {
      console.error("更新实体失败:", error);
      showSnackbar("更新实体失败，请重试", "error");
    }
  };

  const updateRelationship = async (
    id: string,
    relationship: Partial<ERRelationship>
  ) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法更新关系：未找到当前图表", "error");
      return;
    }

    try {
      // 计算更新后的数据
      const updatedRelationships = state.diagramData.relationships.map((r) =>
        r.id === id ? { ...r, ...relationship } : r
      );

      const updatedData = {
        ...state.diagramData,
        relationships: updatedRelationships,
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      // 保存到持久化存储
      await saveDiagram(updatedData, state.currentDiagramId);
      dispatch({ type: "UPDATE_RELATIONSHIP", payload: { id, relationship } });

      showSnackbar("关系更新成功", "success");
    } catch (error) {
      console.error("更新关系失败:", error);
      showSnackbar("更新关系失败，请重试", "error");
      // 可以考虑回滚UI状态，但这里保持简单
    }
  };

  const deleteEntity = async (id: string) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法删除实体：未找到当前图表", "error");
      return;
    }

    try {
      // 计算删除后的新数据
      const updatedData = {
        ...state.diagramData,
        entities: state.diagramData.entities.filter(
          (entity) => entity.id !== id
        ),
        // 此处保留了与实体相关的关系
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      // 保存到持久化存储
      await saveDiagram(updatedData, state.currentDiagramId);
      dispatch({ type: "DELETE_ENTITY", payload: { id } });

      showSnackbar("实体删除成功", "success");
    } catch (error) {
      console.error("删除实体失败:", error);
      showSnackbar("删除实体失败，请重试", "error");
    }
  };

  const deleteRelationship = async (id: string) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法删除关系：未找到当前图表", "error");
      return;
    }

    try {
      // 计算删除后的新数据
      const updatedData = {
        ...state.diagramData,
        relationships: state.diagramData.relationships.filter(
          (relationship) => relationship.id !== id
        ),
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      // 保存到持久化存储
      await saveDiagram(updatedData, state.currentDiagramId);
      dispatch({ type: "DELETE_RELATIONSHIP", payload: { id } });

      showSnackbar("关系删除成功", "success");
    } catch (error) {
      console.error("删除关系失败:", error);
      showSnackbar("删除关系失败，请重试", "error");
    }
  };

  // 新增节点编辑相关便捷方法实现
  const selectNode = (nodeId: string | null) => {
    dispatch({ type: "SELECT_NODE", payload: { nodeId } });
  };

  const startEditNode = (nodeId: string, mode: NodeEditMode) => {
    dispatch({ type: "START_EDIT_NODE", payload: { nodeId, mode } });
  };

  const finishEditNode = () => {
    dispatch({ type: "FINISH_EDIT_NODE" });
  };

  const renameNode = async (nodeId: string, newName: string) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法重命名节点：未找到当前图表", "error");
      return;
    }

    try {
      // 计算更新后的数据
      const updatedEntities = state.diagramData.entities.map((entity) =>
        entity.id === nodeId ? { ...entity, name: newName } : entity
      );

      const updatedRelationships = state.diagramData.relationships.map(
        (relationship) =>
          relationship.id === nodeId
            ? { ...relationship, name: newName }
            : relationship
      );

      const updatedData = {
        ...state.diagramData,
        entities: updatedEntities,
        relationships: updatedRelationships,
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      // 保存到持久化存储
      await saveDiagram(updatedData, state.currentDiagramId);
      dispatch({ type: "RENAME_NODE", payload: { nodeId, newName } });

      showSnackbar("节点重命名成功", "success");
    } catch (error) {
      console.error("重命名节点失败:", error);
      showSnackbar("重命名节点失败，请重试", "error");
    }
  };

  // 属性编辑相关方法实现
  const addAttribute = async (
    entityId: string,
    attribute: import("@/types/ERDiagramTypes/erDiagram").ERAttribute
  ) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法添加属性：未找到当前图表", "error");
      return;
    }

    try {
      // 先dispatch更新UI状态
      dispatch({ type: "ADD_ATTRIBUTE", payload: { entityId, attribute } });

      // 计算更新后的数据
      const updatedEntities = state.diagramData.entities.map((entity) =>
        entity.id === entityId
          ? { ...entity, attributes: [...entity.attributes, attribute] }
          : entity
      );

      const updatedData = {
        ...state.diagramData,
        entities: updatedEntities,
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      // 保存到持久化存储
      await saveDiagram(updatedData, state.currentDiagramId);
      showSnackbar("属性添加成功", "success");
    } catch (error) {
      console.error("添加属性失败:", error);
      showSnackbar("添加属性失败，请重试", "error");
    }
  };

  const deleteAttribute = async (entityId: string, attributeId: string) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法删除属性：未找到当前图表", "error");
      return;
    }

    const entityToUpdate = state.diagramData.entities.find(
      (e) => e.id === entityId
    );
    if (!entityToUpdate) {
      showSnackbar("未找到指定实体", "error");
      return;
    }

    // 检查主键逻辑：防止删除最后一个主键属性
    const attributeToDelete = entityToUpdate.attributes.find(
      (attr) => attr.id === attributeId
    );
    if (attributeToDelete?.isPrimaryKey) {
      const primaryKeyCount = entityToUpdate.attributes.filter(
        (attr) => attr.isPrimaryKey
      ).length;
      if (primaryKeyCount <= 1) {
        showSnackbar("无法删除：实体至少需要一个主键/标识符属性", "warning");
        return;
      }
    }

    try {
      // 先dispatch更新UI状态
      dispatch({
        type: "DELETE_ATTRIBUTE",
        payload: { entityId, attributeId },
      });

      // 计算更新后的数据
      const updatedEntities = state.diagramData.entities.map((entity) =>
        entity.id === entityId
          ? {
              ...entity,
              attributes: entity.attributes.filter(
                (attr) => attr.id !== attributeId
              ),
            }
          : entity
      );

      const updatedData = {
        ...state.diagramData,
        entities: updatedEntities,
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      // 保存到持久化存储
      await saveDiagram(updatedData, state.currentDiagramId);
      showSnackbar("属性删除成功", "success");
    } catch (error) {
      console.error("删除属性失败:", error);
      showSnackbar("删除属性失败，请重试", "error");
    }
  };

  const updateAttribute = async (
    entityId: string,
    attributeId: string,
    updates: Partial<import("@/types/ERDiagramTypes/erDiagram").ERAttribute>
  ) => {
    if (!state.diagramData || !state.currentDiagramId) return;

    const entityToUpdate = state.diagramData.entities.find(
      (e) => e.id === entityId
    );
    if (!entityToUpdate) return;

    // 检查主键逻辑（至少存在一个属性）
    if (updates.isPrimaryKey === false) {
      const primaryKeyCount = entityToUpdate.attributes.filter(
        (attr) => attr.isPrimaryKey
      ).length;

      if (primaryKeyCount <= 1) {
        showSnackbar("实体至少需要一个主键/标识符属性", "warning");
        return;
      }
    }

    if (updates.name === "") {
      showSnackbar("属性名称不能为空", "warning");
      return;
    }

    // 计算下一个状态
    const updatedEntities = state.diagramData.entities.map((entity) => {
      if (entity.id === entityId) {
        return {
          ...entity,
          attributes: entity.attributes.map((attr) =>
            attr.id === attributeId ? { ...attr, ...updates } : attr
          ),
        };
      }
      return entity;
    });

    const newDiagramData = {
      ...state.diagramData,
      entities: updatedEntities,
      metadata: {
        ...state.diagramData.metadata,
        updatedAt: new Date().toISOString(),
      },
    };

    // 持久化并更新UI
    try {
      await saveDiagram(newDiagramData, state.currentDiagramId);
      dispatch({ type: "SET_DIAGRAM_DATA", payload: newDiagramData });

      // 自动调整属性排序
      if (updates.isPrimaryKey !== undefined) {
        const otherAttributeIds = entityToUpdate.attributes
          .map((attr) => attr.id)
          .filter((id) => id !== attributeId);

        // 分离主键和非主键
        const primaryKeyIds = entityToUpdate.attributes
          .filter((attr) => attr.isPrimaryKey && attr.id !== attributeId)
          .map((attr) => attr.id);

        const nonPrimaryKeyIds = otherAttributeIds.filter(
          (id) => !primaryKeyIds.includes(id)
        );

        // 分类讨论排序的位置
        let newOrder: string[];
        newOrder = [...primaryKeyIds, attributeId, ...nonPrimaryKeyIds];

        updateAttributeOrder(entityId, newOrder);
      }
    } catch (error) {
      console.error("更新属性失败:", error);
    }
  };

  // 更新属性排序的方法
  const updateAttributeOrder = async (
    entityId: string,
    attributeIds: string[]
  ) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法更新属性排序：未找到当前图表", "error");
      return;
    }

    try {
      // 先更新本地状态（乐观更新）
      dispatch({
        type: "UPDATE_ATTRIBUTE_ORDER",
        payload: { entityId, attributeIds },
      });

      // 计算更新后的数据
      const updatedEntities = state.diagramData.entities.map((entity) => {
        if (entity.id === entityId) {
          const attributeMap = new Map(
            entity.attributes.map((attr) => [attr.id, attr])
          );
          const reorderedAttributes = attributeIds
            .map((id) => attributeMap.get(id))
            .filter(
              (
                attr
              ): attr is import("@/types/ERDiagramTypes/erDiagram").ERAttribute =>
                attr !== undefined
            );

          return {
            ...entity,
            attributes: reorderedAttributes,
          };
        }
        return entity;
      });

      const updatedData = {
        ...state.diagramData,
        entities: updatedEntities,
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      // 异步保存到持久化存储
      await saveDiagram(updatedData, state.currentDiagramId);
    } catch (error) {
      console.error("更新属性排序失败:", error);
      showSnackbar("更新属性排序失败，请重试", "error");

      // 错误时回滚状态
      if (state.diagramData) {
        dispatch({ type: "SET_DIAGRAM_DATA", payload: state.diagramData });
      }
    }
  };

  const updateConnection = async (
    relationshipId: string,
    entityId: string,
    updates: Partial<import("@/types/ERDiagramTypes/erDiagram").ERConnection>
  ) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法更新连接：未找到当前图表", "error");
      return;
    }

    try {
      // 计算更新后的数据
      const updatedRelationships = state.diagramData.relationships.map(
        (relationship) => {
          if (relationship.id === relationshipId) {
            const updatedConnections = relationship.connections.map(
              (connection) =>
                connection.entityId === entityId
                  ? { ...connection, ...updates }
                  : connection
            );
            return { ...relationship, connections: updatedConnections };
          }
          return relationship;
        }
      );

      const updatedData = {
        ...state.diagramData,
        relationships: updatedRelationships,
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      // 保存到持久化存储
      await saveDiagram(updatedData, state.currentDiagramId);
      dispatch({
        type: "UPDATE_CONNECTION",
        payload: { relationshipId, entityId, updates },
      });

      showSnackbar("连接更新成功", "success");
    } catch (error) {
      console.error("更新连接失败:", error);
      showSnackbar("更新连接失败，请重试", "error");
    }
  };

  // 关系属性编辑相关实现
  const addRelationshipAttribute = async (
    relationshipId: string,
    attribute: import("@/types/ERDiagramTypes/erDiagram").ERAttribute
  ) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法添加关系属性，未找到当前图表", "error");
      return;
    }

    try {
      //更新视图
      dispatch({
        type: "ADD_RELATIONSHIP_ATTRIBUTE",
        payload: { relationshipId, attribute },
      });

      // 持久化存储
      const updatedRelationships = state.diagramData.relationships.map(
        (relationship) => {
          return relationship.id === relationshipId
            ? {
                ...relationship,
                attributes: [...(relationship.attributes || []), attribute],
              }
            : relationship;
        }
      );

      const updatedData = {
        ...state.diagramData,
        relationships: updatedRelationships,
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      await saveDiagram(updatedData, state.currentDiagramId);
      showSnackbar("关系属性添加成功", "success");
    } catch (error) {
      console.error("添加关系属性失败:", error);
      showSnackbar("添加关系属性失败，请重试", "error");
    }
  };

  const deleteRelationshipAttribute = async (
    relationshipId: string,
    attributeId: string
  ) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法删除关系属性，未找到当前图表", "error");
      return;
    }

    try {
      // 更新视图
      dispatch({
        type: "DELETE_RELATIONSHIP_ATTRIBUTE",
        payload: { relationshipId, attributeId },
      });

      // 持久化存储
      const updatedRelationships = state.diagramData.relationships.map(
        (relationship) => {
          if (relationship.id === relationshipId) {
            return {
              ...relationship,
              attributes: (relationship.attributes || []).filter(
                (attr) => attr.id !== attributeId
              ),
            };
          }
          return relationship;
        }
      );

      const updatedData = {
        ...state.diagramData,
        relationships: updatedRelationships,
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      await saveDiagram(updatedData, state.currentDiagramId);
      showSnackbar("关系属性删除成功", "success");
    } catch (error) {
      console.error("删除关系属性失败:", error);
      showSnackbar("删除关系属性失败，请重试", "error");
    }
  };

  const updateRelationshipAttribute = async (
    relationshipId: string,
    attributeId: string,
    updates: Partial<import("@/types/ERDiagramTypes/erDiagram").ERAttribute>
  ) => {
    if (!state.diagramData || !state.currentDiagramId) {
      showSnackbar("无法更新关系属性，未找到当前图表", "error");
      return;
    }

    try {
      if (updates.name === "") {
        showSnackbar("关系属性的名称不能为空", "warning");
        return;
      }

      dispatch({
        type: "UPDATE_RELATIONSHIP_ATTRIBUTE",
        payload: { relationshipId, attributeId, updates },
      });

      // 计算下一个状态
      const updatedRelationships = state.diagramData.relationships.map(
        (relationship) => {
          if (relationship.id === relationshipId) {
            return {
              ...relationship,
              attributes: (relationship.attributes || []).map((attr) =>
                attr.id === attributeId ? { ...attr, ...updates } : attr
              ),
            };
          }
          return relationship;
        }
      );

      const updatedData = {
        ...state.diagramData,
        relationships: updatedRelationships,
        metadata: {
          ...state.diagramData.metadata,
          updatedAt: new Date().toISOString(),
        },
      };

      await saveDiagram(updatedData, state.currentDiagramId);
      showSnackbar("关系属性更新成功", "success");
    } catch (error) {
      console.error("更新关系属性失败:", error);
      showSnackbar("更新关系属性失败，请重试", "error");
    }
  };

  // 连接管理相关方法实现
  const createConnection = async (
    relationshipId: string,
    connection: import("@/types/ERDiagramTypes/erDiagram").ERConnection
  ) => {
    dispatch({
      type: "CREATE_CONNECTION",
      payload: { relationshipId, connection },
    });

    // 自动保存到 IndexedDB
    if (state.diagramData && state.currentDiagramId) {
      try {
        // 找到要更新的关系
        const relationship = state.diagramData.relationships.find(
          (r) => r.id === relationshipId
        );
        if (!relationship) return;

        // 创建更新后的关系数据
        const updatedRelationship = {
          ...relationship,
          connections: [...relationship.connections, connection],
        };

        // 创建更新后的图表数据
        const updatedData = {
          ...state.diagramData,
          relationships: state.diagramData.relationships.map((r) =>
            r.id === relationshipId ? updatedRelationship : r
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        };

        await saveDiagram(updatedData, state.currentDiagramId);
        console.log("连接创建后自动保存成功");
      } catch (error) {
        console.error("连接创建后自动保存失败:", error);
      }
    }
  };

  const deleteConnection = async (relationshipId: string, entityId: string) => {
    dispatch({
      type: "DELETE_CONNECTION",
      payload: { relationshipId, entityId },
    });

    // 自动保存到 IndexedDB
    if (state.diagramData && state.currentDiagramId) {
      try {
        // 找到要更新的关系
        const relationship = state.diagramData.relationships.find(
          (r) => r.id === relationshipId
        );
        if (!relationship) return;

        // 创建更新后的关系数据
        const updatedRelationship = {
          ...relationship,
          connections: relationship.connections.filter(
            (conn) => conn.entityId !== entityId
          ),
        };

        // 创建更新后的图表数据
        const updatedData = {
          ...state.diagramData,
          relationships: state.diagramData.relationships.map((r) =>
            r.id === relationshipId ? updatedRelationship : r
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        };

        await saveDiagram(updatedData, state.currentDiagramId);
        console.log("连接删除后自动保存成功");
      } catch (error) {
        console.error("连接删除后自动保存失败:", error);
      }
    }
  };

  // 存储相关方法实现 - 使用useCallback避免无限重渲染
  const saveDiagram = useCallback(
    async (
      diagramData: ERDiagramData,
      existingId?: string
    ): Promise<string> => {
      try {
        const savedId = await erDiagramStorage.saveDiagram(
          diagramData,
          existingId
        );
        // 保存成功后自动刷新图表列表
        const list = await erDiagramStorage.listDiagrams();
        dispatch({ type: "SET_DIAGRAM_LIST", payload: list });
        // 更新当前图表ID
        dispatch({ type: "SET_CURRENT_DIAGRAM_ID", payload: { id: savedId } });
        return savedId;
      } catch (error) {
        console.error("保存图表失败:", error);
        throw error;
      }
    },
    []
  );

  // 重构后的 loadDiagram 方法 - 使用useCallback避免无限重渲染
  const loadDiagram = useCallback(async (id: string): Promise<void> => {
    try {
      const storedDiagram = await erDiagramStorage.loadDiagram(id);
      // 通过 SET_DIAGRAM_DATA 更新图表数据
      dispatch({ type: "SET_DIAGRAM_DATA", payload: storedDiagram.data });
      // 单独更新当前图表ID
      dispatch({ type: "SET_CURRENT_DIAGRAM_ID", payload: { id } });
    } catch (error) {
      console.error("加载图表失败:", error);
      throw error;
    }
  }, []);

  const newDiagram = () => {
    dispatch({ type: "NEW_DIAGRAM" });
  };

  const listDiagrams = async (): Promise<ERDiagramMetadata[]> => {
    return await erDiagramStorage.listDiagrams();
  };

  // 重构后的 deleteDiagram 方法 - 使用useCallback避免无限重渲染
  const deleteDiagram = useCallback(
    async (id: string): Promise<void> => {
      try {
        await erDiagramStorage.deleteDiagram(id);
        // 如果删除的是当前图表，清空状态
        if (state.currentDiagramId === id) {
          dispatch({ type: "NEW_DIAGRAM" });
        }
        // 删除成功后自动刷新图表列表
        const list = await erDiagramStorage.listDiagrams();
        dispatch({ type: "SET_DIAGRAM_LIST", payload: list });
      } catch (error) {
        console.error("删除图表失败:", error);
        throw error;
      }
    },
    [state.currentDiagramId]
  );

  const fetchDiagramList = useCallback(async () => {
    try {
      const list = await erDiagramStorage.listDiagrams();
      dispatch({ type: "SET_DIAGRAM_LIST", payload: list });
    } catch (error) {
      console.error("Failed to fetch diagram list:", error);
      // 在错误情况下设置空列表，避免UI崩溃
      dispatch({ type: "SET_DIAGRAM_LIST", payload: [] });
    }
  }, []);

  // 新增 createNewDiagram 方法 - 使用useCallback避免无限重渲染
  const createNewDiagram = useCallback(
    async (
      name: string,
      description: string,
      templateId: string
    ): Promise<string> => {
      try {
        // 根据模板ID构建图表数据
        let newDiagramData: ERDiagramData;

        if (templateId === "blank") {
          // 创建空白图表
          newDiagramData = {
            entities: [],
            relationships: [],
            metadata: {
              title: name.trim(),
              description: description.trim() || "空白ER图",
              version: "1.0.0",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
        } else if (templateId === "sample") {
          // 使用示例图书馆系统模板
          newDiagramData = {
            ...sampleERData,
            metadata: {
              ...sampleERData.metadata,
              title: name.trim(),
              description: description.trim() || "示例图书馆系统",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
        } else if (templateId === "employee") {
          // 使用员工部门项目模板
          newDiagramData = {
            ...employeeDepartmentERData,
            metadata: {
              ...employeeDepartmentERData.metadata,
              title: name.trim(),
              description: description.trim() || "员工部门项目",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
        } else if (templateId === "weak_entity") {
          // 使用弱实体集示例模板
          newDiagramData = {
            ...weakEntityERData,
            metadata: {
              ...weakEntityERData.metadata,
              title: name.trim(),
              description: description.trim() || "弱实体集示例",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          };
        } else {
          throw new Error("无效的模板ID");
        }

        // 保存到数据库
        const savedId = await saveDiagram(newDiagramData);

        // 设置为当前图表
        dispatch({ type: "SET_DIAGRAM_DATA", payload: newDiagramData });

        return savedId;
      } catch (error) {
        console.error("创建新图表失败:", error);
        throw error;
      }
    },
    [saveDiagram]
  );

  // 4. useEffect 首次加载时调用 fetchDiagramList
  useEffect(() => {
    fetchDiagramList();
  }, [fetchDiagramList]);

  // 节点位置更新方法
  const updateNodePosition = useCallback(
    (nodeId: string, position: { x: number; y: number }) => {
      if (!state.diagramData || !state.currentDiagramId) return;

      dispatch({
        type: "UPDATE_NODE_POSITION",
        payload: { nodeId, position },
      });

      // 异步保存，避免阻塞UI
      setTimeout(() => {
        const updatedData = erDiagramReducer(state, {
          type: "UPDATE_NODE_POSITION",
          payload: { nodeId, position },
        }).diagramData;

        if (updatedData && state.currentDiagramId) {
          saveDiagram(updatedData, state.currentDiagramId).catch((error) => {
            console.error("自动保存节点位置失败:", error);
          });
        }
      }, 500); // 延迟保存
    },
    [state, saveDiagram]
  );

  // 固定题目相关方法
  const setPinnedQuiz = useCallback((quizId: string | null) => {
    dispatch({ type: "SET_PINNED_QUIZ", payload: { quizId } });
  }, []);

  const value: ERDiagramContextType = {
    state,
    dispatch,
    setActiveTab,
    setDiagramData,
    setSelectedElement,
    loadSampleData,
    addEntity,
    addRelationship,
    updateEntity,
    updateRelationship,
    deleteEntity,
    deleteRelationship,
    // 节点编辑相关方法
    selectNode,
    startEditNode,
    finishEditNode,
    renameNode,
    // 属性编辑相关方法
    addAttribute,
    deleteAttribute,
    updateAttribute,
    updateAttributeOrder,
    updateConnection,
    // 关系属性编辑方法
    addRelationshipAttribute,
    deleteRelationshipAttribute,
    updateRelationshipAttribute,
    // 连接管理相关方法
    createConnection,
    deleteConnection,
    // 存储相关方法
    saveDiagram,
    loadDiagram,
    newDiagram,
    createNewDiagram,
    listDiagrams,
    deleteDiagram,
    //  diagramList 和 fetchDiagramList
    diagramList: state.diagramList,
    fetchDiagramList,
    // 显示通知的函数
    showSnackbar,
    // 固定题目相关方法
    setPinnedQuiz,
    // 节点位置更新
    updateNodePosition,
  };

  return (
    <ERDiagramContext.Provider value={value}>
      {children}
    </ERDiagramContext.Provider>
  );
};
