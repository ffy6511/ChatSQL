"use client";

import React, { useEffect } from "react";
import { message } from "antd";
import { useSearchParams } from "next/navigation";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import styles from "./page.module.css";
import Sidebar from "@/components/ERDiagram/core/Sidebar";
import Canvas from "@/components/ERDiagram/core/Canvas";
import Inspector from "@/components/ERDiagram/Inspector/Inspector";
import ERAssistantPanel from "@/components/ERDiagram/core/ERAssistantPanel";
import { useERDiagramContext } from "@/contexts/ERDiagramContext";
import { useSelection } from "@/contexts/SelectionContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { Box } from "@mui/material";

const ERDiagramContent: React.FC = () => {
  const searchParams = useSearchParams();
  const { selectionState, setSelectedERId } = useSelection();
  const { state, setActiveTab, loadDiagram } = useERDiagramContext();

  // 处理 URL 参数自动加载
  useEffect(() => {
    const urlId = searchParams.get("id");

    if (urlId) {
      // URL 中有 ID 参数，只有当前图表ID与URL参数不同时才加载
      if (state.currentDiagramId !== urlId) {
        console.log("从URL参数加载ER图:", urlId);
        loadDiagram(urlId).catch((error) => {
          console.error("从URL参数加载ER图失败:", error);
          message.error("加载指定的ER图失败");
        });
      }

      // 同步更新选择状态
      if (selectionState.selectedERId !== urlId) {
        setSelectedERId(urlId);
      }
    } else if (
      selectionState.selectedERId &&
      state.currentDiagramId !== selectionState.selectedERId
    ) {
      // URL 中没有 ID，但选择状态中有，且当前图表ID与选择状态不同时才加载
      loadDiagram(selectionState.selectedERId).catch((error) => {
        console.error("从选择状态加载ER图失败:", error);
        // 如果加载失败，清除选择状态
        setSelectedERId(null);
      });
    }
  }, [
    searchParams,
    selectionState.selectedERId,
    state.currentDiagramId,
    loadDiagram,
    setSelectedERId,
  ]);

  return (
    <Box
      className="pageContainer"
      sx={{
        width: "100vw",
        display: "flex",
        bgcolor: "var(--background-color)",
        overflow: "hidden",
      }}
    >
      {/* 左侧边栏 */}
      <Box sx={{ flexShrink: 0 }}>
        <Sidebar
          activeTab={state.activeSidebarTab}
          onTabChange={setActiveTab}
        />
      </Box>

      <Box className={styles.contentContainer}>
        <PanelGroup direction="horizontal" className={styles.mainSplitter}>
          {/* 中间画布区域 */}
          <Panel
            minSize={50}
            defaultSize={70}
            style={{ height: "100%", width: "100%" }}
            className={styles.canvasPanel}
          >
            <Canvas hasData={!!state.diagramData} />
          </Panel>

          {/* 拖拽手柄 */}
          <PanelResizeHandle
            style={{
              width: 2,
              background: "var(--card-border)",
              cursor: "col-resize",
              transition: "background-color 0.2s ease",
            }}
          />

          {/* 右侧详情栏 */}
          <Panel minSize={30} className={styles.inspectorPanel}>
            <PanelGroup direction="vertical" style={{ height: "100%" }}>
              <Panel minSize={30} defaultSize={50} style={{ overflow: "auto" }}>
                <Inspector activeTab={state.activeSidebarTab} />
              </Panel>

              {/* 拖拽手柄 */}
              <PanelResizeHandle
                style={{
                  height: 2,
                  background: "var(--card-border)",
                  cursor: "row-resize",
                  transition: "background-color 0.2s ease",
                }}
              />

              {/* 对话窗口 */}
              <Panel minSize={30} style={{ overflow: "auto" }}>
                <ERAssistantPanel />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </Box>
    </Box>
  );
};

const ERDiagramPage: React.FC = () => {
  return (
    <ChatProvider>
      <ERDiagramContent />
    </ChatProvider>
  );
};

export default ERDiagramPage;
