import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  ChevronRight, 
  XCircle, 
  Info, 
  MessageSquare, 
  Trophy, 
  BarChart, 
  Target, 
  TrendingUp,
  RotateCcw,
  BookOpen,
  Save,
  Plus,
  Loader2
} from 'lucide-react';
import FileUploader from './FileUploader';
import ReactMarkdown from 'react-markdown';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart as ReBarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { analyzeAttempt, getWordDefinition } from '../lib/gemini';
import { useHistory } from '../lib/useHistory';
import { useVocab } from '../lib/useVocab';

interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  category: string;
}

export default function ExamMode() {
  const [examStarted, setExamStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [results, setResults] = useState<{questionId: string, answer: string, isCorrect: boolean, category: string}[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const { saveAttempt } = useHistory();
  const { addWord } = useVocab();

  // Vocab Highlight State
  const [selection, setSelection] = useState<{ text: string, x: number, y: number } | null>(null);
  const [isDefining, setIsDefining] = useState(false);

  const handleUploadComplete = (extractedQuestions: Question[]) => {
    setQuestions(extractedQuestions);
    setExamStarted(true);
    setStartTime(Date.now());
  };

  const handleAnswerSelect = (answer: string) => {
    if (showFeedback) return;
    setSelectedAnswer(answer);
    setShowFeedback(true);
    
    const isCorrect = answer === questions[currentIdx].correctAnswer;
    setResults([...results, {
      questionId: questions[currentIdx].id,
      answer,
      isCorrect,
      category: questions[currentIdx].category
    }]);
  };

  useEffect(() => {
    if (isFinished) {
      if (startTime) {
        const diff = Date.now() - startTime;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setDuration(`${mins}m ${secs}s`);
      }
      if (results.length > 0 && !deepAnalysis && !isAnalyzing) {
        generateAnalysis();
      }
    }
  }, [isFinished]);

  const generateAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeAttempt(results, questions);
      setDeepAnalysis(analysis);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const nextQuestion = () => {
    if (currentIdx === questions.length - 1) {
      setIsFinished(true);
      return;
    }
    setSelectedAnswer(null);
    setShowFeedback(false);
    setCurrentIdx(currentIdx + 1);
  };

  const resetExam = () => {
    setExamStarted(false);
    setCurrentIdx(0);
    setQuestions([]);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setResults([]);
    setIsFinished(false);
    setDeepAnalysis(null);
  };

  const handleSaveReport = async () => {
    const score = results.filter(r => r.isCorrect).length;
    const percentage = Math.round((score / questions.length) * 100);
    
    try {
      await saveAttempt({
        score: score * 0.25,
        totalQuestions: questions.length,
        percentage,
        analysis: deepAnalysis || '',
        results
      });
      alert('Đã lưu báo cáo thành công!');
    } catch (e) {
      alert('Lỗi khi lưu báo cáo.');
    }
  };

  const handleSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 1) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setSelection({
        text: sel.toString().trim(),
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    } else {
      setSelection(null);
    }
  };

  const handleAddVocab = async () => {
    if (!selection) return;
    setIsDefining(true);
    try {
      const definition = await getWordDefinition(selection.text, questions[currentIdx].text);
      if (definition) {
        await addWord({
          word: definition.word || selection.text,
          definition: definition.definition || "Không có định nghĩa",
          example: definition.example || "",
          phonetic: definition.phonetic || ""
        });
        alert(`Đã thêm "${definition.word || selection.text}" vào sổ tay!`);
      } else {
        alert("Không thể lấy định nghĩa cho từ này.");
      }
    } catch (e) {
      console.error(e);
      alert("Lỗi khi thêm từ vựng. Vui lòng thử lại.");
    } finally {
      setIsDefining(false);
      setSelection(null);
    }
  };

  if (!examStarted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 bg-white rounded-3xl border border-slate-200 p-12 shadow-sm">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100">
            <BookOpen size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Luyện đề với AI</h2>
          <p className="text-slate-500 text-sm">Tải lên file đề thi, AI sẽ nhận diện câu hỏi và tạo bài ôn tập cá nhân hóa cho bạn.</p>
        </div>
        <FileUploader onComplete={handleUploadComplete} />
      </div>
    );
  }

  if (isFinished) {
    const score = results.filter(r => r.isCorrect).length;
    const total = questions.length;
    const percentage = Math.round((score / total) * 100);
    const finalScore = (score * 0.25).toFixed(2);

    const categories = Array.from(new Set(questions.map(q => q.category)));
    const categoryStats = categories.map(cat => {
      const catResults = results.filter(r => r.category === cat);
      const catScore = catResults.filter(r => r.isCorrect).length;
      return {
        name: cat,
        score: catScore,
        total: catResults.length,
        percentage: Math.round((catScore / catResults.length) * 100)
      };
    });

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto space-y-8 pb-20"
      >
        <div className="bg-slate-900 text-white rounded-3xl p-8 md:p-12 overflow-hidden relative shadow-xl">
          <div className="relative z-10 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                <Trophy size={28} className="text-amber-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Hoàn thành bài luyện tập!</h2>
                <p className="text-white/50 text-sm">EduPrep AI đã phân tích kết quả của bạn.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                 <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Điểm số</p>
                 <p className="text-xl font-mono font-bold text-indigo-400">{finalScore}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                 <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Tỷ lệ đúng</p>
                 <p className="text-xl font-mono font-bold text-emerald-400">{percentage}%</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                 <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Câu đúng</p>
                 <p className="text-xl font-mono font-bold">{score}/{total}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                 <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">Thời gian</p>
                 <p className="text-xl font-mono font-bold text-slate-300">{duration || "N/A"}</p>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[80px] rounded-full -mr-32 -mt-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <BarChart size={16} className="text-indigo-500" />
              Thống kê dạng bài
            </h3>
            <div className="h-[200px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <ReBarChart data={categoryStats} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} axisLine={false} tickLine={false} style={{ fontSize: '10px', fontWeight: 'bold', fill: '#64748b' }} />
                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px' }} />
                    <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={20}>
                      {categoryStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.percentage > 75 ? '#10b981' : entry.percentage > 50 ? '#6366f1' : '#f43f5e'} />
                      ))}
                    </Bar>
                 </ReBarChart>
               </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Target size={16} className="text-orange-500" />
              Phân tích hiệu suất
            </h3>
            <div className="space-y-3">
              <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                 <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">Điểm mạnh:</p>
                 <p className="text-xs text-emerald-700 leading-relaxed font-medium">
                    Bạn xử lý rất tốt các câu hỏi thuộc dạng bài {categoryStats.sort((a,b) => b.percentage - a.percentage)[0]?.name}. Hãy giữ vững phong độ!
                 </p>
              </div>
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
                 <p className="text-[10px] font-bold text-rose-800 uppercase tracking-wider mb-1">Cần cải thiện:</p>
                 <p className="text-xs text-rose-700 leading-relaxed font-medium">
                    Tỷ lệ đúng phần {categoryStats.sort((a,b) => a.percentage - b.percentage)[0]?.name} còn thấp. AI đề xuất bạn tập trung luyện thêm các bài về dạng này.
                 </p>
              </div>
            </div>
            {isAnalyzing ? (
              <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold animate-pulse">
                <Loader2 size={14} className="animate-spin" />
                <span>AI đang phân tích chiến thuật...</span>
              </div>
            ) : deepAnalysis && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-h-[300px] overflow-y-auto">
                <div className="flex items-center gap-2 mb-2 text-indigo-600 font-bold text-[10px] uppercase tracking-widest">
                  <TrendingUp size={12} />
                  <span>Chiến thuật & Lộ trình AI</span>
                </div>
                <div className="markdown-body text-[11px] leading-relaxed text-slate-600">
                  <ReactMarkdown>{deepAnalysis}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={resetExam}
            className="flex-1 bg-indigo-600 text-white p-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all text-sm"
          >
            <RotateCcw size={18} />
            Luyện đề mới
          </button>
          <button 
            onClick={handleSaveReport}
            className="flex-1 bg-white border border-slate-200 p-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 transition-all text-slate-500 text-sm shadow-sm"
          >
            <Save size={18} />
            Lưu báo cáo chi tiết
          </button>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 mt-2 relative">
      {/* Selection Popup */}
      <AnimatePresence>
        {selection && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            style={{ left: selection.x, top: selection.y, transform: 'translateX(-50%)' }}
            className="fixed z-[100] bg-slate-900 text-white px-3 py-2 rounded-lg shadow-2xl flex items-center gap-3 border border-white/10"
          >
            <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest border-r border-white/10 pr-3">
              "{selection.text}"
            </span>
            <button 
              onClick={handleAddVocab}
              disabled={isDefining}
              className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider hover:text-indigo-400 transition-colors"
            >
              {isDefining ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
              Lưu vào sổ tay
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-white border border-slate-200 p-4 md:p-5 rounded-2xl shadow-sm flex items-center gap-6">
         <div className="flex items-center gap-3 shrink-0">
            <div className="flex -space-x-1">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white">
                {currentIdx + 1}
              </div>
            </div>
            <div className="hidden sm:block">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Đang làm câu</div>
              <div className="text-sm font-mono font-bold text-slate-700 leading-none">{currentIdx + 1}/{questions.length}</div>
            </div>
         </div>
         <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
               className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
            />
         </div>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Header Decor */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-orange-500" />
        
        <div className="p-8 md:p-12 space-y-10">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider border border-indigo-100 ring-1 ring-indigo-500/10">
                Câu hỏi {currentIdx + 1}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-100">
                Lĩnh vực: {currentQuestion.category}
              </span>
            </div>
            
            <div className="relative group bg-slate-50/50 rounded-2xl p-6 md:p-8 border border-slate-100/80">
              <div 
                className="text-lg md:text-xl font-medium leading-[1.6] text-slate-800 selection:bg-indigo-100 selection:text-indigo-900 cursor-text whitespace-pre-wrap font-sans"
                onMouseUp={handleSelection}
              >
                {currentQuestion.text}
              </div>
              
              <div className="absolute -top-3 -left-3">
                <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-lg">
                  <BookOpen size={16} />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-200/50 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <MessageSquare size={12} />
                <span>Bôi đen để tra từ điển</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 bg-slate-100" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Chọn đáp án</span>
              <div className="h-px flex-1 bg-slate-100" />
            </div>
            
            <div className="grid grid-cols-1 gap-3.5">
              {currentQuestion.options.map((option, idx) => {
                const isCorrect = option === currentQuestion.correctAnswer;
                const isSelected = option === selectedAnswer;
                const letter = String.fromCharCode(65 + idx);
                
                let btnClass = "group w-full p-5 md:p-6 rounded-2xl border text-left transition-all flex items-center gap-5 relative overflow-hidden ";
                if (showFeedback) {
                  if (isCorrect) btnClass += "bg-emerald-50 border-emerald-500 text-emerald-900 border-2 shadow-md ring-4 ring-emerald-50 z-10";
                  else if (isSelected) btnClass += "bg-rose-50 border-rose-500 text-rose-900 border-2 ring-4 ring-rose-50 z-10";
                  else btnClass += "border-slate-100 opacity-40 grayscale-[0.5]";
                } else {
                  btnClass += "border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 hover:translate-x-1 bg-white shadow-sm hover:shadow-md";
                }

                return (
                  <button
                    key={idx}
                    disabled={showFeedback}
                    onClick={() => handleAnswerSelect(option)}
                    className={btnClass}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-bold font-mono text-sm transition-colors ${
                      showFeedback 
                        ? (isCorrect ? 'bg-emerald-500 text-white' : isSelected ? 'bg-rose-500 text-white' : 'bg-slate-100 text-slate-400')
                        : 'bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'
                    }`}>
                      {letter}
                    </div>
                    
                    <span className={`flex-1 text-base md:text-lg font-medium transition-all ${
                      showFeedback && isCorrect ? 'text-emerald-900 font-bold' : isSelected ? 'text-rose-900' : 'text-slate-700'
                    }`}>
                      {option}
                    </span>
                    
                    {showFeedback && (
                      <div className="shrink-0 scale-110">
                        {isCorrect ? (
                          <CheckCircle2 className="text-emerald-500" size={24} />
                        ) : isSelected ? (
                          <XCircle className="text-rose-500" size={24} />
                        ) : null}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-10 space-y-6"
              >
                <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[32px] shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[60px] rounded-full -mr-32 -mt-32" />
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/10">
                        <Info size={20} className="text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-widest leading-none mb-1">Giải thích chi tiết</h4>
                        <p className="text-[10px] text-white/40 font-bold uppercase tracking-tight">Cấu trúc & Ngữ pháp bài thi</p>
                      </div>
                    </div>
                    
                    <div className="markdown-body prose prose-invert prose-slate prose-sm max-w-none text-white/80 leading-relaxed">
                      <ReactMarkdown>{currentQuestion.explanation}</ReactMarkdown>
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center gap-6">
                      <button 
                        onClick={() => {}}
                        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors font-bold text-xs uppercase tracking-wider bg-white/5 py-2 px-4 rounded-lg border border-white/5"
                      >
                        <MessageSquare size={14} />
                        <span>Hỏi EduPrep AI thêm</span>
                      </button>
                      
                      <button
                        onClick={nextQuestion}
                        className="w-full sm:w-auto bg-white text-slate-900 px-10 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-100 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.1)] active:scale-95 text-sm uppercase tracking-wider"
                      >
                        {currentIdx === questions.length - 1 ? 'Kết thúc & Xem báo cáo' : 'Câu tiếp theo'}
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
