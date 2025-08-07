"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Alert,
  Snackbar,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  School as SchoolIcon,
  Business as BusinessIcon,
  LocalLibrary as LibraryIcon,
  Upload as UploadIcon,
} from "@mui/icons-material";
import { useERDiagramContext } from "@/contexts/ERDiagramContext";
import { useSnackbar } from "@/contexts/SnackbarContext";
import { visualizationService } from "@/services/visualizationService";
import {
  sampleERData,
  employeeDepartmentERData,
  weakEntityERData,
  ERDiagramData,
} from "@/types/ERDiagramTypes/erDiagram";

interface NewDiagramModalProps {
  open: boolean;
  onClose: () => void;
}

// 预设模板
const templates = [
  {
    id: "blank",
    name: "空白图表",
    description: "从空白画布开始创建ER图",
    icon: <AddIcon />,
    data: null,
  },
  {
    id: "sample",
    name: "学生选课系统示例",
    description: "包含学生、教师、授课实体集的ER图",
    icon: <LibraryIcon />,
    data: sampleERData,
  },
  {
    id: "employee",
    name: "员工部门项目示例",
    description: "展示员工、部门、项目关系的企业ER图",
    icon: <BusinessIcon />,
    data: employeeDepartmentERData,
  },
  {
    id: "weak_entity",
    name: "弱实体集示例",
    description: "展示弱实体集和双边框渲染的ER图",
    icon: <SchoolIcon />,
    data: weakEntityERData,
  },
];

