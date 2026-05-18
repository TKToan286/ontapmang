from sqlalchemy import Column, Integer, String, Text
from .database import Base

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    original_id = Column(String, index=True)
    chapter = Column(String)
    content = Column(Text)
    options_json = Column(Text)  # Storing options as JSON string
    correct_answer = Column(String)
