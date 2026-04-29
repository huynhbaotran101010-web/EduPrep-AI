import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
const MODEL_NAME = "gemini-3-flash-preview";

/**
 * Checks if the API key is present and throws a clear error if not.
 */
function checkConfig() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
}

export async function processExamFile(file: File) {
  checkConfig();
  const fileData = await fileToGenerativePart(file);

  const prompt = `
    Bạn là một chuyên gia luyện thi ngôn ngữ (IELTS, TOEIC, THPT Quốc gia). 
    Hãy phân tích đề thi trong file đính kèm và trích xuất tối đa 40 câu hỏi.

    YÊU CẦU CỰC KỲ QUAN TRỌNG VỀ NỘI DUNG:
    1. Text của câu hỏi (field "text"): PHẢI bao gồm đầy đủ ngữ cảnh. 
       - Với câu đơn: Bao gồm cả câu văn hoàn chỉnh chứa chỗ trống/phần gạch chân. 
       - Với bài đọc: Bao gồm đoạn văn (passage) liên quan trực tiếp đến câu hỏi đó. 
       - KHÔNG ĐƯỢC chỉ để mỗi yêu cầu kiểu "Chọn đáp án đúng".
    2. Giải thích (field "explanation"): PHẢI là một báo cáo chi tiết theo format sau:
       - [Đáp án đúng]: Giải thích tại sao đúng (ngữ pháp, từ vựng, logic).
       - [Phân tích chi tiết các phương án sai]: 
         + Giải thích cặn kẽ tại sao từng phương án A, B, C, D (ngoại trừ đáp án đúng) lại sai. Sai ở đâu? (Sai thì, sai loại từ, bẫy ngữ nghĩa, v.v.)
       - [Bẫy & Lưu ý]: Chỉ rõ bẫy (nếu có) và mẹo để không mắc phải lần sau.

    Trả về kết quả dưới dạng JSON array:
    [
      {
        "id": "unique_id",
        "text": "Câu văn/Đoạn văn hoàn chỉnh + Câu hỏi cụ thể",
        "options": ["A", "B", "C", "D"],
        "correctAnswer": "Phải khớp hoàn toàn với 1 option",
        "explanation": "Nội dung giải thích chi tiết theo format đã yêu cầu bên trên",
        "category": "Dạng bài"
      }
    ]
    Chỉ trả về JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { 
        parts: [ 
          { text: prompt }, 
          { inlineData: fileData } 
        ] 
      }
    });

    const text = response.text || "";
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Failed to process exam file:", error);
    throw error;
  }
}

export async function analyzeAttempt(results: any[], questions: any[]) {
  checkConfig();
  const correctCount = results.filter(r => r.isCorrect).length;
  const totalCount = questions.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  const prompt = `
    Bạn là một chuyên gia phân tích dữ liệu luyện thi IELTS/Toeic.
    Kết quả thực tế của học sinh (CHỈ DỰA VÀO DỮ LIỆU NÀY): 
    - Tổng điểm: ${percentage}% (${correctCount}/${totalCount} câu đúng).
    - Chi tiết từng câu: ${JSON.stringify(results.map((r, i) => ({ 
        qNum: i + 1, 
        isCorrect: r.isCorrect, 
        category: r.category,
        text: questions.find(q => q.id === r.questionId)?.text.substring(0, 50) + "..."
      })))}

    YÊU CẦU NGHIÊM NGẶT:
    1. KHÔNG ĐƯỢC bịa đặt thông tin không có trong dữ liệu (ví dụ: không nói về 'Phát âm' nếu trong dữ liệu chỉ có 'Grammar').
    2. Phân tích cụ thể lỗi sai dựa trên danh sách kết quả trên.
    3. Đưa ra lời khuyên thiết thực để khắc phục chính xác các lỗi sai đó.
    4. Cấu trúc báo cáo Markdown: [Nhận xét tổng quan] -> [Phân tích lỗi sai cụ thể] -> [Lộ trình cải thiện].
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [{ text: prompt }] }
    });
    return response.text || "Không thể tải phân tích lúc này.";
  } catch (error) {
    console.error("Analysis error:", error);
    return "Đã có lỗi xảy ra khi phân tích kết quả.";
  }
}

export async function getWordDefinition(word: string, context?: string) {
  checkConfig();
  const prompt = `
    Bạn là một từ điển thông minh AI. Hãy cung cấp thông tin cho từ: "${word}"
    ${context ? `Ngữ cảnh sử dụng trong câu: "${context}"` : ""}

    Trả về kết quả dưới dạng JSON object:
    {
      "word": "${word}",
      "phonetic": "phiên âm quốc tế IPA",
      "definition": "Nghĩa tiếng Việt ngắn gọn, dễ hiểu",
      "example": "Ví dụ minh họa thực tế",
      "synonyms": ["đồng nghĩa 1", "đồng nghĩa 2"]
    }
    Chỉ trả về JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });
    const text = response.text || "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch (error) {
    console.error("Word definition error:", error);
    return null;
  }
}

export async function getWeeklyInsight(history: any[]) {
  if (!history || history.length === 0) {
    return "Hãy bắt đầu luyện tập để EduPrep AI có thể phân tích và đưa ra lời khuyên chính xác cho bạn.";
  }
  checkConfig();

  const prompt = `
    Bạn là trợ lý học tập. Dựa TRỰC TIẾP trên lịch sử luyện tập thực tế sau: ${JSON.stringify(history)}
    YÊU CẦU:
    1. Nhận xét về sự thay đổi điểm số qua các ngày (nếu có).
    2. Đưa ra 1 lời khuyên ngắn gọn (tối đa 40 từ) tập trung vào cải thiện kết quả.
    3. NẾU DỮ LIỆU QUÁ ÍT (chỉ có 1-2 bài), hãy khuyến khích làm thêm bài để có phân tích sâu hơn.
    4. TUYỆT ĐỐI KHÔNG BIẠ ĐẶT thành tích hoặc lịch sử không có trong dữ liệu.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: { parts: [{ text: prompt }] }
    });
    return response.text || "Hãy tiếp tục cố gắng! Bạn đang đi đúng hướng.";
  } catch (error) {
    return "Hãy tiếp tục cố gắng! Bạn đang đi đúng hướng.";
  }
}

export async function askAssistant(question: string, context?: string) {
  checkConfig();
  const prompt = `
    Bạn là trợ lý học tập EduPrep AI.
    Học sinh đang hỏi: "${question}"
    ${context ? `Riêng về ngữ cảnh này: ${context}` : ""}
    Hãy giải thích một cách dễ hiểu, thân thiện và khuyến khích học sinh.
    Sử dụng Markdown để trình bày đẹp mắt.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt
    });
    return response.text || "Xin lỗi, tôi không thể trả lời lúc này.";
  } catch (error) {
    console.error("Assistant error:", error);
    return "Đã có lỗi xảy ra khi kết nối với trợ lý AI. Vui lòng thử lại sau.";
  }
}

async function fileToGenerativePart(file: File): Promise<{ data: string, mimeType: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        data: base64Data,
        mimeType: file.type
      });
    };
    reader.readAsDataURL(file);
  });
}
