import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const getExams = async () => {
    const res = await axios.get(`${API_URL}/exams/generate`);
    return res.data;
};

export const getQuestions = async () => {
    const res = await axios.get(`${API_URL}/questions`);
    return res.data;
};

export const createQuestion = async (data) => {
    const res = await axios.post(`${API_URL}/questions`, data);
    return res.data;
};

export const updateQuestion = async (id, data) => {
    const res = await axios.put(`${API_URL}/questions/${id}`, data);
    return res.data;
};

export const deleteQuestion = async (id) => {
    const res = await axios.delete(`${API_URL}/questions/${id}`);
    return res.data;
};

export const getDuplicates = async () => {
    const res = await axios.get(`${API_URL}/questions/duplicates`);
    return res.data;
};
