import { useState } from "react";
import { ERAttribute } from "@/types/ERDiagramTypes/erDiagram";
import {
  dataTypeParamConfig,
  getDefaultParams,
  parseDataType,
  buildDataType,
} from "@/types/ERDiagramTypes/dataTypes";

interface UseAttributeEditorProps {
  updateAttribute: (
    id: string,
    attributeId: string,
    updates: Partial<ERAttribute>,
  ) => Promise<void>;
  deleteAttribute: (id: string, attributeId: string) => Promise<void>;
}

export const useAttributeEditor = ({
  updateAttribute,
  deleteAttribute,
}: UseAttributeEditorProps) => {
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [isComposing, setIsComposing] = useState<Record<string, boolean>>({});
  const [menuAnchor, setMenuAnchor] = useState<
    Record<string, HTMLElement | null>
  >({});
  const [attributeParams, setAttributeParams] = useState<
    Record<string, string[]>
  >({});

  const handleNameChange = (attributeId: string, newName: string) => {
    setEditingNames((prev) => ({ ...prev, [attributeId]: newName }));
  };

  const handleNameSave = async (entityId: string, attributeId: string) => {
    if (isComposing[attributeId]) return;

    const newName = editingNames[attributeId];
    if (newName !== undefined) {
      const finalName = newName.trim() || "未命名";
      await updateAttribute(entityId, attributeId, { name: finalName });

      setEditingNames((prev) => {
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

  const handleMenuOpen = (
    event: React.MouseEvent<HTMLElement>,
    attributeId: string,
  ) => {
    event.stopPropagation();
    setMenuAnchor((prev) => ({ ...prev, [attributeId]: event.currentTarget }));
  };

  const handleMenuClose = () => {
    setMenuAnchor({});
  };

  const handleDeleteAttribute = async (
    entityId: string,
    attributeId: string,
  ) => {
    handleMenuClose();
    await deleteAttribute(entityId, attributeId);
  };

  const handleTypeChange = async (
    entityId: string,
    attributeId: string,
    dataType: string,
  ) => {
    if (dataTypeParamConfig[dataType]) {
      setAttributeParams((prev) => ({
        ...prev,
        [attributeId]: getDefaultParams(dataType),
      }));
    } else {
      setAttributeParams((prev) => ({ ...prev, [attributeId]: [] }));
    }
    await updateAttribute(entityId, attributeId, { dataType });
  };

  const handleParamChange = async (
    entityId: string,
    attributeId: string,
    paramIndex: number,
    value: string,
    typeName: string,
  ) => {
    const { params: currentParams } = parseDataType(typeName);
    const newParams = [...currentParams];
    newParams[paramIndex] = value;
    const newDataType = buildDataType(typeName, newParams);
    await updateAttribute(entityId, attributeId, { dataType: newDataType });
  };

  return {
    editingNames,
    isComposing,
    menuAnchor,
    attributeParams,
    setAttributeParams,
    handleNameChange,
    handleNameSave,
    handleCompositionStart,
    handleCompositionEnd,
    handleMenuOpen,
    handleMenuClose,
    handleDeleteAttribute,
    handleTypeChange,
    handleParamChange,
  };
};
