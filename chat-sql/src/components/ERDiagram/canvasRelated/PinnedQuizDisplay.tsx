import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  IconButton,
  Box,
  Collapse,
  Tooltip,
} from "@mui/material";
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Quiz as QuizIcon,
} from "@mui/icons-material";
import { Panel } from "@xyflow/react";
import { Quiz } from "@/types/ERDiagramTypes/quiz";
import { quizStorage } from "@/services/quizStorage";
import { useERDiagramContext } from "@/contexts/ERDiagramContext";
import { useSnackbar } from "@/contexts/SnackbarContext";

interface PinnedQuizDisplayProps {
  quizId: string;
}

/**
 * 固定题目显示组件 - 在画布右上角显示固定的题目信息
 */
const PinnedQuizDisplay: React.FC<PinnedQuizDisplayProps> = ({ quizId }) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const { setPinnedQuiz } = useERDiagramContext();
  const { showSnackbar } = useSnackbar();

  // 加载题目数据
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        const quizData = await quizStorage.getQuiz(quizId);
        if (quizData) {
          setQuiz(quizData);
        } else {
          showSnackbar("题目不存在，已自动取消固定", "warning");
          setPinnedQuiz(null);
        }
      } catch (error) {
        console.error("加载固定题目失败:", error);
        showSnackbar("加载题目失败", "error");
        setPinnedQuiz(null);
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, setPinnedQuiz, showSnackbar]);

  // 关闭固定
  const handleClose = () => {
    setPinnedQuiz(null);
    showSnackbar("已取消固定题目", "info");
  };

  // 切换展开/收起
  const handleToggleExpand = () => {
    setExpanded(!expanded);
  };

  if (loading) {
    return (
      <Panel position='top-right' style={{ margin: "16px", zIndex: 1000 }}>
        <Paper
          elevation={3}
          sx={{
            p: 2,
            minWidth: 280,
            maxWidth: 400,
            backgroundColor: "var(--card-bg)",
            border: "1px solid var(--card-border)",
            borderRadius: 2,
          }}
        >
          <Typography variant='body2' color='var(--secondary-text)'>
            加载中...
          </Typography>
        </Paper>
      </Panel>
    );
  }

  if (!quiz) {
    return null;
  }

  return (
    <Panel position='top-right' style={{ margin: "16px", zIndex: 1000 }}>
      <Paper
        elevation={3}
        sx={{
          minWidth: 280,
          maxWidth: 400,
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: 2,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        }}
      >
        {/* 头部 */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 1.5,
            borderBottom: "1px solid var(--card-border)",
            backgroundColor: "var(--hover-bg)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <QuizIcon sx={{ fontSize: 18, color: "var(--primary-color)" }} />
            <Typography
              variant='subtitle2'
              sx={{
                color: "var(--primary-text)",
                fontWeight: 600,
              }}
            >
              固定题目
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Tooltip title={expanded ? "收起" : "展开"}>
              <IconButton
                size='small'
                onClick={handleToggleExpand}
                sx={{
                  color: "var(--secondary-text)",
                  "&:hover": {
                    backgroundColor: "var(--hover-bg)",
                  },
                }}
              >
                {expanded ? (
                  <ExpandLessIcon fontSize='small' />
                ) : (
                  <ExpandMoreIcon fontSize='small' />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip title='取消固定'>
              <IconButton
                size='small'
                onClick={handleClose}
                sx={{
                  color: "var(--secondary-text)",
                  "&:hover": {
                    backgroundColor: "var(--hover-bg)",
                    color: "var(--error-color)",
                  },
                }}
              >
                <CloseIcon fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* 内容区域 */}
        <Collapse in={expanded}>
          <Box sx={{ p: 2, maxHeight: "35vh", overflow: "auto" }}>
            {/* 题目标题 */}
            <Typography
              variant='h6'
              sx={{
                color: "var(--primary-text)",
                fontWeight: 600,
                mb: 1.5,
                lineHeight: 1.3,
              }}
            >
              {quiz.name}
            </Typography>

            {/* 题目描述 */}
            <Typography
              variant='body2'
              sx={{
                color: "var(--secondary-text)",
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {/* 提取字段内部的内容显示 */}
              {JSON.parse(quiz.description).description}
            </Typography>

            {/* 创建时间 */}
            <Typography
              variant='caption'
              sx={{
                color: "var(--secondary-text)",
                display: "block",
                mt: 1.5,
                opacity: 0.8,
              }}
            >
              创建时间: {new Date(quiz.createdAt).toLocaleString("zh-CN")}
            </Typography>
          </Box>
        </Collapse>
      </Paper>
    </Panel>
  );
};

export default PinnedQuizDisplay;
