import defaultQuestions from '../data/questions.json';

// Initialize localStorage if empty
const getStoredQuestions = () => {
    const stored = localStorage.getItem('quiz_questions');
    if (!stored) {
        localStorage.setItem('quiz_questions', JSON.stringify(defaultQuestions));
        return defaultQuestions;
    }
    return JSON.parse(stored);
};

const saveQuestions = (questions) => {
    localStorage.setItem('quiz_questions', JSON.stringify(questions));
};

// Seeded random shuffle helper to keep exams stable
const shuffleWithSeed = (array, seed) => {
    let copy = [...array];
    let m = copy.length, t, i;
    let seedValue = seed;
    let rand = () => {
        var x = Math.sin(seedValue++) * 10000;
        return x - Math.floor(x);
    };
    while (m) {
        i = Math.floor(rand() * m--);
        t = copy[m];
        copy[m] = copy[i];
        copy[i] = t;
    }
    return copy;
};

export const getExams = async () => {
    const allQuestions = getStoredQuestions();
    const exams = [];
    
    for (let i = 1; i <= 13; i++) {
        // Generate deterministic exam using exam ID as seed
        const shuffled = shuffleWithSeed(allQuestions, i * 1000);
        const examQuestions = [];
        let index = 0;
        
        for (let j = 0; j < 40; j++) {
            if (index >= shuffled.length) {
                index = 0; // Wrap around if not enough questions
            }
            examQuestions.push(shuffled[index]);
            index++;
        }
        
        exams.push({
            id: i,
            name: `Đề ${i}`,
            questions: examQuestions
        });
    }
    
    return exams;
};

export const getQuestions = async () => {
    return getStoredQuestions();
};

export const createQuestion = async (data) => {
    const questions = getStoredQuestions();
    const newId = questions.length > 0 ? Math.max(...questions.map(q => q.id)) + 1 : 1;
    const newQuestion = {
        ...data,
        id: newId,
        original_id: `Câu hỏi số: ${String(newId).padStart(3, '0')}`
    };
    questions.push(newQuestion);
    saveQuestions(questions);
    return { status: 'ok', id: newId };
};

export const updateQuestion = async (id, data) => {
    const questions = getStoredQuestions();
    const index = questions.findIndex(q => q.id === Number(id));
    if (index !== -1) {
        questions[index] = { ...questions[index], ...data };
        saveQuestions(questions);
        return { status: 'ok' };
    }
    throw new Error('Question not found');
};

export const deleteQuestion = async (id) => {
    const questions = getStoredQuestions();
    const filtered = questions.filter(q => q.id !== Number(id));
    saveQuestions(filtered);
    return { status: 'ok' };
};

export const getDuplicates = async () => {
    const questions = getStoredQuestions();
    const seen = {};
    const duplicates = [];
    
    questions.forEach(q => {
        const norm = q.content.replace(/\s+/g, ' ').trim().toLowerCase();
        if (seen[norm]) {
            seen[norm].push(q);
        } else {
            seen[norm] = [q];
        }
    });
    
    Object.keys(seen).forEach(key => {
        if (seen[key].length > 1) {
            duplicates.push(seen[key]);
        }
    });
    
    return duplicates;
};
