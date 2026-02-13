
import { GoogleGenAI, Type } from "@google/genai";
import { GitHubUser, GitHubRepo, AnalysisScore, AIInsights } from "../types";

export const generateAIInsights = async (
  user: GitHubUser, 
  repos: GitHubRepo[], 
  score: AnalysisScore
): Promise<AIInsights> => {
  // Fix: Initializing GoogleGenAI with named parameter inside the function to ensure up-to-date config
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Act as a senior technical recruiter. Analyze this GitHub profile data:
    Username: ${user.login}
    Bio: ${user.bio}
    Total Public Repos: ${user.public_repos}
    Followers: ${user.followers}
    
    Scores (out of 100 total):
    - Overall: ${score.overall}
    - Documentation: ${score.breakdown.documentation}/20
    - Code Quality: ${score.breakdown.codeQuality}/20
    - Activity: ${score.breakdown.activity}/15
    - Technical Depth: ${score.breakdown.technicalDepth}/15
    - Impact: ${score.breakdown.impact}/15
    - Collaboration: ${score.breakdown.collaboration}/5
    - Organization: ${score.breakdown.organization}/10

    Top 5 Repositories:
    ${repos.slice(0, 5).map(r => `- ${r.name}: ${r.description} (${r.language})`).join('\n')}

    Generate a structured critique including:
    1. A "Recruiter Verdict" (Hire Ready, Improving, or Weak).
    2. 3-4 Key Strengths.
    3. 2-3 "Red Flags" or areas of concern.
    4. 4 specific, actionable improvements.
    5. A 2-sentence professional summary.
  `;

  // Fix: Using gemini-3-pro-preview for complex reasoning and technical auditing tasks
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          verdict: { type: Type.STRING, description: 'One of: Hire Ready, Improving, Weak' },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          summary: { type: Type.STRING },
        },
        required: ['verdict', 'strengths', 'redFlags', 'improvements', 'summary']
      }
    }
  });

  try {
    // Fix: Accessing .text as a property and trimming for cleaner JSON parsing
    const text = response.text?.trim();
    if (!text) throw new Error("Empty response from AI model");
    const data = JSON.parse(text);
    return data as AIInsights;
  } catch (err) {
    console.error("AI parse error:", err);
    return {
      verdict: score.overall > 80 ? 'Hire Ready' : score.overall > 50 ? 'Improving' : 'Weak',
      strengths: ['Active presence', 'Open source visibility'],
      redFlags: ['Inconsistent documentation', 'Lack of testing patterns'],
      improvements: ['Add comprehensive READMEs', 'Increase test coverage', 'Use GitHub Actions'],
      summary: `${user.login} shows potential with an overall score of ${score.overall}. Technical depth is visible but presentation could be refined.`
    };
  }
};
