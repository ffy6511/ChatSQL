import React from "react";
import { Tooltip as AntdTooltip } from "antd";
import type { TooltipProps } from "antd";
import "./CustomTooltip.css";

const CustomTooltip: React.FC<TooltipProps> = (props) => {
  return <AntdTooltip {...props} overlayClassName="custom-tooltip" />;
};

export default CustomTooltip;
