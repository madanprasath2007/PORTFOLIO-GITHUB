
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';

const Home: React.FC = () => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      let username = '';
      const input = url.trim();

      if (!input) {
        throw new Error('Please enter a GitHub username or profile URL');
      }

      // Handle full URL strings or just handles
      if (input.includes('github.com/')) {
        // Extract username from URL like https://github.com/username or github.com/username/repo
        const pathPart = input.split('github.com/')[1];
        if (pathPart) {
          // Take the first segment, remove trailing slashes/query params
          username = pathPart.split('/')[0].split('?')[0].split('#')[0].trim();
        }
      } else {
        // Assume input is the handle directly
        username = input.split('/')[0].trim();
      }

      if (!username) {
        throw new Error('Could not extract a valid GitHub username');
      }

      navigate(`/analyze/${username}`);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center px-4 -mt-10 mb-20">
        <div className="max-w-4xl w-full text-center space-y-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/30 border border-blue-500/30 text-blue-400 text-xs font-bold tracking-widest uppercase">
              ✨ 2025 AI-Powered Recruitment Audit
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
              Verify Your <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Portfolio Alpha</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto font-medium">
              Join 50,000+ engineers using real-time GitHub diagnostics to land roles at top-tier tech firms.
            </p>
          </div>

          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto w-full group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex flex-col md:flex-row gap-2 bg-[#0d1117] p-2.5 rounded-3xl border border-gray-800 shadow-2xl">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="GitHub Profile URL or Username"
                className="flex-1 bg-transparent px-6 py-5 text-white placeholder-gray-500 focus:outline-none text-xl font-medium"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-black px-10 py-5 rounded-2xl transition-all active:scale-95 shadow-xl shadow-blue-900/30 flex items-center justify-center gap-3"
              >
                <span>Audit Now</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
              </button>
            </div>
            {error && <p className="absolute -bottom-10 left-0 right-0 text-red-400 text-sm font-semibold">{error}</p>}
          </form>

          <div className="flex flex-wrap items-center justify-center gap-12 pt-16 grayscale opacity-40 hover:grayscale-0 hover:opacity-80 transition-all duration-700">
            <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" className="h-8 invert" alt="GitHub" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Git-logo.svg" className="h-6" alt="Git" />
            <span className="text-white font-black text-2xl tracking-tighter">STRIPE</span>
            <span className="text-white font-black text-2xl tracking-tighter">VERCEL</span>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-900 text-center text-gray-600 text-xs font-medium uppercase tracking-widest">
        Proprietary Scoring Engine v4.2.0 • Data via GitHub REST v3
      </footer>
    </div>
  );
};

export default Home;
