"use client";

import React from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Divider,
  Typography,
} from "@mui/material";
import {
  Apps as AppsIcon,
  BorderAll as BorderAllIcon,
  Diamond as DiamondIcon,
} from "@mui/icons-material";

const ComponentLibraryView: React.FC = () => {
  const handleDragStart = (event: React.DragEvent, componentType: string) => {
    event.dataTransfer.setData("application/reactflow", componentType);
    event.dataTransfer.effectAllowed = "move";
    (event.currentTarget as HTMLElement).style.opacity = "0.5";
  };

  const handleDragEnd = (event: React.DragEvent) => {
    (event.currentTarget as HTMLElement).style.opacity = "1";
  };

  const components = [
    {
      id: "strong-entity",
      name: "强实体集",
      icon: BorderAllIcon,
      type: "strong-entity",
      description: "可以独立存在并拥有自己主键的实体类型",
      color: "#448fd6", // 蓝色
    },
    {
      id: "weak-entity",
      name: "弱实体集",
      icon: BorderAllIcon,
      type: "weak-entity",
      description: "其存在依赖于另一个(强)实体集",
      color: "#bd62eb", // 紫色
    },
    {
      id: "relationship",
      name: "关系",
      icon: DiamondIcon,
      type: "diamond",
      description: "表示不同实体集之间的连接或关联",
      color: "#ebcd62", // 绿色
    },
  ];

  return (
    <Box>
      <Typography
        variant='h6'
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <AppsIcon sx={{ color: "#1976d2", mr: 1 }} /> 组件库
      </Typography>
      <Divider sx={{ my: 1 }} />
      <Stack spacing={1} sx={{ mb: 2 }}>
        {components.map((component) => (
          <Card
            key={component.id}
            sx={{
              cursor: "grab",
              borderLeft: `6px solid ${component.color}`,
              borderRadius: 2,
              height: 80,
              bgcolor: "var(--component-card)",
            }}
            draggable
            onDragStart={(e) => handleDragStart(e, component.type)}
            onDragEnd={handleDragEnd}
          >
            <CardContent
              sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}
            >
              <component.icon sx={{ color: component.color }} />
              <Box>
                <Typography fontWeight='bold' color='var(--primary-text)'>
                  {component.name}
                </Typography>
                <Typography variant='body2' color='var(--secondary-text)'>
                  {component.description}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
      <Box
        sx={{
          mt: 2,
          p: 1.5,
          borderRadius: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          bgcolor: "var(--card-border)",
        }}
      >
        <Typography variant='body2'>将组件拖放到画布上。</Typography>
        <Typography variant='body2'>或者右键单击画布以创建新节点。</Typography>
      </Box>
    </Box>
  );
};

export default ComponentLibraryView;
