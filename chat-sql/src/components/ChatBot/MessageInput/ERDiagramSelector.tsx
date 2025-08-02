// ER图选择器组件 - 支持从历史记录选择ER图数据

import React, { useState, useCallback } from "react";
import {
  Box,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Chip,
  Stack,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  History as HistoryIcon,
  Visibility as PreviewIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { ERDiagramData } from "@/types/ERDiagramTypes/erDiagram";
import { erDiagramStorage } from "@/services/erDiagramStorage";
import { formatTimestamp } from "@/utils/chatbot/storage";
import { useERDiagramContext } from "@/contexts/ERDiagramContext";
import { useSnackbar } from "@/contexts/SnackbarContext";

interface ERDiagramSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface DiagramHistoryItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  data: ERDiagramData;
}

const ERDiagramSelector: React.FC<ERDiagramSelectorProps> = ({
  value,
  onChange,
  placeholder = "粘贴ER图JSON数据或从历史记录选择",
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [diagrams, setDiagrams] = useState<DiagramHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    data: ERDiagramData | null;
  }>({ open: false, data: null });

  // 用于在选择自己的会话前“预览”——直接切换id
  const { loadDiagram } = useERDiagramContext();

  const { showSnackbar } = useSnackbar();

  // 从IndexedDB加载ER图历史记录
  const loadDiagrams = useCallback(async () => {
    try {
      setLoading(true);
      const diagramMetadataList = await erDiagramStorage.listDiagrams();
      const historyItems: DiagramHistoryItem[] = [];

      // 为每个元数据加载完整的图表数据
      for (const metadata of diagramMetadataList) {
        try {
          const storedDiagram = await erDiagramStorage.loadDiagram(metadata.id);
          historyItems.push({
            id: metadata.id,
            name: metadata.name,
            createdAt: metadata.createdAt,
            updatedAt: metadata.updatedAt,
            data: storedDiagram.data,
          });
        } catch (error) {
          console.warn(`Failed to load diagram ${metadata.id}:`, error);
        }
      }

      // 按更新时间倒序排列
      historyItems.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );

      setDiagrams(historyItems);
      setDialogOpen(true);
    } catch (error) {
      console.error("加载ER图历史记录失败:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 选择ER图
  const handleSelectDiagram = useCallback(
    (diagram: DiagramHistoryItem) => {
      const jsonData = JSON.stringify(diagram.data, null, 2);
      onChange(jsonData);
      setDialogOpen(false);
    },
    [onChange],
  );

  // 切换ER图
  const handlePreviewDiagram = useCallback(
    (diagram: DiagramHistoryItem) => {
      loadDiagram(diagram.id);
      showSnackbar(`已将当前ER图切换到 ${diagram.name}`, "info");
      setDialogOpen(false);
    },
    [loadDiagram, showSnackbar],
  );

  // 关闭预览
  const handleClosePreview = useCallback(() => {
    setPreviewDialog({ open: false, data: null });
  }, []);

  // 关闭选择对话框
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  // 统计实体和关系数量
  const getStatistics = useCallback((data: ERDiagramData) => {
    return {
      entities: data.entities?.length || 0,
      relationships: data.relationships?.length || 0,
    };
  }, []);

  return (
    <Box>
      <TextField
        multiline
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        fullWidth
        variant="outlined"
        sx={{
          "& .MuiInputBase-input": {
            fontSize: "0.85em",
            fontFamily: "monospace",
          },
        }}
      />

      <Box sx={{ mt: 1, display: "flex", justifyContent: "flex-end" }}>
        <Button
          onClick={loadDiagrams}
          startIcon={<HistoryIcon />}
          disabled={loading}
          size="small"
          variant="outlined"
        >
          {loading ? "加载中..." : "从历史记录选择"}
        </Button>
      </Box>

      {/* 历史记录选择对话框 */}
      <Dialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: { sx: { height: "70vh" } },
        }}
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">选择ER图</Typography>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers>
          {diagrams.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              暂无ER图历史记录
            </Typography>
          ) : (
            <List>
              {diagrams.map((diagram) => {
                const stats = getStatistics(diagram.data);
                return (
                  <ListItem
                    key={diagram.id}
                    disablePadding
                    sx={{
                      border: "1px solid var(--card-border)",
                      borderRadius: 1,
                      mb: 1,
                      "&:hover": {
                        backgroundColor: "var(--hover-bg)",
                      },
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleSelectDiagram(diagram)}
                      sx={{ flex: 1 }}
                    >
                      <ListItemText
                        primary={
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                          >
                            <Typography variant="subtitle2">
                              {diagram.name}
                            </Typography>
                            <Chip
                              label={`${stats.entities}个实体`}
                              size="small"
                              variant="outlined"
                            />
                            <Chip
                              label={`${stats.relationships}个关系`}
                              size="small"
                              variant="outlined"
                            />
                          </Stack>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            创建时间: {formatTimestamp(diagram.createdAt)} |
                            更新时间: {formatTimestamp(diagram.updatedAt)}
                          </Typography>
                        }
                      />
                    </ListItemButton>

                    <Tooltip title="预览">
                      <IconButton
                        onClick={() => handlePreviewDiagram(diagram)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <PreviewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog}>取消</Button>
        </DialogActions>
      </Dialog>

      {/* 预览对话框已移除 */}
    </Box>
  );
};

export default ERDiagramSelector;
