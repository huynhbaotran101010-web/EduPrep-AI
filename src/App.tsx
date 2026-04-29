import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Brain, 
  BarChart3, 
  MessageSquare, 
  Upload, 
  Settings,
  Menu,
  X,
  GraduationCap,
  LogIn,
  LogOut,
  Sparkles
} from 'lucide-react';
import ExamMode from './components/ExamMode';
import VocabularyHome from './components/VocabularyHome';
import Dashboard from './components/Dashboard';
import HistoryView from './components/HistoryView';
import ChatBot from './components/ChatBot';
import { useAuth } from './lib/AuthContext';

type View = 'dashboard' | 'exam' | 'vocabulary' | 'analytics';

export default function App() {
  const { user, loading, signIn, signOut } = useAuth();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Bảng điều khiển', icon: BarChart3 },
    { id: 'exam', label: 'Luyện đề AI', icon: BookOpen },
    { id: 'vocabulary', label: 'Từ vựng (SRS)', icon: Brain },
    { id: 'analytics', label: 'Lịch sử & Báo cáo', icon: BarChart3 },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-black font-bold text-2xl flex items-center gap-3"
        >
          <GraduationCap size={32} />
          EduPrep AI
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-8"
        >
          <div className="w-20 h-20 bg-black text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl">
            <GraduationCap size={44} />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Chào mừng tới EduPrep AI</h1>
            <p className="text-[#86868B] text-lg leading-relaxed">
              Ứng dụng luyện thi thông minh giúp bạn tối ưu hóa việc học đề và ghi nhớ từ vựng.
            </p>
          </div>
          <button
            onClick={signIn}
            className="w-full flex items-center justify-center gap-3 bg-black text-white p-4 rounded-2xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10"
          >
            <LogIn size={24} />
            Tiếp tục với Google
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 72 }}
        className="bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 z-40 overflow-hidden"
      >
        <div className="p-5 flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
            E
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="font-bold text-lg tracking-tight text-slate-800"
            >
              EduPrep AI
            </motion.span>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as View)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-all duration-200 ${
                activeView === item.id 
                ? 'bg-indigo-50 text-indigo-700 font-semibold' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon size={18} className="shrink-0" />
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="whitespace-nowrap text-sm"
                >
                  {item.label}
                </motion.span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100 space-y-1">
          <button 
            onClick={signOut}
            className="w-full flex items-center gap-3 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
          >
            <LogOut size={18} className="shrink-0" />
            {isSidebarOpen && <span>Đăng xuất</span>}
          </button>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-full flex items-center gap-3 p-2 text-slate-400 hover:text-slate-900 transition-colors text-sm"
          >
            {isSidebarOpen ? <X size={18} /> : <Menu size={18} />}
            {isSidebarOpen && <span>Thu gọn</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-slate-800 text-base">
              {navItems.find(i => i.id === activeView)?.label}
            </h2>
            {activeView === 'exam' && (
              <span className="hidden md:inline-block px-2 py-0.5 bg-slate-100 text-slate-500 text-[10px] font-bold rounded uppercase tracking-wider">
                Practice Mode Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors rounded-md hover:bg-slate-50">
              <Settings size={18} />
            </button>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs shadow-sm">
              {user.displayName?.[0] || 'U'}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="max-w-6xl mx-auto w-full h-full"
            >
              {activeView === 'dashboard' && <Dashboard onStartExam={() => setActiveView('exam')} />}
              {activeView === 'exam' && <ExamMode />}
              {activeView === 'vocabulary' && <VocabularyHome />}
              {activeView === 'analytics' && <HistoryView />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating Chat Trigger */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="fixed bottom-10 right-6 w-14 h-14 bg-slate-900 text-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] flex items-center justify-center hover:bg-indigo-600 active:scale-95 transition-all z-50 group border border-white/10"
        >
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-bounce shadow-sm"></div>
          {isChatOpen ? (
            <X size={24} className="animate-in spin-in-90 duration-300" />
          ) : (
            <Sparkles size={24} className="group-hover:scale-110 transition-transform" />
          )}
          <span className="absolute right-full mr-4 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 whitespace-nowrap pointer-events-none shadow-xl border border-white/5">
            EduPrep AI Coach
          </span>
        </button>

        {/* Status Bar */}
        <div className="h-8 bg-slate-800 flex items-center px-6 text-white text-[10px] font-medium shrink-0">
          <span className="opacity-60">Status:</span>
          <div className="flex gap-4 ml-4">
            <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1 rounded border border-slate-600">Space</kbd> AI Explanation</span>
            <span className="flex items-center gap-1"><kbd className="bg-slate-700 px-1 rounded border border-slate-600">H</kbd> Save Vocab</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="opacity-80">AI Insight Ready</span>
          </div>
        </div>
      </main>

      {/* ChatBot Overlay */}
      <AnimatePresence>
        {isChatOpen && <ChatBot onClose={() => setIsChatOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
