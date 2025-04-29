import { NextResponse } from 'next/server';
import simpleGit from 'simple-git';

export async function GET() {
  try {
    const git = simpleGit();
    
    // 获取最近的 50 条提交记录
    const logs = await git.log({
      maxCount: 50,
      format: {
        hash: '%H',
        date: '%aI',
        message: '%s',
        author: '%an'
      }
    });

    return NextResponse.json(logs.all);
  } catch (error) {
    console.error('Error fetching git history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch git history' },
      { status: 500 }
    );
  }
}