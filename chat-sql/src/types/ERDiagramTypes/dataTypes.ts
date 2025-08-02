// 数据类型统一配置文件

// 数据类型参数配置接口
export interface DataTypeParamConfig {
  paramCount: number;
  paramLabels: string[];
  defaultValues?: string[];
  validation?: {
    required?: boolean;
    pattern?: RegExp;
    min?: number;
    max?: number;
  }[];
}

// 数据类型参数配置映射
export const dataTypeParamConfig: Record<string, DataTypeParamConfig> = {
  VARCHAR: {
    paramCount: 1,
    paramLabels: ["Max Length"],
    defaultValues: ["255"],
    validation: [
      {
        required: false,
        pattern: /^\d+$/,
        min: 1,
        max: 65535,
      },
    ],
  },
  CHAR: {
    paramCount: 1,
    paramLabels: ["Length"],
    defaultValues: ["1"],
    validation: [
      {
        required: false,
        pattern: /^\d+$/,
        min: 1,
        max: 255,
      },
    ],
  },
  NUMERIC: {
    paramCount: 2,
    paramLabels: ["Precision", "Scale"],
    defaultValues: ["10", "2"],
    validation: [
      {
        required: false,
        pattern: /^\d+$/,
        min: 1,
        max: 65,
      },
      {
        required: false,
        pattern: /^\d+$/,
        min: 0,
        max: 30,
      },
    ],
  },
  DECIMAL: {
    paramCount: 2,
    paramLabels: ["Precision", "Scale"],
    defaultValues: ["10", "2"],
    validation: [
      {
        required: false,
        pattern: /^\d+$/,
        min: 1,
        max: 65,
      },
      {
        required: false,
        pattern: /^\d+$/,
        min: 0,
        max: 30,
      },
    ],
  },
  ENUM: {
    paramCount: 1,
    paramLabels: ["Values (comma-separated)"],
    defaultValues: ["value1,value2,value3"],
    validation: [
      {
        required: true,
        pattern: /^.+$/,
      },
    ],
  },
  "DOUBLE PRECISION": { paramCount: 0, paramLabels: [] },
  INT: { paramCount: 0, paramLabels: [] },
  SMALLINT: { paramCount: 0, paramLabels: [] },
  BIGINT: { paramCount: 0, paramLabels: [] },
  FLOAT: { paramCount: 0, paramLabels: [] },
  BOOLEAN: { paramCount: 0, paramLabels: [] },
  DATE: { paramCount: 0, paramLabels: [] },
  TIME: { paramCount: 0, paramLabels: [] },
  TIMESTAMP: { paramCount: 0, paramLabels: [] },
  INTERVAL: { paramCount: 0, paramLabels: [] },
  TEXT: { paramCount: 0, paramLabels: [] },
  BLOB: { paramCount: 0, paramLabels: [] },
  JSON: { paramCount: 0, paramLabels: [] },
};

// 数据类型选项列表（按常用程度排序）
export const dataTypeOptions: string[] = [
  "VARCHAR",
  "INT",
  "CHAR",
  "TEXT",
  "NUMERIC",
  "DECIMAL",
  "FLOAT",
  "DOUBLE PRECISION",
  "BOOLEAN",
  "DATE",
  "TIME",
  "TIMESTAMP",
  "SMALLINT",
  "BIGINT",
  "INTERVAL",
  "ENUM",
  "BLOB",
  "JSON",
];

// 数据类型分类（用于UI分组显示）
export const dataTypeCategories = {
  字符串类型: ["VARCHAR", "CHAR", "TEXT", "ENUM"],
  数值类型: [
    "INT",
    "SMALLINT",
    "BIGINT",
    "NUMERIC",
    "DECIMAL",
    "FLOAT",
    "DOUBLE PRECISION",
  ],
  日期时间类型: ["DATE", "TIME", "TIMESTAMP", "INTERVAL"],
  其他类型: ["BOOLEAN", "BLOB", "JSON"],
};

// 解析数据类型字符串的工具函数
export const parseDataType = (
  dataType: string,
): { typeName: string; params: string[] } => {
  const match = dataType?.match(/^(\w+(?:\s+\w+)*)(?:\((.*)\))?$/);
  if (match) {
    const typeName = match[1];
    const params = match[2] ? match[2].split(",").map((s) => s.trim()) : [];
    return { typeName, params };
  }
  return { typeName: dataType || "VARCHAR", params: [] };
};

// 构建数据类型字符串的工具函数
export const buildDataType = (typeName: string, params: string[]): string => {
  const filteredParams = params.filter((p) => p && p.trim());
  return filteredParams.length > 0
    ? `${typeName}(${filteredParams.join(",")})`
    : typeName;
};

// 验证参数值的工具函数
export const validateParam = (
  value: string,
  validation?: DataTypeParamConfig["validation"],
  paramIndex: number = 0,
): boolean => {
  if (!validation || !validation[paramIndex]) return true;

  const validationRule = validation[paramIndex];

  if (validationRule.required && (!value || !value.trim())) {
    return false;
  }

  if (value && validationRule.pattern && !validationRule.pattern.test(value)) {
    return false;
  }

  if (value && validationRule.min !== undefined) {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue < validationRule.min) {
      return false;
    }
  }

  if (value && validationRule.max !== undefined) {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue) || numValue > validationRule.max) {
      return false;
    }
  }

  return true;
};

// 获取数据类型的默认参数值
export const getDefaultParams = (typeName: string): string[] => {
  const config = dataTypeParamConfig[typeName];
  return config?.defaultValues || Array(config?.paramCount || 0).fill("");
};
