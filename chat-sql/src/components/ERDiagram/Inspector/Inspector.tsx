'use client';

import React from 'react';
import { Box } from '@mui/material';
import { useERDiagramContext } from '@/contexts/ERDiagramContext';
import PropertyEditor from '../utils/PropertyEditor';
import ComponentLibraryView from './ComponentLibraryView';
import EntityListView from './EntityListView';
import RelationshipListView from './RelationshipListView';
import QuizHistoryPanel from '../core/QuizHistoryPanel';
import { EREntity, ERRelationship } from '@/types/ERDiagramTypes/erDiagram';

type ActiveTab = 'components' | 'entities' | 'relationships' | 'quiz-history';

interface InspectorProps {
  activeTab: ActiveTab;
}

// EntitiesView 已移动到 EntityListView.tsx

// RelationshipsView 已移动到 RelationshipListView.tsx

const Inspector: React.FC<InspectorProps> = ({ activeTab }) => {
  const { state, updateEntity, updateRelationship } = useERDiagramContext();

  // 获取选中的元素
  const getSelectedElement = (): EREntity | ERRelationship | null => {
    if (!state.selectedNodeId || !state.diagramData) return null;

    // 先在实体中查找
    const entity = state.diagramData.entities.find(e => e.id === state.selectedNodeId);
    if (entity) return entity;

    // 再在关系中查找
    const relationship = state.diagramData.relationships.find(r => r.id === state.selectedNodeId);
    if (relationship) return relationship;

    return null;
  };

  const selectedElement = getSelectedElement();

  // 如果有选中的节点且处于属性编辑模式，显示属性编辑器
  if (selectedElement && state.nodeEditMode === 'properties') {
    return (
      <Box sx={{ p: 2 }}>
        <PropertyEditor
          selectedElement={selectedElement}
          onUpdateEntity={updateEntity}
          onUpdateRelationship={updateRelationship}
        />
      </Box>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'components':
        return <ComponentLibraryView />;
      case 'entities':
        return <EntityListView />;
      case 'relationships':
        return <RelationshipListView />;
      case 'quiz-history':
        return <QuizHistoryPanel />;
      default:
        return <ComponentLibraryView />;
    }
  };

  return (
    <Box sx={{ p: 2, overflowY: 'auto' }}>
      {renderContent()}
    </Box>
  );
};

export default Inspector;
