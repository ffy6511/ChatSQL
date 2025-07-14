'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ERDiagramData, sampleERData, EREntity, ERRelationship } from '@/types/erDiagram';
import { erDiagramStorage, ERDiagramMetadata } from '@/services/erDiagramStorage';

type ActiveTab = 'components' | 'entities' | 'relationships';
type NodeEditMode = 'none' | 'rename' | 'properties';

interface ERDiagramState {
  currentDiagramId: string | null;
  diagramData: ERDiagramData | null;
  activeSidebarTab: ActiveTab;
  selectedElementId: string | null;
  // 新增节点编辑相关状态
  selectedNodeId: string | null;
  editingNodeId: string | null;
  nodeEditMode: NodeEditMode;
}

type ERDiagramAction =
  | { type: 'SET_DIAGRAM_DATA'; payload: ERDiagramData }
  | { type: 'SET_ACTIVE_TAB'; payload: ActiveTab }
  | { type: 'SET_SELECTED_ELEMENT'; payload: string | null }
  | { type: 'NEW_DIAGRAM' }
  | { type: 'LOAD_SAMPLE_DATA' }
  | { type: 'ADD_ENTITY'; payload: { entity: EREntity } }
  | { type: 'ADD_RELATIONSHIP'; payload: { relationship: ERRelationship } }
  | { type: 'UPDATE_ENTITY'; payload: { id: string; entity: Partial<EREntity> } }
  | { type: 'UPDATE_RELATIONSHIP'; payload: { id: string; relationship: Partial<ERRelationship> } }
  | { type: 'DELETE_ENTITY'; payload: { id: string } }
  | { type: 'DELETE_RELATIONSHIP'; payload: { id: string } }
  // 新增节点编辑相关Action
  | { type: 'SELECT_NODE'; payload: { nodeId: string | null } }
  | { type: 'START_EDIT_NODE'; payload: { nodeId: string; mode: NodeEditMode } }
  | { type: 'FINISH_EDIT_NODE' }
  | { type: 'RENAME_NODE'; payload: { nodeId: string; newName: string } }
  // 存储相关Action
  | { type: 'SAVE_DIAGRAM'; payload: { id?: string } }
  | { type: 'LOAD_DIAGRAM'; payload: { id: string } }
  | { type: 'NEW_DIAGRAM' }
  | { type: 'SET_CURRENT_DIAGRAM_ID'; payload: { id: string | null } };

const initialState: ERDiagramState = {
  currentDiagramId: null,
  diagramData: sampleERData,
  activeSidebarTab: 'components',
  selectedElementId: null,
  // 新增节点编辑相关初始状态
  selectedNodeId: null,
  editingNodeId: null,
  nodeEditMode: 'none',
};

function erDiagramReducer(state: ERDiagramState, action: ERDiagramAction): ERDiagramState {
  switch (action.type) {
    case 'SET_DIAGRAM_DATA':
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
      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: state.diagramData.entities.map(entity =>
            entity.id === action.payload.id
              ? { ...entity, ...action.payload.entity }
              : entity
          ),
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
      const updatedEntities = state.diagramData.entities.map(entity =>
        entity.id === action.payload.nodeId
          ? { ...entity, name: action.payload.newName }
          : entity
      );

      const updatedRelationships = state.diagramData.relationships.map(relationship =>
        relationship.id === action.payload.nodeId
          ? { ...relationship, name: action.payload.newName }
          : relationship
      );

      return {
        ...state,
        diagramData: {
          ...state.diagramData,
          entities: updatedEntities,
          relationships: updatedRelationships,
          metadata: {
            ...state.diagramData.metadata,
            updatedAt: new Date().toISOString(),
          },
        },
        // 重命名完成后清除编辑状态
        editingNodeId: null,
        nodeEditMode: 'none',
      };
    case 'SET_CURRENT_DIAGRAM_ID':
      return {
        ...state,
        currentDiagramId: action.payload.id,
      };
    case 'NEW_DIAGRAM':
      return {
        ...state,
        currentDiagramId: null,
        diagramData: null,
        selectedElementId: null,
        selectedNodeId: null,
        editingNodeId: null,
        nodeEditMode: 'none',
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
  // 存储相关方法
  saveDiagram: (id?: string) => Promise<string>;
  loadDiagram: (id: string) => Promise<void>;
  newDiagram: () => void;
  listDiagrams: () => Promise<ERDiagramMetadata[]>;
  deleteDiagram: (id: string) => Promise<void>;
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

  // 存储相关方法实现
  const saveDiagram = async (id?: string): Promise<string> => {
    if (!state.diagramData) {
      throw new Error('No diagram data to save');
    }

    const savedId = await erDiagramStorage.saveDiagram(state.diagramData, id);
    dispatch({ type: 'SET_CURRENT_DIAGRAM_ID', payload: { id: savedId } });
    return savedId;
  };

  const loadDiagram = async (id: string): Promise<void> => {
    const storedDiagram = await erDiagramStorage.loadDiagram(id);
    dispatch({ type: 'SET_DIAGRAM_DATA', payload: storedDiagram.data });
    dispatch({ type: 'SET_CURRENT_DIAGRAM_ID', payload: { id } });
  };

  const newDiagram = () => {
    dispatch({ type: 'NEW_DIAGRAM' });
  };

  const listDiagrams = async (): Promise<ERDiagramMetadata[]> => {
    return await erDiagramStorage.listDiagrams();
  };

  const deleteDiagram = async (id: string): Promise<void> => {
    await erDiagramStorage.deleteDiagram(id);
    // 如果删除的是当前图表，清空状态
    if (state.currentDiagramId === id) {
      dispatch({ type: 'NEW_DIAGRAM' });
    }
  };

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
    // 新增节点编辑相关方法
    selectNode,
    startEditNode,
    finishEditNode,
    renameNode,
    // 存储相关方法
    saveDiagram,
    loadDiagram,
    newDiagram,
    listDiagrams,
    deleteDiagram,
  };

  return (
    <ERDiagramContext.Provider value={value}>
      {children}
    </ERDiagramContext.Provider>
  );
};
