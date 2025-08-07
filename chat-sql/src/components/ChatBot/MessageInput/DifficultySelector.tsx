import React, { useState } from "react";
import { Button, Popover, Box, Typography } from "@mui/material";
import { BarChart as BarChartIcon } from "@mui/icons-material";

interface DifficultyOption {
  label: string;
  value: "simple" | "medium" | "hard";
}

const difficultyOptions: DifficultyOption[] = [
  { label: "简单", value: "simple" },
  { label: "中等", value: "medium" },
  { label: "困难", value: "hard" },
];

interface DifficultySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

/**
 * 难度选择器组件
 */
const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  value,
  onChange,
  placeholder = "请选择题目难度",
  disabled = false,
  error,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // 打开难度选择弹出框
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    if (!disabled) {
      setAnchorEl(event.currentTarget);
    }
  };

  // 关闭弹出框
  const handleClose = () => {
    setAnchorEl(null);
  };

  // 选择难度
  const handleSelectDifficulty = (difficulty: string) => {
    onChange(difficulty);
    handleClose();
  };

  // 获取当前选择的难度标签
  const getCurrentLabel = () => {
    const option = difficultyOptions.find((opt) => opt.value === value);
    return option ? option.label : placeholder;
  };

  const open = Boolean(anchorEl);

  return (
    <Box>
      {/* 难度选择按钮 */}
      <Button
        variant='outlined'
        onClick={handleClick}
        startIcon={<BarChartIcon />}
        disabled={disabled}
        fullWidth
        sx={{
          borderRadius: "16px",
          backgroundColor: "var(--card-bg)",
          color: value ? "var(--primary-text)" : "var(--secondary-text)",
          borderColor: error ? "var(--error-color)" : "var(--card-border)",
          justifyContent: "flex-start",
          textAlign: "center",
          py: 1.5,
          px: 2,
          "&:hover": {
            backgroundColor: "var(--button-hover)",
            borderColor: error ? "var(--error-color)" : "var(--card-border)",
          },
          "&:disabled": {
            backgroundColor: "var(--disabled-bg)",
            color: "var(--disabled-text)",
            borderColor: "var(--disabled-border)",
          },
        }}
      >
        {getCurrentLabel()}
      </Button>

      {/* 错误提示 */}
      {error && (
        <Typography
          variant='caption'
          color='error'
          sx={{ mt: 0.5, display: "block" }}
        >
          {error}
        </Typography>
      )}

      {/* 难度选择弹出框 */}
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: {
            backgroundColor: "var(--card-bg)",
            color: "var(--primary-text)",
            border: "1px solid var(--card-border)",
            borderRadius: "12px",
            padding: "16px",
            width: "200px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
        }}
      >
        <Typography
          variant='subtitle2'
          sx={{
            fontWeight: "bold",
            textAlign: "center",
            mb: 2,
            color: "var(--primary-text)",
          }}
        >
          选择难度
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {difficultyOptions.map((option) => (
            <Button
              key={option.value}
              onClick={() => handleSelectDifficulty(option.value)}
              variant={value === option.value ? "contained" : "outlined"}
              fullWidth
              sx={{
                borderRadius: "8px",
                py: 1,
              }}
            >
              {option.label}
            </Button>
          ))}
        </Box>
      </Popover>
    </Box>
  );
};

export default DifficultySelector;
