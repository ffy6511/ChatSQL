/**
 * B+树历史管理面板组件
 * 包含会话列表和步骤时间线的Tab切换界面
 */

import React, { useState } from "react";
import { Box, Paper, Typography, Tabs, Tab } from "@mui/material";
import {
  History as HistoryIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";

import { HistorySession } from "@/types/BplusTypes/bPlusHistory";
import {
  BPlusHistorySessionItem,
  BPlusHistoryStepItem,
} from "./BPlusHistoryItem";
import HistoryActionBar from "./HistoryActionBar";

interface HistoryManagementPanelProps {
  // 当前选中的会话和步骤
  selectedSessionId?: string;
  selectedStepIndex?: number;

  // 会话数据
  sessions: HistorySession[];

  // 回调函数
  onSessionSelect?: (sessionId: string) => void;
  onStepSelect?: (stepIndex: number) => void;
  onCreateSession?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  onRenameSession?: (sessionId: string, newName: string) => void;
  onDeleteAllSessions?: () => void;
}

const HistoryManagementPanel: React.FC<HistoryManagementPanelProps> = ({
  selectedSessionId,
  selectedStepIndex,
  sessions,
  onSessionSelect,
  onStepSelect,
  onCreateSession,
  onDeleteSession,
  onRenameSession,
  onDeleteAllSessions,
}) => {
  const [activeTab, setActiveTab] = useState<number>(0);
  const [searchValue, setSearchValue] = useState<string>("");

  // 过滤会话列表
  const filteredSessions = sessions.filter(
    (session) =>
      session.name.toLowerCase().includes(searchValue.toLowerCase()) ||
      session.description?.toLowerCase().includes(searchValue.toLowerCase()) ||
      session.tags?.some((tag) =>
        tag.toLowerCase().includes(searchValue.toLowerCase()),
      ),
  );

  // 渲染会话列表
  const renderSessionList = () => (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* 操作栏 */}
      <HistoryActionBar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onCreateNew={onCreateSession || (() => {})}
        onDeleteAll={onDeleteAllSessions || (() => {})}
        disableDeleteAll={sessions.length === 0}
      />

      {/* 会话列表 */}
      <Box sx={{ flex: 1, overflow: "auto", p: 1 }}>
        {filteredSessions.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px",
              color: "var(--tertiary-text)",
              textAlign: "center",
            }}
          >
            <Typography variant="body2">
              {searchValue ? "未找到匹配的记录" : "暂无历史记录"}
            </Typography>
          </Box>
        ) : (
          filteredSessions.map((session) => (
            <BPlusHistorySessionItem
              key={session.id}
              session={session}
              isActive={selectedSessionId === session.id}
              onSelect={onSessionSelect || (() => {})}
              onRename={onRenameSession || (() => {})}
              onDelete={onDeleteSession || (() => {})}
            />
          ))
        )}
      </Box>
    </Box>
  );

  // 渲染步骤时间线
  const renderStepTimeline = () => {
    const currentSession = sessions.find((s) => s.id === selectedSessionId);

    if (!currentSession) {
      return (
        <Box
          sx={{
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--secondary-text)",
          }}
        >
          <Typography variant="body2">请选择一个会话查看步骤</Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 0, mb: 5 }}>
        {currentSession.steps.length === 0 ? (
          <Box
            sx={{
              mt: 8,
              textAlign: "center",
              color: "var(--secondary-text)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TimelineIcon
              sx={{ fontSize: 60, mt: 16, color: "var(--tertiary-text)" }}
            />
            <Typography
              variant="body2"
              sx={{ mb: 1, color: "var(--tertiary-text)" }}
            >
              尚未记录任何步骤
            </Typography>
          </Box>
        ) : (
          currentSession.steps.map((step, index) => (
            <BPlusHistoryStepItem
              key={step.id}
              step={step}
              stepIndex={index}
              isActive={index === selectedStepIndex}
              isCurrent={index === currentSession.currentStepIndex}
              onSelect={onStepSelect || (() => {})}
            />
          ))
        )}
      </Box>
    );
  };

  return (
    <Paper
      elevation={1}
      sx={{
        height: "100%",
        bgcolor: "var(--card-bg)",
        border: "1px solid var(--card-border)",
        borderRadius: 2,
        display: "flex",
        flexDirection: "column",
        overflow: "auto",
      }}
    >
      {/* Tab 标签页 */}
      <Tabs
        value={activeTab}
        onChange={(_, newValue) => setActiveTab(newValue)}
        variant="fullWidth"
        sx={{
          borderBottom: "1px solid var(--card-border)",
          "& .MuiTab-root": {
            color: "var(--secondary-text)",
            "&.Mui-selected": {
              color: "var(--link-color)",
            },
          },
        }}
      >
        <Tab
          icon={<HistoryIcon />}
          label="历史会话"
          iconPosition="start"
          sx={{ fontSize: "0.875rem" }}
        />
        <Tab
          icon={<TimelineIcon />}
          label="操作步骤"
          iconPosition="start"
          sx={{ fontSize: "0.875rem" }}
        />
      </Tabs>

      {/* Tab 内容 */}
      <Box sx={{ flex: 1, overflow: "auto" }}>
        {activeTab === 0 ? renderSessionList() : renderStepTimeline()}
      </Box>
    </Paper>
  );
};

export default HistoryManagementPanel;
