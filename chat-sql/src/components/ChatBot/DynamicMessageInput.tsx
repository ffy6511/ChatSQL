// 动态消息输入组件 - 根据智能体类型显示不同的输入界面

import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Typography,
  Stack,
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";
import {
  AgentType,
  AGENTS_INFO,
  AgentInputField,
  AgentOutputPart,
} from "@/types/chatBotTypes/agents";
import ERDiagramSelector from "./MessageInput/ERDiagramSelector";
import QuizSelector from "./MessageInput/QuizSelector";
import DifficultySelector from "./MessageInput/DifficultySelector";
import { quizStorage } from "@/services/quizStorage";
import { useSnackbar } from "@/contexts/SnackbarContext";

interface DynamicMessageInputProps {
  selectedAgent: AgentType;
  onSendMessage: (
    agentType: string,
    inputValues: Record<string, string>
  ) => Promise<AgentOutputPart[] | null>;
  disabled?: boolean;
}

const DynamicMessageInput: React.FC<DynamicMessageInputProps> = ({
  selectedAgent,
  onSendMessage,
  disabled = false,
}) => {
  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const firstInputRef = useRef<HTMLInputElement>(null);

  const { showSnackbar } = useSnackbar();

  // 获取当前智能体信息
  const agentInfo = AGENTS_INFO[selectedAgent];

  // 当智能体类型改变时，重置输入值
  useEffect(() => {
    setInputValues({});
    setErrors({});
  }, [selectedAgent]);

  // 处理输入值变化
  const handleInputChange = (fieldName: string, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [fieldName]: value,
    }));

    // 清除该字段的错误
    if (errors[fieldName]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // 验证输入
  const validateInputs = (): boolean => {
    const newErrors: Record<string, string> = {};

    for (const field of agentInfo.inputFields) {
      if (field.required && !inputValues[field.name]?.trim()) {
        newErrors[field.name] = `请填写${field.label}`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 处理发送消息
  const handleSendMessage = async () => {
    if (disabled) return;

    if (!validateInputs()) {
      return;
    }

    try {
      const output: AgentOutputPart[] | null = await onSendMessage(
        selectedAgent,
        inputValues
      );

      setInputValues({});
      setErrors({});

      // 重新聚焦第一个输入框
      setTimeout(() => {
        firstInputRef.current?.focus();
      }, 100);

      if (output) {
        // 如果是ER出题，保存到对应的indexDB
        if (selectedAgent === AgentType.ER_QUIZ_GENERATOR) {
          const descriptionPart = output.find((p) => p.type === "text");
          const erDataPart = output.find((p) => p.type === "json");
          if (descriptionPart && erDataPart) {
            // 保存到QuizStore
            const quizData = {
              name: `New Quiz ${new Date().toLocaleString()}`,
              description: descriptionPart.content,
              referenceAnswer: erDataPart.content,
            };

            await quizStorage.addQuiz(quizData);

            showSnackbar("Quiz已成功保存到本地", "success");
          } else {
            console.warn("智能体返回的数据不完整，无法保存");
          }
        }
      } else {
        console.warn("onSendMessage 未返回有效的输出。");
      }
    } catch (error) {
      console.error("发送消息失败:", error);
    }
  };

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  // 检查是否可以发送
  const canSend = agentInfo.inputFields.every(
    (field) => !field.required || inputValues[field.name]?.trim()
  );

  // 渲染输入字段
  const renderInputField = (field: AgentInputField, index: number) => {
    const isMultiline = field.type === "textarea";
    const value = inputValues[field.name] || "";
    const error = errors[field.name];

    return (
      <Box key={field.name}>
        <Typography
          variant='caption'
          sx={{
            color: "var(--secondary-text)",
            display: "block",
            mb: 0.5,
            fontSize: "0.75rem",
          }}
        >
          {field.label}
          {field.required && (
            <Typography
              component='span'
              sx={{ color: "var(--error-color, #f44336)" }}
            >
              {" "}
              *
            </Typography>
          )}
        </Typography>

        {field.type === "er-diagram-selector" ? (
          <ERDiagramSelector
            value={value}
            onChange={(newValue) => handleInputChange(field.name, newValue)}
            placeholder={field.placeholder}
          />
        ) : field.type === "quiz-selector" ? (
          <QuizSelector
            value={value}
            onChange={(newValue) => handleInputChange(field.name, newValue)}
            placeholder={field.placeholder}
            error={error}
          />
        ) : field.type === "difficulty-selector" ? (
          <Box sx={{ maxWidth: "10rem", ml: 1 }}>
            <DifficultySelector
              value={value}
              onChange={(newValue) => handleInputChange(field.name, newValue)}
              placeholder={field.placeholder}
              disabled={disabled}
              error={error}
            />
          </Box>
        ) : (
          <TextField
            ref={index === 0 ? firstInputRef : undefined}
            fullWidth
            multiline={isMultiline}
            rows={isMultiline ? 3 : 1}
            maxRows={isMultiline ? 6 : 1}
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={field.placeholder}
            disabled={disabled}
            error={!!error}
            variant='outlined'
            size='small'
            sx={{
              "& .MuiOutlinedInput-root": {
                backgroundColor: "var(--input-bg)",
                borderRadius: 4,
                fontSize: "0.875rem",
              },
              "& .MuiInputBase-input": {
                color: "var(--input-text)",
                "&::placeholder": {
                  color: "var(--secondary-text)",
                  opacity: 1,
                },
              },
              "& .MuiFormHelperText-root": {
                fontSize: "0.7rem",
                color: error
                  ? "var(--error-color, #f44336)"
                  : "var(--secondary-text)",
              },
            }}
          />
        )}
      </Box>
    );
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        backgroundColor: "var(--card-bg)",
        overflowY: "auto", // 添加Y轴滚动条
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Stack
        spacing={2}
        sx={{
          flex: 1,
          minHeight: 0, // 允许Stack收缩
          overflowY: "auto", // 确保Stack内容可滚动
        }}
      >
        {/* 输入字段 */}
        {agentInfo.inputFields.map((field, index) =>
          renderInputField(field, index)
        )}

        {/* 发送按钮区域 */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            mt: 1,
            flexShrink: 0, // 防止按钮区域被压缩
          }}
        >
          <Tooltip title='发送 (Enter)'>
            <IconButton
              onClick={handleSendMessage}
              disabled={disabled || !canSend}
              color='primary'
              sx={{
                backgroundColor: canSend ? "primary.main" : "grey.300",
                color: "white",
                "&:hover": {
                  backgroundColor: canSend ? "primary.dark" : "grey.400",
                },
                "&.Mui-disabled": {
                  backgroundColor: "grey.300",
                  color: "grey.500",
                },
              }}
            >
              <SendIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>
    </Paper>
  );
};

export default DynamicMessageInput;
