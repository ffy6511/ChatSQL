"use client";

import { useState, useEffect } from "react";

const DEFAULT_TAGS = {
  SELECT: "#f50",
  JOIN: "#108ee9",
  "GROUP BY": "#87d068",
  WHERE: "#2db7f5",
  "ORDER BY": "#673ab7",
  HAVING: "#ff9800",
  子查询: "#795548",
  聚合函数: "#607d8b",
  窗口函数: "#e91e63",
};

export const useTagsManager = () => {
  const [tags, setTags] = useState<Record<string, string>>({});

  // 初始化标签
  useEffect(() => {
    const storedTags = localStorage.getItem("tags");
    if (storedTags) {
      setTags(JSON.parse(storedTags));
    } else {
      setTags(DEFAULT_TAGS);
      localStorage.setItem("tags", JSON.stringify(DEFAULT_TAGS));
    }
  }, []);

  // 添加新标签
  const addTag = (tagName: string) => {
    const newTags = {
      ...tags,
      [tagName]: "#d9d9d9", // 使用统一的默认颜色
    };
    setTags(newTags);
    localStorage.setItem("tags", JSON.stringify(newTags));
  };

  // 删除标签
  const deleteTag = (tagName: string) => {
    const newTags = { ...tags };
    delete newTags[tagName];
    setTags(newTags);
    localStorage.setItem("tags", JSON.stringify(newTags));
  };

  return {
    tags,
    addTag,
    deleteTag,
  };
};
