import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  MoreVertical,
  GraduationCap,
  Eye,
  RotateCcw,
  Check,
  X,
  Volume2
} from 'lucide-react';
import { useVocab, Word } from '../lib/useVocab';

export default function VocabularyHome() {
  const [activeTab, setActiveTab] = useState<'list' | 'study'>('list');
  const { words, loading, updateWordSrs } = useVocab();
  const [studyIdx, setStudyIdx] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);

  const dueWords = useMemo(() => {
    const now = new Date();
    return words.filter(w => {
      if (!w.nextReview?.toDate) return true;
      return w.nextReview.toDate() <= now;
    });
  }, [words]);

  const handleStudyRating = async (rating: number) => {
    const word = dueWords[studyIdx];
    await updateWordSrs(word.id, rating);
    setShowDefinition(false);
    if (studyIdx < dueWords.length - 1) {
      setStudyIdx(studyIdx + 1);
    } else {
      setStudyIdx(0);
      setActiveTab('list');
    }
  };

  if (loading && words.length === 0) {
    return <div className="p-12 text-center text-slate-400 font-bold text-sm uppercase tracking-widest flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      Đang tải từ vựng...
    </div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Sổ tay thông minh</h1>
          <p className="text-slate-500 text-sm">Quản lý lộ trình ghi nhớ Spaced Repetition (SRS)</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 bg-white text-slate-600 px-4 py-2 rounded-lg font-bold border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm text-[10px] uppercase tracking-wider">
            <Search size={14} />
            <span>Tìm kiếm</span>
          </button>
          <button className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100 text-[10px] uppercase tracking-wider">
            <Plus size={14} />
            <span>Thêm từ mới</span>
          </button>
        </div>
      </header>

      <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('list')}
          className={`px-6 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Danh sách từ ({words.length})
        </button>
        <button 
          onClick={() => {
            setActiveTab('study');
            setStudyIdx(0);
            setShowDefinition(false);
          }}
          className={`px-6 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'study' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
        >
          Ôn tập ({dueWords.length})
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {words.map((word) => (
              <motion.div
                key={word.id}
                layout
                whileHover={{ y: -2 }}
                className="bg-white border border-slate-200 p-5 rounded-2xl space-y-3 group transition-shadow hover:shadow-md hover:border-indigo-200"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">{word.word}</h3>
                    <div className="flex items-center gap-2">
                       <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border ${
                         word.status === 'learning' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 
                         word.status === 'mastered' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                         'bg-slate-50 text-slate-600 border-slate-200'
                       }`}>
                         {word.status}
                       </span>
                    </div>
                  </div>
                  <button className="p-1 text-slate-400 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all">
                    <MoreVertical size={16} />
                  </button>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">{word.definition}</p>
                {word.example && (
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg italic text-[11px] text-slate-500 leading-normal">
                    "{word.example}"
                  </div>
                )}
                <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-1.5 text-slate-400 text-[9px] font-bold uppercase tracking-tighter">
                      <span>Ôn tập: {word.nextReview?.toDate ? word.nextReview.toDate().toLocaleDateString() : 'Hôm nay'}</span>
                   </div>
                   <div className={`w-1.5 h-1.5 rounded-full ${word.status === 'mastered' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : dueWords.length > 0 ? (
        <div className="max-w-xl mx-auto space-y-8 py-8">
           <div className="flex items-center justify-between px-2">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tiến độ ôn tập</div>
              <div className="text-[10px] font-mono font-bold text-indigo-600">{studyIdx + 1}/{dueWords.length}</div>
           </div>
           
           <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                animate={{ width: `${((studyIdx + 1) / dueWords.length) * 100}%` }}
                className="h-full bg-indigo-600"
              />
           </div>

           <motion.div 
              key={dueWords[studyIdx].id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="bg-white border-2 border-slate-200 p-12 rounded-[32px] shadow-xl text-center space-y-8 min-h-[350px] flex flex-col justify-center relative overflow-hidden"
           >
              <div className="space-y-4 relative z-10">
                <h2 className="text-4xl font-bold text-slate-800 tracking-tight">{dueWords[studyIdx].word}</h2>
                <div className="flex items-center justify-center gap-2 text-slate-400">
                   <button className="p-2 hover:bg-slate-50 rounded-full transition-colors">
                      <Volume2 size={20} />
                   </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {!showDefinition ? (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowDefinition(true)}
                    className="mx-auto flex items-center gap-2 bg-slate-50 text-slate-500 px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200 shadow-sm"
                  >
                    <Eye size={16} />
                    Xem định nghĩa
                  </motion.button>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 relative z-10"
                  >
                    <div className="space-y-2">
                       <p className="text-xl text-indigo-600 font-medium">{dueWords[studyIdx].definition}</p>
                       <p className="text-sm text-slate-500 italic max-w-sm mx-auto">"{dueWords[studyIdx].example}"</p>
                    </div>

                    <div className="pt-8 flex items-center justify-center gap-3">
                       <button onClick={() => handleStudyRating(1)} className="flex-1 max-w-[100px] flex flex-col items-center gap-2 p-3 rounded-2xl bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all">
                          <RotateCcw size={20} />
                          <span className="text-[9px] font-bold uppercase">Quên</span>
                       </button>
                       <button onClick={() => handleStudyRating(3)} className="flex-1 max-w-[100px] flex flex-col items-center gap-2 p-3 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all">
                          <Eye size={20} />
                          <span className="text-[9px] font-bold uppercase">Khó</span>
                       </button>
                       <button onClick={() => handleStudyRating(5)} className="flex-1 max-w-[100px] flex flex-col items-center gap-2 p-3 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all">
                          <Check size={20} />
                          <span className="text-[9px] font-bold uppercase">Dễ</span>
                       </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full -ml-16 -mt-16" />
           </motion.div>
        </div>
      ) : (
        <div className="bg-slate-900 text-white p-12 rounded-3xl flex flex-col items-center justify-center space-y-6 text-center min-h-[400px] relative overflow-hidden shadow-2xl">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 relative z-10">
            <GraduationCap size={32} className="text-indigo-400" />
          </div>
          <div className="space-y-2 max-w-md relative z-10">
            <h2 className="text-2xl font-bold tracking-tight">Sẵn sàng ôn luyện?</h2>
            <p className="text-slate-400 text-sm">Bạn đã hoàn thành tất cả từ vựng cần ôn tập hôm nay. Tuyệt vời!</p>
          </div>
          <button 
            onClick={() => setActiveTab('list')}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm tracking-widest uppercase hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 relative z-10"
          >
            Quay lại danh sách
          </button>
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-50" />
          <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full -ml-32 -mt-32" />
        </div>
      )}
    </div>
  );
}
