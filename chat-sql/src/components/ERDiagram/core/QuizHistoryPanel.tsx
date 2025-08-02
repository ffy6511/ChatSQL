// Quiz历史管理面板组件
import React, { useState, useEffect, useCallback } from "react";
import { useSnackbar } from "@/contexts/SnackbarContext";
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Stack,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Quiz as QuizIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  CalendarToday as DateIcon,
  Description as DescriptionIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  DeleteSweep as DeleteSweepIcon,
  School as SchoolIcon,
} from "@mui/icons-material";
import { Quiz, QuizHistoryPanelProps } from "@/types/ERDiagramTypes/quiz";
import { quizStorage } from "@/services/quizStorage";
import { useERDiagramContext } from "@/contexts/ERDiagramContext";
import styles from "./QuizHistoryPanel.module.css";
import { tutorialQuizzes, getTutorialQuizIds } from "@/data/tutorialQuizzes";

/**
 * Quiz历史管理面板组件
 * 显示已保存题目的列表，支持删除、修改名称、查看答案等功能
 */
const QuizHistoryPanel: React.FC<QuizHistoryPanelProps> = ({
  onQuizSelect,
  onQuizDelete,
  onQuizUpdate,
}) => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [expandedQuizzes, setExpandedQuizzes] = useState<Set<string>>(
    new Set(),
  );
  const [loadingTutorial, setLoadingTutorial] = useState(false);

  const { setDiagramData } = useERDiagramContext();
  const { showSnackbar } = useSnackbar();

  // 切换单个题目的展开状态
  const toggleExpand = useCallback((quizId: string) => {
    setExpandedQuizzes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(quizId)) {
        newSet.delete(quizId);
      } else {
        newSet.add(quizId);
      }
      return newSet;
    });
  }, []);

  // 全部展开/收起
  const handleToggleAll = useCallback(() => {
    const allQuizIds = quizzes.map((q) => q.id);
    const allCurrentlyExpanded = allQuizIds.every((id) =>
      expandedQuizzes.has(id),
    );

    if (allCurrentlyExpanded) {
      // 全部收起
      setExpandedQuizzes(new Set());
    } else {
      // 全部展开
      setExpandedQuizzes(new Set(allQuizIds));
    }
  }, [quizzes, expandedQuizzes]);

  // 加载题目列表
  const loadQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allQuizzes = await quizStorage.getAllQuizzes();
      setQuizzes(allQuizzes);
    } catch (err) {
      console.error("加载题目失败:", err);
      setError("加载题目失败，请重试");
    } finally {
      setLoading(false);
    }
  }, []);

  // 打开删除全部确认对话框
  const handleDeleteAllOpen = useCallback(() => {
    // 判断是否存在题目
    if (quizzes.length === 0) {
      showSnackbar("没有可删除的题目", "info");
      return;
    }

    setDeleteAllDialogOpen(true);
  }, [quizzes, showSnackbar]);

  // 关闭删除全部确认对话框
  const handleDeleteAllClose = useCallback(() => {
    setDeleteAllDialogOpen(false);
  }, []);

  // 删除全部记录的函数
  const handleDeleteAllConfirm = useCallback(async () => {
    try {
      await quizStorage.deleteAllQuizzes();
      await loadQuizzes();
      setExpandedQuizzes(new Set());
      setDeleteAllDialogOpen(false);
      showSnackbar("删除全部记录成功", "success");
    } catch (error) {
      console.error("删除全部记录失败:", error);
      setError("删除全部记录失败，请重试");
    }
  }, [loadQuizzes]);

  // 填充教程数据
  const handleFillTutorialData = useCallback(async () => {
    try {
      setLoadingTutorial(true);

      // 1. 获取所有已存在的题目，并提取出它们的教程ID
      const existingQuizzes = await quizStorage.getAllQuizzes();
      const existingTutorialIds = new Set(
        existingQuizzes.map((q) => q.id).filter(Boolean),
      );

      // 2. 找出尚未被添加的教程
      const missingTutorials = tutorialQuizzes.filter(
        (tutorial) => !existingTutorialIds.has(tutorial.id),
      );

      // 3. 如果没有缺失的教程，则提示用户并退出
      if (missingTutorials.length === 0) {
        showSnackbar("所有教程数据均已存在", "info");
        return;
      }

      // 4. 只添加缺失的教程
      let successCount = 0;
      for (const tutorialQuiz of missingTutorials) {
        try {
          const quizInput = {
            tutorialID: tutorialQuiz.id,
            name: tutorialQuiz.name,
            description: tutorialQuiz.description,
            referenceAnswer: tutorialQuiz.referenceAnswer,
          };
          await quizStorage.addQuiz(quizInput);
          successCount++;
        } catch (error) {
          console.error(`创建教程 ${tutorialQuiz.name} 失败:`, error);
        }
      }

      // 5. 根据结果给出反馈
      if (successCount > 0) {
        await loadQuizzes();
        showSnackbar(`成功补充 ${successCount} 个教程题目`, "success");
      } else {
        showSnackbar("补充教程数据失败，请重试", "error");
      }
    } catch (error) {
      console.error("填充教程数据失败:", error);
      setError("填充教程数据失败，请重试");
    } finally {
      setLoadingTutorial(false);
    }
  }, [loadQuizzes, showSnackbar]);

  // 组件挂载时加载题目
  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  // 打开菜单
  const handleMenuOpen = useCallback(
    (event: React.MouseEvent<HTMLElement>, quiz: Quiz) => {
      event.stopPropagation();
      setAnchorEl(event.currentTarget);
      setSelectedQuiz(quiz);
    },
    [],
  );

  // 关闭菜单
  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
    // We don't reset selectedQuiz here immediately,
    // as dialogs might need it.
  }, []);

  // 打开编辑对话框
  const handleEditOpen = useCallback(() => {
    if (selectedQuiz) {
      setEditName(selectedQuiz.name);
      setEditDialogOpen(true);
    }
    setAnchorEl(null); // Close menu
  }, [selectedQuiz]);

  // 关闭编辑对话框
  const handleEditClose = useCallback(() => {
    setEditDialogOpen(false);
    setEditName("");
    setSelectedQuiz(null); // Clean up selection
  }, []);

  // 确认编辑
  const handleEditConfirm = useCallback(async () => {
    if (!selectedQuiz || !editName.trim()) return;

    try {
      await quizStorage.updateQuiz(selectedQuiz.id, { name: editName.trim() });
      await loadQuizzes(); // 重新加载列表
      onQuizUpdate?.(selectedQuiz.id, { name: editName.trim() });
      handleEditClose();
      showSnackbar("修改题目名称成功", "success");
    } catch (err) {
      console.error("更新题目失败:", err);
      setError("更新题目失败，请重试");
    }
  }, [
    selectedQuiz,
    editName,
    loadQuizzes,
    onQuizUpdate,
    handleEditClose,
    showSnackbar,
  ]);

  // 打开删除确认对话框
  const handleDeleteOpen = useCallback(() => {
    setDeleteDialogOpen(true);
    setAnchorEl(null); // Close menu
  }, []);

  // 关闭删除确认对话框
  const handleDeleteClose = useCallback(() => {
    setDeleteDialogOpen(false);
    setSelectedQuiz(null); // Clean up selection
  }, []);

  // 确认删除
  const handleDeleteConfirm = useCallback(async () => {
    if (!selectedQuiz) {
      showSnackbar("未选中要删除的题目", "info");
      return;
    }
    console.log("删除题目:", selectedQuiz.id);

    try {
      await quizStorage.deleteQuiz(selectedQuiz.id);
      await loadQuizzes(); // 重新加载列表
      onQuizDelete?.(selectedQuiz.id);
      handleDeleteClose();
      showSnackbar("删除题目成功", "success");
    } catch (err) {
      console.error("删除题目失败:", err);
      setError("删除题目失败，请重试");
    }
  }, [
    selectedQuiz,
    loadQuizzes,
    onQuizDelete,
    handleDeleteClose,
    showSnackbar,
  ]);

  // 查看答案ER图
  const handleViewAnswer = useCallback(() => {
    if (selectedQuiz) {
      setDiagramData(selectedQuiz.referenceAnswer);
      onQuizSelect?.(selectedQuiz);
    }
    setAnchorEl(null); // Close menu
    setSelectedQuiz(null); // Clean up selection
  }, [selectedQuiz, setDiagramData, onQuizSelect]);

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 头部标题 */}
      <Box sx={{ p: 0, borderBottom: "1px solid var(--card-border)" }}>
        <Stack direction="row" alignItems="center" spacing={1} display="flex">
          <QuizIcon sx={{ color: "var(--secondary-text)" }} />
          <Typography variant="h6" sx={{ color: "var(--primary-text)" }}>
            题目历史
          </Typography>
          <Chip
            label={quizzes.length}
            size="small"
            sx={{
              backgroundColor: "var(--hover-bg)",
              color: "var(--secondary-text)",
            }}
          />

          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "flex-end",
              gap: 0.5,
            }}
          >
            <Tooltip title="填充教程数据">
              <Button
                className={styles.tutorialButton}
                size="small"
                onClick={handleFillTutorialData}
                startIcon={<SchoolIcon />}
                disabled={loadingTutorial}
              >
                {loadingTutorial ? "创建中..." : "教程"}
              </Button>
            </Tooltip>

            <Tooltip
              title={
                expandedQuizzes.size === quizzes.length
                  ? "全部收起"
                  : "全部展开"
              }
            >
              <Button
                className={styles.expandButton}
                size="small"
                onClick={handleToggleAll}
                startIcon={
                  expandedQuizzes.size === quizzes.length ? (
                    <ExpandLessIcon />
                  ) : (
                    <ExpandMoreIcon />
                  )
                }
                sx={{
                  cursor: quizzes.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                {expandedQuizzes.size === quizzes.length ? "收起" : "展开"}
              </Button>
            </Tooltip>

            <Tooltip title="删除全部记录">
              <Button
                className={styles.deleteAllButton}
                size="small"
                onClick={handleDeleteAllOpen}
                startIcon={<DeleteSweepIcon />}
                sx={{
                  cursor: quizzes.length === 0 ? "not-allowed" : "pointer",
                }}
              >
                清空
              </Button>
            </Tooltip>
          </Box>
        </Stack>
      </Box>

      {/* 内容区域 */}
      <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
        {/* 加载状态 */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {/* 错误提示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 题目列表 */}
        {!loading && !error && (
          <>
            {quizzes.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 4 }}>
                <QuizIcon
                  sx={{ fontSize: 48, color: "var(--secondary-text)", mb: 2 }}
                />
                <Typography variant="body2" color="var(--secondary-text)">
                  暂无题目历史
                </Typography>
                <Typography
                  variant="caption"
                  color="var(--secondary-text)"
                  sx={{ mt: 1, display: "block" }}
                >
                  请在智能助手中生成一些题目
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1}>
                {quizzes.map((quiz) => {
                  const isExpanded = expandedQuizzes.has(quiz.id);
                  return (
                    <Card
                      key={quiz.id}
                      onClick={() => toggleExpand(quiz.id)}
                      sx={{
                        backgroundColor: "var(--card-bg)",
                        border: "1px solid var(--card-border)",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "var(--hover-bg)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: 1,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            {/* 题目名称 */}
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                color: "var(--primary-text)",
                                mb: 0.5,
                                wordBreak: "break-word",
                              }}
                            >
                              {quiz.name}
                            </Typography>

                            {/* 创建时间 */}
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={0.5}
                              sx={{ mb: 1 }}
                            >
                              <DateIcon
                                sx={{
                                  fontSize: 14,
                                  color: "var(--secondary-text)",
                                }}
                              />
                              <Typography
                                variant="caption"
                                color="var(--secondary-text)"
                              >
                                {formatDate(quiz.createdAt)}
                              </Typography>
                            </Stack>

                            {/* 题目描述 */}
                            <Stack
                              direction="row"
                              alignItems="flex-start"
                              spacing={0.5}
                            >
                              <DescriptionIcon
                                sx={{
                                  fontSize: 14,
                                  color: "var(--secondary-text)",
                                  mt: 0.2,
                                }}
                              />
                              <Box
                                className={`${styles.expandContainer} ${isExpanded ? styles.expanded : styles.collapsed}`}
                                sx={{ flex: 1 }}
                              >
                                <Typography
                                  variant="body2"
                                  color={
                                    isExpanded
                                      ? "var(--primary-text)"
                                      : "var(--secondary-text)"
                                  }
                                  sx={{
                                    lineHeight: 1.4,
                                    wordBreak: "break-word",
                                    display: "-webkit-box",
                                    WebkitLineClamp: isExpanded ? "unset" : 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    textOverflow: isExpanded
                                      ? "unset"
                                      : "ellipsis",
                                  }}
                                >
                                  {/* 取出字段内部的内容显示 */}
                                  {JSON.parse(quiz.description).description}
                                </Typography>
                              </Box>
                            </Stack>
                          </Box>

                          {/* 操作按钮 */}
                          <IconButton
                            size="small"
                            onClick={(e) => handleMenuOpen(e, quiz)}
                            sx={{
                              color: "var(--secondary-text)",
                              "&:hover": {
                                backgroundColor: "var(--hover-bg)",
                              },
                            }}
                          >
                            <MoreVertIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>
            )}
          </>
        )}
      </Box>

      {/* 操作菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              ".MuiMenu-list": {
                color: "var(--primary-text)",
              },
            },
          },
        }}
      >
        <MenuItem onClick={handleViewAnswer}>
          <VisibilityIcon sx={{ mr: 1, fontSize: 18 }} />
          查看答案ER图
        </MenuItem>
        <MenuItem onClick={handleEditOpen}>
          <EditIcon sx={{ mr: 1, fontSize: 18 }} />
          修改名称
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteOpen} sx={{ color: "error.main" }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 18 }} />
          删除题目
        </MenuItem>
      </Menu>

      {/* 编辑名称对话框 */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>修改题目名称</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="题目名称"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            margin="normal"
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>取消</Button>
          <Button
            onClick={handleEditConfirm}
            variant="contained"
            disabled={!editName.trim()}
          >
            确认
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删��确认对话框 */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteClose}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除题目 "{selectedQuiz?.name}" 吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteClose}>取消</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* 删除全部确认对话框 */}
      <Dialog open={deleteAllDialogOpen} onClose={handleDeleteAllClose}>
        <DialogTitle>确认删除全部</DialogTitle>
        <DialogContent>
          <Typography>
            确定要删除全部 {quizzes.length} 个题目吗？此操作不可撤销。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteAllClose}>取消</Button>
          <Button
            onClick={handleDeleteAllConfirm}
            color="error"
            variant="contained"
          >
            删除全部
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QuizHistoryPanel;
