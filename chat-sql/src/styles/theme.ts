// src/styles/theme.ts
"use client";

import { createTheme, StyledEngineProvider } from "@mui/material/styles";

const theme = createTheme({
  components: {
    // TextField 组件全局样式覆盖
    MuiTextField: {
      styleOverrides: {
        root: {
          // 标签颜色
          "& .MuiInputLabel-root": {
            color: "var(--secondary-text)",
          },
          // 输入框的外框
          "& .MuiOutlinedInput-root": {
            backgroundColor: "var(--input-bg)",
            borderRadius: "16px",
            boxShadow: `
            inset 0 0 0 1px rgba(5, 5, 5, 0.08),
            0 1px 3px rgba(0, 0, 0, 0.05),
            0 1px 2px -1px rgba(0, 0, 0, 0.05)
          `,
            // 默认状态下的边框颜色
            "& fieldset": {
              borderColor: "transparent",
            },
            // 鼠标悬停时的边框颜色
            "&:hover fieldset": {
              borderColor: "transparent",
            },
            // 聚焦时的边框颜色
            "&.Mui-focused fieldset": {
              borderColor: "transparent",
            },
            // 输入的文字颜色
            "& .MuiOutlinedInput-input": {
              color: "var(--primary-text)",
            },
          },
        },
      },
    },

    // Table样式覆盖
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: "var(--secondary-text)",
        },
      },
    },

    // Button 组件全局样式覆盖
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none", // 禁用大写转换
          borderRadius: "8px",
          fontWeight: 500,
        },
        outlined: {
          borderColor: "var(--button-border)",
          color: "var(--button-text)",
          backgroundColor: "var(--button-bg)",
          "&:hover": {
            backgroundColor: "var(--button-hover)",
            borderColor: "var(--link-color)",
          },
        },
        contained: {
          backgroundColor: "var(--link-color)",
          color: "#ffffff",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            backgroundColor: "var(--link-hover)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
          },
        },
        text: {
          color: "var(--button-text)",
          "&:hover": {
            backgroundColor: "var(--button-hover)",
          },
        },
      },
    },

    // Paper 组件全局样式覆盖
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--card-bg)",
          borderRadius: "8px",
          border: "1px solid var(--card-border)",
        },
        elevation1: {
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        },
        elevation2: {
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        elevation3: {
          boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
        },
      },
    },

    MuiInputBase: {
      styleOverrides: {
        root: {
          color: "var(--secondary-text)",
        },
      },
    },

    // Card 组件全局样式覆盖
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          transition: "box-shadow 0.3s ease, transform 0.2s ease",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          },
        },
      },
    },

    // AppBar 组件全局样式覆盖
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--sidebar-bg)",
          borderBottom: "1px solid var(--sidebar-border)",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
          color: "var(--primary-text)",
        },
      },
    },

    // IconButton 组件全局样式覆盖
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "var(--icon-color)",
          borderRadius: "8px",
          transition: "all 0.2s ease",
          "&:hover": {
            backgroundColor: "var(--button-hover)",
            color: "var(--icon-color-hover)",
          },
        },
      },
    },

    // Tooltip 组件全局样式覆盖
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "var(--card-bg)",
          color: "var(--primary-text)",
          border: "1px solid var(--card-border)",
          borderRadius: "6px",
          fontSize: "0.75rem",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        arrow: {
          color: "var(--card-bg)",
          "&::before": {
            border: "1px solid var(--card-border)",
          },
        },
      },
    },

    // Typography 组件全局样式覆盖
    MuiTypography: {
      styleOverrides: {
        root: {
          color: "var(--primary-text)",
        },
        h1: {
          color: "var(--primary-text)",
          fontWeight: 600,
          fontSize: "1.45rem",
        },
        h2: {
          color: "var(--primary-text)",
          fontWeight: 600,
          fontSize: "1.35rem",
        },
        h3: {
          color: "var(--primary-text)",
          fontWeight: 600,
          fontSize: "1.25rem",
        },
        h4: {
          color: "var(--primary-text)",
          fontWeight: 600,
          fontSize: "1.15rem",
        },
        h5: {
          color: "var(--secondary-text)",
          fontWeight: 600,
          fontSize: "0.95rem",
        },
        h6: {
          color: "var(--secondary-text)",
          fontWeight: 600,
          fontSize: "0.875rem",
        },
        body1: {
          color: "var(--primary-text)",
        },
        body2: {
          color: "var(--secondary-text)",
        },
        caption: {
          color: "var(--tertiary-text)",
        },
      },
    },

    // Divider 组件全局样式覆盖
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: "var(--divider-color)",
        },
      },
    },

    // MuiAutocomplete 补全相关
    MuiAutocomplete: {
      styleOverrides: {
        // 控制输入框部分
        root: {
          color: "var(--secondary-text)",
        },
        // 控制输入框里的文字
        input: {
          color: "var(--secondary-text)",
        },
        // 控制下拉列表整体容器（listbox）
        listbox: {
          color: "var(--primary-text)", // 设置选项文字颜色
          backgroundColor: "var(--card-bg)", // 设置下拉背景
        },
        // 控制每个选项项
        option: {
          color: "var(--primary-text)",
          '&[aria-selected="true"]': {
            backgroundColor: "var(--button-hover)",
          },
          "&:hover": {
            backgroundColor: "var(--button-hover)",
          },
        },
      },
    },

    // Chip 组件全局样式覆盖
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--component-card)",
          color: "var(--primary-text)",
          border: "1px solid var(--card-border)",
        },
        outlined: {
          backgroundColor: "transparent",
          borderColor: "var(--card-border)",
          color: "var(--primary-text)",
        },
        colorPrimary: {
          backgroundColor: "var(--link-color)",
          color: "#ffffff",
        },
        colorSecondary: {
          backgroundColor: "var(--secondary-text)",
          color: "#ffffff",
        },
      },
    },

    // Dialog 组件全局样式覆盖
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
        },
      },
    },

    // DialogTitle 组件全局样式覆盖
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: "var(--primary-text)",
          borderBottom: "1px solid var(--divider-color)",
          fontWeight: 600,
        },
      },
    },

    // DialogContent 组件全局样式覆盖
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: "var(--primary-text)",
        },
      },
    },

    // DialogActions 组件全局样式覆盖
    MuiDialogActions: {
      styleOverrides: {
        root: {
          borderTop: "1px solid var(--divider-color)",
          padding: "16px 24px",
        },
      },
    },

    // Alert 组件全局样式覆盖
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          border: "none",
        },
        standardSuccess: {
          backgroundColor: "var(--success-bg)",
          color: "var(--primary-text)",
          borderColor: "var(--success-color)",
          "& .MuiAlert-icon": {
            color: "var(--success-icon)",
          },
        },
        standardError: {
          backgroundColor: "var(--error-bg)",
          color: "var(--primary-text)",
          borderColor: "var(--error-color)",
          "& .MuiAlert-icon": {
            color: "var(--error-icon)",
          },
        },
        standardWarning: {
          backgroundColor: "var(--warning-bg)",
          color: "var(--primary-text)",
          borderColor: "var(--warning-icon)",
          "& .MuiAlert-icon": {
            color: "var(--warning-icon)",
          },
        },
        standardInfo: {
          backgroundColor: "var(--info-bg)",
          color: "var(--primary-text)",
          borderColor: "var(--info-color)",
          "& .MuiAlert-icon": {
            color: "var(--info-icon)",
          },
        },
      },
    },

    // Tabs 组件全局样式覆盖
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid var(--divider-color)",
        },
        indicator: {
          backgroundColor: "var(--link-color)",
        },
      },
    },

    // Tab 组件全局样式覆盖
    MuiTab: {
      styleOverrides: {
        root: {
          color: "var(--secondary-text)",
          textTransform: "none",
          fontWeight: 500,
          "&.Mui-selected": {
            color: "var(--link-color)",
          },
          "&:hover": {
            color: "var(--primary-text)",
          },
        },
      },
    },

    // Select 组件全局样式覆盖
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--input-bg)",
          color: "var(--primary-text)",
        },
        outlined: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--input-border)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--link-color)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "var(--link-color)",
          },
        },
      },
    },

    // Menu 组件全局样式覆盖
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "var(--card-bg)",
          border: "1px solid var(--card-border)",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
        },
        list: {
          color: "var(--primary-text)",
          padding: "4px",
        },
      },
    },

    // MenuItem 组件全局样式覆盖
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: "var(--primary-text)",
          borderRadius: "4px",
          margin: "2px 0",
          "&:hover": {
            backgroundColor: "var(--button-hover)",
          },
          "&.Mui-selected": {
            backgroundColor: "var(--component-card)",
            "&:hover": {
              backgroundColor: "var(--button-hover)",
            },
          },
        },
      },
    },

    // FormControl 组件全局样式覆盖
    MuiFormControl: {
      styleOverrides: {
        root: {
          "& .MuiInputLabel-root": {
            color: "var(--secondary-text)",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "var(--link-color)",
          },
        },
      },
    },

    // FormControlLabel 组件全局样式覆盖
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          color: "var(--primary-text)",
        },
        label: {
          color: "var(--primary-text)",
        },
      },
    },

    // Switch 组件全局样式覆盖
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-switchBase": {
            color: "var(--secondary-text)",
            "&.Mui-checked": {
              color: "var(--link-color)",
              "& + .MuiSwitch-track": {
                backgroundColor: "var(--link-color)",
                opacity: 0.5,
              },
            },
          },
          "& .MuiSwitch-track": {
            backgroundColor: "var(--input-border)",
            opacity: 0.5,
          },
        },
      },
    },

    // List 组件全局样式覆盖
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--card-bg)",
          color: "var(--primary-text)",
        },
      },
    },

    // ListItem 组件全局样式覆盖
    MuiListItem: {
      styleOverrides: {
        root: {
          color: "var(--primary-text)",
          "&:hover": {
            backgroundColor: "var(--button-hover)",
          },
        },
      },
    },

    // Collapse 组件全局样式覆盖
    MuiCollapse: {
      styleOverrides: {
        root: {
          backgroundColor: "var(--card-bg)",
        },
      },
    },
  },
});

export default theme;
