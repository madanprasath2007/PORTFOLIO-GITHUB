
import { GoogleGenAI, Type } from "@google/genai";
import { GitHubUser, GitHubRepo, AnalysisScore, AIInsights } from "../types";

export const generateAIInsights = async (
  user: GitHubUser, 
  repos: GitHubRepo[], 
  score: AnalysisScore
): Promise<AIInsights> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Act as a senior technical recruiter and system architect. Analyze this GitHub profile audit:
    Username: ${user.login}
    Public Repos: ${user.public_repos}
    Followers: ${user.followers}
    
    DETAILED AUDIT BREAKDOWN:
    - Overall Portfolio Score: ${score.overall}/100
    - Documentation (READMEs, Setup): ${score.breakdown.documentation}/20
    - Code Structure (Folders, Config, Tests): ${score.breakdown.codeQuality}/20
    - Activity Consistency: ${score.breakdown.activity}/15
    - Technical Depth (Fullstack, API, Logic): ${score.breakdown.technicalDepth}/15
    - Impact Signaling (Deployment, Stars): ${score.breakdown.impact}/15
    - Collaboration (Issues, PRs): ${score.breakdown.collaboration}/5
    - Org (Naming, Descriptions): ${score.breakdown.organization}/10

    TOP REPOS FOR CONTEXT:
    ${repos.slice(0, 5).map(r => `- ${r.name}: ${r.description} (${r.language})`).join('\n')}

    CRITICAL REQUIREMENTS:
    1. Verdict MUST be one of: 'Hire Ready' (Score 85+), 'Improving' (Score 60-84), or 'Weak' (Score <60).
    2. Strengths: Focus on specific technical patterns found.
    3. Red Flags: Identify specific missing professional traits (e.g., missing tests, poor naming, low activity).
    4. Improvements: Provide a 4-step actionable roadmap.
    5. Summary: A 2-sentence punchy recruiter evaluation.

    Return JSON matching the schema provided.
  `;

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
    const text = response.text?.trim();
    if (!text) throw new Error("Empty response from AI model");
    const data = JSON.parse(text);
    return data as AIInsights;
  } catch (err) {
    console.error("AI parse error:", err);
    // Conservative fallback
    const verdict = score.overall >= 85 ? 'Hire Ready' : score.overall >= 60 ? 'Improving' : 'Weak';
    return {
      verdict,
      strengths: ['Public contributions', 'Repository ownership'],
      redFlags: ['Documentation depth could be improved'],
      improvements: [
        'Implement standardized linting and formatting',
        'Add comprehensive READMEs for top projects',
        'Increase repository organization consistency',
        'Demonstrate more technical depth with a complex project'
      ],
      summary: `Candidate ${user.login} has a portfolio score of ${score.overall}. Their technical presence is ${verdict.toLowerCase()} with room for optimization in presentation.`
    };
  }
};
