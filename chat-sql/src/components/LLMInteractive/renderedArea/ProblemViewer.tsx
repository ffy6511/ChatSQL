"use client";

import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import { useLLMContext } from "@/contexts/LLMContext";
import { useCompletionContext } from "@/contexts/CompletionContext";

const ProblemViewer: React.FC = () => {
  const { llmResult, currentProblemId } = useLLMContext();
  const { completedProblems, clearAllProgress } = useCompletionContext();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // 使用 useMemo 缓存数据，避免不必要的重新计算
  const problem = useMemo(
    () => llmResult?.data?.outputs?.problem || [],
    [llmResult?.data?.outputs?.problem],
  );
  const description = useMemo(
    () => llmResult?.data?.outputs?.description || "",
    [llmResult?.data?.outputs?.description],
  );

  // 检查是否有已完成的问题
  const hasCompletedProblems = completedProblems.size > 0;

  // 处理清除进度按钮点击
  const handleClearProgressClick = () => {
    setIsConfirmDialogOpen(true);
  };

  // 确认清除进度
  const handleConfirmClearProgress = async () => {
    await clearAllProgress();
    setIsConfirmDialogOpen(false);
  };

  // 取消清除进度
  const handleCancelClearProgress = () => {
    setIsConfirmDialogOpen(false);
  };

  // 删除记录的快捷键
  const handleDialogKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.stopPropagation(); // 组织事件冒泡

      handleConfirmClearProgress();
    }
  };

  return (
    <Box
      sx={{
        height: "100%",
        overflow: "auto",
        borderRadius: 2,
        p: 1,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          backgroundColor: "transparent",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            mb: 2,
          }}
        >
          <AssignmentIcon
            sx={{
              fontSize: 30,
              color: "primary.main",
              // marginLeft: 'auto', // 使图标在容器中水平居中
            }}
          />
          <Typography
            variant="h5"
            component="h2"
            fontWeight="bold"
            textAlign={"center"}
            width="100%"
          >
            查询要求
          </Typography>
        </Box>

        {description && (
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h6"
              component="h3"
              gutterBottom
              fontSize="1rem"
              sx={{
                color: "var(--secondary-text)",
              }}
            >
              问题描述
            </Typography>
            <Typography
              variant="body1"
              sx={{
                backgroundColor: "action.hover",
                p: 2,
                borderRadius: 1,
                color: "var(--primary-text)",
              }}
            >
              {description}
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Typography
            variant="h6"
            component="h3"
            fontSize="1rem"
            sx={{
              color: "var(--secondary-text)",
            }}
          >
            具体要求
          </Typography>

          {/* 清除进度按钮 */}
          {hasCompletedProblems && currentProblemId && (
            <Tooltip title="清除所有进度" placement="top">
              <IconButton
                onClick={handleClearProgressClick}
                size="small"
                sx={{
                  color: "var(--secondary-text)",
                  "&:hover": {
                    color: "#f44336",
                    backgroundColor: "rgba(244, 67, 54, 0.04)",
                  },
                }}
              >
                <DeleteSweepIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        <List>
          {problem.map((item, index) => (
            <ListItem
              key={index}
              sx={{
                py: 1,
                backgroundColor: completedProblems.has(index)
                  ? "rgba(76, 175, 80, 0.1)"
                  : "transparent",
                borderRadius: 1,
                transition: "all 0.3s ease",
                position: "relative",
                textDecoration: "underline", // 添加下划线
                textDecorationColor: "var(--tertiary-text)", // 设置下划线颜色
                textDecorationThickness: "0.5px", // 设置下划线粗细
                textUnderlineOffset: "5px", // 设置下划线与文字的距离
                "&::after": completedProblems.has(index)
                  ? {
                      content: '"✓"',
                      position: "absolute",
                      right: "8px",
                      color: "#4CAF50",
                      fontWeight: "bold",
                    }
                  : {},
              }}
            >
              <ListItemText
                primary={
                  <Typography
                    sx={{
                      textDecoration: completedProblems.has(index)
                        ? "line-through"
                        : "none",
                      color: completedProblems.has(index)
                        ? "var(--tertiary-text)"
                        : "var(--primary-text)",
                      fontStyle: completedProblems.has(index)
                        ? "italic"
                        : "normal",
                    }}
                  >
                    {item}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      {/* 确认清除进度对话框 */}
      <Dialog
        open={isConfirmDialogOpen}
        onClose={handleCancelClearProgress}
        aria-labelledby="clear-progress-dialog-title"
        aria-describedby="clear-progress-dialog-description"
        onKeyDown={handleDialogKeyDown}
      >
        <DialogTitle id="clear-progress-dialog-title">确认清除进度</DialogTitle>
        <DialogContent>
          <DialogContentText id="clear-progress-dialog-description">
            您确定要清除所有编程题目的完成进度吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelClearProgress}
            sx={{ color: "var(--secondary-text)" }}
          >
            取消
          </Button>
          <Button
            onClick={handleConfirmClearProgress}
            color="error"
            variant="contained"
            autoFocus
          >
            确认清除
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProblemViewer;
