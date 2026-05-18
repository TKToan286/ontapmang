import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bot, Sparkles, Send, RefreshCw, AlertCircle, MessageSquare, MoreVertical, AlertTriangle } from 'lucide-react';

export default function Exam() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    
    // AI interactive follow-up chat states
    const [chatMessages, setChatMessages] = useState({}); // { [questionId]: [{ role, content }] }
    const [chatLoading, setChatLoading] = useState({}); // { [questionId]: boolean }
    const [followUpInputs, setFollowUpInputs] = useState({}); // { [questionId]: string }
    const [activeMenuId, setActiveMenuId] = useState(null); // tracking which 3-dots reported menu is open

    useEffect(() => {
        const stored = sessionStorage.getItem('exams');
        if (stored) {
            const exams = JSON.parse(stored);
            const current = exams.find(e => e.id === parseInt(id));
            if (current) setExam(current);
            else navigate('/');
        } else {
            navigate('/');
        }
    }, [id, navigate]);

    const handleAskAI = async (e, q) => {
        e.preventDefault();
        const userText = followUpInputs[q.id]?.trim();
        if (!userText) return;
        
        // Clear input
        setFollowUpInputs(prev => ({ ...prev, [q.id]: '' }));
        
        // Append user message
        const currentMessages = chatMessages[q.id] || [];
        const newMessages = [...currentMessages, { role: 'user', content: userText }];
        setChatMessages(prev => ({ ...prev, [q.id]: newMessages }));
        setChatLoading(prev => ({ ...prev, [q.id]: true }));
        
        try {
            const systemPrompt = "Bạn là chuyên gia giảng dạy mạng máy tính. Hãy trả lời câu hỏi phụ của người dùng một cách ngắn gọn, chính xác và dễ hiểu liên quan đến câu hỏi gốc và giải thích gốc.";
            const apiMessages = [
                { role: 'system', content: systemPrompt },
                { 
                    role: 'user', 
                    content: `Câu hỏi gốc: ${q.content}\nCác đáp án:\n${q.options.map(o => `${o.label}: ${o.text}`).join('\n')}\nĐáp án đúng: ${q.correct_answer}\nGiải thích gốc: ${q.explanation || 'Chưa có giải thích sẵn.'}` 
                },
                ...newMessages
            ];
            
            const response = await fetch('https://api.gaugauai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-NtyQXerBlZhF4Tw8mHlbS6Cy2ODBMoFridMj0Ngqr6KMetOx'
                },
                body: JSON.stringify({
                    model: 'gpt-5.5',
                    messages: apiMessages
                })
            });
            
            const data = response.ok ? await response.json() : null;
            const aiText = data?.choices?.[0]?.message?.content || 'Lỗi xử lý phản hồi từ AI.';
            
            setChatMessages(prev => ({ 
                ...prev, 
                [q.id]: [...newMessages, { role: 'assistant', content: aiText }] 
            }));
        } catch (err) {
            console.error(err);
            setChatMessages(prev => ({ 
                ...prev, 
                [q.id]: [...newMessages, { role: 'assistant', content: 'Lỗi kết nối tới AI. Vui lòng thử lại!' }] 
            }));
        } finally {
            setChatLoading(prev => ({ ...prev, [q.id]: false }));
        }
    };

    const handleReportQuestion = async (questionId) => {
        try {
            // 1. Update main localStorage database
            const storedQ = localStorage.getItem('quiz_questions');
            if (storedQ) {
                const parsedQ = JSON.parse(storedQ);
                const qIndex = parsedQ.findIndex(q => q.id === questionId);
                if (qIndex !== -1) {
                    parsedQ[qIndex].isReported = true;
                    parsedQ[qIndex].reportReason = "Người dùng báo cáo lỗi";
                    localStorage.setItem('quiz_questions', JSON.stringify(parsedQ));
                }
            }

            // 2. Update active exam in sessionStorage
            const storedExams = sessionStorage.getItem('exams');
            if (storedExams) {
                const exams = JSON.parse(storedExams);
                const currentExam = exams.find(e => e.id === parseInt(id));
                if (currentExam) {
                    const examQ = currentExam.questions.find(q => q.id === questionId);
                    if (examQ) {
                        examQ.isReported = true;
                        examQ.reportReason = "Người dùng báo cáo lỗi";
                        sessionStorage.setItem('exams', JSON.stringify(exams));
                        setExam({ ...currentExam });
                    }
                }
            }

            setActiveMenuId(null);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSelect = (questionId, optionLabel) => {
        if (answers[questionId]) return; // lock answer if already selected
        setAnswers({ ...answers, [questionId]: optionLabel });
    };

    const handleSubmit = () => {
        let correctCount = 0;
        exam.questions.forEach(q => {
            if (answers[q.id] === q.correct_answer) {
                correctCount++;
            }
        });
        setScore(correctCount);
        setSubmitted(true);
        window.scrollTo(0, 0);
    };

    if (!exam) return <div className="text-center mt-20 text-xl font-semibold">Đang tải đề thi...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate('/')} className="text-gray-500 hover:text-blue-600 font-medium">
                    &larr; Quay lại
                </button>
                <h1 className="text-3xl font-bold text-gray-800">{exam.name}</h1>
                <div className="w-20"></div>
            </div>

            {submitted && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-6 rounded-xl relative mb-8 text-center shadow-sm">
                    <strong className="font-bold text-2xl block mb-2">Kết quả bài thi</strong>
                    <span className="block sm:inline text-xl">Bạn trả lời đúng <strong>{score} / {exam.questions.length}</strong> câu hỏi.</span>
                </div>
            )}

            <div className="space-y-8">
                {exam.questions.map((q, index) => {
                    const isCorrect = answers[q.id] === q.correct_answer;
                    const isAnswered = answers[q.id] !== undefined;
                    
                    return (
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative">
                            {/* 3-dots Reporting Menu */}
                            <div className="absolute top-4 right-4 z-10">
                                {q.isReported ? (
                                    <span className="flex items-center gap-1 text-xs font-extrabold text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full shadow-sm">
                                        <AlertTriangle className="w-3.5 h-3.5 text-red-500 animate-pulse" />
                                        <span>Đã báo cáo lỗi</span>
                                    </span>
                                ) : (
                                    <div className="relative">
                                        <button
                                            onClick={() => setActiveMenuId(activeMenuId === q.id ? null : q.id)}
                                            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-slate-100 transition duration-200"
                                            title="Tùy chọn câu hỏi"
                                        >
                                            <MoreVertical className="w-5 h-5" />
                                        </button>
                                        
                                        {activeMenuId === q.id && (
                                            <div className="absolute right-0 mt-1 w-36 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-20 animate-in fade-in slide-in-from-top-1 duration-150">
                                                <button
                                                    onClick={() => handleReportQuestion(q.id)}
                                                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition flex items-center gap-1.5"
                                                >
                                                    <AlertTriangle className="w-3.5 h-3.5" />
                                                    <span>Báo cáo câu hỏi</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <h3 className="text-lg font-semibold text-gray-800 mb-4 whitespace-pre-wrap pr-24">
                                <span className="text-blue-600 mr-2">Câu {index + 1}:</span>
                                {q.content}
                            </h3>
                            <div className="space-y-3">
                                {q.options.map((opt) => {
                                    const isSelected = answers[q.id] === opt.label;
                                    const isActuallyCorrect = q.correct_answer === opt.label;
                                    
                                    let btnClass = "w-full text-left p-4 rounded-xl border transition-colors duration-200 ";
                                    
                                    if (!isAnswered && !submitted) {
                                        btnClass += "border-gray-200 hover:bg-gray-50 hover:border-gray-300";
                                    } else {
                                        if (isActuallyCorrect && (isAnswered || submitted)) {
                                            btnClass += "border-green-500 bg-green-50 text-green-800 font-medium";
                                        } else if (isSelected && !isActuallyCorrect) {
                                            btnClass += "border-red-500 bg-red-50 text-red-800";
                                        } else {
                                            btnClass += "border-gray-200 opacity-50";
                                        }
                                    }

                                    return (
                                        <button
                                            key={opt.label}
                                            onClick={() => handleSelect(q.id, opt.label)}
                                            disabled={isAnswered || submitted}
                                            className={btnClass}
                                        >
                                            <span className="font-bold mr-3">{opt.label}.</span>
                                            {opt.text}
                                        </button>
                                    );
                                })}
                            </div>
                            
                            {isAnswered && (
                                <div className="mt-5 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 transition-all duration-300">
                                    <div className="flex items-center gap-2 mb-3 font-extrabold text-blue-600">
                                        <Bot className="w-5 h-5 text-blue-500 animate-pulse" />
                                        <span>AI Giải Thích & Hướng Dẫn:</span>
                                    </div>
                                    {q.explanation ? (
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{q.explanation}</p>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-xl border border-amber-100 font-medium">
                                            <AlertCircle className="w-4 h-4 text-amber-500" />
                                            <span>Chưa có giải thích sẵn cho câu hỏi này trong hệ thống. Bạn có thể sử dụng khung chat dưới đây để hỏi AI giải đáp trực tiếp!</span>
                                        </div>
                                    )}
                                    
                                    {/* Chat Hỏi Thêm AI */}
                                    <div className="mt-5 pt-4 border-t border-slate-200">
                                        <div className="flex items-center gap-1.5 mb-3">
                                            <MessageSquare className="w-4 h-4 text-blue-500" />
                                            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hỏi thêm AI về câu hỏi này:</h4>
                                        </div>
                                        
                                        {/* Khung chat tin nhắn */}
                                        {chatMessages[q.id] && chatMessages[q.id].length > 0 && (
                                            <div className="space-y-3 max-h-60 overflow-y-auto mb-4 p-3 bg-white rounded-xl border border-gray-150 shadow-inner">
                                                {chatMessages[q.id].map((msg, idx) => (
                                                    <div 
                                                        key={idx} 
                                                        className={`flex flex-col max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                                                            msg.role === 'user' 
                                                                ? 'bg-blue-600 text-white ml-auto rounded-tr-none' 
                                                                : 'bg-slate-100 text-gray-800 mr-auto rounded-tl-none border border-slate-200'
                                                        }`}
                                                    >
                                                        <span className="text-[10px] font-extrabold opacity-75 uppercase tracking-wider mb-0.5">
                                                            {msg.role === 'user' ? 'Bạn' : '🤖 AI Trợ lý'}
                                                        </span>
                                                        <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                                                    </div>
                                                ))}
                                                {chatLoading[q.id] && (
                                                    <div className="bg-slate-100 text-gray-800 mr-auto max-w-[85%] rounded-2xl rounded-tl-none border border-slate-200 px-4 py-3 text-sm flex items-center gap-2">
                                                        <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                                                        <span className="text-xs text-gray-500 font-medium">AI đang suy nghĩ và gõ câu trả lời...</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        
                                        {/* Form gửi câu hỏi */}
                                        <form onSubmit={(e) => handleAskAI(e, q)} className="flex gap-2">
                                            <input 
                                                type="text" 
                                                placeholder="Đặt câu hỏi chi tiết... (Ví dụ: Tại sao câu C lại sai?)" 
                                                className="flex-1 text-sm bg-white border border-gray-300 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition shadow-sm"
                                                value={followUpInputs[q.id] || ''}
                                                onChange={(e) => setFollowUpInputs({ ...followUpInputs, [q.id]: e.target.value })}
                                                disabled={chatLoading[q.id]}
                                            />
                                            <button 
                                                type="submit" 
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                                disabled={!followUpInputs[q.id]?.trim() || chatLoading[q.id]}
                                            >
                                                <Send className="w-4 h-4" />
                                                <span>Gửi</span>
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {submitted && !q.correct_answer && (
                                <p className="mt-3 text-sm text-yellow-600">Câu hỏi này chưa được cài đặt đáp án đúng trong hệ thống.</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {!submitted && (
                <div className="mt-10 text-center">
                    <button 
                        onClick={handleSubmit}
                        className="bg-blue-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 shadow-md transition duration-300 transform hover:-translate-y-1"
                    >
                        Nộp bài
                    </button>
                </div>
            )}
            
            {submitted && (
                <div className="mt-10 text-center">
                    <button 
                        onClick={() => navigate('/')}
                        className="bg-gray-800 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-gray-900 shadow-md transition duration-300"
                    >
                        Về trang chủ
                    </button>
                </div>
            )}
        </div>
    );
}
