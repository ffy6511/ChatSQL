// Quiz选择器组件
import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Chip,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  Quiz as QuizIcon,
  CalendarToday as DateIcon,
} from "@mui/icons-material";
import { Quiz, QuizSelectorProps } from "@/types/ERDiagramTypes/quiz";
import { quizStorage } from "@/services/quizStorage";

/**
 * Quiz选择器组件
 * 支持从已保存的题目中选择一个进行检验
 */
const QuizSelector: React.FC<QuizSelectorProps> = ({
  value,
  onChange,
  error,
  placeholder = "请选择一个题目进行检验",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // 加载所有题目
  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const allQuizzes = await quizStorage.getAllQuizzes();
      setQuizzes(allQuizzes);
      setFilteredQuizzes(allQuizzes);
    } catch (error) {
      console.error("加载题目失败:", error);
      setLoadError("加载题目失败，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

  // 搜索题目
  const handleSearch = useCallback(
    async (keyword: string) => {
      setSearchKeyword(keyword);

      if (!keyword.trim()) {
        setFilteredQuizzes(quizzes);
        return;
      }

      try {
        const searchResults = await quizStorage.searchQuizzes(keyword);
        setFilteredQuizzes(searchResults);
      } catch (error) {
        console.error("搜索题目失败:", error);
        setFilteredQuizzes([]);
      }
    },
    [quizzes],
  );

  // 打开选择对话框
  const handleOpenDialog = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    loadQuizzes();
  }, [disabled, loadQuizzes]);

  // 关闭对话框
  const handleCloseDialog = useCallback(() => {
    setOpen(false);
    setSearchKeyword("");
    setSelectedQuiz(null);
    setLoadError(null);
  }, []);

  // 选择题目
  const handleSelectQuiz = useCallback((quiz: Quiz) => {
    setSelectedQuiz(quiz);
  }, []);

  // 确认选择
  const handleConfirmSelection = useCallback(() => {
    if (selectedQuiz) {
      onChange(selectedQuiz.id);
      handleCloseDialog();
    }
  }, [selectedQuiz, onChange, handleCloseDialog]);

  // 根据value获取当前选中的题目信息
  useEffect(() => {
    if (value && quizzes.length > 0) {
      const currentQuiz = quizzes.find((q) => q.id === value);
      if (currentQuiz) {
        setSelectedQuiz(currentQuiz);
      }
    }
  }, [value, quizzes]);

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  // 截取描述文本
  const truncateDescription = (text: string, maxLength: number = 100) => {
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // 获取当前选中题目的显示信息
  const getCurrentQuizDisplay = () => {
    if (!value) return null;

    const currentQuiz = quizzes.find((q) => q.id === value);
    if (!currentQuiz) return null;

    return {
      name: currentQuiz.name,
      description: truncateDescription(currentQuiz.description, 50),
      createdAt: formatDate(currentQuiz.createdAt),
    };
  };

  const currentDisplay = getCurrentQuizDisplay();

  return (
    <Box>
      {/* 选择按钮和当前选择显示 */}
      <Button
        variant="outlined"
        onClick={handleOpenDialog}
        disabled={disabled}
        startIcon={<QuizIcon />}
        sx={{
          width: "100%",
          justifyContent: "flex-start",
          textAlign: "left",
          py: 1.5,
          px: 2,
          color: currentDisplay
            ? "var(--primary-text)"
            : "var(--secondary-text)",
        }}
      >
        {currentDisplay ? (
          <Box sx={{ width: "100%" }}>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {currentDisplay.name}
            </Typography>
            <Typography variant="caption">
              {currentDisplay.description}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2">{placeholder}</Typography>
        )}
      </Button>

      {/* 错误提示 */}
      {error && (
        <Typography
          variant="caption"
          color="error"
          sx={{ mt: 0.5, display: "block" }}
        >
          {error}
        </Typography>
      )}

      {/* 选择对话框 */}
      <Dialog
        open={open}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { height: "70vh", backgroundColor: "var(--card-bg)" },
        }}
      >
        <DialogTitle>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <QuizIcon />
            <Typography variant="h6">选择题目</Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {/* 搜索框 */}
          <TextField
            fullWidth
            placeholder="搜索题目名称或描述..."
            value={searchKeyword}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchKeyword && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleSearch("")}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, color: "var(--secondary-text)" }}
          />

          {/* 加载状态 */}
          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          )}

          {/* 错误提示 */}
          {loadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {loadError}
            </Alert>
          )}

          {/* 题目列表 */}
          {!loading && !loadError && (
            <>
              {filteredQuizzes.length === 0 ? (
                <Box sx={{ textAlign: "center", py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    {searchKeyword ? "未找到匹配的题目" : "暂无可用题目"}
                  </Typography>
                  {!searchKeyword && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    >
                      请先在"出题模式"中生成一些题目
                    </Typography>
                  )}
                </Box>
              ) : (
                <List sx={{ width: "100%" }}>
                  {filteredQuizzes.map((quiz, index) => (
                    <React.Fragment key={quiz.id}>
                      <ListItem disablePadding>
                        <ListItemButton
                          selected={selectedQuiz?.id === quiz.id}
                          onClick={() => handleSelectQuiz(quiz)}
                          sx={{
                            flexDirection: "column",
                            alignItems: "flex-start",
                            py: 2,
                          }}
                        >
                          <Box sx={{ width: "100%", mb: 1 }}>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mb: 0.5,
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                color="var(--secondary-text)"
                                sx={{ fontWeight: 600 }}
                              >
                                {quiz.name}
                              </Typography>
                              <Chip
                                icon={<DateIcon />}
                                label={formatDate(quiz.createdAt)}
                                size="small"
                                variant="outlined"
                              />
                            </Box>
                            <Typography
                              variant="body2"
                              color="var(--secondary-text)"
                              sx={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                                lineHeight: 1.4,
                              }}
                            >
                              {JSON.parse(quiz.description).description}
                            </Typography>
                          </Box>
                        </ListItemButton>
                      </ListItem>
                      {index < filteredQuizzes.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
          <Button
            onClick={handleConfirmSelection}
            variant="contained"
            disabled={!selectedQuiz}
          >
            确认选择
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizSelector;
