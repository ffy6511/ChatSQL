"use client";

import React from "react";
import { Box, Container, Skeleton, Paper } from "@mui/material";
import { styled } from "@mui/material/styles";

const LoadingContainer = styled(Container)({
  width: "55%",
  marginTop: "var(--navbar-height, 64px)",
  padding: "24px",
  animation: "fadeIn 0.3s ease-in-out",
  "@keyframes fadeIn": {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
});

const SkeletonCard = styled(Paper)(({ theme }) => ({
  padding: "24px",
  marginBottom: "24px",
  background: "rgba(255, 255, 255, 0.8)",
  backdropFilter: "blur(5px)",
  borderRadius: "16px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
}));

export default function Loading() {
  return (
    <LoadingContainer maxWidth="lg">
      {/* 标题骨架 */}
      <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
        <Skeleton variant="text" width="50%" height={60} />
      </Box>

      {/* 年份标题骨架 */}
      <Skeleton variant="text" width="20%" height={40} sx={{ mb: 2 }} />

      {/* 内容骨架 - 重复多个卡片 */}
      {Array.from(new Array(3)).map((_, index) => (
        <SkeletonCard key={index}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Skeleton
              variant="circular"
              width={20}
              height={20}
              sx={{ mr: 2 }}
            />
            <Skeleton variant="text" width="15%" height={30} />
          </Box>

          {Array.from(new Array(2)).map((_, cardIndex) => (
            <Box key={cardIndex} sx={{ mb: 3, pl: 4 }}>
              <Box sx={{ display: "flex", mb: 1 }}>
                <Skeleton variant="text" width="30%" height={24} />
                <Skeleton
                  variant="text"
                  width="50%"
                  height={24}
                  sx={{ ml: 2 }}
                />
              </Box>
              <Skeleton variant="rectangular" height={60} sx={{ mb: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                <Skeleton variant="rounded" width={80} height={24} />
                <Skeleton variant="rounded" width={80} height={24} />
              </Box>
            </Box>
          ))}
        </SkeletonCard>
      ))}
    </LoadingContainer>
  );
}
