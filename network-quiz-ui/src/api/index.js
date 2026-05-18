import defaultQuestions from '../data/questions.json';

// Initialize localStorage if empty or sync new explanations
const getStoredQuestions = () => {
    const stored = localStorage.getItem('quiz_questions');
    if (!stored) {
        localStorage.setItem('quiz_questions', JSON.stringify(defaultQuestions));
        return defaultQuestions;
    }
    const parsed = JSON.parse(stored);
    
    // Check if we need to sync new explanations from defaultQuestions
    let updated = false;
    const migrated = parsed.map(pq => {
        const dq = defaultQuestions.find(d => d.id === pq.id);
        if (dq && dq.explanation && !pq.explanation) {
            updated = true;
            return { ...pq, explanation: dq.explanation };
        }
        return pq;
    });
    
    if (updated) {
        localStorage.setItem('quiz_questions', JSON.stringify(migrated));
        return migrated;
    }
    
    return parsed;
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
    
    // Load exam settings for answer shuffling
    const storedSettings = localStorage.getItem('quiz_exam_settings');
    const examSettings = storedSettings ? JSON.parse(storedSettings) : {};
    
    for (let i = 1; i <= 13; i++) {
        // Generate deterministic exam using exam ID as seed
        const shuffled = shuffleWithSeed(allQuestions, i * 1000);
        const examQuestions = [];
        let index = 0;
        
        const shouldShuffleAnswers = examSettings[i]?.shuffleAnswers || false;
        
        for (let j = 0; j < 40; j++) {
            if (index >= shuffled.length) {
                index = 0; // Wrap around if not enough questions
            }
            
            let q = { ...shuffled[index] };
            
            // If shuffleAnswers is enabled, shuffle the options for this question
            if (shouldShuffleAnswers && q.options && q.options.length > 0) {
                // Find original correct option text
                const correctOpt = q.options.find(o => o.label === q.correct_answer);
                const correctText = correctOpt ? correctOpt.text : null;
                
                // Shuffle options deterministically based on exam ID and question ID
                const shuffledOpts = shuffleWithSeed(q.options, i * 2000 + q.id);
                
                // Re-label to A, B, C, D...
                const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
                const newOptions = shuffledOpts.map((opt, optIdx) => ({
                    ...opt,
                    label: labels[optIdx] || String.fromCharCode(65 + optIdx)
                }));
                
                // Find new correct answer label corresponding to the original correct option text
                let newCorrectAnswer = q.correct_answer;
                if (correctText) {
                    const newCorrectOpt = newOptions.find(o => o.text === correctText);
                    if (newCorrectOpt) {
                        newCorrectAnswer = newCorrectOpt.label;
                    }
                }
                
                q.options = newOptions;
                q.correct_answer = newCorrectAnswer;
            }
            
            examQuestions.push(q);
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
