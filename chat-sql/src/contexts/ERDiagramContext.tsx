'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ERDiagramData, sampleERData, employeeDepartmentERData, weakEntityERData, EREntity, ERRelationship } from '@/types/erDiagram';
import { erDiagramStorage, ERDiagramMetadata } from '@/services/erDiagramStorage';
import { useEffect, useCallback } from 'react';

type ActiveTab = 'components' | 'entities' | 'relationships';
type NodeEditMode = 'none' | 'rename' | 'properties';

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
}

// 重构后的 Action 类型，移除异步相关的 Action 类型
type ERDiagramAction =
  | { type: 'SET_DIAGRAM_DATA'; payload: ERDiagramData }
  | { type: 'SET_ACTIVE_TAB'; payload: ActiveTab }
  | { type: 'SET_SELECTED_ELEMENT'; payload: string | null }
  | { type: 'LOAD_SAMPLE_DATA' }
  | { type: 'ADD_ENTITY'; payload: { entity: EREntity } }
  | { type: 'ADD_RELATIONSHIP'; payload: { relationship: ERRelationship } }
  | { type: 'UPDATE_ENTITY'; payload: { id: string; entity: Partial<EREntity> } }
  | { type: 'UPDATE_RELATIONSHIP'; payload: { id: string; relationship: Partial<ERRelationship> } }
  | { type: 'DELETE_ENTITY'; payload: { id: string } }
  | { type: 'DELETE_RELATIONSHIP'; payload: { id: string } }
  // 节点编辑相关Action
  | { type: 'SELECT_NODE'; payload: { nodeId: string | null } }
  | { type: 'START_EDIT_NODE'; payload: { nodeId: string; mode: NodeEditMode } }
  | { type: 'FINISH_EDIT_NODE' }
  | { type: 'RENAME_NODE'; payload: { nodeId: string; newName: string } }
  // 属性编辑相关Action
  | { type: 'UPDATE_ATTRIBUTE'; payload: { entityId: string; attributeId: string; updates: Partial<import('@/types/erDiagram').ERAttribute> } }
  | { type: 'UPDATE_CONNECTION'; payload: { relationshipId: string; entityId: string; updates: Partial<import('@/types/erDiagram').ERConnection> } }
  // 连接管理相关Action
  | { type: 'CREATE_CONNECTION'; payload: { relationshipId: string; connection: import('@/types/erDiagram').ERConnection } }
  | { type: 'DELETE_CONNECTION'; payload: { relationshipId: string; entityId: string } }
  // 纯状态更新的 Action
  | { type: 'NEW_DIAGRAM' }
  | { type: 'SET_CURRENT_DIAGRAM_ID'; payload: { id: string | null } }
  | { type: 'SET_DIAGRAM_LIST'; payload: ERDiagramMetadata[] };

const initialState: ERDiagramState = {
  currentDiagramId: null,
  diagramData: sampleERData,
  activeSidebarTab: 'components',
  selectedElementId: null,
  //节点编辑相关初始状态
  selectedNodeId: null,
  editingNodeId: null,
  nodeEditMode: 'none',
  diagramList: [], 
};

