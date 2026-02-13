
import { GitHubUser, GitHubRepo, AnalysisScore } from '../types';
import { fetchRepoReadme, fetchRepoContents } from './githubService';

export const calculateScore = async (user: GitHubUser, repos: GitHubRepo[]): Promise<AnalysisScore> => {
  // Filter for original work (non-forks) and non-archived
  const ownRepos = repos.filter(r => !r.fork && !r.archived);
  
  // Identify the most significant projects based on stars and recent activity
  const primaryRepos = ownRepos
    .sort((a, b) => {
      const scoreA = (a.stargazers_count * 10) + new Date(a.pushed_at).getTime() / (1000 * 60 * 60 * 24);
      const scoreB = (b.stargazers_count * 10) + new Date(b.pushed_at).getTime() / (1000 * 60 * 60 * 24);
      return scoreB - scoreA;
    })
    .slice(0, 5);

  const breakdown = {
    documentation: 0,
    codeQuality: 0,
    activity: 0,
    organization: 0,
    impact: 0,
    technicalDepth: 0,
    collaboration: 0
  };

  if (repos.length === 0) return { overall: 0, breakdown };

  // Parallel fetch repo details for primary projects
  const repoDetails = await Promise.all(primaryRepos.map(async repo => {
    const [readme, contents] = await Promise.all([
      fetchRepoReadme(user.login, repo.name),
      fetchRepoContents(user.login, repo.name)
    ]);
    return { repo, readme, contents };
  }));

  // --- 1. Documentation Quality (20%) ---
  const docCoverage = ownRepos.length > 0 
    ? primaryRepos.filter(r => repoDetails.find(d => d.repo.name === r.name)?.readme).length / primaryRepos.length
    : 0;
  
  let docQualitySum = 0;
  repoDetails.forEach(({ readme }) => {
    if (readme) {
      let score = 0;
      // Length signals effort
      if (readme.length > 800) score += 0.3;
      if (readme.length > 2000) score += 0.2;
      
      const lowerReadme = readme.toLowerCase();
      // Section presence detection
      if (lowerReadme.includes('install') || lowerReadme.includes('setup')) score += 0.15;
      if (lowerReadme.includes('usage') || lowerReadme.includes('demo') || lowerReadme.includes('screenshot')) score += 0.15;
      if (lowerReadme.includes('tech stack') || lowerReadme.includes('built with') || lowerReadme.includes('framework')) score += 0.1;
      if (lowerReadme.includes('badge') || lowerReadme.includes('img.shields.io')) score += 0.1;
      docQualitySum += Math.min(score, 1);
    }
  });
  const avgDocQuality = primaryRepos.length > 0 ? docQualitySum / primaryRepos.length : 0;
  breakdown.documentation = Math.round((docCoverage * 8) + (avgDocQuality * 12));

  // --- 2. Code Quality & Structure (20%) ---
  let structureSum = 0;
  repoDetails.forEach(({ contents }) => {
    const files = contents.map(c => c.name.toLowerCase());
    let repoStructureScore = 0;
    
    // Modern modular structures
    if (files.some(f => ['src', 'lib', 'app', 'packages', 'internal', 'cmd'].includes(f))) repoStructureScore += 4;
    
    // Testing maturity
    if (files.some(f => f.includes('test') || f.includes('spec') || f.includes('jest') || f.includes('vitest'))) repoStructureScore += 5;
    
    // Standards & Tooling (Linting, Formatting, Types)
    if (files.some(f => f.includes('eslint') || f.includes('prettier') || f.includes('tsconfig') || f.includes('ruff') || f.includes('checkstyle'))) repoStructureScore += 4;
    
    // Professional Hygiene: Reproducibility (Lockfiles)
    if (files.some(f => f.includes('lock') || f.includes('requirement.txt') || f.includes('gemfile') || f.includes('go.sum'))) repoStructureScore += 4;
    
    // Professional Hygiene: Environment safety
    if (files.some(f => f === '.env.example' || f === '.gitignore' || f === 'makefile')) repoStructureScore += 3;

    structureSum += Math.min(repoStructureScore, 20);
  });
  breakdown.codeQuality = Math.round(primaryRepos.length > 0 ? structureSum / primaryRepos.length : 0);

  // --- 3. Activity Consistency (15%) ---
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  
  const recentActiveCount = repos.filter(r => new Date(r.pushed_at) > threeMonthsAgo).length;
  const secondaryActiveCount = repos.filter(r => new Date(r.pushed_at) > sixMonthsAgo).length;
  
  // Weight recent activity more heavily
  const activityRatio = Math.min(((recentActiveCount * 1.5) + secondaryActiveCount) / 5, 1);
  const volumeFactor = Math.min(ownRepos.length / 8, 1);
  breakdown.activity = Math.round((activityRatio * 10) + (volumeFactor * 5));

  // --- 4. Technical Depth (15%) ---
  const langSet = new Set(repos.map(r => r.language).filter(Boolean));
  // Language sweet spot: 2-4 languages suggest specialization. 10+ might suggest noise.
  const diversity = langSet.size >= 2 && langSet.size <= 5 ? 1 : Math.min(langSet.size / 3, 0.6);
  
  let complexityPoints = 0;
  repoDetails.forEach(({ contents, repo }) => {
    const files = contents.map(c => c.name.toLowerCase());
    
    // Size as a proxy for logic depth (filtered for noise)
    if (repo.size > 2000 && repo.size < 500000) complexityPoints += 2;
    
    // Backend/Fullstack logic signals
    if (files.some(f => ['routes', 'controllers', 'services', 'api', 'handlers', 'middleware'].includes(f))) complexityPoints += 3;
    
    // Persistence/Data signals
    if (files.some(f => ['db', 'models', 'migrations', 'schema', 'prisma', 'entities'].includes(f))) complexityPoints += 3;
    
    // Infrastructure/Cloud signals
    if (files.some(f => f.includes('docker') || f.includes('k8s') || f.includes('terraform') || f.includes('github/workflows'))) complexityPoints += 2;
  });
  
  const complexityFactor = Math.min((complexityPoints / (primaryRepos.length * 5)), 1);
  breakdown.technicalDepth = Math.round((diversity * 5) + (complexityFactor * 10));

  // --- 5. Project Impact Signaling (15%) ---
  const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
  const hasLiveDemos = ownRepos.filter(r => r.homepage && r.homepage.startsWith('http')).length / (ownRepos.length || 1);
  
  const starScore = Math.min(totalStars / 30, 1);
  breakdown.impact = Math.round((starScore * 10) + (hasLiveDemos * 5));

  // --- 6. Collaboration Signals (5%) ---
  let collaborationSum = 0;
  repoDetails.forEach(({ contents }) => {
    const files = contents.map(c => c.name.toLowerCase());
    if (files.includes('contributing.md') || files.includes('code_of_conduct.md')) collaborationSum += 2.5;
    if (files.includes('issue_template') || files.includes('.github')) collaborationSum += 2.5;
  });
  breakdown.collaboration = Math.round(primaryRepos.length > 0 ? collaborationSum / primaryRepos.length : 0);

  // --- 7. Repository Organization (10%) ---
  const hasDescriptions = repos.filter(r => r.description).length / (repos.length || 1);
  const topicFactor = ownRepos.filter(r => (r as any).topics?.length > 0).length / (ownRepos.length || 1);
  
  breakdown.organization = Math.round((hasDescriptions * 7) + (topicFactor * 3));

  // --- CALCULATE BASE ---
  let overall = 
    breakdown.documentation + 
    breakdown.codeQuality + 
    breakdown.activity + 
    breakdown.technicalDepth + 
    breakdown.impact + 
    breakdown.collaboration + 
    breakdown.organization;

  // --- RED FLAG PENALTIES ---
  let penaltyCount = 0;
  
  // Flag: Ghost town (No activity in 1 year)
  const latestPushTime = Math.max(...repos.map(r => new Date(r.pushed_at).getTime()));
  if (now.getTime() - latestPushTime > 365 * 24 * 60 * 60 * 1000) penaltyCount += 15;
  
  // Flag: Mirror profile (Mostly forks)
  const ownRatio = ownRepos.length / (repos.length || 1);
  if (ownRatio < 0.2 && repos.length > 5) penaltyCount += 10;
  
  // Flag: Shallow profile (Many repos, but all < 100kb)
  const averageSize = repos.reduce((acc, r) => acc + r.size, 0) / (repos.length || 1);
  if (averageSize < 100 && repos.length > 3) penaltyCount += 5;

  overall = Math.max(0, Math.min(100, overall - penaltyCount));

  return { overall, breakdown };
};
