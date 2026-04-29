import { useState, useRef } from 'react';
import { Upload, File } from 'lucide-react';
import { motion } from 'motion/react';
import { processExamFile } from '../lib/gemini';

interface FileUploaderProps {
  onComplete: (questions: any[]) => void;
}

export default function FileUploader({ onComplete }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setIsUploading(true);
        setError(null);
        const questions = await processExamFile(file);
        onComplete(questions);
      } catch (err) {
        console.error(err);
        setError('Có lỗi xảy ra khi xử lý file. Vui lòng thử lại.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="w-full max-w-xl">
      {!isUploading ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-[#E5E5E7] rounded-[32px] p-12 flex flex-col items-center gap-6 cursor-pointer hover:border-black hover:bg-gray-50 transition-all group"
        >
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-black group-hover:text-white transition-all">
            <Upload size={32} />
          </div>
          <div className="text-center">
            <p className="text-xl font-bold">Thả đề thi vào đây</p>
            <p className="text-[#86868B]">Hoặc nhấp để chọn file (PDF, PNG, JPG)</p>
          </div>
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".pdf,image/*"
          />
        </div>
      ) : (
        <div className="bg-white border border-[#E5E5E7] rounded-[32px] p-12 space-y-8 flex flex-col items-center">
          <div className="relative w-24 h-24 flex items-center justify-center">
             <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 border-4 border-[#F2F2F7] border-t-black rounded-full"
             />
             <File size={32} className="text-black" />
          </div>
          <div className="text-center space-y-2">
            <p className="text-xl font-bold">AI đang xử lý đề thi...</p>
            <p className="text-[#86868B]">Việc này có thể mất 1-2 phút tùy vào độ dài của đề.</p>
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
        </div>
      )}
    </div>
  );
}
