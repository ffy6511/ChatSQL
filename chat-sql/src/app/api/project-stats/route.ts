import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // 读取生成的 git_info.json 文件
    const filePath = path.join(process.cwd(), 'public', 'git_info.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const gitInfo = JSON.parse(fileContent);
    
    // 返回项目统计信息
    return NextResponse.json(gitInfo.stats);
  } catch (error) {
    console.error('Error reading project stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project stats' },
      { status: 500 }
    );
  }
}
