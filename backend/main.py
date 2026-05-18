import json
import random
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from . import models
from .database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Network Quiz API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class OptionSchema(BaseModel):
    label: str
    text: str

class QuestionSchema(BaseModel):
    id: Optional[int] = None
    original_id: Optional[str] = None
    chapter: Optional[str] = None
    content: str
    options: List[OptionSchema]
    correct_answer: Optional[str] = None

@app.get("/api/questions", response_model=List[QuestionSchema])
def get_questions(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    questions = db.query(models.Question).offset(skip).limit(limit).all()
    res = []
    for q in questions:
        res.append({
            "id": q.id,
            "original_id": q.original_id,
            "chapter": q.chapter,
            "content": q.content,
            "options": json.loads(q.options_json),
            "correct_answer": q.correct_answer
        })
    return res

@app.post("/api/questions")
def create_question(q: QuestionSchema, db: Session = Depends(get_db)):
    db_question = models.Question(
        original_id=q.original_id,
        chapter=q.chapter,
        content=q.content,
        options_json=json.dumps([o.dict() for o in q.options], ensure_ascii=False),
        correct_answer=q.correct_answer
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return {"status": "ok", "id": db_question.id}

@app.put("/api/questions/{question_id}")
def update_question(question_id: int, q: QuestionSchema, db: Session = Depends(get_db)):
    db_q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_q:
        raise HTTPException(status_code=404, detail="Question not found")
    
    db_q.content = q.content
    db_q.options_json = json.dumps([o.dict() for o in q.options], ensure_ascii=False)
    db_q.correct_answer = q.correct_answer
    
    db.commit()
    return {"status": "ok"}

@app.delete("/api/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db)):
    db_q = db.query(models.Question).filter(models.Question.id == question_id).first()
    if not db_q:
        raise HTTPException(status_code=404, detail="Question not found")
    db.delete(db_q)
    db.commit()
    return {"status": "ok"}

@app.get("/api/exams/generate")
def generate_exams(db: Session = Depends(get_db)):
    # Get all questions
    all_questions = db.query(models.Question).all()
    
    # Shuffle and pick for 13 exams, 40 questions each
    # If not enough, reuse some
    import copy
    shuffled = copy.deepcopy(all_questions)
    random.shuffle(shuffled)
    
    exams = []
    index = 0
    total_q = len(shuffled)
    
    for i in range(13):
        exam_questions = []
        for _ in range(40):
            if index >= total_q:
                index = 0
                random.shuffle(shuffled)
            
            q = shuffled[index]
            exam_questions.append({
                "id": q.id,
                "original_id": q.original_id,
                "content": q.content,
                "options": json.loads(q.options_json),
                "correct_answer": q.correct_answer
            })
            index += 1
        
        exams.append({
            "id": i + 1,
            "name": f"Đề {i + 1}",
            "questions": exam_questions
        })
        
    return exams

@app.get("/api/questions/duplicates")
def get_duplicates(db: Session = Depends(get_db)):
    # Simple duplicate detection by content
    questions = db.query(models.Question).all()
    seen = {}
    duplicates = []
    
    for q in questions:
        # normalize content
        norm = " ".join(q.content.split()).lower()
        if norm in seen:
            seen[norm].append(q)
        else:
            seen[norm] = [q]
            
    for norm, qs in seen.items():
        if len(qs) > 1:
            duplicates.append([{
                "id": q.id,
                "content": q.content,
                "options": json.loads(q.options_json),
                "correct_answer": q.correct_answer
            } for q in qs])
            
    return duplicates
