import React, { useEffect, useState } from 'react';
import { getQuestions, updateQuestion, getDuplicates, deleteQuestion } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Admin() {
    const [questions, setQuestions] = useState([]);
    const [duplicates, setDuplicates] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'duplicates' | 'exams'
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [examSettings, setExamSettings] = useState({});
    const navigate = useNavigate();

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 25;

    // Reset pagination on viewMode change
    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode]);

    // Load exam settings from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem('quiz_exam_settings');
        if (stored) {
            setExamSettings(JSON.parse(stored));
        }
    }, []);

    const handleToggleShuffle = (examId, checked) => {
        const updated = {
            ...examSettings,
            [examId]: {
                ...examSettings[examId],
                shuffleAnswers: checked
            }
        };
        setExamSettings(updated);
        localStorage.setItem('quiz_exam_settings', JSON.stringify(updated));
        // Clear sessionStorage to force immediate regeneration
        sessionStorage.removeItem('exams');
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === '123' && password === '123') {
            setIsAuthenticated(true);
            sessionStorage.setItem('adminAuth', 'true');
            fetchData();
        } else {
            alert('Sai tài khoản hoặc mật khẩu!');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [qRes, dRes] = await Promise.all([getQuestions(), getDuplicates()]);
            setQuestions(qRes);
            setDuplicates(dRes);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (sessionStorage.getItem('adminAuth') === 'true') {
            setIsAuthenticated(true);
            fetchData();
        }
    }, []);

    const handleSave = async (id, updatedData) => {
        try {
            // Automatically clear reported flags on edit!
            const cleanData = { 
                ...updatedData, 
                isReported: false, 
                reportReason: undefined 
            };
            await updateQuestion(id, cleanData);
            setEditing(null);
            fetchData();
        } catch (err) {
            alert('Lỗi cập nhật');
        }
    };

    const handleClearReport = async (id) => {
        try {
            const question = questions.find(q => q.id === id);
            if (question) {
                await updateQuestion(id, { ...question, isReported: false, reportReason: undefined });
                fetchData();
                alert('Đã bỏ cờ báo cáo câu hỏi!');
            }
        } catch (err) {
            alert('Lỗi khi bỏ báo cáo');
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
            try {
                await deleteQuestion(id);
                fetchData();
            } catch (err) {
                alert('Lỗi khi xóa');
            }
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-md border border-gray-100">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Đăng nhập Quản trị</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Tài khoản</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Mật khẩu</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" required />
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition">Đăng nhập</button>
                    <button type="button" onClick={() => navigate('/')} className="w-full text-gray-500 py-2 hover:text-gray-700 underline text-sm mt-2">Quay lại Trang chủ</button>
                </form>
            </div>
        );
    }

    if (loading) return <div className="text-center mt-20 text-xl font-semibold">Đang tải dữ liệu...</div>;

    const reportedQuestions = questions.filter(q => q.isReported);
    const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE);
    const displayedQuestions = questions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const getPageNumbers = () => {
        const pages = [];
        const start = Math.max(1, currentPage - 2);
        const end = Math.min(totalPages, currentPage + 2);
        
        if (start > 1) {
            pages.push(1);
            if (start > 2) pages.push('...');
        }
        
        for (let i = start; i <= end; i++) {
            pages.push(i);
        }
        
        if (end < totalPages) {
            if (end < totalPages - 1) pages.push('...');
            pages.push(totalPages);
        }
        
        return pages;
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => navigate('/')} className="text-gray-500 hover:text-blue-600 font-medium">&larr; Quay lại Home</button>
                <div className="flex items-center gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">Quản trị Câu Hỏi</h1>
                    <button onClick={() => { setIsAuthenticated(false); sessionStorage.removeItem('adminAuth'); }} className="text-sm bg-red-100 text-red-600 px-3 py-1 rounded-lg font-medium hover:bg-red-200">Đăng xuất</button>
                </div>
                <div className="flex gap-4">
                    <button 
                        className={`px-4 py-2 rounded-lg font-medium transition ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setViewMode('list')}
                    >
                        Tất cả ({questions.length})
                    </button>
                    <button 
                        className={`px-4 py-2 rounded-lg font-medium transition ${viewMode === 'duplicates' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setViewMode('duplicates')}
                    >
                        Lọc Trùng ({duplicates.length} nhóm)
                    </button>
                    <button 
                        className={`px-4 py-2 rounded-lg font-medium transition ${viewMode === 'exams' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
                        onClick={() => setViewMode('exams')}
                    >
                        Cấu hình Đề (13 đề)
                    </button>
                    <button 
                        className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-1.5 ${viewMode === 'reports' ? 'bg-red-600 text-white shadow-md shadow-red-200' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                        onClick={() => setViewMode('reports')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                        <span>Báo cáo ({reportedQuestions.length})</span>
                    </button>
                </div>
            </div>

            {viewMode === 'exams' && (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-md">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-blue-100 text-blue-600 p-2.5 rounded-xl">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sliders-horizontal"><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="12" x2="12" y1="18" y2="22"/></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Cấu hình Đề thi</h2>
                            <p className="text-sm text-gray-500">Bật/tắt tính năng xáo trộn đáp án độc lập cho từng đề ôn tập</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 13 }, (_, i) => i + 1).map((examId) => {
                            const isShuffled = examSettings[examId]?.shuffleAnswers || false;
                            return (
                                <div key={examId} className="border border-gray-150 rounded-2xl p-5 bg-slate-50 hover:bg-white hover:border-blue-200 hover:shadow-lg transition duration-300 flex flex-col justify-between group">
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">Đề thi số</span>
                                            <span className="text-xs font-semibold text-gray-400">40 câu hỏi</span>
                                        </div>
                                        <h3 className="font-extrabold text-xl text-gray-800 group-hover:text-blue-600 transition">Đề {examId}</h3>
                                        <p className="text-xs text-gray-500 mt-1">Hạt giống xáo trộn: {examId * 1000}</p>
                                    </div>
                                    
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <span className="text-sm font-bold text-gray-700">Xáo trộn đáp án:</span>
                                        <label className="relative inline-flex items-center cursor-pointer select-none">
                                            <input 
                                                type="checkbox" 
                                                checked={isShuffled} 
                                                onChange={(e) => handleToggleShuffle(examId, e.target.checked)}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                        </label>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {viewMode === 'duplicates' && (
                <div className="space-y-8">
                    {duplicates.length === 0 ? (
                        <p className="text-center text-gray-500 mt-10 text-xl">Tuyệt vời, không có câu hỏi nào bị trùng lặp nội dung!</p>
                    ) : (
                        duplicates.map((group, idx) => (
                            <div key={idx} className="bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
                                <h3 className="font-bold text-red-700 mb-4 text-lg border-b border-red-200 pb-2">Nhóm trùng lặp #{idx + 1}</h3>
                                <div className="grid grid-cols-1 gap-4">
                                    {group.map((q) => (
                                        <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-400 mb-1">ID: {q.id}</p>
                                                <p className="font-medium text-gray-800 whitespace-pre-wrap">{q.content}</p>
                                            </div>
                                            <div className="flex-shrink-0 flex items-center">
                                                <button 
                                                    onClick={() => handleDelete(q.id)}
                                                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                                                >
                                                    Xóa câu này
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {viewMode === 'reports' && (
                <div className="space-y-6">
                    <div className="bg-red-50 p-6 rounded-3xl border border-red-150 shadow-sm mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 text-red-600 p-2.5 rounded-2xl animate-pulse">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-alert"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="17"/></svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-extrabold text-red-800">Câu hỏi bị báo cáo lỗi ({reportedQuestions.length})</h2>
                                <p className="text-xs text-red-600 mt-0.5">Danh sách các câu hỏi do học viên gắn cờ báo lỗi nội dung hoặc đáp án trong quá trình làm bài ôn tập.</p>
                            </div>
                        </div>
                    </div>

                    {reportedQuestions.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 shadow-sm">
                            <p className="text-gray-400 font-extrabold text-lg mb-1">🎉 Tuyệt vời! Không có câu hỏi nào bị báo cáo lỗi.</p>
                            <p className="text-xs text-gray-400">Tất cả các câu hỏi trong hệ thống đang được học viên đánh giá tốt.</p>
                        </div>
                    ) : (
                        reportedQuestions.map((q) => (
                            <div key={q.id} className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500"></div>
                                {editing === q.id ? (
                                    <EditForm question={q} onSave={(data) => handleSave(q.id, data)} onCancel={() => setEditing(null)} />
                                ) : (
                                    <div>
                                        <div className="flex justify-between items-start mb-4 gap-4">
                                            <h3 className="text-lg font-bold text-gray-800 whitespace-pre-wrap flex-1">{q.content}</h3>
                                            <div className="flex-shrink-0 flex gap-2">
                                                <button onClick={() => setEditing(q.id)} className="text-blue-600 hover:text-blue-700 px-3.5 py-1.5 bg-blue-50 rounded-xl text-xs font-bold transition">Sửa</button>
                                                <button onClick={() => handleClearReport(q.id)} className="text-green-600 hover:text-green-700 px-3.5 py-1.5 bg-green-50 rounded-xl text-xs font-bold transition">Bỏ qua báo cáo</button>
                                                <button onClick={() => handleDelete(q.id)} className="text-red-600 hover:text-red-700 px-3.5 py-1.5 bg-red-50 rounded-xl text-xs font-bold transition">Xóa</button>
                                            </div>
                                        </div>
                                        
                                        <div className="bg-red-50/50 border border-red-100/50 p-4 rounded-2xl text-xs font-bold text-red-800 mb-4 flex items-start gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-alert-triangle text-red-500 flex-shrink-0 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>
                                            <div>
                                                <span className="text-red-600 block uppercase tracking-wider text-[10px] mb-0.5">Lý do báo cáo:</span>
                                                <span className="font-extrabold text-sm">{q.reportReason || 'Người dùng báo cáo lỗi'}</span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {q.options.map(opt => (
                                                <div key={opt.label} className={`p-3 rounded-xl border ${q.correct_answer === opt.label ? 'border-green-500 bg-green-50 text-green-800 font-medium' : 'border-gray-200 text-gray-600'}`}>
                                                    <span className="font-bold mr-2">{opt.label}.</span>
                                                    {opt.text}
                                                </div>
                                            ))}
                                        </div>

                                        {q.explanation && (
                                            <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-sm text-gray-600 leading-relaxed">
                                                <span className="font-extrabold text-blue-700 block mb-1">💡 Giải thích từ AI:</span>
                                                {q.explanation}
                                            </div>
                                        )}
                                        {!q.correct_answer && <p className="text-yellow-600 text-sm mt-3 font-medium">⚠ Chưa có đáp án đúng</p>}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {viewMode === 'list' && (
                <div className="space-y-6">
                    {displayedQuestions.map((q) => (
                        <div key={q.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            {editing === q.id ? (
                                <EditForm question={q} onSave={(data) => handleSave(q.id, data)} onCancel={() => setEditing(null)} />
                            ) : (
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="text-lg font-medium text-gray-800 whitespace-pre-wrap flex-1">{q.content}</h3>
                                        <div className="ml-4 flex gap-2">
                                            <button onClick={() => setEditing(q.id)} className="text-blue-500 hover:text-blue-700 px-3 py-1 bg-blue-50 rounded-lg text-sm font-medium">Sửa</button>
                                            <button onClick={() => handleDelete(q.id)} className="text-red-500 hover:text-red-700 px-3 py-1 bg-red-50 rounded-lg text-sm font-medium">Xóa</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                        {q.options.map(opt => (
                                            <div key={opt.label} className={`p-3 rounded-xl border ${q.correct_answer === opt.label ? 'border-green-500 bg-green-50 text-green-800 font-medium' : 'border-gray-200 text-gray-600'}`}>
                                                <span className="font-bold mr-2">{opt.label}.</span>
                                                {opt.text}
                                            </div>
                                        ))}
                                    </div>
                                    {q.explanation && (
                                        <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50 text-sm text-gray-600 leading-relaxed">
                                            <span className="font-extrabold text-blue-700 block mb-1">💡 Giải thích từ AI:</span>
                                            {q.explanation}
                                        </div>
                                    )}
                                    {!q.correct_answer && <p className="text-yellow-600 text-sm mt-3 font-medium">⚠ Chưa có đáp án đúng</p>}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-gray-200">
                            <span className="text-sm font-semibold text-gray-500">
                                Hiển thị <span className="text-gray-800 font-extrabold">{Math.min(questions.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}-{Math.min(questions.length, currentPage * ITEMS_PER_PAGE)}</span> trong tổng số <span className="text-blue-600 font-extrabold">{questions.length}</span> câu hỏi
                            </span>
                            
                            <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-gray-150 shadow-sm">
                                <button
                                    onClick={() => {
                                        setCurrentPage(prev => Math.max(1, prev - 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-slate-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Trang trước"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6"/></svg>
                                </button>
                                
                                {getPageNumbers().map((p, idx) => {
                                    if (p === '...') {
                                        return <span key={`dots-${idx}`} className="px-3 py-2 text-gray-400 font-bold select-none">...</span>;
                                    }
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => {
                                                setCurrentPage(p);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className={`w-10 h-10 rounded-xl font-bold text-sm transition-all duration-200 ${
                                                currentPage === p 
                                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                                                    : 'text-gray-600 hover:bg-slate-50 hover:text-blue-600'
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}
                                
                                <button
                                    onClick={() => {
                                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl text-gray-500 hover:text-blue-600 hover:bg-slate-50 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Trang sau"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6"/></svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function EditForm({ question, onSave, onCancel }) {
    const [content, setContent] = useState(question.content);
    const [options, setOptions] = useState(question.options || []);
    const [correctAnswer, setCorrectAnswer] = useState(question.correct_answer || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...question,
            content,
            options,
            correct_answer: correctAnswer
        });
    };

    const updateOption = (index, text) => {
        const newOpts = [...options];
        newOpts[index].text = text;
        setOptions(newOpts);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Nội dung câu hỏi</label>
                <textarea 
                    className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                    rows="3"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            </div>
            <div className="grid grid-cols-1 gap-3">
                <label className="block text-sm font-bold text-gray-700">Các đáp án</label>
                {options.map((opt, i) => (
                    <div key={i} className="flex gap-3 items-center">
                        <span className="font-bold text-gray-600 w-6">{opt.label}.</span>
                        <input 
                            className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={opt.text}
                            onChange={(e) => updateOption(i, e.target.value)}
                        />
                        <button 
                            type="button"
                            onClick={() => setCorrectAnswer(opt.label)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${correctAnswer === opt.label ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {correctAnswer === opt.label ? '✔ Đáp án đúng' : 'Đặt làm Đ.A'}
                        </button>
                    </div>
                ))}
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                <button type="button" onClick={onCancel} className="px-5 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium transition">Hủy</button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl font-medium transition shadow-sm">Lưu Thay Đổi</button>
            </div>
        </form>
    );
}
