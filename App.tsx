
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import ResultPage from './pages/ResultPage';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen gradient-bg flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/analyze/:username" element={<ResultPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