function erDiagramReducer(state: ERDiagramState, action: ERDiagramAction): ERDiagramState {
  switch (action.type) {
    case 'SET_DIAGRAM_DATA':
      // 优化：SET_DIAGRAM_DATA 只负责更新图表数据，不修改 currentDiagramId
      return {
        ...state,
        diagramData: action.payload,
      };
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeSidebarTab: action.payload,
      };
    case 'SET_SELECTED_ELEMENT':
      return {
        ...state,
        selectedElementId: action.payload,
      };
    case 'NEW_DIAGRAM':
      return {
        ...state,
        currentDiagramId: null,
        diagramData: {
          entities: [],
          relationships: [],
          metadata: {
            title: '新建ER图',
            description: '',
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case 'LOAD_SAMPLE_DATA':
      return {
        ...state,
        diagramData: sampleERData,
      };
    case 'ADD_ENTITY':
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
    case 'ADD_RELATIONSHIP':
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: [...state.diagramData.relationships, action.payload.relationship],
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case 'UPDATE_ENTITY':
      if (!state.diagramData) return state;

      const updatedEntities = state.diagramData.entities.map(entity =>
        entity.id === action.payload.id
          ? { ...entity, ...action.payload.entity }
          : entity
      );

      // 如果更新了实体的 isWeakEntity 属性，需要重新检查所有相关关系的弱关系状态
      const updatedRelationshipsForEntity = state.diagramData.relationships.map(relationship => {
        const hasUpdatedEntity = relationship.connections.some(conn => conn.entityId === action.payload.id);

        if (hasUpdatedEntity) {
          // 重新检查是否为弱关系
          const isWeakRelation = relationship.connections.some(conn => {
            const entity = updatedEntities.find(e => e.id === conn.entityId);
            return entity?.isWeakEntity === true;
          });

          return {
            ...relationship,
            isWeakRelation
          };
        }

        return relationship;
      });

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
    case 'UPDATE_RELATIONSHIP':
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: state.diagramData.relationships.map(relationship =>
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
    case 'DELETE_ENTITY':
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: state.diagramData.entities.filter(entity => entity.id !== action.payload.id),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case 'DELETE_RELATIONSHIP':
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: state.diagramData.relationships.filter(relationship => relationship.id !== action.payload.id),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    // 新增节点编辑相关reducer case
    case 'SELECT_NODE':
      return {
        ...state,
        selectedNodeId: action.payload.nodeId,
        // 选择新节点时清除编辑状态
        editingNodeId: null,
        nodeEditMode: 'none',
      };
    case 'START_EDIT_NODE':
      return {
        ...state,
        editingNodeId: action.payload.nodeId,
        nodeEditMode: action.payload.mode,
        selectedNodeId: action.payload.nodeId,
      };
    case 'FINISH_EDIT_NODE':
      return {
        ...state,
        editingNodeId: null,
        nodeEditMode: 'none',
      };
    case 'RENAME_NODE':
      if (!state.diagramData) return state;

      // 查找并更新实体或关系的名称
      const renamedEntities = state.diagramData.entities.map(entity =>
        entity.id === action.payload.nodeId
          ? { ...entity, name: action.payload.newName }
          : entity
      );

      const renamedRelationships = state.diagramData.relationships.map(relationship =>
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
        nodeEditMode: 'none',
      };
    case 'UPDATE_ATTRIBUTE':
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: state.diagramData.entities.map(entity =>
            entity.id === action.payload.entityId
              ? {
                  ...entity,
                  attributes: entity.attributes.map(attr =>
                    attr.id === action.payload.attributeId
                      ? { ...attr, ...action.payload.updates }
                      : attr
                  )
                }
              : entity
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case 'UPDATE_CONNECTION':
      if (!state.diagramData) return state;
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          relationships: state.diagramData.relationships.map(relationship =>
            relationship.id === action.payload.relationshipId
              ? {
                  ...relationship,
                  connections: relationship.connections.map(conn =>
                    conn.entityId === action.payload.entityId
                      ? { ...conn, ...action.payload.updates }
                      : conn
                  )
                }
              : relationship
          ),
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
      };
    case 'CREATE_CONNECTION':
      if (!state.diagramData) return state;

      // 添加连接并检查弱关系
      const updatedRelationshipsAfterCreate = state.diagramData.relationships.map(relationship => {
        if (relationship.id === action.payload.relationshipId) {
          const newConnections = [...relationship.connections, action.payload.connection];

          // 检查是否为弱关系（连接了弱实体）
          const isWeakRelation = newConnections.some(conn => {
            const entity = state.diagramData!.entities.find(e => e.id === conn.entityId);
            return entity?.isWeakEntity === true;
          });

          return {
            ...relationship,
            connections: newConnections,
            isWeakRelation
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
    case 'DELETE_CONNECTION':
      if (!state.diagramData) return state;

      // 删除连接并重新检查弱关系
      const updatedRelationshipsAfterDelete = state.diagramData.relationships.map(relationship => {
        if (relationship.id === action.payload.relationshipId) {
          const newConnections = relationship.connections.filter(conn => conn.entityId !== action.payload.entityId);

          // 重新检查是否为弱关系
          const isWeakRelation = newConnections.some(conn => {
            const entity = state.diagramData!.entities.find(e => e.id === conn.entityId);
            return entity?.isWeakEntity === true;
          });

          return {
            ...relationship,
            connections: newConnections,
            isWeakRelation
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
    case 'SET_CURRENT_DIAGRAM_ID':
      return {
        ...state,
        currentDiagramId: action.payload.id,
      };
    case 'SET_DIAGRAM_LIST':
      return { ...state, diagramList: action.payload };
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
  addEntity: (entity: EREntity) => void;
  addRelationship: (relationship: ERRelationship) => void;
  updateEntity: (id: string, entity: Partial<EREntity>) => void;
  updateRelationship: (id: string, relationship: Partial<ERRelationship>) => void;
  deleteEntity: (id: string) => void;
  deleteRelationship: (id: string) => void;
  // 新增节点编辑相关便捷方法
  selectNode: (nodeId: string | null) => void;
  startEditNode: (nodeId: string, mode: NodeEditMode) => void;
  finishEditNode: () => void;
  renameNode: (nodeId: string, newName: string) => void;
  // 属性编辑相关方法
  updateAttribute: (entityId: string, attributeId: string, updates: Partial<import('@/types/erDiagram').ERAttribute>) => void;
  updateConnection: (relationshipId: string, entityId: string, updates: Partial<import('@/types/erDiagram').ERConnection>) => void;
  // 连接管理相关方法
  createConnection: (relationshipId: string, connection: import('@/types/erDiagram').ERConnection) => void;
  deleteConnection: (relationshipId: string, entityId: string) => void;
  // 存储相关方法
  saveDiagram: (diagramData: ERDiagramData, existingId?: string) => Promise<string>;
  loadDiagram: (id: string) => Promise<void>;
  newDiagram: () => void;
  createNewDiagram: (name: string, description: string, templateId: string) => Promise<string>;
  listDiagrams: () => Promise<ERDiagramMetadata[]>;
  deleteDiagram: (id: string) => Promise<void>;
  // 历史记录的状态更新相关
  diagramList: ERDiagramMetadata[];
  fetchDiagramList: () => Promise<void>;
}

const ERDiagramContext = createContext<ERDiagramContextType | undefined>(undefined);

export const useERDiagramContext = () => {
  const context = useContext(ERDiagramContext);
  if (context === undefined) {
    throw new Error('useERDiagramContext must be used within an ERDiagramProvider');
  }
  return context;
};

interface ERDiagramProviderProps {
  children: ReactNode;
}

export const ERDiagramProvider: React.FC<ERDiagramProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(erDiagramReducer, initialState);

  const setActiveTab = (tab: ActiveTab) => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  };

  const setDiagramData = (data: ERDiagramData) => {
    dispatch({ type: 'SET_DIAGRAM_DATA', payload: data });
  };

  const setSelectedElement = (id: string | null) => {
    dispatch({ type: 'SET_SELECTED_ELEMENT', payload: id });
  };

  const loadSampleData = () => {
    dispatch({ type: 'LOAD_SAMPLE_DATA' });
  };

  const addEntity = (entity: EREntity) => {
    dispatch({ type: 'ADD_ENTITY', payload: { entity } });
  };

  const addRelationship = (relationship: ERRelationship) => {
    dispatch({ type: 'ADD_RELATIONSHIP', payload: { relationship } });
  };

  const updateEntity = (id: string, entity: Partial<EREntity>) => {
    dispatch({ type: 'UPDATE_ENTITY', payload: { id, entity } });
  };

  const updateRelationship = (id: string, relationship: Partial<ERRelationship>) => {
    dispatch({ type: 'UPDATE_RELATIONSHIP', payload: { id, relationship } });
  };

  const deleteEntity = (id: string) => {
    dispatch({ type: 'DELETE_ENTITY', payload: { id } });
  };

  const deleteRelationship = (id: string) => {
    dispatch({ type: 'DELETE_RELATIONSHIP', payload: { id } });
  };

  // 新增节点编辑相关便捷方法实现
  const selectNode = (nodeId: string | null) => {
    dispatch({ type: 'SELECT_NODE', payload: { nodeId } });
  };

  const startEditNode = (nodeId: string, mode: NodeEditMode) => {
    dispatch({ type: 'START_EDIT_NODE', payload: { nodeId, mode } });
  };

  const finishEditNode = () => {
    dispatch({ type: 'FINISH_EDIT_NODE' });
  };

  const renameNode = (nodeId: string, newName: string) => {
    dispatch({ type: 'RENAME_NODE', payload: { nodeId, newName } });
  };

  // 属性编辑相关方法实现
  const updateAttribute = (entityId: string, attributeId: string, updates: Partial<import('@/types/erDiagram').ERAttribute>) => {
    dispatch({ type: 'UPDATE_ATTRIBUTE', payload: { entityId, attributeId, updates } });
  };

  const updateConnection = (relationshipId: string, entityId: string, updates: Partial<import('@/types/erDiagram').ERConnection>) => {
    dispatch({ type: 'UPDATE_CONNECTION', payload: { relationshipId, entityId, updates } });
  };

  // 连接管理相关方法实现
  const createConnection = (relationshipId: string, connection: import('@/types/erDiagram').ERConnection) => {
    dispatch({ type: 'CREATE_CONNECTION', payload: { relationshipId, connection } });
  };

  const deleteConnection = (relationshipId: string, entityId: string) => {
    dispatch({ type: 'DELETE_CONNECTION', payload: { relationshipId, entityId } });
  };

  // 存储相关方法实现
  const saveDiagram = async (diagramData: ERDiagramData, existingId?: string): Promise<string> => {
    try {
      const savedId = await erDiagramStorage.saveDiagram(diagramData, existingId);
      // 保存成功后自动刷新图表列表
      await fetchDiagramList();
      // 更新当前图表ID
      dispatch({ type: 'SET_CURRENT_DIAGRAM_ID', payload: { id: savedId } });
      return savedId;
    } catch (error) {
      console.error('保存图表失败:', error);
      throw error;
    }
  };

  // 重构后的 loadDiagram 方法
  const loadDiagram = async (id: string): Promise<void> => {
    try {
      const storedDiagram = await erDiagramStorage.loadDiagram(id);
      // 通过 SET_DIAGRAM_DATA 更新图表数据
      dispatch({ type: 'SET_DIAGRAM_DATA', payload: storedDiagram.data });
      // 单独更新当前图表ID
      dispatch({ type: 'SET_CURRENT_DIAGRAM_ID', payload: { id } });
    } catch (error) {
      console.error('加载图表失败:', error);
      throw error;
    }
  };

  const newDiagram = () => {
    dispatch({ type: 'NEW_DIAGRAM' });
  };

  const listDiagrams = async (): Promise<ERDiagramMetadata[]> => {
    return await erDiagramStorage.listDiagrams();
  };

  // 重构后的 deleteDiagram 方法
  const deleteDiagram = async (id: string): Promise<void> => {
    try {
      await erDiagramStorage.deleteDiagram(id);
      // 如果删除的是当前图表，清空状态
      if (state.currentDiagramId === id) {
        dispatch({ type: 'NEW_DIAGRAM' });
      }
      // 删除成功后自动刷新图表列表
      await fetchDiagramList();
    } catch (error) {
      console.error('删除图表失败:', error);
      throw error;
    }
  };

  const fetchDiagramList = useCallback(async () => {
    try {
      const list = await erDiagramStorage.listDiagrams();
      dispatch({ type: 'SET_DIAGRAM_LIST', payload: list });
    } catch (error) {
      console.error('Failed to fetch diagram list:', error);
      // 在错误情况下设置空列表，避免UI崩溃
      dispatch({ type: 'SET_DIAGRAM_LIST', payload: [] });
    }
  }, []);

  // 新增 createNewDiagram 方法
  const createNewDiagram = async (
    name: string,
    description: string,
    templateId: string
  ): Promise<string> => {
    try {
      // 根据模板ID构建图表数据
      let newDiagramData: ERDiagramData;

      if (templateId === 'blank') {
        // 创建空白图表
        newDiagramData = {
          entities: [],
          relationships: [],
          metadata: {
            title: name.trim(),
            description: description.trim() || '空白ER图',
            version: '1.0.0',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      } else if (templateId === 'sample') {
        // 使用示例图书馆系统模板
        newDiagramData = {
          ...sampleERData,
          metadata: {
            ...sampleERData.metadata,
            title: name.trim(),
            description: description.trim() || '示例图书馆系统',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      } else if (templateId === 'employee') {
        // 使用员工部门项目模板
        newDiagramData = {
          ...employeeDepartmentERData,
          metadata: {
            ...employeeDepartmentERData.metadata,
            title: name.trim(),
            description: description.trim() || '员工部门项目',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      } else if (templateId === 'weak_entity') {
        // 使用弱实体集示例模板
        newDiagramData = {
          ...weakEntityERData,
          metadata: {
            ...weakEntityERData.metadata,
            title: name.trim(),
            description: description.trim() || '弱实体集示例',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
      } else {
        throw new Error('无效的模板ID');
      }

      // 保存到数据库
      const savedId = await saveDiagram(newDiagramData);

      // 设置为当前图表
      dispatch({ type: 'SET_DIAGRAM_DATA', payload: newDiagramData });

      return savedId;
    } catch (error) {
      console.error('创建新图表失败:', error);
      throw error;
    }
  };

  // 4. useEffect 首次加载时调用 fetchDiagramList
  useEffect(() => {
    fetchDiagramList();
  }, [fetchDiagramList]);

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
    updateAttribute,
    updateConnection,
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
  };

  return (
    <ERDiagramContext.Provider value={value}>
      {children}
    </ERDiagramContext.Provider>
  );
};
