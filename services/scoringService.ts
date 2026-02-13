
import { GitHubUser, GitHubRepo, AnalysisScore } from '../types';
import { fetchRepoReadme, fetchRepoContents } from './githubService';

export const calculateScore = async (user: GitHubUser, repos: GitHubRepo[]): Promise<AnalysisScore> => {
  // We'll analyze the top 5 most recently updated non-forked repos for deeper checks
  const primaryRepos = repos
    .filter(r => !r.archived && !r.fork)
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
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

  if (primaryRepos.length === 0) {
    return { overall: 0, breakdown };
  }

  // Speed up by parallelizing all metadata fetches
  const repoDetails = await Promise.all(primaryRepos.map(async repo => {
    const [readme, contents] = await Promise.all([
      fetchRepoReadme(user.login, repo.name),
      fetchRepoContents(user.login, repo.name)
    ]);
    return { repo, readme, contents };
  }));

  // 1. Documentation Quality (20%)
  let docScore = 0;
  repoDetails.forEach(({ readme }) => {
    if (readme) {
      docScore += 5; // README exists
      if (readme.length > 1000) docScore += 5; // Comprehensive README
      if (readme.toLowerCase().includes('install') || readme.toLowerCase().includes('setup')) docScore += 5;
      if (readme.toLowerCase().includes('usage') || readme.toLowerCase().includes('demo')) docScore += 5;
    }
  });
  breakdown.documentation = Math.min(20, (docScore / primaryRepos.length));

  // 2. Code Quality & Structure (20%)
  let codeQualityScore = 0;
  repoDetails.forEach(({ contents }) => {
    const filenames = contents.map(c => c.name.toLowerCase());
    if (filenames.some(f => f.includes('config') || f.includes('.json') || f.includes('.yml'))) codeQualityScore += 4;
    if (filenames.some(f => f.includes('test') || f.includes('spec'))) codeQualityScore += 4;
    if (filenames.some(f => f.includes('src') || f.includes('lib'))) codeQualityScore += 4;
    if (filenames.some(f => f.includes('eslint') || f.includes('prettier'))) codeQualityScore += 4;
    if (filenames.some(f => f.includes('docker') || f.includes('jenkins') || f.includes('github/workflows'))) codeQualityScore += 4;
  });
  breakdown.codeQuality = Math.min(20, (codeQualityScore / primaryRepos.length));

  // 3. Activity Consistency (15%)
  const lastYear = new Date();
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  const activeRecently = repos.filter(r => new Date(r.pushed_at) > lastYear).length;
  const recentRatio = activeRecently / (repos.length || 1);
  breakdown.activity = Math.min(15, (recentRatio * 15));

  // 4. Repository Organization (10%)
  const hasDescriptions = repos.filter(r => r.description).length / (repos.length || 1);
  breakdown.organization = Math.min(10, (hasDescriptions * 10));

  // 5. Project Impact Signaling (15%)
  const totalStars = repos.reduce((acc, r) => acc + r.stargazers_count, 0);
  const totalForks = repos.reduce((acc, r) => acc + r.forks_count, 0);
  const hasHomepages = repos.filter(r => r.homepage).length / (repos.length || 1);
  breakdown.impact = Math.min(15, (hasHomepages * 5) + (Math.min(1, totalStars / 50) * 5) + (Math.min(1, totalForks / 20) * 5));

  // 6. Technical Depth (15%)
  const languages = new Set(repos.map(r => r.language).filter(Boolean));
  breakdown.technicalDepth = Math.min(15, (languages.size / 5) * 15);

  // 7. Collaboration Signals (5%)
  const hasIssues = repos.filter(r => r.has_issues).length / (repos.length || 1);
  breakdown.collaboration = Math.min(5, (hasIssues * 5));

  const overall = Math.round(
    breakdown.documentation + 
    breakdown.codeQuality + 
    breakdown.activity + 
    breakdown.organization + 
    breakdown.impact + 
    breakdown.technicalDepth + 
    breakdown.collaboration
  );

  return { overall, breakdown };
};
