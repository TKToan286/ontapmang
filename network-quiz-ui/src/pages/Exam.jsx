import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function Exam() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

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
                        <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4 whitespace-pre-wrap">
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
