import React, { useState, useEffect, useRef, KeyboardEvent } from "react";
import { TextField, ClickAwayListener } from "@mui/material";
import { styled } from "@mui/material/styles";

// 样式化的TextField组件
const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-root": {
    // fontSize: "1.1em",
    fontWeight: "bold",
    padding: "0px 0px",
    boxShadow: `0 4px 12px rgba(0, 0, 0, 0.15)`,
  },
  "& .MuiInputBase-input": {
    padding: "4px 0",
    textAlign: "center",
  },
}));

interface InlineEditorProps {
  nodeId: string;
  currentName: string;
  onSave: (newName: string) => void;
  onCancel: () => void;
  className?: string;
}

const InlineEditor: React.FC<InlineEditorProps> = ({
  nodeId,
  currentName,
  onSave,
  onCancel,
  className,
}) => {
  const [value, setValue] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  // 组件挂载时自动聚焦并选中文本
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  // 处理键盘事件
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    event.stopPropagation(); // 防止事件冒泡到父组件

    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      handleSave();
    } else if (event.key === "Escape") {
      handleCancel();
    }
  };

  // 保存编辑
  const handleSave = () => {
    const trimmedValue = value.trim();
    if (trimmedValue && trimmedValue !== currentName) {
      onSave(trimmedValue);
    } else {
      onCancel();
    }
  };

  // 取消编辑
  const handleCancel = () => {
    setValue(currentName);
    onCancel();
  };

  // 点击外部区域时保存
  const handleClickAway = () => {
    handleSave();
  };

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <StyledTextField
        inputRef={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        variant='outlined'
        size='small'
        className={className}
        inputProps={{
          "aria-label": `编辑${nodeId}的名称`,
          maxLength: 50, // 限制最大长度
        }}
        autoComplete='off'
        spellCheck={false}
      />
    </ClickAwayListener>
  );
};

export default InlineEditor;
