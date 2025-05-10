import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 读取生成的 git_info.json 文件
    const filePath = path.join(process.cwd(), 'public', 'git_info.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const gitInfo = JSON.parse(fileContent);
    
    // 返回提交历史
    return NextResponse.json(gitInfo.history);
  } catch (error) {
    console.error('Error reading git history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch git history' },
      { status: 500 }
    );
  }
}
