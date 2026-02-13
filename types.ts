
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string;
  bio: string;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  blog?: string;
}

export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  homepage?: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  has_issues: boolean;
  archived: boolean;
  size: number;
  // Fix: Added missing 'fork' property which is part of the GitHub API response and used in scoringService.ts
  fork: boolean;
}

export interface AnalysisScore {
  overall: number;
  breakdown: {
    documentation: number;
    codeQuality: number;
    activity: number;
    organization: number;
    impact: number;
    technicalDepth: number;
    collaboration: number;
  };
}

export interface AIInsights {
  verdict: 'Hire Ready' | 'Improving' | 'Weak';
  strengths: string[];
  redFlags: string[];
  improvements: string[];
  summary: string;
}

export interface AnalysisResult {
  user: GitHubUser;
  score: AnalysisScore;
  insights: AIInsights;
  languages: Record<string, number>;
  topRepos: GitHubRepo[];
}
