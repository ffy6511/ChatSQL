'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ERDiagramData, sampleERData, EREntity, ERRelationship } from '@/types/erDiagram';

type ActiveTab = 'components' | 'entities' | 'relationships';

interface ERDiagramState {
  currentDiagramId: string | null;
  diagramData: ERDiagramData | null;
  activeSidebarTab: ActiveTab;
  selectedElementId: string | null;
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
  | { type: 'DELETE_RELATIONSHIP'; payload: { id: string } };

const initialState: ERDiagramState = {
  currentDiagramId: null,
  diagramData: sampleERData,
  activeSidebarTab: 'components',
  selectedElementId: null,
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
  newDiagram: () => void;
  loadSampleData: () => void;
  // 新增的便捷方法
  addEntity: (entity: EREntity) => void;
  addRelationship: (relationship: ERRelationship) => void;
  updateEntity: (id: string, entity: Partial<EREntity>) => void;
  updateRelationship: (id: string, relationship: Partial<ERRelationship>) => void;
  deleteEntity: (id: string) => void;
  deleteRelationship: (id: string) => void;
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

  const newDiagram = () => {
    dispatch({ type: 'NEW_DIAGRAM' });
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

  const value: ERDiagramContextType = {
    state,
    dispatch,
    setActiveTab,
    setDiagramData,
    setSelectedElement,
    newDiagram,
    loadSampleData,
    addEntity,
    addRelationship,
    updateEntity,
    updateRelationship,
    deleteEntity,
    deleteRelationship,
  };

  return (
    <ERDiagramContext.Provider value={value}>
      {children}
    </ERDiagramContext.Provider>
  );
};
