def main(input: str) -> dict:
  """从模型输出的JSON数据中提取变量

  Returns:
    hint: String: 模型的问题提示与介绍
    description: String: 场景的描述
    tags: Array[String]: 题目的标签
    tableStructure: Array[Object]: schema
    tuples: Array[Object]: 元组数据
    expected_result: Array[Object]: 预期的结果
    problem: Array[String]: 问题描述
    
  example:
    {
      "hint": "本题考察SELECT、WHERE、ORDER BY等基础SQL语法，注意不同查询需求的写法。",
      "description": "有一张学生成绩表，记录了学生的学号、姓名和数学成绩。请根据下列要求完成查询。场景：班级成绩管理。",
      "problem": [
        "1. 查询所有学生的姓名和数学成绩。",
        "2. 查询数学成绩大于等于90分的学生姓名和成绩。",
        "3. 查询所有学生的姓名和成绩，并按成绩从高到低排序。"
      ],
      "tags": ["select", "where", "order by"],
      "tableStructure": [
        {
          "tableName": "Scores",
          "columns": [
            { "name": "student_id", "type": "INT", "isPrimary": true },
            { "name": "student_name", "type": "VARCHAR(50)", "isPrimary": false },
            { "name": "math_score", "type": "INT", "isPrimary": false }
          ],
          "foreignKeys": []
        }
      ],
      "tuples": [
        {
          "tableName": "Scores",
          "tupleData": [
            { "student_id": 1, "student_name": "张三", "math_score": 95 },
            { "student_id": 2, "student_name": "李四", "math_score": 88 },
            { "student_id": 3, "student_name": "王五", "math_score": 76 },
            { "student_id": 4, "student_name": "赵六", "math_score": 92 }
          ]
        }
      ],
      "expected_result": [
        {
          "tableName": "Scores",
          "tupleData": [
            { "student_name": "张三", "math_score": 95 },
            { "student_name": "李四", "math_score": 88 },
            { "student_name": "王五", "math_score": 76 },
            { "student_name": "赵六", "math_score": 92 }
          ]
        },
        {
          "tableName": "Scores",
          "tupleData": [
            { "student_name": "张三", "math_score": 95 },
            { "student_name": "赵六", "math_score": 92 }
          ]
        },
        {
          "tableName": "Scores",
          "tupleData": [
            { "student_name": "张三", "math_score": 95 },
            { "student_name": "赵六", "math_score": 92 },
            { "student_name": "李四", "math_score": 88 },
            { "student_name": "王五", "math_score": 76 }
          ]
        }
      ]
    }
  """
  import json
  
  
  # 移除可能存在的```json ```标记
  # 检查并补全缺失的大括号
  
  # 去除首尾空白字符
  input = input.strip()
  # 移除markdown json代码块标记
  if input.startswith('```json'):
    input = input.replace('```json', '', 1)
  if input.endswith('```'):
    input = input[:-3]
  
  # 去除首尾空白字符
  input = input.strip()
  
  # 检查并补全大括号
  if not input.startswith('{'):
    input = '{' + input
  if not input.endswith('}'):
    input = input + '}'
    
  # # 如果输入不是标准JSON格式，尝试转换 —— 主要是现模型输出经常忘记给key加"" —— 更新: 发现模型输出忘加""的问题实质是因为提示词中错误的暗示导致了模型输出YAML格式数据，经微调提示词后已无此问题(至少发生概率较小，已足以实现运行时间期望值大幅缩减的目的)
  # import re
  # # 查找逗号或左花括号后面到冒号之间的内容
  # # 如果该内容不是被引号包裹的，就给它加上引号
  # pattern = r'(,|\{)\s*([^"\'\s][^:]*?)\s*:'
  # re.sub(pattern, r'\1"\2":', input)
  
  
  data = json.loads(input)
  
  # 提取各个字段
  hint = data.get('hint', '')
  description = data.get('description', '')
  tags = data.get('tags', [])
  tableStructure = data.get('tableStructure', [])
  tuples = data.get('tuples', [])
  expected_result = data.get('expected_result', [])
  problem = data.get('problem', [])
  
  return {
    "hint": hint,
    "description": description,
    "tags": tags,
    "tableStructure": tableStructure,
    "tuples": tuples,
    "expected_result": expected_result,
    "problem": problem
  }