
import { GitHubUser, GitHubRepo } from '../types';

const BASE_URL = 'https://api.github.com';

const headers: HeadersInit = {
  'Accept': 'application/vnd.github.v3+json',
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      if (remaining === '0') {
        throw new Error('GitHub API rate limit exceeded. Please try again later or use a different profile.');
      }
    }
    if (response.status === 404) {
      throw new Error('GitHub user not found. Please verify the username or profile URL.');
    }
    throw new Error(`GitHub API Error: ${response.statusText} (${response.status})`);
  }
  return response;
};

export const fetchUserProfile = async (username: string): Promise<GitHubUser> => {
  const response = await fetch(`${BASE_URL}/users/${username}`, { headers });
  await handleResponse(response);
  return response.json();
};

export const fetchUserRepos = async (username: string): Promise<GitHubRepo[]> => {
  const response = await fetch(`${BASE_URL}/users/${username}/repos?per_page=100&sort=pushed`, { headers });
  await handleResponse(response);
  return response.json();
};

export const fetchRepoReadme = async (owner: string, repo: string): Promise<string | null> => {
  try {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/readme`, {
      headers: { ...headers, 'Accept': 'application/vnd.github.v3.raw' }
    });
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
};

export const fetchRepoContents = async (owner: string, repo: string): Promise<any[]> => {
  try {
    const response = await fetch(`${BASE_URL}/repos/${owner}/${repo}/contents`, { headers });
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
};
