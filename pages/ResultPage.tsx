
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import ScoreCircle from '../components/ScoreCircle';
import BreakdownChart from '../components/BreakdownChart';
import { fetchUserProfile, fetchUserRepos } from '../services/githubService';
import { calculateScore } from '../services/scoringService';
import { generateAIInsights } from '../services/geminiService';
import { AnalysisResult } from '../types';

const ResultPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loadingStatus, setLoadingStatus] = useState('Fetching profile...');

  useEffect(() => {
    const analyze = async () => {
      if (!username) return;
      try {
        setLoading(true);
        setLoadingStatus('Handshaking with GitHub...');
        const user = await fetchUserProfile(username);
        
        setLoadingStatus('Downloading Repository Metadata...');
        const repos = await fetchUserRepos(username);
        
        setLoadingStatus('Running Heuristic Audit...');
        const score = await calculateScore(user, repos);
        
        setLoadingStatus('Gemini AI Generating Final Report...');
        const insights = await generateAIInsights(user, repos, score);

        const languages: Record<string, number> = {};
        repos.forEach(r => {
          if (r.language) languages[r.language] = (languages[r.language] || 0) + 1;
        });

        setResult({
          user,
          score,
          insights,
          languages,
          topRepos: repos.slice(0, 5)
        });
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'The GitHub API is currently restricted or user not found.');
        setLoading(false);
      }
    };

    analyze();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0d1117]">
        <div className="relative w-24 h-24 mb-8">
           <div className="absolute inset-0 border-4 border-blue-600/20 rounded-full"></div>
           <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-3xl font-black text-white mb-2 tracking-tight">Analyzing {username}</h2>
        <p className="text-blue-400 font-bold text-sm tracking-widest uppercase animate-pulse">{loadingStatus}</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#0d1117]">
        <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mb-6">
           <span className="text-4xl">⚠️</span>
        </div>
        <h2 className="text-3xl font-black text-white mb-2">Audit Failed</h2>
        <p className="text-gray-400 mb-8 max-w-sm text-center font-medium leading-relaxed">{error}</p>
        <Link to="/" className="bg-white text-black px-10 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95">
          Try Again
        </Link>
      </div>
    );
  }

  const { user, score, insights, topRepos } = result;

  const verdictColor = {
    'Hire Ready': 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    'Improving': 'text-yellow-400 bg-yellow-950/40 border-yellow-500/30',
    'Weak': 'text-red-400 bg-red-950/40 border-red-500/30'
  }[insights.verdict] || 'text-gray-400';

  return (
    <div className="flex flex-col min-h-screen pb-20">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto px-4 py-10 w-full space-y-8">
        
        {/* Profile Card */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-[#161b22] border border-gray-800 p-8 md:p-12 rounded-[2rem] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-600/10 transition-colors"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
            <img 
              src={user.avatar_url} 
              alt={user.login} 
              className="w-32 h-32 rounded-3xl border-2 border-gray-700 shadow-2xl transition-transform hover:scale-105"
            />
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-2">{user.name || user.login}</h1>
              <p className="text-blue-500 font-bold mb-4 tracking-tight">github.com/{user.login}</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs font-bold text-gray-300">📦 {user.public_repos} REPOS</span>
                <span className="px-3 py-1 bg-gray-800 rounded-full text-xs font-bold text-gray-300">👥 {user.followers} FOLLOWERS</span>
                {user.blog && <a href={user.blog} className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full text-xs font-bold hover:bg-blue-800/40 transition">PORTFOLIO →</a>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-10 bg-[#0d1117]/80 backdrop-blur-sm p-6 md:p-10 rounded-3xl border border-gray-800 shadow-xl relative z-10">
             <div className="text-center md:text-right space-y-2">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Recruiter Verdict</p>
                <div className={`px-4 py-2 rounded-xl border text-xl font-black inline-block ${verdictColor}`}>
                  {insights.verdict.toUpperCase()}
                </div>
             </div>
             <div className="h-20 w-[1px] bg-gray-800 hidden md:block"></div>
             <ScoreCircle score={score.overall} />
          </div>
        </div>

        {/* Audit Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#161b22] border border-gray-800 p-8 rounded-[2rem] shadow-xl">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl font-black text-white">Diagnostic Metrics</h3>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Confidence: High</span>
              </div>
              <BreakdownChart breakdown={score.breakdown} />
              <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(score.breakdown).map(([key, val]) => (
                  <div key={key} className="p-5 bg-[#0d1117] rounded-2xl border border-gray-800 hover:border-blue-500/50 transition-colors">
                    <p className="text-[10px] uppercase font-black text-gray-600 mb-1">{key.replace(/([A-Z])/g, ' $1')}</p>
                    <p className="text-2xl font-black text-white">{(val as number).toFixed(1)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#1a202c] to-[#161b22] border border-blue-900/20 p-8 md:p-12 rounded-[2rem] shadow-xl relative group">
              <div className="absolute top-8 right-8 text-blue-500/10 text-9xl font-black pointer-events-none group-hover:text-blue-500/20 transition-colors">"</div>
              <h3 className="text-lg font-black text-blue-400 mb-6 tracking-widest uppercase">The Recruiter's Perspective</h3>
              <p className="text-2xl md:text-3xl text-white leading-tight font-bold tracking-tight">
                {insights.summary}
              </p>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                <span className="flex-1 h-[2px] bg-gray-800"></span>
                Analyzed Projects
                <span className="flex-1 h-[2px] bg-gray-800"></span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {topRepos.map(repo => (
                  <div key={repo.name} className="bg-[#161b22] border border-gray-800 p-8 rounded-3xl hover:border-blue-500/40 transition-all hover:-translate-y-1 shadow-lg shadow-black/20">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-black text-white truncate max-w-[180px]">{repo.name}</h4>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400 font-black">
                        <span className="bg-gray-800 px-2 py-1 rounded">⭐ {repo.stargazers_count}</span>
                        <span className="bg-gray-800 px-2 py-1 rounded">🍴 {repo.forks_count}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 line-clamp-2 mb-6 h-10 font-medium leading-relaxed">
                      {repo.description || 'Professional baseline implementation.'}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                      <span className="px-3 py-1 bg-blue-900/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{repo.language || 'DATA'}</span>
                      <span className="text-[10px] text-gray-500 font-bold">{new Date(repo.pushed_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-[#0f1419] border border-emerald-900/30 p-8 rounded-[2rem]">
              <h3 className="text-lg font-black text-emerald-400 mb-6 tracking-widest uppercase flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                Competitive Strengths
              </h3>
              <div className="space-y-5">
                {insights.strengths.map((s, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 text-emerald-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </div>
                    <p className="text-sm text-gray-300 font-medium leading-relaxed">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#0f1419] border border-red-900/30 p-8 rounded-[2rem]">
              <h3 className="text-lg font-black text-red-400 mb-6 tracking-widest uppercase flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                Recruiter Red Flags
              </h3>
              <div className="space-y-5">
                {insights.redFlags.map((rf, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="mt-1 text-red-500">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line><circle cx="12" cy="12" r="10"></circle></svg>
                    </div>
                    <p className="text-sm text-gray-300 font-medium leading-relaxed">{rf}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actionable Portfolio Roadmaps */}
            <div className="bg-[#161b22] border border-gray-800 p-8 rounded-[2rem] shadow-2xl overflow-hidden">
              <h3 className="text-xl font-black text-white mb-8 tracking-tight">Portfolio Roadmaps</h3>
              <div className="space-y-8 mb-10">
                {insights.improvements.map((imp, i) => (
                  <div key={i} className="flex items-start gap-5 group">
                    <div className="w-8 h-8 rounded-lg bg-gray-800/50 border border-gray-700 flex-shrink-0 flex items-center justify-center group-hover:bg-blue-600/20 group-hover:border-blue-500/50 transition-all">
                      <span className="text-xs text-white font-black">{i + 1}</span>
                    </div>
                    <p className="text-[13px] text-gray-400 font-medium leading-relaxed group-hover:text-gray-200 transition-colors">{imp}</p>
                  </div>
                ))}
              </div>
              <div className="relative group">
                <div className="absolute -inset-1 bg-blue-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <button className="relative w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-xl active:scale-95">
                  DOWNLOAD AUDIT PDF
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Global Action Footer */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-10 md:p-14 rounded-[3rem] flex flex-col lg:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="text-center lg:text-left relative z-10 space-y-4">
            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">Elevate Your Hiring Score by +35%</h2>
            <p className="text-blue-100/80 font-medium text-lg max-w-xl">Get the Premium AI Audit including real-time Pull Request feedback and automated documentation refactoring.</p>
          </div>
          <button className="px-12 py-6 bg-white text-blue-600 font-black text-xl rounded-2xl hover:scale-105 transition-all shadow-2xl active:scale-95 whitespace-nowrap relative z-10">
            UNLOCK PREMIUM AUDIT
          </button>
        </div>

      </main>
    </div>
  );
};

export default ResultPage;
