import React, { useEffect, useState } from 'react';
import { getExams } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Home() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchExams = async () => {
            try {
                // If exams exist in local storage for this session, use them
                const stored = sessionStorage.getItem('exams');
                if (stored) {
                    setExams(JSON.parse(stored));
                    setLoading(false);
                    return;
                }
                const data = await getExams();
                setExams(data);
                sessionStorage.setItem('exams', JSON.stringify(data));
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    if (loading) return <div className="text-center mt-20 text-xl font-semibold">Đang tải danh sách đề...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-4xl font-bold text-center text-blue-600 mb-10">Ôn tập Mạng Máy Tính</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {exams.map((exam) => (
                    <div 
                        key={exam.id} 
                        className="bg-white rounded-2xl shadow-md p-6 hover:shadow-xl hover:-translate-y-1 transition duration-300 cursor-pointer border border-gray-100"
                        onClick={() => navigate(`/exam/${exam.id}`)}
                    >
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl mb-4">
                            {exam.id}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{exam.name}</h2>
                        <p className="text-gray-500 mb-4">{exam.questions?.length} câu hỏi</p>
                        <button className="w-full bg-blue-600 text-white font-medium py-2 rounded-lg hover:bg-blue-700 transition">
                            Làm bài
                        </button>
                    </div>
                ))}
            </div>
            
            <div className="mt-16 text-center">
                <button 
                    onClick={() => navigate('/admin')}
                    className="text-gray-500 hover:text-blue-600 underline font-medium"
                >
                    Đến trang Quản trị (Thêm/Sửa câu hỏi)
                </button>
            </div>
        </div>
    );
}
