'use client';

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { ERDiagramData, sampleERData } from '@/types/erDiagram';

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
  | { type: 'LOAD_SAMPLE_DATA' };

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

  const value: ERDiagramContextType = {
    state,
    dispatch,
    setActiveTab,
    setDiagramData,
    setSelectedElement,
    newDiagram,
    loadSampleData,
  };

  return (
    <ERDiagramContext.Provider value={value}>
      {children}
    </ERDiagramContext.Provider>
  );
};
