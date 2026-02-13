
import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="border-b border-gray-800 bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:bg-blue-500 transition-colors">G</div>
          <span className="text-xl font-bold tracking-tight text-white">Portfolio<span className="text-blue-500 italic"> Roadmaps</span></span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">How it works</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Recruiter Standards</a>
          <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm font-semibold rounded-full text-white transition-colors border border-gray-700">
            Sign In
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
