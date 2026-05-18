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
            await updateQuestion(id, updatedData);
            setEditing(null);
            fetchData();
        } catch (err) {
            alert('Lỗi cập nhật');
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

            {viewMode === 'list' && (
                <div className="space-y-6">
                    {questions.slice(0, 50).map((q) => (
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
                                    {!q.correct_answer && <p className="text-yellow-600 text-sm mt-3 font-medium">⚠ Chưa có đáp án đúng</p>}
                                </div>
                            )}
                        </div>
                    ))}
                    {questions.length > 50 && <p className="text-center text-gray-500 mt-4">Chỉ hiển thị 50 câu đầu tiên. Tính năng phân trang sẽ được cập nhật thêm.</p>}
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
