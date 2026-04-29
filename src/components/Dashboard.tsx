import { motion } from 'motion/react';
import { Upload, BookOpen, Clock, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useHistory } from '../lib/useHistory';
import { useVocab } from '../lib/useVocab';
import { useMemo, useEffect, useState } from 'react';
import { getWeeklyInsight } from '../lib/gemini';

export default function Dashboard({ onStartExam }: { onStartExam: () => void }) {
  const { user } = useAuth();
  const { attempts, fetchHistory, loading: historyLoading } = useHistory();
  const { words } = useVocab();
  const [weeklyInsight, setWeeklyInsight] = useState<string>("Đang phân tích dữ liệu của bạn...");
  const [isInsightLoading, setIsInsightLoading] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  useEffect(() => {
    if (attempts.length > 0 && !isInsightLoading) {
      loadWeeklyInsight();
    } else if (!historyLoading && attempts.length === 0) {
      setWeeklyInsight("Hãy bắt đầu luyện tập để EduPrep AI phân tích năng lực của bạn.");
    }
  }, [attempts, historyLoading]);

  const loadWeeklyInsight = async () => {
    setIsInsightLoading(true);
    try {
      const formattedHistory = attempts.map(a => ({
        score: a.score,
        percentage: a.percentage,
        date: a.completedAt instanceof Date ? a.completedAt.toLocaleDateString() : 'N/A'
      }));
      const insight = await getWeeklyInsight(formattedHistory);
      setWeeklyInsight(insight);
    } catch (error) {
      console.error(error);
      setWeeklyInsight("Có lỗi khi phân tích dữ liệu. Hãy thử lại sau.");
    } finally {
      setIsInsightLoading(false);
    }
  };

  const dueWordsCount = useMemo(() => {
    const now = new Date();
    return words.filter(w => !w.nextReview?.toDate || w.nextReview.toDate() <= now).length;
  }, [words]);

  const stats = useMemo(() => {
    if (attempts.length === 0) return { avg: 0, count: 0 };
    const avg = attempts.reduce((acc, curr) => acc + curr.percentage, 0) / attempts.length;
    return { avg: Math.round(avg), count: attempts.length };
  }, [attempts]);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Chào mừng, {user?.displayName?.split(' ')[0] || 'bạn'}!</h1>
        <p className="text-slate-500 text-sm">Hôm nay bạn muốn học gì?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button
          whileHover={{ y: -2 }}
          onClick={onStartExam}
          className="bg-indigo-600 text-white p-6 rounded-2xl flex flex-col gap-4 text-left shadow-md shadow-indigo-200 transition-all border border-indigo-500"
        >
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <Upload size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base">Tải đề mới</h3>
            <p className="text-indigo-100/70 text-xs mt-1">AI trích xuất tối đa 40 câu trắc nghiệm</p>
          </div>
          <div className="mt-auto flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
            Bắt đầu <ArrowRight size={14} />
          </div>
        </motion.button>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm"
        >
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
            <TrendingUp size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">Hiệu suất trung bình</h3>
            <p className="text-slate-500 text-xs mt-1">{stats.avg}% đúng trên {stats.count} đề</p>
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col gap-4 shadow-sm"
        >
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 border border-amber-100">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-800">Cần ôn từ vựng</h3>
            <p className="text-slate-500 text-xs mt-1">{dueWordsCount} từ đang đợi review (SRS)</p>
          </div>
        </motion.div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between shadow-sm gap-6 overflow-hidden relative">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2 text-indigo-600 font-bold text-xs uppercase tracking-widest">
            <AlertCircle size={14} />
            <span>AI Insight Tuần</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800">Tiến trình luyện tập</h2>
          <p className="text-slate-500 text-sm max-w-lg">
            {isInsightLoading ? "AI đang phân tích..." : weeklyInsight}
          </p>
        </div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="text-right">
             <div className="text-2xl font-mono font-bold text-slate-800">{stats.avg}%</div>
             <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mastery</div>
          </div>
          <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
              <circle cx="32" cy="32" r="28" stroke="#4f46e5" strokeWidth="6" fill="transparent" strokeDasharray={176} strokeDashoffset={176 - (176 * (stats.avg / 100))} strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full -mr-32 -mt-32" />
      </div>
    </div>
  );
}
