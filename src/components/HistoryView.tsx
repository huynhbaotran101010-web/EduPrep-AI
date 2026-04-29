import { useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Calendar, 
  ChevronRight, 
  TrendingUp,
  FileText
} from 'lucide-react';
import { useHistory, Attempt } from '../lib/useHistory';
import ReactMarkdown from 'react-markdown';

export default function HistoryView() {
  const { attempts, fetchHistory, loading } = useHistory();

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading && attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Đang tải lịch sử...</p>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="bg-white border border-slate-200 p-20 rounded-3xl text-center space-y-4">
        <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto">
          <Calendar size={32} />
        </div>
        <h3 className="text-lg font-bold text-slate-800">Chưa có bài luyện tập nào</h3>
        <p className="text-slate-500 text-sm max-w-xs mx-auto">Bắt đầu luyện tập để theo dõi tiến độ và nhận phân tích từ AI.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-slate-800">Lịch sử luyện tập</h1>
        <p className="text-slate-500 text-sm">Theo dõi sự tiến bộ và xem lại các báo cáo chi tiết.</p>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {attempts.map((attempt) => (
          <motion.div
            key={attempt.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-all"
          >
            <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                   attempt.percentage >= 80 ? 'bg-emerald-50 text-emerald-600' :
                   attempt.percentage >= 50 ? 'bg-indigo-50 text-indigo-600' :
                   'bg-rose-50 text-rose-600'
                 }`}>
                   {attempt.percentage}%
                 </div>
                 <div>
                   <h3 className="text-base font-bold text-slate-800">Bài luyện tập ngày {attempt.completedAt.toLocaleDateString()}</h3>
                   <div className="flex items-center gap-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      <span className="flex items-center gap-1"><Trophy size={12} className="text-amber-400" /> {attempt.score}đ</span>
                      <span className="flex items-center gap-1"><FileText size={12} /> {attempt.totalQuestions} câu</span>
                   </div>
                 </div>
              </div>

              <div className="flex items-center gap-3">
                 <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-slate-100 transition-colors">
                    Chi tiết
                 </button>
                 <ChevronRight size={18} className="text-slate-300 group-hover:text-slate-400 transition-colors" />
              </div>
            </div>

            {attempt.analysis && (
              <div className="px-6 pb-6 border-t border-slate-50 mt-2 pt-6">
                <div className="flex items-center gap-2 mb-3 text-indigo-600 font-bold text-[10px] uppercase tracking-widest">
                  <TrendingUp size={14} />
                  <span>AI Insight & Strategy</span>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl max-h-[200px] overflow-y-auto">
                   <div className="markdown-body text-xs text-slate-600 leading-relaxed">
                     <ReactMarkdown>{attempt.analysis}</ReactMarkdown>
                   </div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
