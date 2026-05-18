import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Exam from './pages/Exam';
import Admin from './pages/Admin';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-black text-blue-600 tracking-tight">NetQuiz Pro</h1>
            <nav className="space-x-6">
              <a href="/" className="text-gray-600 hover:text-blue-600 font-medium transition">Trang chủ</a>
              <a href="/admin" className="text-gray-600 hover:text-blue-600 font-medium transition">Quản trị</a>
            </nav>
          </div>
        </header>

        <main className="pt-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/exam/:id" element={<Exam />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