const NewDiagramModal: React.FC<NewDiagramModalProps> = ({ open, onClose }) => {
  const router = useRouter();
  const { createNewDiagram, saveDiagram } = useERDiagramContext();
  const { showSnackbar } = useSnackbar();
  const [selectedTemplate, setSelectedTemplate] = useState<string>("blank");
  const [diagramName, setDiagramName] = useState<string>("");
  const [diagramDescription, setDiagramDescription] = useState<string>("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  // JSON导入相关状态
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [jsonInput, setJsonInput] = useState<string>("");
  const [isImporting, setIsImporting] = useState(false);

  // 生成时间以自动填充会话名称
  const defaultName = useMemo(
    () => `${new Date().toLocaleString("zh-CN")}`,
    []
  );

  // 简化后的 handleCreate 方法
  const handleCreate = async () => {
    const finalName = diagramName.trim() || defaultName;

    setIsCreating(true);
    setError("");

    try {
      const newId = await createNewDiagram(
        finalName,
        diagramDescription,
        selectedTemplate
      );

      if (router) {
        router.push(`/er-diagram?id=${newId}`);
      } else {
        // 如果没有路由器，使用window.location
        window.location.href = `/er-diagram?id=${newId}`;
      }

      // 显示成功消息
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setDiagramName("");
        setDiagramDescription("");
        setSelectedTemplate("blank");
        setError("");
        onClose();
      }, 500);
    } catch (error) {
      console.error("Failed to create diagram:", error);
      setError(error instanceof Error ? error.message : "创建图表失败，请重试");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating && !isImporting) {
      setShowSuccess(false);
      setDiagramName("");
      setDiagramDescription("");
      setSelectedTemplate("blank");
      setShowJsonImport(false);
      setJsonInput("");
      onClose();
    }
  };

  // JSON导入处理函数
  const handleJsonImport = async () => {
    if (!jsonInput.trim()) {
      setError("请输入JSON数据");
      return;
    }

    setIsImporting(true);
    setError("");

    try {
      // 解析JSON
      const parsedJson = JSON.parse(jsonInput.trim());

      // 验证是否为ER图数据
      if (!visualizationService.isERDiagramData(parsedJson)) {
        throw new Error("输入的JSON不是有效的ER图数据格式");
      }

      // 构建ER图数据
      let erData: ERDiagramData;
      if (parsedJson.entities && parsedJson.relationships) {
        // 符合ER图数据格式
        erData = {
          ...parsedJson,
          metadata: {
            title:
              diagramName.trim() ||
              `导入的ER图 - ${new Date().toLocaleString("zh-CN")}`,
            description: diagramDescription.trim() || "从JSON导入的ER图",
            version: "1.0.0",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            ...parsedJson.metadata,
          },
        };
      } else {
        throw new Error("JSON格式不正确，缺少entities或relationships字段");
      }

      // 保存到IndexedDB
      const savedId = await saveDiagram(erData);

      // 跳转到ER图页面
      if (router) {
        router.push(`/er-diagram?id=${savedId}`);
      } else {
        window.location.href = `/er-diagram?id=${savedId}`;
      }

      showSnackbar("JSON导入成功！", "success");

      // 关闭模态框
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (error) {
      console.error("JSON导入失败:", error);
      if (error instanceof SyntaxError) {
        setError("JSON格式错误，请检查语法");
      } else {
        setError(error instanceof Error ? error.message : "导入失败，请重试");
      }
    } finally {
      setIsImporting(false);
    }
  };

  // 在文本输入框上绑定回车的创建
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      // 组织默认的回车（文本换行）
      event.preventDefault();
      if (!isCreating) {
        handleCreate();
      }
    }
  };

  // 在选中模板的card上绑定回车和空格输入的创建
  const handleTemplateKeyDown = (
    event: React.KeyboardEvent,
    templateId: string
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();

      setSelectedTemplate(templateId);
      handleCreate();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='md' // xs, sm, md, lg, xl
      fullWidth
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Typography>新建ER图</Typography>
        <Typography variant='body2' color='textSecondary' sx={{ mt: 1 }}>
          选择一个模板开始创建您的ER图
        </Typography>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <TextField
            label='图表名称 (可选)'
            value={diagramName}
            onChange={(e) => {
              setDiagramName(e.target.value);
              if (error) setError(""); // 清除错误信息
            }}
            fullWidth
            sx={{ mb: 2 }}
            placeholder={defaultName}
            onKeyDown={handleKeyDown}
          />

          <TextField
            label='图表描述'
            value={diagramDescription}
            onChange={(e) => setDiagramDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            placeholder='图表描述（可选）'
            onKeyDown={handleKeyDown}
          />
        </Box>

        <Box display='flex' alignItems='center' sx={{ mb: 2 }}>
          <Typography variant='h6'>选择模板</Typography>

          <Button
            variant='outlined'
            startIcon={<UploadIcon />}
            onClick={() => setShowJsonImport(true)}
            sx={{ ml: "auto", mr: 2 }}
          >
            从JSON导入
          </Button>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 2,
          }}
        >
          {templates.map((template) => (
            <Card
              key={template.id}
              sx={{
                cursor: "pointer",
                border: selectedTemplate === template.id ? 2 : 1,
                borderColor:
                  selectedTemplate === template.id ? "primary.main" : "divider",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: 2,
                },
                transition: "all 0.2s ease",
              }}
              onClick={() => setSelectedTemplate(template.id)}
              tabIndex={0} // 让card可以被键盘聚焦
              onKeyDown={(e) => handleTemplateKeyDown(e, template.id)}
            >
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <Box sx={{ mr: 1, color: "primary.main" }}>
                    {template.icon}
                  </Box>
                  <Typography variant='h6' component='h3'>
                    {template.name}
                  </Typography>
                </Box>
                <Typography variant='body2' color='textSecondary'>
                  {template.description}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button onClick={handleClose} disabled={isCreating}>
          取消
        </Button>
        <Button
          onClick={handleCreate}
          variant='contained'
          disabled={isCreating}
          startIcon={<AddIcon />}
        >
          {isCreating ? "创建中..." : "创建图表"}
        </Button>
      </DialogActions>

      <Snackbar
        open={showSuccess}
        autoHideDuration={1000}
        onClose={() => setShowSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert severity='success' onClose={() => setShowSuccess(false)}>
          图表创建成功！
        </Alert>
      </Snackbar>

      {/* JSON导入对话框 */}
      <Dialog
        open={showJsonImport}
        onClose={() => !isImporting && setShowJsonImport(false)}
        maxWidth='md'
        fullWidth
        sx={{
          "& .MuiDialog-paper": {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>
          <Typography>从JSON导入ER图</Typography>
          <Typography variant='body2' color='textSecondary' sx={{ mt: 1 }}>
            请粘贴有效的ER图JSON数据
          </Typography>
        </DialogTitle>

        <DialogContent>
          <TextField
            label='JSON数据'
            value={jsonInput}
            onChange={(e) => {
              setJsonInput(e.target.value);
              if (error) setError(""); // 清除错误信息
            }}
            fullWidth
            multiline
            rows={12}
            placeholder='请粘贴ER图的JSON数据，例如：
{
  "entities": [...],
  "relationships": [...],
  "metadata": {...}
}'
            sx={{ mt: 2 }}
            disabled={isImporting}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={() => setShowJsonImport(false)}
            disabled={isImporting}
          >
            取消
          </Button>
          <Button
            onClick={handleJsonImport}
            variant='contained'
            disabled={isImporting || !jsonInput.trim()}
            startIcon={<UploadIcon />}
          >
            {isImporting ? "导入中..." : "导入"}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default NewDiagramModal;
