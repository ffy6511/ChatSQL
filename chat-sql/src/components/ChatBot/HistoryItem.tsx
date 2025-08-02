import React, { useState } from "react";
import {
  ListItem,
  ListItemButton,
  Typography,
  Box,
  IconButton,
  TextField,
  Menu,
  MenuItem,
  Badge,
} from "@mui/material";
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from "@mui/icons-material";
import { ChatHistory } from "@/types/chatBotTypes/chatbot";

interface HistoryItemProps {
  history: ChatHistory;
  isSelected: boolean;
  onLoad: (historyId: string) => void;
  onDelete: (historyId: string) => void;
  onEditTitle: (historyId: string, newTitle: string) => void;
}

// 格式化时间显示
const formatTimeDisplay = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  if (diffInHours < 24) {
    if (diffInHours < 1) {
      return "刚刚";
    }
    return `${Math.floor(diffInHours)}小时前`;
  } else if (diffInHours < 48) {
    return "昨天";
  } else {
    const days = Math.floor(diffInHours / 24);
    return `${days}天前`;
  }
};

// 截断标题
const truncateTitle = (title: string, maxLength: number = 17) => {
  if (!title) return "未命名对话";
  return title.length > maxLength
    ? `${title.substring(0, maxLength)}...`
    : title;
};

const HistoryItem: React.FC<HistoryItemProps> = ({
  history,
  isSelected,
  onLoad,
  onDelete,
  onEditTitle,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState(history.title || "");
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditingTitle(history.title || "");
    handleMenuClose();
  };

  const handleSaveTitle = () => {
    if (editingTitle.trim() && editingTitle !== history.title) {
      onEditTitle(history.id, editingTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTitle(history.title || "");
  };

  const handleDeleteClick = () => {
    onDelete(history.id);
    handleMenuClose();
  };

  const handleItemClick = () => {
    if (!isEditing) {
      onLoad(history.id);
    }
  };

  return (
    <>
      <ListItem disablePadding>
        <ListItemButton
          onClick={handleItemClick}
          selected={isSelected}
          sx={{
            borderRadius: 1,
            mb: 0.5,
            backgroundColor: isSelected ? "var(--hover-bg)" : "transparent",
            "&:hover": {
              backgroundColor: isSelected
                ? "var(--hover-bg)"
                : "var(--hover-bg)",
            },
            "&.Mui-selected": {
              backgroundColor: "var(--hover-bg)",
              "&:hover": {
                backgroundColor: "var(--hover-bg)",
              },
            },
            px: 2,
            py: 1,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              gap: 1,
            }}
          >
            {/* 内容区域 */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {isEditing ? (
                <TextField
                  size="small"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveTitle();
                    } else if (e.key === "Escape") {
                      handleCancelEdit();
                    }
                  }}
                  onBlur={handleSaveTitle}
                  autoFocus
                  sx={{
                    width: "100%",
                    "& .MuiInputBase-input": {
                      fontSize: "0.875rem",
                      py: 0.5,
                    },
                  }}
                />
              ) : (
                <Box>
                  {/* 标题和更多按钮 */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "var(--primary-text)",
                        fontWeight: isSelected ? 600 : 400,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                        mr: 1,
                      }}
                    >
                      {truncateTitle(history.title || "")}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={handleMenuOpen}
                      sx={{
                        opacity: 0,
                        transition: "opacity 0.2s",
                        ".MuiListItemButton-root:hover &": { opacity: 1 },
                        color: "var(--icon-color)",
                        p: 0.25,
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* 时间和消息数量 */}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      mt: 0.5,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "var(--secondary-text)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {formatTimeDisplay(history.timestamp)}
                    </Typography>
                    <Badge
                      badgeContent={history.messages.length}
                      sx={{
                        "& .MuiBadge-badge": {
                          backgroundColor: "var(--badge-bg)",
                          color: "var(--badge-text)",
                          fontSize: "0.625rem",
                          height: 16,
                          minWidth: 16,
                        },
                      }}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </ListItemButton>
      </ListItem>

      {/* 上下文菜单 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        slotProps={{
          paper: {
            sx: {
              backgroundColor: "var(--card-bg)",
              border: "1px solid var(--card-border)",
              minWidth: 120,
            },
          },
        }}
      >
        <MenuItem
          onClick={handleEditClick}
          sx={{ fontSize: "0.875rem", py: 1 }}
        >
          <EditIcon sx={{ mr: 1, fontSize: 16 }} />
          编辑标题
        </MenuItem>
        <MenuItem
          onClick={handleDeleteClick}
          sx={{
            fontSize: "0.875rem",
            py: 1,
            color: "#f44336",
            "&:hover": {
              backgroundColor: "rgba(244, 67, 54, 0.1)",
            },
          }}
        >
          <DeleteIcon sx={{ mr: 1, fontSize: 16 }} />
          删除
        </MenuItem>
      </Menu>
    </>
  );
};

export default HistoryItem;
