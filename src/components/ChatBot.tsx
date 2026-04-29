import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, X, Bot, User, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { askAssistant } from '../lib/gemini';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatBot({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Chào bạn! Tôi là trợ lý EduPrep AI. Bạn có thắc mắc gì về đề thi hay từ vựng vừa rồi không?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const lastMessages = messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n');
      const response = await askAssistant(textToSend, lastMessages);
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Rất tiếc, đã có lỗi khi kết nối với AI. Bạn hãy thử lại sau nhé!',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickActions = [
    { label: 'Giải thích ngữ pháp', icon: '📝' },
    { label: 'Dịch câu này', icon: '🌐' },
    { label: 'Mẹo học từ vựng', icon: '💡' },
    { label: 'Kiểm tra phát âm', icon: '🗣️' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 right-6 w-[400px] h-[620px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col border border-slate-200 overflow-hidden z-50 ring-1 ring-slate-100"
    >
      {/* Header */}
      <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full -mr-16 -mt-16" />
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            <Sparkles size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">EduPrep AI Personal</h3>
            <div className="flex items-center gap-2">
               <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
               </div>
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Assistant Online</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-all text-slate-400 hover:text-white relative z-10"
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 pb-2 space-y-6 bg-gradient-to-b from-slate-50/50 to-white"
      >
        <div className="grid grid-cols-2 gap-2 mb-4">
          {quickActions.map((action, i) => (
            <button
              key={i}
              onClick={() => handleSend(action.label)}
              className="p-2.5 text-left bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:border-indigo-400 hover:bg-indigo-50/30 transition-all flex items-center gap-2"
            >
              <span className="text-base leading-none">{action.icon}</span>
              <span className="flex-1 leading-tight">{action.label}</span>
            </button>
          ))}
        </div>

        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div className={`max-w-[85%] flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                msg.role === 'assistant' ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'
              }`}>
                {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
              </div>
              <div className={`p-4 rounded-2xl text-[13px] leading-relaxed font-normal shadow-sm ${
                msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-tr-none' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
              }`}>
                <div className="markdown-body">
                  <ReactMarkdown>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                <div className={`text-[9px] mt-2 opacity-40 font-bold uppercase tracking-widest ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
           <div className="flex justify-start">
             <div className="flex gap-3">
               <div className="w-8 h-8 bg-slate-800 text-white rounded-xl flex items-center justify-center shrink-0">
                 <Bot size={16} />
               </div>
               <div className="bg-white p-3.5 px-5 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm flex items-center gap-1.5">
                 <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                 <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                 <motion.div animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
               </div>
             </div>
           </div>
        )}
      </div>

      {/* Input */}
      <div className="p-5 bg-white border-t border-slate-100">
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-indigo-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all group shadow-inner">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your message..."
            className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 font-medium"
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-slate-900 disabled:opacity-30 transition-all shadow-lg active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
