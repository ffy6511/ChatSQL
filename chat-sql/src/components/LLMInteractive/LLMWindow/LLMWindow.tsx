import React, { useState, useEffect } from "react";
import styles from "./LLMWindow.module.css";
import { message, Spin } from "antd";
import {
  SendOutlined,
  CheckOutlined,
  TagOutlined,
  BarChartOutlined,
  NumberOutlined,
  RobotOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { useLLMContext } from "@/contexts/LLMContext";
import LLMResultView from "@/lib/codingLib/LLMResultView";
import { useSimpleStorage } from "@/hooks/useRecords";
import { DifyResponse } from "@/types/CodingTypes/dify";
import {
  Typography,
  TextField,
  Button,
  Popover,
  Chip,
  Box,
  Paper,
  IconButton,
} from "@mui/material";
import { useEditorContext } from "@/contexts/EditorContext";
import ShinyText from "@/components/common/ShinyText";
import { useTagsManager } from "@/hooks/useTagsManager";

const difficultyOptions = [
  { label: "简单", value: "simple" },
  { label: "中等", value: "medium" },
  { label: "困难", value: "hard" },
];

const LLMWindow: React.FC = () => {
  const { setShowLLMWindow, setLLMResult, setCurrentProblemId } =
    useLLMContext();
  const { clearEditor } = useEditorContext();
  const { tags, addTag, deleteTag } = useTagsManager();

  const [checkedTags, setCheckedTags] = useState<string[]>([]);
  const [declare, setDeclare] = useState("");
  const [difficulty, setDifficulty] = useState("simple");
  const [problemCnt, setProblemCnt] = useState(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { storeProblem, isSaving } = useSimpleStorage();

  // 弹出框状态
  const [tagsAnchorEl, setTagsAnchorEl] = useState<null | HTMLElement>(null);
  const [difficultyAnchorEl, setDifficultyAnchorEl] =
    useState<null | HTMLElement>(null);
  const [countAnchorEl, setCountAnchorEl] = useState<null | HTMLElement>(null);

  // 添加新状态用于管理新标签输入
  const [newTagInput, setNewTagInput] = useState("");

  useEffect(() => {
    if (result?.data?.outputs) {
      console.log("LLM Response received:", {
        tableStructure: result.data.outputs.tableStructure,
        tuples: result.data.outputs.tuples,
      });
    }
  }, [result]);

  const handleTagCheck = (tag: string, checked: boolean) => {
    setCheckedTags(
      checked ? [...checkedTags, tag] : checkedTags.filter((t) => t !== tag),
    );
  };

  // 发送请求
  const handleSubmit = async () => {
    if (!declare.trim()) {
      message.warning("请填写题目描述");
      return;
    }
    setLoading(true);

    const requestBody = {
      inputs: {
        tags: checkedTags.join(","),
        declare,
        difficulty,
        count: problemCnt,
      },
      response_mode: "blocking",
      user: "abc-123",
    };

    try {
      const response = await fetch("https://api.dify.ai/v1/workflows/run", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_DIFY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) throw new Error("请求失败！");

      const data = (await response.json()) as DifyResponse;
      setResult(data);
      message.success("LLM返回成功，请确认。");
    } catch (err) {
      message.error("提交失败，请重试！");
    } finally {
      setLoading(false);
    }
  };

  // 确认按钮
  const handleConfirm = async () => {
    console.log("Confirming...", result);
    if (!result?.data?.outputs) {
      message.error("没有有效的结果数据");
      return;
    }

    try {
      // 直接保存整个outputs对象到IndexedDB
      const savedId = await storeProblem(result.data.outputs);

      setCurrentProblemId(savedId);
      clearEditor();

      // 更新上下文并关闭窗口
      console.log("Setting context...", { result, savedId });
      setLLMResult(result);
      setShowLLMWindow(false);
      console.log("Context updated");
    } catch (error) {
      console.error("Error:", error);
      console.error("保存问题失败:", error);
      message.error("保存失败");
    }
  };

  // 打开/关闭弹出框
  const handleTagsClick = (event: React.MouseEvent<HTMLElement>) => {
    setTagsAnchorEl(event.currentTarget);
  };

  const handleDifficultyClick = (event: React.MouseEvent<HTMLElement>) => {
    setDifficultyAnchorEl(event.currentTarget);
  };

  const handleCountClick = (event: React.MouseEvent<HTMLElement>) => {
    setCountAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setTagsAnchorEl(null);
    setDifficultyAnchorEl(null);
    setCountAnchorEl(null);
  };

  // 添加新标签
  const handleAddTag = () => {
    if (newTagInput.trim()) {
      addTag(newTagInput.trim());
      setNewTagInput("");
    }
  };

  return (
    <div className={`${styles.container} ${styles.globalStylesContainer}`}>
      <div
        className={`${styles.windowContainer} ${
          result ? styles.withResult : ""
        }`}
      >
        <div
          className={`${styles.contentWrapper} ${
            result ? styles.withResultContent : ""
          }`}
        >
          {/* 顶部标题区域 */}
          <div className={styles.headerArea}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: "normal",
                textAlign: "center",
                flex: 1,
                color: "var(-secondary-text)",
              }}
            >
              {loading ? (
                <ShinyText text="正在生成有趣的应用..." speed={3} />
              ) : (
                "今天希望练习什么内容？"
              )}
            </Typography>
          </div>

          {/* 结果展示区域 - 有结果时显示 */}
          {result && (
            <div className={styles.resultArea}>
              <Paper
                className={styles.chatBubble}
                elevation={3}
                sx={{
                  backgroundColor: "var(--card-bg)",
                  color: "var(--primary-text)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "16px",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
                }}
              >
                <div className={styles.resultHeader}>
                  <Typography
                    variant="h6"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      color: "var(--primary-text)",
                      fontWeight: 600,
                    }}
                  >
                    <RobotOutlined
                      style={{
                        marginRight: "12px",
                        color: "var(--link-color)",
                      }}
                    />
                    这个问题如何?
                  </Typography>

                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={handleConfirm}
                    disabled={isSaving}
                    startIcon={<CheckOutlined />}
                    sx={{
                      borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                      padding: "6px 16px",
                      "&.Mui-disabled": {
                        backgroundColor: "var(--button-hover)",
                        color: "var(--tertiary-text)",
                      },
                    }}
                  >
                    确认并保存
                  </Button>
                </div>

                {result?.data?.outputs && (
                  <div
                    style={{
                      backgroundColor: "var(--card-bg)",
                      borderRadius: "12px",
                      padding: "16px",
                      color: "var(--primary-text)",
                    }}
                  >
                    <LLMResultView outputs={result.data.outputs} />
                  </div>
                )}
              </Paper>
            </div>
          )}

          {/* 输入区域 - 始终显示 */}
          <div
            className={`${styles.inputArea} ${
              result ? styles.inputAreaWithResult : ""
            }`}
          >
            {/* 输入框区域 */}
            <div className={styles.textAreaWrapper}>
              <TextField
                placeholder="您的任务描述"
                value={declare}
                onChange={(e) => setDeclare(e.target.value)}
                multiline
                minRows={3}
                maxRows={6}
                fullWidth
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "24px",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--primary-text)",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.1)",
                    "& fieldset": {
                      borderColor: "transparent", // 移除边框
                    },
                    "&:hover fieldset": {
                      borderColor: "transparent", // 悬浮时不改变边框颜色
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: "transparent", // 选中时不改变边框颜色
                    },
                  },
                  "& .MuiInputBase-input::placeholder": {
                    color: "var(--tertiary-text)",
                    opacity: 1,
                  },
                  marginBottom: "20px",
                  position: "relative", // 确保相对定位
                }}
              />

              <div className={styles.actionButtonContainer}>
                <IconButton
                  color="primary"
                  onClick={handleSubmit}
                  disabled={loading}
                  sx={{
                    backgroundColor: "var(--link-color)",
                    fontSize: "1.2em",
                    color: "white",
                    position: "absolute", // 绝对定位
                    right: "8px", // 右侧距离
                    bottom: "8px", // 底部距离
                    "&:hover": {
                      backgroundColor: "var(--link-hover)",
                    },
                  }}
                >
                  <SendOutlined />
                </IconButton>
              </div>
            </div>

            <div className={styles.buttonGroup}>
              {/* 标签按钮 */}
              <Button
                variant="outlined"
                onClick={handleTagsClick}
                startIcon={<TagOutlined />}
                sx={{
                  borderRadius: "20px",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--primary-text)",
                  borderColor: "var(--card-border)",
                  "&:hover": {
                    backgroundColor: "var(--button-hover)",
                    borderColor: "var(--card-border)", // 悬浮时不改变边框颜色
                  },
                }}
              >
                {checkedTags.length > 0
                  ? `${checkedTags.length}个标签`
                  : "标签"}
              </Button>

              {/* 难度按钮 */}
              <Button
                variant="outlined"
                onClick={handleDifficultyClick}
                startIcon={<BarChartOutlined />}
                sx={{
                  borderRadius: "20px",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--primary-text)",
                  borderColor: "var(--card-border)",
                  "&:hover": {
                    backgroundColor: "var(--button-hover)",
                    borderColor: "var(--card-border)", // 悬浮时不改变边框颜色
                  },
                }}
              >
                {difficultyOptions.find((opt) => opt.value === difficulty)
                  ?.label || "难度"}
              </Button>

              {/* 数量按钮 */}
              <Button
                variant="outlined"
                onClick={handleCountClick}
                startIcon={<NumberOutlined />}
                sx={{
                  borderRadius: "20px",
                  backgroundColor: "var(--card-bg)",
                  color: "var(--primary-text)",
                  borderColor: "var(--card-border)",
                  "&:hover": {
                    backgroundColor: "var(--button-hover)",
                    borderColor: "var(--card-border)", // 悬浮时不改变边框颜色
                  },
                }}
              >
                {problemCnt}题
              </Button>
            </div>

            {/* 标签弹出框 */}
            <Popover
              open={Boolean(tagsAnchorEl)}
              anchorEl={tagsAnchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
              PaperProps={{
                sx: {
                  backgroundColor: "var(--card-bg)",
                  color: "var(--primary-text)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "12px",
                  padding: "16px",
                  width: "300px",
                },
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}
              >
                选择标签
              </Typography>

              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "6px",
                  justifyContent: "center",
                  mb: 2,
                }}
              >
                {Object.entries(tags).map(([tag, color]) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() =>
                      handleTagCheck(tag, !checkedTags.includes(tag))
                    }
                    onDelete={() => deleteTag(tag)}
                    color={checkedTags.includes(tag) ? "primary" : "default"}
                    sx={{
                      backgroundColor: checkedTags.includes(tag)
                        ? color
                        : "var(--card-bg)",
                      color: checkedTags.includes(tag)
                        ? "white"
                        : "var(--primary-text)",
                      borderColor: "var(--card-border)",
                      "&:hover": {
                        backgroundColor: checkedTags.includes(tag)
                          ? color
                          : "var(--button-hover)",
                      },
                    }}
                  />
                ))}
              </Box>

              <Box
                sx={{
                  display: "flex",
                  gap: "8px",
                  borderTop: "1px solid var(--card-border)",
                  paddingTop: "16px",
                }}
              >
                <TextField
                  placeholder="输入新标签"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                  size="small"
                  fullWidth
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      "& fieldset": {
                        borderColor: "var(--input-border)",
                      },
                    },
                    "& .MuiInputBase-input::placeholder": {
                      color: "var(--secondary-text)",
                      opacity: 1,
                    },
                  }}
                />
                <Button
                  variant="contained"
                  onClick={handleAddTag}
                  disabled={!newTagInput.trim()}
                >
                  添加
                </Button>
              </Box>
            </Popover>

            {/* 难度弹出框 */}
            <Popover
              open={Boolean(difficultyAnchorEl)}
              anchorEl={difficultyAnchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
              PaperProps={{
                sx: {
                  backgroundColor: "var(--card-bg)",
                  color: "var(--primary-text)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "12px",
                  padding: "16px",
                  width: "200px",
                },
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}
              >
                选择难度
              </Typography>
              <Box
                sx={{ display: "flex", flexDirection: "column", gap: "8px" }}
              >
                {difficultyOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    onClick={() => {
                      setDifficulty(opt.value);
                      handleClose();
                    }}
                    variant={
                      difficulty === opt.value ? "contained" : "outlined"
                    }
                    fullWidth
                  >
                    {opt.label}
                  </Button>
                ))}
              </Box>
            </Popover>

            {/* 数量弹出框 */}
            <Popover
              open={Boolean(countAnchorEl)}
              anchorEl={countAnchorEl}
              onClose={handleClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "center",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "center",
              }}
              PaperProps={{
                sx: {
                  backgroundColor: "var(--card-bg)",
                  color: "var(--primary-text)",
                  border: "1px solid var(--card-border)",
                  borderRadius: "12px",
                  padding: "16px",
                  width: "250px",
                },
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: "bold", textAlign: "center", mb: 2 }}
              >
                选择题目数量
              </Typography>
              <Box sx={{ padding: "0 16px" }}>
                <TextField
                  type="number"
                  value={problemCnt}
                  onChange={(e) => setProblemCnt(Number(e.target.value))}
                  inputProps={{ min: 1, max: 10 }}
                  fullWidth
                  sx={{
                    mb: 1.5,
                    "& .MuiOutlinedInput-root": {
                      backgroundColor: "var(--input-bg)",
                      color: "var(--input-text)",
                      "& fieldset": {
                        borderColor: "var(--input-border)",
                      },
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: "var(--secondary-text)",
                    display: "block",
                    textAlign: "center",
                  }}
                >
                  范围: 1-10 题
                </Typography>
              </Box>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMWindow;
