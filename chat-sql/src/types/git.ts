export interface GitCommit {
  hash: string;
  date: string;
  message: string;
  description?: string; // 添加可选的详细描述字段
  author: string;
}

export interface BranchDetails {
  totalBranches: number;
  currentBranch: string;
  branches: string[];
}

export interface GitStats {
  totalCommits: number;
  contributors: string[];
  lastUpdate: string;
  activeBranches: number;
  branchDetails: BranchDetails;
}

export interface GitInfo {
  history: GitCommit[];
  stats: GitStats;
}
